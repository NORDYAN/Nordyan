import {
  COACH_FALLBACK_RECOMMENDATION,
  COACH_FOCUS_CANDIDATES,
  type CoachRecommendationCategory,
} from '@/lib/domain/coach-engine';
import type { FocusType } from '@/lib/domain/focus-engine';
import type { HealthSnapshot } from '@/lib/domain/snapshot';
import type { UserProfile } from '@/lib/domain/profile';
import {
  formatDecimal,
  getHealthScoreBandDisplayLabel,
  getLocalizedCoachPresentation,
  getLocalizedFocusPresentation,
  t,
} from '@/lib/i18n';
import { formatCoachMessage } from '@/lib/services/coach/coach.presentation';
import { buildHomeCoachState } from '@/lib/services/coach';
import type { ProductionCoachLanguageSource } from '@/lib/services/coach-language';
import { buildHomePrimaryFocusState } from '@/lib/services/focus';
import {
  canPresentBodyFatEstimate,
  calculateHomeHealthScoreFromProfile,
  formatBodyFatPercent,
  getLocalCalendarDate,
} from '@/lib/services/health-score';

import type { HomeCurrentHealth, HomeCurrentHealthState } from './home-current-health.types';

const FOCUS_TYPES: readonly FocusType[] = [
  'reduce_waist',
  'improve_activity',
  'improve_body_composition',
  'improve_weight_balance',
  'maintain_current_path',
];

function isFocusType(value: string): value is FocusType {
  return (FOCUS_TYPES as readonly string[]).includes(value);
}

function formatWeightKg(weightKg: number): string {
  return t('common.kg', { value: formatDecimal(weightKg) });
}

function resolveCategoryForRecommendationId(
  recommendationId: string,
): CoachRecommendationCategory {
  if (recommendationId === COACH_FALLBACK_RECOMMENDATION.recommendationId) {
    return COACH_FALLBACK_RECOMMENDATION.category;
  }

  for (const candidates of Object.values(COACH_FOCUS_CANDIDATES)) {
    const match = candidates.find((item) => item.recommendationId === recommendationId);
    if (match) {
      return match.category;
    }
  }

  return 'walking';
}

function buildLanguageSourceFromSnapshot(
  snapshot: HealthSnapshot,
  primaryFocus: FocusType,
): ProductionCoachLanguageSource | null {
  const { coachRecommendationId, coachDurationMinutes, coachFrequencyPerWeek } = snapshot;

  if (
    !coachRecommendationId.trim() ||
    coachDurationMinutes == null ||
    coachFrequencyPerWeek == null ||
    coachDurationMinutes <= 0 ||
    coachFrequencyPerWeek <= 0
  ) {
    return null;
  }

  return {
    recommendationId: coachRecommendationId,
    category: resolveCategoryForRecommendationId(coachRecommendationId),
    durationMinutes: coachDurationMinutes,
    frequencyPerWeek: coachFrequencyPerWeek,
    priority: 'medium',
    confidence: 0.7,
    primaryFocus,
  };
}

function buildSnapshotCoachMessage(snapshot: HealthSnapshot): {
  message: string;
  title: string | null;
  recommendationId: string | null;
  availability: 'available' | 'unavailable';
  languageSource: ProductionCoachLanguageSource | null;
} {
  const { coachRecommendationId, coachDurationMinutes, coachFrequencyPerWeek } = snapshot;

  if (
    !coachRecommendationId.trim() ||
    coachDurationMinutes == null ||
    coachFrequencyPerWeek == null ||
    coachDurationMinutes <= 0 ||
    coachFrequencyPerWeek <= 0 ||
    !isFocusType(snapshot.primaryFocus)
  ) {
    return {
      message: t('home.coachUnavailable'),
      title: null,
      recommendationId: coachRecommendationId.trim() ? coachRecommendationId : null,
      availability: 'unavailable',
      languageSource: null,
    };
  }

  const presentation = getLocalizedCoachPresentation(
    coachRecommendationId,
    coachDurationMinutes,
    coachFrequencyPerWeek,
  );

  return {
    message: formatCoachMessage(presentation.description),
    title: presentation.title,
    recommendationId: coachRecommendationId,
    availability: 'available',
    languageSource: buildLanguageSourceFromSnapshot(snapshot, snapshot.primaryFocus),
  };
}

function buildSnapshotBodyFat(snapshot: HealthSnapshot, profile: UserProfile | null): {
  bodyFatPct: number | null;
  bodyFatDisplay: string;
  bodyFatSourceLabel: string;
  bodyFatAvailability: 'available' | 'unavailable';
} {
  const evidence = {
    waistCm: snapshot.waistCm,
    neckCm: snapshot.neckCm,
    hipCm: snapshot.hipCm ?? null,
    snapshotReason: snapshot.snapshotReason,
    bodyFatPct: snapshot.bodyFatPct,
  };

  if (
    !canPresentBodyFatEstimate(profile, evidence) ||
    snapshot.bodyFatPct == null ||
    !Number.isFinite(snapshot.bodyFatPct)
  ) {
    return {
      bodyFatPct: null,
      bodyFatDisplay: '—',
      bodyFatSourceLabel: t('home.bodyFatUnavailable'),
      bodyFatAvailability: 'unavailable',
    };
  }

  return {
    bodyFatPct: snapshot.bodyFatPct,
    bodyFatDisplay: formatBodyFatPercent(snapshot.bodyFatPct),
    bodyFatSourceLabel: t('home.bodyFat.snapshot'),
    bodyFatAvailability: 'available',
  };
}

function buildFromSnapshot(
  snapshot: HealthSnapshot,
  profile: UserProfile | null,
): HomeCurrentHealthState {
  if (!isFocusType(snapshot.primaryFocus)) {
    return {
      status: 'error',
      message: t('home.invalidFocus'),
    };
  }

  const focusPresentation = getLocalizedFocusPresentation(snapshot.primaryFocus);
  const bodyFat = buildSnapshotBodyFat(snapshot, profile);
  const coach = buildSnapshotCoachMessage(snapshot);

  return {
    status: 'ready',
    data: {
      source: 'snapshot',
      snapshotId: snapshot.id,
      snapshotReason: snapshot.snapshotReason,
      capturedAt: snapshot.createdAt,
      healthScore: {
        score: snapshot.overallScore,
        subtitle: getHealthScoreBandDisplayLabel(snapshot.overallScore),
      },
      metrics: {
        weightKg: snapshot.weightKg,
        weightDisplay: formatWeightKg(snapshot.weightKg),
        weightSourceLabel: t('home.weight.snapshot'),
        ...bodyFat,
      },
      focus: {
        primaryFocus: snapshot.primaryFocus,
        title: focusPresentation.title,
        subtitle: focusPresentation.subtitle,
      },
      coach,
    },
  };
}

function buildFromProfileFallback(
  profile: UserProfile,
  asOfDate: string = getLocalCalendarDate(),
): HomeCurrentHealthState {
  const calculated = calculateHomeHealthScoreFromProfile(profile, asOfDate);
  if (!calculated) {
    return { status: 'empty' };
  }

  const healthScoreState = {
    status: 'ready' as const,
    score: calculated.score,
    subtitle: calculated.subtitle,
    input: calculated.input,
    result: calculated.result,
  };

  const primaryFocusState = buildHomePrimaryFocusState(healthScoreState);
  if (primaryFocusState.status !== 'ready') {
    return { status: 'empty' };
  }

  const coachState = buildHomeCoachState(profile, healthScoreState, primaryFocusState);
  if (coachState.status !== 'ready') {
    return { status: 'empty' };
  }

  const focusDisplay = getLocalizedFocusPresentation(primaryFocusState.primaryFocus);
  const coachDisplay = getLocalizedCoachPresentation(
    coachState.recommendationId,
    coachState.result.durationMinutes,
    coachState.result.frequencyPerWeek,
  );
  const bodyFatAvailable = canPresentBodyFatEstimate(profile);

  return {
    status: 'ready',
    data: {
      source: 'profile_fallback',
      healthScore: {
        score: calculated.score,
        subtitle: getHealthScoreBandDisplayLabel(calculated.score),
      },
      metrics: {
        weightKg: calculated.input.weightKg,
        weightDisplay: formatWeightKg(calculated.input.weightKg),
        weightSourceLabel: t('home.weight.profile'),
        bodyFatPct: bodyFatAvailable ? calculated.result.metrics.bodyFatPct : null,
        bodyFatDisplay: bodyFatAvailable
          ? formatBodyFatPercent(calculated.result.metrics.bodyFatPct)
          : '—',
        bodyFatSourceLabel: bodyFatAvailable
          ? t('home.bodyFat.profile')
          : t('home.bodyFatUnavailable'),
        bodyFatAvailability: bodyFatAvailable ? 'available' : 'unavailable',
      },
      focus: {
        primaryFocus: primaryFocusState.primaryFocus,
        title: focusDisplay.title,
        subtitle: focusDisplay.subtitle,
      },
      coach: {
        recommendationId: coachState.recommendationId,
        title: coachDisplay.title,
        message: formatCoachMessage(coachDisplay.description),
        availability: 'available',
        languageSource: {
          recommendationId: coachState.result.recommendationId,
          category: coachState.result.category,
          durationMinutes: coachState.result.durationMinutes,
          frequencyPerWeek: coachState.result.frequencyPerWeek,
          priority: coachState.result.priority,
          confidence: coachState.result.confidence,
          primaryFocus: primaryFocusState.primaryFocus,
        },
      },
    },
  };
}

export function buildHomeCurrentHealthState(
  profile: UserProfile | null,
  latestSnapshot: HealthSnapshot | null,
  asOfDate: string = getLocalCalendarDate(),
): HomeCurrentHealthState {
  if (latestSnapshot) {
    return buildFromSnapshot(latestSnapshot, profile);
  }

  if (!profile) {
    return { status: 'empty' };
  }

  const fallback = buildFromProfileFallback(profile, asOfDate);
  if (fallback.status === 'empty') {
    return {
      status: 'error',
      message: t('home.emptyHealth'),
    };
  }

  return fallback;
}

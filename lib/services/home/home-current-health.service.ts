import type { FocusType } from '@/lib/domain/focus-engine';
import type { HealthSnapshot } from '@/lib/domain/snapshot';
import type { UserProfile } from '@/lib/domain/profile';
import { formatCoachMessage, getCoachPresentation } from '@/lib/services/coach/coach.presentation';
import { buildHomeCoachState } from '@/lib/services/coach';
import { getFocusPresentation, buildHomePrimaryFocusState } from '@/lib/services/focus';
import {
  calculateHomeHealthScoreFromProfile,
  formatBodyFatPercent,
  getHealthScoreBandLabel,
  getLocalCalendarDate,
} from '@/lib/services/health-score';

import {
  HOME_BODY_FAT_PROFILE_LABEL,
  HOME_BODY_FAT_SNAPSHOT_LABEL,
  HOME_BODY_FAT_UNAVAILABLE_LABEL,
  HOME_COACH_UNAVAILABLE_MESSAGE,
  HOME_CURRENT_HEALTH_EMPTY_MESSAGE,
  HOME_WEIGHT_PROFILE_LABEL,
  HOME_WEIGHT_SNAPSHOT_LABEL,
  type HomeCurrentHealth,
  type HomeCurrentHealthState,
} from './home-current-health.types';

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
  return `${weightKg.toFixed(1)} kg`;
}

function buildSnapshotCoachMessage(snapshot: HealthSnapshot): {
  message: string;
  title: string | null;
  recommendationId: string | null;
  availability: 'available' | 'unavailable';
} {
  const { coachRecommendationId, coachDurationMinutes, coachFrequencyPerWeek } = snapshot;

  if (
    !coachRecommendationId.trim() ||
    coachDurationMinutes == null ||
    coachFrequencyPerWeek == null ||
    coachDurationMinutes <= 0 ||
    coachFrequencyPerWeek <= 0
  ) {
    return {
      message: HOME_COACH_UNAVAILABLE_MESSAGE,
      title: null,
      recommendationId: coachRecommendationId.trim() ? coachRecommendationId : null,
      availability: 'unavailable',
    };
  }

  const presentation = getCoachPresentation(
    coachRecommendationId,
    coachDurationMinutes,
    coachFrequencyPerWeek,
  );

  return {
    message: formatCoachMessage(presentation.description),
    title: presentation.title,
    recommendationId: coachRecommendationId,
    availability: 'available',
  };
}

function buildSnapshotBodyFat(snapshot: HealthSnapshot): {
  bodyFatPct: number | null;
  bodyFatDisplay: string;
  bodyFatSourceLabel: string;
  bodyFatAvailability: 'available' | 'unavailable';
} {
  if (snapshot.bodyFatPct == null || !Number.isFinite(snapshot.bodyFatPct)) {
    return {
      bodyFatPct: null,
      bodyFatDisplay: '—',
      bodyFatSourceLabel: HOME_BODY_FAT_UNAVAILABLE_LABEL,
      bodyFatAvailability: 'unavailable',
    };
  }

  return {
    bodyFatPct: snapshot.bodyFatPct,
    bodyFatDisplay: formatBodyFatPercent(snapshot.bodyFatPct),
    bodyFatSourceLabel: HOME_BODY_FAT_SNAPSHOT_LABEL,
    bodyFatAvailability: 'available',
  };
}

function buildFromSnapshot(snapshot: HealthSnapshot): HomeCurrentHealthState {
  if (!isFocusType(snapshot.primaryFocus)) {
    return {
      status: 'error',
      message: 'Hälsosnapshoten innehåller ogiltigt fokus.',
    };
  }

  const focusPresentation = getFocusPresentation(snapshot.primaryFocus);
  const bodyFat = buildSnapshotBodyFat(snapshot);
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
        subtitle: getHealthScoreBandLabel(snapshot.overallScore),
      },
      metrics: {
        weightKg: snapshot.weightKg,
        weightDisplay: formatWeightKg(snapshot.weightKg),
        weightSourceLabel: HOME_WEIGHT_SNAPSHOT_LABEL,
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

  return {
    status: 'ready',
    data: {
      source: 'profile_fallback',
      healthScore: {
        score: calculated.score,
        subtitle: calculated.subtitle,
      },
      metrics: {
        weightKg: calculated.input.weightKg,
        weightDisplay: formatWeightKg(calculated.input.weightKg),
        weightSourceLabel: HOME_WEIGHT_PROFILE_LABEL,
        bodyFatPct: calculated.result.metrics.bodyFatPct,
        bodyFatDisplay: formatBodyFatPercent(calculated.result.metrics.bodyFatPct),
        bodyFatSourceLabel: HOME_BODY_FAT_PROFILE_LABEL,
        bodyFatAvailability: 'available',
      },
      focus: {
        primaryFocus: primaryFocusState.primaryFocus,
        title: primaryFocusState.title,
        subtitle: primaryFocusState.subtitle,
      },
      coach: {
        recommendationId: coachState.recommendationId,
        title: coachState.title,
        message: coachState.message,
        availability: 'available',
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
    return buildFromSnapshot(latestSnapshot);
  }

  if (!profile) {
    return { status: 'empty' };
  }

  const fallback = buildFromProfileFallback(profile, asOfDate);
  if (fallback.status === 'empty') {
    return {
      status: 'error',
      message: HOME_CURRENT_HEALTH_EMPTY_MESSAGE,
    };
  }

  return fallback;
}

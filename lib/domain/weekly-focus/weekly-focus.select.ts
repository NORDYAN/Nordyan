import type { FocusType } from '@/lib/domain/focus-engine';

import {
  PRIMARY_FOCUS_TIE_BREAK,
  WEEKLY_FOCUS_IMPROVE_MIN_NEED,
  WEEKLY_FOCUS_IMPROVE_TIE_PRIORITY,
  WEEKLY_FOCUS_INSUFFICIENT_EVIDENCE_FALLBACK,
  WEEKLY_FOCUS_MAINTAIN_PRIORITY,
} from './weekly-focus.constants';
import type { ResolvedWeeklyFocusSignals } from './weekly-focus.signals';
import type {
  WeeklyFocusArea,
  WeeklyFocusAreaScore,
  WeeklyFocusNeedScore,
  WeeklyFocusScores,
  WeeklyFocusSelectedArea,
} from './weekly-focus.types';

function isKnown(
  score: WeeklyFocusAreaScore,
): score is { status: 'known'; needScore: WeeklyFocusNeedScore } {
  return score.status === 'known';
}

function needOf(scores: WeeklyFocusScores, area: WeeklyFocusArea): WeeklyFocusNeedScore | null {
  const score = scores[area];
  return isKnown(score) ? score.needScore : null;
}

function hsRank(area: WeeklyFocusArea, primaryFocus: FocusType | null): number {
  if (primaryFocus == null) {
    return Number.POSITIVE_INFINITY;
  }
  const preferred = PRIMARY_FOCUS_TIE_BREAK[primaryFocus];
  const index = preferred.indexOf(area);
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

function improveTieIndex(area: WeeklyFocusArea): number {
  return WEEKLY_FOCUS_IMPROVE_TIE_PRIORITY.indexOf(area);
}

export function isImproveCandidate(
  area: WeeklyFocusArea,
  scores: WeeklyFocusScores,
  alcoholSelectable: boolean,
): boolean {
  const need = needOf(scores, area);
  if (need == null || need < WEEKLY_FOCUS_IMPROVE_MIN_NEED) {
    return false;
  }
  if (area === 'alcohol') {
    return alcoholSelectable;
  }
  return true;
}

export function applySleepRecoveryAntiDuplication(
  improve: WeeklyFocusArea[],
  recoveryIndependentNeed: WeeklyFocusNeedScore | null,
): WeeklyFocusArea[] {
  const hasSleep = improve.includes('sleep');
  const hasRecovery = improve.includes('recovery');
  if (!hasSleep || !hasRecovery) {
    return improve;
  }
  if (recoveryIndependentNeed != null && recoveryIndependentNeed >= WEEKLY_FOCUS_IMPROVE_MIN_NEED) {
    return improve;
  }
  return improve.filter((area) => area !== 'recovery');
}

export function suppressTrainingWhenRecovering(
  improve: WeeklyFocusArea[],
  recoveryConstraint: boolean,
): WeeklyFocusArea[] {
  if (!recoveryConstraint || !improve.includes('training')) {
    return improve;
  }
  const others = improve.filter((area) => area !== 'training');
  if (others.length === 0) {
    return improve;
  }
  return others;
}

function compareImprove(
  a: WeeklyFocusArea,
  b: WeeklyFocusArea,
  scores: WeeklyFocusScores,
  previous: ReadonlySet<WeeklyFocusArea>,
  primaryFocus: FocusType | null,
): number {
  const needA = needOf(scores, a) ?? 0;
  const needB = needOf(scores, b) ?? 0;
  if (needA !== needB) {
    return needB - needA;
  }
  const prevA = previous.has(a);
  const prevB = previous.has(b);
  if (prevA !== prevB) {
    return prevA ? -1 : 1;
  }
  const hsA = hsRank(a, primaryFocus);
  const hsB = hsRank(b, primaryFocus);
  if (hsA !== hsB) {
    return hsA - hsB;
  }
  return improveTieIndex(a) - improveTieIndex(b);
}

export function selectWeeklyFocuses(input: {
  scores: WeeklyFocusScores;
  signals: ResolvedWeeklyFocusSignals;
  alcoholSelectable: boolean;
  recoveryIndependentNeed: WeeklyFocusNeedScore | null;
  recoveryConstraint: boolean;
  previousFocuses: readonly WeeklyFocusArea[] | null;
}): {
  focuses: [WeeklyFocusSelectedArea, WeeklyFocusSelectedArea];
  insufficientEvidenceFallback: boolean;
} {
  const { scores, alcoholSelectable, recoveryIndependentNeed, recoveryConstraint } = input;
  const previous = new Set(input.previousFocuses ?? []);
  const primaryFocus = input.signals.primaryFocus;

  const improveSeed = (
    [
      'everyday_movement',
      'training',
      'sleep',
      'nutrition',
      'alcohol',
      'recovery',
    ] as const satisfies readonly WeeklyFocusArea[]
  ).filter((area) => isImproveCandidate(area, scores, alcoholSelectable));

  const withoutDup = applySleepRecoveryAntiDuplication([...improveSeed], recoveryIndependentNeed);
  const improve = suppressTrainingWhenRecovering(withoutDup, recoveryConstraint).sort((a, b) =>
    compareImprove(a, b, scores, previous, primaryFocus),
  );

  const selected: WeeklyFocusSelectedArea[] = [];

  for (const area of improve) {
    if (selected.length >= 2) {
      break;
    }
    selected.push({
      area,
      mode: 'improve',
      needScore: needOf(scores, area)!,
    });
  }

  if (selected.length < 2) {
    const selectedAreas = new Set(selected.map((item) => item.area));
    for (const area of WEEKLY_FOCUS_MAINTAIN_PRIORITY) {
      if (selected.length >= 2) {
        break;
      }
      if (selectedAreas.has(area)) {
        continue;
      }
      const need = needOf(scores, area);
      if (need == null || need >= WEEKLY_FOCUS_IMPROVE_MIN_NEED) {
        continue;
      }
      selected.push({ area, mode: 'maintain', needScore: need });
      selectedAreas.add(area);
    }
  }

  let insufficientEvidenceFallback = false;
  if (selected.length < 2) {
    insufficientEvidenceFallback = true;
    const selectedAreas = new Set(selected.map((item) => item.area));
    for (const area of WEEKLY_FOCUS_INSUFFICIENT_EVIDENCE_FALLBACK) {
      if (selected.length >= 2) {
        break;
      }
      if (selectedAreas.has(area)) {
        continue;
      }
      const need = needOf(scores, area);
      selected.push({
        area,
        mode: 'maintain',
        needScore: need ?? 0,
      });
      selectedAreas.add(area);
    }
  }

  return {
    focuses: [selected[0]!, selected[1]!],
    insufficientEvidenceFallback,
  };
}

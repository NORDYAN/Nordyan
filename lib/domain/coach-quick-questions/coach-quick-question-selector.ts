import {
  COACH_QUICK_QUESTION_AFTER_SPECIFIC_FALLBACK_ORDER,
  COACH_QUICK_QUESTION_BANK,
  COACH_QUICK_QUESTION_FALLBACK_ORDER,
} from './coach-quick-question-bank';
import type {
  CoachQuickQuestionDefinition,
  CoachQuickQuestionId,
  CoachQuickQuestionScored,
  CoachQuickQuestionSelectorResult,
  CoachQuickQuestionSignals,
  CoachQuickQuestionTopicFamily,
} from './coach-quick-question.types';
import type { WeeklyFocusArea } from '@/lib/domain/weekly-focus';
import type { CoachAskFocusType } from '@/shared/coach-language';

const MAX_SLOTS = 3;

const FOCUS_RELATED_IDS: Record<CoachAskFocusType, readonly CoachQuickQuestionId[]> = {
  reduce_waist: ['waist_development'],
  improve_activity: ['movement_enough'],
  improve_body_composition: ['body_fat_compare', 'body_fat_reduce'],
  improve_weight_balance: ['weight_development'],
  maintain_current_path: ['health_overall', 'health_score_main_driver', 'understand_my_data'],
};

const WEEKLY_FOCUS_RELATED_IDS: Record<WeeklyFocusArea, readonly CoachQuickQuestionId[]> = {
  everyday_movement: ['movement_enough'],
  training: ['training_enough'],
  sleep: ['sleep_improve'],
  nutrition: ['nutrition_improve'],
  alcohol: ['alcohol_health'],
  recovery: ['recovery_understand', 'stress_energy'],
};

const GENERIC_FAMILIES = new Set<CoachQuickQuestionTopicFamily>(['health_score', 'general']);
const SPECIFIC_SURFACE_MIN = 2;

export function isCoachQuickQuestionEligible(
  id: CoachQuickQuestionId,
  signals: CoachQuickQuestionSignals,
): boolean {
  switch (id) {
    case 'health_score_main_driver':
      return signals.healthScoreAvailable;
    case 'health_score_change':
      return signals.healthScoreChangeComparable;
    case 'health_overall':
    case 'understand_my_data':
      return signals.hasHealthContext;
    case 'development_recent':
      return signals.developmentComparable;
    case 'waist_development':
      return signals.waistComparable;
    case 'weight_development':
      return signals.weightComparable;
    case 'body_fat_compare':
      return signals.bodyFatPresentable && signals.bodyFatReferenceReady;
    case 'body_fat_reduce':
      return signals.bodyFatPresentable;
    case 'sleep_improve':
      return signals.sleep.available;
    case 'recovery_understand':
      return recoveryEvidenceCount(signals) >= 2;
    case 'stress_energy':
      return signals.stress.available && signals.energy.available;
    case 'movement_enough':
      return signals.everydayActivity.available;
    case 'training_enough':
      return signals.training.available;
    case 'nutrition_improve':
      return signals.eating.available || signals.nutritionBaseline;
    case 'alcohol_health':
      return signals.alcohol.available;
    default: {
      const _never: never = id;
      return _never;
    }
  }
}

function recoveryEvidenceCount(signals: CoachQuickQuestionSignals): number {
  return [signals.sleep.available, signals.energy.available, signals.stress.available].filter(
    Boolean,
  ).length;
}

function relatedToFocus(id: CoachQuickQuestionId, focusType: CoachAskFocusType | null): boolean {
  if (!focusType) {
    return false;
  }
  return FOCUS_RELATED_IDS[focusType].includes(id);
}

function relatedToWeeklyFocus(
  id: CoachQuickQuestionId,
  areas: readonly WeeklyFocusArea[],
): boolean {
  return areas.some((area) => WEEKLY_FOCUS_RELATED_IDS[area].includes(id));
}

function isSpecificQuestion(entry: CoachQuickQuestionScored): boolean {
  return !GENERIC_FAMILIES.has(entry.topicFamily);
}

function canSurface(entry: CoachQuickQuestionScored): boolean {
  if (GENERIC_FAMILIES.has(entry.topicFamily) && entry.id !== 'health_score_change') {
    return entry.score >= 1;
  }
  return entry.score >= SPECIFIC_SURFACE_MIN;
}

export function scoreCoachQuickQuestion(
  definition: CoachQuickQuestionDefinition,
  signals: CoachQuickQuestionSignals,
): number {
  const { id } = definition;
  const bonuses: number[] = [0];
  const weeklyRelated = relatedToWeeklyFocus(id, signals.weeklyFocusImproveAreas);

  if (weeklyRelated) {
    bonuses.push(4);
  }

  if (relatedToFocus(id, signals.focusType)) {
    bonuses.push(3);
  }

  switch (id) {
    case 'health_score_main_driver':
      if (signals.healthScoreAvailable) {
        bonuses.push(2);
      }
      bonuses.push(1);
      break;
    case 'health_score_change':
      if (signals.healthScoreDeclined) {
        bonuses.push(4);
      } else if (signals.healthScoreChangeComparable) {
        bonuses.push(2);
      }
      break;
    case 'health_overall':
    case 'understand_my_data':
      bonuses.push(1);
      break;
    case 'development_recent':
      if (signals.developmentComparable) {
        bonuses.push(2);
      }
      break;
    case 'waist_development':
      if (signals.waistComparable) {
        bonuses.push(2);
      }
      break;
    case 'weight_development':
      if (signals.weightComparable) {
        bonuses.push(2);
      }
      break;
    case 'body_fat_compare':
      if (signals.bodyFatReferenceReady && relatedToFocus(id, signals.focusType)) {
        bonuses.push(2);
      }
      break;
    case 'body_fat_reduce':
      break;
    case 'sleep_improve':
      if (signals.sleep.weak) {
        bonuses.push(4);
      }
      break;
    case 'recovery_understand': {
      const bothStressEnergyWeak = signals.stress.weak && signals.energy.weak;
      if (bothStressEnergyWeak) {
        bonuses.push(3);
      } else if (signals.sleep.weak || signals.energy.weak || signals.stress.weak) {
        bonuses.push(4);
      }
      break;
    }
    case 'stress_energy':
      if (signals.stress.weak && signals.energy.weak) {
        bonuses.push(4);
      }
      break;
    case 'movement_enough':
      if (signals.everydayActivity.weak) {
        bonuses.push(4);
      }
      break;
    case 'training_enough':
      if (signals.training.weak) {
        bonuses.push(4);
      }
      break;
    case 'nutrition_improve':
      if (signals.eating.weak) {
        bonuses.push(4);
      }
      break;
    case 'alcohol_health':
      if (signals.alcohol.elevated) {
        bonuses.push(4);
      }
      break;
    default: {
      const _never: never = id;
      return _never;
    }
  }

  return Math.max(...bonuses);
}

function compareScored(a: CoachQuickQuestionScored, b: CoachQuickQuestionScored): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  if (a.id === 'stress_energy' && b.id === 'recovery_understand') {
    return -1;
  }
  if (b.id === 'stress_energy' && a.id === 'recovery_understand') {
    return 1;
  }
  return a.bankPriority - b.bankPriority;
}

function unusedFamilyExists(
  candidatePool: readonly CoachQuickQuestionScored[],
  selected: readonly CoachQuickQuestionScored[],
): boolean {
  const used = new Set(selected.map((entry) => entry.topicFamily));
  return candidatePool.some((entry) => !used.has(entry.topicFamily));
}

function canSelect(
  candidate: CoachQuickQuestionScored,
  selected: readonly CoachQuickQuestionScored[],
  remainingSlots: number,
  unusedFamilies: boolean,
): boolean {
  const sameFamily = selected.filter((entry) => entry.topicFamily === candidate.topicFamily);
  if (sameFamily.length === 0) {
    return true;
  }

  if (
    candidate.id === 'recovery_understand' &&
    selected.some((entry) => entry.id === 'stress_energy')
  ) {
    return true;
  }

  if (GENERIC_FAMILIES.has(candidate.topicFamily) && remainingSlots === 1 && !unusedFamilies) {
    return true;
  }

  if (candidate.topicFamily === 'body_composition' && !unusedFamilies) {
    const usedSubtopics = new Set(
      sameFamily
        .map((entry) => entry.bodyCompSubtopic)
        .filter((subtopic): subtopic is NonNullable<typeof subtopic> => subtopic != null),
    );
    if (
      candidate.bodyCompSubtopic &&
      !usedSubtopics.has(candidate.bodyCompSubtopic) &&
      (candidate.bodyCompSubtopic === 'waist' || candidate.bodyCompSubtopic === 'body_fat')
    ) {
      return true;
    }
  }

  return false;
}

function pickNextSurfaced(
  pool: readonly CoachQuickQuestionScored[],
  selected: readonly CoachQuickQuestionScored[],
  remainingSlots: number,
): CoachQuickQuestionScored | null {
  const selectedIds = new Set(selected.map((entry) => entry.id));
  const remaining = pool.filter((entry) => !selectedIds.has(entry.id) && canSurface(entry));
  const unusedFamilies = unusedFamilyExists(remaining, selected);

  const eligibleNext = remaining.filter((entry) =>
    canSelect(entry, selected, remainingSlots, unusedFamilies),
  );

  const ranked = [...eligibleNext].sort(compareScored);
  return ranked[0] ?? null;
}

function appendGenericFallback(
  selected: CoachQuickQuestionScored[],
  scored: readonly CoachQuickQuestionScored[],
): void {
  const hasSpecific = selected.some((entry) => isSpecificQuestion(entry));
  const order = hasSpecific
    ? COACH_QUICK_QUESTION_AFTER_SPECIFIC_FALLBACK_ORDER
    : COACH_QUICK_QUESTION_FALLBACK_ORDER;

  for (const fallbackId of order) {
    if (selected.length >= MAX_SLOTS) {
      return;
    }
    const candidate = scored.find((entry) => entry.id === fallbackId);
    if (!candidate || selected.some((entry) => entry.id === candidate.id)) {
      continue;
    }
    if (!canSurface(candidate)) {
      continue;
    }
    selected.push(candidate);
  }
}

export function selectCoachQuickQuestions(
  signals: CoachQuickQuestionSignals,
): CoachQuickQuestionSelectorResult {
  if (!signals.hasHealthContext) {
    return { ids: [], scored: [] };
  }

  const scored = COACH_QUICK_QUESTION_BANK.filter((definition) =>
    isCoachQuickQuestionEligible(definition.id, signals),
  )
    .map((definition) => ({
      id: definition.id,
      topicFamily: definition.topicFamily,
      bodyCompSubtopic: definition.bodyCompSubtopic,
      score: scoreCoachQuickQuestion(definition, signals),
      bankPriority: definition.bankPriority,
    }))
    .sort(compareScored);

  const selected: CoachQuickQuestionScored[] = [];
  const slot1 = pickNextSurfaced(scored, selected, MAX_SLOTS);
  if (slot1) {
    selected.push(slot1);
  }

  const slot2Pool = scored.filter(
    (entry) => !selected.some((selectedEntry) => selectedEntry.id === entry.id) && canSurface(entry),
  );
  const unusedFamiliesForSlot2 = unusedFamilyExists(slot2Pool, selected);
  const specificSlot2 = [...slot2Pool]
    .filter(
      (entry) =>
        isSpecificQuestion(entry) &&
        canSelect(entry, selected, MAX_SLOTS - selected.length, unusedFamiliesForSlot2),
    )
    .sort(compareScored)[0];
  if (specificSlot2) {
    selected.push(specificSlot2);
  }

  if (selected.length < MAX_SLOTS) {
    appendGenericFallback(selected, scored);
  }

  return {
    ids: selected.map((entry) => entry.id),
    scored,
  };
}

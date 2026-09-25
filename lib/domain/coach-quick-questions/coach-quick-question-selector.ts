import {
  COACH_QUICK_QUESTION_AFTER_SPECIFIC_FALLBACK_ORDER,
  COACH_QUICK_QUESTION_BANK,
  COACH_QUICK_QUESTION_FALLBACK_ORDER,
} from './coach-quick-question-bank';
import {
  isCoachQuickQuestionOnCooldown,
  shouldReuseActiveQuickQuestionTrio,
} from './coach-quick-question-rotation';
import type {
  CoachQuickQuestionDefinition,
  CoachQuickQuestionId,
  CoachQuickQuestionIntentRole,
  CoachQuickQuestionScored,
  CoachQuickQuestionSelectorOptions,
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
): boolean {
  const sameFamily = selected.filter((entry) => entry.topicFamily === candidate.topicFamily);
  if (sameFamily.length === 0) {
    return true;
  }

  const unusedFamilies = unusedFamilyExists([candidate], selected);
  if (!unusedFamilies && GENERIC_FAMILIES.has(candidate.topicFamily)) {
    return true;
  }

  if (candidate.topicFamily === 'body_composition') {
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

function freshnessRank(
  entry: CoachQuickQuestionScored,
  cooledIds: ReadonlySet<CoachQuickQuestionId>,
  avoidIds: ReadonlySet<CoachQuickQuestionId>,
): number {
  if (cooledIds.has(entry.id)) {
    return 2;
  }
  if (avoidIds.has(entry.id)) {
    return 1;
  }
  return 0;
}

function pickBest(
  pool: readonly CoachQuickQuestionScored[],
  selected: readonly CoachQuickQuestionScored[],
  options: {
    role?: CoachQuickQuestionIntentRole;
    preferFresh: boolean;
    allowBelowSurface: boolean;
    cooledIds: ReadonlySet<CoachQuickQuestionId>;
    avoidIds: ReadonlySet<CoachQuickQuestionId>;
  },
): CoachQuickQuestionScored | null {
  const selectedIds = new Set(selected.map((entry) => entry.id));
  const remaining = pool.filter((entry) => {
    if (selectedIds.has(entry.id)) {
      return false;
    }
    if (options.role && entry.intentRole !== options.role) {
      return false;
    }
    if (
      options.preferFresh &&
      (options.cooledIds.has(entry.id) || options.avoidIds.has(entry.id))
    ) {
      return false;
    }
    if (!options.allowBelowSurface && !canSurface(entry)) {
      return false;
    }
    return canSelect(entry, selected);
  });

  if (remaining.length === 0) {
    return null;
  }

  const unusedFamilies = unusedFamilyExists(remaining, selected);
  const ranked = [...remaining].sort((a, b) => {
    const unusedA = unusedFamilies && !selected.some((entry) => entry.topicFamily === a.topicFamily);
    const unusedB = unusedFamilies && !selected.some((entry) => entry.topicFamily === b.topicFamily);
    if (unusedA !== unusedB) {
      return unusedA ? -1 : 1;
    }
    const fresh =
      freshnessRank(a, options.cooledIds, options.avoidIds) -
      freshnessRank(b, options.cooledIds, options.avoidIds);
    if (fresh !== 0) {
      return fresh;
    }
    return compareScored(a, b);
  });
  return ranked[0] ?? null;
}

function appendGenericFallback(
  selected: CoachQuickQuestionScored[],
  scored: readonly CoachQuickQuestionScored[],
  options: {
    preferFresh: boolean;
    cooledIds: ReadonlySet<CoachQuickQuestionId>;
    avoidIds: ReadonlySet<CoachQuickQuestionId>;
  },
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
    if (
      options.preferFresh &&
      (options.cooledIds.has(candidate.id) || options.avoidIds.has(candidate.id))
    ) {
      continue;
    }
    if (!canSurface(candidate)) {
      continue;
    }
    selected.push(candidate);
  }
}

function fillIntentRoles(
  scored: readonly CoachQuickQuestionScored[],
  options: {
    preferFresh: boolean;
    allowBelowSurface: boolean;
    cooledIds: ReadonlySet<CoachQuickQuestionId>;
    avoidIds: ReadonlySet<CoachQuickQuestionId>;
  },
  selected: CoachQuickQuestionScored[],
): void {
  const roles: CoachQuickQuestionIntentRole[] = ['specific_data', 'behavior', 'priority'];
  for (const role of roles) {
    if (selected.length >= MAX_SLOTS) {
      return;
    }
    if (selected.some((entry) => entry.intentRole === role)) {
      continue;
    }
    const picked = pickBest(scored, selected, { ...options, role });
    if (picked) {
      selected.push(picked);
    }
  }
}

function fillRemainingSlots(
  scored: readonly CoachQuickQuestionScored[],
  options: {
    preferFresh: boolean;
    allowBelowSurface: boolean;
    cooledIds: ReadonlySet<CoachQuickQuestionId>;
    avoidIds: ReadonlySet<CoachQuickQuestionId>;
  },
  selected: CoachQuickQuestionScored[],
): void {
  while (selected.length < MAX_SLOTS) {
    const picked = pickBest(scored, selected, { ...options, role: undefined });
    if (!picked) {
      break;
    }
    selected.push(picked);
  }

  if (selected.length < MAX_SLOTS) {
    appendGenericFallback(selected, scored, options);
  }
}

export function selectCoachQuickQuestions(
  signals: CoachQuickQuestionSignals,
  options: CoachQuickQuestionSelectorOptions = {},
): CoachQuickQuestionSelectorResult {
  if (!signals.hasHealthContext) {
    return { ids: [], scored: [], recordShown: false };
  }

  const now = options.now ?? new Date();
  const rotation = options.rotation ?? null;

  const scored = COACH_QUICK_QUESTION_BANK.filter((definition) =>
    isCoachQuickQuestionEligible(definition.id, signals),
  )
    .map((definition) => ({
      id: definition.id,
      topicFamily: definition.topicFamily,
      intentRole: definition.intentRole,
      bodyCompSubtopic: definition.bodyCompSubtopic,
      score: scoreCoachQuickQuestion(definition, signals),
      bankPriority: definition.bankPriority,
      cooldownDays: definition.cooldownDays,
    }))
    .sort(compareScored);

  const eligibleIds = new Set(scored.map((entry) => entry.id));
  if (shouldReuseActiveQuickQuestionTrio(eligibleIds, rotation, now)) {
    return {
      ids: rotation!.activeIds,
      scored,
      recordShown: false,
    };
  }

  const cooledIds = new Set(
    scored
      .map((entry) => entry.id)
      .filter((id) => isCoachQuickQuestionOnCooldown(id, rotation, now)),
  );
  const avoidIds = new Set(rotation?.activeIds ?? []);

  const selected: CoachQuickQuestionScored[] = [];
  const freshSurfaced = {
    preferFresh: true,
    allowBelowSurface: false,
    cooledIds,
    avoidIds,
  };
  const freshAny = { ...freshSurfaced, allowBelowSurface: true };
  const cooledSurfaced = { ...freshSurfaced, preferFresh: false };
  const cooledAny = { ...freshAny, preferFresh: false };

  fillIntentRoles(scored, freshSurfaced, selected);
  fillIntentRoles(scored, freshAny, selected);
  fillRemainingSlots(scored, freshSurfaced, selected);
  fillRemainingSlots(scored, freshAny, selected);
  fillIntentRoles(scored, cooledSurfaced, selected);
  fillIntentRoles(scored, cooledAny, selected);
  fillRemainingSlots(scored, cooledSurfaced, selected);
  fillRemainingSlots(scored, cooledAny, selected);

  const ordered: CoachQuickQuestionScored[] = [];
  for (const role of ['specific_data', 'behavior', 'priority'] as const) {
    const match = selected.find((entry) => entry.intentRole === role && !ordered.includes(entry));
    if (match) {
      ordered.push(match);
    }
  }
  for (const entry of selected) {
    if (!ordered.includes(entry)) {
      ordered.push(entry);
    }
  }

  return {
    ids: ordered.map((entry) => entry.id),
    scored,
    recordShown: ordered.length > 0,
  };
}

import {
  COACH_QUICK_QUESTION_DEFAULT_COOLDOWN_DAYS,
  type CoachQuickQuestionDefinition,
  type CoachQuickQuestionId,
} from './coach-quick-question.types';

const cooldownDays = COACH_QUICK_QUESTION_DEFAULT_COOLDOWN_DAYS;

export const COACH_QUICK_QUESTION_BANK: readonly CoachQuickQuestionDefinition[] = [
  {
    id: 'health_score_main_driver',
    topicFamily: 'health_score',
    intentRole: 'specific_data',
    copyKey: 'coach.quick.healthScoreMainDriver',
    bankPriority: 1,
    cooldownDays,
    requiredSignals: ['healthScoreAvailable'],
  },
  {
    id: 'health_score_change',
    topicFamily: 'health_score',
    intentRole: 'specific_data',
    copyKey: 'coach.quick.healthScoreChange',
    bankPriority: 2,
    cooldownDays,
    requiredSignals: ['healthScoreChangeComparable'],
  },
  {
    id: 'health_overall',
    topicFamily: 'general',
    intentRole: 'priority',
    copyKey: 'coach.quick.healthOverall',
    bankPriority: 3,
    cooldownDays,
    requiredSignals: ['hasHealthContext'],
  },
  {
    id: 'development_recent',
    topicFamily: 'development',
    intentRole: 'specific_data',
    copyKey: 'coach.quick.developmentRecent',
    bankPriority: 4,
    cooldownDays,
    requiredSignals: ['developmentComparable'],
  },
  {
    id: 'waist_development',
    topicFamily: 'body_composition',
    intentRole: 'specific_data',
    bodyCompSubtopic: 'waist',
    copyKey: 'coach.quick.waistDevelopment',
    bankPriority: 5,
    cooldownDays,
    requiredSignals: ['waistComparable'],
  },
  {
    id: 'weight_development',
    topicFamily: 'body_composition',
    intentRole: 'specific_data',
    bodyCompSubtopic: 'weight',
    copyKey: 'coach.quick.weightDevelopment',
    bankPriority: 6,
    cooldownDays,
    requiredSignals: ['weightComparable'],
  },
  {
    id: 'body_fat_compare',
    topicFamily: 'body_composition',
    intentRole: 'specific_data',
    bodyCompSubtopic: 'body_fat',
    copyKey: 'coach.quick.bodyFatCompare',
    bankPriority: 7,
    cooldownDays,
    requiredSignals: ['bodyFatPresentable', 'bodyFatReferenceReady'],
  },
  {
    id: 'body_fat_reduce',
    topicFamily: 'body_composition',
    intentRole: 'behavior',
    bodyCompSubtopic: 'body_fat',
    copyKey: 'coach.quick.bodyFatReduce',
    bankPriority: 8,
    cooldownDays,
    requiredSignals: ['bodyFatPresentable'],
  },
  {
    id: 'sleep_improve',
    topicFamily: 'sleep',
    intentRole: 'behavior',
    copyKey: 'coach.quick.sleepImprove',
    bankPriority: 9,
    cooldownDays,
    requiredSignals: ['sleep'],
  },
  {
    id: 'recovery_understand',
    topicFamily: 'recovery',
    intentRole: 'behavior',
    copyKey: 'coach.quick.recoveryUnderstand',
    bankPriority: 10,
    cooldownDays,
    requiredSignals: ['recoveryEvidence'],
  },
  {
    id: 'stress_energy',
    topicFamily: 'recovery',
    intentRole: 'behavior',
    copyKey: 'coach.quick.stressEnergy',
    bankPriority: 11,
    cooldownDays,
    requiredSignals: ['stress', 'energy'],
  },
  {
    id: 'movement_enough',
    topicFamily: 'activity',
    intentRole: 'behavior',
    copyKey: 'coach.quick.movementEnough',
    bankPriority: 12,
    cooldownDays,
    requiredSignals: ['everydayActivity'],
  },
  {
    id: 'training_enough',
    topicFamily: 'training',
    intentRole: 'behavior',
    copyKey: 'coach.quick.trainingEnough',
    bankPriority: 13,
    cooldownDays,
    requiredSignals: ['training'],
  },
  {
    id: 'nutrition_improve',
    topicFamily: 'nutrition',
    intentRole: 'behavior',
    copyKey: 'coach.quick.nutritionImprove',
    bankPriority: 14,
    cooldownDays,
    requiredSignals: ['eatingOrNutritionBaseline'],
  },
  {
    id: 'alcohol_health',
    topicFamily: 'alcohol',
    intentRole: 'behavior',
    copyKey: 'coach.quick.alcoholHealth',
    bankPriority: 15,
    cooldownDays,
    requiredSignals: ['alcohol'],
  },
  {
    id: 'understand_my_data',
    topicFamily: 'general',
    intentRole: 'specific_data',
    copyKey: 'coach.quick.understandMyData',
    bankPriority: 16,
    cooldownDays,
    requiredSignals: ['hasHealthContext'],
  },
];

/** Sparse / no-specific visible order. */
export const COACH_QUICK_QUESTION_FALLBACK_ORDER: readonly CoachQuickQuestionId[] = [
  'health_score_main_driver',
  'health_overall',
  'understand_my_data',
];

/** Remaining slots after a surfaced specific topic. */
export const COACH_QUICK_QUESTION_AFTER_SPECIFIC_FALLBACK_ORDER: readonly CoachQuickQuestionId[] = [
  'health_overall',
  'health_score_main_driver',
  'understand_my_data',
];

export function getCoachQuickQuestionDefinition(
  id: CoachQuickQuestionId,
): CoachQuickQuestionDefinition {
  const definition = COACH_QUICK_QUESTION_BANK.find((entry) => entry.id === id);
  if (!definition) {
    throw new Error(`Unknown Coach quick question: ${id}`);
  }
  return definition;
}

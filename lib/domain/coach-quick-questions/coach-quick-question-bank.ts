import type {
  CoachQuickQuestionDefinition,
  CoachQuickQuestionId,
} from './coach-quick-question.types';

export const COACH_QUICK_QUESTION_BANK: readonly CoachQuickQuestionDefinition[] = [
  {
    id: 'health_score_main_driver',
    topicFamily: 'health_score',
    copyKey: 'coach.quick.healthScoreMainDriver',
    bankPriority: 1,
  },
  {
    id: 'health_score_change',
    topicFamily: 'health_score',
    copyKey: 'coach.quick.healthScoreChange',
    bankPriority: 2,
  },
  {
    id: 'health_overall',
    topicFamily: 'general',
    copyKey: 'coach.quick.healthOverall',
    bankPriority: 3,
  },
  {
    id: 'development_recent',
    topicFamily: 'development',
    copyKey: 'coach.quick.developmentRecent',
    bankPriority: 4,
  },
  {
    id: 'waist_development',
    topicFamily: 'body_composition',
    bodyCompSubtopic: 'waist',
    copyKey: 'coach.quick.waistDevelopment',
    bankPriority: 5,
  },
  {
    id: 'weight_development',
    topicFamily: 'body_composition',
    bodyCompSubtopic: 'weight',
    copyKey: 'coach.quick.weightDevelopment',
    bankPriority: 6,
  },
  {
    id: 'body_fat_compare',
    topicFamily: 'body_composition',
    bodyCompSubtopic: 'body_fat',
    copyKey: 'coach.quick.bodyFatCompare',
    bankPriority: 7,
  },
  {
    id: 'body_fat_reduce',
    topicFamily: 'body_composition',
    bodyCompSubtopic: 'body_fat',
    copyKey: 'coach.quick.bodyFatReduce',
    bankPriority: 8,
  },
  {
    id: 'sleep_improve',
    topicFamily: 'sleep',
    copyKey: 'coach.quick.sleepImprove',
    bankPriority: 9,
  },
  {
    id: 'recovery_understand',
    topicFamily: 'recovery',
    copyKey: 'coach.quick.recoveryUnderstand',
    bankPriority: 10,
  },
  {
    id: 'stress_energy',
    topicFamily: 'recovery',
    copyKey: 'coach.quick.stressEnergy',
    bankPriority: 11,
  },
  {
    id: 'movement_enough',
    topicFamily: 'activity',
    copyKey: 'coach.quick.movementEnough',
    bankPriority: 12,
  },
  {
    id: 'training_enough',
    topicFamily: 'training',
    copyKey: 'coach.quick.trainingEnough',
    bankPriority: 13,
  },
  {
    id: 'nutrition_improve',
    topicFamily: 'nutrition',
    copyKey: 'coach.quick.nutritionImprove',
    bankPriority: 14,
  },
  {
    id: 'alcohol_health',
    topicFamily: 'alcohol',
    copyKey: 'coach.quick.alcoholHealth',
    bankPriority: 15,
  },
  {
    id: 'understand_my_data',
    topicFamily: 'general',
    copyKey: 'coach.quick.understandMyData',
    bankPriority: 16,
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
  'health_score_main_driver',
  'understand_my_data',
  'health_overall',
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

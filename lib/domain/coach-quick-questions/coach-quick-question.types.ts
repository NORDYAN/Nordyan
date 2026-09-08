import type { CoachAskFocusType } from '@/shared/coach-language';
import type { WeeklyFocusArea } from '@/lib/domain/weekly-focus';

export const COACH_QUICK_QUESTION_IDS = [
  'health_score_main_driver',
  'health_score_change',
  'health_overall',
  'development_recent',
  'waist_development',
  'weight_development',
  'body_fat_compare',
  'body_fat_reduce',
  'sleep_improve',
  'recovery_understand',
  'stress_energy',
  'movement_enough',
  'training_enough',
  'nutrition_improve',
  'alcohol_health',
  'understand_my_data',
] as const;

export type CoachQuickQuestionId = (typeof COACH_QUICK_QUESTION_IDS)[number];

export const COACH_QUICK_QUESTION_TOPIC_FAMILIES = [
  'health_score',
  'development',
  'body_composition',
  'sleep',
  'recovery',
  'activity',
  'training',
  'nutrition',
  'alcohol',
  'general',
] as const;

export type CoachQuickQuestionTopicFamily =
  (typeof COACH_QUICK_QUESTION_TOPIC_FAMILIES)[number];

export const COACH_QUICK_QUESTION_BODY_COMP_SUBTOPICS = [
  'waist',
  'weight',
  'body_fat',
] as const;

export type CoachQuickQuestionBodyCompSubtopic =
  (typeof COACH_QUICK_QUESTION_BODY_COMP_SUBTOPICS)[number];

export type CoachQuickQuestionCopyKey =
  | 'coach.quick.healthScoreMainDriver'
  | 'coach.quick.healthScoreChange'
  | 'coach.quick.healthOverall'
  | 'coach.quick.developmentRecent'
  | 'coach.quick.waistDevelopment'
  | 'coach.quick.weightDevelopment'
  | 'coach.quick.bodyFatCompare'
  | 'coach.quick.bodyFatReduce'
  | 'coach.quick.sleepImprove'
  | 'coach.quick.recoveryUnderstand'
  | 'coach.quick.stressEnergy'
  | 'coach.quick.movementEnough'
  | 'coach.quick.trainingEnough'
  | 'coach.quick.nutritionImprove'
  | 'coach.quick.alcoholHealth'
  | 'coach.quick.understandMyData';

export type CoachQuickQuestionDefinition = {
  id: CoachQuickQuestionId;
  topicFamily: CoachQuickQuestionTopicFamily;
  bodyCompSubtopic?: CoachQuickQuestionBodyCompSubtopic;
  copyKey: CoachQuickQuestionCopyKey;
  /** Lower is higher priority when scores tie. */
  bankPriority: number;
};

export type CoachQuickQuestionScaleSignal = {
  available: boolean;
  weak: boolean;
  /** True when current-week Weekly Check-in supplied the value. */
  fromWeeklyCheckIn: boolean;
};

export type CoachQuickQuestionSignals = {
  hasHealthContext: boolean;
  healthScoreAvailable: boolean;
  healthScoreChangeComparable: boolean;
  healthScoreDeclined: boolean;
  developmentComparable: boolean;
  waistCurrent: boolean;
  waistComparable: boolean;
  weightCurrent: boolean;
  weightComparable: boolean;
  bodyFatPresentable: boolean;
  bodyFatReferenceReady: boolean;
  focusType: CoachAskFocusType | null;
  weeklyFocusImproveAreas: readonly WeeklyFocusArea[];
  sleep: CoachQuickQuestionScaleSignal;
  energy: CoachQuickQuestionScaleSignal;
  stress: CoachQuickQuestionScaleSignal;
  everydayActivity: CoachQuickQuestionScaleSignal;
  training: CoachQuickQuestionScaleSignal;
  eating: CoachQuickQuestionScaleSignal;
  alcohol: {
    available: boolean;
    elevated: boolean;
    fromWeeklyCheckIn: boolean;
  };
  nutritionBaseline: boolean;
};

export type CoachQuickQuestionScored = {
  id: CoachQuickQuestionId;
  topicFamily: CoachQuickQuestionTopicFamily;
  bodyCompSubtopic?: CoachQuickQuestionBodyCompSubtopic;
  score: number;
  bankPriority: number;
};

export type CoachQuickQuestionSelectorResult = {
  ids: readonly CoachQuickQuestionId[];
  scored: readonly CoachQuickQuestionScored[];
};

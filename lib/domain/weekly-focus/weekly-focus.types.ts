import type { FocusType } from '@/lib/domain/focus-engine';
import type {
  InitialLifestyleAlcoholConsumption,
  InitialLifestyleLessHealthyFoodFrequency,
  InitialLifestyleScale,
} from '@/lib/domain/initial-lifestyle';
import type { ProfileActivityLevel } from '@/lib/domain/profile';
import type {
  WeeklyCheckInAlcoholConsumption,
  WeeklyCheckInScale,
  WeeklyCheckInTrainingFrequency,
} from '@/lib/domain/weekly-check-in';

import type { WEEKLY_FOCUS_ENGINE_VERSION } from './weekly-focus.constants';

export type WeeklyFocusArea =
  | 'everyday_movement'
  | 'training'
  | 'sleep'
  | 'nutrition'
  | 'alcohol'
  | 'recovery';

export type WeeklyFocusMode = 'improve' | 'maintain';

export type WeeklyFocusNeedScore = 0 | 1 | 2 | 3 | 4 | 5;

export type WeeklyFocusAreaScore =
  | { status: 'unknown' }
  | { status: 'known'; needScore: WeeklyFocusNeedScore };

export type WeeklyFocusSelectedArea = {
  area: WeeklyFocusArea;
  mode: WeeklyFocusMode;
  needScore: WeeklyFocusNeedScore;
};

export type WeeklyFocusScores = Record<WeeklyFocusArea, WeeklyFocusAreaScore>;

/**
 * Weekly Check-in fields the engine may read.
 * `planAdherence` is accepted so callers can pass the real record; Beta 1 ignores it.
 */
export type WeeklyFocusCheckInInput = {
  sleepQuality?: WeeklyCheckInScale | null;
  energy?: WeeklyCheckInScale | null;
  stress?: WeeklyCheckInScale | null;
  trainingFrequency?: WeeklyCheckInTrainingFrequency | null;
  everydayActivity?: WeeklyCheckInScale | null;
  eatingQuality?: WeeklyCheckInScale | null;
  alcoholConsumption?: WeeklyCheckInAlcoholConsumption | null;
  planAdherence?: WeeklyCheckInScale | null;
};

export type WeeklyFocusLifestyleInput = {
  sleepQuality?: InitialLifestyleScale | null;
  energy?: InitialLifestyleScale | null;
  stress?: InitialLifestyleScale | null;
  lessHealthyFoodFrequency?: InitialLifestyleLessHealthyFoodFrequency | null;
  everydayActivity?: InitialLifestyleScale | null;
  eatingQuality?: InitialLifestyleScale | null;
  alcoholConsumption?: InitialLifestyleAlcoholConsumption | null;
};

export type WeeklyFocusEngineInput = {
  weeklyCheckIn?: WeeklyFocusCheckInInput | null;
  initialLifestyle?: WeeklyFocusLifestyleInput | null;
  activityLevel?: ProfileActivityLevel | null;
  /** Persisted snapshot `primaryFocus` only. Do not re-run the Focus Engine. */
  primaryFocus?: FocusType | string | null;
  /** Previous week's two selected areas, if any. */
  previousFocuses?: readonly WeeklyFocusArea[] | null;
};

export type WeeklyFocusEngineResult = {
  engineVersion: typeof WEEKLY_FOCUS_ENGINE_VERSION;
  focuses: [WeeklyFocusSelectedArea, WeeklyFocusSelectedArea];
  scores: WeeklyFocusScores;
  recoveryConstraint: boolean;
  /**
   * True only when fewer than two evidence-backed areas existed and the engine
   * filled remaining slots with the documented last-resort pair.
   */
  insufficientEvidenceFallback: boolean;
};

/** Persisted immutable assignment for one local Monday week. */
export type WeeklyFocusAssignment = {
  id: string;
  userId: string;
  weekStartDate: string;
  focuses: [WeeklyFocusSelectedArea, WeeklyFocusSelectedArea];
  recoveryConstraint: boolean;
  engineVersion: string;
  insufficientEvidenceFallback: boolean;
  createdAt: string;
};

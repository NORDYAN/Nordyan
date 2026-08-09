export { generateRecommendation } from './coach-engine';
export {
  COACH_ENGINE_STATUS,
  COACH_ENGINE_VERSION,
  COACH_FALLBACK_RECOMMENDATION,
  COACH_FOCUS_CANDIDATES,
} from './coach-engine.constants';
export type {
  CoachEngineInput,
  CoachEngineOutput,
  CoachEngineResult,
  CoachEngineValidationError,
  CoachPriority,
  CoachRationale,
  CoachRationaleCode,
  CoachRecommendationCategory,
  CoachSafetyFlag,
} from './coach-engine.types';
export {
  buildFocusCandidates,
  filterEligibleCandidates,
  isAthleticHighBmiProfile,
  isUnderweightProfile,
  scaleIntensity,
  selectBestCandidate,
  validateCoachEngineInput,
} from './coach-engine.utils';
export {
  coachSuccessTestVectors,
  coachTestVectors,
  coachValidationTestVectors,
} from './coach-engine.test-vectors';
export type {
  CoachSuccessTestVector,
  CoachTestVector,
  CoachValidationTestVector,
} from './coach-engine.test-vectors';

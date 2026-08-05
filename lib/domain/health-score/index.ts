export type { HealthScore, HealthScoreBreakdown, HealthScoreTrend } from './types';
export { calculateHealthScore } from './health-score-engine';
export { HEALTH_SCORE_ENGINE_STATUS, HEALTH_SCORE_VERSION } from './health-score.constants';
export {
  assertCalibrationInvariants,
  buildCalibrationReviewSummary,
  buildCalibrationReviewTable,
  CALIBRATION_THRESHOLDS,
  calculateAgeAdjustmentLift,
  calculateScoreWithoutAgeContext,
  evaluateCalibrationAssertions,
  formatCalibrationValidationError,
  hasObesityMetricContradiction,
  runCalibrationReview,
} from './health-score.calibration-assertions';
export type {
  CalibrationAssertionId,
  CalibrationAssertionResult,
  CalibrationAssertionViolation,
  CalibrationReviewRow,
  CalibrationReviewSummary,
} from './health-score.calibration-assertions';
export type {
  BmiCategory,
  BodyFatCategory,
  BodyFatMethod,
  HealthScoreActivityLevel,
  HealthScoreBands,
  HealthScoreDriverMetric,
  HealthScoreDriverScores,
  HealthScoreEngineResult,
  HealthScoreExplanation,
  HealthScoreGender,
  HealthScoreInput,
  HealthScoreMetrics,
  HealthScoreResult,
  HealthScoreSubscores,
  HealthScoreValidationError,
  WhtrRisk,
} from './health-score.types';
export {
  healthScoreSuccessTestVectors,
  healthScoreValidationTestVectors,
  healthScoreTestVectors,
  HEALTH_SCORE_TEST_AS_OF_DATE,
} from './health-score.test-vectors';
export type {
  HealthScoreSuccessTestVector,
  HealthScoreTestVector,
  HealthScoreValidationTestVector,
} from './health-score.test-vectors';

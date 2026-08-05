import type {
  HealthScoreDriverMetric,
  HealthScoreDriverScores,
  HealthScoreResult,
} from '@/lib/domain/health-score';

import type { FOCUS_ENGINE_VERSION } from './focus-engine.constants';

export type FocusType =
  | 'reduce_waist'
  | 'improve_activity'
  | 'improve_body_composition'
  | 'improve_weight_balance'
  | 'maintain_current_path';

export type FocusPriority = 'high' | 'medium' | 'low';

export type FocusRationaleCode =
  | 'largest_weighted_opportunity'
  | 'engine_primary_opportunity'
  | 'close_tie_breaker'
  | 'central_adiposity_tie_breaker'
  | 'maintain_strong_profile'
  | 'safety_rule_override'
  | 'insufficient_opportunity';

export type FocusReasoning = {
  driver: HealthScoreDriverMetric;
  currentDriverScore: number;
  targetDriverScore: number;
  supportingDrivers: HealthScoreDriverMetric[];
  rationaleCode: FocusRationaleCode;
};

export type FocusEngineResult = {
  focusVersion: typeof FOCUS_ENGINE_VERSION;
  primaryFocus: FocusType;
  secondaryFocus: FocusType | null;
  expectedScoreGain: number;
  confidence: number;
  priority: FocusPriority;
  reasoning: FocusReasoning;
};

export type FocusEngineValidationError = {
  code: 'VALIDATION';
  message: string;
};

export type FocusEngineOutput =
  | { ok: true; value: FocusEngineResult }
  | { ok: false; error: FocusEngineValidationError };

/**
 * Focus Engine input pairs a frozen HealthScoreResult with the driver scores
 * produced during the same score-engine computation pass.
 */
export type FocusEngineInput = {
  healthScore: HealthScoreResult;
  driverScores: HealthScoreDriverScores;
};

export type FocusCandidate = {
  focus: FocusType;
  opportunity: number;
  drivers: HealthScoreDriverMetric[];
  leadDriver: HealthScoreDriverMetric;
  leadDriverScore: number;
};

export type FocusDriverContext = {
  metric: HealthScoreDriverMetric;
  score: number;
  opportunity: number;
  focus: FocusType;
  blocked: boolean;
};

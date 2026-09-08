import type { AppError, Result } from '@/lib/core';
import { COACH_ENGINE_VERSION } from '@/lib/domain/coach-engine';
import { generateRecommendation } from '@/lib/domain/coach-engine';
import type { CoachEngineResult } from '@/lib/domain/coach-engine';
import { determineFocus } from '@/lib/domain/focus-engine';
import { FOCUS_ENGINE_VERSION } from '@/lib/domain/focus-engine';
import { buildDriverScoresFromHealthScoreInput } from '@/lib/domain/focus-engine/focus-engine.utils';
import type { FocusEngineResult } from '@/lib/domain/focus-engine';
import { calculateHealthScore, HEALTH_SCORE_VERSION } from '@/lib/domain/health-score';
import type {
  HealthScoreDriverScores,
  HealthScoreInput,
  HealthScoreResult,
} from '@/lib/domain/health-score';
import type { ProfileGoal } from '@/lib/domain/profile';
import { resolveOptionalHipCm } from '@/lib/domain/measurement/hip-cm';
import type { CreateSnapshotInput, SnapshotReason } from '@/lib/domain/snapshot';

export type HealthSnapshotPipelineResult = {
  healthScoreInput: HealthScoreInput;
  healthScoreResult: HealthScoreResult;
  driverScores: HealthScoreDriverScores;
  focusResult: FocusEngineResult;
  coachResult: CoachEngineResult;
};

export type HealthSnapshotBodyMeasurements = {
  weightKg: number;
  waistCm: number;
  neckCm: number;
  hipCm?: number | null;
};

export const HEALTH_SNAPSHOT_ENGINE_VERSION = `${HEALTH_SCORE_VERSION}|${FOCUS_ENGINE_VERSION}|${COACH_ENGINE_VERSION}`;

export function runFocusAndCoachPipeline(
  healthScoreInput: HealthScoreInput,
  healthScoreResult: HealthScoreResult,
  userGoal?: ProfileGoal | null,
): Result<Pick<HealthSnapshotPipelineResult, 'driverScores' | 'focusResult' | 'coachResult'>> {
  const driverScores = buildDriverScoresFromHealthScoreInput(healthScoreInput);
  const focusOutput = determineFocus({
    healthScore: healthScoreResult,
    driverScores,
  });

  if (!focusOutput.ok) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: focusOutput.error.message,
      },
    };
  }

  const coachOutput = generateRecommendation({
    focus: focusOutput.value,
    healthScore: healthScoreResult,
    age: healthScoreResult.metrics.ageYears,
    gender: healthScoreInput.gender,
    activityLevel: healthScoreInput.activityLevel,
    userGoal: userGoal ?? undefined,
  });

  if (!coachOutput.ok) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: coachOutput.error.message,
      },
    };
  }

  return {
    ok: true,
    value: {
      driverScores,
      focusResult: focusOutput.value,
      coachResult: coachOutput.value,
    },
  };
}

export function runHealthSnapshotPipeline(
  healthScoreInput: HealthScoreInput,
  userGoal?: ProfileGoal | null,
): Result<HealthSnapshotPipelineResult> {
  const healthScoreOutput = calculateHealthScore(healthScoreInput);
  if (!healthScoreOutput.ok) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: healthScoreOutput.error.message,
      },
    };
  }

  const focusCoachResult = runFocusAndCoachPipeline(
    healthScoreInput,
    healthScoreOutput.value,
    userGoal,
  );
  if (!focusCoachResult.ok) {
    return focusCoachResult;
  }

  return {
    ok: true,
    value: {
      healthScoreInput,
      healthScoreResult: healthScoreOutput.value,
      ...focusCoachResult.value,
    },
  };
}

export function buildCreateSnapshotInputFromPipeline(
  userId: string,
  bodyMeasurements: HealthSnapshotBodyMeasurements,
  pipeline: HealthSnapshotPipelineResult,
  snapshotReason: SnapshotReason,
): Result<CreateSnapshotInput> {
  if (!userId.trim()) {
    return {
      ok: false,
      error: { code: 'VALIDATION', message: 'userId krävs för att skapa en snapshot.' },
    };
  }

  const { weightKg, waistCm, neckCm } = bodyMeasurements;
  const hipCm = resolveOptionalHipCm(bodyMeasurements.hipCm);
  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(waistCm) ||
    !Number.isFinite(neckCm) ||
    weightKg <= 0 ||
    waistCm <= 0 ||
    neckCm <= 0
  ) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: 'Giltiga kroppsmått krävs för snapshot.',
      },
    };
  }

  const { healthScoreResult, driverScores, focusResult, coachResult } = pipeline;

  return {
    ok: true,
    value: {
      userId,
      overallScore: healthScoreResult.score,
      bmiScore: driverScores.bmi,
      whtrScore: driverScores.whtr,
      bodyFatScore: driverScores.body_fat,
      activityScore: driverScores.activity,
      primaryFocus: focusResult.primaryFocus,
      coachRecommendationId: coachResult.recommendationId,
      weightKg,
      waistCm,
      neckCm,
      hipCm: hipCm ?? null,
      engineVersion: HEALTH_SNAPSHOT_ENGINE_VERSION,
      snapshotReason,
      bodyFatPct: healthScoreResult.metrics.bodyFatPct,
      coachDurationMinutes: coachResult.durationMinutes,
      coachFrequencyPerWeek: coachResult.frequencyPerWeek,
    },
  };
}

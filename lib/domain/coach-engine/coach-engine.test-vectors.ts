import { buildDriverScoresFromHealthScoreInput, determineFocus } from '@/lib/domain/focus-engine';
import {
  calculateHealthScore,
  healthScoreSuccessTestVectors,
  type HealthScoreInput,
} from '@/lib/domain/health-score';
import type { ProfileGoal } from '@/lib/domain/profile';

import { generateRecommendation } from './coach-engine';
import type {
  CoachEngineInput,
  CoachPriority,
  CoachRecommendationCategory,
  CoachSafetyFlag,
} from './coach-engine.types';

export type CoachSuccessTestVector = {
  kind: 'success';
  id: string;
  description: string;
  input: CoachEngineInput;
  expected: {
    recommendationId: string;
    category: CoachRecommendationCategory;
    durationMin: number;
    durationMax: number;
    frequencyMin: number;
    frequencyMax: number;
    priority: CoachPriority;
    safetyFlags: CoachSafetyFlag[];
    mustNotIncludeSafetyFlags?: CoachSafetyFlag[];
  };
};

export type CoachValidationTestVector = {
  kind: 'validation';
  id: string;
  description: string;
  validationNotes: string;
  input: Record<string, unknown>;
  expectedErrorMessage: string;
};

export type CoachTestVector = CoachSuccessTestVector | CoachValidationTestVector;

function buildCoachInputFromHealthScoreInput(
  healthScoreInput: HealthScoreInput,
  userGoal?: ProfileGoal,
): CoachEngineInput {
  const healthScoreResult = calculateHealthScore(healthScoreInput);

  if (!healthScoreResult.ok) {
    throw new Error('Health score vector failed');
  }

  const focusInput = {
    healthScore: healthScoreResult.value,
    driverScores: buildDriverScoresFromHealthScoreInput(healthScoreInput),
  };
  const focusResult = determineFocus(focusInput);

  if (!focusResult.ok) {
    throw new Error('Focus engine failed for health score vector');
  }

  return {
    focus: focusResult.value,
    healthScore: healthScoreResult.value,
    age: healthScoreResult.value.metrics.ageYears,
    gender: healthScoreInput.gender,
    activityLevel: healthScoreInput.activityLevel,
    userGoal,
  };
}

function hs(id: string, userGoal?: ProfileGoal): CoachEngineInput {
  const vector = healthScoreSuccessTestVectors.find((entry) => entry.id === id);

  if (!vector) {
    throw new Error(`Missing health score vector: ${id}`);
  }

  return buildCoachInputFromHealthScoreInput(vector.input, userGoal);
}

export const coachSuccessTestVectors: CoachSuccessTestVector[] = [
  {
    kind: 'success',
    id: 'coach-reduce-waist-sedentary-obese-male',
    description: 'reduce_waist with sedentary obese male',
    input: hs('obese-male-55'),
    expected: {
      recommendationId: 'waist_walk_after_dinner_v1',
      category: 'walking',
      durationMin: 25,
      durationMax: 35,
      frequencyMin: 4,
      frequencyMax: 6,
      priority: 'high',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-reduce-waist-active-obese-male',
    description: 'reduce_waist with active obese male',
    input: hs('middle-obese-active-male'),
    expected: {
      recommendationId: 'waist_active_walk_progression_v1',
      category: 'general_activity',
      durationMin: 30,
      durationMax: 40,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'high',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-reduce-waist-moderate-overweight-male',
    description: 'reduce_waist with moderately active overweight male',
    input: hs('overweight-male-40s'),
    expected: {
      recommendationId: 'waist_increase_walking_volume_v1',
      category: 'walking',
      durationMin: 20,
      durationMax: 30,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'medium',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-improve-activity-sedentary',
    description: 'improve_activity for sedentary user',
    input: hs('young-sedentary-male'),
    expected: {
      recommendationId: 'activity_sedentary_walk_start_v1',
      category: 'walking',
      durationMin: 10,
      durationMax: 20,
      frequencyMin: 2,
      frequencyMax: 4,
      priority: 'high',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-improve-activity-light',
    description: 'improve_activity for lightly active user',
    input: (() => {
      const input = hs('average-young-male');
      return { ...input, activityLevel: 'light' as const };
    })(),
    expected: {
      recommendationId: 'activity_light_walk_build_v1',
      category: 'walking',
      durationMin: 15,
      durationMax: 25,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'high',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-improve-activity-moderate',
    description: 'improve_activity for moderately active user',
    input: hs('fit-middle-male'),
    expected: {
      recommendationId: 'activity_moderate_brisk_walk_v1',
      category: 'walking',
      durationMin: 25,
      durationMax: 35,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'high',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-improve-activity-active',
    description: 'improve_activity for active user',
    input: (() => {
      const input = hs('middle-high-whtr-male');
      return { ...input, activityLevel: 'active' as const };
    })(),
    expected: {
      recommendationId: 'activity_active_structured_movement_v1',
      category: 'general_activity',
      durationMin: 25,
      durationMax: 35,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'high',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-improve-activity-very-active',
    description: 'improve_activity for very active user prefers safe walking over strength',
    input: (() => {
      const base = hs('lean-young-male-runner');
      return {
        ...base,
        focus: {
          ...base.focus,
          primaryFocus: 'improve_activity' as const,
          reasoning: { ...base.focus.reasoning, driver: 'activity' as const },
        },
      };
    })(),
    expected: {
      recommendationId: 'activity_active_structured_movement_v1',
      category: 'general_activity',
      durationMin: 25,
      durationMax: 35,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'low',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-improve-body-composition-sedentary',
    description: 'improve_body_composition for sedentary-leaning female',
    input: hs('overweight-female-50s'),
    expected: {
      recommendationId: 'body_comp_daily_walk_v1',
      category: 'walking',
      durationMin: 20,
      durationMax: 30,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'medium',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-improve-body-composition-moderate',
    description: 'improve_body_composition for average middle female',
    input: hs('average-middle-female'),
    expected: {
      recommendationId: 'body_comp_walk_strength_combo_v1',
      category: 'general_activity',
      durationMin: 25,
      durationMax: 35,
      frequencyMin: 2,
      frequencyMax: 4,
      priority: 'medium',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-improve-body-composition-active',
    description: 'improve_body_composition for active user',
    input: (() => {
      const input = hs('obese-male-55');
      return {
        ...input,
        focus: {
          ...input.focus,
          primaryFocus: 'improve_body_composition' as const,
          reasoning: { ...input.focus.reasoning, driver: 'body_fat' as const },
        },
        activityLevel: 'active' as const,
      };
    })(),
    expected: {
      recommendationId: 'body_comp_walk_strength_combo_v1',
      category: 'general_activity',
      durationMin: 20,
      durationMax: 30,
      frequencyMin: 2,
      frequencyMax: 4,
      priority: 'high',
      safetyFlags: ['low_confidence_conservative_scaling'],
    },
  },
  {
    kind: 'success',
    id: 'coach-weight-balance-overweight',
    description: 'improve_weight_balance for overweight profile',
    input: (() => {
      const input = hs('overweight-male-40s');
      return {
        ...input,
        focus: {
          ...input.focus,
          primaryFocus: 'improve_weight_balance' as const,
          reasoning: { ...input.focus.reasoning, driver: 'bmi' as const },
        },
      };
    })(),
    expected: {
      recommendationId: 'weight_balance_walking_v1',
      category: 'walking',
      durationMin: 20,
      durationMax: 30,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'medium',
      safetyFlags: [],
      mustNotIncludeSafetyFlags: ['underweight_no_weight_loss'],
    },
  },
  {
    kind: 'success',
    id: 'coach-weight-balance-underweight',
    description: 'improve_weight_balance for underweight user — no weight-loss action',
    input: hs('underweight-young-female'),
    expected: {
      recommendationId: 'weight_balance_gentle_nutrition_v1',
      category: 'nutrition_habit',
      durationMin: 10,
      durationMax: 10,
      frequencyMin: 5,
      frequencyMax: 5,
      priority: 'low',
      safetyFlags: [],
      mustNotIncludeSafetyFlags: ['underweight_no_weight_loss'],
    },
  },
  {
    kind: 'success',
    id: 'coach-weight-balance-athletic-high-bmi',
    description: 'Athletic high-BMI user gets measurement, not generic weight loss',
    input: (() => {
      const input = hs('athletic-male-lifter');
      return {
        ...input,
        focus: {
          ...input.focus,
          primaryFocus: 'improve_weight_balance' as const,
          reasoning: { ...input.focus.reasoning, driver: 'bmi' as const },
        },
      };
    })(),
    expected: {
      recommendationId: 'weight_balance_measurement_check_v1',
      category: 'measurement_follow_up',
      durationMin: 5,
      durationMax: 5,
      frequencyMin: 1,
      frequencyMax: 1,
      priority: 'low',
      safetyFlags: ['athletic_high_bmi_no_generic_weight_loss', 'focus_safety_rule_applied'],
      mustNotIncludeSafetyFlags: ['underweight_no_weight_loss'],
    },
  },
  {
    kind: 'success',
    id: 'coach-older-adult-maintain',
    description: 'Older adult maintain path without intensity scaling on check-in',
    input: hs('older-lean-male-65'),
    expected: {
      recommendationId: 'maintain_weekly_check_in_v1',
      category: 'maintain',
      durationMin: 10,
      durationMax: 10,
      frequencyMin: 1,
      frequencyMax: 1,
      priority: 'low',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-low-confidence-obese-male',
    description: 'Low-confidence focus result scales conservatively',
    input: hs('obese-male-55'),
    expected: {
      recommendationId: 'waist_walk_after_dinner_v1',
      category: 'walking',
      durationMin: 20,
      durationMax: 30,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'high',
      safetyFlags: ['low_confidence_conservative_scaling'],
    },
  },
  {
    kind: 'success',
    id: 'coach-high-confidence-maintain-runner',
    description: 'High-confidence maintain for strong runner profile',
    input: hs('lean-young-male-runner'),
    expected: {
      recommendationId: 'maintain_routine_consistency_v1',
      category: 'maintain',
      durationMin: 15,
      durationMax: 15,
      frequencyMin: 2,
      frequencyMax: 2,
      priority: 'low',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-maintain-athletic-female',
    description: 'maintain_current_path for athletic female cyclist',
    input: hs('athletic-female-cyclist'),
    expected: {
      recommendationId: 'maintain_routine_consistency_v1',
      category: 'maintain',
      durationMin: 15,
      durationMax: 15,
      frequencyMin: 2,
      frequencyMax: 2,
      priority: 'low',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-maintain-edge-athlete',
    description: 'maintain_current_path for edge athletic high-BMI profile',
    input: hs('edge-athlete-high-bmi'),
    expected: {
      recommendationId: 'maintain_routine_consistency_v1',
      category: 'maintain',
      durationMin: 15,
      durationMax: 15,
      frequencyMin: 2,
      frequencyMax: 2,
      priority: 'low',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-safety-sedentary-no-strength',
    description: 'Sedentary user with improve_activity never gets strength training',
    input: (() => {
      const input = hs('young-sedentary-male');
      return {
        ...input,
        activityLevel: 'sedentary' as const,
      };
    })(),
    expected: {
      recommendationId: 'activity_sedentary_walk_start_v1',
      category: 'walking',
      durationMin: 10,
      durationMax: 20,
      frequencyMin: 2,
      frequencyMax: 4,
      priority: 'high',
      safetyFlags: [],
      mustNotIncludeSafetyFlags: ['sedentary_no_advanced_training'],
    },
  },
  {
    kind: 'success',
    id: 'coach-reduce-waist-active-obese-male-standard-confidence',
    description: 'Active reduce_waist for obese male with standard confidence (0.77)',
    input: hs('middle-obese-active-male'),
    expected: {
      recommendationId: 'waist_active_walk_progression_v1',
      category: 'general_activity',
      durationMin: 30,
      durationMax: 40,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'high',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-body-comp-obese-female',
    description: 'improve_body_composition for obese sedentary female',
    input: hs('obese-female-60'),
    expected: {
      recommendationId: 'body_comp_daily_walk_v1',
      category: 'walking',
      durationMin: 20,
      durationMax: 30,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'medium',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-weight-balance-active-overweight',
    description: 'Active overweight user gets movement recommendation',
    input: (() => {
      const input = hs('middle-obese-active-male');
      return {
        ...input,
        focus: {
          ...input.focus,
          primaryFocus: 'improve_weight_balance' as const,
          reasoning: { ...input.focus.reasoning, driver: 'bmi' as const },
        },
      };
    })(),
    expected: {
      recommendationId: 'weight_balance_active_movement_v1',
      category: 'general_activity',
      durationMin: 25,
      durationMax: 35,
      frequencyMin: 2,
      frequencyMax: 4,
      priority: 'high',
      safetyFlags: [],
    },
  },
  {
    kind: 'success',
    id: 'coach-goal-lose-weight-no-extreme',
    description: 'User goal lose_weight still yields safe walking recommendation',
    input: hs('overweight-male-40s', 'lose_weight'),
    expected: {
      recommendationId: 'waist_increase_walking_volume_v1',
      category: 'walking',
      durationMin: 20,
      durationMax: 30,
      frequencyMin: 3,
      frequencyMax: 5,
      priority: 'medium',
      safetyFlags: [],
    },
  },
];

export const coachValidationTestVectors: CoachValidationTestVector[] = [
  {
    kind: 'validation',
    id: 'coach-validation-missing-focus',
    description: 'Missing focus result',
    validationNotes: 'focus is required',
    input: {
      healthScore: { score: 70 },
      age: 40,
      gender: 'male',
      activityLevel: 'moderate',
    },
    expectedErrorMessage: 'focus is required',
  },
  {
    kind: 'validation',
    id: 'coach-validation-invalid-age',
    description: 'Age out of supported range',
    validationNotes: 'age must be between 18 and 100',
    input: {
      focus: {
        primaryFocus: 'improve_activity',
        expectedScoreGain: 3,
        confidence: 0.7,
        priority: 'medium',
        reasoning: { driver: 'activity' },
      },
      healthScore: { bands: { bmiCategory: 'normal' }, metrics: { whtr: 0.5 } },
      age: 8,
      gender: 'female',
      activityLevel: 'light',
    },
    expectedErrorMessage: 'age must be between 18 and 100',
  },
  {
    kind: 'validation',
    id: 'coach-validation-invalid-activity',
    description: 'Unsupported activity level',
    validationNotes: 'activityLevel is invalid',
    input: {
      focus: {
        primaryFocus: 'maintain_current_path',
        expectedScoreGain: 0,
        confidence: 0.8,
        priority: 'low',
        reasoning: { driver: 'activity' },
      },
      healthScore: { bands: { bmiCategory: 'normal' }, metrics: { whtr: 0.45 } },
      age: 35,
      gender: 'male',
      activityLevel: 'extreme',
    },
    expectedErrorMessage: 'activityLevel is invalid',
  },
];

export const coachTestVectors: CoachTestVector[] = [
  ...coachSuccessTestVectors,
  ...coachValidationTestVectors,
];

export function runCoachVectorTests(): {
  passed: number;
  failed: number;
  rows: string[];
  failures: string[];
} {
  let passed = 0;
  let failed = 0;
  const rows: string[] = [];
  const failures: string[] = [];

  for (const vector of coachTestVectors) {
    if (vector.kind === 'validation') {
      const output = generateRecommendation(vector.input as never);

      if (!output.ok && output.error.message === vector.expectedErrorMessage) {
        passed += 1;
        rows.push(`${vector.id}\tVALIDATION\t-\t-\t-\t-\t-\tPASS`);
      } else {
        failed += 1;
        const message = output.ok ? 'expected validation error' : output.error.message;
        failures.push(`${vector.id}: expected "${vector.expectedErrorMessage}", got "${message}"`);
        rows.push(`${vector.id}\tVALIDATION\t-\t-\t-\t-\t-\tFAIL`);
      }

      continue;
    }

    const output = generateRecommendation(vector.input);

    if (!output.ok) {
      failed += 1;
      failures.push(`${vector.id}: engine error ${output.error.message}`);
      rows.push(`${vector.id}\tERROR\t-\t-\t-\t-\t-\tFAIL`);
      continue;
    }

    const result = output.value;
    const { expected } = vector;
    const checks = [
      result.recommendationId === expected.recommendationId,
      result.category === expected.category,
      result.durationMinutes >= expected.durationMin &&
        result.durationMinutes <= expected.durationMax,
      result.frequencyPerWeek >= expected.frequencyMin &&
        result.frequencyPerWeek <= expected.frequencyMax,
      result.priority === expected.priority,
      expected.safetyFlags.every((flag) => result.safetyFlags.includes(flag)),
      (expected.mustNotIncludeSafetyFlags ?? []).every(
        (flag) => !result.safetyFlags.includes(flag),
      ),
      result.expectedScoreGain === vector.input.focus.expectedScoreGain,
    ];
    const ok = checks.every(Boolean);

    if (ok) {
      passed += 1;
    } else {
      failed += 1;
      failures.push(
        `${vector.id}: got ${result.recommendationId}/${result.category} ` +
          `dur=${result.durationMinutes} freq=${result.frequencyPerWeek} ` +
          `prio=${result.priority} flags=${result.safetyFlags.join('|')}`,
      );
    }

    rows.push(
      [
        vector.id,
        result.recommendationId,
        result.category,
        String(result.durationMinutes),
        String(result.frequencyPerWeek),
        result.priority,
        result.safetyFlags.join('|') || '-',
        ok ? 'PASS' : 'FAIL',
      ].join('\t'),
    );
  }

  return { passed, failed, rows, failures };
}

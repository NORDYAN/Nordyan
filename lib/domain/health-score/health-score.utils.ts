import {
  AGE_ADJUSTED_WEIGHTS,
  BMI_PLATEAUS,
  BODY_COMPOSITION_WEIGHTS,
  BODY_FAT_PLATEAUS,
  BODY_FAT_REFERENCE_MIDPOINTS,
  CALIBRATION_SCORING,
  CM_PER_INCH,
  DEURENBERG_COEFFICIENTS,
  EXPLANATION_NEUTRAL_SCORE,
  FINAL_SCORE_WEIGHTS,
  INPUT_LIMITS,
  US_NAVY_COEFFICIENTS,
  WHTR_AGE_RELAXATION,
  WHTR_PLATEAUS,
} from './health-score.constants';
import type {
  BmiCategory,
  BodyFatCategory,
  BodyFatMethod,
  HealthScoreDriverMetric,
  HealthScoreDriverScores,
  HealthScoreExplanation,
  HealthScoreGender,
  HealthScoreInput,
  HealthScoreValidationError,
  WhtrRisk,
} from './health-score.types';

type Plateau = {
  max: number;
  scoreMin: number;
  scoreMax: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundToInteger(value: number): number {
  return Math.round(value);
}

export function cmToInches(cm: number): number {
  return cm / CM_PER_INCH;
}

export function calculateAgeYears(dateOfBirth: string, asOfDate: string): number {
  const birth = parseIsoDateParts(dateOfBirth);
  const asOf = parseIsoDateParts(asOfDate);

  if (!birth || !asOf) {
    return NaN;
  }

  let age = asOf.year - birth.year;

  if (asOf.month < birth.month || (asOf.month === birth.month && asOf.day < birth.day)) {
    age -= 1;
  }

  return age;
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function calculateWhtr(waistCm: number, heightCm: number): number {
  return waistCm / heightCm;
}

export function calculateMaleUsNavyBodyFatPct(
  waistCm: number,
  neckCm: number,
  heightCm: number,
): number {
  const waistIn = cmToInches(waistCm);
  const neckIn = cmToInches(neckCm);
  const heightIn = cmToInches(heightCm);
  const waistNeckDiff = waistIn - neckIn;

  if (waistNeckDiff <= 0) {
    return NaN;
  }

  const { waistNeckLog, heightLog, constant } = US_NAVY_COEFFICIENTS.male;

  return waistNeckLog * Math.log10(waistNeckDiff) - heightLog * Math.log10(heightIn) + constant;
}

export function calculateFemaleUsNavyBodyFatPct(
  waistCm: number,
  neckCm: number,
  hipCm: number,
  heightCm: number,
): number {
  const waistIn = cmToInches(waistCm);
  const neckIn = cmToInches(neckCm);
  const hipIn = cmToInches(hipCm);
  const heightIn = cmToInches(heightCm);
  const sum = waistIn + hipIn - neckIn;

  if (sum <= 0) {
    return NaN;
  }

  const { sumLog, heightLog, constant } = US_NAVY_COEFFICIENTS.female;

  return sumLog * Math.log10(sum) - heightLog * Math.log10(heightIn) - constant;
}

export function calculateDeurenbergBodyFatPct(
  bmi: number,
  ageYears: number,
  gender: HealthScoreGender,
): number {
  const sexValue = gender === 'male' ? 1 : 0;
  const { bmi: bmiCoef, age: ageCoef, sexMale, constant } = DEURENBERG_COEFFICIENTS;

  return bmiCoef * bmi + ageCoef * ageYears - sexMale * sexValue - constant;
}

export function resolveBodyFatPct(
  input: HealthScoreInput,
  bmi: number,
  ageYears: number,
): { bodyFatPct: number; method: BodyFatMethod } {
  if (input.gender === 'male') {
    return {
      bodyFatPct: calculateMaleUsNavyBodyFatPct(input.waistCm, input.neckCm, input.heightCm),
      method: 'us_navy',
    };
  }

  if (input.gender === 'female' && input.hipCm !== undefined) {
    return {
      bodyFatPct: calculateFemaleUsNavyBodyFatPct(
        input.waistCm,
        input.neckCm,
        input.hipCm,
        input.heightCm,
      ),
      method: 'us_navy',
    };
  }

  return {
    bodyFatPct: calculateDeurenbergBodyFatPct(bmi, ageYears, input.gender),
    method: 'deurenberg',
  };
}

export function adjustBodyFatPctForScoring(
  bodyFatPct: number,
  method: BodyFatMethod,
): number {
  if (method !== 'us_navy') {
    return bodyFatPct;
  }

  const { navyBodyFatOutlierFloorPct, navyBodyFatScoringMinimumPct } = CALIBRATION_SCORING;

  if (bodyFatPct >= navyBodyFatOutlierFloorPct) {
    return bodyFatPct;
  }

  const blendRatio = clamp(
    (navyBodyFatOutlierFloorPct - bodyFatPct) / navyBodyFatOutlierFloorPct,
    0,
    1,
  );

  return bodyFatPct + blendRatio * (navyBodyFatScoringMinimumPct - bodyFatPct);
}

export function hasObesityMetricContradiction(
  gender: HealthScoreGender,
  metrics: { bmi: number; whtr: number; bodyFatPct: number },
  bands: { bodyFatCategory: BodyFatCategory },
): boolean {
  const hasHealthyWhtr = metrics.whtr < CALIBRATION_SCORING.healthyWhtrForObesityContradiction;
  const hasAthleticBodyFat =
    bands.bodyFatCategory === 'athlete' ||
    (gender === 'male' && metrics.bodyFatPct <= 13) ||
    (gender === 'female' && metrics.bodyFatPct <= 20) ||
    (gender === 'other' && metrics.bodyFatPct <= 18);

  return hasHealthyWhtr && hasAthleticBodyFat;
}

export function isRuntimeAnthropometricEdgeCase(
  input: HealthScoreInput,
  metrics: { bmi: number; whtr: number; bodyFatPct: number },
): boolean {
  return (
    input.heightCm <= INPUT_LIMITS.heightCm.min + 1 ||
    input.heightCm >= INPUT_LIMITS.heightCm.max - 1 ||
    input.weightKg <= INPUT_LIMITS.weightKg.min + 1 ||
    metrics.whtr <= CALIBRATION_SCORING.lowWhtrDiminishStart ||
    metrics.bodyFatPct < CALIBRATION_SCORING.navyBodyFatOutlierFloorPct ||
    metrics.bmi <= 18.5 ||
    metrics.bmi >= 30
  );
}

export function applyCalibrationScoreCaps(
  score: number,
  input: HealthScoreInput,
  metrics: { bmi: number; whtr: number; bodyFatPct: number },
  bands: { bmiCategory: BmiCategory; bodyFatCategory: BodyFatCategory },
): number {
  let cappedScore = score;

  if (metrics.bmi < CALIBRATION_SCORING.severeUnderweightBmi) {
    cappedScore = Math.min(cappedScore, CALIBRATION_SCORING.severeUnderweightMaxScore);
  }

  if (
    bands.bmiCategory === 'obesity' &&
    !hasObesityMetricContradiction(input.gender, metrics, bands)
  ) {
    cappedScore = Math.min(cappedScore, CALIBRATION_SCORING.obeseScoreCap);
  }

  if (isRuntimeAnthropometricEdgeCase(input, metrics)) {
    cappedScore = Math.min(cappedScore, CALIBRATION_SCORING.anthropometricEdgeMaxScore);
  }

  return cappedScore;
}

export function scoreFromPlateaus(value: number, plateaus: readonly Plateau[]): number {
  let previousMax = 0;

  for (const plateau of plateaus) {
    if (value <= plateau.max) {
      const rangeMin = previousMax;
      const rangeMax = plateau.max;

      if (!Number.isFinite(rangeMax)) {
        return plateau.scoreMin;
      }

      if (rangeMax === rangeMin) {
        return plateau.scoreMax;
      }

      const ratio = clamp((value - rangeMin) / (rangeMax - rangeMin), 0, 1);
      return plateau.scoreMax - ratio * (plateau.scoreMax - plateau.scoreMin);
    }

    previousMax = plateau.max;
  }

  const last = plateaus[plateaus.length - 1];
  return last?.scoreMin ?? 0;
}

export function scoreBmi(bmi: number): number {
  return roundToInteger(scoreFromPlateaus(bmi, BMI_PLATEAUS));
}

export function scoreWhtr(whtr: number, thresholdShift = 0): number {
  const adjusted = Math.max(0, whtr - thresholdShift);
  let score = scoreFromPlateaus(adjusted, WHTR_PLATEAUS);

  if (adjusted < CALIBRATION_SCORING.lowWhtrDiminishStart) {
    const { lowWhtrDiminishFloor, lowWhtrDiminishStart, lowWhtrMaxScore } = CALIBRATION_SCORING;
    const scale = clamp(
      (adjusted - lowWhtrDiminishFloor) / (lowWhtrDiminishStart - lowWhtrDiminishFloor),
      0,
      1,
    );
    const diminishedMaxScore = 78 + scale * (lowWhtrMaxScore - 78);

    score = Math.min(score, diminishedMaxScore);
  }

  return roundToInteger(score);
}

export function scoreBodyFat(bodyFatPct: number, gender: HealthScoreGender): number {
  const plateaus = BODY_FAT_PLATEAUS[gender];
  return roundToInteger(scoreFromPlateaus(bodyFatPct, plateaus));
}

export function getBodyFatReferenceMidpoint(
  ageYears: number,
  gender: HealthScoreGender,
): number {
  const table = BODY_FAT_REFERENCE_MIDPOINTS[gender];
  let midpoint = table[0]?.midpoint ?? 22;

  for (const entry of table) {
    if (ageYears >= entry.minAge) {
      midpoint = entry.midpoint;
    }
  }

  return midpoint;
}

export function scoreAgeAdjustedBodyFat(
  bodyFatPct: number,
  ageYears: number,
  gender: HealthScoreGender,
): number {
  const referenceMidpoint = getBodyFatReferenceMidpoint(ageYears, gender);
  const delta = bodyFatPct - referenceMidpoint;

  if (delta <= -5) {
    return 100;
  }

  if (delta <= 0) {
    return roundToInteger(clamp(100 + delta * 1, 90, 100));
  }

  if (delta <= 5) {
    return roundToInteger(clamp(100 - delta * 3, 75, 100));
  }

  if (delta <= 15) {
    return roundToInteger(clamp(85 - (delta - 5) * 2, 45, 85));
  }

  return roundToInteger(clamp(65 - (delta - 15) * 3, 10, 65));
}

export function scoreAgeAdjustedWhtr(whtr: number, ageYears: number): number {
  const thresholdShift =
    ageYears >= WHTR_AGE_RELAXATION.minAge ? WHTR_AGE_RELAXATION.thresholdShift : 0;

  return scoreWhtr(whtr, thresholdShift);
}

export function classifyBmi(bmi: number): BmiCategory {
  if (bmi < 18.5) {
    return 'underweight';
  }

  if (bmi < 25) {
    return 'normal';
  }

  if (bmi < 30) {
    return 'overweight';
  }

  return 'obesity';
}

export function classifyWhtr(whtr: number): WhtrRisk {
  if (whtr < 0.4) {
    return 'low';
  }

  if (whtr < 0.5) {
    return 'moderate';
  }

  if (whtr < 0.6) {
    return 'elevated';
  }

  return 'high';
}

export function classifyBodyFat(bodyFatPct: number, gender: HealthScoreGender): BodyFatCategory {
  if (gender === 'male') {
    if (bodyFatPct <= 13) return 'athlete';
    if (bodyFatPct <= 17) return 'fitness';
    if (bodyFatPct <= 24) return 'average';
    if (bodyFatPct <= 29) return 'high';
    return 'very_high';
  }

  if (gender === 'female') {
    if (bodyFatPct <= 20) return 'athlete';
    if (bodyFatPct <= 24) return 'fitness';
    if (bodyFatPct <= 31) return 'average';
    if (bodyFatPct <= 36) return 'high';
    return 'very_high';
  }

  if (bodyFatPct <= 18) return 'athlete';
  if (bodyFatPct <= 22) return 'fitness';
  if (bodyFatPct <= 28) return 'average';
  if (bodyFatPct <= 33) return 'high';
  return 'very_high';
}

export function buildHealthScoreExplanation(
  driverScores: HealthScoreDriverScores,
): HealthScoreExplanation {
  const driverOrder: HealthScoreDriverMetric[] = [
    'bmi',
    'whtr',
    'body_fat',
    'activity',
    'age_adjusted_body_fat',
    'age_adjusted_whtr',
  ];

  const finalWeights: Record<HealthScoreDriverMetric, number> = {
    bmi: FINAL_SCORE_WEIGHTS.bodyComposition * BODY_COMPOSITION_WEIGHTS.bmi,
    whtr: FINAL_SCORE_WEIGHTS.bodyComposition * BODY_COMPOSITION_WEIGHTS.whtr,
    body_fat: FINAL_SCORE_WEIGHTS.bodyComposition * BODY_COMPOSITION_WEIGHTS.bodyFat,
    activity: FINAL_SCORE_WEIGHTS.activity,
    age_adjusted_body_fat:
      FINAL_SCORE_WEIGHTS.ageAdjustedHealth * AGE_ADJUSTED_WEIGHTS.bodyFat,
    age_adjusted_whtr: FINAL_SCORE_WEIGHTS.ageAdjustedHealth * AGE_ADJUSTED_WEIGHTS.whtr,
  };

  const contributions = driverOrder.map((metric) => {
    const score = driverScores[metric];
    const delta = finalWeights[metric] * (score - EXPLANATION_NEUTRAL_SCORE);

    return {
      metric,
      delta,
      absDelta: Math.abs(delta),
    };
  });

  return {
    biggestStrength: pickByMax(contributions, (entry) => entry.delta),
    biggestOpportunity: pickByMin(contributions, (entry) => entry.delta),
    primaryDriver: pickByMax(contributions, (entry) => entry.absDelta),
  };
}

function pickByMax<T extends { metric: HealthScoreDriverMetric }>(
  entries: T[],
  getValue: (entry: T) => number,
): HealthScoreDriverMetric {
  let selected = entries[0]?.metric ?? 'bmi';
  let bestValue = Number.NEGATIVE_INFINITY;

  for (const entry of entries) {
    const value = getValue(entry);

    if (value > bestValue) {
      bestValue = value;
      selected = entry.metric;
    }
  }

  return selected;
}

function pickByMin<T extends { metric: HealthScoreDriverMetric }>(
  entries: T[],
  getValue: (entry: T) => number,
): HealthScoreDriverMetric {
  let selected = entries[0]?.metric ?? 'bmi';
  let bestValue = Number.POSITIVE_INFINITY;

  for (const entry of entries) {
    const value = getValue(entry);

    if (value < bestValue) {
      bestValue = value;
      selected = entry.metric;
    }
  }

  return selected;
}

export function validateHealthScoreInput(
  input: HealthScoreInput,
): HealthScoreValidationError | null {
  if (!isValidIsoDate(input.dateOfBirth)) {
    return { code: 'VALIDATION', message: 'dateOfBirth must be a valid ISO date string.' };
  }

  if (!isValidIsoDate(input.asOfDate)) {
    return { code: 'VALIDATION', message: 'asOfDate must be a valid ISO date string.' };
  }

  const ageYears = calculateAgeYears(input.dateOfBirth, input.asOfDate);

  if (!Number.isFinite(ageYears)) {
    return { code: 'VALIDATION', message: 'dateOfBirth must be a valid ISO date string.' };
  }

  if (ageYears < 18 || ageYears > 100) {
    return { code: 'VALIDATION', message: 'Age must be between 18 and 100 years.' };
  }

  if (input.waistCm <= input.neckCm) {
    return { code: 'VALIDATION', message: 'waistCm must be greater than neckCm.' };
  }

  if (!isWithinRange(input.heightCm, INPUT_LIMITS.heightCm)) {
    return { code: 'VALIDATION', message: 'heightCm is outside the supported range.' };
  }

  if (!isWithinRange(input.weightKg, INPUT_LIMITS.weightKg)) {
    return { code: 'VALIDATION', message: 'weightKg is outside the supported range.' };
  }

  if (!isWithinRange(input.waistCm, INPUT_LIMITS.waistCm)) {
    return { code: 'VALIDATION', message: 'waistCm is outside the supported range.' };
  }

  if (!isWithinRange(input.neckCm, INPUT_LIMITS.neckCm)) {
    return { code: 'VALIDATION', message: 'neckCm is outside the supported range.' };
  }

  if (input.hipCm !== undefined && !isWithinRange(input.hipCm, INPUT_LIMITS.hipCm)) {
    return { code: 'VALIDATION', message: 'hipCm is outside the supported range.' };
  }

  return null;
}

function isWithinRange(value: number, limits: { min: number; max: number }): boolean {
  return Number.isFinite(value) && value >= limits.min && value <= limits.max;
}

function isValidIsoDate(value: string): boolean {
  return parseIsoDateParts(value) !== null;
}

function parseIsoDateParts(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  return { year, month, day };
}

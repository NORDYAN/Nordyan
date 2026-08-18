/**
 * NORDYAN Body Fat Reference — source citation.
 *
 * Population / fitness reference only. Not a diagnosis, clinical cutoff,
 * optimal-health target, or proof that lower body fat is always healthier.
 *
 * Distinct from Health Score scoring midpoints and category labels.
 */
export const BODY_FAT_REFERENCE_SOURCE_ID = 'acsm_getp_10_11_cooper_institute' as const;

export const BODY_FAT_REFERENCE_SOURCE = {
  id: BODY_FAT_REFERENCE_SOURCE_ID,
  title: "ACSM's Guidelines for Exercise Testing and Prescription, 10th and 11th editions",
  tables: 'Tables 4.4 (men) and 4.5 (women) — percent body fat percentiles',
  adaptedFrom:
    'The Cooper Institute, Physical Fitness Assessments and Norms for Adults and Law Enforcement (Dallas, TX). Skinfold-derived percent body fat; Cooper Clinic adult sample, not a nationally representative DXA/BIA survey.',
  method: 'skinfold',
  /**
   * ACSM/Cooper fitness percentiles: lower body-fat % maps to a higher fitness
   * percentile (99 = leanest tabulated). Never invert this.
   */
  fitnessPercentileOrientation: 'higher_percentile_means_lower_body_fat' as const,
} as const;

export const BODY_FAT_REFERENCE_FITNESS_PERCENTILES = [
  99, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 1,
] as const;

export type BodyFatReferenceFitnessPercentile =
  (typeof BODY_FAT_REFERENCE_FITNESS_PERCENTILES)[number];

/** Absolute body-fat percentage points used as "near median". Matches typical table spacing. */
export const BODY_FAT_REFERENCE_NEAR_MEDIAN_ABS_DELTA = 0.5;

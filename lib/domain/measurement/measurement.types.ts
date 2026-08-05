/**
 * Measurement Module v1.0 — domain types.
 *
 * A Measurement is a time-stamped health reading event.
 * It is not a Snapshot. Engine outputs belong to separate domain modules.
 */

/** ISO calendar date (YYYY-MM-DD) representing when the reading was taken. */
export type MeasurementDate = string;

/**
 * Persisted measurement record.
 * Append-only in v1.0; corrections receive a new measurement event.
 */
export type Measurement = {
  id: string;
  userId: string;
  measuredAt: MeasurementDate;
  weightKg: number;
  waistCm: number;
  neckCm: number;
  createdAt: string;
};

/** Input required to create a new measurement event. */
export type CreateMeasurementInput = {
  userId: string;
  measuredAt: MeasurementDate;
  weightKg: number;
  waistCm: number;
  neckCm: number;
};

import { INPUT_LIMITS } from '@/lib/domain/health-score/health-score.constants';

export const HIP_CM_LIMITS = INPUT_LIMITS.hipCm;

/** Engine-supported hip circumference. Never invents a default. */
export function isSupportedHipCm(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= HIP_CM_LIMITS.min &&
    value <= HIP_CM_LIMITS.max
  );
}

/**
 * Pass-through for a real hip reading.
 * Returns undefined when missing or invalid so callers never persist/impute a fake value.
 */
export function resolveOptionalHipCm(value: number | null | undefined): number | undefined {
  if (typeof value !== 'number' || !isSupportedHipCm(value)) {
    return undefined;
  }

  return value;
}

import type {
  InitialLifestylePolarity,
  InitialLifestyleScaleField,
} from './initial-lifestyle.types';

/**
 * Explicit polarity so later Coach logic cannot assume higher = better.
 * Stress is not inverted. No combined score. No averaging.
 */
export const INITIAL_LIFESTYLE_SCALE_POLARITY = {
  sleepQuality: 'higher_better',
  energy: 'higher_better',
  stress: 'higher_worse',
  everydayActivity: 'higher_better',
  eatingQuality: 'higher_better',
} as const satisfies Record<InitialLifestyleScaleField, InitialLifestylePolarity>;

export function getInitialLifestyleScalePolarity(
  field: InitialLifestyleScaleField,
): InitialLifestylePolarity {
  return INITIAL_LIFESTYLE_SCALE_POLARITY[field];
}

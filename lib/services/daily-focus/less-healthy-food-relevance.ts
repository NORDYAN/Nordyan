import type { InitialLifestyleLessHealthyFoodFrequency, InitialLifestyleScale } from '@/lib/domain/initial-lifestyle';
import type { WeeklyCheckInScale } from '@/lib/domain/weekly-check-in';

const RELEVANT_FREQUENCIES = new Set<InitialLifestyleLessHealthyFoodFrequency>([
  'two_three',
  'four_six',
  'daily',
]);

export type LessHealthyFoodRelevanceInput = {
  lessHealthyFoodFrequency: InitialLifestyleLessHealthyFoodFrequency | null | undefined;
  eatingQuality: WeeklyCheckInScale | InitialLifestyleScale | null | undefined;
};

export function resolveLessHealthyFoodRelevant(input: LessHealthyFoodRelevanceInput): boolean {
  const frequency = input.lessHealthyFoodFrequency ?? null;
  if (frequency == null || !RELEVANT_FREQUENCIES.has(frequency)) {
    return false;
  }

  const eatingQuality = input.eatingQuality ?? null;
  if (eatingQuality != null && eatingQuality >= 4) {
    return false;
  }

  return true;
}

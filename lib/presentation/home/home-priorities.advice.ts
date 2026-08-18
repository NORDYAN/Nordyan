import { liveArray, liveCopy, localizeAdviceCopy, t } from '@/lib/i18n';

import type { HomeAdviceCategory, HomeAdviceItem } from './home-priorities.types';

const HOME_GENERAL_ADVICE_IDS = [
  'activity_short_walk',
  'activity_break_sitting',
  'activity_take_stairs',
  'activity_everyday_movement',
  'activity_walk_after_meal',
  'recovery_wind_down',
  'recovery_regular_bedtime',
  'recovery_screen_pause',
  'food_add_vegetables',
  'food_fruit_snack',
  'food_whole_grains',
  'food_protein_meal',
  'food_less_processed',
  'hydration_regular',
  'hydration_available',
  'outdoors_daylight',
  'outdoors_screen_free_pause',
] as const;

const HOME_ADVICE_CATEGORY_BY_ID: Record<(typeof HOME_GENERAL_ADVICE_IDS)[number], HomeAdviceCategory> = {
  activity_short_walk: 'activity',
  activity_break_sitting: 'activity',
  activity_take_stairs: 'activity',
  activity_everyday_movement: 'activity',
  activity_walk_after_meal: 'activity',
  recovery_wind_down: 'recovery',
  recovery_regular_bedtime: 'recovery',
  recovery_screen_pause: 'recovery',
  food_add_vegetables: 'food',
  food_fruit_snack: 'food',
  food_whole_grains: 'food',
  food_protein_meal: 'food',
  food_less_processed: 'food',
  hydration_regular: 'hydration',
  hydration_available: 'hydration',
  outdoors_daylight: 'outdoors',
  outdoors_screen_free_pause: 'outdoors',
};

function buildHomeGeneralAdviceBank(): readonly HomeAdviceItem[] {
  return HOME_GENERAL_ADVICE_IDS.map((id) => {
    const copy = localizeAdviceCopy(id);
    return {
      id,
      category: HOME_ADVICE_CATEGORY_BY_ID[id],
      title: copy.title,
      subtitle: copy.subtitle,
    };
  });
}

/**
 * Curated general wellness advice for Home priorities 2–3.
 * These are recommendations only — never claims about observed user behavior.
 */
export const HOME_GENERAL_ADVICE_BANK: readonly HomeAdviceItem[] = liveArray(buildHomeGeneralAdviceBank);

/** Deterministic category pairs for priorities 2–3 (different categories). */
export const HOME_ADVICE_CATEGORY_PAIRS: readonly [HomeAdviceCategory, HomeAdviceCategory][] = [
  ['activity', 'food'],
  ['recovery', 'activity'],
  ['food', 'outdoors'],
  ['hydration', 'activity'],
  ['outdoors', 'food'],
  ['activity', 'recovery'],
  ['food', 'hydration'],
  ['recovery', 'food'],
  ['outdoors', 'hydration'],
  ['hydration', 'recovery'],
] as const;

export const HOME_PERSONAL_PRIORITY_FALLBACK = liveCopy({
  id: () => 'personal_fallback' as const,
  title: () => t('home.priority.fallbackTitle'),
  subtitle: () => t('home.priority.fallbackSubtitle'),
});

/** Forbidden substring patterns that imply unobserved tracked progress. */
export const HOME_PRIORITY_FORBIDDEN_PROGRESS_PATTERNS = [
  /\d+\s*glas\s+kvar/i,
  /\d+\s*steg\s+kvar/i,
  /du har gått\s+\d+/i,
  /\d+\s*timmar?\s+sömn\s+kvar/i,
  /du sov\s+\d+/i,
  /\d+\s+av\s+\d+\s+träningspass/i,
  /2L vatten/i,
  /lägg dig före\s+\d+/i,
] as const;

import {
  HOME_ADVICE_CATEGORY_PAIRS,
  HOME_GENERAL_ADVICE_BANK,
  HOME_PERSONAL_PRIORITY_FALLBACK,
} from './home-priorities.advice';
import type {
  HomeAdviceCategory,
  HomeAdviceItem,
  HomePersonalPriorityInput,
  HomePriorityItemModel,
} from './home-priorities.types';

export function hashHomeDayKey(dayKey: string): number {
  let hash = 0;
  for (let index = 0; index < dayKey.length; index += 1) {
    hash = (hash * 31 + dayKey.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function itemsForCategory(category: HomeAdviceCategory): HomeAdviceItem[] {
  return HOME_GENERAL_ADVICE_BANK.filter((item) => item.category === category);
}

/**
 * Selects two general advice items for the given local calendar day key (YYYY-MM-DD).
 * Stable for the same dayKey; varies across days; different categories; no duplicates.
 */
export function selectGeneralHomeAdvice(dayKey: string): [HomeAdviceItem, HomeAdviceItem] {
  const hash = hashHomeDayKey(dayKey);
  const pair = HOME_ADVICE_CATEGORY_PAIRS[hash % HOME_ADVICE_CATEGORY_PAIRS.length]!;
  const [categoryA, categoryB] = pair;

  const poolA = itemsForCategory(categoryA);
  const poolB = itemsForCategory(categoryB);

  const itemA = poolA[hash % poolA.length]!;
  const itemB = poolB[(hash >>> 8) % poolB.length]!;

  return [itemA, itemB];
}

export function buildPersonalHomePriority(
  personal: HomePersonalPriorityInput,
): Omit<HomePriorityItemModel, 'completed'> {
  if (personal) {
    return {
      id: 'personal_focus',
      kind: 'personal',
      title: personal.title,
      subtitle: personal.subtitle,
    };
  }

  return {
    id: HOME_PERSONAL_PRIORITY_FALLBACK.id,
    kind: 'personal',
    title: HOME_PERSONAL_PRIORITY_FALLBACK.title,
    subtitle: HOME_PERSONAL_PRIORITY_FALLBACK.subtitle,
  };
}

/**
 * Builds up to three Home daily priorities:
 * 1) authoritative Focus (or honest fallback)
 * 2–3) general advice from the curated local bank
 */
export function buildHomeDailyPriorities(input: {
  dayKey: string;
  personal: HomePersonalPriorityInput;
  completedById?: Readonly<Record<string, boolean>>;
}): HomePriorityItemModel[] {
  const completedById = input.completedById ?? {};
  const personalPriority = buildPersonalHomePriority(input.personal);
  const [generalA, generalB] = selectGeneralHomeAdvice(input.dayKey);

  const items: Omit<HomePriorityItemModel, 'completed'>[] = [
    personalPriority,
    {
      id: generalA.id,
      kind: 'general',
      title: generalA.title,
      subtitle: generalA.subtitle,
    },
    {
      id: generalB.id,
      kind: 'general',
      title: generalB.title,
      subtitle: generalB.subtitle,
    },
  ];

  return items.map((item) => ({
    ...item,
    completed: completedById[item.id] === true,
  }));
}

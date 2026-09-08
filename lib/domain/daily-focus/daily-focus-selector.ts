import { getWeeklyCheckInWeekStartDate } from '../weekly-check-in/weekly-check-in.week';
import type { WeeklyFocusArea } from '../weekly-focus';

import { DAILY_FOCUS_ACTION_BANK } from './daily-focus-action-bank';
import type { DailyFocusActionDefinition, DailyFocusIntensity } from './daily-focus.types';
import {
  DAILY_FOCUS_COOLDOWN_DAYS,
  type DailyFocusHistoryEntry,
  type DailyFocusRelaxationLevel,
  type DailyFocusSelectorFocus,
  type DailyFocusSelectorInput,
  type DailyFocusSelectorResult,
} from './daily-focus-selector.types';

const TRAINING_LOAD_FAMILIES = new Set([
  'short_workout',
  'strength',
  'session_follow_through',
  'getting_started',
]);

const LOCAL_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseLocalDate(value: string): Date {
  const match = LOCAL_CALENDAR_DATE.exec(value.trim());
  if (!match) {
    throw new Error('Ogiltigt lokalt kalenderdatum.');
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const local = new Date(year, month - 1, day);
  if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day) {
    throw new Error('Ogiltigt lokalt kalenderdatum.');
  }
  return local;
}

export function addDailyFocusCalendarDays(localDate: string, days: number): string {
  const date = parseLocalDate(localDate);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dailyFocusCalendarDaysBetween(fromDate: string, toDate: string): number {
  const from = parseLocalDate(fromDate);
  const to = parseLocalDate(toDate);
  return Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
    Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86_400_000);
}

function isWeekend(localDate: string): boolean {
  const weekday = parseLocalDate(localDate).getDay();
  return weekday === 0 || weekday === 6;
}

/** FNV-1a 32-bit. Stable across runs; not a cryptographic hash. */
export function dailyFocusStableHash(seed: string, localDate: string, actionId: string): number {
  const text = `${seed}|${localDate}|${actionId}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shownActionIds(entry: DailyFocusHistoryEntry): string[] {
  const ids = [entry.actionId];
  if (entry.swappedFromActionId) {
    ids.push(entry.swappedFromActionId);
  }
  return ids;
}

function shownFamilies(entry: DailyFocusHistoryEntry): string[] {
  const families = [entry.behaviorFamily];
  if (entry.swappedFromBehaviorFamily) {
    families.push(entry.swappedFromBehaviorFamily);
  }
  return families;
}

function shownIntensities(entry: DailyFocusHistoryEntry): DailyFocusIntensity[] {
  const intensities: DailyFocusIntensity[] = [entry.intensity];
  if (entry.swappedFromIntensity) {
    intensities.push(entry.swappedFromIntensity);
  }
  return intensities;
}

type FocusIndex = Map<WeeklyFocusArea, DailyFocusSelectorFocus>;

function focusIndex(input: DailyFocusSelectorInput): FocusIndex {
  return new Map(input.weeklyFocus.focuses.map((focus) => [focus.area, focus]));
}

/** Primary intensity still dominates. Soft keys stay smaller than one intensity step. */
const INTENSITY_WEIGHT = 2 ** 34;
const NEED_WEIGHT = 2 ** 26;
const AREA_ALTERNATION_WEIGHT = 2 ** 27;
const RECOVERY_INTENSITY_WEIGHT = 2 ** 31;
const MAX_NEED_SCORE = 5;

type DerivedHistory = {
  cooldownIds: ReadonlySet<string>;
  recentProtectedIds: ReadonlySet<string>;
  yesterdayFamilies: ReadonlySet<string>;
  yesterdayArea: WeeklyFocusArea | null;
  yesterdayHadChallenge: boolean;
  recentRecoveryIntensity: boolean;
  weekChallengeCount: number;
  recentMicroStreak: number;
  todayIds: ReadonlySet<string>;
  todayFamilies: ReadonlySet<string>;
};

function cooldownWindowDays(level: DailyFocusRelaxationLevel): number {
  if (level <= 1) {
    return DAILY_FOCUS_COOLDOWN_DAYS;
  }
  if (level === 2) {
    return 7;
  }
  return 1;
}

function deriveHistory(input: DailyFocusSelectorInput, level: DailyFocusRelaxationLevel): DerivedHistory {
  const today = input.localDate;
  const windowDays = cooldownWindowDays(level);
  const cooldownIds = new Set<string>();
  const recentProtectedIds = new Set<string>();
  const yesterdayFamilies = new Set<string>();
  const todayIds = new Set<string>();
  const todayFamilies = new Set<string>();
  let yesterdayArea: WeeklyFocusArea | null = null;
  let yesterdayHadChallenge = false;
  let recentRecoveryIntensity = false;
  let weekChallengeCount = 0;

  const weekStartDate = getWeeklyCheckInWeekStartDate(today);

  for (const entry of input.history) {
    const delta = dailyFocusCalendarDaysBetween(entry.localDate, today);
    if (delta < 0) {
      continue;
    }
    const ids = shownActionIds(entry);
    if (delta === 0) {
      for (const id of ids) {
        todayIds.add(id);
        cooldownIds.add(id);
        recentProtectedIds.add(id);
      }
      for (const family of shownFamilies(entry)) {
        todayFamilies.add(family);
      }
      continue;
    }
    if (delta <= windowDays) {
      for (const id of ids) {
        cooldownIds.add(id);
      }
    }
    if (delta <= 1) {
      for (const id of ids) {
        recentProtectedIds.add(id);
      }
    }
    if (delta === 1 || delta === 2) {
      if (shownIntensities(entry).includes('recovery')) {
        recentRecoveryIntensity = true;
      }
    }
    if (delta === 1) {
      yesterdayArea = entry.focusArea;
      for (const family of shownFamilies(entry)) {
        yesterdayFamilies.add(family);
      }
      if (shownIntensities(entry).includes('challenge')) {
        yesterdayHadChallenge = true;
      }
    }
    if (delta >= 1 && entry.localDate >= weekStartDate && entry.localDate < today) {
      if (entry.intensity === 'challenge') {
        weekChallengeCount += 1;
      }
    }
  }

  const orderedWeek = input.history
    .filter((entry) => {
      const delta = dailyFocusCalendarDaysBetween(entry.localDate, today);
      return delta >= 1 && entry.localDate >= weekStartDate && entry.localDate < today;
    })
    .slice()
    .sort((left, right) => left.localDate.localeCompare(right.localDate));

  let recentMicroStreak = 0;
  for (const entry of orderedWeek.slice(-3).reverse()) {
    if (entry.intensity === 'micro') {
      recentMicroStreak += 1;
    } else {
      break;
    }
  }

  return {
    cooldownIds,
    recentProtectedIds,
    yesterdayFamilies,
    yesterdayArea,
    yesterdayHadChallenge,
    recentRecoveryIntensity,
    weekChallengeCount,
    recentMicroStreak,
    todayIds,
    todayFamilies,
  };
}

function otherWeeklyArea(
  focuses: readonly [DailyFocusSelectorFocus, DailyFocusSelectorFocus],
  area: WeeklyFocusArea,
): WeeklyFocusArea | null {
  if (focuses[0].area === area) {
    return focuses[1].area;
  }
  if (focuses[1].area === area) {
    return focuses[0].area;
  }
  return null;
}

function isTrainingLoadIncrease(action: DailyFocusActionDefinition): boolean {
  return action.focusArea === 'training' && TRAINING_LOAD_FAMILIES.has(action.behaviorFamily);
}

export function passesDailyFocusHardFilters(
  action: DailyFocusActionDefinition,
  input: DailyFocusSelectorInput,
  level: DailyFocusRelaxationLevel = 0,
): boolean {
  const focuses = focusIndex(input);
  const weekly = focuses.get(action.focusArea);
  if (!weekly) {
    return false;
  }
  if (action.focusArea === 'alcohol' && weekly.mode !== 'improve') {
    return false;
  }
  if (!action.allowedModes.includes(weekly.mode)) {
    return false;
  }
  if (weekly.mode === 'maintain' && action.intensity === 'challenge') {
    return false;
  }
  const weekend = isWeekend(input.localDate);
  if (weekend && !action.eligibility.weekendOk) {
    return false;
  }
  if (!weekend && !action.eligibility.weekdayOk) {
    return false;
  }
  if (action.eligibility.requiresLessHealthyFoodRelevance && input.context?.lessHealthyFoodRelevant !== true) {
    return false;
  }
  if (input.weeklyFocus.recoveryConstraint && action.intensity === 'challenge') {
    return false;
  }
  if (input.weeklyFocus.recoveryConstraint && isTrainingLoadIncrease(action)) {
    return false;
  }

  const derived = deriveHistory(input, level);
  if (derived.cooldownIds.has(action.id)) {
    return false;
  }
  if (level === 0 && derived.yesterdayFamilies.has(action.behaviorFamily)) {
    return false;
  }
  if (input.selectionReason === 'swap') {
    if (derived.todayIds.has(action.id)) {
      return false;
    }
    if (derived.todayFamilies.has(action.behaviorFamily)) {
      return false;
    }
  }
  if (derived.yesterdayHadChallenge && action.intensity === 'challenge') {
    return false;
  }
  return true;
}

function intensityRank(action: DailyFocusActionDefinition, input: DailyFocusSelectorInput, derived: DerivedHistory): number {
  if (input.weeklyFocus.recoveryConstraint) {
    if (action.intensity === 'recovery' || action.intensity === 'micro' || action.intensity === 'normal') {
      return 1;
    }
    return 9;
  }
  if (action.intensity === 'challenge') {
    if (derived.weekChallengeCount >= 1) {
      return 6;
    }
    return 3;
  }
  if (derived.recentMicroStreak >= 3) {
    if (action.intensity === 'normal') {
      return 0;
    }
    if (action.intensity === 'micro') {
      return 2;
    }
  }
  if (action.intensity === 'micro' || action.intensity === 'normal') {
    return 1;
  }
  if (action.intensity === 'recovery') {
    return 2;
  }
  return 4;
}

function recoveryIntensitySoftPenalty(
  action: DailyFocusActionDefinition,
  input: DailyFocusSelectorInput,
  derived: DerivedHistory,
): number {
  if (!input.weeklyFocus.recoveryConstraint) {
    return 0;
  }
  if (action.intensity !== 'recovery' && action.intensity !== 'micro' && action.intensity !== 'normal') {
    return 0;
  }
  const preferRecovery = !derived.recentRecoveryIntensity;
  const isRecovery = action.intensity === 'recovery';
  if (preferRecovery) {
    return isRecovery ? 0 : RECOVERY_INTENSITY_WEIGHT;
  }
  return isRecovery ? RECOVERY_INTENSITY_WEIGHT : 0;
}

function rankingScore(
  action: DailyFocusActionDefinition,
  input: DailyFocusSelectorInput,
  derived: DerivedHistory,
  preferredArea: WeeklyFocusArea | null,
  needByArea: ReadonlyMap<WeeklyFocusArea, number>,
): number {
  // Lower is better. Intensity dominates; RC intensity bias is next; need and
  // area-alternation are hash-scale nudges; stable hash breaks the rest.
  const need = needByArea.get(action.focusArea) ?? 0;
  const areaPenalty = preferredArea && action.focusArea !== preferredArea ? AREA_ALTERNATION_WEIGHT : 0;
  return (
    intensityRank(action, input, derived) * INTENSITY_WEIGHT +
    (MAX_NEED_SCORE - need) * NEED_WEIGHT +
    areaPenalty +
    recoveryIntensitySoftPenalty(action, input, derived) +
    dailyFocusStableHash(input.selectionSeed, input.localDate, action.id)
  );
}

function compareByScore(
  left: DailyFocusActionDefinition,
  right: DailyFocusActionDefinition,
  input: DailyFocusSelectorInput,
  derived: DerivedHistory,
  preferredArea: WeeklyFocusArea | null,
  needByArea: ReadonlyMap<WeeklyFocusArea, number>,
): number {
  const scoreDelta =
    rankingScore(left, input, derived, preferredArea, needByArea) -
    rankingScore(right, input, derived, preferredArea, needByArea);
  if (scoreDelta !== 0) {
    return scoreDelta;
  }
  return left.id.localeCompare(right.id);
}

function pickBestInList(
  candidates: readonly DailyFocusActionDefinition[],
  input: DailyFocusSelectorInput,
  derived: DerivedHistory,
  preferredArea: WeeklyFocusArea | null,
  needByArea: ReadonlyMap<WeeklyFocusArea, number>,
): DailyFocusActionDefinition {
  const ranked = candidates.slice().sort((left, right) =>
    compareByScore(left, right, input, derived, preferredArea, needByArea),
  );
  const picked = ranked[0];
  if (!picked) {
    throw new Error('Daily Focus selector: empty candidate ranking.');
  }
  return picked;
}

function pickCandidate(
  candidates: readonly DailyFocusActionDefinition[],
  input: DailyFocusSelectorInput,
  derived: DerivedHistory,
): DailyFocusActionDefinition {
  const reason = input.selectionReason ?? 'initial';
  const preferredArea =
    reason === 'swap' || !derived.yesterdayArea
      ? null
      : otherWeeklyArea(input.weeklyFocus.focuses, derived.yesterdayArea);

  const needByArea = new Map(input.weeklyFocus.focuses.map((focus) => [focus.area, focus.needScore]));
  const emptyNeed = new Map<WeeklyFocusArea, number>();

  const byArea = new Map<WeeklyFocusArea, DailyFocusActionDefinition[]>();
  for (const action of candidates) {
    const bucket = byArea.get(action.focusArea);
    if (bucket) {
      bucket.push(action);
    } else {
      byArea.set(action.focusArea, [action]);
    }
  }

  const champions: DailyFocusActionDefinition[] = [];
  for (const actions of byArea.values()) {
    champions.push(pickBestInList(actions, input, derived, null, emptyNeed));
  }

  return pickBestInList(champions, input, derived, preferredArea, needByArea);
}

export function listEligibleDailyFocusActions(
  input: DailyFocusSelectorInput,
  level: DailyFocusRelaxationLevel = 0,
): DailyFocusActionDefinition[] {
  return DAILY_FOCUS_ACTION_BANK.filter((action) => passesDailyFocusHardFilters(action, input, level)).sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

export function selectDailyFocus(input: DailyFocusSelectorInput): DailyFocusSelectorResult {
  parseLocalDate(input.localDate);
  const focuses = focusIndex(input);

  for (const level of [0, 1, 2, 3] as const) {
    const candidates = listEligibleDailyFocusActions(input, level);
    if (candidates.length === 0) {
      continue;
    }
    const derived = deriveHistory(input, level);
    const picked = pickCandidate(candidates, input, derived);
    const weekly = focuses.get(picked.focusArea);
    if (!weekly) {
      continue;
    }
    const preferredArea =
      (input.selectionReason ?? 'initial') === 'swap' || !derived.yesterdayArea
        ? null
        : otherWeeklyArea(input.weeklyFocus.focuses, derived.yesterdayArea);

    return {
      actionId: picked.id,
      focusArea: picked.focusArea,
      behaviorFamily: picked.behaviorFamily,
      intensity: picked.intensity,
      weeklyFocusMode: weekly.mode,
      selectionMetadata: {
        relaxationLevel: level,
        usedCooldownRelaxation: level >= 2,
        usedFamilyRelaxation: level >= 1,
        usedAreaAlternationPreference: preferredArea !== null && picked.focusArea === preferredArea,
        candidateCount: candidates.length,
      },
    };
  }

  throw new Error('Daily Focus selector: no safe candidate in active Weekly Focus areas.');
}

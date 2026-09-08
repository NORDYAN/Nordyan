import type { AppError, Result } from '@/lib/core';
import { getLocalCalendarDate } from '@/lib/domain/age-eligibility';
import {
  addDailyFocusCalendarDays,
  DAILY_FOCUS_ACTION_BANK,
  DAILY_FOCUS_ACTION_BANK_VERSION,
  DAILY_FOCUS_COOLDOWN_DAYS,
  DAILY_FOCUS_SELECTOR_VERSION,
  selectDailyFocus,
  type DailyFocusHistoryEntry,
  type DailyFocusSelectorResult,
} from '@/lib/domain/daily-focus';
import {
  getPreviousWeeklyCheckInWeekStartDate,
  getWeeklyCheckInWeekStartDate,
  isWeeklyCheckInLocalCalendarDate,
} from '@/lib/domain/weekly-check-in';
import type { DailyFocusRepository, PersistedDailyFocus } from '@/lib/repositories/daily-focus.repository';
import { isDailyFocusUniqueViolation, toDailyFocusHistoryEntry } from '@/lib/repositories/daily-focus-mappers';
import type { WeeklyCheckInRepository } from '@/lib/repositories/weekly-check-in.repository';
import type { WeeklyFocusRepository } from '@/lib/repositories/weekly-focus.repository';
import type { InitialLifestyleService } from '@/lib/services/initial-lifestyle';
import type { HomeWeeklyFocusData } from '@/lib/services/weekly-focus';

import { resolveLessHealthyFoodRelevant } from './less-healthy-food-relevance';

export type DailyFocusWeeklyFocusInput =
  | { status: 'ready'; data: HomeWeeklyFocusData }
  | { status: 'not_ready' }
  | { status: 'unavailable' };

export type DailyFocusReadyPayload = {
  assignment: PersistedDailyFocus;
  weekCompletedCount: number;
  actionKnown: boolean;
};

export type DailyFocusGetOrCreateValue =
  | ({ status: 'ready' } & DailyFocusReadyPayload)
  | { status: 'not_ready' }
  | { status: 'unavailable' };

export type DailyFocusMutationValue =
  | ({ status: 'ready' } & DailyFocusReadyPayload)
  | ({ status: 'already_swapped' } & DailyFocusReadyPayload)
  | ({ status: 'completed' } & DailyFocusReadyPayload)
  | ({ status: 'conflict' } & DailyFocusReadyPayload)
  | { status: 'not_found' }
  | { status: 'historical' }
  | { status: 'unavailable' };

export type DailyFocusWeekProgressValue =
  | { status: 'ready'; weekCompletedCount: number }
  | { status: 'unavailable' };

export type DailyFocusServiceDeps = {
  dailyFocusRepository: DailyFocusRepository;
  weeklyFocusRepository: Pick<WeeklyFocusRepository, 'getByUserAndWeek'>;
  weeklyCheckInRepository: Pick<WeeklyCheckInRepository, 'getByUserAndWeek'>;
  initialLifestyle: Pick<InitialLifestyleService, 'get'>;
  selectDailyFocus?: typeof selectDailyFocus;
  getToday?: () => string;
};

function requireUserId(userId: string): AppError | null {
  if (!userId.trim()) {
    return { code: 'VALIDATION', message: 'userId krävs.' };
  }
  return null;
}

function resolveLocalDate(localDate: string | undefined, today: string): Result<string> {
  const calendarDate = localDate === undefined ? today : localDate.trim();
  if (!isWeeklyCheckInLocalCalendarDate(calendarDate)) {
    return { ok: false, error: { code: 'VALIDATION', message: 'Ogiltigt lokalt kalenderdatum.' } };
  }
  return { ok: true, value: calendarDate };
}

function isUniqueViolation(error: AppError): boolean {
  const cause = error.cause as { code?: string } | undefined;
  return cause?.code === '23505' || isDailyFocusUniqueViolation({ code: cause?.code, message: error.message });
}

function actionKnown(actionId: string): boolean {
  return DAILY_FOCUS_ACTION_BANK.some((action) => action.id === actionId);
}

function historyFromInclusive(localDate: string): string {
  return addDailyFocusCalendarDays(localDate, -DAILY_FOCUS_COOLDOWN_DAYS);
}

export class DefaultDailyFocusService {
  constructor(private readonly deps: DailyFocusServiceDeps) {}

  private today(): string {
    return this.deps.getToday?.() ?? getLocalCalendarDate();
  }

  async getOrCreateCurrent(input: {
    userId: string;
    localDate?: string;
    weeklyFocus: DailyFocusWeeklyFocusInput;
  }): Promise<Result<DailyFocusGetOrCreateValue>> {
    const userError = requireUserId(input.userId);
    if (userError) {
      return { ok: false, error: userError };
    }

    const dateResult = resolveLocalDate(input.localDate, this.today());
    if (!dateResult.ok) {
      return dateResult;
    }
    const localDate = dateResult.value;
    const weekStartDate = getWeeklyCheckInWeekStartDate(localDate);

    if (input.weeklyFocus.status === 'not_ready') {
      return { ok: true, value: { status: 'not_ready' } };
    }
    if (input.weeklyFocus.status === 'unavailable') {
      return { ok: true, value: { status: 'unavailable' } };
    }
    if (input.weeklyFocus.data.weekStartDate !== weekStartDate) {
      return { ok: true, value: { status: 'unavailable' } };
    }

    const existing = await this.deps.dailyFocusRepository.getByUserAndDate(input.userId, localDate);
    if (!existing.ok) {
      return existing;
    }
    if (existing.value) {
      return this.toGetReady(existing.value);
    }

    const historyResult = await this.deps.dailyFocusRepository.getHistoryRange(
      input.userId,
      historyFromInclusive(localDate),
      localDate,
    );
    if (!historyResult.ok) {
      return historyResult;
    }

    const contextResult = await this.resolveSelectorContext(input.userId, weekStartDate);
    if (!contextResult.ok) {
      return contextResult;
    }

    const runSelector = this.deps.selectDailyFocus ?? selectDailyFocus;
    let picked: DailyFocusSelectorResult;
    try {
      picked = runSelector({
        weeklyFocus: {
          weekStartDate: input.weeklyFocus.data.weekStartDate,
          focuses: input.weeklyFocus.data.focuses,
          recoveryConstraint: input.weeklyFocus.data.recoveryConstraint,
          engineVersion: input.weeklyFocus.data.engineVersion,
        },
        localDate,
        history: historyResult.value.map(toDailyFocusHistoryEntry),
        selectionSeed: input.userId,
        selectionReason: 'initial',
        context: { lessHealthyFoodRelevant: contextResult.value },
      });
    } catch {
      return { ok: true, value: { status: 'unavailable' } };
    }

    const insertResult = await this.deps.dailyFocusRepository.insert({
      userId: input.userId,
      localDate,
      weekStartDate,
      actionId: picked.actionId,
      focusArea: picked.focusArea,
      weeklyMode: picked.weeklyFocusMode,
      intensity: picked.intensity,
      behaviorFamily: picked.behaviorFamily,
      actionBankVersion: DAILY_FOCUS_ACTION_BANK_VERSION,
      selectorVersion: DAILY_FOCUS_SELECTOR_VERSION,
    });

    if (insertResult.ok) {
      return this.toGetReady(insertResult.value);
    }

    if (isUniqueViolation(insertResult.error)) {
      const winner = await this.deps.dailyFocusRepository.getByUserAndDate(input.userId, localDate);
      if (!winner.ok) {
        return winner;
      }
      if (!winner.value) {
        return { ok: false, error: insertResult.error };
      }
      return this.toGetReady(winner.value);
    }

    return insertResult;
  }

  async swapCurrent(input: {
    userId: string;
    localDate?: string;
  }): Promise<Result<DailyFocusMutationValue>> {
    const prepared = await this.prepareTodayMutation(input);
    if (!prepared.ok) {
      return prepared;
    }
    if (prepared.value.kind !== 'row') {
      return { ok: true, value: prepared.value };
    }

    const { userId, localDate, row } = prepared.value;
    if (row.completedAt != null) {
      return this.toMutation('completed', row);
    }
    if (row.swapCount === 1) {
      return this.toMutation('already_swapped', row);
    }

    const weekly = await this.deps.weeklyFocusRepository.getByUserAndWeek(userId, row.weekStartDate);
    if (!weekly.ok) {
      return weekly;
    }
    if (!weekly.value) {
      return { ok: true, value: { status: 'unavailable' } };
    }

    const historyResult = await this.deps.dailyFocusRepository.getHistoryRange(
      userId,
      historyFromInclusive(localDate),
      localDate,
    );
    if (!historyResult.ok) {
      return historyResult;
    }

    const contextResult = await this.resolveSelectorContext(userId, row.weekStartDate);
    if (!contextResult.ok) {
      return contextResult;
    }

    const todayShown: DailyFocusHistoryEntry = toDailyFocusHistoryEntry(row);
    const runSelector = this.deps.selectDailyFocus ?? selectDailyFocus;
    let picked: DailyFocusSelectorResult;
    try {
      picked = runSelector({
        weeklyFocus: {
          weekStartDate: weekly.value.weekStartDate,
          focuses: weekly.value.focuses,
          recoveryConstraint: weekly.value.recoveryConstraint,
          engineVersion: weekly.value.engineVersion,
        },
        localDate,
        history: [...historyResult.value.map(toDailyFocusHistoryEntry), todayShown],
        selectionSeed: userId,
        selectionReason: 'swap',
        context: { lessHealthyFoodRelevant: contextResult.value },
      });
    } catch {
      return { ok: true, value: { status: 'unavailable' } };
    }

    if (picked.actionId === row.actionId || picked.behaviorFamily === row.behaviorFamily) {
      return { ok: true, value: { status: 'unavailable' } };
    }

    const swapped = await this.deps.dailyFocusRepository.swapIfAvailable({
      userId,
      localDate,
      expectedCurrentActionId: row.actionId,
      replacement: {
        actionId: picked.actionId,
        focusArea: picked.focusArea,
        weeklyMode: picked.weeklyFocusMode,
        intensity: picked.intensity,
        behaviorFamily: picked.behaviorFamily,
      },
      originalSnapshot: {
        actionId: row.actionId,
        focusArea: row.focusArea,
        weeklyMode: row.weeklyMode,
        intensity: row.intensity,
        behaviorFamily: row.behaviorFamily,
      },
    });

    if (!swapped.ok) {
      return swapped;
    }
    if (swapped.value) {
      return this.toMutation('ready', swapped.value);
    }

    const latest = await this.deps.dailyFocusRepository.getByUserAndDate(userId, localDate);
    if (!latest.ok) {
      return latest;
    }
    if (!latest.value) {
      return { ok: true, value: { status: 'not_found' } };
    }
    if (latest.value.completedAt != null) {
      return this.toMutation('completed', latest.value);
    }
    if (latest.value.swapCount === 1) {
      return this.toMutation('already_swapped', latest.value);
    }
    return this.toMutation('conflict', latest.value);
  }

  async markCompleteCurrent(input: {
    userId: string;
    localDate?: string;
  }): Promise<Result<DailyFocusMutationValue>> {
    const prepared = await this.prepareTodayMutation(input);
    if (!prepared.ok) {
      return prepared;
    }
    if (prepared.value.kind !== 'row') {
      return { ok: true, value: prepared.value };
    }

    const { userId, localDate, row } = prepared.value;
    if (row.completedAt != null) {
      return this.toMutation('ready', row);
    }

    const updated = await this.deps.dailyFocusRepository.markComplete(userId, localDate);
    if (!updated.ok) {
      return updated;
    }
    if (updated.value) {
      return this.toMutation('ready', updated.value);
    }

    const latest = await this.deps.dailyFocusRepository.getByUserAndDate(userId, localDate);
    if (!latest.ok) {
      return latest;
    }
    if (!latest.value) {
      return { ok: true, value: { status: 'not_found' } };
    }
    return this.toMutation('ready', latest.value);
  }

  async undoCompleteCurrent(input: {
    userId: string;
    localDate?: string;
  }): Promise<Result<DailyFocusMutationValue>> {
    const prepared = await this.prepareTodayMutation(input);
    if (!prepared.ok) {
      return prepared;
    }
    if (prepared.value.kind !== 'row') {
      return { ok: true, value: prepared.value };
    }

    const { userId, localDate, row } = prepared.value;
    if (row.completedAt == null) {
      return this.toMutation('ready', row);
    }

    const updated = await this.deps.dailyFocusRepository.undoComplete(userId, localDate);
    if (!updated.ok) {
      return updated;
    }
    if (updated.value) {
      return this.toMutation('ready', updated.value);
    }

    const latest = await this.deps.dailyFocusRepository.getByUserAndDate(userId, localDate);
    if (!latest.ok) {
      return latest;
    }
    if (!latest.value) {
      return { ok: true, value: { status: 'not_found' } };
    }
    return this.toMutation('ready', latest.value);
  }

  async getCurrentWeekProgress(input: {
    userId: string;
    localDate?: string;
  }): Promise<Result<DailyFocusWeekProgressValue>> {
    const userError = requireUserId(input.userId);
    if (userError) {
      return { ok: false, error: userError };
    }
    const dateResult = resolveLocalDate(input.localDate, this.today());
    if (!dateResult.ok) {
      return dateResult;
    }
    const weekStartDate = getWeeklyCheckInWeekStartDate(dateResult.value);
    const count = await this.deps.dailyFocusRepository.countCompletedByWeek(input.userId, weekStartDate);
    if (!count.ok) {
      return count;
    }
    return { ok: true, value: { status: 'ready', weekCompletedCount: count.value } };
  }

  private async prepareTodayMutation(input: { userId: string; localDate?: string }): Promise<
    Result<
      | { kind: 'row'; userId: string; localDate: string; row: PersistedDailyFocus }
      | Extract<DailyFocusMutationValue, { status: 'not_found' | 'historical' | 'unavailable' }>
    >
  > {
    const userError = requireUserId(input.userId);
    if (userError) {
      return { ok: false, error: userError };
    }
    const today = this.today();
    const dateResult = resolveLocalDate(input.localDate, today);
    if (!dateResult.ok) {
      return dateResult;
    }
    const requested = dateResult.value;
    if (requested !== today) {
      return { ok: true, value: { status: 'historical' } };
    }

    const existing = await this.deps.dailyFocusRepository.getByUserAndDate(input.userId, requested);
    if (!existing.ok) {
      return existing;
    }
    if (!existing.value) {
      return { ok: true, value: { status: 'not_found' } };
    }
    return {
      ok: true,
      value: { kind: 'row', userId: input.userId, localDate: requested, row: existing.value },
    };
  }

  private async resolveSelectorContext(userId: string, weekStartDate: string): Promise<Result<boolean>> {
    const previousWeekStartDate = getPreviousWeeklyCheckInWeekStartDate(weekStartDate);
    const [checkInResult, lifestyleResult] = await Promise.all([
      this.deps.weeklyCheckInRepository.getByUserAndWeek(userId, previousWeekStartDate),
      this.deps.initialLifestyle.get(userId),
    ]);
    if (!checkInResult.ok) {
      return checkInResult;
    }
    if (!lifestyleResult.ok) {
      return lifestyleResult;
    }

    const eatingQuality = checkInResult.value?.eatingQuality ?? lifestyleResult.value?.eatingQuality ?? null;
    const frequency = lifestyleResult.value?.lessHealthyFoodFrequency ?? null;
    return {
      ok: true,
      value: resolveLessHealthyFoodRelevant({
        lessHealthyFoodFrequency: frequency,
        eatingQuality,
      }),
    };
  }

  private async toGetReady(assignment: PersistedDailyFocus): Promise<Result<DailyFocusGetOrCreateValue>> {
    const payload = await this.readyPayload(assignment);
    if (!payload.ok) {
      return payload;
    }
    return { ok: true, value: { status: 'ready', ...payload.value } };
  }

  private async toMutation(
    status: 'ready' | 'already_swapped' | 'completed' | 'conflict',
    assignment: PersistedDailyFocus,
  ): Promise<Result<DailyFocusMutationValue>> {
    const payload = await this.readyPayload(assignment);
    if (!payload.ok) {
      return payload;
    }
    return { ok: true, value: { status, ...payload.value } };
  }

  private async readyPayload(assignment: PersistedDailyFocus): Promise<Result<DailyFocusReadyPayload>> {
    const count = await this.deps.dailyFocusRepository.countCompletedByWeek(
      assignment.userId,
      assignment.weekStartDate,
    );
    if (!count.ok) {
      return count;
    }
    return {
      ok: true,
      value: {
        assignment,
        weekCompletedCount: count.value,
        actionKnown: actionKnown(assignment.actionId),
      },
    };
  }
}

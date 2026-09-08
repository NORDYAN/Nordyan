import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Result } from '@/lib/core';
import type { InitialLifestyleCheck } from '@/lib/domain/initial-lifestyle';
import {
  DAILY_FOCUS_ACTION_BANK_VERSION,
  DAILY_FOCUS_SELECTOR_VERSION,
  selectDailyFocus,
  type DailyFocusSelectorInput,
  type DailyFocusSelectorResult,
} from '@/lib/domain/daily-focus';
import { sleepNutritionImprove } from '@/lib/domain/daily-focus/daily-focus-selector.fixtures';
import type { WeeklyCheckIn } from '@/lib/domain/weekly-check-in';
import { getWeeklyCheckInWeekStartDate } from '@/lib/domain/weekly-check-in';
import type { WeeklyFocusAssignment } from '@/lib/domain/weekly-focus';
import {
  dailyFocusToInsert,
  isDailyFocusUniqueViolation,
  mapDailyFocusInvalidRowError,
  mapDailyFocusRow,
  mapDailyFocusWriteError,
} from '@/lib/repositories/daily-focus-mappers';
import type {
  DailyFocusRepository,
  InsertDailyFocusInput,
  PersistedDailyFocus,
  SwapDailyFocusInput,
} from '@/lib/repositories/daily-focus.repository';
import type { Database } from '@/lib/supabase/database.types';
import {
  DefaultDailyFocusService,
  type DailyFocusWeeklyFocusInput,
} from '@/lib/services/daily-focus/daily-focus.service';

type DailyFocusRow = Database['public']['Tables']['user_daily_focus']['Row'];

const TODAY = '2026-03-02';
const NEXT_DAY = '2026-03-03';
const YESTERDAY = '2026-03-01';
const PREVIOUS_WEEK_MONDAY = '2026-02-23';

function weeklyReady(weekStartDate = TODAY): DailyFocusWeeklyFocusInput {
  const weekly = sleepNutritionImprove();
  return {
    status: 'ready',
    data: {
      weekStartDate,
      focuses: [weekly.focuses[0], weekly.focuses[1]],
      recoveryConstraint: weekly.recoveryConstraint,
      engineVersion: weekly.engineVersion,
      insufficientEvidenceFallback: false,
    },
  };
}

function lifestyle(overrides: Partial<InitialLifestyleCheck> = {}): InitialLifestyleCheck {
  return {
    id: 'il-1',
    userId: 'user-1',
    sleepQuality: 3,
    energy: 3,
    stress: 3,
    lessHealthyFoodFrequency: 'never',
    everydayActivity: 3,
    eatingQuality: 3,
    alcoholConsumption: 'none',
    createdAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-02-01T08:00:00.000Z',
    ...overrides,
  };
}

class MemoryDailyFocusRepository implements DailyFocusRepository {
  readonly rows = new Map<string, DailyFocusRow>();
  reads = 0;
  historyReads = 0;
  inserts = 0;
  swaps = 0;
  completes = 0;
  undos = 0;
  insertError: { code?: string; message?: string } | null = null;
  readError: Result<PersistedDailyFocus | null> | null = null;
  historyError: Result<PersistedDailyFocus[]> | null = null;
  swapError: Result<PersistedDailyFocus | null> | null = null;
  completeError: Result<PersistedDailyFocus | null> | null = null;
  hideExistingUntilInsertAttempt = false;
  nextId = 1;

  private key(userId: string, localDate: string): string {
    return `${userId}:${localDate}`;
  }

  seed(row: DailyFocusRow): void {
    this.rows.set(this.key(row.user_id, row.local_date), row);
  }

  async getByUserAndDate(userId: string, localDate: string): Promise<Result<PersistedDailyFocus | null>> {
    this.reads += 1;
    if (this.readError) {
      return this.readError;
    }
    if (this.hideExistingUntilInsertAttempt && this.inserts === 0) {
      return { ok: true, value: null };
    }
    const row = this.rows.get(this.key(userId, localDate));
    if (!row) {
      return { ok: true, value: null };
    }
    const mapped = mapDailyFocusRow(row);
    if (!mapped) {
      return { ok: false, error: mapDailyFocusInvalidRowError() };
    }
    return { ok: true, value: mapped };
  }

  async getHistoryRange(
    userId: string,
    fromLocalDateInclusive: string,
    toLocalDateExclusive: string,
  ): Promise<Result<PersistedDailyFocus[]>> {
    this.historyReads += 1;
    if (this.historyError) {
      return this.historyError;
    }
    const mapped: PersistedDailyFocus[] = [];
    for (const row of this.rows.values()) {
      if (row.user_id !== userId) {
        continue;
      }
      if (row.local_date >= fromLocalDateInclusive && row.local_date < toLocalDateExclusive) {
        const value = mapDailyFocusRow(row);
        if (!value) {
          return { ok: false, error: mapDailyFocusInvalidRowError() };
        }
        mapped.push(value);
      }
    }
    mapped.sort((left, right) => left.localDate.localeCompare(right.localDate));
    return { ok: true, value: mapped };
  }

  async insert(input: InsertDailyFocusInput): Promise<Result<PersistedDailyFocus>> {
    this.inserts += 1;
    if (this.insertError) {
      return { ok: false, error: mapDailyFocusWriteError(this.insertError) };
    }
    const key = this.key(input.userId, input.localDate);
    if (this.rows.has(key)) {
      return { ok: false, error: mapDailyFocusWriteError({ code: '23505' }) };
    }
    const payload = dailyFocusToInsert(input);
    const row: DailyFocusRow = {
      id: `df-${this.nextId}`,
      user_id: payload.user_id,
      local_date: payload.local_date,
      week_start_date: payload.week_start_date,
      action_id: payload.action_id,
      focus_area: payload.focus_area,
      weekly_mode: payload.weekly_mode,
      intensity: payload.intensity,
      behavior_family: payload.behavior_family,
      completed_at: null,
      swap_count: 0,
      swapped_from_action_id: null,
      swapped_from_behavior_family: null,
      swapped_from_focus_area: null,
      swapped_from_intensity: null,
      action_bank_version: payload.action_bank_version,
      selector_version: payload.selector_version,
      created_at: `${input.localDate}T08:00:00.000Z`,
      updated_at: `${input.localDate}T08:00:00.000Z`,
    };
    this.nextId += 1;
    this.rows.set(key, row);
    return { ok: true, value: mapDailyFocusRow(row)! };
  }

  async swapIfAvailable(input: SwapDailyFocusInput): Promise<Result<PersistedDailyFocus | null>> {
    this.swaps += 1;
    if (this.swapError) {
      return this.swapError;
    }
    const row = this.rows.get(this.key(input.userId, input.localDate));
    if (
      !row ||
      row.swap_count !== 0 ||
      row.completed_at != null ||
      row.action_id !== input.expectedCurrentActionId
    ) {
      return { ok: true, value: null };
    }
    const next: DailyFocusRow = {
      ...row,
      action_id: input.replacement.actionId,
      focus_area: input.replacement.focusArea,
      weekly_mode: input.replacement.weeklyMode,
      intensity: input.replacement.intensity,
      behavior_family: input.replacement.behaviorFamily,
      swapped_from_action_id: input.originalSnapshot.actionId,
      swapped_from_behavior_family: input.originalSnapshot.behaviorFamily,
      swapped_from_focus_area: input.originalSnapshot.focusArea,
      swapped_from_intensity: input.originalSnapshot.intensity,
      swap_count: 1,
      updated_at: `${input.localDate}T09:00:00.000Z`,
    };
    this.rows.set(this.key(input.userId, input.localDate), next);
    return { ok: true, value: mapDailyFocusRow(next)! };
  }

  async markComplete(userId: string, localDate: string): Promise<Result<PersistedDailyFocus | null>> {
    this.completes += 1;
    if (this.completeError) {
      return this.completeError;
    }
    const row = this.rows.get(this.key(userId, localDate));
    if (!row || row.completed_at != null) {
      return { ok: true, value: null };
    }
    const next = { ...row, completed_at: `${localDate}T12:00:00.000Z` };
    this.rows.set(this.key(userId, localDate), next);
    return { ok: true, value: mapDailyFocusRow(next)! };
  }

  async undoComplete(userId: string, localDate: string): Promise<Result<PersistedDailyFocus | null>> {
    this.undos += 1;
    const row = this.rows.get(this.key(userId, localDate));
    if (!row || row.completed_at == null) {
      return { ok: true, value: null };
    }
    const next = { ...row, completed_at: null };
    this.rows.set(this.key(userId, localDate), next);
    return { ok: true, value: mapDailyFocusRow(next)! };
  }

  async countCompletedByWeek(userId: string, weekStartDate: string): Promise<Result<number>> {
    let count = 0;
    for (const row of this.rows.values()) {
      if (row.user_id === userId && row.week_start_date === weekStartDate && row.completed_at != null) {
        count += 1;
      }
    }
    return { ok: true, value: count };
  }
}

function toAssignment(weekly: DailyFocusWeeklyFocusInput): WeeklyFocusAssignment {
  if (weekly.status !== 'ready') {
    throw new Error('expected ready weekly focus');
  }
  return {
    id: 'wf-1',
    userId: 'user-1',
    weekStartDate: weekly.data.weekStartDate,
    focuses: weekly.data.focuses,
    recoveryConstraint: weekly.data.recoveryConstraint,
    engineVersion: weekly.data.engineVersion,
    insufficientEvidenceFallback: weekly.data.insufficientEvidenceFallback,
    createdAt: '2026-03-02T08:00:00.000Z',
  };
}

function createService(options?: {
  daily?: MemoryDailyFocusRepository;
  today?: string;
  weeklyFocusAssignment?: WeeklyFocusAssignment | null;
  lifestyle?: Result<InitialLifestyleCheck | null>;
  checkIn?: WeeklyCheckIn | null;
  selector?: (input: DailyFocusSelectorInput) => DailyFocusSelectorResult;
}) {
  const daily = options?.daily ?? new MemoryDailyFocusRepository();
  const today = options?.today ?? TODAY;
  const weeklyInput = weeklyReady(getWeeklyCheckInWeekStartDate(today));
  const selectorCalls: DailyFocusSelectorInput[] = [];
  const service = new DefaultDailyFocusService({
    dailyFocusRepository: daily,
    weeklyFocusRepository: {
      getByUserAndWeek: async () => ({
        ok: true,
        value: options?.weeklyFocusAssignment === undefined ? toAssignment(weeklyInput) : options.weeklyFocusAssignment,
      }),
    },
    weeklyCheckInRepository: {
      getByUserAndWeek: async () => ({ ok: true, value: options?.checkIn ?? null }),
    },
    initialLifestyle: {
      get: async () => options?.lifestyle ?? { ok: true, value: lifestyle() },
    },
    selectDailyFocus: (input) => {
      selectorCalls.push(input);
      return (options?.selector ?? selectDailyFocus)(input);
    },
    getToday: () => today,
  });
  return { service, daily, selectorCalls, weeklyInput };
}

function seedHistory(
  daily: MemoryDailyFocusRepository,
  localDate: string,
  actionId: string,
  extras: Partial<DailyFocusRow> = {},
): void {
  const inserted = dailyFocusToInsert({
    userId: 'user-1',
    localDate,
    weekStartDate: getWeeklyCheckInWeekStartDate(localDate),
    actionId,
    focusArea: 'sleep',
    weeklyMode: 'improve',
    intensity: 'micro',
    behaviorFamily: 'bedroom_prep',
    actionBankVersion: DAILY_FOCUS_ACTION_BANK_VERSION,
    selectorVersion: DAILY_FOCUS_SELECTOR_VERSION,
  });
  daily.seed({
    id: `hist-${localDate}`,
    user_id: inserted.user_id,
    local_date: inserted.local_date,
    week_start_date: inserted.week_start_date,
    action_id: actionId,
    focus_area: extras.focus_area ?? inserted.focus_area,
    weekly_mode: inserted.weekly_mode,
    intensity: extras.intensity ?? inserted.intensity,
    behavior_family: extras.behavior_family ?? 'hist_family',
    completed_at: extras.completed_at ?? null,
    swap_count: extras.swap_count ?? 0,
    swapped_from_action_id: extras.swapped_from_action_id ?? null,
    swapped_from_behavior_family: extras.swapped_from_behavior_family ?? null,
    swapped_from_focus_area: extras.swapped_from_focus_area ?? null,
    swapped_from_intensity: extras.swapped_from_intensity ?? null,
    action_bank_version: inserted.action_bank_version,
    selector_version: inserted.selector_version,
    created_at: `${localDate}T08:00:00.000Z`,
    updated_at: `${localDate}T08:00:00.000Z`,
  });
}

describe('Daily Focus persistence lifecycle', () => {
  it('1. first get inserts one assignment', async () => {
    const { service, daily, weeklyInput } = createService();
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: weeklyInput,
    });
    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      throw new Error('expected ready');
    }
    assert.equal(daily.inserts, 1);
    assert.equal(result.value.assignment.localDate, TODAY);
    assert.equal(result.value.assignment.weekStartDate, TODAY);
    assert.equal(result.value.assignment.actionBankVersion, DAILY_FOCUS_ACTION_BANK_VERSION);
    assert.equal(result.value.assignment.selectorVersion, DAILY_FOCUS_SELECTOR_VERSION);
    assert.equal(typeof result.value.weekCompletedCount, 'number');
    assert.equal('denominator' in result.value, false);
  });

  it('2–4. same-day second get and new service instance return stored row without selector', async () => {
    const daily = new MemoryDailyFocusRepository();
    const first = createService({ daily });
    await first.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: first.weeklyInput,
    });
    const storedId = [...daily.rows.values()][0]!.id;
    const second = createService({ daily });
    const result = await second.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: second.weeklyInput,
    });
    assert.equal(daily.inserts, 1);
    assert.equal(second.selectorCalls.length, 0);
    assert.equal(result.ok && result.value.status === 'ready' && result.value.assignment.id, storedId);
  });

  it('5. next local date creates a new assignment', async () => {
    const daily = new MemoryDailyFocusRepository();
    const first = createService({ daily, today: TODAY });
    await first.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: first.weeklyInput,
    });
    const second = createService({ daily, today: NEXT_DAY });
    const result = await second.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: NEXT_DAY,
      weeklyFocus: weeklyReady(TODAY),
    });
    assert.equal(result.ok && result.value.status === 'ready', true);
    assert.equal(daily.inserts, 2);
    assert.equal(daily.rows.size, 2);
  });

  it('6. Weekly Focus not_ready/unavailable does not insert', async () => {
    const { service, daily } = createService();
    const notReady = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: { status: 'not_ready' },
    });
    const unavailable = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: { status: 'unavailable' },
    });
    assert.equal(notReady.ok && notReady.value.status, 'not_ready');
    assert.equal(unavailable.ok && unavailable.value.status, 'unavailable');
    assert.equal(daily.inserts, 0);
  });

  it('7–9. history is a date range with gaps and previous week', async () => {
    const daily = new MemoryDailyFocusRepository();
    seedHistory(daily, '2026-02-15', 'sleep_prepare_bedroom');
    seedHistory(daily, '2026-02-16', 'sleep_phone_away_before_bed', { behavior_family: 'phone_away' });
    seedHistory(daily, PREVIOUS_WEEK_MONDAY, 'sleep_dim_evening_light', { behavior_family: 'evening_light' });
    seedHistory(daily, '2026-02-25', 'nutrition_add_vegetables', {
      focus_area: 'nutrition',
      behavior_family: 'vegetables',
    });
    const { service, selectorCalls, weeklyInput } = createService({ daily });
    await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: weeklyInput,
    });
    const history = selectorCalls[0]?.history ?? [];
    const dates = history.map((entry) => entry.localDate);
    assert.equal(dates.includes('2026-02-15'), false);
    assert.equal(dates.includes('2026-02-16'), true);
    assert.equal(dates.includes(PREVIOUS_WEEK_MONDAY), true);
    assert.equal(dates.includes('2026-02-25'), true);
    assert.equal(dates.includes(TODAY), false);
    assert.equal(dates.includes('2026-02-24'), false);
  });

  it('10–11. swapped original is mapped into selector history', async () => {
    const daily = new MemoryDailyFocusRepository();
    seedHistory(daily, YESTERDAY, 'nutrition_add_vegetables', {
      focus_area: 'nutrition',
      behavior_family: 'vegetables',
      intensity: 'micro',
      swap_count: 1,
      swapped_from_action_id: 'sleep_screens_off_earlier',
      swapped_from_behavior_family: 'screen_cutoff',
      swapped_from_focus_area: 'sleep',
      swapped_from_intensity: 'normal',
    });
    const { service, selectorCalls, weeklyInput } = createService({ daily });
    await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: weeklyInput,
    });
    const yesterday = selectorCalls[0]?.history.find((entry) => entry.localDate === YESTERDAY);
    assert.equal(yesterday?.actionId, 'nutrition_add_vegetables');
    assert.equal(yesterday?.behaviorFamily, 'vegetables');
    assert.equal(yesterday?.swappedFromActionId, 'sleep_screens_off_earlier');
    assert.equal(yesterday?.swappedFromBehaviorFamily, 'screen_cutoff');
  });

  it('12–14. 23505 re-reads winner and never upserts/overwrites', async () => {
    const daily = new MemoryDailyFocusRepository();
    daily.hideExistingUntilInsertAttempt = true;
    const winnerInsert: InsertDailyFocusInput = {
      userId: 'user-1',
      localDate: TODAY,
      weekStartDate: TODAY,
      actionId: 'sleep_keep_usual_bedtime',
      focusArea: 'sleep',
      weeklyMode: 'maintain',
      intensity: 'micro',
      behaviorFamily: 'bedtime',
      actionBankVersion: DAILY_FOCUS_ACTION_BANK_VERSION,
      selectorVersion: DAILY_FOCUS_SELECTOR_VERSION,
    };
    const payload = dailyFocusToInsert(winnerInsert);
    daily.seed({
      id: 'winner',
      user_id: payload.user_id,
      local_date: payload.local_date,
      week_start_date: payload.week_start_date,
      action_id: payload.action_id,
      focus_area: payload.focus_area,
      weekly_mode: payload.weekly_mode,
      intensity: payload.intensity,
      behavior_family: payload.behavior_family,
      completed_at: null,
      swap_count: 0,
      swapped_from_action_id: null,
      swapped_from_behavior_family: null,
      swapped_from_focus_area: null,
      swapped_from_intensity: null,
      action_bank_version: payload.action_bank_version,
      selector_version: payload.selector_version,
      created_at: '2026-03-02T07:00:00.000Z',
      updated_at: '2026-03-02T07:00:00.000Z',
    });
    const { service, selectorCalls, weeklyInput } = createService({ daily });
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: weeklyInput,
    });
    assert.equal(isDailyFocusUniqueViolation({ code: '23505' }), true);
    assert.equal(result.ok && result.value.status === 'ready' && result.value.assignment.id, 'winner');
    assert.equal(result.ok && result.value.status === 'ready' && result.value.assignment.actionId, 'sleep_keep_usual_bedtime');
    assert.equal(daily.rows.get('user-1:2026-03-02')?.action_id, 'sleep_keep_usual_bedtime');
    assert.equal(selectorCalls.length, 1);
    assert.equal(daily.inserts, 1);
  });

  it('passes userId as selectionSeed and previous-week check-in for food relevance', async () => {
    const { service, selectorCalls, weeklyInput } = createService({
      lifestyle: { ok: true, value: lifestyle({ lessHealthyFoodFrequency: 'daily', eatingQuality: 2 }) },
      checkIn: {
        id: 'ci-1',
        userId: 'user-1',
        weekStartDate: PREVIOUS_WEEK_MONDAY,
        sleepQuality: 3,
        energy: 3,
        stress: 3,
        trainingFrequency: 'twice',
        everydayActivity: 3,
        eatingQuality: 5,
        alcoholConsumption: 'none',
        planAdherence: 3,
        createdAt: '2026-02-23T08:00:00.000Z',
        updatedAt: '2026-02-23T08:00:00.000Z',
      },
    });
    await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: weeklyInput,
    });
    assert.equal(selectorCalls[0]?.selectionSeed, 'user-1');
    assert.equal(selectorCalls[0]?.context?.lessHealthyFoodRelevant, false);
  });

  it('18–22. first swap stores original snapshot and increments swap_count', async () => {
    const { service, daily, weeklyInput } = createService();
    const created = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: weeklyInput,
    });
    assert.equal(created.ok && created.value.status, 'ready');
    const originalId = created.ok && created.value.status === 'ready' ? created.value.assignment.actionId : '';
    const originalFamily =
      created.ok && created.value.status === 'ready' ? created.value.assignment.behaviorFamily : '';
    const swapped = await service.swapCurrent({ userId: 'user-1', localDate: TODAY });
    assert.equal(swapped.ok && swapped.value.status, 'ready');
    if (!swapped.ok || swapped.value.status !== 'ready') {
      throw new Error('expected swap ready');
    }
    assert.notEqual(swapped.value.assignment.actionId, originalId);
    assert.notEqual(swapped.value.assignment.behaviorFamily, originalFamily);
    assert.equal(swapped.value.assignment.swapCount, 1);
    assert.equal(swapped.value.assignment.swappedFromActionId, originalId);
    assert.equal(swapped.value.assignment.swappedFromBehaviorFamily, originalFamily);
    assert.equal(daily.swaps, 1);
  });

  it('23. second swap is rejected', async () => {
    const { service, weeklyInput } = createService();
    await service.getOrCreateCurrent({ userId: 'user-1', localDate: TODAY, weeklyFocus: weeklyInput });
    await service.swapCurrent({ userId: 'user-1', localDate: TODAY });
    const second = await service.swapCurrent({ userId: 'user-1', localDate: TODAY });
    assert.equal(second.ok && second.value.status, 'already_swapped');
  });

  it('24. double-swap race: only one 0→1 update wins', async () => {
    const daily = new MemoryDailyFocusRepository();
    const { service, weeklyInput } = createService({ daily });
    await service.getOrCreateCurrent({ userId: 'user-1', localDate: TODAY, weeklyFocus: weeklyInput });
    const first = service.swapCurrent({ userId: 'user-1', localDate: TODAY });
    const second = service.swapCurrent({ userId: 'user-1', localDate: TODAY });
    const [a, b] = await Promise.all([first, second]);
    const statuses = [a.ok && a.value.status, b.ok && b.value.status];
    assert.equal(statuses.includes('ready'), true);
    assert.equal(statuses.includes('already_swapped') || statuses.filter((status) => status === 'ready').length === 1, true);
    assert.equal([...daily.rows.values()][0]?.swap_count, 1);
  });

  it('25–27. swap after complete blocked; undo then swap if swap_count 0; undo does not reset swap', async () => {
    const { service, weeklyInput } = createService();
    await service.getOrCreateCurrent({ userId: 'user-1', localDate: TODAY, weeklyFocus: weeklyInput });
    await service.markCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    const blocked = await service.swapCurrent({ userId: 'user-1', localDate: TODAY });
    assert.equal(blocked.ok && blocked.value.status, 'completed');
    await service.undoCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    const afterUndo = await service.swapCurrent({ userId: 'user-1', localDate: TODAY });
    assert.equal(afterUndo.ok && afterUndo.value.status, 'ready');
    await service.markCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    await service.undoCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    const noSecond = await service.swapCurrent({ userId: 'user-1', localDate: TODAY });
    assert.equal(noSecond.ok && noSecond.value.status, 'already_swapped');
  });

  it('28–31. complete and undo are idempotent for today', async () => {
    const { service, weeklyInput } = createService();
    await service.getOrCreateCurrent({ userId: 'user-1', localDate: TODAY, weeklyFocus: weeklyInput });
    const first = await service.markCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    const second = await service.markCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    assert.equal(first.ok && first.value.status === 'ready' && first.value.assignment.completedAt != null, true);
    assert.equal(second.ok && second.value.status === 'ready' && second.value.assignment.completedAt, first.ok && first.value.status === 'ready' ? first.value.assignment.completedAt : null);
    const undo = await service.undoCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    const undoAgain = await service.undoCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    assert.equal(undo.ok && undo.value.status === 'ready' && undo.value.assignment.completedAt, null);
    assert.equal(undoAgain.ok && undoAgain.value.status === 'ready' && undoAgain.value.assignment.completedAt, null);
  });

  it('32–33. cannot complete or undo yesterday through the service', async () => {
    const daily = new MemoryDailyFocusRepository();
    seedHistory(daily, YESTERDAY, 'sleep_prepare_bedroom');
    const { service } = createService({ daily, today: TODAY });
    const complete = await service.markCompleteCurrent({ userId: 'user-1', localDate: YESTERDAY });
    const undo = await service.undoCompleteCurrent({ userId: 'user-1', localDate: YESTERDAY });
    assert.equal(complete.ok && complete.value.status, 'historical');
    assert.equal(undo.ok && undo.value.status, 'historical');
    assert.equal(daily.rows.get(`user-1:${YESTERDAY}`)?.completed_at, null);
  });

  it('34–35. complete after swap allowed; undo keeps swap_count 1', async () => {
    const { service, weeklyInput } = createService();
    await service.getOrCreateCurrent({ userId: 'user-1', localDate: TODAY, weeklyFocus: weeklyInput });
    await service.swapCurrent({ userId: 'user-1', localDate: TODAY });
    const completed = await service.markCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    assert.equal(completed.ok && completed.value.status === 'ready' && completed.value.assignment.swapCount, 1);
    const undone = await service.undoCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    assert.equal(undone.ok && undone.value.status === 'ready' && undone.value.assignment.swapCount, 1);
    assert.equal(undone.ok && undone.value.status === 'ready' && undone.value.assignment.completedAt, null);
  });

  it('36–39. weekCompletedCount counts completed rows only, no denominator', async () => {
    const { service, weeklyInput } = createService();
    await service.getOrCreateCurrent({ userId: 'user-1', localDate: TODAY, weeklyFocus: weeklyInput });
    await service.markCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    const progress = await service.getCurrentWeekProgress({ userId: 'user-1', localDate: TODAY });
    assert.equal(progress.ok && progress.value.status === 'ready' && progress.value.weekCompletedCount, 1);
    assert.equal(progress.ok && progress.value.status === 'ready' && !('denominator' in progress.value), true);
  });

  it('38/68. missed days are not fabricated', async () => {
    const { service, daily, selectorCalls, weeklyInput } = createService();
    await service.getOrCreateCurrent({ userId: 'user-1', localDate: TODAY, weeklyFocus: weeklyInput });
    const tuesday = createService({ daily, today: '2026-03-04' });
    await tuesday.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-03-04',
      weeklyFocus: weeklyReady(TODAY),
    });
    const dates = [...daily.rows.keys()].map((key) => key.split(':')[1]);
    assert.equal(dates.includes('2026-03-03'), false);
    const wednesdayHistory = tuesday.selectorCalls[0]?.history.map((entry) => entry.localDate) ?? [];
    assert.equal(wednesdayHistory.includes('2026-03-03'), false);
    assert.ok(selectorCalls.length >= 1);
  });

  it('40–41. unknown persisted id is kept and unknown history metadata is preserved', async () => {
    const daily = new MemoryDailyFocusRepository();
    seedHistory(daily, YESTERDAY, 'retired_history_action', { behavior_family: 'legacy_family' });
    const { service, weeklyInput } = createService({ daily });
    await service.getOrCreateCurrent({ userId: 'user-1', localDate: TODAY, weeklyFocus: weeklyInput });
    const row = [...daily.rows.values()].find((item) => item.local_date === TODAY)!;
    row.action_id = 'retired_current_action';
    daily.seed(row);
    const selectorBefore = daily.inserts;
    const again = createService({ daily });
    const result = await again.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: again.weeklyInput,
    });
    assert.equal(daily.inserts, selectorBefore);
    assert.equal(again.selectorCalls.length, 0);
    assert.equal(result.ok && result.value.status === 'ready' && result.value.assignment.actionId, 'retired_current_action');
    assert.equal(result.ok && result.value.status === 'ready' && result.value.actionKnown, false);
  });

  it('42–46. failures stay unavailable and do not invent state', async () => {
    const readFail = new MemoryDailyFocusRepository();
    readFail.readError = { ok: false, error: { code: 'INTEGRATION', message: 'fail' } };
    const readService = createService({ daily: readFail });
    const readResult = await readService.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: readService.weeklyInput,
    });
    assert.equal(readResult.ok, false);

    const historyFail = new MemoryDailyFocusRepository();
    historyFail.historyError = { ok: false, error: { code: 'INTEGRATION', message: 'fail' } };
    const historyService = createService({ daily: historyFail });
    const historyResult = await historyService.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: historyService.weeklyInput,
    });
    assert.equal(historyResult.ok, false);
    assert.equal(historyFail.inserts, 0);

    const insertFail = new MemoryDailyFocusRepository();
    insertFail.insertError = { code: '400', message: 'write failed' };
    const insertService = createService({ daily: insertFail });
    const insertResult = await insertService.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: insertService.weeklyInput,
    });
    assert.equal(insertResult.ok, false);

    const { service, daily, weeklyInput } = createService();
    await service.getOrCreateCurrent({ userId: 'user-1', localDate: TODAY, weeklyFocus: weeklyInput });
    const original = [...daily.rows.values()][0]!;
    daily.swapError = { ok: false, error: { code: 'INTEGRATION', message: 'swap fail' } };
    const swapFail = await service.swapCurrent({ userId: 'user-1', localDate: TODAY });
    assert.equal(swapFail.ok, false);
    assert.equal(daily.rows.get(`user-1:${TODAY}`)?.action_id, original.action_id);

    daily.completeError = { ok: false, error: { code: 'INTEGRATION', message: 'complete fail' } };
    const completeFail = await service.markCompleteCurrent({ userId: 'user-1', localDate: TODAY });
    assert.equal(completeFail.ok, false);
    assert.equal(daily.rows.get(`user-1:${TODAY}`)?.completed_at, null);
  });

  it('67. week rollover uses Monday helper for a new weekStartDate', async () => {
    const daily = new MemoryDailyFocusRepository();
    const first = createService({ daily, today: TODAY });
    await first.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: TODAY,
      weeklyFocus: first.weeklyInput,
    });
    const nextWeek = '2026-03-09';
    const second = createService({ daily, today: nextWeek });
    const result = await second.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: nextWeek,
      weeklyFocus: weeklyReady(nextWeek),
    });
    assert.equal(result.ok && result.value.status === 'ready' && result.value.assignment.weekStartDate, nextWeek);
    assert.equal(getWeeklyCheckInWeekStartDate(nextWeek), nextWeek);
  });
});

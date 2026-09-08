import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Result } from '@/lib/core';
import type { InitialLifestyleCheck } from '@/lib/domain/initial-lifestyle';
import type { HealthSnapshot } from '@/lib/domain/snapshot';
import type { WeeklyCheckIn, WeeklyCheckInAnswers } from '@/lib/domain/weekly-check-in';
import {
  determineWeeklyFocus,
  WEEKLY_FOCUS_ENGINE_VERSION,
  type WeeklyFocusAssignment,
  type WeeklyFocusEngineInput,
  type WeeklyFocusEngineResult,
} from '@/lib/domain/weekly-focus';
import type {
  InsertWeeklyFocusAssignmentInput,
  WeeklyFocusRepository,
} from '@/lib/repositories/weekly-focus.repository';
import {
  mapWeeklyFocusInvalidRowError,
  mapWeeklyFocusRow,
  mapWeeklyFocusWriteError,
  weeklyFocusToInsert,
} from '@/lib/repositories/weekly-focus-mappers';
import type {
  UpsertWeeklyCheckInInput,
  WeeklyCheckInRepository,
} from '@/lib/repositories/weekly-check-in.repository';
import type { Database } from '@/lib/supabase/database.types';
import { DefaultWeeklyFocusService } from '@/lib/services/weekly-focus/weekly-focus.service';

import { healthyLifestyle } from '@/lib/domain/weekly-focus/weekly-focus.test-fixtures';

type WeeklyFocusRow = Database['public']['Tables']['user_weekly_focus']['Row'];

const healthyAnswers: WeeklyCheckInAnswers = {
  sleepQuality: 5,
  energy: 5,
  stress: 1,
  trainingFrequency: 'twice',
  everydayActivity: 5,
  eatingQuality: 5,
  alcoholConsumption: 'none',
  planAdherence: 3,
};

function lifestyleRecord(
  overrides: Partial<InitialLifestyleCheck> = {},
): InitialLifestyleCheck {
  const answers = healthyLifestyle();
  return {
    id: 'il-1',
    userId: 'user-1',
    sleepQuality: answers.sleepQuality!,
    energy: answers.energy!,
    stress: answers.stress!,
    lessHealthyFoodFrequency: answers.lessHealthyFoodFrequency ?? 'never',
    everydayActivity: answers.everydayActivity!,
    eatingQuality: answers.eatingQuality!,
    alcoholConsumption: answers.alcoholConsumption!,
    createdAt: '2026-08-20T08:00:00.000Z',
    updatedAt: '2026-08-20T08:00:00.000Z',
    ...overrides,
  };
}

function snapshot(primaryFocus = 'improve_activity'): HealthSnapshot {
  return {
    id: 'snap-1',
    userId: 'user-1',
    createdAt: '2026-08-20T08:00:00.000Z',
    overallScore: 72,
    bmiScore: 70,
    whtrScore: 68,
    bodyFatScore: 71,
    activityScore: 68,
    primaryFocus,
    coachRecommendationId: 'activity_moderate_brisk_walk_v1',
    weightKg: 80,
    waistCm: 90,
    neckCm: 38,
    engineVersion: '1.0.0',
    snapshotReason: 'onboarding',
    bodyFatPct: 18,
    coachDurationMinutes: 30,
    coachFrequencyPerWeek: 4,
  };
}

class MemoryWeeklyFocusRepository implements WeeklyFocusRepository {
  readonly rows = new Map<string, WeeklyFocusRow>();
  reads = 0;
  inserts = 0;
  insertError: { code?: string; message?: string } | null = null;
  hideExistingUntilInsertAttempt = false;
  nextId = 1;

  private key(userId: string, weekStartDate: string): string {
    return `${userId}:${weekStartDate}`;
  }

  seed(row: WeeklyFocusRow): void {
    this.rows.set(this.key(row.user_id, row.week_start_date), row);
  }

  async getByUserAndWeek(
    userId: string,
    weekStartDate: string,
  ): Promise<Result<WeeklyFocusAssignment | null>> {
    this.reads += 1;
    if (this.hideExistingUntilInsertAttempt && this.inserts === 0) {
      return { ok: true, value: null };
    }
    const row = this.rows.get(this.key(userId, weekStartDate));
    if (!row) {
      return { ok: true, value: null };
    }
    const mapped = mapWeeklyFocusRow(row);
    if (!mapped) {
      return { ok: false, error: mapWeeklyFocusInvalidRowError() };
    }
    return { ok: true, value: mapped };
  }

  async insert(input: InsertWeeklyFocusAssignmentInput): Promise<Result<WeeklyFocusAssignment>> {
    this.inserts += 1;
    if (this.insertError) {
      return { ok: false, error: mapWeeklyFocusWriteError(this.insertError) };
    }
    const key = this.key(input.userId, input.weekStartDate);
    if (this.rows.has(key)) {
      return { ok: false, error: mapWeeklyFocusWriteError({ code: '23505' }) };
    }
    const payload = weeklyFocusToInsert(input);
    const row: WeeklyFocusRow = {
      id: `focus-${this.nextId}`,
      user_id: payload.user_id,
      week_start_date: payload.week_start_date,
      area_1: payload.area_1,
      area_1_mode: payload.area_1_mode,
      area_1_need: payload.area_1_need,
      area_2: payload.area_2,
      area_2_mode: payload.area_2_mode,
      area_2_need: payload.area_2_need,
      recovery_constraint: payload.recovery_constraint,
      engine_version: payload.engine_version,
      insufficient_evidence_fallback: payload.insufficient_evidence_fallback ?? false,
      created_at: '2026-08-31T08:00:00.000Z',
    };
    this.nextId += 1;
    this.rows.set(key, row);
    return { ok: true, value: mapWeeklyFocusRow(row)! };
  }
}

class MemoryWeeklyCheckInRepository implements WeeklyCheckInRepository {
  readonly rows = new Map<string, WeeklyCheckIn>();
  reads: string[] = [];

  async getByUserAndWeek(
    userId: string,
    weekStartDate: string,
  ): Promise<Result<WeeklyCheckIn | null>> {
    this.reads.push(weekStartDate);
    return { ok: true, value: this.rows.get(`${userId}:${weekStartDate}`) ?? null };
  }

  async upsertCurrentWeek(input: UpsertWeeklyCheckInInput): Promise<Result<WeeklyCheckIn>> {
    const key = `${input.userId}:${input.weekStartDate}`;
    const saved: WeeklyCheckIn = {
      id: `ci-${this.rows.size + 1}`,
      userId: input.userId,
      weekStartDate: input.weekStartDate,
      ...input.answers,
      createdAt: '2026-08-24T08:00:00.000Z',
      updatedAt: '2026-08-24T08:00:00.000Z',
    };
    this.rows.set(key, saved);
    return { ok: true, value: saved };
  }
}

function createService(options?: {
  focus?: MemoryWeeklyFocusRepository;
  checkIns?: MemoryWeeklyCheckInRepository;
  lifestyle?: Result<InitialLifestyleCheck | null>;
  snapshot?: Result<HealthSnapshot | null>;
  engine?: (input: WeeklyFocusEngineInput) => WeeklyFocusEngineResult;
}) {
  const focus = options?.focus ?? new MemoryWeeklyFocusRepository();
  const checkIns = options?.checkIns ?? new MemoryWeeklyCheckInRepository();
  let lifestyleCalls = 0;
  let snapshotCalls = 0;
  const engineCalls: WeeklyFocusEngineInput[] = [];

  const service = new DefaultWeeklyFocusService({
    weeklyFocusRepository: focus,
    weeklyCheckInRepository: checkIns,
    initialLifestyle: {
      get: async () => {
        lifestyleCalls += 1;
        return options?.lifestyle ?? { ok: true, value: lifestyleRecord() };
      },
    },
    getLatestSnapshot: async () => {
      snapshotCalls += 1;
      return options?.snapshot ?? { ok: true, value: snapshot() };
    },
    determineWeeklyFocus: (input) => {
      engineCalls.push(input);
      return (options?.engine ?? determineWeeklyFocus)(input);
    },
  });

  return { service, focus, checkIns, engineCalls, counts: () => ({ lifestyleCalls, snapshotCalls }) };
}

const readyProfile = {
  status: 'ready' as const,
  activityLevel: 'moderately_active' as const,
};

describe('Weekly Focus persistence lifecycle', () => {
  it('1. first open in a week inserts one assignment', async () => {
    const { service, focus } = createService();
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      throw new Error('expected ready');
    }
    assert.equal(result.value.data.weekStartDate, '2026-08-31');
    assert.equal(focus.inserts, 1);
    assert.equal(focus.rows.size, 1);
  });

  it('2. second call same week returns stored assignment without engine or input fetches', async () => {
    const { service, focus, checkIns, engineCalls, counts } = createService();
    await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    const afterCreate = { inserts: focus.inserts, engine: engineCalls.length, ...counts(), checkIns: checkIns.reads.length };

    const second = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-09-02',
      profile: readyProfile,
    });
    assert.equal(second.ok && second.value.status === 'ready', true);
    assert.equal(focus.inserts, afterCreate.inserts);
    assert.equal(engineCalls.length, afterCreate.engine);
    assert.equal(counts().lifestyleCalls, afterCreate.lifestyleCalls);
    assert.equal(counts().snapshotCalls, afterCreate.snapshotCalls);
    assert.equal(checkIns.reads.length, afterCreate.checkIns);
  });

  it('3–5. mid-week snapshot, profile, and check-in changes do not alter the assignment', async () => {
    const { service, focus, checkIns } = createService({
      snapshot: { ok: true, value: snapshot('improve_activity') },
    });
    const first = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(first.ok && first.value.status === 'ready', true);
    const frozen = first.ok && first.value.status === 'ready' ? first.value.data : null;

    await checkIns.upsertCurrentWeek({
      userId: 'user-1',
      weekStartDate: '2026-08-31',
      answers: { ...healthyAnswers, sleepQuality: 1 },
    });

    const after = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-09-03',
      profile: { status: 'ready', activityLevel: 'sedentary' },
    });
    assert.deepEqual(after.ok && after.value.status === 'ready' ? after.value.data : null, frozen);
    assert.equal(focus.inserts, 1);
  });

  it('6. next Monday inserts a new row', async () => {
    const { service, focus } = createService();
    await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    const next = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-09-07',
      profile: readyProfile,
    });
    assert.equal(next.ok && next.value.status === 'ready', true);
    if (next.ok && next.value.status === 'ready') {
      assert.equal(next.value.data.weekStartDate, '2026-09-07');
    }
    assert.equal(focus.rows.size, 2);
    assert.equal(focus.inserts, 2);
  });

  it('7–8. Focus W consumes check-in W-7 and never check-in W', async () => {
    const checkIns = new MemoryWeeklyCheckInRepository();
    await checkIns.upsertCurrentWeek({
      userId: 'user-1',
      weekStartDate: '2026-08-24',
      answers: { ...healthyAnswers, sleepQuality: 1 },
    });
    await checkIns.upsertCurrentWeek({
      userId: 'user-1',
      weekStartDate: '2026-08-31',
      answers: { ...healthyAnswers, eatingQuality: 1 },
    });
    const { service, engineCalls } = createService({ checkIns });
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(result.ok && result.value.status === 'ready', true);
    assert.deepEqual(checkIns.reads, ['2026-08-24']);
    assert.equal(engineCalls[0]?.weeklyCheckIn?.sleepQuality, 1);
    assert.equal(engineCalls[0]?.weeklyCheckIn?.eatingQuality, 5);
    if (result.ok && result.value.status === 'ready') {
      assert.equal(result.value.data.focuses[0]?.area, 'sleep');
    }
  });

  it('9. Monday check-in W affects W+7, not W', async () => {
    const checkIns = new MemoryWeeklyCheckInRepository();
    const { service } = createService({ checkIns });
    const weekW = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    await checkIns.upsertCurrentWeek({
      userId: 'user-1',
      weekStartDate: '2026-08-31',
      answers: { ...healthyAnswers, sleepQuality: 1 },
    });
    const stillW = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.deepEqual(
      weekW.ok && weekW.value.status === 'ready' ? weekW.value.data : null,
      stillW.ok && stillW.value.status === 'ready' ? stillW.value.data : null,
    );

    const weekNext = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-09-07',
      profile: readyProfile,
    });
    assert.equal(weekNext.ok && weekNext.value.status === 'ready', true);
    if (weekNext.ok && weekNext.value.status === 'ready') {
      assert.equal(weekNext.value.data.focuses[0]?.area, 'sleep');
      assert.equal(weekNext.value.data.focuses[0]?.mode, 'improve');
    }
  });

  it('10. Sunday check-in W affects W+7', async () => {
    const checkIns = new MemoryWeeklyCheckInRepository();
    await checkIns.upsertCurrentWeek({
      userId: 'user-1',
      weekStartDate: '2026-08-24',
      answers: { ...healthyAnswers, alcoholConsumption: '15_plus' },
    });
    const { service } = createService({ checkIns });
    const next = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(next.ok && next.value.status === 'ready', true);
    if (next.ok && next.value.status === 'ready') {
      assert.equal(next.value.data.focuses[0]?.area, 'alcohol');
      assert.equal(next.value.data.focuses[0]?.needScore, 5);
    }
  });

  it('11. first onboarding week works without previous check-in', async () => {
    const { service, engineCalls } = createService();
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(result.ok && result.value.status === 'ready', true);
    assert.equal(engineCalls[0]?.weeklyCheckIn ?? null, null);
    assert.equal(engineCalls[0]?.previousFocuses ?? null, null);
  });

  it('12. skipped Initial Lifestyle does not invent fields', async () => {
    const { service, engineCalls } = createService({
      lifestyle: { ok: true, value: null },
    });
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(result.ok && result.value.status === 'ready', true);
    assert.equal(engineCalls[0]?.initialLifestyle ?? null, null);
  });

  it('13. previous focus pair is passed to the engine', async () => {
    const { service, engineCalls } = createService();
    const first = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(first.ok && first.value.status === 'ready', true);
    const firstAreas =
      first.ok && first.value.status === 'ready'
        ? [first.value.data.focuses[0].area, first.value.data.focuses[1].area]
        : [];
    await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-09-07',
      profile: readyProfile,
    });
    assert.deepEqual(engineCalls[1]?.previousFocuses, firstAreas);
  });

  it('14. missing snapshot still creates an assignment', async () => {
    const { service, engineCalls } = createService({
      snapshot: { ok: true, value: null },
    });
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(result.ok && result.value.status === 'ready', true);
    assert.equal(engineCalls[0]?.primaryFocus ?? null, null);
  });

  it('15. snapshot fetch error on create path is unavailable', async () => {
    const { service, focus } = createService({
      snapshot: { ok: false, error: { code: 'NETWORK', message: 'offline' } },
    });
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(result.ok, false);
    assert.equal(focus.inserts, 0);
  });

  it('16. existing row is returned even if snapshot/input services fail', async () => {
    const seeded = createService();
    await seeded.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    const { service, counts } = createService({
      focus: seeded.focus,
      snapshot: { ok: false, error: { code: 'NETWORK', message: 'offline' } },
      lifestyle: { ok: false, error: { code: 'NETWORK', message: 'offline' } },
    });
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: { status: 'loading' },
    });
    assert.equal(result.ok && result.value.status === 'ready', true);
    assert.equal(counts().snapshotCalls, 0);
    assert.equal(counts().lifestyleCalls, 0);
  });

  it('17. profile/activityLevel not ready does not create an assignment', async () => {
    const { service, focus } = createService();
    const loading = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: { status: 'loading' },
    });
    assert.equal(loading.ok && loading.value.status === 'not_ready', true);
    assert.equal(focus.inserts, 0);

    const missing = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: { status: 'ready', activityLevel: null },
    });
    assert.equal(missing.ok && missing.value.status === 'unavailable', true);
    assert.equal(focus.inserts, 0);
  });

  it('18. insufficientEvidenceFallback is persisted and ready', async () => {
    const fallback: WeeklyFocusEngineResult = {
      engineVersion: WEEKLY_FOCUS_ENGINE_VERSION,
      focuses: [
        { area: 'everyday_movement', mode: 'maintain', needScore: 0 },
        { area: 'training', mode: 'maintain', needScore: 0 },
      ],
      scores: {
        everyday_movement: { status: 'unknown' },
        training: { status: 'unknown' },
        sleep: { status: 'unknown' },
        nutrition: { status: 'unknown' },
        alcohol: { status: 'unknown' },
        recovery: { status: 'unknown' },
      },
      recoveryConstraint: false,
      insufficientEvidenceFallback: true,
    };
    const { service } = createService({ engine: () => fallback });
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(result.ok && result.value.status === 'ready', true);
    if (result.ok && result.value.status === 'ready') {
      assert.equal(result.value.data.insufficientEvidenceFallback, true);
    }
  });

  it('19. unique 23505 race re-reads the winner and does not overwrite', async () => {
    const focus = new MemoryWeeklyFocusRepository();
    focus.hideExistingUntilInsertAttempt = true;
    focus.insertError = { code: '23505' };
    focus.seed({
      id: 'winner',
      user_id: 'user-1',
      week_start_date: '2026-08-31',
      area_1: 'sleep',
      area_1_mode: 'improve',
      area_1_need: 5,
      area_2: 'everyday_movement',
      area_2_mode: 'maintain',
      area_2_need: 0,
      recovery_constraint: true,
      engine_version: WEEKLY_FOCUS_ENGINE_VERSION,
      insufficient_evidence_fallback: false,
      created_at: '2026-08-31T07:00:00.000Z',
    });
    const { service } = createService({ focus });
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(result.ok && result.value.status === 'ready', true);
    if (result.ok && result.value.status === 'ready') {
      assert.equal(result.value.data.focuses[0]?.area, 'sleep');
    }
    assert.equal(focus.inserts, 1);
    assert.equal(focus.rows.size, 1);
    assert.equal(focus.rows.get('user-1:2026-08-31')?.area_1, 'sleep');
  });

  it('20. non-unique insert error is unavailable/error', async () => {
    const focus = new MemoryWeeklyFocusRepository();
    focus.insertError = { code: '400', message: 'write failed' };
    const { service } = createService({ focus });
    const result = await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(result.ok, false);
  });

  it('28. a new service instance restores the same persisted row', async () => {
    const focus = new MemoryWeeklyFocusRepository();
    const first = createService({ focus });
    const created = await first.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    const second = createService({ focus });
    const restored = await second.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.deepEqual(
      created.ok && created.value.status === 'ready' ? created.value.data : null,
      restored.ok && restored.value.status === 'ready' ? restored.value.data : null,
    );
    assert.equal(focus.inserts, 1);
  });

  it('30. planAdherence has no integration effect', async () => {
    const low = new MemoryWeeklyCheckInRepository();
    await low.upsertCurrentWeek({
      userId: 'user-1',
      weekStartDate: '2026-08-24',
      answers: { ...healthyAnswers, planAdherence: 1 },
    });
    const high = new MemoryWeeklyCheckInRepository();
    await high.upsertCurrentWeek({
      userId: 'user-1',
      weekStartDate: '2026-08-24',
      answers: { ...healthyAnswers, planAdherence: 5 },
    });
    const a = createService({ checkIns: low });
    const b = createService({ checkIns: high });
    const first = await a.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    const second = await b.service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.deepEqual(
      first.ok && first.value.status === 'ready' ? first.value.data.focuses : null,
      second.ok && second.value.status === 'ready' ? second.value.data.focuses : null,
    );
  });

  it('31. persisted primaryFocus is passed through without rerunning Focus Engine', async () => {
    const { service, engineCalls } = createService({
      snapshot: { ok: true, value: snapshot('reduce_waist') },
    });
    await service.getOrCreateCurrent({
      userId: 'user-1',
      localDate: '2026-08-31',
      profile: readyProfile,
    });
    assert.equal(engineCalls[0]?.primaryFocus, 'reduce_waist');
  });
});

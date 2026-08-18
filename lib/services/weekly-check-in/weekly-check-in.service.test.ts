import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Result } from '../../core';
import type { WeeklyCheckIn, WeeklyCheckInAnswers } from '../../domain/weekly-check-in';
import type {
  UpsertWeeklyCheckInInput,
  WeeklyCheckInRepository,
} from '../../repositories/weekly-check-in.repository';

import { DefaultWeeklyCheckInService } from './weekly-check-in.service';

const answers: WeeklyCheckInAnswers = {
  sleepQuality: 3,
  energy: 4,
  stress: 2,
  trainingFrequency: 'twice',
  everydayActivity: 3,
  eatingQuality: 4,
  alcoholConsumption: '1_3',
  planAdherence: 5,
};

class MemoryWeeklyCheckInRepository implements WeeklyCheckInRepository {
  readonly rows = new Map<string, WeeklyCheckIn>();
  reads: Array<{ userId: string; weekStartDate: string }> = [];
  writes: UpsertWeeklyCheckInInput[] = [];

  async getByUserAndWeek(
    userId: string,
    weekStartDate: string,
  ): Promise<Result<WeeklyCheckIn | null>> {
    this.reads.push({ userId, weekStartDate });
    return { ok: true, value: this.rows.get(`${userId}:${weekStartDate}`) ?? null };
  }

  async upsertCurrentWeek(input: UpsertWeeklyCheckInInput): Promise<Result<WeeklyCheckIn>> {
    this.writes.push(input);
    const key = `${input.userId}:${input.weekStartDate}`;
    const existing = this.rows.get(key);
    const now = '2026-08-13T08:00:00.000Z';
    const saved: WeeklyCheckIn = {
      id: existing?.id ?? 'check-in-1',
      userId: input.userId,
      weekStartDate: input.weekStartDate,
      ...input.answers,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.rows.set(key, saved);
    return { ok: true, value: saved };
  }
}

describe('WeeklyCheckInService — current week', () => {
  it('returns empty when the current week has no row', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);

    const result = await service.getCurrentWeek('user-1', '2026-08-13');

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.value, { status: 'empty', weekStartDate: '2026-08-10' });
    }
    assert.deepEqual(repository.reads, [{ userId: 'user-1', weekStartDate: '2026-08-10' }]);
  });

  it('first save creates and current week read returns ready', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);

    const saved = await service.saveCurrentWeek('user-1', answers, '2026-08-13');
    const current = await service.getCurrentWeek('user-1', '2026-08-13');

    assert.equal(saved.ok, true);
    if (saved.ok) {
      assert.equal(saved.value.weekStartDate, '2026-08-10');
      assert.equal(saved.value.userId, 'user-1');
      assert.equal(saved.value.sleepQuality, 3);
    }
    assert.equal(current.ok, true);
    if (current.ok) {
      assert.equal(current.value.status, 'ready');
      assert.equal(current.value.weekStartDate, '2026-08-10');
    }
    assert.equal(repository.rows.size, 1);
  });

  it('second save in the same week updates the same logical week', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);

    const first = await service.saveCurrentWeek('user-1', answers, '2026-08-11');
    const second = await service.saveCurrentWeek(
      'user-1',
      { ...answers, energy: 5, planAdherence: 4 },
      '2026-08-16',
    );

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (first.ok && second.ok) {
      assert.equal(first.value.id, second.value.id);
      assert.equal(first.value.weekStartDate, '2026-08-10');
      assert.equal(second.value.weekStartDate, '2026-08-10');
      assert.equal(second.value.energy, 5);
      assert.equal(second.value.planAdherence, 4);
      assert.equal(first.value.createdAt, second.value.createdAt);
    }
    assert.equal(repository.rows.size, 1);
    assert.equal(repository.writes.length, 2);
    assert.equal(repository.writes[0]?.weekStartDate, '2026-08-10');
    assert.equal(repository.writes[1]?.weekStartDate, '2026-08-10');
  });
});

describe('WeeklyCheckInService — week identity', () => {
  it('uses the approved Monday key for midweek, Sunday, and month boundary', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);

    await service.getCurrentWeek('user-1', '2026-08-13');
    await service.saveCurrentWeek('user-1', answers, '2026-08-16');
    await service.getCurrentWeek('user-1', '2026-09-01');

    assert.equal(repository.reads[0]?.weekStartDate, '2026-08-10');
    assert.equal(repository.writes[0]?.weekStartDate, '2026-08-10');
    assert.equal(repository.reads[1]?.weekStartDate, '2026-08-31');
  });
});

describe('WeeklyCheckInService — validation', () => {
  it('rejects invalid answers before persistence', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);

    const result = await service.saveCurrentWeek(
      'user-1',
      { ...answers, sleepQuality: 0 },
      '2026-08-13',
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, 'VALIDATION');
    }
    assert.equal(repository.writes.length, 0);
    assert.equal(repository.rows.size, 0);
  });

  it('rejects a missing required answer before persistence', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);
    const { alcoholConsumption: _removed, ...incomplete } = answers;

    const result = await service.saveCurrentWeek('user-1', incomplete, '2026-08-13');

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, 'VALIDATION');
      assert.equal(JSON.stringify(result.error).includes('1_3'), false);
    }
    assert.equal(repository.writes.length, 0);
  });
});

describe('WeeklyCheckInService — boundaries', () => {
  it('does not persist Health Score, Focus, Plan, device, note, or snapshot fields', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);

    const result = await service.saveCurrentWeek(
      'user-1',
      {
        ...answers,
        healthScore: 74,
        focus: 'reduce_waist',
        planId: 'waist_walk_after_dinner_v1',
        snapshotReason: 'weekly_checkin',
        steps: 8000,
        notes: 'sov dåligt',
      },
      '2026-08-13',
    );

    assert.equal(result.ok, false);
    assert.equal(repository.writes.length, 0);
  });

  it('only collaborates with the Weekly Check-in repository', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);

    await service.saveCurrentWeek('user-1', answers, '2026-08-13');
    await service.getCurrentWeek('user-1', '2026-08-13');

    assert.equal(repository.writes.length, 1);
    assert.equal(repository.reads.length, 1);
    assert.deepEqual(Object.keys(repository.writes[0] ?? {}).sort(), [
      'answers',
      'userId',
      'weekStartDate',
    ]);
  });
});

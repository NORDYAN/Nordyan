import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Result } from '../../core';
import type {
  InitialLifestyleAnswers,
  InitialLifestyleCheck,
} from '../../domain/initial-lifestyle';
import type {
  InitialLifestyleRepository,
  UpsertInitialLifestyleInput,
} from '../../repositories/initial-lifestyle.repository';

import { DefaultInitialLifestyleService } from './initial-lifestyle.service';

const answers: InitialLifestyleAnswers = {
  sleepQuality: 3,
  energy: 4,
  stress: 2,
  lessHealthyFoodFrequency: 'two_three',
  everydayActivity: 3,
  eatingQuality: 4,
  alcoholConsumption: '1_3',
};

class MemoryInitialLifestyleRepository implements InitialLifestyleRepository {
  readonly rows = new Map<string, InitialLifestyleCheck>();
  reads: string[] = [];
  writes: UpsertInitialLifestyleInput[] = [];

  async getByUser(userId: string): Promise<Result<InitialLifestyleCheck | null>> {
    this.reads.push(userId);
    return { ok: true, value: this.rows.get(userId) ?? null };
  }

  async upsert(input: UpsertInitialLifestyleInput): Promise<Result<InitialLifestyleCheck>> {
    this.writes.push(input);
    const existing = this.rows.get(input.userId);
    const now = '2026-08-13T16:00:00.000Z';
    const saved: InitialLifestyleCheck = {
      id: existing?.id ?? 'lifestyle-1',
      userId: input.userId,
      ...input.answers,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.rows.set(input.userId, saved);
    return { ok: true, value: saved };
  }
}

describe('InitialLifestyleService — get', () => {
  it('requires userId', async () => {
    const repository = new MemoryInitialLifestyleRepository();
    const service = new DefaultInitialLifestyleService(repository);

    const result = await service.get('');

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, 'VALIDATION');
    }
    assert.equal(repository.reads.length, 0);
  });

  it('returns null when absent', async () => {
    const repository = new MemoryInitialLifestyleRepository();
    const service = new DefaultInitialLifestyleService(repository);

    const result = await service.get('user-1');

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value, null);
    }
    assert.deepEqual(repository.reads, ['user-1']);
  });

  it('returns the mapped baseline when present', async () => {
    const repository = new MemoryInitialLifestyleRepository();
    const service = new DefaultInitialLifestyleService(repository);
    await service.save('user-1', answers);

    const result = await service.get('user-1');

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value?.userId, 'user-1');
      assert.equal(result.value?.sleepQuality, 3);
      assert.equal(result.value?.alcoholConsumption, '1_3');
      assert.equal('planAdherence' in (result.value ?? {}), false);
    }
  });
});

describe('InitialLifestyleService — upsert', () => {
  it('first save creates a baseline row', async () => {
    const repository = new MemoryInitialLifestyleRepository();
    const service = new DefaultInitialLifestyleService(repository);

    const saved = await service.save('user-1', answers);

    assert.equal(saved.ok, true);
    if (saved.ok) {
      assert.equal(saved.value.userId, 'user-1');
      assert.equal(saved.value.energy, 4);
      assert.equal(saved.value.lessHealthyFoodFrequency, 'two_three');
    }
    assert.equal(repository.rows.size, 1);
  });

  it('second save updates the same logical user baseline', async () => {
    const repository = new MemoryInitialLifestyleRepository();
    const service = new DefaultInitialLifestyleService(repository);

    const first = await service.save('user-1', answers);
    const second = await service.save('user-1', { ...answers, energy: 5, stress: 1 });

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (first.ok && second.ok) {
      assert.equal(first.value.id, second.value.id);
      assert.equal(second.value.energy, 5);
      assert.equal(second.value.stress, 1);
      assert.equal(first.value.createdAt, second.value.createdAt);
    }
    assert.equal(repository.rows.size, 1);
    assert.equal(repository.writes.length, 2);
  });
});

describe('InitialLifestyleService — validation', () => {
  it('rejects incomplete answers before persistence', async () => {
    const repository = new MemoryInitialLifestyleRepository();
    const service = new DefaultInitialLifestyleService(repository);
    const { alcoholConsumption: _removed, ...incomplete } = answers;

    const result = await service.save('user-1', incomplete);

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, 'VALIDATION');
      assert.equal(JSON.stringify(result.error).includes('1_3'), false);
    }
    assert.equal(repository.writes.length, 0);
  });

  it('rejects an invalid scale before persistence', async () => {
    const repository = new MemoryInitialLifestyleRepository();
    const service = new DefaultInitialLifestyleService(repository);

    const result = await service.save('user-1', { ...answers, sleepQuality: 0 });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, 'VALIDATION');
    }
    assert.equal(repository.writes.length, 0);
  });

  it('rejects an invalid less-healthy-food frequency bucket before persistence', async () => {
    const repository = new MemoryInitialLifestyleRepository();
    const service = new DefaultInitialLifestyleService(repository);

    const result = await service.save('user-1', { ...answers, lessHealthyFoodFrequency: 'twice' });

    assert.equal(result.ok, false);
    assert.equal(repository.writes.length, 0);
  });

  it('rejects an invalid alcohol bucket before persistence', async () => {
    const repository = new MemoryInitialLifestyleRepository();
    const service = new DefaultInitialLifestyleService(repository);

    const result = await service.save('user-1', { ...answers, alcoholConsumption: '15' });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(JSON.stringify(result.error).includes('15'), false);
      assert.equal(JSON.stringify(result.error).includes('alcohol'), false);
    }
    assert.equal(repository.writes.length, 0);
  });

  it('rejects unknown fields before persistence', async () => {
    const repository = new MemoryInitialLifestyleRepository();
    const service = new DefaultInitialLifestyleService(repository);

    const result = await service.save('user-1', {
      ...answers,
      planAdherence: 4,
      healthScore: 74,
      focus: 'reduce_waist',
      planId: 'waist_walk_after_dinner_v1',
      snapshotId: 'snap-1',
    });

    assert.equal(result.ok, false);
    assert.equal(repository.writes.length, 0);
  });
});

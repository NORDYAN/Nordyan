import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { InitialLifestyleAnswers } from '../domain/initial-lifestyle';
import type { Database } from '../supabase/database.types';

import {
  INITIAL_LIFESTYLE_LOOKUP_ERROR_MESSAGE,
  INITIAL_LIFESTYLE_READ_ERROR_MESSAGE,
  INITIAL_LIFESTYLE_SAVE_ERROR_MESSAGE,
  initialLifestyleToUpsert,
  mapInitialLifestyleReadError,
  mapInitialLifestyleRow,
  mapInitialLifestyleWriteError,
  requireInitialLifestyleLookup,
} from './initial-lifestyle-mappers';

type InitialLifestyleRow = Database['public']['Tables']['initial_lifestyle_checks']['Row'];

const answers: InitialLifestyleAnswers = {
  sleepQuality: 3,
  energy: 4,
  stress: 2,
  lessHealthyFoodFrequency: 'two_three',
  everydayActivity: 3,
  eatingQuality: 4,
  alcoholConsumption: '1_3',
};

const row: InitialLifestyleRow = {
  id: 'lifestyle-1',
  user_id: 'user-1',
  sleep_quality: 3,
  energy: 4,
  stress: 2,
  less_healthy_food_frequency: 'two_three',
  everyday_activity: 3,
  eating_quality: 4,
  alcohol_consumption: '1_3',
  created_at: '2026-08-13T15:00:00.000Z',
  updated_at: '2026-08-13T15:00:00.000Z',
};

describe('initial-lifestyle mapping', () => {
  it('maps a DB row to the InitialLifestyleCheck domain record', () => {
    const mapped = mapInitialLifestyleRow(row);

    assert.deepEqual(mapped, {
      id: 'lifestyle-1',
      userId: 'user-1',
      ...answers,
      createdAt: '2026-08-13T15:00:00.000Z',
      updatedAt: '2026-08-13T15:00:00.000Z',
    });
  });

  it('maps write input to DB snake_case fields only', () => {
    const payload = initialLifestyleToUpsert({
      userId: 'user-1',
      answers,
    });

    assert.deepEqual(payload, {
      user_id: 'user-1',
      sleep_quality: 3,
      energy: 4,
      stress: 2,
      less_healthy_food_frequency: 'two_three',
      everyday_activity: 3,
      eating_quality: 4,
      alcohol_consumption: '1_3',
    });

    assert.equal('plan_adherence' in payload, false);
    assert.equal('training_frequency' in payload, false);
    assert.equal('week_start_date' in payload, false);
    assert.equal('health_score' in payload, false);
    assert.equal('primary_focus' in payload, false);
    assert.equal('plan_id' in payload, false);
    assert.equal('snapshot_id' in payload, false);
    assert.equal('snapshot_reason' in payload, false);
    assert.equal('notes' in payload, false);
    assert.equal('steps' in payload, false);
  });

  it('rejects rows with unknown bucket values', () => {
    assert.equal(mapInitialLifestyleRow({ ...row, less_healthy_food_frequency: 'twice' }), null);
    assert.equal(mapInitialLifestyleRow({ ...row, alcohol_consumption: '15' }), null);
  });

  it('preserves legacy rows with null less_healthy_food_frequency', () => {
    const mapped = mapInitialLifestyleRow({ ...row, less_healthy_food_frequency: null });

    assert.deepEqual(mapped, {
      id: 'lifestyle-1',
      userId: 'user-1',
      ...answers,
      lessHealthyFoodFrequency: null,
      createdAt: '2026-08-13T15:00:00.000Z',
      updatedAt: '2026-08-13T15:00:00.000Z',
    });
  });
});

describe('initial-lifestyle lookup boundary', () => {
  it('requires userId', () => {
    assert.equal(requireInitialLifestyleLookup('user-1'), null);
    assert.equal(requireInitialLifestyleLookup('')?.code, 'VALIDATION');
    assert.equal(requireInitialLifestyleLookup('   ')?.message, INITIAL_LIFESTYLE_LOOKUP_ERROR_MESSAGE);
  });
});

describe('initial-lifestyle error privacy', () => {
  it('does not leak raw persistence messages or alcohol answers', () => {
    const leaked = {
      code: '23514',
      message: 'new row violates check constraint alcohol_consumption 15_plus',
    };
    const readError = mapInitialLifestyleReadError(leaked);
    const writeError = mapInitialLifestyleWriteError(leaked);

    assert.equal(readError.message, INITIAL_LIFESTYLE_READ_ERROR_MESSAGE);
    assert.equal(writeError.message, INITIAL_LIFESTYLE_SAVE_ERROR_MESSAGE);
    assert.equal(JSON.stringify(readError).includes('15_plus'), false);
    assert.equal(JSON.stringify(writeError).includes('15_plus'), false);
    assert.equal(JSON.stringify(readError).includes('alcohol'), false);
    assert.equal(JSON.stringify(writeError).includes('alcohol'), false);
  });
});

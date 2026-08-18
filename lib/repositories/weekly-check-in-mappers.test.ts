import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { WeeklyCheckInAnswers } from '../domain/weekly-check-in';
import type { Database } from '../supabase/database.types';

import {
  WEEKLY_CHECK_IN_READ_ERROR_MESSAGE,
  WEEKLY_CHECK_IN_SAVE_ERROR_MESSAGE,
  mapWeeklyCheckInReadError,
  mapWeeklyCheckInRow,
  mapWeeklyCheckInWriteError,
  requireWeeklyCheckInLookup,
  weeklyCheckInToUpsert,
} from './weekly-check-in-mappers';

type WeeklyCheckInRow = Database['public']['Tables']['weekly_check_ins']['Row'];

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

const row: WeeklyCheckInRow = {
  id: 'check-in-1',
  user_id: 'user-1',
  week_start_date: '2026-08-10',
  sleep_quality: 3,
  energy: 4,
  stress: 2,
  training_frequency: 'twice',
  everyday_activity: 3,
  eating_quality: 4,
  alcohol_consumption: '1_3',
  plan_adherence: 5,
  created_at: '2026-08-13T07:00:00.000Z',
  updated_at: '2026-08-13T07:00:00.000Z',
};

describe('weekly-check-in mapping', () => {
  it('maps a DB row to the WeeklyCheckIn domain record', () => {
    const mapped = mapWeeklyCheckInRow(row);

    assert.deepEqual(mapped, {
      id: 'check-in-1',
      userId: 'user-1',
      weekStartDate: '2026-08-10',
      ...answers,
      createdAt: '2026-08-13T07:00:00.000Z',
      updatedAt: '2026-08-13T07:00:00.000Z',
    });
  });

  it('maps write input to DB snake_case fields only', () => {
    const payload = weeklyCheckInToUpsert({
      userId: 'user-1',
      weekStartDate: '2026-08-10',
      answers,
    });

    assert.deepEqual(payload, {
      user_id: 'user-1',
      week_start_date: '2026-08-10',
      sleep_quality: 3,
      energy: 4,
      stress: 2,
      training_frequency: 'twice',
      everyday_activity: 3,
      eating_quality: 4,
      alcohol_consumption: '1_3',
      plan_adherence: 5,
    });

    assert.equal('health_score' in payload, false);
    assert.equal('primary_focus' in payload, false);
    assert.equal('plan_id' in payload, false);
    assert.equal('snapshot_reason' in payload, false);
    assert.equal('notes' in payload, false);
    assert.equal('steps' in payload, false);
  });

  it('rejects rows with unknown bucket values', () => {
    assert.equal(
      mapWeeklyCheckInRow({ ...row, training_frequency: 'daily' }),
      null,
    );
    assert.equal(
      mapWeeklyCheckInRow({ ...row, alcohol_consumption: '15' }),
      null,
    );
  });
});

describe('weekly-check-in lookup boundary', () => {
  it('requires userId and week key', () => {
    assert.equal(requireWeeklyCheckInLookup('user-1', '2026-08-10'), null);
    assert.equal(requireWeeklyCheckInLookup('', '2026-08-10')?.code, 'VALIDATION');
    assert.equal(requireWeeklyCheckInLookup('user-1', '')?.code, 'VALIDATION');
  });
});

describe('weekly-check-in error privacy', () => {
  it('does not leak raw persistence messages or alcohol answers', () => {
    const leaked = {
      code: '23514',
      message: 'new row violates check constraint alcohol_consumption 15_plus',
    };
    const readError = mapWeeklyCheckInReadError(leaked);
    const writeError = mapWeeklyCheckInWriteError(leaked);

    assert.equal(readError.message, WEEKLY_CHECK_IN_READ_ERROR_MESSAGE);
    assert.equal(writeError.message, WEEKLY_CHECK_IN_SAVE_ERROR_MESSAGE);
    assert.equal(JSON.stringify(readError).includes('15_plus'), false);
    assert.equal(JSON.stringify(writeError).includes('15_plus'), false);
    assert.equal(JSON.stringify(readError).includes('alcohol'), false);
    assert.equal(JSON.stringify(writeError).includes('alcohol'), false);
  });
});

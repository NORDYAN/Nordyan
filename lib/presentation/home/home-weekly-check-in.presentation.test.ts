import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Result } from '../../core';
import type { InitialLifestyleCheck } from '../../domain/initial-lifestyle';
import { shouldShowBodyMeasurementFollowUp } from '../../domain/profile';
import type { UserProfile } from '../../domain/profile';
import type { WeeklyCheckIn, WeeklyCheckInAnswers } from '../../domain/weekly-check-in';
import type {
  UpsertWeeklyCheckInInput,
  WeeklyCheckInRepository,
} from '../../repositories/weekly-check-in.repository';
import { DefaultWeeklyCheckInService } from '../../services/weekly-check-in/weekly-check-in.service';
import type { WeeklyCheckInCurrentWeek } from '../../services/weekly-check-in/weekly-check-in.service.types';
import { routes } from '../../../constants/routes';

import {
  HOME_WEEKLY_CHECK_IN_COPY,
  HOME_WEEKLY_CHECK_IN_ROUTE,
  applyHomeWeeklyCheckInLifestyleSuppression,
  isInitialLifestyleCreatedInCurrentLocalWeek,
  resolveHomeWeeklyCheckInStatus,
  shouldShowHomeWeeklyCheckInCard,
  toHomeWeeklyCheckInStatus,
} from './home-weekly-check-in.presentation';
import type { HomeWeeklyCheckInStatus } from './home-weekly-check-in.types';

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

const existingCheckIn: WeeklyCheckIn = {
  id: 'check-in-1',
  userId: 'user-1',
  weekStartDate: '2026-08-10',
  ...answers,
  createdAt: '2026-08-13T08:00:00.000Z',
  updatedAt: '2026-08-13T08:00:00.000Z',
};

const skippedMeasurementProfile: UserProfile = {
  id: 'profile-1',
  userId: 'user-1',
  firstName: 'Anna',
  dateOfBirth: '1990-01-01',
  gender: 'female',
  heightCm: 168,
  weightKg: 72,
  waistCm: null,
  neckCm: null,
  activityLevel: 'moderately_active',
  goal: 'improve_health',
  createdAt: '2026-08-13T12:00:00.000Z',
  updatedAt: '2026-08-13T12:00:00.000Z',
};

class MemoryWeeklyCheckInRepository implements WeeklyCheckInRepository {
  readonly rows = new Map<string, WeeklyCheckIn>();
  reads = 0;

  async getByUserAndWeek(
    userId: string,
    weekStartDate: string,
  ): Promise<Result<WeeklyCheckIn | null>> {
    this.reads += 1;
    return { ok: true, value: this.rows.get(`${userId}:${weekStartDate}`) ?? null };
  }

  async upsertCurrentWeek(input: UpsertWeeklyCheckInInput): Promise<Result<WeeklyCheckIn>> {
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

function legacyInitialLifestyle(createdAt: string): InitialLifestyleCheck {
  return {
    id: 'il-1',
    userId: 'user-1',
    sleepQuality: 3,
    energy: 3,
    stress: 3,
    lessHealthyFoodFrequency: null,
    everydayActivity: 3,
    eatingQuality: 3,
    alcoholConsumption: 'none',
    createdAt,
    updatedAt: createdAt,
  };
}

function initialLifestyleGet(createdAt: string | null) {
  return {
    get: async (): Promise<Result<InitialLifestyleCheck | null>> => ({
      ok: true,
      value: createdAt ? legacyInitialLifestyle(createdAt) : null,
    }),
  };
}

function resolveStatus(
  weeklyCheckIn: Pick<DefaultWeeklyCheckInService, 'getCurrentWeek'>,
  createdAt: string | null,
  localDate: string,
  userId: string | null = 'user-1',
) {
  return resolveHomeWeeklyCheckInStatus({
    weeklyCheckIn,
    initialLifestyle: initialLifestyleGet(createdAt),
    userId,
    localDate,
  });
}

describe('toHomeWeeklyCheckInStatus', () => {
  it('maps empty current week to available without answers', () => {
    const result: Result<WeeklyCheckInCurrentWeek> = {
      ok: true,
      value: { status: 'empty', weekStartDate: '2026-08-10' },
    };

    const status = toHomeWeeklyCheckInStatus(result);

    assert.deepEqual(status, { status: 'available', weekStartDate: '2026-08-10' });
    assert.equal('checkIn' in status, false);
    assert.equal('sleepQuality' in status, false);
  });

  it('maps completed current week to completed without the eight answers', () => {
    const result: Result<WeeklyCheckInCurrentWeek> = {
      ok: true,
      value: {
        status: 'ready',
        weekStartDate: '2026-08-10',
        checkIn: existingCheckIn,
      },
    };

    const status = toHomeWeeklyCheckInStatus(result);

    assert.deepEqual(status, { status: 'completed', weekStartDate: '2026-08-10' });
    assert.equal('checkIn' in status, false);
    assert.equal('sleepQuality' in status, false);
    assert.equal('trainingFrequency' in status, false);
    assert.equal('planAdherence' in status, false);
  });

  it('maps fetch failure to unavailable', () => {
    const result: Result<WeeklyCheckInCurrentWeek> = {
      ok: false,
      error: { code: 'INTEGRATION', message: 'Kunde inte hämta veckokollen.' },
    };

    assert.deepEqual(toHomeWeeklyCheckInStatus(result), { status: 'unavailable' });
  });
});

describe('shouldShowHomeWeeklyCheckInCard', () => {
  it('shows the card only while the current week is available', () => {
    const cases: Array<{ state: HomeWeeklyCheckInStatus; visible: boolean }> = [
      { state: { status: 'loading' }, visible: false },
      { state: { status: 'available', weekStartDate: '2026-08-10' }, visible: true },
      { state: { status: 'completed', weekStartDate: '2026-08-10' }, visible: false },
      { state: { status: 'suppressed', weekStartDate: '2026-08-10' }, visible: false },
      { state: { status: 'unavailable' }, visible: false },
    ];

    for (const item of cases) {
      assert.equal(shouldShowHomeWeeklyCheckInCard(item.state), item.visible);
    }
  });
});

describe('Initial Lifestyle onboarding-week suppression', () => {
  it('hides Veckokoll when Initial Lifestyle was completed in the current local week', () => {
    const status = applyHomeWeeklyCheckInLifestyleSuppression(
      { status: 'available', weekStartDate: '2026-08-10' },
      '2026-08-13T12:00:00.000Z',
    );

    assert.deepEqual(status, { status: 'suppressed', weekStartDate: '2026-08-10' });
    assert.equal(shouldShowHomeWeeklyCheckInCard(status), false);
    assert.equal(
      isInitialLifestyleCreatedInCurrentLocalWeek('2026-08-13T12:00:00.000Z', '2026-08-10'),
      true,
    );
  });

  it('shows Veckokoll on the next local Monday when Weekly Check-in is still empty', () => {
    const status = applyHomeWeeklyCheckInLifestyleSuppression(
      { status: 'available', weekStartDate: '2026-08-17' },
      '2026-08-13T12:00:00.000Z',
    );

    assert.deepEqual(status, { status: 'available', weekStartDate: '2026-08-17' });
    assert.equal(shouldShowHomeWeeklyCheckInCard(status), true);
    assert.equal(
      isInitialLifestyleCreatedInCurrentLocalWeek('2026-08-13T12:00:00.000Z', '2026-08-17'),
      false,
    );
  });

  it('shows Veckokoll when Initial Lifestyle is older than the current local week', () => {
    const status = applyHomeWeeklyCheckInLifestyleSuppression(
      { status: 'available', weekStartDate: '2026-08-10' },
      '2026-08-03T12:00:00.000Z',
    );

    assert.deepEqual(status, { status: 'available', weekStartDate: '2026-08-10' });
    assert.equal(shouldShowHomeWeeklyCheckInCard(status), true);
  });

  it('keeps Weekly Check-in completed hidden regardless of Initial Lifestyle date', () => {
    const thisWeek = applyHomeWeeklyCheckInLifestyleSuppression(
      { status: 'completed', weekStartDate: '2026-08-10' },
      '2026-08-13T12:00:00.000Z',
    );
    const older = applyHomeWeeklyCheckInLifestyleSuppression(
      { status: 'completed', weekStartDate: '2026-08-10' },
      '2026-08-03T12:00:00.000Z',
    );

    assert.equal(thisWeek.status, 'completed');
    assert.equal(older.status, 'completed');
    assert.equal(shouldShowHomeWeeklyCheckInCard(thisWeek), false);
    assert.equal(shouldShowHomeWeeklyCheckInCard(older), false);
  });

  it('fails closed when the Initial Lifestyle timestamp cannot be resolved', () => {
    const status = applyHomeWeeklyCheckInLifestyleSuppression(
      { status: 'available', weekStartDate: '2026-08-10' },
      'not-a-date',
    );

    assert.equal(status.status, 'suppressed');
    assert.equal(shouldShowHomeWeeklyCheckInCard(status), false);
  });

  it('accepts a legacy baseline with null nutrition frequency using created_at only', () => {
    const baseline = legacyInitialLifestyle('2026-08-13T12:00:00.000Z');
    assert.equal(baseline.lessHealthyFoodFrequency, null);

    const status = applyHomeWeeklyCheckInLifestyleSuppression(
      { status: 'available', weekStartDate: '2026-08-10' },
      baseline.createdAt,
    );

    assert.equal(status.status, 'suppressed');
    assert.equal('sleepQuality' in status, false);
    assert.equal('lessHealthyFoodFrequency' in status, false);
  });
});

describe('resolveHomeWeeklyCheckInStatus', () => {
  it('returns available for an empty current week with no Initial Lifestyle baseline', async () => {
    const service = new DefaultWeeklyCheckInService(new MemoryWeeklyCheckInRepository());
    const status = await resolveStatus(service, null, '2026-08-13');

    assert.deepEqual(status, { status: 'available', weekStartDate: '2026-08-10' });
    assert.equal(shouldShowHomeWeeklyCheckInCard(status), true);
  });

  it('hides Veckokoll for a new user who completed Initial Lifestyle this week', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);
    const status = await resolveStatus(service, '2026-08-13T12:00:00.000Z', '2026-08-13');

    assert.equal(status.status, 'suppressed');
    assert.equal(shouldShowHomeWeeklyCheckInCard(status), false);
    assert.equal(repository.rows.size, 0);
  });

  it('shows Veckokoll on the next local Monday after onboarding-week suppression', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);

    const thursday = await resolveStatus(service, '2026-08-13T12:00:00.000Z', '2026-08-13');
    const sunday = await resolveStatus(service, '2026-08-13T12:00:00.000Z', '2026-08-16');
    const nextMonday = await resolveStatus(service, '2026-08-13T12:00:00.000Z', '2026-08-17');

    assert.equal(shouldShowHomeWeeklyCheckInCard(thursday), false);
    assert.equal(shouldShowHomeWeeklyCheckInCard(sunday), false);
    assert.deepEqual(nextMonday, { status: 'available', weekStartDate: '2026-08-17' });
    assert.equal(shouldShowHomeWeeklyCheckInCard(nextMonday), true);
    assert.equal(repository.rows.size, 0);
  });

  it('returns completed after the current week is saved', async () => {
    const service = new DefaultWeeklyCheckInService(new MemoryWeeklyCheckInRepository());
    await service.saveCurrentWeek('user-1', answers, '2026-08-13');

    const status = await resolveStatus(service, '2026-08-03T12:00:00.000Z', '2026-08-13');

    assert.deepEqual(status, { status: 'completed', weekStartDate: '2026-08-10' });
  });

  it('returns unavailable when the session has no user', async () => {
    const service = new DefaultWeeklyCheckInService(new MemoryWeeklyCheckInRepository());

    assert.deepEqual(await resolveStatus(service, null, '2026-08-13', null), {
      status: 'unavailable',
    });
    assert.deepEqual(await resolveStatus(service, null, '2026-08-13', '   '), {
      status: 'unavailable',
    });
  });

  it('returns unavailable on Weekly Check-in fetch failure and does not throw', async () => {
    const status = await resolveHomeWeeklyCheckInStatus({
      weeklyCheckIn: {
        getCurrentWeek: async () => ({
          ok: false,
          error: { code: 'INTEGRATION', message: 'Kunde inte hämta veckokollen.' },
        }),
      },
      initialLifestyle: initialLifestyleGet(null),
      userId: 'user-1',
    });

    assert.deepEqual(status, { status: 'unavailable' });
    assert.equal(shouldShowHomeWeeklyCheckInCard(status), false);
  });

  it('fails closed when Initial Lifestyle eligibility cannot be determined', async () => {
    const service = new DefaultWeeklyCheckInService(new MemoryWeeklyCheckInRepository());
    const status = await resolveHomeWeeklyCheckInStatus({
      weeklyCheckIn: service,
      initialLifestyle: {
        get: async () => ({
          ok: false,
          error: { code: 'INTEGRATION', message: 'Kunde inte hämta livsstilskollen.' },
        }),
      },
      userId: 'user-1',
      localDate: '2026-08-13',
    });

    assert.equal(status.status, 'unavailable');
    assert.equal(shouldShowHomeWeeklyCheckInCard(status), false);
  });

  it('only reads current-week status and Initial Lifestyle created_at', async () => {
    let weeklySaveCalled = false;
    let lifestyleSaveCalled = false;
    const weeklyCheckIn = {
      getCurrentWeek: async () =>
        ({
          ok: true,
          value: {
            status: 'ready' as const,
            weekStartDate: '2026-08-10',
            checkIn: existingCheckIn,
          },
        }) as Result<WeeklyCheckInCurrentWeek>,
      saveCurrentWeek: async () => {
        weeklySaveCalled = true;
        throw new Error('Home must not save Weekly Check-in.');
      },
    };
    const initialLifestyle = {
      get: async (): Promise<Result<InitialLifestyleCheck | null>> => ({
        ok: true,
        value: legacyInitialLifestyle('2026-08-13T12:00:00.000Z'),
      }),
      save: async () => {
        lifestyleSaveCalled = true;
        throw new Error('Home must not save Initial Lifestyle.');
      },
    };

    const status = await resolveHomeWeeklyCheckInStatus({
      weeklyCheckIn,
      initialLifestyle,
      userId: 'user-1',
    });

    assert.equal(weeklySaveCalled, false);
    assert.equal(lifestyleSaveCalled, false);
    assert.deepEqual(status, { status: 'completed', weekStartDate: '2026-08-10' });
    assert.equal(JSON.stringify(status).includes('sleepQuality'), false);
  });

  it('does not create a Weekly Check-in row from Initial Lifestyle', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);

    await resolveStatus(service, '2026-08-13T12:00:00.000Z', '2026-08-13');
    await resolveStatus(service, '2026-08-13T12:00:00.000Z', '2026-08-17');

    assert.equal(repository.rows.size, 0);
  });

  it('refetches current-week status so a later Home focus can hide the card', async () => {
    const repository = new MemoryWeeklyCheckInRepository();
    const service = new DefaultWeeklyCheckInService(repository);

    const first = await resolveStatus(service, '2026-08-03T12:00:00.000Z', '2026-08-13');
    assert.equal(first.status, 'available');
    assert.equal(shouldShowHomeWeeklyCheckInCard(first), true);

    await service.saveCurrentWeek('user-1', answers, '2026-08-13');

    const afterFocus = await resolveStatus(service, '2026-08-03T12:00:00.000Z', '2026-08-13');
    assert.equal(afterFocus.status, 'completed');
    assert.equal(shouldShowHomeWeeklyCheckInCard(afterFocus), false);
    assert.ok(repository.reads >= 2);
  });

  it('treats the next local Monday as a new empty week', async () => {
    const service = new DefaultWeeklyCheckInService(new MemoryWeeklyCheckInRepository());
    await service.saveCurrentWeek('user-1', answers, '2026-08-13');

    const sunday = await resolveStatus(service, '2026-08-03T12:00:00.000Z', '2026-08-16');
    const nextMonday = await resolveStatus(service, '2026-08-03T12:00:00.000Z', '2026-08-17');

    assert.deepEqual(sunday, { status: 'completed', weekStartDate: '2026-08-10' });
    assert.deepEqual(nextMonday, { status: 'available', weekStartDate: '2026-08-17' });
    assert.equal(shouldShowHomeWeeklyCheckInCard(nextMonday), true);
  });
});

describe('Home Weekly Check-in copy and navigation', () => {
  it('keeps calm Veckokoll copy without urgency', () => {
    assert.equal(HOME_WEEKLY_CHECK_IN_COPY.title, 'Veckokoll');
    assert.equal(HOME_WEEKLY_CHECK_IN_COPY.supporting, 'Hur har veckan varit?');
    assert.equal(
      HOME_WEEKLY_CHECK_IN_COPY.explanation,
      'Svara på några snabba frågor så lär NORDYAN känna din vardag bättre.',
    );
    assert.equal(HOME_WEEKLY_CHECK_IN_COPY.timeHint, 'Tar mindre än en minut');
    assert.equal(HOME_WEEKLY_CHECK_IN_COPY.cta, 'Gör veckokollen');

    const joined = Object.values(HOME_WEEKLY_CHECK_IN_COPY).join(' ');
    assert.equal(/nu!|brådsk|försen|missad|varning/i.test(joined), false);
  });

  it('navigates available card to the existing Weekly Check-in route', () => {
    assert.equal(HOME_WEEKLY_CHECK_IN_ROUTE, routes.weeklyCheckIn);
    assert.equal(HOME_WEEKLY_CHECK_IN_ROUTE, '/weekly-check-in');
  });
});

describe('Measurement follow-up isolation', () => {
  it('keeps the measurement reminder independent of Veckokoll suppression', () => {
    const weeklyStatus: HomeWeeklyCheckInStatus = {
      status: 'suppressed',
      weekStartDate: '2026-08-10',
    };

    assert.equal(shouldShowHomeWeeklyCheckInCard(weeklyStatus), false);
    assert.equal(shouldShowHomeWeeklyCheckInCard({ status: 'loading' }), false);
    assert.equal(shouldShowHomeWeeklyCheckInCard({ status: 'unavailable' }), false);
    assert.equal(shouldShowBodyMeasurementFollowUp(skippedMeasurementProfile, null), true);
  });
});

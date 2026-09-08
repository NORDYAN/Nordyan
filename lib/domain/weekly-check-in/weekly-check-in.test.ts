import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  WEEKLY_CHECK_IN_ALCOHOL_CONSUMPTIONS,
  WEEKLY_CHECK_IN_ANSWER_FIELDS,
  WEEKLY_CHECK_IN_SCALE_POLARITY,
  WEEKLY_CHECK_IN_TRAINING_FREQUENCIES,
  getPreviousWeeklyCheckInWeekStartDate,
  getWeeklyCheckInScalePolarity,
  getWeeklyCheckInWeekStartDate,
  weeklyCheckInAnswersValidator,
  type WeeklyCheckIn,
  type WeeklyCheckInAnswers,
} from './index';

const validAnswers: WeeklyCheckInAnswers = {
  sleepQuality: 3,
  energy: 4,
  stress: 2,
  trainingFrequency: 'twice',
  everydayActivity: 3,
  eatingQuality: 4,
  alcoholConsumption: '1_3',
  planAdherence: 5,
};

function omitAnswer(
  field: keyof WeeklyCheckInAnswers,
): Record<string, unknown> {
  const { [field]: _removed, ...rest } = validAnswers;
  return rest;
}

describe('weeklyCheckInAnswersValidator — scales', () => {
  it('accepts scale 1 and 5', () => {
    const low = weeklyCheckInAnswersValidator.validate({
      ...validAnswers,
      sleepQuality: 1,
      energy: 1,
      stress: 1,
      everydayActivity: 1,
      eatingQuality: 1,
      planAdherence: 1,
    });
    const high = weeklyCheckInAnswersValidator.validate({
      ...validAnswers,
      sleepQuality: 5,
      energy: 5,
      stress: 5,
      everydayActivity: 5,
      eatingQuality: 5,
      planAdherence: 5,
    });

    assert.equal(low.valid, true);
    assert.equal(high.valid, true);
  });

  it('rejects scale 0, 6, and decimals', () => {
    const zero = weeklyCheckInAnswersValidator.validate({
      ...validAnswers,
      sleepQuality: 0,
    });
    const six = weeklyCheckInAnswersValidator.validate({
      ...validAnswers,
      energy: 6,
    });
    const decimal = weeklyCheckInAnswersValidator.validate({
      ...validAnswers,
      stress: 2.5,
    });

    assert.equal(zero.valid, false);
    assert.equal(six.valid, false);
    assert.equal(decimal.valid, false);
    if (!zero.valid) {
      assert.ok(zero.errors.some((error) => error.field === 'sleepQuality'));
    }
    if (!six.valid) {
      assert.ok(six.errors.some((error) => error.field === 'energy'));
    }
    if (!decimal.valid) {
      assert.ok(decimal.errors.some((error) => error.field === 'stress'));
    }
  });
});

describe('weeklyCheckInAnswersValidator — completeness', () => {
  it('accepts all eight answers', () => {
    const result = weeklyCheckInAnswersValidator.validate(validAnswers);
    assert.equal(result.valid, true);
    if (result.valid) {
      assert.deepEqual(result.value, validAnswers);
    }
  });

  it('rejects each missing required answer', () => {
    for (const field of WEEKLY_CHECK_IN_ANSWER_FIELDS) {
      const result = weeklyCheckInAnswersValidator.validate(omitAnswer(field));
      assert.equal(result.valid, false, `expected missing ${field} to be rejected`);
      if (!result.valid) {
        assert.ok(
          result.errors.some((error) => error.field === field),
          `expected an error on ${field}`,
        );
      }
    }
  });

  it('rejects null required answers', () => {
    const result = weeklyCheckInAnswersValidator.validate({
      ...validAnswers,
      planAdherence: null,
    });
    assert.equal(result.valid, false);
  });
});

describe('weeklyCheckInAnswersValidator — buckets', () => {
  it('accepts every approved training bucket', () => {
    for (const trainingFrequency of WEEKLY_CHECK_IN_TRAINING_FREQUENCIES) {
      const result = weeklyCheckInAnswersValidator.validate({
        ...validAnswers,
        trainingFrequency,
      });
      assert.equal(result.valid, true, `expected ${trainingFrequency} to be accepted`);
    }
  });

  it('rejects unknown training buckets', () => {
    for (const trainingFrequency of ['1', '4', 'four', 'daily', 3]) {
      const result = weeklyCheckInAnswersValidator.validate({
        ...validAnswers,
        trainingFrequency,
      });
      assert.equal(result.valid, false, `expected ${String(trainingFrequency)} to be rejected`);
    }
  });

  it('accepts every approved alcohol bucket', () => {
    for (const alcoholConsumption of WEEKLY_CHECK_IN_ALCOHOL_CONSUMPTIONS) {
      const result = weeklyCheckInAnswersValidator.validate({
        ...validAnswers,
        alcoholConsumption,
      });
      assert.equal(result.valid, true, `expected ${alcoholConsumption} to be accepted`);
    }
  });

  it('rejects unknown alcohol buckets', () => {
    for (const alcoholConsumption of ['none_plus', '15', '1-3', 2]) {
      const result = weeklyCheckInAnswersValidator.validate({
        ...validAnswers,
        alcoholConsumption,
      });
      assert.equal(result.valid, false, `expected ${String(alcoholConsumption)} to be rejected`);
    }
  });
});

describe('Weekly Check-in polarity', () => {
  it('encodes stress as higher_worse and distinct from energy/sleep', () => {
    assert.equal(WEEKLY_CHECK_IN_SCALE_POLARITY.stress, 'higher_worse');
    assert.equal(getWeeklyCheckInScalePolarity('stress'), 'higher_worse');
    assert.equal(WEEKLY_CHECK_IN_SCALE_POLARITY.energy, 'higher_better');
    assert.equal(WEEKLY_CHECK_IN_SCALE_POLARITY.sleepQuality, 'higher_better');
    assert.notEqual(
      WEEKLY_CHECK_IN_SCALE_POLARITY.stress,
      WEEKLY_CHECK_IN_SCALE_POLARITY.energy,
    );
    assert.notEqual(
      WEEKLY_CHECK_IN_SCALE_POLARITY.stress,
      WEEKLY_CHECK_IN_SCALE_POLARITY.sleepQuality,
    );
  });

  it('encodes remaining subjective scales as higher_better', () => {
    assert.equal(WEEKLY_CHECK_IN_SCALE_POLARITY.everydayActivity, 'higher_better');
    assert.equal(WEEKLY_CHECK_IN_SCALE_POLARITY.eatingQuality, 'higher_better');
    assert.equal(WEEKLY_CHECK_IN_SCALE_POLARITY.planAdherence, 'higher_better');
  });
});

describe('getWeeklyCheckInWeekStartDate', () => {
  it('returns the same date for Monday', () => {
    assert.equal(getWeeklyCheckInWeekStartDate('2026-08-10'), '2026-08-10');
  });

  it('returns preceding Monday for midweek', () => {
    assert.equal(getWeeklyCheckInWeekStartDate('2026-08-11'), '2026-08-10');
    assert.equal(getWeeklyCheckInWeekStartDate('2026-08-13'), '2026-08-10');
  });

  it('returns preceding Monday for Sunday', () => {
    assert.equal(getWeeklyCheckInWeekStartDate('2026-08-16'), '2026-08-10');
  });

  it('crosses a month boundary to the preceding Monday', () => {
    assert.equal(getWeeklyCheckInWeekStartDate('2026-09-01'), '2026-08-31');
    assert.equal(getWeeklyCheckInWeekStartDate('2026-03-01'), '2026-02-23');
  });

  it('crosses a year boundary to the preceding Monday', () => {
    assert.equal(getWeeklyCheckInWeekStartDate('2027-01-01'), '2026-12-28');
  });

  it('produces the same Monday key for dates in the same local week', () => {
    const monday = getWeeklyCheckInWeekStartDate('2026-08-10');
    const thursday = getWeeklyCheckInWeekStartDate('2026-08-13');
    const sunday = getWeeklyCheckInWeekStartDate('2026-08-16');
    assert.equal(monday, thursday);
    assert.equal(thursday, sunday);
    assert.equal(monday, '2026-08-10');
  });
});

describe('getPreviousWeeklyCheckInWeekStartDate', () => {
  it('returns the previous Monday from a Monday week start', () => {
    assert.equal(getPreviousWeeklyCheckInWeekStartDate('2026-08-31'), '2026-08-24');
    assert.equal(getPreviousWeeklyCheckInWeekStartDate('2026-08-24'), '2026-08-17');
  });

  it('uses the same Sunday/Monday boundary as the canonical week helper', () => {
    assert.equal(getPreviousWeeklyCheckInWeekStartDate('2026-08-16'), '2026-08-03');
    assert.equal(getPreviousWeeklyCheckInWeekStartDate('2026-08-17'), '2026-08-10');
  });
});

describe('Weekly Check-in forbidden semantics', () => {
  it('rejects extra health/engine/device/note fields', () => {
    const extras = [
      { ...validAnswers, healthScore: 74 },
      { ...validAnswers, focus: 'reduce_waist' },
      { ...validAnswers, planId: 'waist_walk_after_dinner_v1' },
      { ...validAnswers, snapshotReason: 'weekly_checkin' },
      { ...validAnswers, steps: 8000 },
      { ...validAnswers, notes: 'sov dåligt' },
    ];

    for (const input of extras) {
      const result = weeklyCheckInAnswersValidator.validate(input);
      assert.equal(result.valid, false);
      if (!result.valid) {
        assert.ok(result.errors.some((error) => error.field === 'answers'));
      }
    }
  });

  it('keeps the answers contract to the eight required fields', () => {
    assert.deepEqual([...WEEKLY_CHECK_IN_ANSWER_FIELDS].sort(), [
      'alcoholConsumption',
      'eatingQuality',
      'energy',
      'everydayActivity',
      'planAdherence',
      'sleepQuality',
      'stress',
      'trainingFrequency',
    ]);

    const record: WeeklyCheckIn = {
      id: 'check-in-1',
      userId: 'user-1',
      weekStartDate: '2026-08-10',
      ...validAnswers,
      createdAt: '2026-08-13T07:00:00.000Z',
      updatedAt: '2026-08-13T07:00:00.000Z',
    };

    assert.equal('healthScore' in record, false);
    assert.equal('primaryFocus' in record, false);
    assert.equal('coachRecommendationId' in record, false);
    assert.equal('snapshotReason' in record, false);
    assert.equal('notes' in record, false);
    assert.equal('steps' in record, false);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  INITIAL_LIFESTYLE_ALCOHOL_CONSUMPTIONS,
  INITIAL_LIFESTYLE_ANSWER_FIELDS,
  INITIAL_LIFESTYLE_LESS_HEALTHY_FOOD_FREQUENCIES,
  INITIAL_LIFESTYLE_SCALE_POLARITY,
  getInitialLifestyleScalePolarity,
  initialLifestyleAnswersValidator,
  type InitialLifestyleAnswers,
  type InitialLifestyleCheck,
} from './index';

const validAnswers: InitialLifestyleAnswers = {
  sleepQuality: 3,
  energy: 4,
  stress: 2,
  lessHealthyFoodFrequency: 'two_three',
  everydayActivity: 3,
  eatingQuality: 4,
  alcoholConsumption: '1_3',
};

function omitAnswer(field: keyof InitialLifestyleAnswers): Record<string, unknown> {
  const { [field]: _removed, ...rest } = validAnswers;
  return rest;
}

describe('initialLifestyleAnswersValidator — complete object', () => {
  it('accepts a valid seven-answer object', () => {
    const result = initialLifestyleAnswersValidator.validate(validAnswers);
    assert.equal(result.valid, true);
    if (result.valid) {
      assert.deepEqual(result.value, validAnswers);
    }
  });
});

describe('initialLifestyleAnswersValidator — completeness', () => {
  it('requires all seven answers', () => {
    for (const field of INITIAL_LIFESTYLE_ANSWER_FIELDS) {
      const result = initialLifestyleAnswersValidator.validate(omitAnswer(field));
      assert.equal(result.valid, false, `expected missing ${field} to be rejected`);
      if (!result.valid) {
        assert.ok(
          result.errors.some((error) => error.field === field),
          `expected an error on ${field}`,
        );
      }
    }
  });

  it('rejects null lessHealthyFoodFrequency on new submissions', () => {
    const result = initialLifestyleAnswersValidator.validate({
      ...validAnswers,
      lessHealthyFoodFrequency: null,
    });
    const missing = initialLifestyleAnswersValidator.validate(omitAnswer('lessHealthyFoodFrequency'));

    assert.equal(result.valid, false);
    assert.equal(missing.valid, false);
    if (!result.valid) {
      assert.ok(result.errors.some((error) => error.field === 'lessHealthyFoodFrequency'));
    }
    if (!missing.valid) {
      assert.ok(missing.errors.some((error) => error.field === 'lessHealthyFoodFrequency'));
    }
  });

  it('rejects null and undefined required answers', () => {
    const withNull = initialLifestyleAnswersValidator.validate({
      ...validAnswers,
      energy: null,
    });
    const withUndefined = initialLifestyleAnswersValidator.validate({
      ...validAnswers,
      stress: undefined,
    });

    assert.equal(withNull.valid, false);
    assert.equal(withUndefined.valid, false);
  });
});

describe('initialLifestyleAnswersValidator — scales', () => {
  it('accepts scale 1 and 5 on every scale field', () => {
    const low = initialLifestyleAnswersValidator.validate({
      ...validAnswers,
      sleepQuality: 1,
      energy: 1,
      stress: 1,
      everydayActivity: 1,
      eatingQuality: 1,
    });
    const high = initialLifestyleAnswersValidator.validate({
      ...validAnswers,
      sleepQuality: 5,
      energy: 5,
      stress: 5,
      everydayActivity: 5,
      eatingQuality: 5,
    });

    assert.equal(low.valid, true);
    assert.equal(high.valid, true);
  });

  it('rejects scale 0, 6, and decimals', () => {
    const zero = initialLifestyleAnswersValidator.validate({
      ...validAnswers,
      sleepQuality: 0,
    });
    const six = initialLifestyleAnswersValidator.validate({
      ...validAnswers,
      energy: 6,
    });
    const decimal = initialLifestyleAnswersValidator.validate({
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

describe('Initial Lifestyle polarity', () => {
  it('encodes stress as higher_worse', () => {
    assert.equal(INITIAL_LIFESTYLE_SCALE_POLARITY.stress, 'higher_worse');
    assert.equal(getInitialLifestyleScalePolarity('stress'), 'higher_worse');
  });

  it('encodes sleep, energy, everyday activity, and eating as higher_better', () => {
    assert.equal(INITIAL_LIFESTYLE_SCALE_POLARITY.sleepQuality, 'higher_better');
    assert.equal(INITIAL_LIFESTYLE_SCALE_POLARITY.energy, 'higher_better');
    assert.equal(INITIAL_LIFESTYLE_SCALE_POLARITY.everydayActivity, 'higher_better');
    assert.equal(INITIAL_LIFESTYLE_SCALE_POLARITY.eatingQuality, 'higher_better');
    assert.notEqual(
      INITIAL_LIFESTYLE_SCALE_POLARITY.stress,
      INITIAL_LIFESTYLE_SCALE_POLARITY.sleepQuality,
    );
  });
});

describe('initialLifestyleAnswersValidator — buckets', () => {
  it('accepts every approved less-healthy-food frequency bucket', () => {
    for (const lessHealthyFoodFrequency of INITIAL_LIFESTYLE_LESS_HEALTHY_FOOD_FREQUENCIES) {
      const result = initialLifestyleAnswersValidator.validate({
        ...validAnswers,
        lessHealthyFoodFrequency,
      });
      assert.equal(result.valid, true, `expected ${lessHealthyFoodFrequency} to be accepted`);
    }
  });

  it('rejects unknown less-healthy-food frequency buckets', () => {
    for (const lessHealthyFoodFrequency of ['none', 'twice', 'three', 'four_plus', 3]) {
      const result = initialLifestyleAnswersValidator.validate({
        ...validAnswers,
        lessHealthyFoodFrequency,
      });
      assert.equal(result.valid, false, `expected ${String(lessHealthyFoodFrequency)} to be rejected`);
    }
  });

  it('accepts every approved alcohol bucket', () => {
    for (const alcoholConsumption of INITIAL_LIFESTYLE_ALCOHOL_CONSUMPTIONS) {
      const result = initialLifestyleAnswersValidator.validate({
        ...validAnswers,
        alcoholConsumption,
      });
      assert.equal(result.valid, true, `expected ${alcoholConsumption} to be accepted`);
    }
  });

  it('rejects unknown alcohol buckets', () => {
    for (const alcoholConsumption of ['none_plus', '15', '1-3', 2]) {
      const result = initialLifestyleAnswersValidator.validate({
        ...validAnswers,
        alcoholConsumption,
      });
      assert.equal(result.valid, false, `expected ${String(alcoholConsumption)} to be rejected`);
    }
  });
});

describe('Initial Lifestyle forbidden semantics', () => {
  it('rejects planAdherence and trainingFrequency', () => {
    const withPlan = initialLifestyleAnswersValidator.validate({
      ...validAnswers,
      planAdherence: 4,
    });
    const withTraining = initialLifestyleAnswersValidator.validate({
      ...validAnswers,
      trainingFrequency: 'twice',
    });

    assert.equal(withPlan.valid, false);
    assert.equal(withTraining.valid, false);
    if (!withPlan.valid) {
      assert.ok(withPlan.errors.some((error) => error.field === 'answers'));
    }
    if (!withTraining.valid) {
      assert.ok(withTraining.errors.some((error) => error.field === 'answers'));
    }
  });

  it('rejects Health Score, Focus, Plan, and snapshot fields', () => {
    const extras = [
      { ...validAnswers, healthScore: 74 },
      { ...validAnswers, focus: 'reduce_waist' },
      { ...validAnswers, planId: 'waist_walk_after_dinner_v1' },
      { ...validAnswers, snapshotId: 'snap-1' },
    ];

    for (const input of extras) {
      const result = initialLifestyleAnswersValidator.validate(input);
      assert.equal(result.valid, false);
      if (!result.valid) {
        assert.ok(result.errors.some((error) => error.field === 'answers'));
      }
    }
  });

  it('rejects device fields', () => {
    const extras = [
      { ...validAnswers, deviceActivity: 8000 },
      { ...validAnswers, steps: 8000 },
      { ...validAnswers, sleepHours: 7.5 },
      { ...validAnswers, testosterone: 20 },
    ];

    for (const input of extras) {
      const result = initialLifestyleAnswersValidator.validate(input);
      assert.equal(result.valid, false);
      if (!result.valid) {
        assert.ok(result.errors.some((error) => error.field === 'answers'));
      }
    }
  });

  it('rejects free text', () => {
    const extras = [
      { ...validAnswers, notes: 'sov dåligt' },
      { ...validAnswers, freeText: 'kommentar' },
      { ...validAnswers, instructions: 'gör mer' },
    ];

    for (const input of extras) {
      const result = initialLifestyleAnswersValidator.validate(input);
      assert.equal(result.valid, false);
      if (!result.valid) {
        assert.ok(result.errors.some((error) => error.field === 'answers'));
      }
    }
  });

  it('keeps the answers contract to the seven required fields and has no combined score', () => {
    assert.deepEqual([...INITIAL_LIFESTYLE_ANSWER_FIELDS].sort(), [
      'alcoholConsumption',
      'eatingQuality',
      'energy',
      'everydayActivity',
      'lessHealthyFoodFrequency',
      'sleepQuality',
      'stress',
    ]);
    assert.equal(INITIAL_LIFESTYLE_ANSWER_FIELDS.includes('planAdherence' as never), false);
    assert.equal(INITIAL_LIFESTYLE_ANSWER_FIELDS.includes('trainingFrequency' as never), false);

    const record: InitialLifestyleCheck = {
      id: 'lifestyle-1',
      userId: 'user-1',
      ...validAnswers,
      createdAt: '2026-08-13T15:00:00.000Z',
      updatedAt: '2026-08-13T15:00:00.000Z',
    };

    assert.equal('planAdherence' in record, false);
    assert.equal('weekStartDate' in record, false);
    assert.equal('healthScore' in record, false);
    assert.equal('lifestyleScore' in record, false);
    assert.equal('focus' in record, false);
    assert.equal('planId' in record, false);
    assert.equal('snapshotId' in record, false);
    assert.equal('notes' in validAnswers, false);
  });
});

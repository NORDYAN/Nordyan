import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { InitialLifestyleCheck } from '../../domain/initial-lifestyle';
import {
  COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_MEANINGS,
  COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_VALUES,
} from '../../../shared/coach-language';

import { mapInitialLifestyleForCoachAsk } from './coach-ask-initial-lifestyle.mapper';

const baseline: InitialLifestyleCheck = {
  id: 'lifestyle-secret',
  userId: 'user-secret',
  sleepQuality: 4,
  energy: 3,
  stress: 5,
  lessHealthyFoodFrequency: 'two_three',
  everydayActivity: 2,
  eatingQuality: 4,
  alcoholConsumption: '15_plus',
  createdAt: '2026-08-01T09:00:00.000Z',
  updatedAt: '2026-08-01T09:00:00.000Z',
};

describe('mapInitialLifestyleForCoachAsk', () => {
  it('projects all seven baseline dimensions without metadata', () => {
    const mapped = mapInitialLifestyleForCoachAsk(baseline);
    assert.ok(mapped);
    assert.equal(mapped.source, 'onboarding_baseline_self_report');
    assert.deepEqual(mapped.sleepQuality, {
      value: 4,
      polarity: 'higher_better',
      meaning: 'good',
    });
    assert.deepEqual(mapped.energy, {
      value: 3,
      polarity: 'higher_better',
      meaning: 'normal',
    });
    assert.deepEqual(mapped.stress, {
      value: 5,
      polarity: 'higher_worse',
      meaning: 'very_high',
    });
    assert.deepEqual(mapped.lessHealthyFoodFrequency, {
      value: 'two_three',
      meaning: 'two_to_three_times_per_typical_week',
      kind: 'neutral_self_reported_frequency',
    });
    assert.deepEqual(mapped.everydayActivity, {
      value: 2,
      polarity: 'higher_better',
      meaning: 'low',
    });
    assert.deepEqual(mapped.eatingQuality, {
      value: 4,
      polarity: 'higher_better',
      meaning: 'good',
    });
    assert.deepEqual(mapped.alcoholConsumption, {
      value: '15_plus',
      meaning: 'fifteen_or_more_drinks',
      kind: 'neutral_self_reported_bucket',
    });

    assert.deepEqual(
      Object.keys(mapped).sort(),
      [
        'alcoholConsumption',
        'eatingQuality',
        'energy',
        'everydayActivity',
        'lessHealthyFoodFrequency',
        'sleepQuality',
        'source',
        'stress',
      ].sort(),
    );
    assert.equal('id' in mapped, false);
    assert.equal('userId' in mapped, false);
    assert.equal('createdAt' in mapped, false);
    assert.equal('updatedAt' in mapped, false);
    assert.equal('trainingFrequency' in mapped, false);
    assert.equal('planAdherence' in mapped, false);
    assert.equal('polarity' in (mapped.lessHealthyFoodFrequency ?? {}), false);
  });

  it('encodes stress 5 as higher_worse very_high', () => {
    const mapped = mapInitialLifestyleForCoachAsk({ ...baseline, stress: 5 });
    assert.deepEqual(mapped?.stress, {
      value: 5,
      polarity: 'higher_worse',
      meaning: 'very_high',
    });
    assert.notEqual(mapped?.stress.polarity, 'higher_better');
    assert.notEqual(mapped?.stress.meaning, 'very_good');
  });

  it('maps alcohol 15_plus to fifteen_or_more_drinks', () => {
    const mapped = mapInitialLifestyleForCoachAsk({
      ...baseline,
      alcoholConsumption: '15_plus',
    });
    assert.deepEqual(mapped?.alcoholConsumption, {
      value: '15_plus',
      meaning: 'fifteen_or_more_drinks',
      kind: 'neutral_self_reported_bucket',
    });
  });

  it('locks every nutrition-frequency meaning', () => {
    for (const value of COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_VALUES) {
      const mapped = mapInitialLifestyleForCoachAsk({
        ...baseline,
        lessHealthyFoodFrequency: value,
      });
      assert.deepEqual(mapped?.lessHealthyFoodFrequency, {
        value,
        meaning: COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_MEANINGS[value],
        kind: 'neutral_self_reported_frequency',
      });
    }
  });

  it('preserves legacy null nutrition and the other six fields', () => {
    const mapped = mapInitialLifestyleForCoachAsk({
      ...baseline,
      lessHealthyFoodFrequency: null,
    });
    assert.ok(mapped);
    assert.equal(mapped.lessHealthyFoodFrequency, null);
    assert.equal(mapped.sleepQuality.value, 4);
    assert.equal(mapped.energy.value, 3);
    assert.equal(mapped.stress.value, 5);
    assert.equal(mapped.everydayActivity.value, 2);
    assert.equal(mapped.eatingQuality.value, 4);
    assert.equal(mapped.alcoholConsumption.value, '15_plus');
  });

  it('fails closed when a required field is unreadable', () => {
    assert.equal(
      mapInitialLifestyleForCoachAsk({
        ...baseline,
        alcoholConsumption: '15' as InitialLifestyleCheck['alcoholConsumption'],
      }),
      null,
    );
    assert.equal(
      mapInitialLifestyleForCoachAsk({
        ...baseline,
        sleepQuality: 0 as InitialLifestyleCheck['sleepQuality'],
      }),
      null,
    );
    assert.equal(
      mapInitialLifestyleForCoachAsk({
        ...baseline,
        lessHealthyFoodFrequency: 'twice' as InitialLifestyleCheck['lessHealthyFoodFrequency'],
      }),
      null,
    );
  });

  it('does not import the write validator or engines', () => {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(path.join(dir, 'coach-ask-initial-lifestyle.mapper.ts'), 'utf8');
    assert.equal(source.includes('initialLifestyleAnswersValidator'), false);
    assert.equal(source.includes('initial-lifestyle.validator'), false);
    assert.equal(source.includes('health-score-engine'), false);
    assert.equal(source.includes('focus-engine'), false);
    assert.equal(source.includes('coach-engine'), false);
  });
});

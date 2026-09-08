import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { determineWeeklyFocus } from './weekly-focus-engine';
import {
  engineInput,
  healthyLifestyle,
  healthyWeekly,
  pairLabel,
} from './weekly-focus.test-fixtures';

describe('Weekly Focus engine — worked profiles', () => {
  it('1. poor sleep only', () => {
    const result = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ sleepQuality: 1 }) }),
    );
    assert.equal(pairLabel(result.focuses), 'sleep:improve:5|everyday_movement:maintain:0');
  });

  it('2. poor sleep + high stress + low energy', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({ sleepQuality: 1, stress: 5, energy: 1 }),
      }),
    );
    assert.equal(pairLabel(result.focuses), 'sleep:improve:5|recovery:improve:5');
  });

  it('3. low everyday movement but trains 4+', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({
          everydayActivity: 1,
          trainingFrequency: 'four_plus',
          sleepQuality: 4,
          eatingQuality: 4,
        }),
      }),
    );
    assert.equal(pairLabel(result.focuses), 'everyday_movement:improve:5|sleep:maintain:1');
  });

  it('4. high everyday movement but no formal training (need 3, not 4)', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({ everydayActivity: 5, trainingFrequency: 'none' }),
      }),
    );
    assert.equal(pairLabel(result.focuses), 'training:improve:3|everyday_movement:maintain:0');
  });

  it('5. poor diet + daily less-healthy food', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({ eatingQuality: 2 }),
        initialLifestyle: healthyLifestyle({ lessHealthyFoodFrequency: 'daily' }),
      }),
    );
    assert.equal(pairLabel(result.focuses), 'nutrition:improve:5|everyday_movement:maintain:0');
  });

  it('6. baseline daily less-healthy + latest weekly diet excellent', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({ eatingQuality: 5 }),
        initialLifestyle: healthyLifestyle({
          eatingQuality: 1,
          lessHealthyFoodFrequency: 'daily',
        }),
      }),
    );
    assert.equal(pairLabel(result.focuses), 'everyday_movement:maintain:0|sleep:maintain:0');
    assert.equal(result.scores.nutrition.status, 'known');
    if (result.scores.nutrition.status === 'known') {
      assert.equal(result.scores.nutrition.needScore, 2);
    }
  });

  it('7. alcohol none', () => {
    const result = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ alcoholConsumption: 'none' }) }),
    );
    assert.equal(pairLabel(result.focuses), 'everyday_movement:maintain:0|sleep:maintain:0');
  });

  it('8. alcohol 1–3', () => {
    const result = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ alcoholConsumption: '1_3' }) }),
    );
    assert.equal(pairLabel(result.focuses), 'everyday_movement:maintain:0|sleep:maintain:0');
  });

  it('9. alcohol 4–7', () => {
    const result = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ alcoholConsumption: '4_7' }) }),
    );
    assert.equal(pairLabel(result.focuses), 'alcohol:improve:3|everyday_movement:maintain:0');
  });

  it('10. alcohol 15+', () => {
    const result = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ alcoholConsumption: '15_plus' }) }),
    );
    assert.equal(pairLabel(result.focuses), 'alcohol:improve:5|everyday_movement:maintain:0');
  });

  it('11. highly active healthy user', () => {
    const result = determineWeeklyFocus(
      engineInput({
        activityLevel: 'extra_active',
        weeklyCheckIn: healthyWeekly({ trainingFrequency: 'four_plus' }),
        primaryFocus: 'maintain_current_path',
      }),
    );
    assert.equal(pairLabel(result.focuses), 'everyday_movement:maintain:0|sleep:maintain:0');
  });

  it('12. sedentary user with high stress/low energy', () => {
    const result = determineWeeklyFocus({
      weeklyCheckIn: null,
      initialLifestyle: healthyLifestyle({
        stress: 5,
        energy: 1,
        sleepQuality: 3,
        everydayActivity: 1,
      }),
      activityLevel: 'sedentary',
      primaryFocus: null,
      previousFocuses: null,
    });
    assert.equal(pairLabel(result.focuses), 'everyday_movement:improve:5|recovery:improve:5');
  });
});

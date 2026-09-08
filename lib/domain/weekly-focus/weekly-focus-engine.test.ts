import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { determineWeeklyFocus } from './weekly-focus-engine';
import { engineInput, healthyLifestyle, healthyWeekly, pairLabel } from './weekly-focus.test-fixtures';
import type { WeeklyFocusArea, WeeklyFocusNeedScore } from './weekly-focus.types';

function knownNeed(
  result: ReturnType<typeof determineWeeklyFocus>,
  area: WeeklyFocusArea,
): WeeklyFocusNeedScore {
  const score = result.scores[area];
  assert.equal(score.status, 'known', `${area} should be known`);
  if (score.status !== 'known') {
    throw new Error('unreachable');
  }
  return score.needScore;
}

describe('Weekly Focus engine — required matrix', () => {
  it('1. poor sleep only: Sleep Improve, Recovery not duplicated from sleep', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({ sleepQuality: 1 }),
      }),
    );
    assert.equal(knownNeed(result, 'sleep'), 5);
    assert.equal(knownNeed(result, 'recovery'), 1);
    assert.equal(pairLabel(result.focuses), 'sleep:improve:5|everyday_movement:maintain:0');
    assert.equal(result.focuses.some((item) => item.area === 'recovery'), false);
  });

  it('2. poor sleep + high stress + low energy: Sleep + Recovery Improve', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({ sleepQuality: 1, stress: 5, energy: 1 }),
      }),
    );
    assert.equal(knownNeed(result, 'sleep'), 5);
    assert.equal(knownNeed(result, 'recovery'), 5);
    assert.equal(result.recoveryConstraint, true);
    assert.equal(pairLabel(result.focuses), 'sleep:improve:5|recovery:improve:5');
  });

  it('3. low everyday movement + training four_plus does not overwrite movement', () => {
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
    assert.equal(knownNeed(result, 'everyday_movement'), 5);
    assert.equal(knownNeed(result, 'training'), 0);
    assert.equal(result.focuses[0]?.area, 'everyday_movement');
    assert.equal(result.focuses[0]?.mode, 'improve');
    assert.equal(result.focuses.some((item) => item.area === 'training'), false);
  });

  it('4. high everyday movement + training none → Training need 3, movement separate', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({ everydayActivity: 5, trainingFrequency: 'none' }),
      }),
    );
    assert.equal(knownNeed(result, 'training'), 3);
    assert.equal(knownNeed(result, 'everyday_movement'), 0);
    assert.equal(pairLabel(result.focuses), 'training:improve:3|everyday_movement:maintain:0');
  });

  it('5. poor eating quality + daily less-healthy food → strong Nutrition', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({ eatingQuality: 2 }),
        initialLifestyle: healthyLifestyle({ lessHealthyFoodFrequency: 'daily' }),
      }),
    );
    assert.equal(knownNeed(result, 'nutrition'), 5);
    assert.equal(result.focuses[0]?.area, 'nutrition');
    assert.equal(result.focuses[0]?.mode, 'improve');
  });

  it('6. baseline daily less-healthy + weekly excellent eating → Nutrition <= 3', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({ eatingQuality: 5 }),
        initialLifestyle: healthyLifestyle({
          eatingQuality: 1,
          lessHealthyFoodFrequency: 'daily',
        }),
      }),
    );
    assert.ok(knownNeed(result, 'nutrition') <= 3);
    assert.equal(knownNeed(result, 'nutrition'), 2);
    assert.equal(result.focuses.some((item) => item.area === 'nutrition' && item.mode === 'improve'), false);
  });

  it('7. alcohol none is never selected', () => {
    const result = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ alcoholConsumption: 'none' }) }),
    );
    assert.equal(knownNeed(result, 'alcohol'), 0);
    assert.equal(result.focuses.some((item) => item.area === 'alcohol'), false);
  });

  it('8. alcohol 1_3 is never selected', () => {
    const result = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ alcoholConsumption: '1_3' }) }),
    );
    assert.equal(knownNeed(result, 'alcohol'), 1);
    assert.equal(result.focuses.some((item) => item.area === 'alcohol'), false);
  });

  it('9. alcohol 4_7 → need 3 Improve eligible', () => {
    const result = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ alcoholConsumption: '4_7' }) }),
    );
    assert.equal(knownNeed(result, 'alcohol'), 3);
    assert.equal(result.focuses[0]?.area, 'alcohol');
    assert.equal(result.focuses[0]?.mode, 'improve');
    assert.equal(result.focuses[0]?.needScore, 3);
  });

  it('10. alcohol 15_plus → need 5', () => {
    const result = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ alcoholConsumption: '15_plus' }) }),
    );
    assert.equal(knownNeed(result, 'alcohol'), 5);
    assert.equal(pairLabel(result.focuses), 'alcohol:improve:5|everyday_movement:maintain:0');
  });

  it('11. healthy user → everyday_movement + sleep Maintain', () => {
    const result = determineWeeklyFocus(engineInput());
    assert.equal(result.recoveryConstraint, false);
    assert.equal(
      pairLabel(result.focuses),
      'everyday_movement:maintain:0|sleep:maintain:0',
    );
  });

  it('12. sedentary/low movement + high stress + low energy', () => {
    const result = determineWeeklyFocus(
      engineInput({
        activityLevel: 'sedentary',
        weeklyCheckIn: healthyWeekly({
          stress: 5,
          energy: 1,
          everydayActivity: 1,
          trainingFrequency: 'none',
          sleepQuality: 3,
        }),
      }),
    );
    assert.equal(knownNeed(result, 'recovery'), 5);
    assert.equal(knownNeed(result, 'everyday_movement'), 5);
    assert.equal(knownNeed(result, 'training'), 3);
    assert.equal(result.recoveryConstraint, true);
    assert.equal(pairLabel(result.focuses), 'everyday_movement:improve:5|recovery:improve:5');
    assert.equal(result.focuses.some((item) => item.area === 'training'), false);
  });

  it('13. initial poor sleep + latest weekly excellent sleep → latest wins', () => {
    const result = determineWeeklyFocus(
      engineInput({
        initialLifestyle: healthyLifestyle({ sleepQuality: 1 }),
        weeklyCheckIn: healthyWeekly({ sleepQuality: 5 }),
      }),
    );
    assert.equal(knownNeed(result, 'sleep'), 0);
    assert.equal(result.focuses.some((item) => item.area === 'sleep' && item.mode === 'improve'), false);
  });

  it('14. initial high alcohol + latest weekly none → latest wins', () => {
    const result = determineWeeklyFocus(
      engineInput({
        initialLifestyle: healthyLifestyle({ alcoholConsumption: '15_plus' }),
        weeklyCheckIn: healthyWeekly({ alcoholConsumption: 'none' }),
      }),
    );
    assert.equal(knownNeed(result, 'alcohol'), 0);
    assert.equal(result.focuses.some((item) => item.area === 'alcohol'), false);
  });

  it('15. Training Improve + recoveryConstraint + other Improve suppresses Training, raw score unchanged', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({
          trainingFrequency: 'none',
          stress: 5,
          energy: 1,
        }),
      }),
    );
    assert.equal(knownNeed(result, 'training'), 3);
    assert.equal(result.recoveryConstraint, true);
    assert.equal(result.focuses.some((item) => item.area === 'training'), false);
    assert.equal(result.focuses[0]?.area, 'recovery');
    assert.equal(result.focuses[0]?.mode, 'improve');
  });

  it('16. Sleep + Recovery anti-duplication when Recovery lacks independent evidence', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({ sleepQuality: 1, stress: 3, energy: 5 }),
      }),
    );
    assert.equal(knownNeed(result, 'sleep'), 5);
    assert.equal(knownNeed(result, 'recovery'), 3);
    assert.equal(result.focuses.some((item) => item.area === 'recovery'), false);
    assert.equal(pairLabel(result.focuses), 'sleep:improve:5|everyday_movement:maintain:0');
  });

  it('17. equal-score tie with previous focus prefers previous eligible Improve', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({
          trainingFrequency: 'none',
          alcoholConsumption: '4_7',
        }),
        previousFocuses: ['alcohol', 'sleep'],
      }),
    );
    assert.equal(knownNeed(result, 'training'), 3);
    assert.equal(knownNeed(result, 'alcohol'), 3);
    assert.equal(result.focuses[0]?.area, 'alcohol');
    assert.equal(result.focuses[1]?.area, 'training');
  });

  it('18. equal-score tie without previous uses explicit priority (training before alcohol)', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({
          trainingFrequency: 'none',
          alcoholConsumption: '4_7',
        }),
        previousFocuses: null,
      }),
    );
    assert.equal(result.focuses[0]?.area, 'training');
    assert.equal(result.focuses[1]?.area, 'alcohol');
  });

  it('19. Health Score primaryFocus only breaks a genuine tie and never changes raw scores', () => {
    const base = engineInput({
      weeklyCheckIn: healthyWeekly({ everydayActivity: 2, eatingQuality: 2 }),
      initialLifestyle: healthyLifestyle({ lessHealthyFoodFrequency: 'never' }),
    });
    const withoutHs = determineWeeklyFocus(base);
    const withHs = determineWeeklyFocus({ ...base, primaryFocus: 'improve_weight_balance' });

    assert.equal(knownNeed(withoutHs, 'everyday_movement'), knownNeed(withHs, 'everyday_movement'));
    assert.equal(knownNeed(withoutHs, 'nutrition'), knownNeed(withHs, 'nutrition'));
    assert.equal(knownNeed(withoutHs, 'everyday_movement'), 4);
    assert.equal(knownNeed(withoutHs, 'nutrition'), 4);
    assert.equal(withoutHs.focuses[0]?.area, 'everyday_movement');
    assert.equal(withHs.focuses[0]?.area, 'nutrition');
    assert.equal(withHs.focuses[1]?.area, 'everyday_movement');
  });

  it('20. Health Score focus with missing behavioral evidence does not create Improve', () => {
    const result = determineWeeklyFocus({
      weeklyCheckIn: null,
      initialLifestyle: null,
      activityLevel: null,
      primaryFocus: 'improve_activity',
      previousFocuses: null,
    });
    assert.equal(result.scores.sleep.status, 'unknown');
    assert.equal(result.scores.nutrition.status, 'unknown');
    assert.equal(result.scores.alcohol.status, 'unknown');
    assert.equal(result.scores.recovery.status, 'unknown');
    assert.equal(result.insufficientEvidenceFallback, true);
    assert.equal(result.focuses.every((item) => item.mode === 'maintain'), true);
    assert.equal(result.focuses.some((item) => item.mode === 'improve'), false);
  });

  it('21. planAdherence changes have no Weekly Focus selection effect', () => {
    const low = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ planAdherence: 1 }) }),
    );
    const high = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ planAdherence: 5 }) }),
    );
    assert.deepEqual(low.focuses, high.focuses);
    assert.deepEqual(low.scores, high.scores);
    assert.equal(low.recoveryConstraint, high.recoveryConstraint);
  });

  it('22. missing lifestyle values stay unknown, not fake healthy/poor', () => {
    const result = determineWeeklyFocus({
      weeklyCheckIn: null,
      initialLifestyle: null,
      activityLevel: 'sedentary',
      primaryFocus: null,
      previousFocuses: null,
    });
    assert.equal(result.scores.sleep.status, 'unknown');
    assert.equal(result.scores.nutrition.status, 'unknown');
    assert.equal(result.scores.alcohol.status, 'unknown');
    assert.equal(result.scores.recovery.status, 'unknown');
    assert.equal(knownNeed(result, 'everyday_movement'), 4);
    assert.equal(knownNeed(result, 'training'), 2);
    assert.equal(result.focuses.some((item) => item.area === 'sleep'), false);
    assert.equal(result.focuses.some((item) => item.area === 'alcohol'), false);
  });

  it('23. alcohol is never selected as Maintain', () => {
    const none = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ alcoholConsumption: 'none' }) }),
    );
    const light = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ alcoholConsumption: '1_3' }) }),
    );
    assert.equal(none.focuses.some((item) => item.area === 'alcohol'), false);
    assert.equal(light.focuses.some((item) => item.area === 'alcohol'), false);
    assert.equal(
      none.focuses.some((item) => item.area === 'alcohol' && item.mode === 'maintain'),
      false,
    );
  });

  it('24. no artificial week-to-week rotation when the top problem remains', () => {
    const result = determineWeeklyFocus(
      engineInput({
        weeklyCheckIn: healthyWeekly({ sleepQuality: 1, eatingQuality: 2 }),
        previousFocuses: ['sleep', 'nutrition'],
      }),
    );
    assert.equal(result.focuses[0]?.area, 'sleep');
    assert.equal(result.focuses[1]?.area, 'nutrition');
    assert.equal(result.focuses[0]?.mode, 'improve');
    assert.equal(result.focuses[1]?.mode, 'improve');
  });

  it('25. identical input always yields identical result', () => {
    const input = engineInput({
      weeklyCheckIn: healthyWeekly({ sleepQuality: 2, stress: 4 }),
      previousFocuses: ['recovery', 'sleep'],
      primaryFocus: 'maintain_current_path',
    });
    const a = determineWeeklyFocus(input);
    const b = determineWeeklyFocus(input);
    assert.deepEqual(a, b);
  });
});

describe('Weekly Focus engine — extra rules', () => {
  it('does not create Recovery need from high training alone', () => {
    const result = determineWeeklyFocus(
      engineInput({
        activityLevel: 'extra_active',
        weeklyCheckIn: healthyWeekly({ trainingFrequency: 'four_plus' }),
      }),
    );
    assert.equal(knownNeed(result, 'recovery'), 0);
    assert.equal(result.recoveryConstraint, false);
  });

  it('maintain_current_path does not reorder Maintain to Sleep + Recovery', () => {
    const result = determineWeeklyFocus(
      engineInput({ primaryFocus: 'maintain_current_path' }),
    );
    assert.equal(
      pairLabel(result.focuses),
      'everyday_movement:maintain:0|sleep:maintain:0',
    );
  });

  it('first-week Training uses conservative activityLevel fallback, not everydayActivity', () => {
    const result = determineWeeklyFocus({
      weeklyCheckIn: null,
      initialLifestyle: healthyLifestyle({ everydayActivity: 1 }),
      activityLevel: 'sedentary',
      primaryFocus: null,
      previousFocuses: null,
    });
    assert.equal(knownNeed(result, 'everyday_movement'), 5);
    assert.equal(knownNeed(result, 'training'), 2);
    assert.equal(result.focuses[0]?.area, 'everyday_movement');
    assert.equal(result.focuses.some((item) => item.area === 'training' && item.mode === 'improve'), false);
  });

  it('alcohol 8_14 → need 4', () => {
    const result = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ alcoholConsumption: '8_14' }) }),
    );
    assert.equal(knownNeed(result, 'alcohol'), 4);
  });

  it('recoveryConstraint can be true from poor sleep without Recovery Improve', () => {
    const result = determineWeeklyFocus(
      engineInput({ weeklyCheckIn: healthyWeekly({ sleepQuality: 2 }) }),
    );
    assert.equal(result.recoveryConstraint, true);
    assert.equal(result.focuses.some((item) => item.area === 'recovery'), false);
    assert.equal(result.focuses[0]?.area, 'sleep');
  });
});

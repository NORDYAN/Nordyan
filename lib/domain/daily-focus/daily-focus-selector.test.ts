import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { DAILY_FOCUS_ACTION_BANK } from './daily-focus-action-bank';
import { DAILY_FOCUS_ACTION_COPY } from './daily-focus-action-copy';
import {
  addDailyFocusCalendarDays,
  dailyFocusCalendarDaysBetween,
  listEligibleDailyFocusActions,
  selectDailyFocus,
} from './daily-focus-selector';
import {
  FROZEN_ACTION_BANK_IDS,
  alcoholMovementMaintain,
  alcoholSleepImprove,
  byId,
  healthyMaintain,
  highNeedNutritionLowMovement,
  historyEntry,
  movementImproveSleepMaintain,
  nutritionTrainingMaintain,
  selectorFocus,
  selectorInput,
  selectorWeeklyFocus,
  simulateDays,
  sleepNutritionImprove,
  sleepRecoveryImprove,
  trainingNutritionImprove,
  trainingRecoveryImprove,
  SELECTOR_WEEK_START,
} from './daily-focus-selector.fixtures';

const BANK_IDS = new Set(DAILY_FOCUS_ACTION_BANK.map((action) => action.id));

function titleSv(actionId: string): string {
  return DAILY_FOCUS_ACTION_COPY[actionId as keyof typeof DAILY_FOCUS_ACTION_COPY].title.sv;
}

describe('Daily Focus selector', () => {
  it('never returns an unknown action ID or an area outside Weekly Focus', () => {
    const week = simulateDays(sleepNutritionImprove(), SELECTOR_WEEK_START, 7);
    const active = new Set(sleepNutritionImprove().focuses.map((focus) => focus.area));
    for (const day of week) {
      assert.equal(BANK_IDS.has(day.result.actionId), true);
      assert.equal(active.has(day.result.focusArea), true);
      const action = byId(day.result.actionId);
      assert.equal(action.allowedModes.includes(day.result.weeklyFocusMode), true);
    }
  });

  it('is deterministic for the same input, date and seed', () => {
    const weekly = sleepNutritionImprove();
    const first = selectDailyFocus(selectorInput(weekly));
    const second = selectDailyFocus(selectorInput(weekly));
    assert.equal(first.actionId, second.actionId);
    const otherSeed = selectDailyFocus(selectorInput(weekly, { selectionSeed: 'seed-b' }));
    const otherDate = selectDailyFocus(selectorInput(weekly, { localDate: '2026-03-03' }));
    assert.equal(typeof otherSeed.actionId, 'string');
    assert.equal(typeof otherDate.actionId, 'string');
  });

  it('does not use Math.random', () => {
    const source = readFileSync(new URL('./daily-focus-selector.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('Math.random'), false);
  });

  it('keeps the frozen Action Bank unchanged', () => {
    assert.equal(DAILY_FOCUS_ACTION_BANK.length, 93);
    assert.deepEqual(
      DAILY_FOCUS_ACTION_BANK.map((action) => action.id),
      FROZEN_ACTION_BANK_IDS,
    );
  });

  it('never selects Alcohol unless Alcohol is an active Weekly Focus', () => {
    const week = simulateDays(sleepNutritionImprove(), SELECTOR_WEEK_START, 14);
    assert.equal(week.some((day) => day.result.focusArea === 'alcohol'), false);
  });

  it('respects Alcohol Improve-only when Alcohol is active', () => {
    const week = simulateDays(alcoholSleepImprove(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      if (day.result.focusArea === 'alcohol') {
        assert.equal(day.result.weeklyFocusMode, 'improve');
        assert.equal(byId(day.result.actionId).allowedModes.includes('maintain'), false);
      }
    }
  });

  it('blocks challenge under recoveryConstraint', () => {
    const week = simulateDays(sleepRecoveryImprove(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      assert.notEqual(day.result.intensity, 'challenge');
    }
    const eligible = listEligibleDailyFocusActions(selectorInput(sleepRecoveryImprove()));
    assert.equal(eligible.some((action) => action.intensity === 'challenge'), false);
  });

  it('blocks challenge in Maintain mode', () => {
    const week = simulateDays(healthyMaintain(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      assert.notEqual(day.result.intensity, 'challenge');
      assert.equal(day.result.weeklyFocusMode, 'maintain');
    }
  });

  it('blocks the fast-food action without relevance evidence', () => {
    const weekly = selectorWeeklyFocus({
      focuses: [selectorFocus('nutrition', 'improve', 5), selectorFocus('sleep', 'improve', 2)],
    });
    const eligible = listEligibleDailyFocusActions(selectorInput(weekly, { context: { lessHealthyFoodRelevant: false } }));
    assert.equal(eligible.some((action) => action.id === 'nutrition_no_fast_food_today'), false);
    const withEvidence = listEligibleDailyFocusActions(
      selectorInput(weekly, { context: { lessHealthyFoodRelevant: true } }),
    );
    assert.equal(withEvidence.some((action) => action.id === 'nutrition_no_fast_food_today'), true);
  });

  it('uses inclusive 14-day exact-action cooldown: D-13 and D-14 blocked, D-15 eligible', () => {
    const today = '2026-03-16';
    const shown13 = addDailyFocusCalendarDays(today, -13);
    const shown14 = addDailyFocusCalendarDays(today, -14);
    const shown15 = addDailyFocusCalendarDays(today, -15);
    assert.equal(dailyFocusCalendarDaysBetween(shown13, today), 13);
    assert.equal(dailyFocusCalendarDaysBetween(shown14, today), 14);
    assert.equal(dailyFocusCalendarDaysBetween(shown15, today), 15);

    const weekly = sleepNutritionImprove();
    const actionId = 'sleep_prepare_bedroom';
    const blocked13 = listEligibleDailyFocusActions(
      selectorInput(weekly, { localDate: today, history: [historyEntry(shown13, actionId)] }),
    );
    const blocked14 = listEligibleDailyFocusActions(
      selectorInput(weekly, { localDate: today, history: [historyEntry(shown14, actionId)] }),
    );
    const open15 = listEligibleDailyFocusActions(
      selectorInput(weekly, { localDate: today, history: [historyEntry(shown15, actionId)] }),
    );
    assert.equal(blocked13.some((action) => action.id === actionId), false);
    assert.equal(blocked14.some((action) => action.id === actionId), false);
    assert.equal(open15.some((action) => action.id === actionId), true);
  });

  it('blocks yesterday behaviorFamily, including swapped-away family', () => {
    const weekly = sleepNutritionImprove();
    const yesterday = '2026-03-02';
    const today = '2026-03-03';
    const history = [
      historyEntry(yesterday, 'sleep_screens_off_earlier', {
        swappedFromActionId: 'nutrition_add_vegetables',
        swappedFromBehaviorFamily: 'vegetables',
        swappedFromFocusArea: 'nutrition',
        swappedFromIntensity: 'micro',
      }),
    ];
    const eligible = listEligibleDailyFocusActions(selectorInput(weekly, { localDate: today, history }));
    assert.equal(eligible.some((action) => action.behaviorFamily === 'screen_cutoff'), false);
    assert.equal(eligible.some((action) => action.behaviorFamily === 'vegetables'), false);
    const relaxed = listEligibleDailyFocusActions(selectorInput(weekly, { localDate: today, history }), 1);
    assert.equal(
      relaxed.some((action) => action.behaviorFamily === 'screen_cutoff' || action.behaviorFamily === 'vegetables'),
      true,
    );
  });

  it('does not create a 14-day family cooldown', () => {
    const weekly = sleepNutritionImprove();
    const today = '2026-03-16';
    const twoDaysAgo = addDailyFocusCalendarDays(today, -2);
    const eligible = listEligibleDailyFocusActions(
      selectorInput(weekly, {
        localDate: today,
        history: [historyEntry(twoDaysAgo, 'sleep_screens_off_earlier')],
      }),
    );
    assert.equal(
      eligible.some((action) => action.behaviorFamily === 'screen_cutoff' && action.id !== 'sleep_screens_off_earlier'),
      true,
    );
  });

  it('soft-prefers the other Weekly Focus area after yesterday when both have candidates', () => {
    const week = simulateDays(sleepNutritionImprove(), SELECTOR_WEEK_START, 7, { selectionSeed: 'seed-a' });
    const first = week[0]!;
    const second = week[1]!;
    if (second.result.selectionMetadata.usedAreaAlternationPreference) {
      assert.notEqual(second.result.focusArea, first.result.focusArea);
    }
  });

  it('allows yesterday area again when the other area has no eligible candidates', () => {
    const weekly = sleepNutritionImprove();
    const today = '2026-03-16';
    const nutritionIds = DAILY_FOCUS_ACTION_BANK.filter((action) => action.focusArea === 'nutrition').map(
      (action) => action.id,
    );
    const history = nutritionIds.map((actionId, index) =>
      historyEntry(addDailyFocusCalendarDays(today, -(index + 1)), actionId),
    );
    const result = selectDailyFocus(selectorInput(weekly, { localDate: today, history }));
    assert.equal(result.focusArea, 'sleep');
  });

  it('never selects consecutive challenge days', () => {
    const weekly = alcoholSleepImprove();
    const eligible = listEligibleDailyFocusActions(
      selectorInput(weekly, {
        localDate: '2026-03-03',
        history: [historyEntry('2026-03-02', 'alcohol_free_evening')],
      }),
    );
    assert.equal(eligible.some((action) => action.intensity === 'challenge'), false);
  });

  it('prefers recovery intensity when recoveryConstraint is true', () => {
    const week = simulateDays(sleepRecoveryImprove(), SELECTOR_WEEK_START, 7);
    assert.equal(week.some((day) => day.result.intensity === 'recovery'), true);
    assert.equal(week.every((day) => day.result.intensity !== 'challenge'), true);
  });

  it('avoids Training load-increase actions under recoveryConstraint', () => {
    const week = simulateDays(trainingRecoveryImprove(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      if (day.result.focusArea === 'training') {
        assert.equal(
          ['mobility', 'active_recovery', 'training_planning', 'training_preparation'].includes(day.result.behaviorFamily),
          true,
        );
      }
      assert.notEqual(day.result.intensity, 'challenge');
    }
  });

  it('swap returns a different action and family and treats the original as shown', () => {
    const weekly = sleepNutritionImprove();
    const original = selectDailyFocus(selectorInput(weekly, { localDate: SELECTOR_WEEK_START }));
    const replacement = selectDailyFocus(
      selectorInput(weekly, {
        localDate: SELECTOR_WEEK_START,
        selectionReason: 'swap',
        history: [historyEntry(SELECTOR_WEEK_START, original.actionId)],
      }),
    );
    assert.notEqual(replacement.actionId, original.actionId);
    assert.notEqual(replacement.behaviorFamily, original.behaviorFamily);
    const active = new Set(weekly.focuses.map((focus) => focus.area));
    assert.equal(active.has(replacement.focusArea), true);
  });

  it('swap under recoveryConstraint never returns challenge', () => {
    const weekly = sleepRecoveryImprove();
    const original = selectDailyFocus(selectorInput(weekly, { localDate: SELECTOR_WEEK_START }));
    const replacement = selectDailyFocus(
      selectorInput(weekly, {
        localDate: SELECTOR_WEEK_START,
        selectionReason: 'swap',
        history: [historyEntry(SELECTOR_WEEK_START, original.actionId)],
      }),
    );
    assert.notEqual(replacement.actionId, original.actionId);
    assert.notEqual(replacement.intensity, 'challenge');
  });

  it('ignores completion when selecting', () => {
    const weekly = sleepNutritionImprove();
    const completedWeek = simulateDays(weekly, SELECTOR_WEEK_START, 7, { completed: true });
    const skippedWeek = simulateDays(weekly, SELECTOR_WEEK_START, 7, { completed: false });
    assert.deepEqual(
      completedWeek.map((day) => day.result.actionId),
      skippedWeek.map((day) => day.result.actionId),
    );
  });

  it('survives 14 consecutive days without pool failure', () => {
    const week = simulateDays(sleepNutritionImprove(), SELECTOR_WEEK_START, 14);
    assert.equal(week.length, 14);
    const ids = week.map((day) => day.result.actionId);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('never selects a third unrelated area during fallback', () => {
    const week = simulateDays(healthyMaintain(), SELECTOR_WEEK_START, 14);
    const active = new Set(['everyday_movement', 'sleep']);
    for (const day of week) {
      assert.equal(active.has(day.result.focusArea), true);
    }
  });
});

describe('Daily Focus selector — worked scenarios', () => {
  it('1. Sleep Improve + Nutrition Improve — 7-day week', () => {
    const week = simulateDays(sleepNutritionImprove(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      assert.equal(['sleep', 'nutrition'].includes(day.result.focusArea), true);
      assert.ok(titleSv(day.result.actionId).length > 0);
    }
  });

  it('2. Movement Improve + Sleep Maintain', () => {
    const week = simulateDays(movementImproveSleepMaintain(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      assert.equal(['everyday_movement', 'sleep'].includes(day.result.focusArea), true);
      if (day.result.focusArea === 'sleep') {
        assert.equal(day.result.weeklyFocusMode, 'maintain');
        assert.notEqual(day.result.intensity, 'challenge');
      }
    }
  });

  it('3. Training Improve + Nutrition Improve', () => {
    const week = simulateDays(trainingNutritionImprove(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      assert.equal(['training', 'nutrition'].includes(day.result.focusArea), true);
    }
  });

  it('4. Training Improve + Recovery Improve with recoveryConstraint', () => {
    const week = simulateDays(trainingRecoveryImprove(), SELECTOR_WEEK_START, 7);
    assert.equal(week.some((day) => day.result.focusArea === 'recovery'), true);
    assert.equal(week.every((day) => day.result.intensity !== 'challenge'), true);
  });

  it('5. Sleep Improve + Recovery Improve with recoveryConstraint', () => {
    const week = simulateDays(sleepRecoveryImprove(), SELECTOR_WEEK_START, 7);
    assert.equal(week.every((day) => ['sleep', 'recovery'].includes(day.result.focusArea)), true);
    assert.equal(week.every((day) => day.result.intensity !== 'challenge'), true);
  });

  it('6. Alcohol Improve + Sleep Improve', () => {
    const week = simulateDays(alcoholSleepImprove(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      assert.equal(['alcohol', 'sleep'].includes(day.result.focusArea), true);
    }
  });

  it('7. Alcohol Improve + Movement Maintain', () => {
    const week = simulateDays(alcoholMovementMaintain(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      assert.equal(['alcohol', 'everyday_movement'].includes(day.result.focusArea), true);
      if (day.result.focusArea === 'everyday_movement') {
        assert.equal(day.result.weeklyFocusMode, 'maintain');
      }
    }
  });

  it('8. Movement Maintain + Sleep Maintain healthy user', () => {
    const week = simulateDays(healthyMaintain(), SELECTOR_WEEK_START, 7);
    assert.equal(week.every((day) => day.result.weeklyFocusMode === 'maintain'), true);
  });

  it('9. Nutrition Maintain + Training Maintain', () => {
    const week = simulateDays(nutritionTrainingMaintain(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      assert.equal(day.result.weeklyFocusMode, 'maintain');
      assert.notEqual(day.result.intensity, 'challenge');
    }
  });

  it('10. high need in one area vs lower need second area still allows both', () => {
    const week = simulateDays(highNeedNutritionLowMovement(), SELECTOR_WEEK_START, 7, { selectionSeed: 'seed-need' });
    assert.equal(week.some((day) => day.result.focusArea === 'nutrition'), true);
  });
});

describe('Daily Focus selector — softened area alternation', () => {
  it('shows both Weekly Focus areas over 7 days', () => {
    const week = simulateDays(sleepNutritionImprove(), SELECTOR_WEEK_START, 7);
    const areas = new Set(week.map((day) => day.result.focusArea));
    assert.equal(areas.has('sleep'), true);
    assert.equal(areas.has('nutrition'), true);
    let switches = 0;
    for (let index = 1; index < week.length; index += 1) {
      if (week[index]!.result.focusArea !== week[index - 1]!.result.focusArea) {
        switches += 1;
      }
    }
    assert.ok(switches < 6);
  });

  it('may select the same area on consecutive days when candidates otherwise support it', () => {
    const weeks = [
      simulateDays(sleepNutritionImprove(), SELECTOR_WEEK_START, 7),
      simulateDays(trainingNutritionImprove(), SELECTOR_WEEK_START, 7),
      simulateDays(healthyMaintain(), SELECTOR_WEEK_START, 7),
      simulateDays(alcoholSleepImprove(), SELECTOR_WEEK_START, 7),
    ];
    const hasConsecutiveSameArea = weeks.some((week) =>
      week.some((day, index) => index > 0 && day.result.focusArea === week[index - 1]!.result.focusArea),
    );
    assert.equal(hasConsecutiveSameArea, true);
    for (const week of weeks) {
      for (let index = 1; index < week.length; index += 1) {
        if (week[index]!.result.focusArea === week[index - 1]!.result.focusArea) {
          assert.notEqual(week[index]!.result.behaviorFamily, week[index - 1]!.result.behaviorFamily);
          assert.notEqual(week[index]!.result.actionId, week[index - 1]!.result.actionId);
        }
      }
    }
  });

  it('still blocks yesterday behaviorFamily at L0', () => {
    const weekly = sleepNutritionImprove();
    const eligible = listEligibleDailyFocusActions(
      selectorInput(weekly, {
        localDate: '2026-03-03',
        history: [historyEntry('2026-03-02', 'sleep_screens_off_earlier')],
      }),
    );
    assert.equal(eligible.some((action) => action.behaviorFamily === 'screen_cutoff'), false);
  });

  it('never selects an unrelated third area', () => {
    const week = simulateDays(trainingNutritionImprove(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      assert.equal(['training', 'nutrition'].includes(day.result.focusArea), true);
    }
  });

  it('returns the same action for identical input', () => {
    const weekly = sleepNutritionImprove();
    const input = selectorInput(weekly, {
      localDate: '2026-03-04',
      history: [
        historyEntry('2026-03-02', 'sleep_prepare_bedroom'),
        historyEntry('2026-03-03', 'nutrition_add_vegetables'),
      ],
    });
    assert.equal(selectDailyFocus(input).actionId, selectDailyFocus(input).actionId);
  });
});

describe('Daily Focus selector — recovery constraint intensity bias', () => {
  const SAFE_TRAINING_FAMILIES = new Set([
    'mobility',
    'active_recovery',
    'training_planning',
    'training_preparation',
  ]);

  it('never returns Challenge under recoveryConstraint', () => {
    const weeks = [
      simulateDays(trainingRecoveryImprove(), SELECTOR_WEEK_START, 7),
      simulateDays(sleepRecoveryImprove(), SELECTOR_WEEK_START, 7),
    ];
    for (const week of weeks) {
      assert.equal(week.every((day) => day.result.intensity !== 'challenge'), true);
    }
  });

  it('allows only safe Training families under recoveryConstraint', () => {
    const week = simulateDays(trainingRecoveryImprove(), SELECTOR_WEEK_START, 7);
    for (const day of week) {
      if (day.result.focusArea === 'training') {
        assert.equal(SAFE_TRAINING_FAMILIES.has(day.result.behaviorFamily), true);
      }
    }
  });

  it('still selects recovery intensity during an RC week', () => {
    const week = simulateDays(sleepRecoveryImprove(), SELECTOR_WEEK_START, 7);
    assert.equal(week.some((day) => day.result.intensity === 'recovery'), true);
  });

  it('includes Micro or Normal actions in an RC 7-day week', () => {
    const week = simulateDays(trainingRecoveryImprove(), SELECTOR_WEEK_START, 7);
    assert.equal(
      week.some((day) => day.result.intensity === 'micro' || day.result.intensity === 'normal'),
      true,
    );
  });

  it('does not run several consecutive recovery-intensity days when Micro/Normal alternatives exist', () => {
    const week = simulateDays(sleepRecoveryImprove(), SELECTOR_WEEK_START, 7);
    let longestRecoveryRun = 0;
    let currentRun = 0;
    for (const day of week) {
      if (day.result.intensity === 'recovery') {
        currentRun += 1;
        longestRecoveryRun = Math.max(longestRecoveryRun, currentRun);
      } else {
        currentRun = 0;
      }
    }
    assert.ok(longestRecoveryRun <= 1);
    assert.equal(
      week.some((day) => day.result.intensity === 'micro' || day.result.intensity === 'normal'),
      true,
    );
  });

  it('deprioritizes recovery intensity when yesterday was recovery and safe alternatives exist', () => {
    const weekly = sleepRecoveryImprove();
    const result = selectDailyFocus(
      selectorInput(weekly, {
        localDate: '2026-03-03',
        history: [historyEntry('2026-03-02', 'sleep_calm_evening')],
      }),
    );
    assert.notEqual(result.intensity, 'recovery');
    assert.notEqual(result.intensity, 'challenge');
    assert.equal(['sleep', 'recovery'].includes(result.focusArea), true);
  });
});

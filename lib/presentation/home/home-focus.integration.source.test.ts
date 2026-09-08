import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Home Focus Integration v1 source contracts', () => {
  it('wires Daily and Weekly through services, not selector or Supabase', () => {
    const home = source('app/(tabs)/home.tsx');
    const dailyHook = source('lib/hooks/home/useHomeDailyFocus.ts');
    const weeklyHook = source('lib/hooks/home/useHomeWeeklyFocus.ts');

    assert.match(home, /HomeHealthScoreCard/);
    assert.match(home, /DailyFocusCard/);
    assert.match(home, /WeeklyFocusCard/);
    assert.match(home, /HomeWeeklyCheckInCard/);
    assert.match(home, /HomeMeasurementFollowUpCard/);
    assert.match(home, /shouldShowBodyMeasurementFollowUp/);
    assert.match(home, /shouldShowHomeWeeklyCheckInCard/);
    assert.match(home, /HomeProgressCard/);
    assert.match(home, /HomeCoachCard/);
    assert.match(home, /onPressAsk=\{\(\) => router\.push\(routes\.coach\)\}/);
    assert.match(home, /useHomeWeeklyFocus/);
    assert.match(home, /useHomeDailyFocus/);

    assert.doesNotMatch(home, /buildHomeDailyPriorities/);
    assert.doesNotMatch(home, /HomePriorityItem/);
    assert.doesNotMatch(home, /home\.priorities/);
    assert.doesNotMatch(home, /Dagens prioriteringar/);
    assert.doesNotMatch(home, /selectDailyFocus/);
    assert.doesNotMatch(home, /from\('user_daily_focus'\)/);
    assert.doesNotMatch(home, /getSupabaseClient/);
    assert.doesNotMatch(home, /useHomeCoachLanguage/);
    assert.doesNotMatch(home, /showPlan/);
    assert.doesNotMatch(home, /Food Scanner|foodScanner|matskanner/i);
    assert.doesNotMatch(home, /Blodprover|blood-tests|Blodprøver/);
    assert.doesNotMatch(home, /Notifications|expo-notifications/);
    assert.doesNotMatch(home, /av 7|\/7/);

    const healthIndex = home.indexOf('<HomeHealthScoreCard');
    const dailyIndex = home.indexOf('<DailyFocusCard');
    const weeklyIndex = home.indexOf('<WeeklyFocusCard');
    const checkInIndex = home.indexOf('<HomeWeeklyCheckInCard');
    const measurementIndex = home.indexOf('<HomeMeasurementFollowUpCard');
    const overviewIndex = home.indexOf("t('home.overview.heading')");
    const progressIndex = home.indexOf('<HomeProgressCard');
    const coachIndex = home.indexOf('<HomeCoachCard');
    assert.ok(healthIndex < dailyIndex);
    assert.ok(dailyIndex < weeklyIndex);
    assert.ok(weeklyIndex < checkInIndex);
    assert.ok(checkInIndex < measurementIndex);
    assert.ok(measurementIndex < overviewIndex);
    assert.ok(overviewIndex < progressIndex);
    assert.ok(progressIndex < coachIndex);

    assert.match(dailyHook, /getOrCreateCurrent/);
    assert.match(dailyHook, /markCompleteCurrent/);
    assert.match(dailyHook, /undoCompleteCurrent/);
    assert.match(dailyHook, /swapCurrent/);
    assert.match(dailyHook, /useFocusEffect/);
    assert.match(dailyHook, /AppState\.addEventListener\('change'/);
    assert.match(dailyHook, /next === 'active'/);
    assert.doesNotMatch(dailyHook, /selectDailyFocus/);
    assert.doesNotMatch(dailyHook, /from\('user_daily_focus'\)/);
    assert.doesNotMatch(dailyHook, /setInterval|setTimeout/);

    assert.match(weeklyHook, /AppState\.addEventListener\('change'/);
    assert.doesNotMatch(weeklyHook, /selectDailyFocus/);
  });

  it('Health Score remains independent of Daily Focus availability', () => {
    const home = source('app/(tabs)/home.tsx');
    assert.match(home, /HomeHealthScoreCard state=\{healthScoreCardState\}/);
    assert.doesNotMatch(home, /if \(dailyFocusView\.kind === 'unavailable'\) \{\s*return/);
    const healthScoreState = source('app/(tabs)/home.tsx');
    assert.match(healthScoreState, /currentHealthState/);
    assert.doesNotMatch(
      healthScoreState.slice(
        healthScoreState.indexOf('healthScoreCardState'),
        healthScoreState.indexOf('greetingTitle'),
      ),
      /dailyFocus/,
    );
  });
});

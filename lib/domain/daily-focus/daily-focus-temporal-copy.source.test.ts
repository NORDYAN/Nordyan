import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const SELECTOR = 'lib/domain/daily-focus/daily-focus-selector.ts';
const SELECTOR_TYPES = 'lib/domain/daily-focus/daily-focus-selector.types.ts';
const SERVICE = 'lib/services/daily-focus/daily-focus.service.ts';
const SCHEDULE = 'lib/presentation/notifications/daily-focus-schedule.ts';
const NOTIFICATION_COPY = 'lib/presentation/notifications/notification-copy.ts';
const DEFINITIONS = 'lib/domain/daily-focus/daily-focus-action-definitions.ts';
const COPY = 'lib/domain/daily-focus/daily-focus-action-copy.ts';

describe('Daily Focus temporal copy polish source contracts', () => {
  it('changes copy only for the four Class 1 action IDs', () => {
    const copy = source(COPY);
    assert.match(copy, /sleep_morning_daylight: \{[\s\S]*title: \{ sv: 'Få lite dagsljus'/);
    assert.match(copy, /nutrition_protein_at_breakfast: \{[\s\S]*title: \{ sv: 'Lägg till protein'/);
    assert.match(copy, /nutrition_sit_down_lunch: \{[\s\S]*title: \{ sv: 'Sitt ner när du äter'/);
    assert.match(copy, /recovery_phone_free_lunch: \{[\s\S]*title: \{ sv: 'Ät utan telefon'/);

    assert.doesNotMatch(copy, /efter uppvaknandet/);
    assert.doesNotMatch(copy, /etter at du har våknet/);
    assert.doesNotMatch(copy, /Ta dagsljus på morgonen/);
    assert.doesNotMatch(copy, /Protein till frukost/);
    assert.doesNotMatch(copy, /Sitt ner och ät lunch/);
    assert.doesNotMatch(copy, /Lunch utan telefon/);

    assert.match(copy, /title: \{ sv: 'Alkoholfri kväll'/);
    assert.match(copy, /title: \{ sv: 'En paus efter jobbet'/);
    assert.match(copy, /title: \{ sv: 'Behåll din vanliga läggdags'/);
  });

  it('does not change selector, service, notification or definition metadata', () => {
    const selector = source(SELECTOR);
    const selectorTypes = source(SELECTOR_TYPES);
    const service = source(SERVICE);
    const schedule = source(SCHEDULE);
    const notificationCopy = source(NOTIFICATION_COPY);
    const definitions = source(DEFINITIONS);

    assert.match(selector, /export function selectDailyFocus/);
    assert.doesNotMatch(selector, /getHours|dailyHour|timeOfDay|morning_light eligibility/);
    assert.doesNotMatch(selectorTypes, /hour|timeOfDay|wakeTime|dailyHour/);
    assert.doesNotMatch(service, /getHours|dailyHour|timeOfDay/);
    assert.match(schedule, /dailyFocusReminderCopy/);
    assert.match(schedule, /hour: prefs\.dailyHour/);
    assert.match(notificationCopy, /profile\.notifications\.daily\.title/);
    assert.match(notificationCopy, /profile\.notifications\.daily\.body/);
    assert.doesNotMatch(notificationCopy, /Få lite dagsljus|Lägg till protein|Sitt ner när du äter|Ät utan telefon/);

    assert.match(
      definitions,
      /\{ id: 'sleep_morning_daylight', focusArea: 'sleep', behaviorFamily: 'morning_light', intensity: 'micro', allowedModes: \['improve', 'maintain'\], eligibility: any \}/,
    );
    assert.match(
      definitions,
      /\{ id: 'nutrition_protein_at_breakfast', focusArea: 'nutrition', behaviorFamily: 'protein', intensity: 'normal', allowedModes: \['improve'\], eligibility: any \}/,
    );
    assert.match(
      definitions,
      /\{ id: 'nutrition_sit_down_lunch', focusArea: 'nutrition', behaviorFamily: 'meal_structure', intensity: 'normal', allowedModes: \['improve'\], eligibility: any \}/,
    );
    assert.match(
      definitions,
      /\{ id: 'recovery_phone_free_lunch', focusArea: 'recovery', behaviorFamily: 'phone_free_break', intensity: 'normal', allowedModes: \['improve', 'maintain'\], eligibility: any \}/,
    );
  });
});

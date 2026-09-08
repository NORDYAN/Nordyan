import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { WEEKLY_FOCUS_AREAS } from '../weekly-focus';
import { t } from '../../i18n/translate';

import { DAILY_FOCUS_ACTION_BANK } from './daily-focus-action-bank';
import {
  countByFocusArea,
  countByIntensity,
  familiesByArea,
  maintainCountByArea,
  validateDailyFocusActionBank,
} from './daily-focus-action-bank.validation';
import { DAILY_FOCUS_ACTION_COPY, DAILY_FOCUS_WHY_COPY } from './daily-focus-action-copy';
import { DAILY_FOCUS_WHY_KEYS } from './daily-focus.constants';
import {
  DAILY_FOCUS_INTENSITIES,
  DAILY_FOCUS_MODES,
  type DailyFocusActionDefinition,
} from './daily-focus.types';

describe('Daily Focus action bank', () => {
  it('has unique stable action IDs', () => {
    const ids = DAILY_FOCUS_ACTION_BANK.map((action) => action.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      assert.match(id, /^[a-z][a-z0-9_]*$/);
      assert.equal(/_v\d/.test(id), false);
      assert.equal(/\p{Script=Latin}/u.test(id), true);
    }
  });

  it('stays near the target bank size', () => {
    assert.equal(DAILY_FOCUS_ACTION_BANK.length, 93);
  });

  it('matches preferred area counts', () => {
    const counts = countByFocusArea(DAILY_FOCUS_ACTION_BANK);
    assert.equal(counts.everyday_movement, 18);
    assert.equal(counts.training, 14);
    assert.equal(counts.sleep, 16);
    assert.equal(counts.nutrition, 18);
    assert.equal(counts.alcohol, 11);
    assert.equal(counts.recovery, 16);
  });

  it('uses only supported focus areas, intensities and modes', () => {
    for (const action of DAILY_FOCUS_ACTION_BANK) {
      assert.equal((WEEKLY_FOCUS_AREAS as readonly string[]).includes(action.focusArea), true);
      assert.equal((DAILY_FOCUS_INTENSITIES as readonly string[]).includes(action.intensity), true);
      assert.ok(action.allowedModes.length >= 1);
      for (const mode of action.allowedModes) {
        assert.equal((DAILY_FOCUS_MODES as readonly string[]).includes(mode), true);
      }
      assert.ok(action.behaviorFamily.trim().length > 0);
      assert.notEqual(action.behaviorFamily, action.focusArea);
    }
  });

  it('keeps alcohol improve-only', () => {
    for (const action of DAILY_FOCUS_ACTION_BANK.filter((item) => item.focusArea === 'alcohol')) {
      assert.deepEqual([...action.allowedModes], ['improve']);
    }
  });

  it('has maintain coverage for the five non-alcohol areas', () => {
    const maintain = maintainCountByArea(DAILY_FOCUS_ACTION_BANK);
    assert.equal(maintain.alcohol, 0);
    assert.ok(maintain.everyday_movement >= 3);
    assert.ok(maintain.training >= 3);
    assert.ok(maintain.sleep >= 3);
    assert.ok(maintain.nutrition >= 3);
    assert.ok(maintain.recovery >= 3);
  });

  it('makes challenge actions identifiable by intensity', () => {
    const challenges = DAILY_FOCUS_ACTION_BANK.filter((action) => action.intensity === 'challenge');
    assert.ok(challenges.length >= 6);
    for (const action of challenges) {
      assert.equal(action.allowedModes.includes('maintain'), false);
    }
  });

  it('allows recovery intensity outside the recovery area', () => {
    const outside = DAILY_FOCUS_ACTION_BANK.filter(
      (action) => action.intensity === 'recovery' && action.focusArea !== 'recovery',
    );
    const areas = new Set(outside.map((action) => action.focusArea));
    assert.ok(outside.length >= 3);
    assert.equal(areas.has('everyday_movement'), true);
    assert.equal(areas.has('training'), true);
    assert.equal(areas.has('sleep'), true);
  });

  it('gates the fast-food action with relevance metadata', () => {
    const fastFood = DAILY_FOCUS_ACTION_BANK.filter((action) => action.behaviorFamily === 'fast_food');
    assert.equal(fastFood.length, 1);
    assert.equal(fastFood[0]?.id, 'nutrition_no_fast_food_today');
    assert.equal(fastFood[0]?.eligibility.requiresLessHealthyFoodRelevance, true);
  });

  it('does not require AI or runtime-generated copy', () => {
    for (const action of DAILY_FOCUS_ACTION_BANK) {
      assert.equal(action.titleKey, `dailyFocus.action.${action.id}.title`);
      assert.equal(action.bodyKey, `dailyFocus.action.${action.id}.body`);
      assert.ok(action.id in DAILY_FOCUS_ACTION_COPY);
    }
  });

  it('has no unsupported medical or age-exclusion metadata', () => {
    for (const action of DAILY_FOCUS_ACTION_BANK) {
      assert.equal('ageMin' in action, false);
      assert.equal('excludeIfAge65Plus' in action, false);
      assert.equal('bmiMin' in action.eligibility, false);
      assert.equal('medicalCondition' in action.eligibility, false);
    }
    const strength = DAILY_FOCUS_ACTION_BANK.filter((action) => action.behaviorFamily === 'strength');
    assert.ok(strength.length >= 2);
    for (const action of strength) {
      assert.equal('ageMin' in action, false);
    }
  });

  it('resolves curated SV and NB title and body for every action', () => {
    for (const action of DAILY_FOCUS_ACTION_BANK) {
      const svTitle = t(action.titleKey as Parameters<typeof t>[0], undefined, 'sv');
      const nbTitle = t(action.titleKey as Parameters<typeof t>[0], undefined, 'nb');
      const svBody = t(action.bodyKey as Parameters<typeof t>[0], undefined, 'sv');
      const nbBody = t(action.bodyKey as Parameters<typeof t>[0], undefined, 'nb');
      assert.notEqual(svTitle, action.titleKey);
      assert.notEqual(nbTitle, action.titleKey);
      assert.notEqual(svBody, action.bodyKey);
      assert.notEqual(nbBody, action.bodyKey);
      assert.ok(svTitle.length > 0 && nbTitle.length > 0);
      assert.ok(svBody.length > 0 && nbBody.length > 0);
      assert.equal(svTitle, DAILY_FOCUS_ACTION_COPY[action.id as keyof typeof DAILY_FOCUS_ACTION_COPY].title.sv);
      assert.equal(nbTitle, DAILY_FOCUS_ACTION_COPY[action.id as keyof typeof DAILY_FOCUS_ACTION_COPY].title.nb);
    }
  });

  it('has shared why copy for all area/mode pairs except alcohol maintain', () => {
    assert.equal(DAILY_FOCUS_WHY_KEYS.length, 11);
    assert.equal('dailyFocus.why.alcohol.maintain' in DAILY_FOCUS_WHY_COPY, false);
    for (const key of DAILY_FOCUS_WHY_KEYS) {
      assert.ok(DAILY_FOCUS_WHY_COPY[key].sv.length > 0);
      assert.ok(DAILY_FOCUS_WHY_COPY[key].nb.length > 0);
      assert.notEqual(t(key, undefined, 'sv'), key);
      assert.notEqual(t(key, undefined, 'nb'), key);
    }
  });

  it('keeps enough family diversity in high-volume areas', () => {
    const families = familiesByArea(DAILY_FOCUS_ACTION_BANK);
    assert.ok(Object.keys(families.everyday_movement).length >= 8);
    assert.ok(Object.keys(families.sleep).length >= 6);
    assert.ok(Object.keys(families.nutrition).length >= 6);
    assert.ok(Object.keys(families.recovery).length >= 6);
    assert.ok(Object.keys(families.training).length >= 7);
    assert.ok(Object.keys(families.alcohol).length >= 3);
  });

  it('rejects calorie-deficit, fasting, 8-hour sleep, extreme training and addiction copy', () => {
    const blob = Object.values(DAILY_FOCUS_ACTION_COPY)
      .flatMap((entry) => [entry.title.sv, entry.title.nb, entry.body.sv, entry.body.nb])
      .join('\n')
      .toLowerCase();
    assert.equal(/\b8\s*(timmar|timer)\b/.test(blob), false);
    assert.equal(blob.includes('kaloriunderskott'), false);
    assert.equal(blob.includes('periodisk fasta'), false);
    assert.equal(blob.includes('intermittent'), false);
    assert.equal(/\b(beroende|avhengighet|detox|avgiftning)\b/.test(blob), false);
    assert.equal(/\bhiit\b/.test(blob), false);
    assert.equal(blob.includes('1rm'), false);
    assert.equal(blob.includes('maxlyft'), false);
  });

  it('passes bank validation', () => {
    assert.deepEqual(validateDailyFocusActionBank(DAILY_FOCUS_ACTION_BANK), []);
  });

  it('does not treat near-walk clones as separate families', () => {
    const movementWalkFamilies = DAILY_FOCUS_ACTION_BANK.filter(
      (action) => action.focusArea === 'everyday_movement' && action.behaviorFamily === 'outdoor_movement',
    );
    assert.equal(movementWalkFamilies.length, 2);
    assert.deepEqual(
      movementWalkFamilies.map((action) => action.id).sort(),
      ['movement_easy_outdoor_loop', 'movement_outdoor_reset_walk'],
    );
  });

  it('exposes intensity totals for the bank report', () => {
    const intensities = countByIntensity(DAILY_FOCUS_ACTION_BANK);
    assert.ok(intensities.micro > 0);
    assert.ok(intensities.normal > 0);
    assert.ok(intensities.challenge > 0);
    assert.ok(intensities.recovery > 0);
  });

  it('applies Action Bank v1 polish classifications and copy', () => {
    const byId = Object.fromEntries(DAILY_FOCUS_ACTION_BANK.map((action) => [action.id, action]));

    assert.equal(byId.training_do_planned_session?.intensity, 'normal');
    assert.deepEqual([...(byId.training_do_planned_session?.allowedModes ?? [])], ['improve']);
    assert.equal(byId.training_do_planned_session?.behaviorFamily, 'session_follow_through');

    assert.equal(byId.training_ten_minute_start?.behaviorFamily, 'getting_started');
    assert.equal(byId.training_lay_out_kit?.behaviorFamily, 'training_preparation');
    assert.equal(byId.training_plan_next_session?.behaviorFamily, 'training_planning');
    assert.equal(byId.training_shorter_if_busy?.behaviorFamily, 'short_workout');

    const trainingFamilies = new Set(
      DAILY_FOCUS_ACTION_BANK.filter((action) => action.focusArea === 'training').map(
        (action) => action.behaviorFamily,
      ),
    );
    assert.ok(trainingFamilies.size >= 7);
    for (const family of [
      'short_workout',
      'getting_started',
      'strength',
      'mobility',
      'active_recovery',
      'training_planning',
      'training_preparation',
      'session_follow_through',
    ]) {
      assert.equal(trainingFamilies.has(family), true, family);
    }

    assert.equal(t('dailyFocus.action.recovery_leave_on_time.title', undefined, 'sv'), 'Avsluta dagen i tid');
    assert.equal(t('dailyFocus.action.recovery_leave_on_time.title', undefined, 'nb'), 'Avslutt dagen i tide');
    assert.equal(
      t('dailyFocus.action.recovery_leave_on_time.body', undefined, 'sv'),
      'Låt en sak vänta till i morgon och avsluta när du hade tänkt.',
    );
    assert.equal(
      t('dailyFocus.action.recovery_leave_on_time.body', undefined, 'nb'),
      'La én ting vente til i morgen, og avslutt da du hadde tenkt.',
    );
    assert.equal(byId.recovery_leave_on_time?.intensity, 'challenge');

    assert.equal(t('dailyFocus.action.recovery_one_less_commitment.title', undefined, 'sv'), 'Ta bort en sak från dagen');
    assert.equal(t('dailyFocus.action.recovery_one_less_commitment.title', undefined, 'nb'), 'Ta bort én ting fra dagen');
    assert.match(t('dailyFocus.action.recovery_one_less_commitment.body', undefined, 'sv'), /inte är nödvändigt/);
    assert.match(t('dailyFocus.action.recovery_one_less_commitment.body', undefined, 'nb'), /ikke er nødvendig/);
    assert.equal(byId.recovery_one_less_commitment?.intensity, 'challenge');

    assert.deepEqual([...(byId.nutrition_keep_usual_dinner?.allowedModes ?? [])], ['maintain']);
    assert.equal(t('dailyFocus.action.nutrition_keep_usual_dinner.title', undefined, 'sv'), 'Behåll ett bra matval idag');
    assert.equal(t('dailyFocus.action.nutrition_keep_usual_dinner.title', undefined, 'nb'), 'Behold et godt matvalg i dag');

    assert.deepEqual([...(byId.nutrition_eat_at_the_table?.allowedModes ?? [])].sort(), ['improve', 'maintain']);
  });

  it('keeps action definitions assignable without selector fields', () => {
    const sample: DailyFocusActionDefinition = DAILY_FOCUS_ACTION_BANK[0]!;
    assert.equal('cooldownDays' in sample, false);
    assert.equal('rank' in sample, false);
  });
});

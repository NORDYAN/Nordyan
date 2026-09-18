import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { t } from '../../i18n/translate';

import { DAILY_FOCUS_ACTION_BANK } from './daily-focus-action-bank';
import { DAILY_FOCUS_ACTION_COPY } from './daily-focus-action-copy';
import { DAILY_FOCUS_ACTION_DEFINITIONS } from './daily-focus-action-definitions';
import { DAILY_FOCUS_ANY_DAY } from './daily-focus.types';

const CLASS_1_IDS = [
  'sleep_morning_daylight',
  'nutrition_protein_at_breakfast',
  'nutrition_sit_down_lunch',
  'recovery_phone_free_lunch',
] as const;

const FROZEN_METADATA = {
  sleep_morning_daylight: {
    focusArea: 'sleep',
    behaviorFamily: 'morning_light',
    intensity: 'micro',
    allowedModes: ['improve', 'maintain'],
  },
  nutrition_protein_at_breakfast: {
    focusArea: 'nutrition',
    behaviorFamily: 'protein',
    intensity: 'normal',
    allowedModes: ['improve'],
  },
  nutrition_sit_down_lunch: {
    focusArea: 'nutrition',
    behaviorFamily: 'meal_structure',
    intensity: 'normal',
    allowedModes: ['improve'],
  },
  recovery_phone_free_lunch: {
    focusArea: 'recovery',
    behaviorFamily: 'phone_free_break',
    intensity: 'normal',
    allowedModes: ['improve', 'maintain'],
  },
} as const;

const EXPECTED_COPY = {
  sleep_morning_daylight: {
    title: { sv: 'Få lite dagsljus', nb: 'Få litt dagslys' },
    body: {
      sv: 'Gå ut eller stå vid ett fönster en stund och få lite dagsljus.',
      nb: 'Gå ut eller stå ved et vindu en stund og få litt dagslys.',
    },
  },
  nutrition_protein_at_breakfast: {
    title: { sv: 'Lägg till protein', nb: 'Legg til protein' },
    body: {
      sv: 'Lägg till en tydlig proteinkälla i nästa måltid.',
      nb: 'Legg til en tydelig proteinkilde i neste måltid.',
    },
  },
  nutrition_sit_down_lunch: {
    title: { sv: 'Sitt ner när du äter', nb: 'Sett deg ned når du spiser' },
    body: {
      sv: 'Sitt ner och ge nästa måltid en lugn stund utan att stressa.',
      nb: 'Sett deg ned og gi neste måltid en rolig stund uten å stresse.',
    },
  },
  recovery_phone_free_lunch: {
    title: { sv: 'Ät utan telefon', nb: 'Spis uten telefon' },
    body: {
      sv: 'Lägg undan telefonen under nästa måltid och ge dig själv en kort paus.',
      nb: 'Legg unna telefonen under neste måltid og gi deg selv en kort pause.',
    },
  },
} as const;

const TEMPORAL_ANCHOR =
  /\b(morgon(en)?|morgen(en)?|uppvaknand|våknet|våkne|frukost|frokost|lunch(en|paus)?|lunsj(en|pause)?)\b/i;

function catalogEntry(actionId: (typeof CLASS_1_IDS)[number]) {
  const definition = DAILY_FOCUS_ACTION_DEFINITIONS.find((action) => action.id === actionId);
  const bank = DAILY_FOCUS_ACTION_BANK.find((action) => action.id === actionId);
  const copy = DAILY_FOCUS_ACTION_COPY[actionId];
  assert.ok(definition, actionId);
  assert.ok(bank, actionId);
  assert.ok(copy, actionId);
  return { definition, bank, copy };
}

describe('Daily Focus Class 1 temporal copy polish', () => {
  it('keeps the four action IDs in definitions and the action bank', () => {
    const definitionIds = DAILY_FOCUS_ACTION_DEFINITIONS.map((action) => action.id);
    const bankIds = DAILY_FOCUS_ACTION_BANK.map((action) => action.id);

    for (const actionId of CLASS_1_IDS) {
      assert.equal(definitionIds.filter((id) => id === actionId).length, 1);
      assert.equal(bankIds.filter((id) => id === actionId).length, 1);
      assert.equal(actionId in DAILY_FOCUS_ACTION_COPY, true);
    }
  });

  it('does not rename IDs or change catalog metadata', () => {
    for (const actionId of CLASS_1_IDS) {
      const { definition, bank } = catalogEntry(actionId);
      const frozen = FROZEN_METADATA[actionId];

      assert.equal(definition.id, actionId);
      assert.equal(bank.id, actionId);
      assert.equal(definition.focusArea, frozen.focusArea);
      assert.equal(bank.focusArea, frozen.focusArea);
      assert.equal(definition.behaviorFamily, frozen.behaviorFamily);
      assert.equal(bank.behaviorFamily, frozen.behaviorFamily);
      assert.equal(definition.intensity, frozen.intensity);
      assert.equal(bank.intensity, frozen.intensity);
      assert.deepEqual([...definition.allowedModes], [...frozen.allowedModes]);
      assert.deepEqual([...bank.allowedModes], [...frozen.allowedModes]);
      assert.deepEqual(definition.eligibility, DAILY_FOCUS_ANY_DAY);
      assert.deepEqual(bank.eligibility, DAILY_FOCUS_ANY_DAY);
      assert.equal(bank.titleKey, `dailyFocus.action.${actionId}.title`);
      assert.equal(bank.bodyKey, `dailyFocus.action.${actionId}.body`);
    }
  });

  it('uses time-neutral SV and NB copy without wake, morning, breakfast or lunch anchors', () => {
    for (const actionId of CLASS_1_IDS) {
      const { copy } = catalogEntry(actionId);
      const expected = EXPECTED_COPY[actionId];
      assert.deepEqual(copy, expected);

      const blob = [copy.title.sv, copy.title.nb, copy.body.sv, copy.body.nb].join('\n');
      assert.equal(TEMPORAL_ANCHOR.test(blob), false, blob);

      assert.equal(t(`dailyFocus.action.${actionId}.title`, undefined, 'sv'), expected.title.sv);
      assert.equal(t(`dailyFocus.action.${actionId}.title`, undefined, 'nb'), expected.title.nb);
      assert.equal(t(`dailyFocus.action.${actionId}.body`, undefined, 'sv'), expected.body.sv);
      assert.equal(t(`dailyFocus.action.${actionId}.body`, undefined, 'nb'), expected.body.nb);
    }
  });
});

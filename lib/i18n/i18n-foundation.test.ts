import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { INITIAL_LIFESTYLE_SCALE_POLARITY } from '../domain/initial-lifestyle';
import {
  getProfileActivityLevelOptions,
  getProfileGenderOptions,
} from '../domain/profile/profile-field-options';
import { WEEKLY_CHECK_IN_SCALE_POLARITY } from '../domain/weekly-check-in';
import {
  findInitialLifestyleOptionValue,
  getInitialLifestyleQuestions,
} from '../presentation/initial-lifestyle';
import { buildProfileHomeView } from '../presentation/profile-home';
import {
  findWeeklyCheckInOptionValue,
  getWeeklyCheckInQuestions,
} from '../presentation/weekly-check-in';

import { lookupTranslation, setActiveLocale, t } from './translate';
import { nb } from './resources/nb';
import { sv, type TranslationKey } from './resources/sv';

afterEach(() => {
  setActiveLocale('sv');
});

describe('i18n domain-value isolation', () => {
  it('keeps all seven Initial Lifestyle mappings identical under sv and nb', () => {
    const expected = {
      sleepQuality: [
        ['lifestyle.sleep.veryGood', 5],
        ['lifestyle.sleep.good', 4],
        ['lifestyle.sleep.ok', 3],
        ['lifestyle.sleep.poor', 2],
        ['lifestyle.sleep.veryPoor', 1],
      ],
      energy: [
        ['lifestyle.energy.veryHigh', 5],
        ['lifestyle.energy.high', 4],
        ['lifestyle.energy.normal', 3],
        ['lifestyle.energy.low', 2],
        ['lifestyle.energy.veryLow', 1],
      ],
      stress: [
        ['lifestyle.stress.notAtAll', 1],
        ['lifestyle.stress.aLittle', 2],
        ['lifestyle.stress.moderate', 3],
        ['lifestyle.stress.quiteALot', 4],
        ['lifestyle.stress.aLot', 5],
      ],
      lessHealthyFoodFrequency: [
        ['lifestyle.food.never', 'never'],
        ['lifestyle.food.once', 'once'],
        ['lifestyle.food.twoThree', 'two_three'],
        ['lifestyle.food.fourSix', 'four_six'],
        ['lifestyle.food.daily', 'daily'],
      ],
      everydayActivity: [
        ['lifestyle.activity.veryActive', 5],
        ['lifestyle.activity.quiteActive', 4],
        ['lifestyle.activity.moderate', 3],
        ['lifestyle.activity.aLittle', 2],
        ['lifestyle.activity.almostNone', 1],
      ],
      eatingQuality: [
        ['lifestyle.eating.veryGood', 5],
        ['lifestyle.eating.good', 4],
        ['lifestyle.eating.ok', 3],
        ['lifestyle.eating.lessGood', 2],
        ['lifestyle.eating.notGood', 1],
      ],
      alcoholConsumption: [
        ['lifestyle.alcohol.none', 'none'],
        ['lifestyle.alcohol.1_3', '1_3'],
        ['lifestyle.alcohol.4_7', '4_7'],
        ['lifestyle.alcohol.8_14', '8_14'],
        ['lifestyle.alcohol.15plus', '15_plus'],
      ],
    } as const;

    for (const locale of ['sv', 'nb'] as const) {
      setActiveLocale(locale);
      for (const [field, options] of Object.entries(expected)) {
        for (const [key, value] of options) {
          const label = t(key as TranslationKey, undefined, locale);
          assert.equal(findInitialLifestyleOptionValue(field as never, label), value);
        }
      }
    }

    setActiveLocale('sv');
    const svValues = getInitialLifestyleQuestions().flatMap((question) =>
      question.options.map((option) => option.value),
    );
    setActiveLocale('nb');
    const nbValues = getInitialLifestyleQuestions().flatMap((question) =>
      question.options.map((option) => option.value),
    );
    assert.deepEqual(nbValues, svValues);
  });

  it('keeps Weekly Check-in mappings identical under sv and nb', () => {
    for (const locale of ['sv', 'nb'] as const) {
      setActiveLocale(locale);
      assert.equal(
        findWeeklyCheckInOptionValue(
          'trainingFrequency',
          t('weeklyCheckIn.training.none', undefined, locale),
        ),
        'none',
      );
      assert.equal(
        findWeeklyCheckInOptionValue(
          'trainingFrequency',
          t('weeklyCheckIn.training.fourPlus', undefined, locale),
        ),
        'four_plus',
      );
      assert.equal(
        findWeeklyCheckInOptionValue(
          'alcoholConsumption',
          t('lifestyle.alcohol.1_3', undefined, locale),
        ),
        '1_3',
      );
      assert.equal(
        findWeeklyCheckInOptionValue(
          'planAdherence',
          t('weeklyCheckIn.plan.notAtAll', undefined, locale),
        ),
        1,
      );
      assert.equal(
        findWeeklyCheckInOptionValue('stress', t('lifestyle.stress.aLot', undefined, locale)),
        5,
      );
    }

    setActiveLocale('sv');
    const svValues = getWeeklyCheckInQuestions().flatMap((question) =>
      question.options.map((option) => option.value),
    );
    setActiveLocale('nb');
    const nbValues = getWeeklyCheckInQuestions().flatMap((question) =>
      question.options.map((option) => option.value),
    );
    assert.deepEqual(nbValues, svValues);
  });

  it('does not change stress polarity, alcohol buckets, or activity enums', () => {
    assert.equal(INITIAL_LIFESTYLE_SCALE_POLARITY.stress, 'higher_worse');
    assert.equal(WEEKLY_CHECK_IN_SCALE_POLARITY.stress, 'higher_worse');

    for (const locale of ['sv', 'nb'] as const) {
      setActiveLocale(locale);
      assert.deepEqual(
        getProfileActivityLevelOptions().map((option) => option.value),
        ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
      );
      assert.deepEqual(
        getProfileGenderOptions().map((option) => option.value),
        ['male', 'female'],
      );
      assert.equal(
        getProfileGenderOptions().some((option) => option.value === 'other'),
        false,
      );
    }
  });

  it('localizes Coach question-card heading in sv and nb', () => {
    assert.equal(t('coach.ask.quickQuestions', undefined, 'sv'), 'Frågor för dig');
    assert.equal(t('coach.ask.quickQuestions', undefined, 'nb'), 'Spørsmål for deg');
    assert.notEqual(sv['coach.ask.quickQuestions'], 'Snabbfrågor');
    assert.notEqual(nb['coach.ask.quickQuestions'], 'Hurtigspørsmål');
  });

  it('localizes NORDYAN Premium information copy in sv and nb', () => {
    assert.equal(t('profile.subscription.title', undefined, 'sv'), 'NORDYAN Premium');
    assert.equal(t('profile.subscription.title', undefined, 'nb'), 'NORDYAN Premium');
    assert.equal(
      t('profile.subscription.subtitle', undefined, 'sv'),
      'Få ännu mer ut av din hälsodata med fördjupad analys och fler smarta verktyg.',
    );
    assert.equal(
      t('profile.subscription.subtitle', undefined, 'nb'),
      'Få enda mer ut av helsedataene dine med dypere analyse og flere smarte verktøy.',
    );
    assert.equal(t('profile.subscription.insights.title', undefined, 'sv'), 'Fördjupade insikter');
    assert.equal(t('profile.subscription.insights.title', undefined, 'nb'), 'Dypere innsikt');
    assert.equal(t('profile.subscription.footer', undefined, 'sv'), 'NORDYAN Premium kommer snart.');
    assert.equal(t('profile.subscription.footer', undefined, 'nb'), 'NORDYAN Premium kommer snart.');
    assert.equal(t('profile.feedback.mailSubject', undefined, 'sv'), 'Feedback – NORDYAN');
    assert.equal(t('profile.feedback.mailSubject', undefined, 'nb'), 'Tilbakemelding – NORDYAN');
    assert.equal(t('profile.help.mailSubject', undefined, 'sv'), 'Hjälp & support – NORDYAN');
    assert.equal(t('profile.help.mailSubject', undefined, 'nb'), 'Hjelp og support – NORDYAN');
    assert.equal(t('profile.notifications', undefined, 'sv'), 'Aviseringar');
    assert.equal(t('profile.notifications', undefined, 'nb'), 'Varsler');
    assert.equal(t('profile.notifications.daily.title', undefined, 'sv'), 'Dagens fokus väntar');
    assert.equal(t('profile.notifications.daily.title', undefined, 'nb'), 'Dagens fokus venter');
    assert.equal(t('profile.notifications.weekly.title', undefined, 'sv'), 'Veckokollen väntar');
    assert.equal(t('profile.notifications.weekly.title', undefined, 'nb'), 'Ukessjekken venter');
    assert.equal(
      t('profile.help.mailBody', undefined, 'sv'),
      'Hej NORDYAN,\n\nJag behöver hjälp med:',
    );
    assert.equal(
      t('profile.help.mailBody', undefined, 'nb'),
      'Hei NORDYAN,\n\nJeg trenger hjelp med:',
    );
    assert.equal(t('health.sources.suggest.action', undefined, 'sv'), 'Föreslå en integration');
    assert.equal(t('health.sources.suggest.action', undefined, 'nb'), 'Foreslå en integrasjon');
  });

  it('localizes Coach Home focus-bridge copy in sv and nb', () => {
    assert.equal(t('coach.bridge.title', undefined, 'sv'), 'Jag har satt ditt fokus');
    assert.equal(
      t('coach.bridge.body', undefined, 'sv'),
      'Jag har valt veckans fokus och dagens uppgift utifrån dina senaste uppgifter.',
    );
    assert.equal(t('coach.bridge.cta', undefined, 'sv'), 'Se dagens fokus');
    assert.equal(t('coach.bridge.title', undefined, 'nb'), 'Jeg har satt fokuset ditt');
    assert.equal(
      t('coach.bridge.body', undefined, 'nb'),
      'Jeg har valgt ukens fokus og dagens oppgave ut fra de siste opplysningene dine.',
    );
    assert.equal(t('coach.bridge.cta', undefined, 'nb'), 'Se dagens fokus');
  });

  it('localizes user-visible profile validation copy in sv and nb', () => {
    assert.equal(t('profile.gender.male', undefined, 'sv'), 'Man');
    assert.equal(t('profile.gender.female', undefined, 'sv'), 'Kvinna');
    assert.equal(t('profile.gender.male', undefined, 'nb'), 'Mann');
    assert.equal(t('profile.gender.female', undefined, 'nb'), 'Kvinne');
    assert.equal(t('onboarding.profile.gender', undefined, 'sv'), 'Kön');
    assert.equal(t('onboarding.profile.gender', undefined, 'nb'), 'Kjønn');
    assert.equal(
      t('onboarding.profile.genderHelper', undefined, 'sv'),
      'Kön används för könsspecifika hälsoberäkningar, till exempel kroppsfett. Välj man eller kvinna.',
    );
    assert.equal(
      t('onboarding.profile.genderHelper', undefined, 'nb'),
      'Kjønn brukes til kjønnsspesifikke helseberegninger, for eksempel kroppsfett. Velg mann eller kvinne.',
    );
    assert.equal(t('profile.validation.gender', undefined, 'sv'), 'Välj kön.');
    assert.equal(t('profile.validation.gender', undefined, 'nb'), 'Velg kjønn.');
    assert.equal(t('profile.validation.dateOfBirth', undefined, 'nb'), 'Oppgi fødselsdato.');
    assert.equal(
      t('profile.validation.mustBe18', undefined, 'sv'),
      'NORDYAN är för personer som är 18 år eller äldre.',
    );
    assert.equal(
      t('profile.validation.mustBe18', undefined, 'nb'),
      'NORDYAN er for personer som er 18 år eller eldre.',
    );
    assert.notEqual(t('profile.validation.height', undefined, 'nb'), 'profile.validation.height');
  });
});

describe('i18n runtime language selection', () => {
  it('updates Profile copy without restart when locale switches', () => {
    setActiveLocale('sv');
    assert.equal(buildProfileHomeView().signOut.title, 'Logga ut');
    const languageSv = buildProfileHomeView()
      .sections.flatMap((section) => section.rows)
      .find((row) => row.id === 'language');
    assert.equal(languageSv?.title, 'Språk');
    const privacySv = buildProfileHomeView()
      .sections.flatMap((section) => section.rows)
      .find((row) => row.id === 'privacy-and-data');
    assert.equal(privacySv?.title, 'Integritet och data');
    assert.equal(privacySv?.status, 'active');

    setActiveLocale('nb');
    assert.equal(buildProfileHomeView().signOut.title, 'Logg ut');
    const languageNb = buildProfileHomeView()
      .sections.flatMap((section) => section.rows)
      .find((row) => row.id === 'language');
    assert.equal(languageNb?.title, 'Språk');
    const privacyNb = buildProfileHomeView()
      .sections.flatMap((section) => section.rows)
      .find((row) => row.id === 'privacy-and-data');
    assert.equal(privacyNb?.title, 'Personvern og data');
    assert.equal(t('profile.language.nb'), 'Norsk bokmål');
  });

  it('never shows translation keys for migrated copy', () => {
    const keys = Object.keys(sv) as TranslationKey[];
    for (const key of keys) {
      assert.notEqual(t(key, undefined, 'sv'), key);
      assert.notEqual(lookupTranslation('nb', key), key);
      assert.ok(nb[key].length > 0);
    }
  });
});

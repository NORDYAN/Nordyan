import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { setActiveLocale, t } from '@/lib/i18n';

import {
  AGE_CONFIRMATION_COPY,
  canSubmitAgeConfirmation,
  isAgeGatedOnboardingPath,
  resolveAgeGatedOnboardingAccess,
} from './age-confirmation.presentation';

describe('age confirmation presentation', () => {
  it('keeps the checkbox unchecked by default and disables continue until checked', () => {
    assert.equal(canSubmitAgeConfirmation(false), false);
    assert.equal(canSubmitAgeConfirmation(true), true);
  });

  it('renders the approved Swedish copy', () => {
    setActiveLocale('sv');
    assert.equal(AGE_CONFIRMATION_COPY.title, 'Åldersgräns');
    assert.equal(
      AGE_CONFIRMATION_COPY.body,
      'NORDYAN är avsett för personer som är 18 år eller äldre.',
    );
    assert.equal(AGE_CONFIRMATION_COPY.checkbox, 'Jag bekräftar att jag är 18 år eller äldre');
    assert.equal(AGE_CONFIRMATION_COPY.continue, 'Fortsätt');
    assert.equal(t('onboarding.ageConfirmation.title'), AGE_CONFIRMATION_COPY.title);
  });

  it('renders the approved Norwegian Bokmål copy', () => {
    setActiveLocale('nb');
    assert.equal(t('onboarding.ageConfirmation.title'), 'Aldersgrense');
    assert.equal(
      t('onboarding.ageConfirmation.body'),
      'NORDYAN er beregnet for personer som er 18 år eller eldre.',
    );
    assert.equal(t('onboarding.ageConfirmation.checkbox'), 'Jeg bekrefter at jeg er 18 år eller eldre');
    assert.equal(t('common.continue'), 'Fortsett');
    setActiveLocale('sv');
  });

  it('gates later onboarding routes and leaves consent, confirmation, and intro screens open', () => {
    assert.equal(isAgeGatedOnboardingPath('/health-data-consent'), false);
    assert.equal(isAgeGatedOnboardingPath('/step-3'), true);
    assert.equal(isAgeGatedOnboardingPath('/step-4'), true);
    assert.equal(isAgeGatedOnboardingPath('/notification-setup'), true);
    assert.equal(isAgeGatedOnboardingPath('/measurement-choice'), true);
    assert.equal(isAgeGatedOnboardingPath('/body-measurements'), true);
    assert.equal(isAgeGatedOnboardingPath('/step-5'), true);
    assert.equal(isAgeGatedOnboardingPath('/age-confirmation'), false);
    assert.equal(isAgeGatedOnboardingPath('/step-2'), false);
    assert.equal(resolveAgeGatedOnboardingAccess(false), 'block');
    assert.equal(resolveAgeGatedOnboardingAccess(true), 'allow');
  });
});

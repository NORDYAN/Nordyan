import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HEALTH_DATA_CONSENT_POLICY_VERSION,
  HEALTH_DATA_CONSENT_TYPE,
} from '@/lib/domain/health-data-consent';
import { setActiveLocale, t } from '@/lib/i18n';

import {
  HEALTH_DATA_CONSENT_COPY,
  PRIVACY_POLICY_URL,
  canSubmitHealthDataConsent,
  canSubmitOnboardingHealthDataConsent,
  isHealthOnboardingCollectionPath,
  legalAgeAcceptanceLabel,
  resolveHealthOnboardingCollectionAccess,
} from './health-data-consent.presentation';

describe('health data consent presentation', () => {
  it('keeps the checkbox unchecked by default and disables continue until checked', () => {
    const checkedByDefault = false;
    assert.equal(canSubmitHealthDataConsent(checkedByDefault), false);
    assert.equal(canSubmitHealthDataConsent(true), true);
    assert.equal(canSubmitOnboardingHealthDataConsent(false), false);
    assert.equal(canSubmitOnboardingHealthDataConsent(true), true);
    assert.equal(
      legalAgeAcceptanceLabel(),
      'Jag godkänner användarvillkoren och integritetspolicyn, samtycker till behandling av mina hälsodata och bekräftar att jag är 18 år eller äldre.',
    );
  });

  it('uses the public privacy policy URL', () => {
    assert.equal(PRIVACY_POLICY_URL, 'https://nordyan.app/privacy');
  });

  it('renders the approved Swedish copy', () => {
    setActiveLocale('sv');
    assert.equal(HEALTH_DATA_CONSENT_COPY.title, 'Hälsouppgifter');
    assert.equal(
      HEALTH_DATA_CONSENT_COPY.body,
      'För att NORDYAN ska kunna ge dig personliga insikter behöver vi behandla de hälso- och livsstilsuppgifter du väljer att dela.',
    );
    assert.equal(
      HEALTH_DATA_CONSENT_COPY.bodySecondary,
      'Uppgifterna används för att visa din utveckling, skapa relevanta analyser och ge dig personligt anpassade insikter i NORDYAN Coach.',
    );
    assert.equal(
      HEALTH_DATA_CONSENT_COPY.checkbox,
      'Jag samtycker till att NORDYAN behandlar de hälso- och livsstilsuppgifter jag väljer att dela enligt integritetspolicyn.',
    );
    assert.equal(HEALTH_DATA_CONSENT_COPY.policyLink, 'Läs integritetspolicyn');
    assert.equal(
      HEALTH_DATA_CONSENT_COPY.legalAgePrefix +
        HEALTH_DATA_CONSENT_COPY.legalAgeTerms +
        HEALTH_DATA_CONSENT_COPY.legalAgeMiddle +
        HEALTH_DATA_CONSENT_COPY.legalAgePrivacy +
        HEALTH_DATA_CONSENT_COPY.legalAgeSuffix,
      'Jag godkänner användarvillkoren och integritetspolicyn, samtycker till behandling av mina hälsodata och bekräftar att jag är 18 år eller äldre.',
    );
    assert.equal(
      HEALTH_DATA_CONSENT_COPY.saveError,
      'Det gick inte att spara ditt samtycke. Försök igen.',
    );
    assert.equal(HEALTH_DATA_CONSENT_COPY.continue, 'Fortsätt');
    assert.equal(t('onboarding.healthDataConsent.title'), HEALTH_DATA_CONSENT_COPY.title);
  });

  it('renders the approved Norwegian Bokmål copy', () => {
    setActiveLocale('nb');
    assert.equal(t('onboarding.healthDataConsent.title'), 'Helseopplysninger');
    assert.equal(
      t('onboarding.healthDataConsent.body'),
      'For at NORDYAN skal kunne gi deg personlige innsikter, må vi behandle helse- og livsstilsopplysningene du velger å dele.',
    );
    assert.equal(
      t('onboarding.healthDataConsent.bodySecondary'),
      'Opplysningene brukes til å vise utviklingen din, lage relevante analyser og gi deg personlig tilpassede innsikter i NORDYAN Coach.',
    );
    assert.equal(
      t('onboarding.healthDataConsent.checkbox'),
      'Jeg samtykker til at NORDYAN behandler helse- og livsstilsopplysningene jeg velger å dele i samsvar med personvernerklæringen.',
    );
    assert.equal(t('onboarding.healthDataConsent.policyLink'), 'Les personvernerklæringen');
    assert.equal(
      t('onboarding.healthDataConsent.legalAge.prefix') +
        t('onboarding.healthDataConsent.legalAge.terms') +
        t('onboarding.healthDataConsent.legalAge.middle') +
        t('onboarding.healthDataConsent.legalAge.privacy') +
        t('onboarding.healthDataConsent.legalAge.suffix'),
      'Jeg godtar brukervilkårene og personvernerklæringen, samtykker til behandling av helseopplysningene mine og bekrefter at jeg er 18 år eller eldre.',
    );
    assert.equal(
      t('onboarding.healthDataConsent.saveError'),
      'Kunne ikke lagre samtykket ditt. Prøv igjen.',
    );
    assert.equal(t('common.continue'), 'Fortsett');
    setActiveLocale('sv');
  });

  it('blocks health onboarding collection paths without a current-version grant', () => {
    assert.equal(isHealthOnboardingCollectionPath('/step-3'), true);
    assert.equal(isHealthOnboardingCollectionPath('/step-4'), true);
    assert.equal(isHealthOnboardingCollectionPath('/notification-setup'), true);
    assert.equal(isHealthOnboardingCollectionPath('/measurement-choice'), true);
    assert.equal(isHealthOnboardingCollectionPath('/body-measurements'), true);
    assert.equal(isHealthOnboardingCollectionPath('/health-data-consent'), false);
    assert.equal(isHealthOnboardingCollectionPath('/step-2'), false);

    assert.equal(
      resolveHealthOnboardingCollectionAccess({
        pendingGrant: null,
        serverHasActiveCurrent: false,
      }),
      'block',
    );
    assert.equal(
      resolveHealthOnboardingCollectionAccess({
        pendingGrant: {
          consentType: HEALTH_DATA_CONSENT_TYPE,
          policyVersion: 'privacy-v0',
          grantedAt: '2024-01-01T00:00:00.000Z',
        },
        serverHasActiveCurrent: false,
      }),
      'block',
    );
    assert.equal(
      resolveHealthOnboardingCollectionAccess({
        pendingGrant: {
          consentType: HEALTH_DATA_CONSENT_TYPE,
          policyVersion: HEALTH_DATA_CONSENT_POLICY_VERSION,
          grantedAt: '2026-08-22T12:00:00.000Z',
        },
        serverHasActiveCurrent: false,
      }),
      'allow',
    );
    assert.equal(
      resolveHealthOnboardingCollectionAccess({
        pendingGrant: null,
        serverHasActiveCurrent: true,
      }),
      'allow',
    );
  });
});

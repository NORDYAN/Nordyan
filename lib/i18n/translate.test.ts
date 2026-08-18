import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { sv, type TranslationKey } from './resources/sv';
import { nb } from './resources/nb';
import { lookupTranslation, setActiveLocale, t } from './translate';

describe('translation lookup', () => {
  it('defaults to Swedish copy', () => {
    setActiveLocale('sv');
    assert.equal(t('tabs.home'), 'Hem');
    assert.equal(t('auth.signIn.title'), 'Logga in');
  });

  it('switches UI copy without restart', () => {
    setActiveLocale('nb');
    assert.equal(t('tabs.home'), 'Hjem');
    assert.equal(t('auth.signIn.title'), 'Logg inn');
    setActiveLocale('sv');
    assert.equal(t('tabs.home'), 'Hem');
  });

  it('localizes unavailable onboarding body fat in Swedish and Bokmål', () => {
    assert.equal(t('onboarding.bodyFatUnavailable', undefined, 'sv'), 'Ingen uppskattning ännu');
    assert.equal(t('onboarding.bodyFatUnavailable', undefined, 'nb'), 'Ingen beregning ennå');
    assert.equal(t('home.bodyFatUnavailable', undefined, 'sv'), 'Ingen uppskattning ännu');
    assert.equal(t('home.bodyFatUnavailable', undefined, 'nb'), 'Ingen beregning ennå');
  });

  it('falls back to Swedish when a Bokmål string is missing', () => {
    assert.equal(lookupTranslation('nb', 'tabs.home'), 'Hjem');
    const missing = lookupTranslation('nb', 'tabs.home');
    assert.notEqual(missing, 'tabs.home');
    assert.equal(lookupTranslation('sv', 'tabs.home'), sv['tabs.home']);
  });

  it('never exposes translation keys for migrated Swedish source copy', () => {
    const keys = Object.keys(sv) as TranslationKey[];
    for (const key of keys) {
      const value = t(key, undefined, 'sv');
      assert.notEqual(value, key);
      assert.equal(value, sv[key]);
    }
  });

  it('covers every Swedish key in Bokmål', () => {
    const keys = Object.keys(sv) as TranslationKey[];
    for (const key of keys) {
      assert.equal(typeof nb[key], 'string');
      assert.ok(nb[key].length > 0);
    }
  });
});

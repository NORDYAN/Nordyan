import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_APP_LOCALE } from './locales';
import {
  resolveAppLocaleFromLanguageTags,
  resolvePersistedAppLocale,
} from './resolve-locale';

describe('resolveAppLocaleFromLanguageTags', () => {
  it('selects Swedish for device Swedish', () => {
    assert.equal(resolveAppLocaleFromLanguageTags(['sv-SE']), 'sv');
    assert.equal(resolveAppLocaleFromLanguageTags(['sv']), 'sv');
  });

  it('selects Bokmål for Norwegian device locales', () => {
    assert.equal(resolveAppLocaleFromLanguageTags(['nb-NO']), 'nb');
    assert.equal(resolveAppLocaleFromLanguageTags(['nb']), 'nb');
    assert.equal(resolveAppLocaleFromLanguageTags(['no-NO']), 'nb');
    assert.equal(resolveAppLocaleFromLanguageTags(['no']), 'nb');
    assert.equal(resolveAppLocaleFromLanguageTags(['nn-NO']), 'nb');
  });

  it('falls back to Swedish for unsupported locales', () => {
    assert.equal(resolveAppLocaleFromLanguageTags(['en-US']), DEFAULT_APP_LOCALE);
    assert.equal(resolveAppLocaleFromLanguageTags(['da-DK']), 'sv');
    assert.equal(resolveAppLocaleFromLanguageTags(['fi-FI']), 'sv');
    assert.equal(resolveAppLocaleFromLanguageTags([]), 'sv');
    assert.equal(resolveAppLocaleFromLanguageTags(['de-DE', 'fr-FR']), 'sv');
  });

  it('uses the first supported tag in the device list', () => {
    assert.equal(resolveAppLocaleFromLanguageTags(['en-US', 'nb-NO']), 'nb');
    assert.equal(resolveAppLocaleFromLanguageTags(['sv-SE', 'nb-NO']), 'sv');
  });
});

describe('resolvePersistedAppLocale', () => {
  it('accepts only active MVP locales', () => {
    assert.equal(resolvePersistedAppLocale('sv'), 'sv');
    assert.equal(resolvePersistedAppLocale('nb'), 'nb');
    assert.equal(resolvePersistedAppLocale('no'), null);
    assert.equal(resolvePersistedAppLocale('en'), null);
    assert.equal(resolvePersistedAppLocale('da'), null);
    assert.equal(resolvePersistedAppLocale(null), null);
  });
});

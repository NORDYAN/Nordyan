import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  LANGUAGE_STORAGE_DEVICE_KEY,
  LANGUAGE_STORAGE_MANUAL_KEY,
  languageStorageUserKey,
} from './locales';
import {
  createMemoryLanguagePreferenceStore,
  readLanguagePreference,
  writeLanguagePreference,
} from './language-preference';
import { resolveAppLocaleFromLanguageTags } from './resolve-locale';

describe('language preference persistence', () => {
  it('persists an unauthenticated manual selection across restarts', async () => {
    const store = createMemoryLanguagePreferenceStore();
    assert.equal(await readLanguagePreference(store), null);

    await writeLanguagePreference(store, 'nb');
    assert.equal(await readLanguagePreference(store), 'nb');
    assert.equal(await store.getItem(LANGUAGE_STORAGE_MANUAL_KEY), 'nb');
    assert.equal(await store.getItem(LANGUAGE_STORAGE_DEVICE_KEY), null);
  });

  it('keeps authenticated users independent on the same device', async () => {
    const store = createMemoryLanguagePreferenceStore();
    await writeLanguagePreference(store, 'nb', 'user-a');
    await writeLanguagePreference(store, 'sv', 'user-b');

    assert.equal(await readLanguagePreference(store, 'user-a'), 'nb');
    assert.equal(await readLanguagePreference(store, 'user-b'), 'sv');
  });

  it('does not let User B inherit User A preference on a Swedish device', async () => {
    const store = createMemoryLanguagePreferenceStore();
    await writeLanguagePreference(store, 'nb', 'user-a');

    assert.equal(await readLanguagePreference(store, 'user-a'), 'nb');
    const userBPreference = await readLanguagePreference(store, 'user-b');
    assert.equal(userBPreference, null);
    assert.equal(userBPreference ?? resolveAppLocaleFromLanguageTags(['sv-SE']), 'sv');
    assert.equal(await store.getItem(LANGUAGE_STORAGE_DEVICE_KEY), null);
  });

  it('uses a Norwegian device default for a new user without a preference', async () => {
    const store = createMemoryLanguagePreferenceStore();
    const userPreference = await readLanguagePreference(store, 'user-new');

    assert.equal(userPreference, null);
    assert.equal(userPreference ?? resolveAppLocaleFromLanguageTags(['nb-NO']), 'nb');
  });

  it('does not apply a legacy device key to a signed-in user without a preference', async () => {
    const store = createMemoryLanguagePreferenceStore();
    await store.setItem(LANGUAGE_STORAGE_DEVICE_KEY, 'nb');

    assert.equal(await readLanguagePreference(store, 'user-new'), null);
  });

  it('migrates a legacy device key onto the unsigned manual key without wiping it', async () => {
    const store = createMemoryLanguagePreferenceStore();
    await store.setItem(LANGUAGE_STORAGE_DEVICE_KEY, 'nb');

    assert.equal(await readLanguagePreference(store), 'nb');
    assert.equal(await store.getItem(LANGUAGE_STORAGE_MANUAL_KEY), 'nb');
    assert.equal(await store.getItem(LANGUAGE_STORAGE_DEVICE_KEY), 'nb');
  });

  it('preserves an existing authenticated user preference after storage correction', async () => {
    const store = createMemoryLanguagePreferenceStore();
    await store.setItem(LANGUAGE_STORAGE_DEVICE_KEY, 'sv');
    await store.setItem(languageStorageUserKey('user-a'), 'nb');

    assert.equal(await readLanguagePreference(store, 'user-a'), 'nb');
    assert.equal(await readLanguagePreference(store, 'user-b'), null);
    assert.equal(await store.getItem(languageStorageUserKey('user-a')), 'nb');
  });

  it('persists an authenticated preference across restart', async () => {
    const store = createMemoryLanguagePreferenceStore();
    await writeLanguagePreference(store, 'nb', 'user-a');

    const restarted = createMemoryLanguagePreferenceStore();
    await restarted.setItem(
      languageStorageUserKey('user-a'),
      (await store.getItem(languageStorageUserKey('user-a'))) ?? '',
    );

    assert.equal(await readLanguagePreference(restarted, 'user-a'), 'nb');
  });
});

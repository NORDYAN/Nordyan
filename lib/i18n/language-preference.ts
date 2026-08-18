import {
  LANGUAGE_STORAGE_DEVICE_KEY,
  LANGUAGE_STORAGE_MANUAL_KEY,
  languageStorageUserKey,
  type AppLocale,
} from './locales';
import { resolvePersistedAppLocale } from './resolve-locale';

export type LanguagePreferenceStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export function createMemoryLanguagePreferenceStore(): LanguagePreferenceStore {
  const values = new Map<string, string>();
  return {
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
  };
}

/**
 * Locale ownership:
 * - Device default is the live system/device locale, never a stored "device" choice.
 * - Authenticated override: `@nordyan/locale/user/{userId}` only.
 * - Unauthenticated manual override: `@nordyan/locale/manual`.
 *
 * Legacy `@nordyan/locale/device` is no longer written. Existing values are
 * copied once onto the unsigned manual key and left in place. They are never
 * applied to a signed-in user who has no user key.
 */
export async function readLanguagePreference(
  store: LanguagePreferenceStore,
  userId?: string | null,
): Promise<AppLocale | null> {
  const trimmedUserId = userId?.trim();
  if (trimmedUserId) {
    return resolvePersistedAppLocale(
      await store.getItem(languageStorageUserKey(trimmedUserId)),
    );
  }

  const manualLocale = resolvePersistedAppLocale(
    await store.getItem(LANGUAGE_STORAGE_MANUAL_KEY),
  );
  if (manualLocale) {
    return manualLocale;
  }

  const legacyDeviceLocale = resolvePersistedAppLocale(
    await store.getItem(LANGUAGE_STORAGE_DEVICE_KEY),
  );
  if (legacyDeviceLocale) {
    await store.setItem(LANGUAGE_STORAGE_MANUAL_KEY, legacyDeviceLocale);
    return legacyDeviceLocale;
  }

  return null;
}

export async function writeLanguagePreference(
  store: LanguagePreferenceStore,
  locale: AppLocale,
  userId?: string | null,
): Promise<void> {
  const trimmedUserId = userId?.trim();
  if (trimmedUserId) {
    await store.setItem(languageStorageUserKey(trimmedUserId), locale);
    return;
  }

  await store.setItem(LANGUAGE_STORAGE_MANUAL_KEY, locale);
}

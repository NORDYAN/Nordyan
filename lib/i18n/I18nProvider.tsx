import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/providers/auth-provider';

import { readDeviceLanguageTags } from './device-locale';
import { intlLocaleFor } from './format';
import {
  readLanguagePreference,
  writeLanguagePreference,
} from './language-preference';
import { DEFAULT_APP_LOCALE, type AppLocale } from './locales';
import { resolveAppLocaleFromLanguageTags } from './resolve-locale';
import {
  getActiveLocale,
  setActiveLocale,
  subscribeToLocale,
  t,
  type TranslateParams,
} from './translate';
import type { TranslationKey } from './resources/sv';

type I18nContextValue = {
  locale: AppLocale;
  intlLocale: string;
  isReady: boolean;
  t: (key: TranslationKey, params?: TranslateParams) => string;
  setLocale: (locale: AppLocale) => Promise<void>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function deviceDefaultLocale(): AppLocale {
  return resolveAppLocaleFromLanguageTags(readDeviceLanguageTags());
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { session, isReady: isAuthReady } = useAuth();
  const userId = session?.user.id ?? null;
  const [locale, setLocaleState] = useState<AppLocale>(getActiveLocale);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => subscribeToLocale(() => setLocaleState(getActiveLocale())), []);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      const persisted = await readLanguagePreference(AsyncStorage, userId);
      if (cancelled) {
        return;
      }

      const next = persisted ?? deviceDefaultLocale() ?? DEFAULT_APP_LOCALE;
      setActiveLocale(next);
      setLocaleState(next);
      setIsReady(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, userId]);

  const setLocale = useCallback(
    async (next: AppLocale) => {
      setActiveLocale(next);
      setLocaleState(next);
      await writeLanguagePreference(AsyncStorage, next, userId);
    },
    [userId],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      intlLocale: intlLocaleFor(locale),
      isReady,
      t,
      setLocale,
    }),
    [isReady, locale, setLocale],
  );

  return (
    <I18nContext.Provider value={value}>
      <Fragment key={locale}>{children}</Fragment>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    return {
      locale: getActiveLocale(),
      intlLocale: intlLocaleFor(getActiveLocale()),
      isReady: true,
      t,
      setLocale: async (locale) => {
        setActiveLocale(locale);
      },
    };
  }

  return value;
}

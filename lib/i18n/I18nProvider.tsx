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
import { applyLocaleNavigatorRemount } from './locale-navigator-remount';
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
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

/** Remounts app chrome after an explicit locale change. Keep NotificationLifecycle outside this tree. */
export function LocaleKeyedSubtree({ children }: { children: ReactNode }) {
  const { locale, isReady } = useI18n();
  const [remount, setRemount] = useState({
    settledLocale: null as AppLocale | null,
    generation: 0,
  });

  useEffect(() => {
    setRemount((current) => applyLocaleNavigatorRemount(current, { isReady, locale }));
  }, [isReady, locale]);

  return <Fragment key={remount.generation}>{children}</Fragment>;
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

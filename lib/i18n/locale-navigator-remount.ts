import type { AppLocale } from './locales';

export type LocaleNavigatorRemountState = {
  settledLocale: AppLocale | null;
  generation: number;
};

export function applyLocaleNavigatorRemount(
  state: LocaleNavigatorRemountState,
  input: { isReady: boolean; locale: AppLocale },
): LocaleNavigatorRemountState {
  if (!input.isReady) {
    return state;
  }

  if (state.settledLocale === null) {
    return { settledLocale: input.locale, generation: state.generation };
  }

  if (state.settledLocale === input.locale) {
    return state;
  }

  return {
    settledLocale: input.locale,
    generation: state.generation + 1,
  };
}

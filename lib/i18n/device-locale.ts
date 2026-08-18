import * as Localization from 'expo-localization';

export function readDeviceLanguageTags(): string[] {
  try {
    return Localization.getLocales()
      .map((item) => item.languageTag)
      .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0);
  } catch {
    return [];
  }
}

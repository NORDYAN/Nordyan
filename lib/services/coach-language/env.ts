/**
 * Public coach language API base URL (no secrets).
 * Expo Go on a physical device must use the machine LAN IP, not localhost.
 * Example: http://192.168.1.10:8788
 */
export function getCoachLanguageApiBaseUrl(): string | null {
  const value = process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL?.trim();
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\/$/, '');

  if (
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:|\/|$)/i.test(normalized)
  ) {
    // Metadata-only hint — never logs tokens or payloads.
    console.warn(
      '[coach-language] EXPO_PUBLIC_COACH_LANGUAGE_API_URL points at localhost. ' +
        'Expo Go on a physical device cannot reach the host machine that way — use your LAN IP (e.g. http://192.168.x.x:8788).',
    );
  }

  return normalized;
}

export function isCoachLanguageApiConfigured(): boolean {
  return getCoachLanguageApiBaseUrl() !== null;
}

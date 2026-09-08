/**
 * Public account API base URL (no secrets).
 * Never read or embed Auth Admin credentials here.
 */
export function getAccountApiBaseUrl(): string | null {
  const value = process.env.EXPO_PUBLIC_ACCOUNT_API_URL?.trim();
  if (!value) {
    return null;
  }

  return value.replace(/\/$/, '');
}

export function isAccountApiConfigured(): boolean {
  return getAccountApiBaseUrl() !== null;
}

export function consentUserIdDiagnosticSuffix(userId: string | null | undefined): string | null {
  const trimmed = userId?.trim() ?? '';
  if (!trimmed) {
    return null;
  }

  return trimmed.length <= 6 ? trimmed : trimmed.slice(-6);
}

export function logAuthenticatedConsentDiagnostic(
  event: string,
  details: Record<string, string | boolean | number | null | undefined>,
): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  console.info(`[nordyan-consent] ${event}`, details);
}

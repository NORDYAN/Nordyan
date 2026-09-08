export async function resolveHealthDataConsentGate(input: {
  userId: string;
  persistPendingConsent: (userId: string) => Promise<unknown>;
  hasActiveCurrentConsent: (userId: string) => Promise<boolean>;
}): Promise<'authenticated-health-data-consent' | 'continue'> {
  await input.persistPendingConsent(input.userId);
  const hasConsent = await input.hasActiveCurrentConsent(input.userId);
  // Fail-closed: persist/SELECT errors and missing rows stay on the authenticated interstitial.
  return hasConsent ? 'continue' : 'authenticated-health-data-consent';
}

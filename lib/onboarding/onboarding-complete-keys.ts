/** Legacy device-global flag — must not drive routing anymore. */
export const LEGACY_GLOBAL_ONBOARDING_COMPLETE_KEY = '@nordyan/onboarding_complete';

export function onboardingCompleteKeyForUser(userId: string): string {
  return `@nordyan/onboarding_complete/${userId}`;
}

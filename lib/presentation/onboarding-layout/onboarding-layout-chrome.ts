export type OnboardingAccess = 'loading' | 'allow' | 'age' | 'consent';

export type OnboardingLayoutChrome = {
  keepStackMounted: true;
  showLoadingOverlay: boolean;
  redirect: 'age' | 'consent' | null;
};

/**
 * Loading and denied-access chrome must never replace the onboarding Stack.
 * Unmounting the navigator drops the current route (consent → step-3).
 */
export function resolveOnboardingLayoutChrome(input: {
  requiresAge: boolean;
  requiresConsent: boolean;
  access: OnboardingAccess;
}): OnboardingLayoutChrome {
  const showLoadingOverlay =
    (input.requiresAge || input.requiresConsent) && input.access === 'loading';

  if (showLoadingOverlay) {
    return { keepStackMounted: true, showLoadingOverlay: true, redirect: null };
  }

  if (input.requiresAge && input.access === 'age') {
    return { keepStackMounted: true, showLoadingOverlay: false, redirect: 'age' };
  }

  if (input.requiresConsent && input.access === 'consent') {
    return { keepStackMounted: true, showLoadingOverlay: false, redirect: 'consent' };
  }

  return { keepStackMounted: true, showLoadingOverlay: false, redirect: null };
}

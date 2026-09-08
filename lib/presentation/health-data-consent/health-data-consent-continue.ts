export type HealthDataConsentContinueDestination = 'root' | 'step-3';

export function decideOnboardingHealthDataConsentContinueDestination(): HealthDataConsentContinueDestination {
  return 'step-3';
}

export function decideAuthenticatedHealthDataConsentContinueDestination(): HealthDataConsentContinueDestination {
  return 'root';
}

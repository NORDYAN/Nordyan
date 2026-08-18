let currentAttemptVersion = 0;

export function beginNewAnonymousOnboardingAttempt(): void {
  currentAttemptVersion += 1;
}

export function getAnonymousOnboardingAttemptVersion(): number {
  return currentAttemptVersion;
}

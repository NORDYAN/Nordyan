export const ONBOARDING_FORENSICS_VERSION = 3 as const;

export type PendingOwnerState = 'absent' | 'unowned' | 'bound';

export type PendingUnownedWriteResult = 'written' | 'ignored_bound';

export type OnboardingForensicsWriteResult =
  | PendingUnownedWriteResult
  | 'not_attempted';

export type OnboardingResultUnavailableReason =
  | 'missing_pending_profile'
  | 'missing_initial_lifestyle'
  | 'invalid_health_score_input'
  | 'result_engine_failure';

export type OnboardingForensicsEventName =
  | 'runtime-marker'
  | 'logout-clear'
  | 'step-3-save'
  | 'step-4-save'
  | 'measurement-choice-skip'
  | 'measurement-save'
  | 'step-5-mount'
  | 'step-5-load-complete';

export type OnboardingForensicsPayload = {
  event: OnboardingForensicsEventName;
  onboardingForensicsVersion: typeof ONBOARDING_FORENSICS_VERSION;
  authenticated: boolean;
  pendingProfileExists: boolean;
  pendingLifestyleExists: boolean;
  profileOwnerState: PendingOwnerState;
  lifestyleOwnerState: PendingOwnerState;
  profileWriteResult: OnboardingForensicsWriteResult;
  lifestyleWriteResult: OnboardingForensicsWriteResult;
  visibleProfileExists: boolean;
  visibleLifestyleExists: boolean;
  onboardingResultStatus: 'loading' | 'unavailable' | 'ready' | null;
  unavailableReason: OnboardingResultUnavailableReason | null;
  healthScoreInputReady: boolean | null;
  visitIdPresent: boolean;
};

export type OnboardingForensicsSnapshot = {
  pendingProfileExists: boolean;
  pendingLifestyleExists: boolean;
  profileOwnerState: PendingOwnerState;
  lifestyleOwnerState: PendingOwnerState;
  visibleProfileExists: boolean;
  visibleLifestyleExists: boolean;
};

const FORBIDDEN_FORENSICS_KEYS = [
  'userId',
  'email',
  'token',
  'tokens',
  'uuid',
  'dateOfBirth',
  'dob',
  'gender',
  'answers',
] as const;

export function ownerStateFromRecord(input: {
  exists: boolean;
  owner: string | null;
}): PendingOwnerState {
  if (!input.exists) {
    return 'absent';
  }

  return input.owner ? 'bound' : 'unowned';
}

export function buildOnboardingForensicsPayload(input: {
  event: OnboardingForensicsEventName;
  authenticated: boolean;
  snapshot: OnboardingForensicsSnapshot;
  profileWriteResult: OnboardingForensicsWriteResult;
  lifestyleWriteResult: OnboardingForensicsWriteResult;
  visitIdPresent: boolean;
  onboardingResultStatus?: 'loading' | 'unavailable' | 'ready' | null;
  unavailableReason?: OnboardingResultUnavailableReason | null;
  healthScoreInputReady?: boolean | null;
}): OnboardingForensicsPayload {
  return {
    event: input.event,
    onboardingForensicsVersion: ONBOARDING_FORENSICS_VERSION,
    authenticated: input.authenticated,
    pendingProfileExists: input.snapshot.pendingProfileExists,
    pendingLifestyleExists: input.snapshot.pendingLifestyleExists,
    profileOwnerState: input.snapshot.profileOwnerState,
    lifestyleOwnerState: input.snapshot.lifestyleOwnerState,
    profileWriteResult: input.profileWriteResult,
    lifestyleWriteResult: input.lifestyleWriteResult,
    visibleProfileExists: input.snapshot.visibleProfileExists,
    visibleLifestyleExists: input.snapshot.visibleLifestyleExists,
    onboardingResultStatus: input.onboardingResultStatus ?? null,
    unavailableReason: input.unavailableReason ?? null,
    healthScoreInputReady: input.healthScoreInputReady ?? null,
    visitIdPresent: input.visitIdPresent,
  };
}

export function assertOnboardingForensicsPayloadSafe(
  payload: OnboardingForensicsPayload,
): void {
  const keys = Object.keys(payload);
  for (const forbidden of FORBIDDEN_FORENSICS_KEYS) {
    if (keys.includes(forbidden)) {
      throw new Error(`onboarding forensics must not include ${forbidden}`);
    }
  }
}

export function logOnboardingForensics(payload: OnboardingForensicsPayload): void {
  if (!__DEV__) {
    return;
  }

  assertOnboardingForensicsPayloadSafe(payload);
  console.log('[onboarding-forensics]', payload);
}

export function emitOnboardingForensicsRuntimeMarker(): void {
  if (!__DEV__) {
    return;
  }

  console.log('[onboarding-forensics]', {
    event: 'runtime-marker',
    onboardingForensicsVersion: ONBOARDING_FORENSICS_VERSION,
  });
}

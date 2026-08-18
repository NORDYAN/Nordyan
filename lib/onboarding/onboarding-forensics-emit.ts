import {
  buildOnboardingForensicsPayload,
  logOnboardingForensics,
  type OnboardingForensicsEventName,
  type OnboardingForensicsSnapshot,
  type OnboardingForensicsWriteResult,
  type OnboardingResultUnavailableReason,
} from './onboarding-forensics';
import {
  getPendingLifestyleOwnerState,
  getVisiblePendingInitialLifestyle,
} from './pending-initial-lifestyle-storage';
import {
  getPendingProfileOwnerState,
  getVisiblePendingProfileMeasurements,
} from './pending-profile-storage';

export async function captureOnboardingForensicsSnapshot(
  viewerUserId: string | null,
): Promise<OnboardingForensicsSnapshot> {
  const [profileOwnerState, lifestyleOwnerState, visibleProfile, visibleLifestyle] =
    await Promise.all([
      getPendingProfileOwnerState(),
      getPendingLifestyleOwnerState(),
      getVisiblePendingProfileMeasurements(viewerUserId),
      getVisiblePendingInitialLifestyle(viewerUserId),
    ]);

  return {
    pendingProfileExists: profileOwnerState !== 'absent',
    pendingLifestyleExists: lifestyleOwnerState !== 'absent',
    profileOwnerState,
    lifestyleOwnerState,
    visibleProfileExists: visibleProfile !== null,
    visibleLifestyleExists: visibleLifestyle.ok && visibleLifestyle.value !== null,
  };
}

export async function emitOnboardingForensics(input: {
  event: OnboardingForensicsEventName;
  authenticated: boolean;
  viewerUserId: string | null;
  profileWriteResult: OnboardingForensicsWriteResult;
  lifestyleWriteResult: OnboardingForensicsWriteResult;
  visitIdPresent: boolean;
  onboardingResultStatus?: 'loading' | 'unavailable' | 'ready' | null;
  unavailableReason?: OnboardingResultUnavailableReason | null;
  healthScoreInputReady?: boolean | null;
}): Promise<void> {
  if (!__DEV__) {
    return;
  }

  const snapshot = await captureOnboardingForensicsSnapshot(input.viewerUserId);
  logOnboardingForensics(
    buildOnboardingForensicsPayload({
      event: input.event,
      authenticated: input.authenticated,
      snapshot,
      profileWriteResult: input.profileWriteResult,
      lifestyleWriteResult: input.lifestyleWriteResult,
      visitIdPresent: input.visitIdPresent,
      onboardingResultStatus: input.onboardingResultStatus,
      unavailableReason: input.unavailableReason,
      healthScoreInputReady: input.healthScoreInputReady,
    }),
  );
}

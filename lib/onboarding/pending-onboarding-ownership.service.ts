export type PendingOwnershipBindResult = 'absent' | 'bound' | 'already_bound' | 'mismatch';
export type PendingOwnershipBindState = 'absent' | 'bindable' | 'already_bound' | 'mismatch';

export type PendingOnboardingOwnershipDeps = {
  getProfileBindState: (userId: string) => Promise<PendingOwnershipBindState>;
  getLifestyleBindState: (userId: string) => Promise<PendingOwnershipBindState>;
  bindProfile: (userId: string) => Promise<PendingOwnershipBindResult>;
  bindLifestyle: (userId: string) => Promise<PendingOwnershipBindResult>;
  releaseProfileBinding: (userId: string) => Promise<void>;
  clearUnownedProfile: () => Promise<void>;
  clearUnownedLifestyle: () => Promise<void>;
};

export type BindPendingOnboardingResult =
  | { ok: true; bound: boolean }
  | { ok: false; reason: 'ownership_mismatch' };

export async function bindPendingOnboardingOwnership(
  userId: string,
  deps: PendingOnboardingOwnershipDeps,
): Promise<BindPendingOnboardingResult> {
  const [profileState, lifestyleState] = await Promise.all([
    deps.getProfileBindState(userId),
    deps.getLifestyleBindState(userId),
  ]);

  const mixesNewDraftWithExistingRetry =
    (profileState === 'bindable' && lifestyleState === 'already_bound') ||
    (profileState === 'already_bound' && lifestyleState === 'bindable');
  if (
    profileState === 'mismatch' ||
    lifestyleState === 'mismatch' ||
    mixesNewDraftWithExistingRetry
  ) {
    return { ok: false, reason: 'ownership_mismatch' };
  }

  const profile = await deps.bindProfile(userId);
  if (profile === 'mismatch') {
    return { ok: false, reason: 'ownership_mismatch' };
  }

  let lifestyle: PendingOwnershipBindResult;
  try {
    lifestyle = await deps.bindLifestyle(userId);
  } catch (error) {
    if (profile === 'bound') {
      await deps.releaseProfileBinding(userId);
    }
    throw error;
  }
  if (lifestyle === 'mismatch') {
    if (profile === 'bound') {
      await deps.releaseProfileBinding(userId);
    }
    return { ok: false, reason: 'ownership_mismatch' };
  }

  return {
    ok: true,
    bound: profile === 'bound' || lifestyle === 'bound',
  };
}

export async function clearUnownedPendingOnboarding(
  deps: PendingOnboardingOwnershipDeps,
): Promise<void> {
  await Promise.all([
    deps.clearUnownedProfile(),
    deps.clearUnownedLifestyle(),
  ]);
}

export type ClearCompletedOnboardingLocalDataDeps = PendingOnboardingOwnershipDeps & {
  clearProfileForUser: (userId: string) => Promise<void>;
  clearLifestyleForUser: (userId: string) => Promise<void>;
};

/**
 * After profile + Initial Lifestyle have both persisted successfully, drop the
 * completed local bundle. Bound data for another UUID is left untouched.
 */
export async function clearCompletedOnboardingLocalData(
  userId: string,
  deps: ClearCompletedOnboardingLocalDataDeps,
): Promise<void> {
  await Promise.all([
    deps.clearProfileForUser(userId),
    deps.clearLifestyleForUser(userId),
  ]);
  await clearUnownedPendingOnboarding(deps);
}


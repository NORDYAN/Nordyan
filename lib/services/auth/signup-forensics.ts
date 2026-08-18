export type SignupForensicsStage =
  | 'provider-request'
  | 'provider-result'
  | 'outcome-mapped'
  | 'service-result'
  | 'pending-bind'
  | 'verification-record'
  | 'profile-persistence'
  | 'lifestyle-persistence'
  | 'complete';

export type SignupProviderResultCategory =
  | 'not_attempted'
  | 'local_validation_failed'
  | 'provider_error'
  | 'success_user_and_session'
  | 'success_user_without_session'
  | 'success_session_without_user'
  | 'success_empty'
  | 'local_mapping_failed'
  | 'local_failure';

export type SignupForensicsOutcome =
  | 'not_determined'
  | 'authenticated'
  | 'pending_verification'
  | 'failed';

export type SignupPendingBindResult =
  | 'not_attempted'
  | 'bound'
  | 'no_change'
  | 'ownership_mismatch'
  | 'threw';

export type SignupPersistenceResult =
  | 'not_attempted'
  | 'succeeded'
  | 'failed';

export type SignupPendingOwnerState =
  | 'unknown'
  | 'absent'
  | 'unowned'
  | 'bound';

export type SignupForensicsPayload = {
  stage: SignupForensicsStage;
  signupProviderResult: SignupProviderResultCategory;
  providerStatus: number | null;
  providerCode: string | null;
  outcome: SignupForensicsOutcome;
  pendingBindResult: SignupPendingBindResult;
  persistenceResult: SignupPersistenceResult;
  profileOwnerState: SignupPendingOwnerState;
  lifestyleOwnerState: SignupPendingOwnerState;
};

const SAFE_PROVIDER_CODE = /^[a-z0-9_-]{1,64}$/i;
const FORBIDDEN_KEYS = [
  'email',
  'password',
  'userId',
  'ownerId',
  'uuid',
  'token',
  'session',
  'message',
] as const;

function safeProviderMetadata(error: unknown): {
  providerStatus: number | null;
  providerCode: string | null;
} {
  if (!error || typeof error !== 'object') {
    return { providerStatus: null, providerCode: null };
  }

  const candidate = error as { status?: unknown; code?: unknown };
  const providerStatus =
    typeof candidate.status === 'number' &&
    Number.isInteger(candidate.status) &&
    candidate.status >= 100 &&
    candidate.status <= 599
      ? candidate.status
      : null;
  const rawCode = typeof candidate.code === 'string' ? candidate.code.trim() : '';
  const providerCode = SAFE_PROVIDER_CODE.test(rawCode) ? rawCode.toLowerCase() : null;

  return { providerStatus, providerCode };
}

export function buildSignupForensicsPayload(
  input: Omit<SignupForensicsPayload, 'providerStatus' | 'providerCode'> & {
    providerError?: unknown;
  },
): SignupForensicsPayload {
  return {
    stage: input.stage,
    signupProviderResult: input.signupProviderResult,
    ...safeProviderMetadata(input.providerError),
    outcome: input.outcome,
    pendingBindResult: input.pendingBindResult,
    persistenceResult: input.persistenceResult,
    profileOwnerState: input.profileOwnerState,
    lifestyleOwnerState: input.lifestyleOwnerState,
  };
}

export function assertSignupForensicsPayloadSafe(
  payload: SignupForensicsPayload,
): void {
  const keys = Object.keys(payload);
  for (const forbidden of FORBIDDEN_KEYS) {
    if (keys.includes(forbidden)) {
      throw new Error(`signup forensics must not include ${forbidden}`);
    }
  }
}

export function logSignupForensics(
  input: Parameters<typeof buildSignupForensicsPayload>[0],
): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  const payload = buildSignupForensicsPayload(input);
  assertSignupForensicsPayloadSafe(payload);
  console.log('[signup-forensics]', payload);
}

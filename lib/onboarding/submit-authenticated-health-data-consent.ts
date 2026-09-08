import type { Result } from '@/lib/core';
import {
  HEALTH_DATA_CONSENT_POLICY_VERSION,
  HEALTH_DATA_CONSENT_TYPE,
  isCurrentHealthDataConsentGrant,
  type HealthDataConsentGrant,
  type HealthDataConsentPresence,
} from '@/lib/domain/health-data-consent';

export type SubmitAuthenticatedHealthDataConsentDeps = {
  insertGrant: (
    userId: string,
    grant: HealthDataConsentGrant,
  ) => Promise<Result<{ inserted: boolean }>>;
  inspectActiveCurrentConsent: (userId: string) => Promise<HealthDataConsentPresence>;
};

export type AuthenticatedConsentSubmitNavigation = 'root' | 'stay';

export function decideAuthenticatedConsentSubmitNavigation(input: {
  writeOk: boolean;
  presence: HealthDataConsentPresence | null;
}): AuthenticatedConsentSubmitNavigation {
  return input.writeOk && input.presence === 'active' ? 'root' : 'stay';
}

/**
 * Explicit authenticated acceptance writes the current grant for this session user
 * and requires an active read-back before the root gate may run.
 * Anonymous pending ownership is not consulted and is not bound.
 */
export async function submitAuthenticatedHealthDataConsent(
  userId: string,
  grant: HealthDataConsentGrant,
  deps: SubmitAuthenticatedHealthDataConsentDeps,
): Promise<Result<{ presence: 'active'; userId: string }>> {
  const trimmed = userId.trim();
  if (!trimmed) {
    return { ok: false, error: { code: 'VALIDATION', message: 'missing_user_id' } };
  }

  if (!isCurrentHealthDataConsentGrant(grant)) {
    return { ok: false, error: { code: 'VALIDATION', message: 'invalid_current_grant' } };
  }

  const inserted = await deps.insertGrant(trimmed, grant);
  if (!inserted.ok) {
    return inserted;
  }

  const presence = await deps.inspectActiveCurrentConsent(trimmed);
  if (presence !== 'active') {
    return {
      ok: false,
      error: {
        code: 'INTEGRATION',
        message: presence === 'error' ? 'read_back_error' : 'read_back_absent',
      },
    };
  }

  return { ok: true, value: { presence: 'active', userId: trimmed } };
}

export const AUTHENTICATED_CONSENT_WRITE_SHAPE = {
  consentType: HEALTH_DATA_CONSENT_TYPE,
  policyVersion: HEALTH_DATA_CONSENT_POLICY_VERSION,
} as const;

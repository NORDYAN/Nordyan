import type {
  HEALTH_DATA_CONSENT_POLICY_VERSION,
  HEALTH_DATA_CONSENT_TYPE,
} from './constants';

export type HealthDataConsentGrant = {
  consentType: typeof HEALTH_DATA_CONSENT_TYPE;
  policyVersion: string;
  grantedAt: string;
};

export type HealthDataConsentRecord = HealthDataConsentGrant & {
  userId: string;
  withdrawnAt: string | null;
};

export type CurrentHealthDataConsentGrant = HealthDataConsentGrant & {
  consentType: typeof HEALTH_DATA_CONSENT_TYPE;
  policyVersion: typeof HEALTH_DATA_CONSENT_POLICY_VERSION;
};

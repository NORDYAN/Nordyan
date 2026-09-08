export const HEALTH_DATA_CONSENT_TYPE = 'health_lifestyle_processing' as const;
export const HEALTH_DATA_CONSENT_POLICY_VERSION = 'privacy-v1' as const;
export const PRIVACY_POLICY_URL = 'https://nordyan.app/privacy';

export type HealthDataConsentType = typeof HEALTH_DATA_CONSENT_TYPE;
export type HealthDataConsentPolicyVersion = typeof HEALTH_DATA_CONSENT_POLICY_VERSION;

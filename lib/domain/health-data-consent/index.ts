export {
  HEALTH_DATA_CONSENT_POLICY_VERSION,
  HEALTH_DATA_CONSENT_TYPE,
  PRIVACY_POLICY_URL,
} from './constants';
export type {
  HealthDataConsentPolicyVersion,
  HealthDataConsentType,
} from './constants';
export {
  healthDataConsentPresenceFromRepositoryResult,
  type HealthDataConsentPresence,
} from './consent-presence';
export {
  consentUserIdDiagnosticSuffix,
  logAuthenticatedConsentDiagnostic,
} from './consent-diagnostics';
export { isCurrentHealthDataConsentGrant, isIsoTimestamp } from './is-current-health-data-consent-grant';
export type {
  CurrentHealthDataConsentGrant,
  HealthDataConsentGrant,
  HealthDataConsentRecord,
} from './types';

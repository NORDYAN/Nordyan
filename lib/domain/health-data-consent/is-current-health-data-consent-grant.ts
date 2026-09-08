import {
  HEALTH_DATA_CONSENT_POLICY_VERSION,
  HEALTH_DATA_CONSENT_TYPE,
} from './constants';
import type { HealthDataConsentGrant } from './types';

export function isIsoTimestamp(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

export function isCurrentHealthDataConsentGrant(
  grant: HealthDataConsentGrant | null | undefined,
): grant is HealthDataConsentGrant {
  if (!grant) {
    return false;
  }

  return (
    grant.consentType === HEALTH_DATA_CONSENT_TYPE &&
    grant.policyVersion === HEALTH_DATA_CONSENT_POLICY_VERSION &&
    isIsoTimestamp(grant.grantedAt)
  );
}

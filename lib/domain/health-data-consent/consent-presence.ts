import type { Result } from '@/lib/core';

export type HealthDataConsentPresence = 'active' | 'absent' | 'error';

/**
 * Repository SELECT/RLS/network failures must stay distinguishable from
 * "no matching current grant". Fail-closed callers still treat only `active`
 * as permission to continue.
 */
export function healthDataConsentPresenceFromRepositoryResult(
  result: Result<boolean>,
): HealthDataConsentPresence {
  if (!result.ok) {
    return 'error';
  }

  return result.value ? 'active' : 'absent';
}

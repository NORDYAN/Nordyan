import type { Result } from '@/lib/core';
import {
  isCurrentHealthDataConsentGrant,
  type HealthDataConsentGrant,
} from '@/lib/domain/health-data-consent';

export type PersistPendingHealthDataConsentDeps = {
  getBindState: (userId: string) => Promise<'absent' | 'bindable' | 'already_bound' | 'mismatch'>;
  bindToUser: (userId: string) => Promise<'absent' | 'bound' | 'already_bound' | 'mismatch'>;
  getPendingForUser: (userId: string) => Promise<HealthDataConsentGrant | null>;
  hasActiveCurrentConsent: (userId: string) => Promise<boolean>;
  insertGrant: (userId: string, grant: HealthDataConsentGrant) => Promise<Result<{ inserted: boolean }>>;
  clearPendingForUser: (userId: string) => Promise<void>;
};

export type PersistPendingHealthDataConsentResult = Result<{ persisted: boolean }>;

export async function persistPendingHealthDataConsent(
  userId: string,
  deps: PersistPendingHealthDataConsentDeps,
): Promise<PersistPendingHealthDataConsentResult> {
  const trimmed = userId.trim();
  if (!trimmed) {
    return { ok: true, value: { persisted: false } };
  }

  const bindState = await deps.getBindState(trimmed);
  if (bindState === 'bindable') {
    const bound = await deps.bindToUser(trimmed);
    if (bound === 'mismatch') {
      return { ok: true, value: { persisted: false } };
    }
  }

  const pending = await deps.getPendingForUser(trimmed);
  if (!isCurrentHealthDataConsentGrant(pending)) {
    return { ok: true, value: { persisted: false } };
  }

  if (await deps.hasActiveCurrentConsent(trimmed)) {
    await deps.clearPendingForUser(trimmed);
    return { ok: true, value: { persisted: false } };
  }

  const inserted = await deps.insertGrant(trimmed, pending);
  if (!inserted.ok) {
    return inserted;
  }

  await deps.clearPendingForUser(trimmed);
  return { ok: true, value: { persisted: inserted.value.inserted } };
}

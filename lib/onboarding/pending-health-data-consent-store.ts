import {
  HEALTH_DATA_CONSENT_POLICY_VERSION,
  HEALTH_DATA_CONSENT_TYPE,
  isCurrentHealthDataConsentGrant,
  isIsoTimestamp,
  type HealthDataConsentGrant,
} from '@/lib/domain/health-data-consent';

import type { PendingOwnerState } from './onboarding-forensics';
import type { PendingKeyValueStore } from './pending-key-value-store';

export const PENDING_HEALTH_DATA_CONSENT_KEY = '@nordyan/pending_health_data_consent';

type PendingHealthDataConsentContainer = {
  version: 1;
  anonymous: HealthDataConsentGrant | null;
  byUser: Record<string, HealthDataConsentGrant>;
};

export type PendingHealthDataConsentBindResult =
  | 'absent'
  | 'bound'
  | 'already_bound'
  | 'mismatch';

export type PendingHealthDataConsentBindState =
  | 'absent'
  | 'bindable'
  | 'already_bound'
  | 'mismatch';

export type PendingHealthDataConsentStore = {
  savePendingHealthDataConsent(
    grant: HealthDataConsentGrant,
    userId?: string | null,
  ): Promise<void>;
  getPendingHealthDataConsent(): Promise<HealthDataConsentGrant | null>;
  getPendingHealthDataConsentForUser(userId: string): Promise<HealthDataConsentGrant | null>;
  getOwnerState(): Promise<PendingOwnerState>;
  getBindState(userId: string): Promise<PendingHealthDataConsentBindState>;
  bindPendingHealthDataConsentToUser(userId: string): Promise<PendingHealthDataConsentBindResult>;
  clearPendingHealthDataConsent(): Promise<void>;
  clearPendingHealthDataConsentForUser(userId: string): Promise<void>;
  clearUnownedPendingHealthDataConsent(): Promise<void>;
};

function emptyContainer(): PendingHealthDataConsentContainer {
  return { version: 1, anonymous: null, byUser: {} };
}

function parseGrant(value: unknown): HealthDataConsentGrant | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as {
    consentType?: unknown;
    policyVersion?: unknown;
    grantedAt?: unknown;
  };

  if (
    candidate.consentType !== HEALTH_DATA_CONSENT_TYPE ||
    typeof candidate.policyVersion !== 'string' ||
    candidate.policyVersion.trim().length === 0 ||
    typeof candidate.grantedAt !== 'string' ||
    !isIsoTimestamp(candidate.grantedAt)
  ) {
    return null;
  }

  return {
    consentType: HEALTH_DATA_CONSENT_TYPE,
    policyVersion: candidate.policyVersion.trim(),
    grantedAt: candidate.grantedAt,
  };
}

function parseContainer(raw: string | null): PendingHealthDataConsentContainer {
  if (!raw) {
    return emptyContainer();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || (parsed as { version?: unknown }).version !== 1) {
      return emptyContainer();
    }

    const candidate = parsed as { anonymous?: unknown; byUser?: unknown };
    const anonymous = parseGrant(candidate.anonymous);
    const byUser: Record<string, HealthDataConsentGrant> = {};
    if (candidate.byUser && typeof candidate.byUser === 'object') {
      for (const [userId, value] of Object.entries(candidate.byUser)) {
        const grant = parseGrant(value);
        if (grant) {
          byUser[userId] = grant;
        }
      }
    }

    return { version: 1, anonymous, byUser };
  } catch {
    return emptyContainer();
  }
}

export function createCurrentHealthDataConsentGrant(grantedAt = new Date().toISOString()): HealthDataConsentGrant {
  return {
    consentType: HEALTH_DATA_CONSENT_TYPE,
    policyVersion: HEALTH_DATA_CONSENT_POLICY_VERSION,
    grantedAt,
  };
}

export function createPendingHealthDataConsentStore(
  storage: PendingKeyValueStore,
): PendingHealthDataConsentStore {
  const read = async () => parseContainer(await storage.getItem(PENDING_HEALTH_DATA_CONSENT_KEY));
  const write = async (container: PendingHealthDataConsentContainer) => {
    if (container.anonymous === null && Object.keys(container.byUser).length === 0) {
      await storage.removeItem(PENDING_HEALTH_DATA_CONSENT_KEY);
      return;
    }

    await storage.setItem(PENDING_HEALTH_DATA_CONSENT_KEY, JSON.stringify(container));
  };

  return {
    async savePendingHealthDataConsent(grant, userId) {
      if (!isCurrentHealthDataConsentGrant(grant) && !parseGrant(grant)) {
        return;
      }

      const persisted = parseGrant(grant);
      if (!persisted) {
        return;
      }

      const container = await read();
      const ownerId = userId?.trim() ?? '';
      if (ownerId) {
        await write({
          ...container,
          byUser: { ...container.byUser, [ownerId]: persisted },
        });
        return;
      }

      await write({ ...container, anonymous: persisted });
    },

    async getPendingHealthDataConsent() {
      return (await read()).anonymous;
    },

    async getPendingHealthDataConsentForUser(userId) {
      return (await read()).byUser[userId] ?? null;
    },

    async getOwnerState() {
      const container = await read();
      if (container.anonymous !== null) {
        return 'unowned';
      }
      return Object.keys(container.byUser).length > 0 ? 'bound' : 'absent';
    },

    async getBindState(userId) {
      const container = await read();
      const hasAnonymous = container.anonymous !== null;
      const hasUserRetry = container.byUser[userId] !== undefined;
      if (hasAnonymous && hasUserRetry) {
        return 'mismatch';
      }
      if (hasAnonymous) {
        return 'bindable';
      }
      return hasUserRetry ? 'already_bound' : 'absent';
    },

    async bindPendingHealthDataConsentToUser(userId) {
      const container = await read();
      if (container.anonymous === null) {
        return container.byUser[userId] ? 'already_bound' : 'absent';
      }
      if (container.byUser[userId]) {
        return 'mismatch';
      }

      await write({
        version: 1,
        anonymous: null,
        byUser: { ...container.byUser, [userId]: container.anonymous },
      });
      return 'bound';
    },

    async clearPendingHealthDataConsent() {
      const container = await read();
      await write({ ...container, anonymous: null });
    },

    async clearPendingHealthDataConsentForUser(userId) {
      const container = await read();
      if (!container.byUser[userId]) {
        return;
      }
      const byUser = { ...container.byUser };
      delete byUser[userId];
      await write({ ...container, byUser });
    },

    async clearUnownedPendingHealthDataConsent() {
      const container = await read();
      await write({ ...container, anonymous: null });
    },
  };
}

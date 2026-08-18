import type { ProfileMeasurements } from '@/lib/domain/profile';

import type { PendingKeyValueStore } from './pending-key-value-store';
import type { PendingOwnerState } from './onboarding-forensics';

export const PENDING_PROFILE_KEY = '@nordyan/pending_profile_measurements';

type LegacyPendingProfileRecord = {
  version: 1;
  owner: string | null;
  value: ProfileMeasurements;
};

type PendingProfileContainer = {
  version: 2;
  anonymous: ProfileMeasurements | null;
  byUser: Record<string, ProfileMeasurements>;
};

export type PendingProfileBindResult = 'absent' | 'bound' | 'already_bound' | 'mismatch';
export type PendingProfileBindState = 'absent' | 'bindable' | 'already_bound' | 'mismatch';

export type PendingProfileStore = {
  getUnowned(): Promise<ProfileMeasurements | null>;
  getForUser(userId: string): Promise<ProfileMeasurements | null>;
  getOwnerState(): Promise<PendingOwnerState>;
  saveUnowned(measurements: ProfileMeasurements): Promise<'written' | 'ignored_bound'>;
  updateUnowned(patch: Partial<ProfileMeasurements>): Promise<ProfileMeasurements | null>;
  getBindState(userId: string): Promise<PendingProfileBindState>;
  bindToUser(userId: string): Promise<PendingProfileBindResult>;
  releaseBinding(userId: string): Promise<void>;
  clear(): Promise<void>;
  clearForUser(userId: string): Promise<void>;
  clearUnowned(): Promise<void>;
};

function isProfileMeasurements(value: unknown): value is ProfileMeasurements {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ProfileMeasurements>;
  return typeof candidate.heightCm === 'number' && typeof candidate.weightKg === 'number';
}

function emptyContainer(): PendingProfileContainer {
  return { version: 2, anonymous: null, byUser: {} };
}

function parseContainer(raw: string | null): PendingProfileContainer {
  if (!raw) {
    return emptyContainer();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as { version?: unknown }).version === 2
    ) {
      const candidate = parsed as {
        anonymous?: unknown;
        byUser?: unknown;
      };
      const anonymous =
        candidate.anonymous === null || candidate.anonymous === undefined
          ? null
          : isProfileMeasurements(candidate.anonymous)
            ? candidate.anonymous
            : null;
      const byUser: Record<string, ProfileMeasurements> = {};
      if (candidate.byUser && typeof candidate.byUser === 'object') {
        for (const [userId, value] of Object.entries(candidate.byUser)) {
          if (isProfileMeasurements(value)) {
            byUser[userId] = value;
          }
        }
      }
      return { version: 2, anonymous, byUser };
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as { version?: unknown }).version === 1 &&
      ('owner' in parsed) &&
      ((parsed as { owner?: unknown }).owner === null ||
        typeof (parsed as { owner?: unknown }).owner === 'string') &&
      isProfileMeasurements((parsed as { value?: unknown }).value)
    ) {
      const legacy = parsed as LegacyPendingProfileRecord;
      return legacy.owner === null
        ? { version: 2, anonymous: legacy.value, byUser: {} }
        : { version: 2, anonymous: null, byUser: { [legacy.owner]: legacy.value } };
    }

    // Legacy pending values are intentionally unowned until a successful signup binds them.
    if (isProfileMeasurements(parsed)) {
      return { version: 2, anonymous: parsed, byUser: {} };
    }
  } catch {
    return emptyContainer();
  }

  return emptyContainer();
}

export function createPendingProfileStore(storage: PendingKeyValueStore): PendingProfileStore {
  const read = async () => parseContainer(await storage.getItem(PENDING_PROFILE_KEY));
  const write = async (container: PendingProfileContainer) => {
    if (container.anonymous === null && Object.keys(container.byUser).length === 0) {
      await storage.removeItem(PENDING_PROFILE_KEY);
      return;
    }
    await storage.setItem(PENDING_PROFILE_KEY, JSON.stringify(container));
  };

  return {
    async getUnowned() {
      return (await read()).anonymous;
    },

    async getForUser(userId) {
      return (await read()).byUser[userId] ?? null;
    },

    async getOwnerState() {
      const container = await read();
      if (container.anonymous !== null) {
        return 'unowned';
      }
      return Object.keys(container.byUser).length > 0 ? 'bound' : 'absent';
    },

    async saveUnowned(measurements) {
      const container = await read();
      await write({ ...container, anonymous: measurements });
      return 'written';
    },

    async updateUnowned(patch) {
      const container = await read();
      if (!container.anonymous) {
        return null;
      }

      const next = { ...container.anonymous, ...patch };
      await write({ ...container, anonymous: next });
      return next;
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

    async bindToUser(userId) {
      const container = await read();
      if (container.anonymous === null) {
        return container.byUser[userId] ? 'already_bound' : 'absent';
      }
      if (container.byUser[userId]) {
        return 'mismatch';
      }

      await write({
        version: 2,
        anonymous: null,
        byUser: { ...container.byUser, [userId]: container.anonymous },
      });
      return 'bound';
    },

    async releaseBinding(userId) {
      const container = await read();
      const retry = container.byUser[userId];
      if (!retry) {
        return;
      }
      if (container.anonymous !== null) {
        throw new Error('cannot release a bound profile over an anonymous draft');
      }

      const byUser = { ...container.byUser };
      delete byUser[userId];
      await write({ version: 2, anonymous: retry, byUser });
    },

    async clear() {
      const container = await read();
      await write({ ...container, anonymous: null });
    },

    async clearForUser(userId) {
      const container = await read();
      if (!container.byUser[userId]) {
        return;
      }
      const byUser = { ...container.byUser };
      delete byUser[userId];
      await write({ ...container, byUser });
    },

    async clearUnowned() {
      const container = await read();
      await write({ ...container, anonymous: null });
    },
  };
}

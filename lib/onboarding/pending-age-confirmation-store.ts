import type { PendingKeyValueStore } from './pending-key-value-store';

export const PENDING_AGE_CONFIRMATION_KEY = '@nordyan/pending_age_confirmation';

type PendingAgeConfirmation = {
  version: 1;
  confirmed18Plus: true;
};

export type PendingAgeConfirmationStore = {
  hasConfirmed18Plus(): Promise<boolean>;
  saveConfirmed18Plus(): Promise<void>;
  clear(): Promise<void>;
};

function isPendingAgeConfirmation(value: unknown): value is PendingAgeConfirmation {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const record = value as { version?: unknown; confirmed18Plus?: unknown };
  return record.version === 1 && record.confirmed18Plus === true;
}

export function createPendingAgeConfirmationStore(
  storage: PendingKeyValueStore,
): PendingAgeConfirmationStore {
  return {
    async hasConfirmed18Plus(): Promise<boolean> {
      const raw = await storage.getItem(PENDING_AGE_CONFIRMATION_KEY);
      if (!raw) {
        return false;
      }

      try {
        return isPendingAgeConfirmation(JSON.parse(raw));
      } catch {
        return false;
      }
    },

    async saveConfirmed18Plus(): Promise<void> {
      const pending: PendingAgeConfirmation = {
        version: 1,
        confirmed18Plus: true,
      };
      await storage.setItem(PENDING_AGE_CONFIRMATION_KEY, JSON.stringify(pending));
    },

    async clear(): Promise<void> {
      await storage.removeItem(PENDING_AGE_CONFIRMATION_KEY);
    },
  };
}

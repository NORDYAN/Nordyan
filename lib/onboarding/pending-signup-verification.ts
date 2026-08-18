import type { PendingKeyValueStore } from './pending-key-value-store';

export const PENDING_SIGNUP_VERIFICATION_KEY = '@nordyan/pending_signup_verification';

export type PendingSignupVerification = {
  email: string;
  ownerId: string;
};

type PendingSignupVerificationRecord = {
  version: 1;
  email: string;
  ownerId: string;
};

export type PendingSignupVerificationStore = {
  save(input: PendingSignupVerification): Promise<void>;
  get(): Promise<PendingSignupVerification | null>;
  clear(): Promise<void>;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseRecord(raw: string | null): PendingSignupVerificationRecord | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const candidate = parsed as {
      version?: unknown;
      email?: unknown;
      ownerId?: unknown;
    };

    if (candidate.version !== 1 || !isNonEmptyString(candidate.email) || !isNonEmptyString(candidate.ownerId)) {
      return null;
    }

    const email = candidate.email.trim();
    const ownerId = candidate.ownerId.trim();
    if (!email.includes('@') || !ownerId) {
      return null;
    }

    return { version: 1, email, ownerId };
  } catch {
    return null;
  }
}

export function createPendingSignupVerificationStore(
  storage: PendingKeyValueStore,
): PendingSignupVerificationStore {
  return {
    async save(input) {
      const email = input.email.trim();
      const ownerId = input.ownerId.trim();
      if (!email.includes('@') || !ownerId) {
        return;
      }

      const record: PendingSignupVerificationRecord = {
        version: 1,
        email,
        ownerId,
      };
      await storage.setItem(PENDING_SIGNUP_VERIFICATION_KEY, JSON.stringify(record));
    },

    async get() {
      const record = parseRecord(await storage.getItem(PENDING_SIGNUP_VERIFICATION_KEY));
      return record ? { email: record.email, ownerId: record.ownerId } : null;
    },

    async clear() {
      await storage.removeItem(PENDING_SIGNUP_VERIFICATION_KEY);
    },
  };
}

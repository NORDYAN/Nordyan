import type { Result } from '@/lib/core';
import {
  INITIAL_LIFESTYLE_ANSWER_FIELDS,
  initialLifestyleAnswersValidator,
  type InitialLifestyleAnswers,
} from '@/lib/domain/initial-lifestyle';
import { t } from '@/lib/i18n';

import type { PendingOwnerState } from './onboarding-forensics';
import {
  createMemoryPendingKeyValueStore,
  type PendingKeyValueStore,
} from './pending-key-value-store';

export const PENDING_INITIAL_LIFESTYLE_KEY = '@nordyan/pending_initial_lifestyle';
export const PENDING_INITIAL_LIFESTYLE_INVALID_MESSAGE = () => t('lifestyle.incomplete');
const PENDING_INITIAL_LIFESTYLE_SAVE_ERROR_MESSAGE = () => t('lifestyle.pendingSaveError');

type LegacyPendingInitialLifestyleRecord = {
  version: 1;
  owner: string | null;
  value: InitialLifestyleAnswers;
};

type PendingInitialLifestyleContainer = {
  version: 2;
  anonymous: InitialLifestyleAnswers | null;
  byUser: Record<string, InitialLifestyleAnswers>;
};

export type PendingInitialLifestyleBindResult =
  | 'absent'
  | 'bound'
  | 'already_bound'
  | 'mismatch';

export type PendingInitialLifestyleBindState =
  | 'absent'
  | 'bindable'
  | 'already_bound'
  | 'mismatch';

export type PendingInitialLifestyleStore = {
  savePendingInitialLifestyle(answers: unknown): Promise<Result<InitialLifestyleAnswers>>;
  getPendingInitialLifestyle(): Promise<Result<InitialLifestyleAnswers | null>>;
  getPendingInitialLifestyleForUser(
    userId: string,
  ): Promise<Result<InitialLifestyleAnswers | null>>;
  getOwnerState(): Promise<PendingOwnerState>;
  getBindState(userId: string): Promise<PendingInitialLifestyleBindState>;
  bindPendingInitialLifestyleToUser(
    userId: string,
  ): Promise<PendingInitialLifestyleBindResult>;
  clearPendingInitialLifestyle(): Promise<void>;
  clearPendingInitialLifestyleForUser(userId: string): Promise<void>;
  clearUnownedPendingInitialLifestyle(): Promise<void>;
};

function toPersistedAnswers(answers: InitialLifestyleAnswers): InitialLifestyleAnswers {
  return {
    sleepQuality: answers.sleepQuality,
    energy: answers.energy,
    stress: answers.stress,
    lessHealthyFoodFrequency: answers.lessHealthyFoodFrequency,
    everydayActivity: answers.everydayActivity,
    eatingQuality: answers.eatingQuality,
    alcoholConsumption: answers.alcoholConsumption,
  };
}

function emptyContainer(): PendingInitialLifestyleContainer {
  return { version: 2, anonymous: null, byUser: {} };
}

function parseAnswers(value: unknown): InitialLifestyleAnswers | null {
  const validation = initialLifestyleAnswersValidator.validate(value);
  return validation.valid ? toPersistedAnswers(validation.value) : null;
}

function parseContainer(raw: string | null): PendingInitialLifestyleContainer {
  if (!raw) {
    return emptyContainer();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      (parsed as { version?: unknown }).version === 2
    ) {
      const candidate = parsed as { anonymous?: unknown; byUser?: unknown };
      const anonymous =
        candidate.anonymous === null || candidate.anonymous === undefined
          ? null
          : parseAnswers(candidate.anonymous);
      const byUser: Record<string, InitialLifestyleAnswers> = {};
      if (candidate.byUser && typeof candidate.byUser === 'object') {
        for (const [userId, value] of Object.entries(candidate.byUser)) {
          const answers = parseAnswers(value);
          if (answers) {
            byUser[userId] = answers;
          }
        }
      }
      return { version: 2, anonymous, byUser };
    }

    const isEnvelope =
      parsed !== null &&
      typeof parsed === 'object' &&
      (parsed as { version?: unknown }).version === 1 &&
      'owner' in parsed &&
      ((parsed as { owner?: unknown }).owner === null ||
        typeof (parsed as { owner?: unknown }).owner === 'string');
    const candidate = isEnvelope ? (parsed as { value?: unknown }).value : parsed;
    const validation = initialLifestyleAnswersValidator.validate(candidate);
    if (!validation.valid) {
      return emptyContainer();
    }

    const owner = isEnvelope ? (parsed as LegacyPendingInitialLifestyleRecord).owner : null;
    const value = toPersistedAnswers(validation.value);
    return owner === null
      ? { version: 2, anonymous: value, byUser: {} }
      : { version: 2, anonymous: null, byUser: { [owner]: value } };
  } catch {
    return emptyContainer();
  }
}

export function createPendingInitialLifestyleStore(
  storage: PendingKeyValueStore,
): PendingInitialLifestyleStore {
  const read = async () => parseContainer(await storage.getItem(PENDING_INITIAL_LIFESTYLE_KEY));
  const write = async (container: PendingInitialLifestyleContainer) => {
    if (container.anonymous === null && Object.keys(container.byUser).length === 0) {
      await storage.removeItem(PENDING_INITIAL_LIFESTYLE_KEY);
      return;
    }
    await storage.setItem(PENDING_INITIAL_LIFESTYLE_KEY, JSON.stringify(container));
  };

  return {
    async savePendingInitialLifestyle(answers: unknown): Promise<Result<InitialLifestyleAnswers>> {
      const validation = initialLifestyleAnswersValidator.validate(answers);
      if (!validation.valid) {
        return {
          ok: false,
          error: {
            code: 'VALIDATION',
            message: t('lifestyle.incomplete'),
          },
        };
      }

      const persisted = toPersistedAnswers(validation.value);
      try {
        const container = await read();
        await write({ ...container, anonymous: persisted });
      } catch (cause) {
        return {
          ok: false,
          error: {
            code: 'UNKNOWN',
            message: PENDING_INITIAL_LIFESTYLE_SAVE_ERROR_MESSAGE(),
            cause,
          },
        };
      }
      return { ok: true, value: persisted };
    },

    async getPendingInitialLifestyle(): Promise<Result<InitialLifestyleAnswers | null>> {
      return { ok: true, value: (await read()).anonymous };
    },

    async getPendingInitialLifestyleForUser(
      userId: string,
    ): Promise<Result<InitialLifestyleAnswers | null>> {
      return { ok: true, value: (await read()).byUser[userId] ?? null };
    },

    async getOwnerState(): Promise<PendingOwnerState> {
      const container = await read();
      if (container.anonymous !== null) {
        return 'unowned';
      }
      return Object.keys(container.byUser).length > 0 ? 'bound' : 'absent';
    },

    async getBindState(userId): Promise<PendingInitialLifestyleBindState> {
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

    async bindPendingInitialLifestyleToUser(
      userId: string,
    ): Promise<PendingInitialLifestyleBindResult> {
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

    async clearPendingInitialLifestyle(): Promise<void> {
      const container = await read();
      await write({ ...container, anonymous: null });
    },

    async clearPendingInitialLifestyleForUser(userId: string): Promise<void> {
      const container = await read();
      if (!container.byUser[userId]) {
        return;
      }
      const byUser = { ...container.byUser };
      delete byUser[userId];
      await write({ ...container, byUser });
    },

    async clearUnownedPendingInitialLifestyle(): Promise<void> {
      const container = await read();
      await write({ ...container, anonymous: null });
    },
  };
}

export function pendingInitialLifestylePersistedKeys(
  answers: InitialLifestyleAnswers,
): string[] {
  return Object.keys(answers).sort();
}

export const INITIAL_LIFESTYLE_PENDING_ALLOWED_KEYS = [...INITIAL_LIFESTYLE_ANSWER_FIELDS].sort();

export { createMemoryPendingKeyValueStore };
export type { PendingKeyValueStore };

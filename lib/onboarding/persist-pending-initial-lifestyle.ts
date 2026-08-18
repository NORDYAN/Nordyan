import type { Result } from '@/lib/core';
import type { InitialLifestyleAnswers } from '@/lib/domain/initial-lifestyle';

export type PersistPendingInitialLifestyleDeps = {
  getPendingInitialLifestyle: (
    userId: string,
  ) => Promise<Result<InitialLifestyleAnswers | null>>;
  clearPendingInitialLifestyle: (userId: string) => Promise<void>;
  saveInitialLifestyle: (
    userId: string,
    answers: InitialLifestyleAnswers,
  ) => Promise<Result<unknown>>;
};

export type PersistPendingInitialLifestyleResult = Result<{ persisted: boolean }>;

/**
 * After authenticated profile sync succeeds, persist pending Initial Lifestyle if present.
 * Does not touch profile, Measurement, snapshot, Health Score, Focus, or Coach.
 */
export async function persistPendingInitialLifestyle(
  userId: string,
  deps: PersistPendingInitialLifestyleDeps,
): Promise<PersistPendingInitialLifestyleResult> {
  const pending = await deps.getPendingInitialLifestyle(userId);
  if (!pending.ok) {
    return pending;
  }

  if (pending.value === null) {
    return { ok: true, value: { persisted: false } };
  }

  const saved = await deps.saveInitialLifestyle(userId, pending.value);
  if (!saved.ok) {
    return saved;
  }

  await deps.clearPendingInitialLifestyle(userId);
  return { ok: true, value: { persisted: true } };
}

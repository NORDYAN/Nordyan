import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Result } from '@/lib/core';
import type { InitialLifestyleAnswers } from '@/lib/domain/initial-lifestyle';
import { initialLifestyleService } from '@/lib/services/initial-lifestyle';

import { selectVisiblePendingValue } from './pending-onboarding-visible';
import {
  persistPendingInitialLifestyle,
  type PersistPendingInitialLifestyleResult,
} from './persist-pending-initial-lifestyle';
import {
  createPendingInitialLifestyleStore,
  type PendingInitialLifestyleStore,
} from './pending-initial-lifestyle-store';

const pendingInitialLifestyleStore: PendingInitialLifestyleStore =
  createPendingInitialLifestyleStore(AsyncStorage);

export async function savePendingInitialLifestyle(
  answers: unknown,
): ReturnType<PendingInitialLifestyleStore['savePendingInitialLifestyle']> {
  return pendingInitialLifestyleStore.savePendingInitialLifestyle(answers);
}

export function getPendingInitialLifestyle(): ReturnType<
  PendingInitialLifestyleStore['getPendingInitialLifestyle']
> {
  return pendingInitialLifestyleStore.getPendingInitialLifestyle();
}

export async function getVisiblePendingInitialLifestyle(
  userId: string | null,
): Promise<Result<InitialLifestyleAnswers | null>> {
  const owned = userId
    ? await pendingInitialLifestyleStore.getPendingInitialLifestyleForUser(userId)
    : { ok: true as const, value: null };
  if (!owned.ok) {
    return owned;
  }

  const unowned = await pendingInitialLifestyleStore.getPendingInitialLifestyle();
  if (!unowned.ok) {
    return unowned;
  }

  return {
    ok: true,
    value: selectVisiblePendingValue({
      viewerUserId: userId,
      ownedByViewer: owned.value,
      unowned: unowned.value,
    }),
  };
}

export function getPendingInitialLifestyleForUser(
  userId: string,
): ReturnType<PendingInitialLifestyleStore['getPendingInitialLifestyleForUser']> {
  return pendingInitialLifestyleStore.getPendingInitialLifestyleForUser(userId);
}

export function getPendingLifestyleOwnerState() {
  return pendingInitialLifestyleStore.getOwnerState();
}

export function getPendingLifestyleBindState(userId: string) {
  return pendingInitialLifestyleStore.getBindState(userId);
}

export function bindPendingInitialLifestyleToUser(userId: string) {
  return pendingInitialLifestyleStore.bindPendingInitialLifestyleToUser(userId);
}

export async function clearPendingInitialLifestyle(): Promise<void> {
  await pendingInitialLifestyleStore.clearPendingInitialLifestyle();
}

export function clearPendingInitialLifestyleForUser(userId: string): Promise<void> {
  return pendingInitialLifestyleStore.clearPendingInitialLifestyleForUser(userId);
}

export function clearUnownedPendingInitialLifestyle(): Promise<void> {
  return pendingInitialLifestyleStore.clearUnownedPendingInitialLifestyle();
}

export function persistPendingInitialLifestyleAfterAuth(
  userId: string,
): Promise<PersistPendingInitialLifestyleResult> {
  return persistPendingInitialLifestyle(userId, {
    getPendingInitialLifestyle: getPendingInitialLifestyleForUser,
    clearPendingInitialLifestyle: clearPendingInitialLifestyleForUser,
    saveInitialLifestyle: (id, answers) => initialLifestyleService.save(id, answers),
  });
}

import AsyncStorage from '@react-native-async-storage/async-storage';

import { logNordyanAuthTrace } from './auth-callback-trace';
import {
  classifyPkceStorageKeys,
  type PkceStoragePresenceDetails,
  type PkceStoragePresenceStage,
} from './pkce-storage-presence.classification';

export {
  classifyPkceStorageKeys,
  hasAuthCallbackFlowIdParam,
} from './pkce-storage-presence.classification';
export type {
  PkceStoragePresenceDetails,
  PkceStoragePresenceStage,
} from './pkce-storage-presence.classification';

export async function logPkceStoragePresence(input: {
  stage: PkceStoragePresenceStage;
  hasFlowId?: boolean;
}): Promise<void> {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  let classified: ReturnType<typeof classifyPkceStorageKeys> | null = null;
  let inspectFailed = false;

  try {
    const keys = await AsyncStorage.getAllKeys();
    classified = classifyPkceStorageKeys(keys);
  } catch {
    inspectFailed = true;
  }

  const details: PkceStoragePresenceDetails = {
    stage: input.stage,
    matchingVerifierKeyCount: classified?.matchingVerifierKeyCount ?? 0,
    hasVerifierKey: classified?.hasVerifierKey ?? false,
    hasSupabaseAuthKey: classified?.hasSupabaseAuthKey ?? false,
    defaultVerifierKeyCount: classified?.defaultVerifierKeyCount ?? 0,
    flowScopedVerifierKeyCount: classified?.flowScopedVerifierKeyCount ?? 0,
    ...(input.stage === 'callback-start' ? { hasFlowId: Boolean(input.hasFlowId) } : {}),
    ...(inspectFailed ? { inspectFailed: true } : {}),
  };

  logNordyanAuthTrace('pkce.storage.presence', details);
}

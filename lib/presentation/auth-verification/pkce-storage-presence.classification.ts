export type PkceStoragePresenceStage = 'after-signup' | 'callback-start';

export type PkceStoragePresenceDetails = {
  stage: PkceStoragePresenceStage;
  matchingVerifierKeyCount: number;
  hasVerifierKey: boolean;
  hasSupabaseAuthKey: boolean;
  defaultVerifierKeyCount: number;
  flowScopedVerifierKeyCount: number;
  hasFlowId?: boolean;
  inspectFailed?: boolean;
};

function isVerifierKey(key: string): boolean {
  return key.includes('code-verifier');
}

function isDefaultVerifierKey(key: string): boolean {
  return /code-verifier$/.test(key);
}

function isFlowScopedVerifierKey(key: string): boolean {
  return isVerifierKey(key) && !isDefaultVerifierKey(key);
}

function isSupabaseSessionAuthKey(key: string): boolean {
  return /^sb-.+-auth-token$/.test(key) && !isVerifierKey(key);
}

export function classifyPkceStorageKeys(keys: readonly string[]): Omit<
  PkceStoragePresenceDetails,
  'stage' | 'hasFlowId' | 'inspectFailed'
> {
  const verifierKeys = keys.filter(isVerifierKey);
  const defaultVerifierKeyCount = verifierKeys.filter(isDefaultVerifierKey).length;
  const flowScopedVerifierKeyCount = verifierKeys.filter(isFlowScopedVerifierKey).length;

  return {
    matchingVerifierKeyCount: verifierKeys.length,
    hasVerifierKey: verifierKeys.length > 0,
    hasSupabaseAuthKey: keys.some(isSupabaseSessionAuthKey),
    defaultVerifierKeyCount,
    flowScopedVerifierKeyCount,
  };
}

export function hasAuthCallbackFlowIdParam(value: string | string[] | undefined): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0].trim().length > 0;
  }
  return false;
}

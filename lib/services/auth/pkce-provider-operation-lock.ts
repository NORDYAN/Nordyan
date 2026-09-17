import { logNordyanAuthTrace } from '@/lib/presentation/auth-verification/auth-callback-trace';

export type PkceProviderOperationKind = 'signup' | 'resend';

export type PkceProviderBeginResult =
  | { started: true; kind: PkceProviderOperationKind; operationId: number }
  | { started: false; kind: PkceProviderOperationKind; blockedBy: PkceProviderOperationKind };

type InFlightPkceProviderOperation = {
  kind: PkceProviderOperationKind;
  operationId: number;
};

let inFlight: InFlightPkceProviderOperation | null = null;
let nextOperationId = 1;

export function beginPkceProviderOperation(
  kind: PkceProviderOperationKind,
): PkceProviderBeginResult {
  if (inFlight) {
    logNordyanAuthTrace('signup.provider.operation.blocked', {
      kind,
      blockedBy: inFlight.kind,
      inFlightOperationId: inFlight.operationId,
    });
    return { started: false, kind, blockedBy: inFlight.kind };
  }

  const operationId = nextOperationId;
  nextOperationId += 1;
  inFlight = { kind, operationId };
  logNordyanAuthTrace('signup.provider.operation.start', { kind, operationId });
  return { started: true, kind, operationId };
}

export function finishPkceProviderOperation(operationId: number): void {
  const finishingKind = inFlight?.operationId === operationId ? inFlight.kind : null;
  if (inFlight?.operationId === operationId) {
    inFlight = null;
  }
  logNordyanAuthTrace('signup.provider.operation.finish', {
    operationId,
    kind: finishingKind,
  });
}

export async function runPkceProviderOperation<T>(
  kind: PkceProviderOperationKind,
  operation: () => Promise<T>,
  onBlocked: () => T,
): Promise<T> {
  const begun = beginPkceProviderOperation(kind);
  if (!begun.started) {
    return onBlocked();
  }

  try {
    return await operation();
  } finally {
    finishPkceProviderOperation(begun.operationId);
  }
}

export function resetPkceProviderOperationLockForTests(): void {
  inFlight = null;
  nextOperationId = 1;
}

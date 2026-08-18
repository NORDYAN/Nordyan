export type UnauthenticatedAppGateResult =
  | { destination: 'loading' }
  | { destination: 'onboarding' }
  | { destination: 'check-email'; email: string };

export function resolveUnauthenticatedAppGate(input: {
  isReady: boolean;
  pendingVerificationEmail: string | null | undefined;
}): UnauthenticatedAppGateResult {
  if (!input.isReady) {
    return { destination: 'loading' };
  }

  const email = input.pendingVerificationEmail?.trim() ?? '';
  if (email.includes('@')) {
    return { destination: 'check-email', email };
  }

  return { destination: 'onboarding' };
}

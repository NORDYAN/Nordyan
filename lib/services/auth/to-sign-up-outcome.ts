import type { AuthSession, SignUpOutcome } from '@/lib/domain/auth';

export function toSignUpOutcome(
  email: string,
  session: AuthSession | null,
  ownerId: string,
): SignUpOutcome {
  if (session) {
    return { kind: 'authenticated', session };
  }

  return { kind: 'pending_verification', email, ownerId };
}
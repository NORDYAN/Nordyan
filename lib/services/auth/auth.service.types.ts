import type { Result } from '@/lib/core';
import type { AuthSession, AuthStatus, SignUpOutcome } from '@/lib/domain/auth';

import type { HydratedAuthSession } from './resolve-hydrated-auth-session';

export interface AuthService {
  getStatus(): Promise<Result<AuthStatus>>;
  getSession(): Promise<Result<AuthSession | null>>;
  hydrateLocalSession(): Promise<HydratedAuthSession>;
  signInWithEmail(email: string, password: string): Promise<Result<AuthSession>>;
  signUpWithEmail(email: string, password: string): Promise<Result<SignUpOutcome>>;
  resendSignupVerification(email: string): Promise<Result<void>>;
  requestPasswordRecovery(email: string): Promise<Result<void>>;
  exchangeAuthCallbackCode(code: string): Promise<Result<AuthSession>>;
  updatePassword(password: string, confirmation: string): Promise<Result<void>>;
  signOut(): Promise<Result<void>>;
}

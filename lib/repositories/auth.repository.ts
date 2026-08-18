import type { Result } from '@/lib/core';
import type { AuthSession, AuthStatus, AuthUser, SignUpOutcome } from '@/lib/domain/auth';

export interface AuthRepository {
  getSession(): Promise<Result<AuthSession | null>>;
  getStatus(): Promise<Result<AuthStatus>>;
  getCurrentUser(): Promise<Result<AuthUser | null>>;
  signInWithEmail(email: string, password: string): Promise<Result<AuthSession>>;
  signUpWithEmail(email: string, password: string): Promise<Result<SignUpOutcome>>;
  resendSignupVerification(email: string): Promise<Result<void>>;
  requestPasswordRecovery(email: string): Promise<Result<void>>;
  exchangeAuthCallbackCode(code: string): Promise<Result<AuthSession>>;
  updatePassword(password: string): Promise<Result<void>>;
  signOut(): Promise<Result<void>>;
}

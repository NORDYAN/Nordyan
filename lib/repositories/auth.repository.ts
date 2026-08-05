import type { Result } from '@/lib/core';
import type { AuthSession, AuthStatus, AuthUser } from '@/lib/domain/auth';

export interface AuthRepository {
  getSession(): Promise<Result<AuthSession | null>>;
  getStatus(): Promise<Result<AuthStatus>>;
  getCurrentUser(): Promise<Result<AuthUser | null>>;
  signInWithEmail(email: string, password: string): Promise<Result<AuthSession>>;
  signUpWithEmail(email: string, password: string): Promise<Result<AuthSession>>;
  signOut(): Promise<Result<void>>;
}

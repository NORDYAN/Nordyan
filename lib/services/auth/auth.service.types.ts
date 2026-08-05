import type { Result } from '@/lib/core';
import type { AuthSession, AuthStatus } from '@/lib/domain/auth';

export interface AuthService {
  getStatus(): Promise<Result<AuthStatus>>;
  getSession(): Promise<Result<AuthSession | null>>;
  signInWithEmail(email: string, password: string): Promise<Result<AuthSession>>;
  signUpWithEmail(email: string, password: string): Promise<Result<AuthSession>>;
  signOut(): Promise<Result<void>>;
}

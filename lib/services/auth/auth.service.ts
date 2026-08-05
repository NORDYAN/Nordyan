import type { Result } from '@/lib/core';
import type { AuthSession, AuthStatus } from '@/lib/domain/auth';
import { supabaseAuthRepository } from '@/lib/repositories/supabase-auth.repository';
import type { AuthService } from '@/lib/services/auth/auth.service.types';
import { validateAuthInput } from '@/lib/services/auth/auth-errors';

class DefaultAuthService implements AuthService {
  getStatus(): Promise<Result<AuthStatus>> {
    return supabaseAuthRepository.getStatus();
  }

  getSession(): Promise<Result<AuthSession | null>> {
    return supabaseAuthRepository.getSession();
  }

  async signInWithEmail(email: string, password: string): Promise<Result<AuthSession>> {
    const validationError = validateAuthInput(email, password);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    return supabaseAuthRepository.signInWithEmail(email, password);
  }

  async signUpWithEmail(email: string, password: string): Promise<Result<AuthSession>> {
    const validationError = validateAuthInput(email, password);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    return supabaseAuthRepository.signUpWithEmail(email, password);
  }

  signOut(): Promise<Result<void>> {
    return supabaseAuthRepository.signOut();
  }
}

export const authService = new DefaultAuthService();

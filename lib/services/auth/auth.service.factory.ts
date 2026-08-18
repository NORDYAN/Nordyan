import type { Result } from '@/lib/core';
import type { AuthSession, AuthStatus, SignUpOutcome } from '@/lib/domain/auth';
import type { AuthRepository } from '@/lib/repositories/auth.repository';

import {
  authMessages,
  validateAuthInput,
  validateNewPassword,
  validateRecoveryEmail,
} from './auth-errors';
import type { AuthService } from './auth.service.types';

class DefaultAuthService implements AuthService {
  constructor(private readonly repository: AuthRepository) {}

  getStatus(): Promise<Result<AuthStatus>> {
    return this.repository.getStatus();
  }

  getSession(): Promise<Result<AuthSession | null>> {
    return this.repository.getSession();
  }

  async signInWithEmail(email: string, password: string): Promise<Result<AuthSession>> {
    const validationError = validateAuthInput(email, password);
    return validationError
      ? { ok: false, error: validationError }
      : this.repository.signInWithEmail(email, password);
  }

  async signUpWithEmail(email: string, password: string): Promise<Result<SignUpOutcome>> {
    const validationError = validateAuthInput(email, password);
    return validationError
      ? { ok: false, error: validationError }
      : this.repository.signUpWithEmail(email, password);
  }

  async resendSignupVerification(email: string): Promise<Result<void>> {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return {
        ok: false,
        error: { code: 'VALIDATION', message: authMessages.invalidEmail },
      };
    }
    return this.repository.resendSignupVerification(trimmedEmail);
  }

  async requestPasswordRecovery(email: string): Promise<Result<void>> {
    const validationError = validateRecoveryEmail(email);
    if (validationError) {
      return { ok: false, error: validationError };
    }
    return this.repository.requestPasswordRecovery(email.trim());
  }

  exchangeAuthCallbackCode(code: string): Promise<Result<AuthSession>> {
    return this.repository.exchangeAuthCallbackCode(code);
  }

  async updatePassword(password: string, confirmation: string): Promise<Result<void>> {
    const validationError = validateNewPassword(password, confirmation);
    if (validationError) {
      return { ok: false, error: validationError };
    }
    return this.repository.updatePassword(password);
  }

  signOut(): Promise<Result<void>> {
    return this.repository.signOut();
  }
}

export function createAuthService(repository: AuthRepository): AuthService {
  return new DefaultAuthService(repository);
}

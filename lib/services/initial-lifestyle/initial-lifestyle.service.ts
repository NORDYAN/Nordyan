import type { AppError, Result } from '@/lib/core';
import {
  initialLifestyleAnswersValidator,
  type InitialLifestyleCheck,
} from '@/lib/domain/initial-lifestyle';
import type { InitialLifestyleRepository } from '@/lib/repositories/initial-lifestyle.repository';
import { t } from '@/lib/i18n';

import type { InitialLifestyleService } from './initial-lifestyle.service.types';

function requireUserId(userId: string): AppError | null {
  if (!userId.trim()) {
    return { code: 'VALIDATION', message: 'userId krävs.' };
  }

  return null;
}

export class DefaultInitialLifestyleService implements InitialLifestyleService {
  constructor(private readonly repository: InitialLifestyleRepository) {}

  async get(userId: string): Promise<Result<InitialLifestyleCheck | null>> {
    const userError = requireUserId(userId);
    if (userError) {
      return { ok: false, error: userError };
    }

    return this.repository.getByUser(userId);
  }

  async save(userId: string, answers: unknown): Promise<Result<InitialLifestyleCheck>> {
    const userError = requireUserId(userId);
    if (userError) {
      return { ok: false, error: userError };
    }

    const validation = initialLifestyleAnswersValidator.validate(answers);
    if (!validation.valid) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION',
          message: validation.errors[0]?.message ?? t('lifestyle.incomplete'),
        },
      };
    }

    return this.repository.upsert({
      userId,
      answers: validation.value,
    });
  }
}

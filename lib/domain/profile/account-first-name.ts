import type { AppError } from '@/lib/core';
import { t } from '@/lib/i18n';

/** Conservative first-name / display-name limit. Counts Unicode code points. */
export const ACCOUNT_FIRST_NAME_MAX_LENGTH = 80;

export function normalizeAccountFirstName(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
}

export function accountFirstNameCodePointLength(value: string): number {
  return Array.from(value).length;
}

export function validateAccountFirstName(value: string | null): AppError | null {
  if (value === null) {
    return null;
  }

  if (accountFirstNameCodePointLength(value) > ACCOUNT_FIRST_NAME_MAX_LENGTH) {
    return {
      code: 'VALIDATION',
      message: t('profile.account.firstNameTooLong'),
    };
  }

  return null;
}

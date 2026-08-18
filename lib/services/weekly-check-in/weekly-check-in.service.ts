import type { AppError, Result } from '@/lib/core';
import {
  getWeeklyCheckInWeekStartDate,
  isWeeklyCheckInLocalCalendarDate,
  weeklyCheckInAnswersValidator,
  type WeeklyCheckIn,
} from '@/lib/domain/weekly-check-in';
import { t } from '@/lib/i18n';
import type { WeeklyCheckInRepository } from '@/lib/repositories/weekly-check-in.repository';

import type {
  WeeklyCheckInCurrentWeek,
  WeeklyCheckInService,
} from './weekly-check-in.service.types';

function getLocalCalendarDate(reference = new Date()): string {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, '0');
  const day = String(reference.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function requireUserId(userId: string): AppError | null {
  if (!userId.trim()) {
    return { code: 'VALIDATION', message: 'userId krävs.' };
  }

  return null;
}

function resolveCurrentWeekStartDate(localDate?: string): Result<string> {
  const calendarDate = localDate === undefined ? getLocalCalendarDate() : localDate.trim();

  if (!isWeeklyCheckInLocalCalendarDate(calendarDate)) {
    return { ok: false, error: { code: 'VALIDATION', message: 'Ogiltigt lokalt kalenderdatum.' } };
  }

  return { ok: true, value: getWeeklyCheckInWeekStartDate(calendarDate) };
}

export class DefaultWeeklyCheckInService implements WeeklyCheckInService {
  constructor(private readonly repository: WeeklyCheckInRepository) {}

  async getCurrentWeek(
    userId: string,
    localDate?: string,
  ): Promise<Result<WeeklyCheckInCurrentWeek>> {
    const userError = requireUserId(userId);
    if (userError) {
      return { ok: false, error: userError };
    }

    const weekResult = resolveCurrentWeekStartDate(localDate);
    if (!weekResult.ok) {
      return weekResult;
    }

    const weekStartDate = weekResult.value;
    const readResult = await this.repository.getByUserAndWeek(userId, weekStartDate);
    if (!readResult.ok) {
      return readResult;
    }

    if (!readResult.value) {
      return { ok: true, value: { status: 'empty', weekStartDate } };
    }

    return {
      ok: true,
      value: {
        status: 'ready',
        weekStartDate,
        checkIn: readResult.value,
      },
    };
  }

  async saveCurrentWeek(
    userId: string,
    answers: unknown,
    localDate?: string,
  ): Promise<Result<WeeklyCheckIn>> {
    const userError = requireUserId(userId);
    if (userError) {
      return { ok: false, error: userError };
    }

    const validation = weeklyCheckInAnswersValidator.validate(answers);
    if (!validation.valid) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION',
          message: t('weeklyCheckIn.incomplete'),
        },
      };
    }

    const weekResult = resolveCurrentWeekStartDate(localDate);
    if (!weekResult.ok) {
      return weekResult;
    }

    return this.repository.upsertCurrentWeek({
      userId,
      weekStartDate: weekResult.value,
      answers: validation.value,
    });
  }
}

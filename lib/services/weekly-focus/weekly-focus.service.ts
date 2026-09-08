import type { AppError, Result } from '@/lib/core';
import type { InitialLifestyleCheck } from '@/lib/domain/initial-lifestyle';
import type { ProfileActivityLevel } from '@/lib/domain/profile';
import type { HealthSnapshot } from '@/lib/domain/snapshot';
import {
  getPreviousWeeklyCheckInWeekStartDate,
  getWeeklyCheckInWeekStartDate,
  isWeeklyCheckInLocalCalendarDate,
  type WeeklyCheckIn,
} from '@/lib/domain/weekly-check-in';
import {
  determineWeeklyFocus,
  type WeeklyFocusAssignment,
  type WeeklyFocusCheckInInput,
  type WeeklyFocusLifestyleInput,
  type WeeklyFocusSelectedArea,
} from '@/lib/domain/weekly-focus';
import type { WeeklyCheckInRepository } from '@/lib/repositories/weekly-check-in.repository';
import type { WeeklyFocusRepository } from '@/lib/repositories/weekly-focus.repository';
import type { InitialLifestyleService } from '@/lib/services/initial-lifestyle';

export type HomeWeeklyFocusData = {
  weekStartDate: string;
  focuses: [WeeklyFocusSelectedArea, WeeklyFocusSelectedArea];
  recoveryConstraint: boolean;
  engineVersion: string;
  insufficientEvidenceFallback: boolean;
};

export type WeeklyFocusProfileInput =
  | { status: 'loading' }
  | { status: 'ready'; activityLevel: ProfileActivityLevel | null };

export type WeeklyFocusGetOrCreateInput = {
  userId: string;
  localDate?: string;
  profile: WeeklyFocusProfileInput;
};

export type WeeklyFocusGetOrCreateValue =
  | { status: 'ready'; data: HomeWeeklyFocusData }
  | { status: 'not_ready' }
  | { status: 'unavailable' };

export type WeeklyFocusServiceDeps = {
  weeklyFocusRepository: WeeklyFocusRepository;
  weeklyCheckInRepository: Pick<WeeklyCheckInRepository, 'getByUserAndWeek'>;
  initialLifestyle: Pick<InitialLifestyleService, 'get'>;
  getLatestSnapshot: (userId: string) => Promise<Result<HealthSnapshot | null>>;
  determineWeeklyFocus?: typeof determineWeeklyFocus;
};

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

function isUniqueViolation(error: AppError): boolean {
  const cause = error.cause as { code?: string } | undefined;
  return cause?.code === '23505';
}

function toHomeData(assignment: WeeklyFocusAssignment): HomeWeeklyFocusData {
  return {
    weekStartDate: assignment.weekStartDate,
    focuses: assignment.focuses,
    recoveryConstraint: assignment.recoveryConstraint,
    engineVersion: assignment.engineVersion,
    insufficientEvidenceFallback: assignment.insufficientEvidenceFallback,
  };
}

function mapCheckIn(checkIn: WeeklyCheckIn): WeeklyFocusCheckInInput {
  return {
    sleepQuality: checkIn.sleepQuality,
    energy: checkIn.energy,
    stress: checkIn.stress,
    trainingFrequency: checkIn.trainingFrequency,
    everydayActivity: checkIn.everydayActivity,
    eatingQuality: checkIn.eatingQuality,
    alcoholConsumption: checkIn.alcoholConsumption,
    planAdherence: checkIn.planAdherence,
  };
}

function mapLifestyle(record: InitialLifestyleCheck): WeeklyFocusLifestyleInput {
  return {
    sleepQuality: record.sleepQuality,
    energy: record.energy,
    stress: record.stress,
    lessHealthyFoodFrequency: record.lessHealthyFoodFrequency,
    everydayActivity: record.everydayActivity,
    eatingQuality: record.eatingQuality,
    alcoholConsumption: record.alcoholConsumption,
  };
}

export class DefaultWeeklyFocusService {
  constructor(private readonly deps: WeeklyFocusServiceDeps) {}

  async getOrCreateCurrent(
    input: WeeklyFocusGetOrCreateInput,
  ): Promise<Result<WeeklyFocusGetOrCreateValue>> {
    const userError = requireUserId(input.userId);
    if (userError) {
      return { ok: false, error: userError };
    }

    const weekResult = resolveCurrentWeekStartDate(input.localDate);
    if (!weekResult.ok) {
      return weekResult;
    }

    const weekStartDate = weekResult.value;
    const currentResult = await this.deps.weeklyFocusRepository.getByUserAndWeek(
      input.userId,
      weekStartDate,
    );
    if (!currentResult.ok) {
      return currentResult;
    }

    if (currentResult.value) {
      return { ok: true, value: { status: 'ready', data: toHomeData(currentResult.value) } };
    }

    if (input.profile.status === 'loading') {
      return { ok: true, value: { status: 'not_ready' } };
    }

    if (input.profile.activityLevel == null) {
      return { ok: true, value: { status: 'unavailable' } };
    }

    return this.createCurrentWeek(input.userId, weekStartDate, input.profile.activityLevel);
  }

  private async createCurrentWeek(
    userId: string,
    weekStartDate: string,
    activityLevel: ProfileActivityLevel,
  ): Promise<Result<WeeklyFocusGetOrCreateValue>> {
    const previousWeekStartDate = getPreviousWeeklyCheckInWeekStartDate(weekStartDate);

    const [checkInResult, lifestyleResult, snapshotResult, previousFocusResult] = await Promise.all([
      this.deps.weeklyCheckInRepository.getByUserAndWeek(userId, previousWeekStartDate),
      this.deps.initialLifestyle.get(userId),
      this.deps.getLatestSnapshot(userId),
      this.deps.weeklyFocusRepository.getByUserAndWeek(userId, previousWeekStartDate),
    ]);

    if (!checkInResult.ok) {
      return checkInResult;
    }
    if (!lifestyleResult.ok) {
      return lifestyleResult;
    }
    if (!snapshotResult.ok) {
      return snapshotResult;
    }
    if (!previousFocusResult.ok) {
      return previousFocusResult;
    }

    const runEngine = this.deps.determineWeeklyFocus ?? determineWeeklyFocus;
    const engineResult = runEngine({
      weeklyCheckIn: checkInResult.value ? mapCheckIn(checkInResult.value) : null,
      initialLifestyle: lifestyleResult.value ? mapLifestyle(lifestyleResult.value) : null,
      activityLevel,
      primaryFocus: snapshotResult.value?.primaryFocus ?? null,
      previousFocuses: previousFocusResult.value
        ? [previousFocusResult.value.focuses[0].area, previousFocusResult.value.focuses[1].area]
        : null,
    });

    const insertResult = await this.deps.weeklyFocusRepository.insert({
      userId,
      weekStartDate,
      focuses: engineResult.focuses,
      recoveryConstraint: engineResult.recoveryConstraint,
      engineVersion: engineResult.engineVersion,
      insufficientEvidenceFallback: engineResult.insufficientEvidenceFallback,
    });

    if (insertResult.ok) {
      return { ok: true, value: { status: 'ready', data: toHomeData(insertResult.value) } };
    }

    if (isUniqueViolation(insertResult.error)) {
      const winner = await this.deps.weeklyFocusRepository.getByUserAndWeek(userId, weekStartDate);
      if (!winner.ok) {
        return winner;
      }
      if (!winner.value) {
        return { ok: false, error: insertResult.error };
      }
      return { ok: true, value: { status: 'ready', data: toHomeData(winner.value) } };
    }

    return insertResult;
  }
}

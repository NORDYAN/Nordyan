import type { AppError, Result } from '@/lib/core';
import {
  normalizeAccountFirstName,
  validateAccountFirstName,
  type ProfileActivityLevel,
  type ProfileGender,
  type ProfileMeasurements,
  type UserProfile,
} from '@/lib/domain/profile';
import { t } from '@/lib/i18n';
import { PROFILE_ACCOUNT_COPY } from '@/lib/presentation/profile-account';
import { resolveDateOfBirth } from '@/lib/repositories/profile-mappers';
import type { ProfileRepository } from '@/lib/repositories/profile.repository';
import type {
  AccountProfileUpdate,
  ProfileService,
} from '@/lib/services/profile/profile.service.types';

export type ProfileServiceDeps = {
  getCurrentUser: () => Promise<Result<{ id: string } | null>>;
  profileRepository: Pick<ProfileRepository, 'getByUserId' | 'update' | 'createFromMeasurements'>;
};

function toSafeAccountProfileError(error: AppError): AppError {
  if (error.code === 'VALIDATION') {
    return error;
  }

  if (error.code === 'UNAUTHORIZED') {
    return {
      code: 'UNAUTHORIZED',
      message: PROFILE_ACCOUNT_COPY.unauthenticatedMessage,
      cause: error,
    };
  }

  if (error.code === 'NOT_FOUND') {
    return {
      code: 'NOT_FOUND',
      message: PROFILE_ACCOUNT_COPY.notFoundMessage,
      cause: error,
    };
  }

  return {
    code: error.code,
    message: PROFILE_ACCOUNT_COPY.saveErrorMessage,
    cause: error,
  };
}

function toSafeProfileReadError(error: AppError): AppError {
  return {
    code: error.code,
    message:
      error.code === 'UNAUTHORIZED'
        ? t('profile.validation.unauthenticatedRead')
        : PROFILE_ACCOUNT_COPY.loadErrorMessage,
    cause: error,
  };
}

function toSafeHealthProfileError(error: AppError): AppError {
  if (error.code === 'VALIDATION') {
    return error;
  }

  return {
    code: error.code,
    message:
      error.code === 'UNAUTHORIZED'
        ? t('profile.validation.unauthenticatedSave')
        : t('onboarding.syncError'),
    cause: error,
  };
}

export class DefaultProfileService implements ProfileService {
  constructor(private readonly deps: ProfileServiceDeps) {}

  async getCurrentProfile(): Promise<Result<UserProfile | null>> {
    const userResult = await this.deps.getCurrentUser();
    if (!userResult.ok) {
      return { ok: false, error: toSafeProfileReadError(userResult.error) };
    }

    if (!userResult.value) {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: t('profile.validation.unauthenticatedRead') },
      };
    }

    const profileResult = await this.deps.profileRepository.getByUserId(userResult.value.id);
    return profileResult.ok
      ? profileResult
      : { ok: false, error: toSafeProfileReadError(profileResult.error) };
  }

  async completeOnboarding(measurements: ProfileMeasurements): Promise<Result<UserProfile>> {
    const validationError = validateMeasurements(measurements);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    const userResult = await this.deps.getCurrentUser();
    if (!userResult.ok) {
      return { ok: false, error: toSafeHealthProfileError(userResult.error) };
    }

    if (!userResult.value) {
      return {
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: t('profile.validation.unauthenticatedSave'),
        },
      };
    }

    const userId = userResult.value.id;
    const existingResult = await this.deps.profileRepository.getByUserId(userId);
    if (!existingResult.ok) {
      return { ok: false, error: toSafeHealthProfileError(existingResult.error) };
    }

    if (!existingResult.value) {
      const createResult = await this.deps.profileRepository.createFromMeasurements(
        userId,
        measurements,
      );
      return createResult.ok
        ? createResult
        : { ok: false, error: toSafeHealthProfileError(createResult.error) };
    }

    const dateOfBirth =
      resolveDateOfBirth(measurements) ?? existingResult.value.dateOfBirth;
    const existing = existingResult.value;

    const updateResult = await this.deps.profileRepository.update(userId, {
      firstName: measurements.firstName ?? existing.firstName,
      dateOfBirth,
      gender: measurements.gender ?? existing.gender,
      heightCm: measurements.heightCm,
      weightKg: measurements.weightKg ?? existing.weightKg,
      waistCm: measurements.waistCm ?? existing.waistCm,
      neckCm: measurements.neckCm ?? existing.neckCm,
      activityLevel: measurements.activityLevel ?? existing.activityLevel,
      goal: measurements.goal ?? existing.goal,
    });
    return updateResult.ok
      ? updateResult
      : { ok: false, error: toSafeHealthProfileError(updateResult.error) };
  }

  async updateAccountProfile(update: AccountProfileUpdate): Promise<Result<UserProfile>> {
    const firstName = normalizeAccountFirstName(update.firstName);
    const validationError = validateAccountFirstName(firstName);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    const userResult = await this.deps.getCurrentUser();
    if (!userResult.ok) {
      return { ok: false, error: toSafeAccountProfileError(userResult.error) };
    }

    if (!userResult.value) {
      return {
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: PROFILE_ACCOUNT_COPY.unauthenticatedMessage,
        },
      };
    }

    const userId = userResult.value.id;
    const existingResult = await this.deps.profileRepository.getByUserId(userId);
    if (!existingResult.ok) {
      return { ok: false, error: toSafeAccountProfileError(existingResult.error) };
    }

    if (!existingResult.value) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: PROFILE_ACCOUNT_COPY.notFoundMessage,
        },
      };
    }

    const updateResult = await this.deps.profileRepository.update(userId, { firstName });
    if (!updateResult.ok) {
      return { ok: false, error: toSafeAccountProfileError(updateResult.error) };
    }

    return updateResult;
  }
}

function validateMeasurements(measurements: ProfileMeasurements): AppError | null {
  if (!Number.isFinite(measurements.heightCm) || measurements.heightCm <= 0) {
    return {
      code: 'VALIDATION',
      message: t('profile.validation.height'),
    };
  }

  if (
    measurements.weightKg !== undefined &&
    (!Number.isFinite(measurements.weightKg) || measurements.weightKg <= 0)
  ) {
    return {
      code: 'VALIDATION',
      message: t('profile.validation.weight'),
    };
  }

  if (
    measurements.waistCm !== undefined &&
    (!Number.isFinite(measurements.waistCm) || measurements.waistCm <= 0)
  ) {
    return {
      code: 'VALIDATION',
      message: t('profile.validation.waist'),
    };
  }

  if (
    measurements.neckCm !== undefined &&
    (!Number.isFinite(measurements.neckCm) || measurements.neckCm <= 0)
  ) {
    return {
      code: 'VALIDATION',
      message: t('profile.validation.neck'),
    };
  }

  if (
    measurements.age !== undefined &&
    (!Number.isFinite(measurements.age) || measurements.age <= 0)
  ) {
    return {
      code: 'VALIDATION',
      message: t('profile.validation.age'),
    };
  }

  if (!resolveDateOfBirth(measurements)) {
    return {
      code: 'VALIDATION',
      message: t('profile.validation.dateOfBirth'),
    };
  }

  if (!isProfileGender(measurements.gender)) {
    return {
      code: 'VALIDATION',
      message: t('profile.validation.gender'),
    };
  }

  if (!isProfileActivityLevel(measurements.activityLevel)) {
    return {
      code: 'VALIDATION',
      message: t('profile.validation.activityLevel'),
    };
  }

  return null;
}

function isProfileGender(value: ProfileGender | null | undefined): value is ProfileGender {
  return value === 'male' || value === 'female' || value === 'other';
}

function isProfileActivityLevel(
  value: ProfileActivityLevel | null | undefined,
): value is ProfileActivityLevel {
  return (
    value === 'sedentary' ||
    value === 'lightly_active' ||
    value === 'moderately_active' ||
    value === 'very_active' ||
    value === 'extra_active'
  );
}

export function createProfileService(deps: ProfileServiceDeps): ProfileService {
  return new DefaultProfileService(deps);
}

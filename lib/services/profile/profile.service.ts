import type { AppError, Result } from '@/lib/core';
import type { ProfileActivityLevel, ProfileGender, ProfileMeasurements, UserProfile } from '@/lib/domain/profile';
import { resolveDateOfBirth } from '@/lib/repositories/profile-mappers';
import { supabaseAuthRepository } from '@/lib/repositories/supabase-auth.repository';
import { supabaseProfileRepository } from '@/lib/repositories/supabase-profile.repository';
import type { ProfileService } from '@/lib/services/profile/profile.service.types';

class DefaultProfileService implements ProfileService {
  async getCurrentProfile(): Promise<Result<UserProfile | null>> {
    const userResult = await supabaseAuthRepository.getCurrentUser();
    if (!userResult.ok) {
      return userResult;
    }

    if (!userResult.value) {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Du måste vara inloggad för att läsa profilen.' },
      };
    }

    return supabaseProfileRepository.getByUserId(userResult.value.id);
  }

  async completeOnboarding(measurements: ProfileMeasurements): Promise<Result<UserProfile>> {
    const validationError = validateMeasurements(measurements);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    const userResult = await supabaseAuthRepository.getCurrentUser();
    if (!userResult.ok) {
      return userResult;
    }

    if (!userResult.value) {
      return {
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Du måste vara inloggad för att spara din hälsoprofil.',
        },
      };
    }

    const userId = userResult.value.id;
    const existingResult = await supabaseProfileRepository.getByUserId(userId);
    if (!existingResult.ok) {
      return existingResult;
    }

    if (!existingResult.value) {
      return supabaseProfileRepository.createFromMeasurements(userId, measurements);
    }

    const dateOfBirth =
      resolveDateOfBirth(measurements) ?? existingResult.value.dateOfBirth;
    const existing = existingResult.value;

    return supabaseProfileRepository.update(userId, {
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
  }
}

function validateMeasurements(measurements: ProfileMeasurements): AppError | null {
  if (!Number.isFinite(measurements.heightCm) || measurements.heightCm <= 0) {
    return {
      code: 'VALIDATION',
      message: 'Ogiltigt värde för heightCm.',
    };
  }

  if (
    measurements.weightKg !== undefined &&
    (!Number.isFinite(measurements.weightKg) || measurements.weightKg <= 0)
  ) {
    return {
      code: 'VALIDATION',
      message: 'Ogiltigt värde för weightKg.',
    };
  }

  if (
    measurements.waistCm !== undefined &&
    (!Number.isFinite(measurements.waistCm) || measurements.waistCm <= 0)
  ) {
    return {
      code: 'VALIDATION',
      message: 'Ogiltigt värde för waistCm.',
    };
  }

  if (
    measurements.neckCm !== undefined &&
    (!Number.isFinite(measurements.neckCm) || measurements.neckCm <= 0)
  ) {
    return {
      code: 'VALIDATION',
      message: 'Ogiltigt värde för neckCm.',
    };
  }

  if (
    measurements.age !== undefined &&
    (!Number.isFinite(measurements.age) || measurements.age <= 0)
  ) {
    return {
      code: 'VALIDATION',
      message: 'Ogiltig ålder.',
    };
  }

  if (!resolveDateOfBirth(measurements)) {
    return {
      code: 'VALIDATION',
      message: 'Ange födelsedatum.',
    };
  }

  if (!isProfileGender(measurements.gender)) {
    return {
      code: 'VALIDATION',
      message: 'Välj kön.',
    };
  }

  if (!isProfileActivityLevel(measurements.activityLevel)) {
    return {
      code: 'VALIDATION',
      message: 'Välj aktivitetsnivå.',
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

export const profileService = new DefaultProfileService();

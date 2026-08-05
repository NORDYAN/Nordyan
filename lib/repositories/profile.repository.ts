import type { Result } from '@/lib/core';
import type { ProfileMeasurements, UserProfile } from '@/lib/domain/profile';

export interface ProfileRepository {
  getByUserId(userId: string): Promise<Result<UserProfile | null>>;
  createFromMeasurements(
    userId: string,
    measurements: ProfileMeasurements,
  ): Promise<Result<UserProfile>>;
  update(userId: string, patch: Partial<UserProfile>): Promise<Result<UserProfile>>;
}

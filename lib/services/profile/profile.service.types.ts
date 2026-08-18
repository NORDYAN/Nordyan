import type { Result } from '@/lib/core';
import type { ProfileMeasurements, UserProfile } from '@/lib/domain/profile';

export type AccountProfileUpdate = {
  firstName: string | null;
};

export interface ProfileService {
  getCurrentProfile(): Promise<Result<UserProfile | null>>;
  completeOnboarding(measurements: ProfileMeasurements): Promise<Result<UserProfile>>;
  updateAccountProfile(update: AccountProfileUpdate): Promise<Result<UserProfile>>;
}

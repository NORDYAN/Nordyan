import type { Result } from '@/lib/core';
import type { ProfileMeasurements, UserProfile } from '@/lib/domain/profile';

export interface ProfileService {
  getCurrentProfile(): Promise<Result<UserProfile | null>>;
  completeOnboarding(measurements: ProfileMeasurements): Promise<Result<UserProfile>>;
}

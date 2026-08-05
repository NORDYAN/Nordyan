export type ProfileGender = 'male' | 'female' | 'other';

export type ProfileActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

export type ProfileGoal = 'lose_weight' | 'maintain' | 'gain_muscle' | 'improve_health';

export type UserProfile = {
  id: string;
  userId: string;
  firstName: string | null;
  dateOfBirth: string | null;
  gender: ProfileGender | null;
  heightCm: number | null;
  weightKg: number | null;
  waistCm: number | null;
  neckCm: number | null;
  activityLevel: ProfileActivityLevel | null;
  goal: ProfileGoal | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileMeasurements = {
  firstName?: string | null;
  dateOfBirth?: string | null;
  /** Onboarding form convenience; converted to dateOfBirth when DOB is omitted. */
  age?: number;
  gender?: ProfileGender | null;
  heightCm: number;
  /** Initial body weight from onboarding. Optional on profile-only updates. */
  weightKg?: number;
  /** Collected only via Health → New Measurement. */
  waistCm?: number;
  neckCm?: number;
  activityLevel?: ProfileActivityLevel | null;
  goal?: ProfileGoal | null;
};

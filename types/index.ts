export type PlanTier = 'free' | 'premium';

export type MockAppState = {
  hasCompletedOnboarding: boolean;
  userDisplayName: string;
  plan: PlanTier;
};

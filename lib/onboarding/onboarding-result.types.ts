import type { OnboardingResultUnavailableReason } from './onboarding-forensics';

export type OnboardingResultState =
  | { status: 'loading' }
  | { status: 'unavailable'; reason: OnboardingResultUnavailableReason }
  | {
      status: 'ready';
      bodyFatAvailable: boolean;
      bodyFatPercentLabel: string;
      healthScoreLabel: string;
      coachTitle: string;
      coachMessage: string;
    };

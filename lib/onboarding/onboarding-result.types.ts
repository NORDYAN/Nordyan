export type OnboardingResultState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | {
      status: 'ready';
      bodyFatPercentLabel: string;
      healthScoreLabel: string;
      coachTitle: string;
      coachMessage: string;
    };

export type HealthScoreExplainedFactorId = 'waist' | 'activity' | 'sleep' | 'weight';

export type HealthScoreExplainedFactorTone = 'positive' | 'negative' | 'neutral' | 'limitation';

export type HealthScoreExplainedFactorCard = {
  id: HealthScoreExplainedFactorId;
  label: string;
  statusLabel: string;
  body: string;
  tone: HealthScoreExplainedFactorTone;
};

export type HealthScoreExplainedScoreChangeView =
  | {
      status: 'ready';
      direction: 'up' | 'down' | 'stable';
      text: string;
    }
  | {
      status: 'insufficient_history';
      text: string;
    };

export type HealthScoreExplainedCoachView =
  | {
      available: true;
      title: string;
      body: string;
    }
  | {
      available: false;
      title: null;
      body: null;
    };

export type HealthScoreExplainedViewModel = {
  currentScore: number;
  scoreBandLabel: string;
  scoreChange: HealthScoreExplainedScoreChangeView;
  historyStatus: 'comparable' | 'insufficient_history';
  factors: HealthScoreExplainedFactorCard[];
  coach: HealthScoreExplainedCoachView;
};

export type HealthScoreExplainedFetchState =
  | { status: 'loading' }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; model: HealthScoreExplainedViewModel }
  | { status: 'insufficient_history'; model: HealthScoreExplainedViewModel };

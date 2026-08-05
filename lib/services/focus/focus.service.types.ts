import type { FocusEngineResult } from '@/lib/domain/focus-engine';
import type { HealthScoreDriverMetric } from '@/lib/domain/health-score';
import type { FocusPriority, FocusType } from '@/lib/domain/focus-engine';

export type HomePrimaryFocusState =
  | { status: 'loading' }
  | {
      status: 'ready';
      title: string;
      subtitle: string;
      primaryFocus: FocusType;
      expectedScoreGain: number;
      priority: FocusPriority;
      confidence: number;
      driver: HealthScoreDriverMetric;
      result: FocusEngineResult;
    }
  | { status: 'unavailable' };

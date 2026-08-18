import type { FocusType } from '@/lib/domain/focus-engine';

export type CoachHomeSummary =
  | { status: 'empty' }
  | {
      status: 'ready';
      focus: {
        type: FocusType;
        title: string;
        subtitle: string;
      };
      plan:
        | {
            available: true;
            recommendationId: string;
            title: string;
            description: string;
            durationMinutes: number;
            frequencyPerWeek: number;
          }
        | {
            available: false;
            recommendationId: string | null;
          };
    };

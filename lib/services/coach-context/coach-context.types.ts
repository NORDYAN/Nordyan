import type { CoachAskRequestV17 } from '@/shared/coach-language';

export type CoachAskComposeResult =
  | { status: 'ready'; request: CoachAskRequestV17 }
  | { status: 'unavailable'; reason: 'no_plan' | 'empty' };

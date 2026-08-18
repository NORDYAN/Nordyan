import type { CoachAskRequestV16 } from '@/shared/coach-language';

export type CoachAskComposeResult =
  | { status: 'ready'; request: CoachAskRequestV16 }
  | { status: 'unavailable'; reason: 'no_plan' | 'empty' };

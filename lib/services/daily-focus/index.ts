import { supabaseWeeklyCheckInRepository } from '@/lib/repositories/supabase-weekly-check-in.repository';
import { supabaseDailyFocusRepository } from '@/lib/repositories/supabase-daily-focus.repository';
import { supabaseWeeklyFocusRepository } from '@/lib/repositories/supabase-weekly-focus.repository';
import { initialLifestyleService } from '@/lib/services/initial-lifestyle';

import { DefaultDailyFocusService } from './daily-focus.service';

export { DefaultDailyFocusService } from './daily-focus.service';
export type {
  DailyFocusGetOrCreateValue,
  DailyFocusMutationValue,
  DailyFocusReadyPayload,
  DailyFocusServiceDeps,
  DailyFocusWeekProgressValue,
  DailyFocusWeeklyFocusInput,
} from './daily-focus.service';
export { resolveLessHealthyFoodRelevant } from './less-healthy-food-relevance';

export const dailyFocusService = new DefaultDailyFocusService({
  dailyFocusRepository: supabaseDailyFocusRepository,
  weeklyFocusRepository: supabaseWeeklyFocusRepository,
  weeklyCheckInRepository: supabaseWeeklyCheckInRepository,
  initialLifestyle: initialLifestyleService,
});

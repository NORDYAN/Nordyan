import { supabaseWeeklyCheckInRepository } from '@/lib/repositories/supabase-weekly-check-in.repository';

import { DefaultWeeklyCheckInService } from './weekly-check-in.service';

export { DefaultWeeklyCheckInService } from './weekly-check-in.service';
export type {
  WeeklyCheckInCurrentWeek,
  WeeklyCheckInService,
} from './weekly-check-in.service.types';

export const weeklyCheckInService = new DefaultWeeklyCheckInService(
  supabaseWeeklyCheckInRepository,
);

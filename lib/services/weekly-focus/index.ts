export type {
  HomeWeeklyFocusData,
  WeeklyFocusGetOrCreateInput,
  WeeklyFocusGetOrCreateValue,
  WeeklyFocusProfileInput,
  WeeklyFocusServiceDeps,
} from './weekly-focus.service';
export { DefaultWeeklyFocusService } from './weekly-focus.service';

import { supabaseWeeklyCheckInRepository } from '@/lib/repositories/supabase-weekly-check-in.repository';
import { supabaseWeeklyFocusRepository } from '@/lib/repositories/supabase-weekly-focus.repository';
import { initialLifestyleService } from '@/lib/services/initial-lifestyle';
import { snapshotService } from '@/lib/services/snapshots';

import { DefaultWeeklyFocusService } from './weekly-focus.service';

export const weeklyFocusService = new DefaultWeeklyFocusService({
  weeklyFocusRepository: supabaseWeeklyFocusRepository,
  weeklyCheckInRepository: supabaseWeeklyCheckInRepository,
  initialLifestyle: initialLifestyleService,
  getLatestSnapshot: (userId) => snapshotService.getLatestSnapshot(userId),
});

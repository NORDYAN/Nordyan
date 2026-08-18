import type { Result } from '@/lib/core';
import type { AppLocale } from '@/lib/i18n';
import { supabaseProfileRepository } from '@/lib/repositories/supabase-profile.repository';
import { coachHomeService } from '@/lib/services/coach-home';
import { developmentService } from '@/lib/services/development';
import { initialLifestyleService } from '@/lib/services/initial-lifestyle';
import { snapshotService } from '@/lib/services/snapshots';
import { weeklyCheckInService } from '@/lib/services/weekly-check-in';

import {
  composeCoachAskRequest as composeWithDeps,
  type ComposeCoachAskRequestDeps,
} from './coach-context.composer';
import type { CoachAskComposeResult } from './coach-context.types';

const defaultDeps: ComposeCoachAskRequestDeps = {
  getCoachHomeSummary: (userId) => coachHomeService.getHomeSummary(userId),
  getDevelopmentHomeSummary: (userId) => developmentService.getHomeSummary(userId),
  getCurrentWeekWeeklyCheckIn: (userId) => weeklyCheckInService.getCurrentWeek(userId),
  getInitialLifestyle: (userId) => initialLifestyleService.get(userId),
  getLatestSnapshot: (userId) => snapshotService.getLatestSnapshot(userId),
  getProfile: (userId) => supabaseProfileRepository.getByUserId(userId),
};

export interface CoachContextService {
  composeAskRequest(
    userId: string,
    question: string,
    locale: AppLocale,
  ): Promise<Result<CoachAskComposeResult>>;
}

class DefaultCoachContextService implements CoachContextService {
  async composeAskRequest(
    userId: string,
    question: string,
    locale: AppLocale,
  ): Promise<Result<CoachAskComposeResult>> {
    return composeWithDeps(userId, question, defaultDeps, locale);
  }
}

export const coachContextService: CoachContextService = new DefaultCoachContextService();

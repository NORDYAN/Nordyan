import { useCallback, useEffect, useRef, useState } from 'react';

import { isCoachAskFocusType, type CoachAskFocusType } from '@/shared/coach-language';
import type { ProfileActivityLevel } from '@/lib/domain/profile';
import type { WeeklyFocusArea } from '@/lib/domain/weekly-focus';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useCurrentProfile } from '@/lib/hooks/profile';
import type { CoachHomeQuickQuestionSlot } from '@/lib/presentation/coach-home/coach-home.types';
import { buildCoachQuickQuestionSlots } from '@/lib/presentation/coach-quick-questions/coach-quick-questions.presentation';
import { loadCoachQuickQuestionSignals } from '@/lib/presentation/coach-quick-questions/coach-quick-questions.load';
import { supabaseProfileRepository } from '@/lib/repositories/supabase-profile.repository';
import { developmentService } from '@/lib/services/development';
import { initialLifestyleService } from '@/lib/services/initial-lifestyle';
import { snapshotService } from '@/lib/services/snapshots';
import { weeklyCheckInService } from '@/lib/services/weekly-check-in';
import { weeklyFocusService } from '@/lib/services/weekly-focus';
import { useAuth } from '@/providers/auth-provider';

type UseCoachQuickQuestionsInput = {
  hasHealthContext: boolean;
  focusType: string | null;
};

async function loadWeeklyFocusImproveAreas(input: {
  userId: string;
  activityLevel: ProfileActivityLevel | null | undefined;
}): Promise<readonly WeeklyFocusArea[]> {
  const result = await weeklyFocusService.getOrCreateCurrent({
    userId: input.userId,
    profile: { status: 'ready', activityLevel: input.activityLevel ?? null },
  });
  if (!result.ok || result.value.status !== 'ready') {
    return [];
  }
  return result.value.data.focuses
    .filter((focus) => focus.mode === 'improve')
    .map((focus) => focus.area);
}

export function useCoachQuickQuestions(
  input: UseCoachQuickQuestionsInput,
): { slots: readonly CoachHomeQuickQuestionSlot[] } {
  const { session } = useAuth();
  const { locale } = useI18n();
  const { profile, isLoading: isProfileLoading } = useCurrentProfile();
  const [slots, setSlots] = useState<readonly CoachHomeQuickQuestionSlot[]>([]);
  const userId = session?.user.id ?? null;
  const requestIdRef = useRef(0);

  const focusType: CoachAskFocusType | null = isCoachAskFocusType(input.focusType ?? '')
    ? input.focusType
    : null;

  const loadSlots = useCallback(async () => {
    if (!userId) {
      setSlots([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    const signals = await loadCoachQuickQuestionSignals({
      userId,
      hasHealthContext: input.hasHealthContext,
      focusType,
      deps: {
        getDevelopmentHomeSummary: (id) => developmentService.getHomeSummary(id),
        getCurrentWeekWeeklyCheckIn: (id) => weeklyCheckInService.getCurrentWeek(id),
        getInitialLifestyle: (id) => initialLifestyleService.get(id),
        getLatestSnapshot: (id) => snapshotService.getLatestSnapshot(id),
        getProfile: (id) => supabaseProfileRepository.getByUserId(id),
        getWeeklyFocusImproveAreas: async (id) => {
          if (isProfileLoading) {
            return [];
          }
          return loadWeeklyFocusImproveAreas({
            userId: id,
            activityLevel: profile?.activityLevel,
          });
        },
      },
    });

    if (requestId !== requestIdRef.current) {
      return;
    }
    setSlots(buildCoachQuickQuestionSlots(signals, locale));
  }, [
    focusType,
    input.hasHealthContext,
    isProfileLoading,
    locale,
    profile?.activityLevel,
    userId,
  ]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  return { slots };
}

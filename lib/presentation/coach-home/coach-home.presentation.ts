import { t } from '@/lib/i18n';
import type { CoachHomeSummary } from '@/lib/services/coach-home';

import { buildCoachQuickQuestionSlots } from '@/lib/presentation/coach-quick-questions/coach-quick-questions.presentation';
import type { CoachQuickQuestionSignals } from '@/lib/domain/coach-quick-questions';

import {
  COACH_HOME_SECTION_ORDER,
  type CoachHomeFetchState,
  type CoachHomeQuickQuestionSlot,
  type CoachHomeSectionId,
  type CoachHomeViewModel,
} from './coach-home.types';

export function getCoachHomeEmptyMessage(): string {
  return t('coach.empty');
}

export function getCoachHomeErrorMessage(): string {
  return t('coach.error');
}

/**
 * Builds up to three localized quick-question slots from Coach Ask evidence.
 * Does not invent questions the current Ask context cannot ground.
 */
export function selectCoachHomeQuickQuestionSlots(
  signals: CoachQuickQuestionSignals,
): readonly CoachHomeQuickQuestionSlot[] {
  return buildCoachQuickQuestionSlots(signals);
}

export function listCoachHomeReadySections(): readonly CoachHomeSectionId[] {
  return COACH_HOME_SECTION_ORDER;
}

export function buildCoachHomeViewModel(
  summary: Extract<CoachHomeSummary, { status: 'ready' }>,
): CoachHomeViewModel {
  const askContext =
    summary.plan.available === true
      ? {
          focus: {
            type: summary.focus.type,
            title: summary.focus.title,
            subtitle: summary.focus.subtitle,
          },
          plan: {
            recommendationId: summary.plan.recommendationId,
            title: summary.plan.title,
            description: summary.plan.description,
            durationMinutes: summary.plan.durationMinutes,
            frequencyPerWeek: summary.plan.frequencyPerWeek,
          },
        }
      : null;
  const canAsk = askContext != null;
  const quickQuestionSlots: readonly CoachHomeQuickQuestionSlot[] = [];
  const focusBridge = canAsk
    ? {
        visible: true as const,
        title: t('coach.bridge.title'),
        body: t('coach.bridge.body'),
        ctaLabel: t('coach.bridge.cta'),
      }
    : { visible: false as const };

  return {
    header: {
      title: t('coach.header.title'),
      coachLabel: t('coach.header.label'),
      coachSubtitle: t('coach.header.subtitle'),
    },
    focusBridge,
    ask: {
      sectionLabel: t('coach.ask.section'),
      inputPlaceholder: t('coach.ask.placeholder'),
      footnote: t('coach.ask.footnote'),
      canAsk,
      askContext,
      quickQuestionsSectionLabel: t('coach.ask.quickQuestions'),
      quickQuestionSlots,
      suggestedQuestions: quickQuestionSlots.map((slot) => slot.question),
    },
  };
}

export function mapCoachHomeSummaryToFetchState(
  summary: CoachHomeSummary,
): Exclude<CoachHomeFetchState, { status: 'loading' | 'error' }> {
  if (summary.status === 'empty') {
    return { status: 'empty', message: t('coach.empty') };
  }

  return { status: 'ready', model: buildCoachHomeViewModel(summary) };
}

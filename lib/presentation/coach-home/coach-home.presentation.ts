import {
  formatPlanFrequencyCount,
  getLocalizedCoachPresentation,
  getLocalizedFocusPresentation,
  matchesTranslatedLabel,
  t,
} from '@/lib/i18n';
import type { CoachHomeSummary } from '@/lib/services/coach-home';

import {
  COACH_HOME_CONTEXTUAL_QUESTION_CATALOG,
  COACH_HOME_SECTION_ORDER,
  COACH_HOME_STABLE_QUICK_QUESTIONS,
  type CoachHomeFetchState,
  type CoachHomeQuickQuestionContext,
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

export const COACH_HOME_PLAN_UNAVAILABLE_MESSAGE = () => t('coach.planUnavailable');

function formatDurationText(minutes: number): string {
  return t('common.min', { minutes });
}

export function isCoachHomeBodyFatComparisonQuestion(question: string): boolean {
  return matchesTranslatedLabel(question, 'coach.quick.bodyFatComparison');
}

/**
 * Builds the three quick-question slots.
 * Outer questions are stable. The middle slot is contextual and can be replaced
 * from local presentation context without Coach Context / engine changes.
 */
export function selectCoachHomeQuickQuestionSlots(
  context: CoachHomeQuickQuestionContext = {},
): readonly [
  CoachHomeQuickQuestionSlot,
  CoachHomeQuickQuestionSlot,
  CoachHomeQuickQuestionSlot,
] {
  const contextualQuestion = context.bodyFatComparisonUsed
    ? COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.planMoreEffective
    : COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.bodyFatComparison;

  return [
    {
      id: 'why-focus',
      kind: 'stable',
      question: COACH_HOME_STABLE_QUICK_QUESTIONS.whyFocus,
    },
    {
      id: 'contextual',
      kind: 'contextual',
      question: contextualQuestion,
    },
    {
      id: 'instead-today',
      kind: 'stable',
      question: COACH_HOME_STABLE_QUICK_QUESTIONS.insteadToday,
    },
  ];
}

export function listCoachHomeReadySections(): readonly CoachHomeSectionId[] {
  return COACH_HOME_SECTION_ORDER;
}

export function buildCoachHomeViewModel(
  summary: Extract<CoachHomeSummary, { status: 'ready' }>,
): CoachHomeViewModel {
  const focusDisplay = getLocalizedFocusPresentation(summary.focus.type);
  const planDisplay =
    summary.plan.available === true
      ? getLocalizedCoachPresentation(
          summary.plan.recommendationId,
          summary.plan.durationMinutes,
          summary.plan.frequencyPerWeek,
        )
      : null;

  const plan =
    summary.plan.available === true && planDisplay
      ? {
          available: true as const,
          sectionLabel: t('coach.plan.section'),
          title: planDisplay.title,
          description: planDisplay.description,
          durationText: formatDurationText(summary.plan.durationMinutes),
          frequencyText: formatPlanFrequencyCount(summary.plan.frequencyPerWeek),
        }
      : {
          available: false as const,
          sectionLabel: t('coach.plan.section'),
          unavailableMessage: t('coach.planUnavailable'),
        };

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
  const quickQuestionSlots = selectCoachHomeQuickQuestionSlots();

  return {
    header: {
      title: t('coach.header.title'),
      coachLabel: t('coach.header.label'),
      coachSubtitle: t('coach.header.subtitle'),
    },
    focus: {
      sectionLabel: t('coach.focus.section'),
      title: focusDisplay.title,
      body: focusDisplay.subtitle,
    },
    plan,
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

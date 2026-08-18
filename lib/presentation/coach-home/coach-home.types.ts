import type { FocusType } from '@/lib/domain/focus-engine';
import { liveArray, liveCopy, t } from '@/lib/i18n';

/** Ready-state visual order for Coach Home. Composer is primary and appears once. */
export const COACH_HOME_SECTION_ORDER = [
  'identity',
  'composer',
  'focus',
  'plan',
  'quickQuestions',
] as const;

export type CoachHomeSectionId = (typeof COACH_HOME_SECTION_ORDER)[number];

export const COACH_HOME_STABLE_QUICK_QUESTIONS = liveCopy({
  whyFocus: () => t('coach.quick.whyFocus'),
  insteadToday: () => t('coach.quick.insteadToday'),
});

export const COACH_HOME_CONTEXTUAL_QUESTION_CATALOG = liveCopy({
  bodyFatComparison: () => t('coach.quick.bodyFatComparison'),
  planMoreEffective: () => t('coach.quick.planMoreEffective'),
  prioritizeToday: () => t('coach.quick.prioritizeToday'),
  adaptThisWeek: () => t('coach.quick.adaptThisWeek'),
});

export type CoachHomeStableQuickQuestion = string;

export type CoachHomeContextualQuestionId = keyof typeof COACH_HOME_CONTEXTUAL_QUESTION_CATALOG;

export type CoachHomeContextualQuickQuestion = string;

export type CoachHomeSuggestedQuestion = string;

/** Default first-paint chips. Middle slot is contextual, not a permanent daily question. */
export const COACH_HOME_SUGGESTED_QUESTIONS = liveArray(() => [
  COACH_HOME_STABLE_QUICK_QUESTIONS.whyFocus,
  COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.bodyFatComparison,
  COACH_HOME_STABLE_QUICK_QUESTIONS.insteadToday,
]);

export type CoachHomeQuickQuestionSlotId = 'why-focus' | 'contextual' | 'instead-today';

export type CoachHomeQuickQuestionSlot = {
  id: CoachHomeQuickQuestionSlotId;
  kind: 'stable' | 'contextual';
  question: CoachHomeSuggestedQuestion;
};

export type CoachHomeQuickQuestionContext = {
  /**
   * Per-user local flag: the body-fat comparison discovery question has been used.
   * Persisted on-device only; never stored as Coach Ask history.
   */
  bodyFatComparisonUsed?: boolean;
};

export type CoachHomeAskContext = {
  focus: {
    type: FocusType;
    title: string;
    subtitle: string;
  };
  plan: {
    recommendationId: string;
    title: string;
    description: string;
    durationMinutes: number | null;
    frequencyPerWeek: number | null;
  };
};

export type CoachHomeViewModel = {
  header: {
    title: string;
    coachLabel: string;
    coachSubtitle: string;
  };
  focus: {
    sectionLabel: string;
    title: string;
    body: string;
  };
  plan:
    | {
        available: true;
        sectionLabel: string;
        title: string;
        description: string;
        durationText: string;
        frequencyText: string;
      }
    | {
        available: false;
        sectionLabel: string;
        unavailableMessage: string;
      };
  ask: {
    sectionLabel: string;
    inputPlaceholder: string;
    footnote: string;
    /** True when a usable plan exists for grounded Q&A. */
    canAsk: boolean;
    askContext: CoachHomeAskContext | null;
    quickQuestionsSectionLabel: string;
    quickQuestionSlots: readonly [
      CoachHomeQuickQuestionSlot,
      CoachHomeQuickQuestionSlot,
      CoachHomeQuickQuestionSlot,
    ];
    suggestedQuestions: readonly CoachHomeSuggestedQuestion[];
  };
};

export type CoachHomeFetchState =
  | { status: 'loading' }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; model: CoachHomeViewModel };

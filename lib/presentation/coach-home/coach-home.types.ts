import type { FocusType } from '@/lib/domain/focus-engine';

/** Ready-state visual order for Coach Home. Composer is primary and appears once. */
export const COACH_HOME_SECTION_ORDER = [
  'identity',
  'focusBridge',
  'composer',
  'quickQuestions',
] as const;

export type CoachHomeSectionId = (typeof COACH_HOME_SECTION_ORDER)[number];

export type CoachHomeSuggestedQuestion = string;

export type CoachHomeQuickQuestionSlotId = string;

export type CoachHomeQuickQuestionSlot = {
  id: CoachHomeQuickQuestionSlotId;
  kind: 'stable' | 'contextual';
  question: CoachHomeSuggestedQuestion;
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
  focusBridge:
    | {
        visible: true;
        title: string;
        body: string;
        ctaLabel: string;
      }
    | {
        visible: false;
      };
  ask: {
    sectionLabel: string;
    inputPlaceholder: string;
    footnote: string;
    /** True when a usable plan exists for grounded Q&A. */
    canAsk: boolean;
    askContext: CoachHomeAskContext | null;
    quickQuestionsSectionLabel: string;
    quickQuestionSlots: readonly CoachHomeQuickQuestionSlot[];
    suggestedQuestions: readonly CoachHomeSuggestedQuestion[];
  };
};

export type CoachHomeFetchState =
  | { status: 'loading' }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; model: CoachHomeViewModel };

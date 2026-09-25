import { t, type AppLocale } from '@/lib/i18n';
import {
  getCoachQuickQuestionDefinition,
  selectCoachQuickQuestions,
  type CoachQuickQuestionId,
  type CoachQuickQuestionSignals,
} from '@/lib/domain/coach-quick-questions';
import type { CoachHomeQuickQuestionSlot } from '@/lib/presentation/coach-home/coach-home.types';

export function localizeCoachQuickQuestion(
  id: CoachQuickQuestionId,
  locale?: AppLocale,
): string {
  return t(getCoachQuickQuestionDefinition(id).copyKey, undefined, locale);
}

export function buildCoachQuickQuestionSlots(
  signals: CoachQuickQuestionSignals,
  locale?: AppLocale,
  options?: Parameters<typeof selectCoachQuickQuestions>[1],
): CoachHomeQuickQuestionSlot[] {
  return selectCoachQuickQuestions(signals, options).ids.map((id) => ({
    id,
    kind: 'contextual',
    question: localizeCoachQuickQuestion(id, locale),
  }));
}

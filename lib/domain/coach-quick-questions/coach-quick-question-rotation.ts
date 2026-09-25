import { COACH_QUICK_QUESTION_IDS, type CoachQuickQuestionId } from './coach-quick-question.types';
import type { CoachQuickQuestionRotationState } from './coach-quick-question.types';
import { getCoachQuickQuestionDefinition } from './coach-quick-question-bank';

export const EMPTY_COACH_QUICK_QUESTION_ROTATION: CoachQuickQuestionRotationState = {
  activeIds: [],
  activeShownAt: null,
  lastShownAtById: {},
};

export function cooldownMsForQuestion(id: CoachQuickQuestionId): number {
  return getCoachQuickQuestionDefinition(id).cooldownDays * 24 * 60 * 60 * 1000;
}

export function isCoachQuickQuestionOnCooldown(
  id: CoachQuickQuestionId,
  rotation: CoachQuickQuestionRotationState | null | undefined,
  now: Date,
): boolean {
  const shownAt = rotation?.lastShownAtById[id];
  if (!shownAt) {
    return false;
  }
  const shownMs = Date.parse(shownAt);
  if (!Number.isFinite(shownMs)) {
    return false;
  }
  return now.getTime() - shownMs < cooldownMsForQuestion(id);
}

export function shouldReuseActiveQuickQuestionTrio(
  eligibleIds: ReadonlySet<CoachQuickQuestionId>,
  rotation: CoachQuickQuestionRotationState | null | undefined,
  now: Date,
): boolean {
  if (!rotation?.activeShownAt || rotation.activeIds.length !== 3) {
    return false;
  }
  if (rotation.activeIds.some((id) => !eligibleIds.has(id))) {
    return false;
  }
  const shownMs = Date.parse(rotation.activeShownAt);
  if (!Number.isFinite(shownMs)) {
    return false;
  }
  return now.getTime() - shownMs < cooldownMsForQuestion(rotation.activeIds[0]!);
}

export function recordCoachQuickQuestionTrioShown(
  previous: CoachQuickQuestionRotationState | null | undefined,
  ids: readonly CoachQuickQuestionId[],
  now: Date,
): CoachQuickQuestionRotationState {
  const lastShownAtById: Partial<Record<CoachQuickQuestionId, string>> = {
    ...previous?.lastShownAtById,
  };
  const shownAt = now.toISOString();
  for (const id of ids) {
    lastShownAtById[id] = shownAt;
  }
  return {
    activeIds: [...ids],
    activeShownAt: shownAt,
    lastShownAtById,
  };
}

export function isCoachQuickQuestionId(value: unknown): value is CoachQuickQuestionId {
  return (
    typeof value === 'string' &&
    (COACH_QUICK_QUESTION_IDS as readonly string[]).includes(value)
  );
}

export function parseCoachQuickQuestionRotationState(
  value: unknown,
): CoachQuickQuestionRotationState {
  if (!value || typeof value !== 'object') {
    return EMPTY_COACH_QUICK_QUESTION_ROTATION;
  }
  const record = value as Record<string, unknown>;
  const activeIds = Array.isArray(record.activeIds)
    ? record.activeIds.filter(isCoachQuickQuestionId)
    : [];
  const activeShownAt =
    typeof record.activeShownAt === 'string' && Number.isFinite(Date.parse(record.activeShownAt))
      ? record.activeShownAt
      : null;
  const lastShownAtById: Partial<Record<CoachQuickQuestionId, string>> = {};
  if (record.lastShownAtById && typeof record.lastShownAtById === 'object') {
    for (const [id, shownAt] of Object.entries(
      record.lastShownAtById as Record<string, unknown>,
    )) {
      if (
        isCoachQuickQuestionId(id) &&
        typeof shownAt === 'string' &&
        Number.isFinite(Date.parse(shownAt))
      ) {
        lastShownAtById[id] = shownAt;
      }
    }
  }
  return { activeIds, activeShownAt, lastShownAtById };
}

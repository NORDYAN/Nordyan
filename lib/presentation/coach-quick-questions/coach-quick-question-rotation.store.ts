import {
  EMPTY_COACH_QUICK_QUESTION_ROTATION,
  parseCoachQuickQuestionRotationState,
  type CoachQuickQuestionRotationState,
} from '@/lib/domain/coach-quick-questions';

export type CoachQuickQuestionRotationKeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export function coachQuickQuestionRotationKey(userId: string): string {
  return `@nordyan/coach_quick_questions/rotation/${userId}`;
}

export type CoachQuickQuestionRotationStore = {
  read(userId: string): Promise<CoachQuickQuestionRotationState>;
  write(userId: string, state: CoachQuickQuestionRotationState): Promise<void>;
};

/**
 * Per-user local rotation for Coach quick questions.
 * Stores only question ids and shown timestamps. No answers or health payloads.
 */
export function createCoachQuickQuestionRotationStore(
  storage: CoachQuickQuestionRotationKeyValueStore,
): CoachQuickQuestionRotationStore {
  return {
    async read(userId: string): Promise<CoachQuickQuestionRotationState> {
      const trimmed = userId.trim();
      if (!trimmed) {
        return EMPTY_COACH_QUICK_QUESTION_ROTATION;
      }
      try {
        const raw = await storage.getItem(coachQuickQuestionRotationKey(trimmed));
        if (!raw) {
          return EMPTY_COACH_QUICK_QUESTION_ROTATION;
        }
        return parseCoachQuickQuestionRotationState(JSON.parse(raw));
      } catch {
        return EMPTY_COACH_QUICK_QUESTION_ROTATION;
      }
    },

    async write(userId: string, state: CoachQuickQuestionRotationState): Promise<void> {
      const trimmed = userId.trim();
      if (!trimmed) {
        return;
      }
      try {
        await storage.setItem(
          coachQuickQuestionRotationKey(trimmed),
          JSON.stringify({
            activeIds: state.activeIds,
            activeShownAt: state.activeShownAt,
            lastShownAtById: state.lastShownAtById,
          }),
        );
      } catch {
        // Best-effort persist. Selection remains deterministic from in-memory signals.
      }
    },
  };
}

export function createMemoryCoachQuickQuestionRotationKeyValueStore(): CoachQuickQuestionRotationKeyValueStore {
  const values = new Map<string, string>();
  return {
    async getItem(key: string): Promise<string | null> {
      return values.get(key) ?? null;
    },
    async setItem(key: string, value: string): Promise<void> {
      values.set(key, value);
    },
  };
}

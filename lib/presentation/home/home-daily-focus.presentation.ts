import type { Result } from '@/lib/core';
import { hasTranslationKey, t } from '@/lib/i18n';
import type { PersistedDailyFocus } from '@/lib/repositories/daily-focus.repository';
import type {
  DailyFocusGetOrCreateValue,
  DailyFocusMutationValue,
  DailyFocusWeeklyFocusInput,
} from '@/lib/services/daily-focus';

import type { HomeWeeklyFocusStatus } from './home-weekly-focus.presentation';

export type HomeDailyFocusModel = {
  loadStatus: 'loading' | 'unavailable' | 'ready';
  assignment: PersistedDailyFocus | null;
  weekCompletedCount: number | null;
  actionKnown: boolean;
  mutating: boolean;
  mutationError: boolean;
};

export type HomeDailyFocusView =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | {
      kind: 'unknown';
      mutationError: boolean;
    }
  | {
      kind: 'ready';
      title: string;
      body: string;
      whyText: string | null;
      completed: boolean;
      canComplete: boolean;
      canUndo: boolean;
      canSwap: boolean;
      mutating: boolean;
      mutationError: boolean;
    };

export function createInitialHomeDailyFocusModel(): HomeDailyFocusModel {
  return {
    loadStatus: 'loading',
    assignment: null,
    weekCompletedCount: null,
    actionKnown: false,
    mutating: false,
    mutationError: false,
  };
}

export function toDailyFocusWeeklyFocusInput(
  weeklyFocus: HomeWeeklyFocusStatus,
): DailyFocusWeeklyFocusInput | null {
  if (weeklyFocus.status === 'loading') {
    return null;
  }

  if (weeklyFocus.status === 'unavailable') {
    return { status: 'unavailable' };
  }

  return { status: 'ready', data: weeklyFocus.data };
}

export function applyHomeDailyFocusGetResult(
  model: HomeDailyFocusModel,
  result: Result<DailyFocusGetOrCreateValue>,
): HomeDailyFocusModel {
  if (!result.ok) {
    return {
      ...model,
      loadStatus: 'unavailable',
      mutating: false,
    };
  }

  if (result.value.status === 'not_ready') {
    return {
      ...model,
      loadStatus: 'loading',
      mutating: false,
    };
  }

  if (result.value.status === 'unavailable') {
    return {
      ...model,
      loadStatus: 'unavailable',
      mutating: false,
    };
  }

  return {
    loadStatus: 'ready',
    assignment: result.value.assignment,
    weekCompletedCount: result.value.weekCompletedCount,
    actionKnown: result.value.actionKnown,
    mutating: false,
    mutationError: false,
  };
}

export function startHomeDailyFocusMutation(model: HomeDailyFocusModel): HomeDailyFocusModel {
  return {
    ...model,
    mutating: true,
    mutationError: false,
  };
}

function isMutationPayload(
  value: DailyFocusMutationValue,
): value is Extract<
  DailyFocusMutationValue,
  { status: 'ready' | 'already_swapped' | 'completed' | 'conflict' }
> {
  return (
    value.status === 'ready' ||
    value.status === 'already_swapped' ||
    value.status === 'completed' ||
    value.status === 'conflict'
  );
}

export function applyHomeDailyFocusMutationResult(
  model: HomeDailyFocusModel,
  result: Result<DailyFocusMutationValue>,
): HomeDailyFocusModel {
  if (!result.ok || !isMutationPayload(result.value)) {
    return {
      ...model,
      mutating: false,
      mutationError: true,
    };
  }

  return {
    loadStatus: 'ready',
    assignment: result.value.assignment,
    weekCompletedCount: result.value.weekCompletedCount,
    actionKnown: result.value.actionKnown,
    mutating: false,
    mutationError: false,
  };
}

export function isHomeDailyFocusCompleted(assignment: PersistedDailyFocus | null): boolean {
  return assignment?.completedAt != null;
}

export function canSwapHomeDailyFocus(model: HomeDailyFocusModel): boolean {
  if (model.loadStatus !== 'ready' || !model.assignment || !model.actionKnown) {
    return false;
  }

  return model.assignment.completedAt == null && model.assignment.swapCount === 0;
}

export function canMutateHomeDailyFocus(model: HomeDailyFocusModel): boolean {
  return (
    model.loadStatus === 'ready' &&
    model.assignment != null &&
    model.actionKnown &&
    !model.mutating
  );
}

function dailyFocusActionCopy(actionId: string): { title: string; body: string } | null {
  const titleKey = `dailyFocus.action.${actionId}.title`;
  const bodyKey = `dailyFocus.action.${actionId}.body`;
  if (!hasTranslationKey(titleKey) || !hasTranslationKey(bodyKey)) {
    return null;
  }

  return {
    title: t(titleKey),
    body: t(bodyKey),
  };
}

function dailyFocusWhyText(assignment: PersistedDailyFocus): string | null {
  const key = `dailyFocus.why.${assignment.focusArea}.${assignment.weeklyMode}`;
  return hasTranslationKey(key) ? t(key) : null;
}

export function toHomeDailyFocusView(model: HomeDailyFocusModel): HomeDailyFocusView {
  if (model.loadStatus === 'loading') {
    return { kind: 'loading' };
  }

  if (model.loadStatus === 'unavailable' || !model.assignment) {
    return { kind: 'unavailable' };
  }

  const copy = model.actionKnown ? dailyFocusActionCopy(model.assignment.actionId) : null;
  if (!copy) {
    return {
      kind: 'unknown',
      mutationError: model.mutationError,
    };
  }

  const completed = isHomeDailyFocusCompleted(model.assignment);
  const canSwap = canSwapHomeDailyFocus(model);

  return {
    kind: 'ready',
    title: copy.title,
    body: copy.body,
    whyText: dailyFocusWhyText(model.assignment),
    completed,
    canComplete: !completed && !model.mutating,
    canUndo: completed && !model.mutating,
    canSwap: canSwap && !model.mutating,
    mutating: model.mutating,
    mutationError: model.mutationError,
  };
}

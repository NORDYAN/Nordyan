import { DAILY_FOCUS_ACTION_DEFINITIONS } from './daily-focus-action-definitions';
import {
  dailyFocusActionBodyKey,
  dailyFocusActionTitleKey,
} from './daily-focus-action-copy';
import type { DailyFocusActionDefinition } from './daily-focus.types';

export const DAILY_FOCUS_ACTION_BANK: readonly DailyFocusActionDefinition[] =
  DAILY_FOCUS_ACTION_DEFINITIONS.map((action) => ({
    id: action.id,
    focusArea: action.focusArea,
    behaviorFamily: action.behaviorFamily,
    intensity: action.intensity,
    allowedModes: action.allowedModes,
    titleKey: dailyFocusActionTitleKey(action.id),
    bodyKey: dailyFocusActionBodyKey(action.id),
    eligibility: action.eligibility,
  }));

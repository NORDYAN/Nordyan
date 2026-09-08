import type { NotificationPreferences } from './notification-preferences';

export function localTimeDateFromHourMinute(
  hour: number,
  minute: number,
  now: Date = new Date(),
): Date {
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0,
  );
  return date;
}

export function localHourMinuteFromDate(date: Date): { hour: number; minute: number } {
  return {
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

export function commitDailyTimeDraft(
  prefs: NotificationPreferences,
  draft: Date,
): NotificationPreferences {
  const { hour, minute } = localHourMinuteFromDate(draft);
  return {
    ...prefs,
    dailyHour: hour,
    dailyMinute: minute,
  };
}

export type IosDailyTimePickerSession = {
  pickerValue: Date;
  selection: Date;
};

export function beginIosDailyTimePickerSession(
  hour: number,
  minute: number,
  now: Date = new Date(),
): IosDailyTimePickerSession {
  const pickerValue = localTimeDateFromHourMinute(hour, minute, now);
  return { pickerValue, selection: pickerValue };
}

export function captureIosDailyTimeSelection(selected: Date): Date {
  const { hour, minute } = localHourMinuteFromDate(selected);
  return localTimeDateFromHourMinute(hour, minute, selected);
}

export function applyIosDailyTimePickerWheelEvent(
  session: IosDailyTimePickerSession,
  selected: Date,
): IosDailyTimePickerSession {
  return {
    pickerValue: session.pickerValue,
    selection: captureIosDailyTimeSelection(selected),
  };
}

export function resolveIosDailyTimePickerCommit(session: IosDailyTimePickerSession): Date {
  return session.selection;
}

export function shouldRebindIosPickerValueOnSet(): boolean {
  return false;
}

export type DailyTimePickerEventDecision =
  | { action: 'remember-selection'; selection: Date }
  | { action: 'commit'; hour: number; minute: number }
  | { action: 'dismiss' }
  | { action: 'ignore' };

export function decideDailyTimePickerEvent(input: {
  platform: 'ios' | 'android';
  eventType: string;
  selected?: Date;
}): DailyTimePickerEventDecision {
  if (input.eventType === 'dismissed' || !input.selected) {
    return { action: input.platform === 'android' ? 'dismiss' : 'ignore' };
  }

  if (input.platform === 'ios') {
    return {
      action: 'remember-selection',
      selection: captureIosDailyTimeSelection(input.selected),
    };
  }

  const { hour, minute } = localHourMinuteFromDate(input.selected);
  return { action: 'commit', hour, minute };
}

export function shouldRefreshStoredPreferencesWhilePickerOpen(pickerOpen: boolean): boolean {
  return !pickerOpen;
}

export const IOS_DAILY_TIME_PICKER_THEME = {
  themeVariant: 'dark' as const,
};

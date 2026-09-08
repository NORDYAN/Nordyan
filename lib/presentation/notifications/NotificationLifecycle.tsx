import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import { persistPendingHealthDataConsentAfterAuth } from '@/lib/onboarding/persist-pending-health-data-consent.runtime';
import { getPendingSignupVerification } from '@/lib/onboarding/pending-signup-verification-storage';
import { resolveAppGate } from '@/lib/onboarding/resolve-app-gate';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { healthDataConsentService } from '@/lib/services/health-data-consent';
import { useAuth } from '@/providers/auth-provider';

import { markNotificationResponseConsumed } from './notification-response-consume';
import {
  mayOpenHomeForGateDestination,
  decideNotificationResponseNavigation,
} from './notification-response-navigation';
import { decideNotificationScheduleSync } from './notification-schedule-sync';
import { homeRouteForNotificationTap } from './notification-tap';
import { ensureNotificationHandler } from './nordyan-notifications.runtime';
import { isNativeNotificationsSupported } from './notifications-platform';
import {
  cancelNordyanScheduledNotifications,
  restoreNordyanNotificationSchedules,
  syncWeeklyCheckInReminderForUser,
} from './sync-nordyan-notifications.runtime';

export function NotificationLifecycle() {
  const { session, isReady, status } = useAuth();
  const { locale, isReady: isLocaleReady } = useI18n();
  const userId = session?.user.id ?? null;
  const previousUserIdRef = useRef<string | null | undefined>(undefined);
  const previousLocaleRef = useRef(locale);
  const pendingResponseRef = useRef<Notifications.NotificationResponse | null>(null);

  useEffect(() => {
    if (!isNativeNotificationsSupported()) {
      return;
    }
    ensureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!isReady || !isLocaleReady) {
      return;
    }

    const localeChanged = previousLocaleRef.current !== locale;
    previousLocaleRef.current = locale;

    const decision = decideNotificationScheduleSync({
      authReady: true,
      previousUserId: previousUserIdRef.current,
      nextUserId: userId,
      localeChanged,
    });
    previousUserIdRef.current = userId;

    let cancelled = false;
    const run = async () => {
      if (decision.kind === 'hydrate-restore' || decision.kind === 'login-restore' || decision.kind === 'locale-restore') {
        await restoreNordyanNotificationSchedules(decision.userId);
        return;
      }
      if (decision.kind === 'switch-cancel-restore') {
        await cancelNordyanScheduledNotifications();
        if (!cancelled) {
          await restoreNordyanNotificationSchedules(decision.userId);
        }
        return;
      }
      if (decision.kind === 'logout-cancel') {
        await cancelNordyanScheduledNotifications();
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [isLocaleReady, isReady, locale, userId]);

  useEffect(() => {
    if (!isNativeNotificationsSupported()) {
      return;
    }

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && userId) {
        void syncWeeklyCheckInReminderForUser(userId);
      }
    });
    return () => subscription.remove();
  }, [userId]);

  const processResponse = useCallback(
    async (response: Notifications.NotificationResponse) => {
      const identifier = response.notification.request.identifier;
      const data = response.notification.request.content.data;
      const decision = decideNotificationResponseNavigation({
        authReady: isReady,
        isAuthenticated: status === 'authenticated',
        userId,
        data,
      });

      if (decision === 'wait') {
        pendingResponseRef.current = response;
        return;
      }

      if (!markNotificationResponseConsumed(identifier)) {
        pendingResponseRef.current = null;
        Notifications.clearLastNotificationResponse();
        return;
      }

      pendingResponseRef.current = null;
      Notifications.clearLastNotificationResponse();

      if (decision === 'ignore') {
        return;
      }

      const gate = await resolveAppGate({
        isReady: true,
        isAuthenticated: true,
        userId,
        getPendingSignupVerification,
        persistPendingConsent: persistPendingHealthDataConsentAfterAuth,
        hasActiveCurrentConsent: (id) => healthDataConsentService.hasActiveCurrentConsent(id),
      });

      if (mayOpenHomeForGateDestination(gate.destination)) {
        router.replace(homeRouteForNotificationTap());
      }
    },
    [isReady, status, userId],
  );

  useEffect(() => {
    if (!isNativeNotificationsSupported()) {
      return;
    }

    const pending = pendingResponseRef.current;
    if (pending && isReady) {
      void processResponse(pending);
    }
  }, [isReady, processResponse]);

  useEffect(() => {
    if (!isNativeNotificationsSupported()) {
      return;
    }

    const last = Notifications.getLastNotificationResponse();
    if (last) {
      void processResponse(last);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void processResponse(response);
    });
    return () => subscription.remove();
  }, [processResponse]);

  return null;
}

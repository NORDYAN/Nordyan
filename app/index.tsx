import { Redirect, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { routes } from '@/constants/routes';
import { logNordyanOnboardingRedirect } from '@/lib/onboarding/nordyan-nav-dev';
import {
  APP_GATE_LOADING,
  appGateAuthInputsKey,
  applyAppGateIfCurrent,
  visibleAppGate,
} from '@/lib/onboarding/app-gate-view-state';
import {
  resolveAppGate,
  type AppGateResult,
} from '@/lib/onboarding/resolve-app-gate';
import { persistPendingHealthDataConsentAfterAuth } from '@/lib/onboarding/persist-pending-health-data-consent.runtime';
import { applyPendingNotificationChoiceForAuthenticatedUser } from '@/lib/onboarding/apply-pending-notification-choice.runtime';
import { getPendingSignupVerification } from '@/lib/onboarding/pending-signup-verification-storage';
import { logNordyanAuthTrace } from '@/lib/presentation/auth-verification/auth-callback-trace';
import { healthDataConsentService } from '@/lib/services/health-data-consent';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

export default function Index() {
  const pathname = usePathname();
  const { status, isReady, session } = useAuth();
  const userId = session?.user.id ?? null;
  const authInputsKey = appGateAuthInputsKey({ isReady, status, userId });
  const latestRequestIdRef = useRef(0);
  const [settledInputsKey, setSettledInputsKey] = useState(authInputsKey);
  const [gate, setGate] = useState<AppGateResult>(APP_GATE_LOADING);
  const visibleGate = visibleAppGate({
    authInputsKey,
    settledInputsKey,
    settledGate: gate,
  });
  const lastVisibleDestinationRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastVisibleDestinationRef.current === visibleGate.destination) {
      return;
    }
    lastVisibleDestinationRef.current = visibleGate.destination;
    logNordyanAuthTrace('index.visible-gate', {
      destination: visibleGate.destination,
    });
  }, [visibleGate.destination]);

  useEffect(() => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    setSettledInputsKey(authInputsKey);
    setGate(APP_GATE_LOADING);

    const run = async () => {
      if (status === 'authenticated' && userId) {
        await applyPendingNotificationChoiceForAuthenticatedUser(userId);
      }

      const next = await resolveAppGate({
        isReady,
        isAuthenticated: status === 'authenticated',
        userId,
        getPendingSignupVerification,
        persistPendingConsent: persistPendingHealthDataConsentAfterAuth,
        hasActiveCurrentConsent: (id) => healthDataConsentService.hasActiveCurrentConsent(id),
      });

      const applied = applyAppGateIfCurrent({
        requestId,
        latestRequestId: latestRequestIdRef.current,
        result: next,
      });
      if (applied) {
        setSettledInputsKey(authInputsKey);
        setGate(applied);
      }
    };

    void run();
  }, [authInputsKey, isReady, status, userId]);

  if (visibleGate.destination === 'loading') {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.onboardingAccent} size="large" />
      </View>
    );
  }

  if (visibleGate.destination === 'onboarding') {
    logNordyanOnboardingRedirect({
      source: 'app/index.tsx',
      href: routes.onboarding,
      gateDestination: visibleGate.destination,
      pathname,
    });
    return <Redirect href={routes.onboarding} />;
  }

  if (visibleGate.destination === 'onboarding-step-4') {
    return <Redirect href={routes.onboardingStep4} />;
  }

  if (visibleGate.destination === 'home') {
    return <Redirect href={routes.home} />;
  }

  if (visibleGate.destination === 'authenticated-health-data-consent') {
    return <Redirect href={routes.authenticatedHealthDataConsent} />;
  }

  if (visibleGate.destination === 'check-email') {
    return (
      <Redirect
        href={{
          pathname: routes.authCheckEmail,
          params: { email: visibleGate.email },
        }}
      />
    );
  }

  logNordyanOnboardingRedirect({
    source: 'app/index.tsx:fallback',
    href: routes.onboarding,
    gateDestination: visibleGate.destination,
    pathname,
  });
  return <Redirect href={routes.onboarding} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onboardingBackground,
  },
});

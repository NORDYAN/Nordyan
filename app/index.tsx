import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';

import { routes } from '@/constants/routes';
import {
  resolveAppGate,
  type AppGateResult,
} from '@/lib/onboarding/resolve-app-gate';
import { getPendingSignupVerification } from '@/lib/onboarding/pending-signup-verification-storage';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

export default function Index() {
  const { status, isReady, session } = useAuth();
  const [gate, setGate] = useState<AppGateResult>({ destination: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const next = await resolveAppGate({
        isReady,
        isAuthenticated: status === 'authenticated',
        userId: session?.user.id ?? null,
        getPendingSignupVerification,
      });

      if (!cancelled) {
        setGate(next);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isReady, status, session?.user.id]);

  if (gate.destination === 'loading') {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.onboardingAccent} size="large" />
      </View>
    );
  }

  if (gate.destination === 'onboarding') {
    return <Redirect href={routes.onboarding} />;
  }

  if (gate.destination === 'onboarding-step-4') {
    return <Redirect href={routes.onboardingStep4} />;
  }

  if (gate.destination === 'home') {
    return <Redirect href={routes.home} />;
  }

  if (gate.destination === 'check-email') {
    return (
      <Redirect
        href={{
          pathname: routes.authCheckEmail,
          params: { email: gate.email },
        }}
      />
    );
  }

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

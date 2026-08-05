import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';

import { routes } from '@/constants/routes';
import {
  resolveAppGate,
  type OnboardingGateDestination,
} from '@/lib/onboarding/resolve-app-gate';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

export default function Index() {
  const { status, isReady, session } = useAuth();
  const [destination, setDestination] = useState<OnboardingGateDestination | 'loading'>('loading');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const next = await resolveAppGate({
        isReady,
        isAuthenticated: status === 'authenticated',
        userId: session?.user.id ?? null,
      });

      if (!cancelled) {
        setDestination(next);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isReady, status, session?.user.id]);

  if (destination === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (destination === 'onboarding') {
    return <Redirect href={routes.onboarding} />;
  }

  if (destination === 'onboarding-step-4') {
    return <Redirect href={routes.onboardingStep4} />;
  }

  if (destination === 'home') {
    return <Redirect href={routes.home} />;
  }

  return <Redirect href={routes.authSignIn} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

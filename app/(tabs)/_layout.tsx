import { Redirect, Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { routes } from '@/constants/routes';
import { logNordyanOnboardingRedirect } from '@/lib/onboarding/nordyan-nav-dev';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { persistPendingHealthDataConsentAfterAuth } from '@/lib/onboarding/persist-pending-health-data-consent.runtime';
import { applyPendingNotificationChoiceForAuthenticatedUser } from '@/lib/onboarding/apply-pending-notification-choice.runtime';
import {
  resolveAuthenticatedOnboardingGate,
  type AuthenticatedOnboardingGateDestination,
} from '@/lib/onboarding/resolve-app-gate';
import { logNordyanAuthTrace } from '@/lib/presentation/auth-verification/auth-callback-trace';
import { healthDataConsentService } from '@/lib/services/health-data-consent';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

export default function TabsLayout() {
  useI18n();
  const pathname = usePathname();
  const { status, isReady, session } = useAuth();
  const [gateDestination, setGateDestination] = useState<
    | AuthenticatedOnboardingGateDestination
    | 'authenticated-health-data-consent'
    | 'loading'
    | 'allowed'
  >('loading');

  useEffect(() => {
    const loadingUi = !isReady || (status === 'authenticated' && gateDestination === 'loading');
    logNordyanAuthTrace('tabs.gate', {
      destination: gateDestination,
      authReady: isReady,
      authenticated: status === 'authenticated',
      loadingUi,
      homeRendered: gateDestination === 'allowed' && status === 'authenticated' && isReady,
    });
  }, [gateDestination, isReady, status]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!isReady) {
        return;
      }

      if (status !== 'authenticated' || !session?.user.id) {
        if (!cancelled) {
          setGateDestination('allowed');
        }
        return;
      }

      await persistPendingHealthDataConsentAfterAuth(session.user.id);
      await applyPendingNotificationChoiceForAuthenticatedUser(session.user.id);
      const hasConsent = await healthDataConsentService.hasActiveCurrentConsent(session.user.id);
      if (!hasConsent) {
        if (!cancelled) {
          setGateDestination('authenticated-health-data-consent');
        }
        return;
      }

      const destination = await resolveAuthenticatedOnboardingGate(session.user.id);
      if (!cancelled) {
        setGateDestination(destination === 'home' ? 'allowed' : destination);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isReady, status, session?.user.id]);

  if (!isReady || (status === 'authenticated' && gateDestination === 'loading')) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href={routes.root} />;
  }

  if (gateDestination === 'onboarding') {
    logNordyanOnboardingRedirect({
      source: 'app/(tabs)/_layout.tsx',
      href: routes.onboarding,
      gateDestination,
      pathname,
    });
    return <Redirect href={routes.onboarding} />;
  }

  if (gateDestination === 'onboarding-step-4') {
    return <Redirect href={routes.onboardingStep4} />;
  }

  if (gateDestination === 'authenticated-health-data-consent') {
    return <Redirect href={routes.authenticatedHealthDataConsent} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.homeAccentSlate,
        tabBarInactiveTintColor: colors.homeTextDim,
        tabBarStyle: {
          backgroundColor: colors.homeTabBarBackground,
          borderTopColor: colors.homeBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 72,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingHorizontal: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '400',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: t('tabs.coach'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: t('tabs.health'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

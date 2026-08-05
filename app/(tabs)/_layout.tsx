import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { routes } from '@/constants/routes';
import {
  resolveAuthenticatedOnboardingGate,
  type OnboardingGateDestination,
} from '@/lib/onboarding/resolve-app-gate';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { status, isReady, session } = useAuth();
  const [gateDestination, setGateDestination] = useState<
    OnboardingGateDestination | 'loading' | 'allowed'
  >('loading');

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
    return <Redirect href={routes.authSignIn} />;
  }

  if (gateDestination === 'onboarding') {
    return <Redirect href={routes.onboarding} />;
  }

  if (gateDestination === 'onboarding-step-4') {
    return <Redirect href={routes.onboardingStep4} />;
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
          title: 'Hem',
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
          title: 'Coach',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Utveckling',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Hälsa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
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

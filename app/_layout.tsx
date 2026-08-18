import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/providers/app-providers';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.onboardingBackground },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="auth/recovery-callback" />
        <Stack.Screen name="auth/reset-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="health-score"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="weekly-check-in"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </AppProviders>
  );
}

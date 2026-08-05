import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function HealthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.onboardingBackground },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="new-measurement" />
    </Stack>
  );
}

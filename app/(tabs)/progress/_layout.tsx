import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function ProgressLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.developmentBackground },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="trends" />
    </Stack>
  );
}

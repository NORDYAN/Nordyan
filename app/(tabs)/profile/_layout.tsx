import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.profileBackground },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="health-profile" />
      <Stack.Screen name="health-data-sources" />
    </Stack>
  );
}

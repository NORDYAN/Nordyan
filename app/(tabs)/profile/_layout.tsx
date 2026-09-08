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
      <Stack.Screen name="account" />
      <Stack.Screen name="language" />
      <Stack.Screen name="health-profile" />
      <Stack.Screen name="health-data-sources" />
      <Stack.Screen name="food-scanner" />
      <Stack.Screen name="blood-tests" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}

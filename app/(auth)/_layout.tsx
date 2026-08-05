import { Redirect, Stack } from 'expo-router';

import { routes } from '@/constants/routes';
import { useAuth } from '@/providers/auth-provider';

export default function AuthLayout() {
  const { status, isReady } = useAuth();

  // Let the root gate decide home vs onboarding from the user's profile.
  if (isReady && status === 'authenticated') {
    return <Redirect href={routes.root} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

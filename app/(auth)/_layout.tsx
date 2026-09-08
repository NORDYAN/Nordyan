import { Redirect, Stack } from 'expo-router';
import { useEffect, useRef } from 'react';

import { routes } from '@/constants/routes';
import { logNordyanAuthTrace } from '@/lib/presentation/auth-verification/auth-callback-trace';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

export default function AuthGroupLayout() {
  const { status, isReady } = useAuth();
  const loggedRedirectRef = useRef(false);

  useEffect(() => {
    if (!(isReady && status === 'authenticated') || loggedRedirectRef.current) {
      return;
    }
    loggedRedirectRef.current = true;
    logNordyanAuthTrace('auth-layout.redirect', { destination: 'root' });
  }, [isReady, status]);

  // Let the root gate decide home vs onboarding from the user's profile.
  if (isReady && status === 'authenticated') {
    return <Redirect href={routes.root} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.onboardingBackground },
      }}
    >
      <Stack.Screen name="check-email" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

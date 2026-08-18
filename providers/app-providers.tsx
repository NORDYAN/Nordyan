import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { emitOnboardingForensicsRuntimeMarker } from '@/lib/onboarding/onboarding-forensics';
import { AuthProvider } from '@/providers/auth-provider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    emitOnboardingForensicsRuntimeMarker();
  }, []);

  return (
    <AuthProvider>
      <I18nProvider>{children}</I18nProvider>
    </AuthProvider>
  );
}

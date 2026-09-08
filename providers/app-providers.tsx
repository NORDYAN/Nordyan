import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { I18nProvider, LocaleKeyedSubtree } from '@/lib/i18n/I18nProvider';
import { NotificationLifecycle } from '@/lib/presentation/notifications';
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
      <I18nProvider>
        <NotificationLifecycle />
        <LocaleKeyedSubtree>{children}</LocaleKeyedSubtree>
      </I18nProvider>
    </AuthProvider>
  );
}

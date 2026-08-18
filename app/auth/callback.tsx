import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AuthCallbackStatusView } from '@/components/auth/AuthCallbackStatusView';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { persistPendingInitialLifestyleAfterAuth } from '@/lib/onboarding/pending-initial-lifestyle-storage';
import { clearCompletedOnboardingLocalData } from '@/lib/onboarding/pending-onboarding-ownership';
import { syncPendingProfileAfterAuth } from '@/lib/onboarding/sync-pending-profile-runtime';
import {
  AUTH_VERIFICATION_COPY,
  completeAuthEmailCallback,
} from '@/lib/presentation/auth-verification';
import { authMessages } from '@/lib/services/auth/auth-errors';
import { authService } from '@/lib/services/auth/auth.service';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string | string[]; error?: string | string[] }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const startedRef = useRef(false);
  const runningRef = useRef(false);

  const run = useCallback(async () => {
    if (runningRef.current) {
      return;
    }

    runningRef.current = true;
    setErrorMessage(null);
    setCanRetry(false);

    try {
      const result = await completeAuthEmailCallback({
        params,
        getSession: () => authService.getSession(),
        exchangeCode: (code) => authService.exchangeAuthCallbackCode(code),
        syncPendingProfile: () => syncPendingProfileAfterAuth(),
        persistPendingLifestyle: (userId) => persistPendingInitialLifestyleAfterAuth(userId),
        clearCompletedOnboardingLocalData: (userId) => clearCompletedOnboardingLocalData(userId),
      });

      if (!result.ok) {
        setErrorMessage(result.error.message || authMessages.callbackGeneric);
        const session = await authService.getSession();
        setCanRetry(session.ok && session.value !== null);
        return;
      }

      router.replace(routes.root);
    } finally {
      runningRef.current = false;
      setIsRetrying(false);
    }
  }, [params]);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    void run();
  }, [run]);

  return (
    <AuthLayout>
      <AuthCallbackStatusView
        heading={errorMessage ?? AUTH_VERIFICATION_COPY.callbackLoading}
        showReturnToSignIn={Boolean(errorMessage) && !canRetry}
        retryLabel={canRetry ? t('common.retry') : undefined}
        isRetrying={isRetrying}
        onRetry={
          canRetry
            ? () => {
                setIsRetrying(true);
                void run();
              }
            : undefined
        }
      />
    </AuthLayout>
  );
}

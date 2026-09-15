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
  decideAuthCallbackStart,
} from '@/lib/presentation/auth-verification';
import { logNordyanAuthTrace } from '@/lib/presentation/auth-verification/auth-callback-trace';
import { toAuthCallbackFailureTraceDetails } from '@/lib/presentation/auth-verification/auth-callback-failure-diagnostic';
import { authMessages } from '@/lib/services/auth/auth-errors';
import { authService } from '@/lib/services/auth/auth.service';

function hasNonEmptyParam(value: string | string[] | undefined): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0].trim().length > 0;
  }
  return false;
}

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string | string[]; error?: string | string[] }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const startedRef = useRef(false);
  const runningRef = useRef(false);

  useEffect(() => {
    logNordyanAuthTrace('callback.mount');
    return () => {
      logNordyanAuthTrace('callback.unmount');
    };
  }, []);

  const run = useCallback(async () => {
    if (runningRef.current) {
      return;
    }

    runningRef.current = true;
    setErrorMessage(null);
    setCanRetry(false);
    logNordyanAuthTrace('callback.completion.start');

    try {
      const existing = await authService.getSession();
      const existingSessionRecovery = existing.ok && existing.value !== null;
      logNordyanAuthTrace('callback.existing-session', {
        recovery: existingSessionRecovery,
      });

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
        const sessionAfter = session.ok && session.value !== null;
        setCanRetry(sessionAfter);
        logNordyanAuthTrace(
          'callback.completion.result',
          toAuthCallbackFailureTraceDetails(result.diagnostic, sessionAfter),
        );
        return;
      }

      logNordyanAuthTrace('callback.completion.result', {
        result: 'success',
        existingSessionRecovery,
      });
      logNordyanAuthTrace('callback.replace.root');
      router.replace(routes.root);
    } finally {
      runningRef.current = false;
      setIsRetrying(false);
    }
  }, [params]);

  useEffect(() => {
    const hasCode = hasNonEmptyParam(params.code);
    const hasError = hasNonEmptyParam(params.error);
    logNordyanAuthTrace('callback.params', { hasCode, hasError });

    const decision = decideAuthCallbackStart({
      alreadyStarted: startedRef.current,
      params,
    });
    logNordyanAuthTrace('callback.start-decision', { action: decision.action });
    if (decision.action !== 'start') {
      return;
    }

    startedRef.current = true;
    void run();
  }, [params, run]);

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

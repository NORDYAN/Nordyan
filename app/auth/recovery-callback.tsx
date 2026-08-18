import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { AuthCallbackStatusView, AuthLayout } from '@/components/auth';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { completePasswordRecoveryCallback } from '@/lib/presentation/password-recovery';
import { authService } from '@/lib/services/auth/auth.service';
import { useAuth } from '@/providers/auth-provider';

export default function PasswordRecoveryCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_code?: string | string[];
  }>();
  const { activatePasswordRecovery } = useAuth();
  const startedRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    void completePasswordRecoveryCallback({
      params,
      exchangeCode: (code) => authService.exchangeAuthCallbackCode(code),
    }).then((result) => {
      if (!result.ok) {
        setErrorMessage(result.error.message);
        return;
      }

      activatePasswordRecovery(result.value);
      router.replace(routes.authResetPassword);
    });
  }, [activatePasswordRecovery, params]);

  return (
    <AuthLayout>
      <AuthCallbackStatusView
        heading={
          errorMessage
            ? t('auth.recovery.callback.invalidTitle')
            : t('auth.recovery.callback.loading')
        }
        body={errorMessage}
        showReturnToSignIn={Boolean(errorMessage)}
        retryLabel={
          errorMessage ? t('auth.recovery.callback.requestNewLink') : undefined
        }
        onRetry={
          errorMessage
            ? () => router.replace(routes.authForgotPassword)
            : undefined
        }
      />
    </AuthLayout>
  );
}

import { router } from 'expo-router';
import { useState } from 'react';

import {
  AuthCallbackStatusView,
  AuthLayout,
  ResetPasswordView,
} from '@/components/auth';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { useAuth } from '@/providers/auth-provider';

export default function ResetPasswordScreen() {
  const {
    isReady,
    status,
    isPasswordRecovery,
    updateRecoveredPassword,
  } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await updateRecoveredPassword(password, confirmation);
    setIsSubmitting(false);
    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    setPassword('');
    setConfirmation('');
    setSuccess(true);
  };

  if (!success && (!isReady || status === 'unknown')) {
    return (
      <AuthLayout>
        <AuthCallbackStatusView heading={t('auth.recovery.callback.loading')} />
      </AuthLayout>
    );
  }

  if (!success && (status !== 'authenticated' || !isPasswordRecovery)) {
    return (
      <AuthLayout>
        <AuthCallbackStatusView
          heading={t('auth.recovery.callback.invalidTitle')}
          body={t('auth.recovery.error.sessionRequired')}
          showReturnToSignIn
          retryLabel={t('auth.recovery.callback.requestNewLink')}
          onRetry={() => router.replace(routes.authForgotPassword)}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <ResetPasswordView
        password={password}
        confirmation={confirmation}
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        success={success}
        onPasswordChange={setPassword}
        onConfirmationChange={setConfirmation}
        onSubmit={() => {
          void handleSubmit();
        }}
        onContinue={() => router.replace(routes.root)}
      />
    </AuthLayout>
  );
}

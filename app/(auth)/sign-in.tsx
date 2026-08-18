import { router } from 'expo-router';
import { useState } from 'react';

import { AuthForm } from '@/components/auth/AuthForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { authMessages } from '@/lib/services/auth/auth-errors';
import { useAuth } from '@/providers/auth-provider';

export default function SignInScreen() {
  useI18n();
  const { signInWithEmail, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isConfigured) {
      setErrorMessage(authMessages.missingConfig);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await signInWithEmail(email, password);

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    router.replace(routes.root);
  };

  return (
    <AuthLayout>
      <AuthForm
        title={t('auth.signIn.title')}
        submitLabel={t('auth.signIn.submit')}
        loadingLabel={authMessages.signingIn}
        alternatePrompt={t('auth.signIn.alternatePrompt')}
        alternateHref={routes.authSignUp}
        alternateLabel={t('auth.signIn.alternateLabel')}
        email={email}
        password={password}
        passwordActionHref={routes.authForgotPassword}
        passwordActionLabel={t('auth.recovery.forgotPassword')}
        errorMessage={errorMessage ?? (!isConfigured ? authMessages.missingConfig : null)}
        invalid={errorMessage !== null}
        isSubmitting={isSubmitting}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}

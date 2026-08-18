import { router } from 'expo-router';
import { useState } from 'react';

import { AuthForm } from '@/components/auth/AuthForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { authMessages } from '@/lib/services/auth/auth-errors';
import { useAuth } from '@/providers/auth-provider';

export default function SignUpScreen() {
  useI18n();
  const { signUpWithEmail, isConfigured } = useAuth();
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

    const result = await signUpWithEmail(email, password);

    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    if (result.outcome.kind === 'pending_verification') {
      router.replace({
        pathname: routes.authCheckEmail,
        params: { email: result.outcome.email },
      });
      return;
    }

    router.replace(routes.root);
  };

  return (
    <AuthLayout>
      <AuthForm
        title={t('auth.signUp.title')}
        submitLabel={t('auth.signUp.submit')}
        loadingLabel={authMessages.signingUp}
        alternatePrompt={t('auth.signUp.alternatePrompt')}
        alternateHref={routes.authSignIn}
        alternateLabel={t('auth.signUp.alternateLabel')}
        email={email}
        password={password}
        errorMessage={errorMessage ?? (!isConfigured ? authMessages.missingConfig : null)}
        invalid={errorMessage !== null}
        isSubmitting={isSubmitting}
        passwordHint={t('auth.signUp.passwordHint')}
        passwordAutoComplete="new-password"
        passwordTextContentType="newPassword"
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}

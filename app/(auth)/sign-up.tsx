import { router } from 'expo-router';
import { useState } from 'react';

import { AuthForm } from '@/components/auth/AuthForm';
import { routes } from '@/constants/routes';
import { authMessages } from '@/lib/services/auth/auth-errors';
import { useAuth } from '@/providers/auth-provider';

export default function SignUpScreen() {
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

    router.replace(routes.root);
  };

  return (
    <AuthForm
      title="Skapa konto"
      subtitle="Registrera dig med e-post och lösenord."
      submitLabel="Skapa konto"
      loadingLabel={authMessages.signingUp}
      alternatePrompt="Har du redan ett konto?"
      alternateHref={routes.authSignIn}
      alternateLabel="Logga in"
      email={email}
      password={password}
      errorMessage={errorMessage ?? (!isConfigured ? authMessages.missingConfig : null)}
      isSubmitting={isSubmitting}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}

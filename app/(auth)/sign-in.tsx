import { router } from 'expo-router';
import { useState } from 'react';

import { AuthForm } from '@/components/auth/AuthForm';
import { routes } from '@/constants/routes';
import { authMessages } from '@/lib/services/auth/auth-errors';
import { useAuth } from '@/providers/auth-provider';

export default function SignInScreen() {
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
    <AuthForm
      title="Logga in"
      subtitle="Använd din e-post och lösenord för att fortsätta."
      submitLabel="Logga in"
      loadingLabel={authMessages.signingIn}
      alternatePrompt="Har du inget konto?"
      alternateHref={routes.authSignUp}
      alternateLabel="Skapa konto"
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

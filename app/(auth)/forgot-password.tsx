import { useEffect, useMemo, useState } from 'react';

import { AuthLayout, PasswordRecoveryRequestView } from '@/components/auth';
import {
  PASSWORD_RECOVERY_COOLDOWN_MS,
  canRequestPasswordRecoveryAgain,
} from '@/lib/presentation/password-recovery';
import { authMessages } from '@/lib/services/auth/auth-errors';
import { useAuth } from '@/providers/auth-provider';

export default function ForgotPasswordScreen() {
  const { isConfigured, requestPasswordRecovery } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSentAtMs, setLastSentAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const canSubmit = useMemo(
    () =>
      Boolean(email.trim()) &&
      !isSubmitting &&
      canRequestPasswordRecoveryAgain(lastSentAtMs, nowMs),
    [email, isSubmitting, lastSentAtMs, nowMs],
  );

  useEffect(() => {
    if (lastSentAtMs === null) {
      return;
    }
    const remaining = Math.max(
      0,
      PASSWORD_RECOVERY_COOLDOWN_MS - (Date.now() - lastSentAtMs),
    );
    const timeout = setTimeout(() => setNowMs(Date.now()), remaining);
    return () => clearTimeout(timeout);
  }, [lastSentAtMs]);

  const handleSubmit = async () => {
    const currentNow = Date.now();
    setNowMs(currentNow);
    if (
      isSubmitting ||
      !canRequestPasswordRecoveryAgain(lastSentAtMs, currentNow)
    ) {
      return;
    }
    if (!isConfigured) {
      setErrorMessage(authMessages.missingConfig);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    const result = await requestPasswordRecovery(email);
    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    const finishedAt = Date.now();
    setNowMs(finishedAt);
    setLastSentAtMs(finishedAt);
    setSent(true);
  };

  return (
    <AuthLayout>
      <PasswordRecoveryRequestView
        email={email}
        sent={sent}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
        errorMessage={errorMessage}
        onEmailChange={setEmail}
        onSubmit={() => {
          void handleSubmit();
        }}
      />
    </AuthLayout>
  );
}

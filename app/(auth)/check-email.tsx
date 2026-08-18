import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { CheckEmailView } from '@/components/auth/CheckEmailView';
import { AUTH_RESEND_COOLDOWN_MS, canResendVerification, maskEmailAddress } from '@/lib/presentation/auth-verification';
import { getPendingSignupVerification } from '@/lib/onboarding/pending-signup-verification-storage';
import { authMessages } from '@/lib/services/auth/auth-errors';
import { useAuth } from '@/providers/auth-provider';

function readEmailParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0].trim();
  }

  return '';
}

export default function CheckEmailScreen() {
  const { resendSignupVerification } = useAuth();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const paramEmail = readEmailParam(params.email);
  const [email, setEmail] = useState(paramEmail);
  const maskedEmail = useMemo(() => maskEmailAddress(email), [email]);

  const [lastSentAtMs, setLastSentAtMs] = useState(() => Date.now());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const canResend = Boolean(email) && !isResending && canResendVerification(lastSentAtMs, nowMs);

  useEffect(() => {
    if (paramEmail) {
      setEmail(paramEmail);
      return;
    }

    let cancelled = false;
    void getPendingSignupVerification().then((pending) => {
      if (!cancelled && pending?.email) {
        setEmail(pending.email);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [paramEmail]);

  useEffect(() => {
    const remainingMs = Math.max(0, AUTH_RESEND_COOLDOWN_MS - (Date.now() - lastSentAtMs));
    const timeout = setTimeout(() => {
      setNowMs(Date.now());
    }, remainingMs);
    return () => clearTimeout(timeout);
  }, [lastSentAtMs]);

  const handleResend = useCallback(async () => {
    const currentNow = Date.now();
    setNowMs(currentNow);

    if (!email || isResending || !canResendVerification(lastSentAtMs, currentNow)) {
      return;
    }

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    const result = await resendSignupVerification(email);
    const finishedAt = Date.now();
    setNowMs(finishedAt);
    setIsResending(false);

    if (!result.ok) {
      setResendError(result.error.message || authMessages.generic);
      return;
    }

    setLastSentAtMs(finishedAt);
    setResendSuccess(true);
  }, [email, isResending, lastSentAtMs, resendSignupVerification]);

  return (
    <AuthLayout>
      <CheckEmailView
        maskedEmail={maskedEmail}
        isResending={isResending}
        canResend={canResend}
        resendSuccess={resendSuccess}
        resendError={resendError}
        onResend={() => {
          void handleResend();
        }}
      />
    </AuthLayout>
  );
}
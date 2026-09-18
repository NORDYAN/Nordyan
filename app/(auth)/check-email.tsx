import { useNavigation } from '@react-navigation/native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { CheckEmailView } from '@/components/auth/CheckEmailView';
import { routes } from '@/constants/routes';
import { AUTH_RESEND_COOLDOWN_MS, canResendVerification } from '@/lib/presentation/auth-verification';
import { logNordyanAuthTrace } from '@/lib/presentation/auth-verification/auth-callback-trace';
import { shouldPreventCheckEmailNativeBack } from '@/lib/presentation/auth-verification/check-email-native-back';
import { getPendingSignupVerification, clearPendingSignupVerification } from '@/lib/onboarding/pending-signup-verification-storage';
import { releasePendingOnboardingFromOwner } from '@/lib/onboarding/pending-onboarding-ownership';
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
  const { resendSignupVerification, status, isReady } = useAuth();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const paramEmail = readEmailParam(params.email);
  const [email, setEmail] = useState(paramEmail);

  const [lastSentAtMs, setLastSentAtMs] = useState(() => Date.now());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);
  const loggedAuthRedirectRef = useRef(false);
  const resendInFlightRef = useRef(false);

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
    return navigation.addListener('beforeRemove', (event) => {
      if (shouldPreventCheckEmailNativeBack(event.data.action.type)) {
        event.preventDefault();
      }
    });
  }, [navigation]);

  useEffect(() => {
    const remainingMs = Math.max(0, AUTH_RESEND_COOLDOWN_MS - (Date.now() - lastSentAtMs));
    const timeout = setTimeout(() => {
      setNowMs(Date.now());
    }, remainingMs);
    return () => clearTimeout(timeout);
  }, [lastSentAtMs]);

  const handleResend = useCallback(async () => {
    if (resendInFlightRef.current) {
      return;
    }

    resendInFlightRef.current = true;
    try {
      const currentNow = Date.now();
      setNowMs(currentNow);

      if (!email || isResending || isChangingEmail || !canResendVerification(lastSentAtMs, currentNow)) {
        return;
      }

      setIsResending(true);
      setResendError(null);
      setResendSuccess(false);

      const result = await resendSignupVerification(email);
      const finishedAt = Date.now();
      setNowMs(finishedAt);

      if (!result.ok) {
        setResendError(result.error.message || authMessages.generic);
        return;
      }

      setLastSentAtMs(finishedAt);
      setResendSuccess(true);
    } finally {
      resendInFlightRef.current = false;
      setIsResending(false);
    }
  }, [email, isResending, isChangingEmail, lastSentAtMs, resendSignupVerification]);

  const handleUseAnotherEmail = useCallback(async () => {
    if (isChangingEmail || isResending) {
      return;
    }

    setIsChangingEmail(true);
    setChangeEmailError(null);

    try {
      const pending = await getPendingSignupVerification();
      if (pending?.ownerId) {
        await releasePendingOnboardingFromOwner(pending.ownerId);
      }
      await clearPendingSignupVerification();
      router.replace(routes.authSignUp);
    } catch {
      setChangeEmailError(authMessages.generic);
      setIsChangingEmail(false);
    }
  }, [isChangingEmail, isResending]);

  useEffect(() => {
    if (!(isReady && status === 'authenticated') || loggedAuthRedirectRef.current) {
      return;
    }
    loggedAuthRedirectRef.current = true;
    logNordyanAuthTrace('check-email.redirect', { destination: 'root' });
  }, [isReady, status]);

  if (isReady && status === 'authenticated') {
    return <Redirect href={routes.root} />;
  }

  return (
    <AuthLayout progressStep="account">
      <CheckEmailView
        email={email}
        isResending={isResending}
        canResend={canResend}
        resendSuccess={resendSuccess}
        resendError={resendError}
        isChangingEmail={isChangingEmail}
        changeEmailError={changeEmailError}
        onResend={() => {
          void handleResend();
        }}
        onUseAnotherEmail={() => {
          void handleUseAnotherEmail();
        }}
      />
    </AuthLayout>
  );
}
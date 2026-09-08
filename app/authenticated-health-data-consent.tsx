import { Redirect, router } from 'expo-router';
import { useCallback, useState } from 'react';

import { HealthDataConsentView } from '@/components/health-data-consent';
import { routes } from '@/constants/routes';
import {
  consentUserIdDiagnosticSuffix,
  logAuthenticatedConsentDiagnostic,
} from '@/lib/domain/health-data-consent';
import { decideAuthenticatedConsentSubmitNavigation } from '@/lib/onboarding/submit-authenticated-health-data-consent';
import { submitAuthenticatedHealthDataConsentRuntime } from '@/lib/onboarding/submit-authenticated-health-data-consent.runtime';
import { HEALTH_DATA_CONSENT_COPY } from '@/lib/presentation/health-data-consent';
import { useAuth } from '@/providers/auth-provider';

export default function AuthenticatedHealthDataConsentScreen() {
  const { isReady, session } = useAuth();
  const userId = session?.user.id?.trim() || null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const handleContinue = useCallback(async () => {
    if (!userId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSaveFailed(false);
    logAuthenticatedConsentDiagnostic('accept', {
      authReady: isReady,
      sessionPresent: Boolean(session),
      userIdPresent: true,
      userIdSuffix: consentUserIdDiagnosticSuffix(userId),
    });

    const result = await submitAuthenticatedHealthDataConsentRuntime(userId);
    const presence = result.ok ? result.value.presence : null;
    const navigation = decideAuthenticatedConsentSubmitNavigation({
      writeOk: result.ok,
      presence,
    });

    logAuthenticatedConsentDiagnostic('accept-result', {
      userIdPresent: true,
      userIdSuffix: consentUserIdDiagnosticSuffix(userId),
      writeOk: result.ok,
      presence: presence ?? 'none',
      navigateRoot: navigation === 'root',
      reason: result.ok ? 'active' : result.error.message,
    });

    if (navigation !== 'root') {
      setSaveFailed(true);
      setIsSubmitting(false);
      return;
    }

    router.replace(routes.root);
  }, [isReady, isSubmitting, session, userId]);

  if (!isReady) {
    return null;
  }

  if (!userId) {
    return <Redirect href={routes.root} />;
  }

  return (
    <HealthDataConsentView
      isSubmitting={isSubmitting}
      errorMessage={saveFailed ? HEALTH_DATA_CONSENT_COPY.saveError : null}
      onContinue={handleContinue}
    />
  );
}

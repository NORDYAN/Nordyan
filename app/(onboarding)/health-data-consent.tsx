import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { HealthDataConsentView } from '@/components/health-data-consent';
import { routes } from '@/constants/routes';
import { createCurrentHealthDataConsentGrant } from '@/lib/onboarding/pending-health-data-consent-store';
import { savePendingHealthDataConsent } from '@/lib/onboarding/pending-health-data-consent-storage';

export default function OnboardingHealthDataConsentScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    await savePendingHealthDataConsent(createCurrentHealthDataConsentGrant());
    router.push(routes.onboardingStep3);
  }, [isSubmitting]);

  return <HealthDataConsentView isSubmitting={isSubmitting} onContinue={handleContinue} />;
}

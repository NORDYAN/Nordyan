import { t } from '@/lib/i18n';
import { formatCoachMessage } from '@/lib/services/coach/coach.presentation';

export { formatBodyFatPercent } from '@/lib/services/health-score/health-score.presentation';

export function formatOnboardingHealthScore(score: number): string {
  return String(score);
}

/** Generic guidance when Focus/Coach cannot be generated after a valid Health Score. */
export function getOnboardingResultCoachFallback(): {
  coachTitle: string;
  coachMessage: string;
} {
  return {
    coachTitle: t('onboarding.step2.title'),
    coachMessage: formatCoachMessage(t('onboarding.bodyMeasurements.helperText')),
  };
}

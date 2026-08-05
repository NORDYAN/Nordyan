export { formatBodyFatPercent } from '@/lib/services/health-score/health-score.presentation';

export function formatOnboardingHealthScore(score: number): string {
  return String(score);
}

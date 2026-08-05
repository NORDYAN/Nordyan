import type { ProgressSummary } from '@/lib/domain/progress';

export const HOME_PROGRESS_INSUFFICIENT_LINE_1 =
  'Din första hälsomätning är sparad.';

export const HOME_PROGRESS_INSUFFICIENT_LINE_2 =
  'Uppdatera din profil igen för att börja följa din utveckling.';

export const HOME_PROGRESS_UNAVAILABLE_MESSAGE =
  'Din utveckling kan inte visas just nu.';

export function formatHomeProgressDeltaLabel(summary: ProgressSummary): string | null {
  if (summary.trend === 'insufficient_history') {
    return null;
  }

  if (summary.trend === 'improving') {
    return `↑ +${summary.scoreChange} sedan senaste uppdateringen`;
  }

  if (summary.trend === 'declining') {
    return `↓ ${summary.scoreChange} sedan senaste uppdateringen`;
  }

  return '— Oförändrad sedan senaste uppdateringen';
}

import { getLocalizedCoachPresentation } from '@/lib/i18n/localized-presentation';
import type { CoachRecommendationPresentationSignals } from '@/lib/presentation/coach-recommendation';

export function getCoachPresentation(
  recommendationId: string,
  durationMinutes: number,
  frequencyPerWeek: number,
  signals?: CoachRecommendationPresentationSignals,
): { title: string; description: string } {
  return getLocalizedCoachPresentation(
    recommendationId,
    durationMinutes,
    frequencyPerWeek,
    'sv',
    signals,
  );
}

export function formatCoachMessage(description: string): string {
  return `"${description}"`;
}

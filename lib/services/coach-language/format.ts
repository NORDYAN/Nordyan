import { formatCoachMessage } from '@/lib/services/coach/coach.presentation';
import type { CoachMessage } from '@/shared/coach-language';

/** Maps a validated AI coach message into the HomeCoachCard string shape. */
export function formatLanguageMessageForHome(message: CoachMessage): string {
  const body = message.body.trim();
  if (body) {
    return formatCoachMessage(body);
  }

  return formatCoachMessage(message.headline.trim());
}

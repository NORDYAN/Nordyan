export type CoachPresentation = {
  title: string;
  formatDescription: (durationMinutes: number, frequencyPerWeek: number) => string;
};

type CoachPresentationEntry = CoachPresentation & {
  recommendationId: string;
};

function formatSwedishDaysPerWeek(frequencyPerWeek: number): string {
  switch (frequencyPerWeek) {
    case 1:
      return 'en gång den här veckan';
    case 2:
      return 'två dagar den här veckan';
    case 3:
      return 'tre dagar den här veckan';
    case 4:
      return 'fyra dagar den här veckan';
    case 5:
      return 'fem dagar den här veckan';
    case 6:
      return 'sex dagar den här veckan';
    default:
      return `${frequencyPerWeek} dagar den här veckan`;
  }
}

const COACH_PRESENTATION: CoachPresentationEntry[] = [
  {
    recommendationId: 'waist_walk_after_dinner_v1',
    title: 'Promenad efter middagen',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Promenera ${durationMinutes} minuter efter middagen ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'waist_increase_walking_volume_v1',
    title: 'Öka veckans promenader',
    formatDescription: () =>
      'Lägg till några extra promenader den här veckan för att stödja ditt fokus.',
  },
  {
    recommendationId: 'waist_active_walk_progression_v1',
    title: 'Bygg ut dina promenader',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Fortsätt med ${durationMinutes} minuters promenader ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'waist_measurement_follow_up_v1',
    title: 'Följ upp dina mått',
    formatDescription: () =>
      'Mät midjan igen om cirka fyra veckor för att se hur dina vanor utvecklas.',
  },
  {
    recommendationId: 'activity_sedentary_walk_start_v1',
    title: 'Börja med korta promenader',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Promenera ${durationMinutes} minuter ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'activity_light_walk_build_v1',
    title: 'Bygg promenadvanan',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Promenera ${durationMinutes} minuter i lugnt tempo ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'activity_moderate_brisk_walk_v1',
    title: 'Rask promenad',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Promenera ${durationMinutes} minuter i raskare tempo ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'activity_active_structured_movement_v1',
    title: 'Strukturerad rörelse',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Planera ${durationMinutes} minuters rörelse ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'activity_very_active_strength_v1',
    title: 'Grundläggande styrketräning',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Lägg till ${durationMinutes} minuters enkel styrketräning ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'body_comp_daily_walk_v1',
    title: 'Daglig rörelse',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Promenera ${durationMinutes} minuter ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'body_comp_walk_strength_combo_v1',
    title: 'Promenad och styrka',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Kombinera ${durationMinutes} minuters promenad med enkel styrketräning ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'body_comp_strength_foundation_v1',
    title: 'Styrketräning i grunden',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Lägg till ${durationMinutes} minuters grundläggande styrketräning ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'weight_balance_gentle_nutrition_v1',
    title: 'Skapa balanserade måltider',
    formatDescription: () =>
      'Prioritera regelbundna, näringsrika måltider den här veckan utan att stressa kroppen.',
  },
  {
    recommendationId: 'weight_balance_walking_v1',
    title: 'Promenader för balans',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Promenera ${durationMinutes} minuter ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'weight_balance_active_movement_v1',
    title: 'Aktiv rörelse',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Planera ${durationMinutes} minuters rörelse ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
  {
    recommendationId: 'weight_balance_measurement_check_v1',
    title: 'Följ upp kroppssammansättningen',
    formatDescription: () =>
      'Uppdatera dina mått den här veckan så att rekommendationerna speglar din faktiska profil.',
  },
  {
    recommendationId: 'maintain_weekly_check_in_v1',
    title: 'Veckans avstämning',
    formatDescription: () =>
      'Ta en kort stund att se hur dina vanor ser ut och vad som fungerar bra just nu.',
  },
  {
    recommendationId: 'maintain_routine_consistency_v1',
    title: 'Behåll din goda rutin',
    formatDescription: () =>
      'Fortsätt med de vanor som fungerar och håll en jämn nivå den här veckan.',
  },
  {
    recommendationId: 'fallback_gentle_walk_v1',
    title: 'En lugn promenad',
    formatDescription: (durationMinutes, frequencyPerWeek) =>
      `Promenera ${durationMinutes} minuter i lugnt tempo ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
  },
];

const COACH_PRESENTATION_BY_ID = new Map(
  COACH_PRESENTATION.map((entry) => [entry.recommendationId, entry]),
);

const DEFAULT_PRESENTATION: CoachPresentation = {
  title: 'Dagens rekommendation',
  formatDescription: (durationMinutes, frequencyPerWeek) =>
    `Promenera ${durationMinutes} minuter ${formatSwedishDaysPerWeek(frequencyPerWeek)}.`,
};

export function getCoachPresentation(
  recommendationId: string,
  durationMinutes: number,
  frequencyPerWeek: number,
): { title: string; description: string } {
  const entry = COACH_PRESENTATION_BY_ID.get(recommendationId) ?? DEFAULT_PRESENTATION;

  return {
    title: entry.title,
    description: entry.formatDescription(durationMinutes, frequencyPerWeek),
  };
}

export function formatCoachMessage(description: string): string {
  return `"${description}"`;
}

import type { FocusType } from '@/lib/domain/focus-engine';

export type FocusPresentation = {
  title: string;
  subtitle: string;
};

const FOCUS_PRESENTATION: Record<FocusType, FocusPresentation> = {
  reduce_waist: {
    title: 'Minska midjemåttet',
    subtitle:
      'Det är den förändring som har störst potential att förbättra din NORDYAN Score.',
  },
  improve_activity: {
    title: 'Öka din aktivitet',
    subtitle: 'Mer regelbunden rörelse är din viktigaste förbättring just nu.',
  },
  improve_body_composition: {
    title: 'Förbättra kroppssammansättningen',
    subtitle: 'Din största möjlighet ligger i kroppssammansättningen.',
  },
  improve_weight_balance: {
    title: 'Hitta en bättre viktbalans',
    subtitle: 'En mer balanserad vikt i relation till längd kan förbättra din poäng.',
  },
  maintain_current_path: {
    title: 'Fortsätt på samma väg',
    subtitle: 'Din profil är stark. Behåll de vanor som fungerar.',
  },
};

export function getFocusPresentation(focus: FocusType): FocusPresentation {
  return FOCUS_PRESENTATION[focus];
}

import { routes } from '@/constants/routes';

export function onboardingResultHref(visit: string = String(Date.now())): {
  pathname: typeof routes.onboardingStep5;
  params: { visit: string };
} {
  return {
    pathname: routes.onboardingStep5,
    params: { visit },
  };
}

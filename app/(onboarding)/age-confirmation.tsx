import { Redirect } from 'expo-router';

import { routes } from '@/constants/routes';

export default function AgeConfirmationRedirectScreen() {
  return <Redirect href={routes.onboardingHealthDataConsent} />;
}

import { router } from 'expo-router';

import { InitialLifestyleView } from '@/components/initial-lifestyle';
import { routes } from '@/constants/routes';
import { useOnboardingInitialLifestyle } from '@/lib/hooks/initial-lifestyle';

export default function OnboardingLifestyleScreen() {
  const flow = useOnboardingInitialLifestyle({
    onFinished: () => {
      router.push(routes.onboardingStep4);
    },
  });

  return <InitialLifestyleView flow={flow} />;
}

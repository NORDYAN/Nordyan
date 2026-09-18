import { OnboardingBackButton } from '@/components/onboarding';

type WeeklyCheckInBackButtonProps = {
  onPress: () => void;
};

export function WeeklyCheckInBackButton({ onPress }: WeeklyCheckInBackButtonProps) {
  return <OnboardingBackButton onPress={onPress} />;
}

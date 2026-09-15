import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  formatOnboardingMajorProgress,
  type OnboardingMajorStepId,
} from '@/lib/presentation/onboarding-progress';
import { colors, typography } from '@/theme';

type OnboardingMajorProgressProps = {
  step: OnboardingMajorStepId;
};

export function OnboardingMajorProgress({ step }: OnboardingMajorProgressProps) {
  useI18n();
  const label = formatOnboardingMajorProgress(step);

  return (
    <Text
      style={styles.progress}
      accessibilityRole="text"
      accessibilityLabel={label}
      maxFontSizeMultiplier={1.1}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  progress: {
    color: colors.onboardingAccent,
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingTop: 4,
    paddingBottom: 8,
  },
});

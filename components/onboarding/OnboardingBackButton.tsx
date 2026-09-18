import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { OnboardingMajorProgress } from '@/components/onboarding/OnboardingMajorProgress';
import { t } from '@/lib/i18n';
import type { OnboardingMajorStepId } from '@/lib/presentation/onboarding-progress';
import { colors } from '@/theme';
import { initialLifestyleLayout } from '@/theme/initial-lifestyle';

type OnboardingBackButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
};

export function OnboardingBackButton({ onPress, disabled = false }: OnboardingBackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      accessibilityState={disabled ? { disabled: true } : undefined}
      hitSlop={initialLifestyleLayout.backHitSlop}
      disabled={disabled}
      onPress={onPress ?? (() => router.back())}
      style={({ pressed }) => [styles.back, pressed && !disabled && styles.pressed]}
    >
      <Ionicons
        name="chevron-back"
        size={initialLifestyleLayout.backIconSize}
        color={colors.onboardingText}
      />
    </Pressable>
  );
}

type OnboardingBackHeaderProps = {
  step: OnboardingMajorStepId;
};

export function OnboardingBackHeader({ step }: OnboardingBackHeaderProps) {
  return (
    <View style={styles.header}>
      <OnboardingBackButton />
      <View style={styles.progressSlot}>
        <OnboardingMajorProgress step={step} />
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: initialLifestyleLayout.headerPaddingHorizontal,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  progressSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
});

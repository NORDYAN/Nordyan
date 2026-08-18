import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Text';
import { typography } from '@/theme';
import {
  weeklyCheckInColors,
  weeklyCheckInLayout,
  weeklyCheckInTypography,
} from '@/theme/weekly-check-in';

type WeeklyCheckInPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function WeeklyCheckInPrimaryButton({
  label,
  onPress,
  disabled = false,
}: WeeklyCheckInPrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.label} maxFontSizeMultiplier={1.1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: weeklyCheckInLayout.ctaHeight,
    borderRadius: weeklyCheckInLayout.ctaRadius,
    backgroundColor: weeklyCheckInColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    color: weeklyCheckInColors.buttonText,
    fontSize: weeklyCheckInTypography.ctaSize,
    fontWeight: typography.fontWeight.bold,
    includeFontPadding: false,
  },
});

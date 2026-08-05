import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, onboardingLayout, radii, spacing, typography } from '@/theme';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'light' | 'onboarding';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export function Button({
  label,
  variant = 'primary',
  style,
  labelStyle,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'light' && styles.light,
        variant === 'onboarding' && styles.onboarding,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.primaryLabel,
          variant === 'secondary' && styles.secondaryLabel,
          variant === 'light' && styles.lightLabel,
          variant === 'onboarding' && styles.onboardingLabel,
          labelStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  light: {
    backgroundColor: colors.surface,
  },
  onboarding: {
    backgroundColor: colors.onboardingAccent,
    borderRadius: radii.pill,
    height: onboardingLayout.buttonHeight,
    paddingVertical: 0,
    shadowColor: colors.onboardingAccent,
    shadowOffset: { width: 0, height: spacing.sm },
    shadowOpacity: 0.2,
    shadowRadius: spacing.sm,
    elevation: 4,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  primaryLabel: {
    color: colors.surface,
  },
  secondaryLabel: {
    color: colors.textPrimary,
  },
  lightLabel: {
    color: colors.textPrimary,
  },
  onboardingLabel: {
    color: colors.onboardingButtonText,
    fontWeight: typography.fontWeight.semibold,
  },
});

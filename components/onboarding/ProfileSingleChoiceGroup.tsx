import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, onboardingProfileLayout, radii, spacing, typography } from '@/theme';

type ProfileSingleChoiceOption<T extends string> = {
  label: string;
  value: T;
};

type ProfileSingleChoiceGroupProps<T extends string> = {
  label: string;
  value: T | null;
  options: readonly ProfileSingleChoiceOption<T>[];
  onChange: (value: T) => void;
  layout?: 'row' | 'stack';
  optionIcons?: Partial<Record<T, keyof typeof Ionicons.glyphMap>>;
  helper?: string;
  beforeOptions?: ReactNode;
};

export function ProfileSingleChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  layout = 'stack',
  optionIcons,
  helper,
  beforeOptions,
}: ProfileSingleChoiceGroupProps<T>) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      {beforeOptions}
      <View style={layout === 'row' ? styles.optionsRow : styles.optionsStack}>
        {options.map((option) => {
          const selected = value === option.value;
          const iconName = optionIcons?.[option.value];
          const iconColor = selected ? colors.onboardingAccent : colors.onboardingProfileLabel;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                layout === 'row' ? styles.optionRow : styles.optionStack,
                iconName ? styles.optionWithIcon : null,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              {iconName ? (
                <View style={styles.iconLabelColumn}>
                  <Ionicons
                    name={iconName}
                    size={onboardingProfileLayout.genderIconSize}
                    color={iconColor}
                  />
                  <Text
                    style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                    numberOfLines={2}
                  >
                    {option.label}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: onboardingProfileLayout.choiceLabelGap,
  },
  label: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: onboardingProfileLayout.choiceOptionGap,
    width: '100%',
  },
  optionsStack: {
    gap: onboardingProfileLayout.choiceOptionGap,
    width: '100%',
  },
  optionRow: {
    flex: 1,
    minHeight: onboardingProfileLayout.genderCardMinHeight,
    borderRadius: radii.lg,
    backgroundColor: colors.onboardingProfileFieldBackground,
    borderWidth: 1,
    borderColor: colors.onboardingProfileFieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
  },
  optionWithIcon: {
    minHeight: onboardingProfileLayout.genderCardWithIconMinHeight,
    paddingVertical: 14,
  },
  optionStack: {
    minHeight: onboardingProfileLayout.genderCardMinHeight,
    borderRadius: radii.lg,
    backgroundColor: colors.onboardingProfileFieldBackground,
    borderWidth: 1,
    borderColor: colors.onboardingProfileFieldBorder,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  iconLabelColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: onboardingProfileLayout.genderIconLabelGap,
    width: '100%',
  },
  optionSelected: {
    borderColor: colors.onboardingAccent,
    backgroundColor: colors.onboardingProfileSelectedFill,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionLabel: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: colors.onboardingText,
    fontWeight: typography.fontWeight.medium,
  },
  helper: {
    color: colors.onboardingProfileSubtitle,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    width: '100%',
  },
});

import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { typography } from '@/theme';
import {
  weeklyCheckInColors,
  weeklyCheckInLayout,
  weeklyCheckInTypography,
} from '@/theme/weekly-check-in';

type WeeklyCheckInOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function WeeklyCheckInOption({ label, selected, onPress }: WeeklyCheckInOptionProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected ? styles.optionSelected : styles.optionIdle,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.label, selected ? styles.labelSelected : styles.labelIdle]}
        maxFontSizeMultiplier={1.1}
      >
        {label}
      </Text>
      <View style={[styles.radio, selected ? styles.radioSelected : styles.radioIdle]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    width: '100%',
    minHeight: weeklyCheckInLayout.optionMinHeight,
    borderRadius: weeklyCheckInLayout.optionRadius,
    borderWidth: 1,
    paddingHorizontal: weeklyCheckInLayout.optionPaddingHorizontal,
    paddingVertical: weeklyCheckInLayout.optionPaddingVertical,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionIdle: {
    backgroundColor: weeklyCheckInColors.card,
    borderColor: weeklyCheckInColors.border,
  },
  optionSelected: {
    backgroundColor: weeklyCheckInColors.selectedFill,
    borderColor: weeklyCheckInColors.primary,
  },
  pressed: {
    opacity: 0.92,
  },
  label: {
    fontSize: weeklyCheckInTypography.optionSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  labelIdle: {
    color: weeklyCheckInColors.title,
  },
  labelSelected: {
    color: weeklyCheckInColors.primary,
  },
  radio: {
    width: weeklyCheckInLayout.radioSize,
    height: weeklyCheckInLayout.radioSize,
    borderRadius: weeklyCheckInLayout.radioRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIdle: {
    borderWidth: weeklyCheckInLayout.radioBorderWidth,
    borderColor: weeklyCheckInColors.muted,
    backgroundColor: 'transparent',
  },
  radioSelected: {
    borderWidth: weeklyCheckInLayout.radioBorderWidth,
    borderColor: weeklyCheckInColors.primary,
    backgroundColor: 'transparent',
  },
  radioDot: {
    width: weeklyCheckInLayout.radioDotSize,
    height: weeklyCheckInLayout.radioDotSize,
    borderRadius: weeklyCheckInLayout.radioDotSize / 2,
    backgroundColor: weeklyCheckInColors.primary,
  },
});

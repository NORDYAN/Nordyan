import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { typography } from '@/theme';
import {
  initialLifestyleColors,
  initialLifestyleLayout,
  initialLifestyleTypography,
} from '@/theme/initial-lifestyle';

type InitialLifestyleOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function InitialLifestyleOption({ label, selected, onPress }: InitialLifestyleOptionProps) {
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
    minHeight: initialLifestyleLayout.optionMinHeight,
    borderRadius: initialLifestyleLayout.optionRadius,
    borderWidth: 2,
    padding: initialLifestyleLayout.optionPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: initialLifestyleColors.card,
  },
  optionIdle: {
    borderColor: initialLifestyleColors.border,
  },
  optionSelected: {
    borderColor: initialLifestyleColors.primary,
    shadowColor: initialLifestyleColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  pressed: {
    opacity: 0.92,
  },
  label: {
    flex: 1,
    paddingRight: 12,
    fontSize: initialLifestyleTypography.optionSize,
    includeFontPadding: false,
  },
  labelIdle: {
    color: initialLifestyleColors.title,
    fontWeight: typography.fontWeight.medium,
  },
  labelSelected: {
    color: initialLifestyleColors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  radio: {
    width: initialLifestyleLayout.radioSize,
    height: initialLifestyleLayout.radioSize,
    borderRadius: initialLifestyleLayout.radioRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIdle: {
    borderWidth: initialLifestyleLayout.radioBorderWidth,
    borderColor: initialLifestyleColors.border,
    backgroundColor: 'transparent',
  },
  radioSelected: {
    borderWidth: initialLifestyleLayout.radioBorderWidth,
    borderColor: initialLifestyleColors.primary,
    backgroundColor: initialLifestyleColors.primary,
  },
  radioDot: {
    width: initialLifestyleLayout.radioDotSize,
    height: initialLifestyleLayout.radioDotSize,
    borderRadius: initialLifestyleLayout.radioDotSize / 2,
    backgroundColor: initialLifestyleColors.primary,
  },
});

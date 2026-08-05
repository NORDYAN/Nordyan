import { StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, onboardingProfileLayout, radii, typography } from '@/theme';

type ProfileMeasurementFieldProps = {
  label: string;
  value: string;
  unit: string;
  placeholder?: string;
  editable?: boolean;
  errorMessage?: string;
  uppercaseLabel?: boolean;
  stacked?: boolean;
  onChangeText: (text: string) => void;
};

export function ProfileMeasurementField({
  label,
  value,
  unit,
  placeholder,
  editable = true,
  errorMessage,
  uppercaseLabel = true,
  stacked = false,
  onChangeText,
}: ProfileMeasurementFieldProps) {
  return (
    <View style={[styles.root, stacked ? styles.rootStacked : styles.rootInline]}>
      <Text style={[styles.label, !uppercaseLabel && styles.labelTitleCase]}>{label}</Text>
      <View style={[styles.inputField, errorMessage ? styles.inputFieldError : null]}>
        <TextInput
          style={styles.input}
          value={value}
          editable={editable}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={colors.onboardingProfilePlaceholder}
          selectionColor={colors.onboardingAccent}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: onboardingProfileLayout.fieldLabelGap,
    minWidth: 0,
  },
  rootInline: {
    flex: 1,
  },
  rootStacked: {
    width: '100%',
  },
  label: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  labelTitleCase: {
    letterSpacing: 0,
    textTransform: 'none',
  },
  inputField: {
    height: onboardingProfileLayout.fieldHeight,
    borderRadius: radii.lg,
    backgroundColor: colors.onboardingProfileFieldBackground,
    borderWidth: 1,
    borderColor: colors.onboardingProfileFieldBorder,
    paddingHorizontal: onboardingProfileLayout.fieldPaddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputFieldError: {
    borderColor: colors.onboardingErrorText,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.onboardingText,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    paddingVertical: 0,
    marginRight: 10,
  },
  unit: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    minWidth: 24,
    textAlign: 'right',
  },
  error: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
});

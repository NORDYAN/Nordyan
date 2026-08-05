import { StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, typography } from '@/theme';

type MeasurementInputProps = {
  label: string;
  value: string;
  unit: string;
  editable?: boolean;
  errorMessage?: string;
  onChangeText: (text: string) => void;
};

export function MeasurementInput({
  label,
  value,
  unit,
  editable = true,
  errorMessage,
  onChangeText,
}: MeasurementInputProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputField, errorMessage ? styles.inputFieldError : null]}>
        <TextInput
          style={styles.input}
          value={value}
          editable={editable}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
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
    gap: 8,
  },
  label: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  inputField: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#252A30',
    borderWidth: 1,
    borderColor: colors.homeBorder,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputFieldError: {
    borderColor: '#F97066',
  },
  input: {
    flex: 1,
    color: colors.onboardingText,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    paddingVertical: 0,
    marginRight: 8,
  },
  unit: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
  },
  error: {
    color: '#F97066',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
});

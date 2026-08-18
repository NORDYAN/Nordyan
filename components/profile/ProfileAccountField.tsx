import { StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, onboardingProfileLayout, radii, typography } from '@/theme';

type ProfileAccountFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  editable?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  maxLength?: number;
  errorMessage?: string;
  onChangeText?: (text: string) => void;
};

export function ProfileAccountField({
  label,
  value,
  placeholder,
  editable = true,
  autoCapitalize = 'none',
  maxLength,
  errorMessage,
  onChangeText,
}: ProfileAccountFieldProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputField, errorMessage ? styles.inputFieldError : null]}>
        <TextInput
          style={styles.input}
          value={value}
          editable={editable}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.onboardingProfilePlaceholder}
          selectionColor={colors.onboardingAccent}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          underlineColorAndroid="transparent"
        />
      </View>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: onboardingProfileLayout.fieldLabelGap,
    minWidth: 0,
  },
  label: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  inputField: {
    minHeight: onboardingProfileLayout.fieldHeight,
    borderRadius: radii.lg,
    backgroundColor: colors.onboardingProfileFieldBackground,
    borderWidth: 1,
    borderColor: colors.onboardingProfileFieldBorder,
    paddingHorizontal: onboardingProfileLayout.fieldPaddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingVertical: 10,
  },
  error: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
});

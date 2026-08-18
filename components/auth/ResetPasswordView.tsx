import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { MIN_PASSWORD_LENGTH } from '@/lib/services/auth/auth-errors';
import { colors, radii, typography } from '@/theme';
import { authLayout } from '@/theme/auth';

type ResetPasswordViewProps = {
  password: string;
  confirmation: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  success: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
  onSubmit: () => void;
  onContinue: () => void;
};

export function ResetPasswordView({
  password,
  confirmation,
  errorMessage,
  isSubmitting,
  success,
  onPasswordChange,
  onConfirmationChange,
  onSubmit,
  onContinue,
}: ResetPasswordViewProps) {
  useI18n();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  if (success) {
    return (
      <View style={styles.root}>
        <Text style={styles.title} accessibilityRole="header">
          {t('auth.recovery.reset.successTitle')}
        </Text>
        <Text style={styles.body}>{t('auth.recovery.reset.successBody')}</Text>
        <Button
          label={t('auth.recovery.reset.continue')}
          variant="onboarding"
          onPress={onContinue}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <Text style={styles.title} accessibilityRole="header">
          {t('auth.recovery.reset.title')}
        </Text>
        <Text style={styles.body}>
          {t('auth.recovery.reset.passwordHint', { min: MIN_PASSWORD_LENGTH })}
        </Text>
      </View>

      <PasswordField
        label={t('auth.recovery.reset.newPassword')}
        value={password}
        visible={passwordVisible}
        isSubmitting={isSubmitting}
        invalid={Boolean(errorMessage)}
        onChange={onPasswordChange}
        onToggle={() => setPasswordVisible((visible) => !visible)}
      />
      <PasswordField
        label={t('auth.recovery.reset.confirmPassword')}
        value={confirmation}
        visible={confirmationVisible}
        isSubmitting={isSubmitting}
        invalid={Boolean(errorMessage)}
        onChange={onConfirmationChange}
        onToggle={() => setConfirmationVisible((visible) => !visible)}
        onSubmit={onSubmit}
      />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Button
        label={
          isSubmitting
            ? t('auth.recovery.reset.submitting')
            : t('auth.recovery.reset.submit')
        }
        variant="onboarding"
        disabled={isSubmitting}
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        onPress={onSubmit}
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
      />
    </View>
  );
}

function PasswordField({
  label,
  value,
  visible,
  isSubmitting,
  invalid,
  onChange,
  onToggle,
  onSubmit,
}: {
  label: string;
  value: string;
  visible: boolean;
  isSubmitting: boolean;
  invalid: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  onSubmit?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputField, invalid && styles.inputInvalid]}>
        <TextInput
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          editable={!isSubmitting}
          returnKeyType={onSubmit ? 'done' : 'next'}
          secureTextEntry={!visible}
          selectionColor={colors.onboardingAccent}
          style={styles.input}
          textContentType="newPassword"
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          disabled={isSubmitting}
          onPress={onToggle}
          style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.onboardingProfileLabel}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: authLayout.formGap,
  },
  copy: {
    gap: authLayout.formGap,
    marginBottom: 4,
  },
  title: {
    color: colors.onboardingText,
    fontSize: authLayout.headingSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: authLayout.headingSize * typography.lineHeight.tight,
  },
  body: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  field: {
    gap: authLayout.fieldLabelGap,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  inputField: {
    height: authLayout.fieldHeight,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.onboardingProfileFieldBorder,
    backgroundColor: colors.onboardingProfileFieldBackground,
    paddingLeft: authLayout.fieldPaddingHorizontal,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputInvalid: {
    borderColor: colors.onboardingErrorText,
  },
  input: {
    flex: 1,
    color: colors.onboardingText,
    fontSize: typography.fontSize.md,
  },
  toggle: {
    width: authLayout.toggleSize,
    height: authLayout.toggleSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglePressed: {
    opacity: 0.7,
  },
  error: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
  },
  button: {
    width: '100%',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});

import { Link } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, radii, typography } from '@/theme';
import { authLayout } from '@/theme/auth';

type PasswordRecoveryRequestViewProps = {
  email: string;
  sent: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  errorMessage: string | null;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
};

export function PasswordRecoveryRequestView({
  email,
  sent,
  isSubmitting,
  canSubmit,
  errorMessage,
  onEmailChange,
  onSubmit,
}: PasswordRecoveryRequestViewProps) {
  useI18n();

  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <Text style={styles.title} accessibilityRole="header">
          {t('auth.recovery.request.title')}
        </Text>
        <Text style={styles.body}>
          {sent ? t('auth.recovery.request.neutralSuccess') : t('auth.recovery.request.body')}
        </Text>
      </View>

      {!sent ? (
        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!isSubmitting}
            keyboardType="email-address"
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={colors.onboardingProfilePlaceholder}
            returnKeyType="send"
            selectionColor={colors.onboardingAccent}
            style={[styles.input, errorMessage && styles.inputInvalid]}
            textContentType="emailAddress"
            value={email}
            onChangeText={onEmailChange}
            onSubmitEditing={onSubmit}
          />
        </View>
      ) : null}

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Button
        label={
          isSubmitting
            ? t('auth.recovery.request.submitting')
            : sent
              ? t('auth.recovery.request.resend')
              : t('auth.recovery.request.submit')
        }
        variant="onboarding"
        disabled={isSubmitting || !canSubmit}
        accessibilityState={{ disabled: isSubmitting || !canSubmit, busy: isSubmitting }}
        onPress={onSubmit}
        style={[styles.button, (isSubmitting || !canSubmit) && styles.buttonDisabled]}
      />

      <Link href={routes.authSignIn} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('auth.recovery.backToSignIn')}
          style={({ pressed }) => [styles.linkHit, pressed && styles.linkPressed]}
        >
          <Text style={styles.link}>{t('auth.recovery.backToSignIn')}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: authLayout.headingToFormGap,
  },
  copy: {
    gap: authLayout.formGap,
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
  input: {
    height: authLayout.fieldHeight,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.onboardingProfileFieldBorder,
    backgroundColor: colors.onboardingProfileFieldBackground,
    color: colors.onboardingText,
    fontSize: typography.fontSize.md,
    paddingHorizontal: authLayout.fieldPaddingHorizontal,
  },
  inputInvalid: {
    borderColor: colors.onboardingErrorText,
  },
  error: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
  },
  button: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  linkHit: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  linkPressed: {
    opacity: 0.75,
  },
  link: {
    color: colors.onboardingAccent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

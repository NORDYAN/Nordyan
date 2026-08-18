import { Link, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, radii, typography } from '@/theme';
import { authLayout } from '@/theme/auth';

type PasswordAutoComplete = Extract<
  NonNullable<TextInputProps['autoComplete']>,
  'password' | 'new-password'
>;

type PasswordTextContentType = Extract<
  NonNullable<TextInputProps['textContentType']>,
  'password' | 'newPassword'
>;

type AuthFormProps = {
  title: string;
  submitLabel: string;
  loadingLabel: string;
  alternatePrompt: string;
  alternateHref: Href;
  alternateLabel: string;
  email: string;
  password: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  invalid?: boolean;
  passwordHint?: string;
  passwordAutoComplete?: PasswordAutoComplete;
  passwordTextContentType?: PasswordTextContentType;
  passwordActionHref?: Href;
  passwordActionLabel?: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

type AuthFieldState = 'idle' | 'focused' | 'populated' | 'invalid' | 'submitting';

function resolveFieldState(input: {
  focused: boolean;
  invalid: boolean;
  submitting: boolean;
  populated: boolean;
}): AuthFieldState {
  if (input.submitting) {
    return 'submitting';
  }
  if (input.invalid) {
    return 'invalid';
  }
  if (input.focused) {
    return 'focused';
  }
  if (input.populated) {
    return 'populated';
  }
  return 'idle';
}

export function AuthForm({
  title,
  submitLabel,
  loadingLabel,
  alternatePrompt,
  alternateHref,
  alternateLabel,
  email,
  password,
  errorMessage,
  isSubmitting,
  invalid = false,
  passwordHint,
  passwordAutoComplete = 'password',
  passwordTextContentType = 'password',
  passwordActionHref,
  passwordActionLabel,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthFormProps) {
  useI18n();
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const emailState = resolveFieldState({
    focused: emailFocused,
    invalid,
    submitting: isSubmitting,
    populated: email.length > 0,
  });
  const passwordState = resolveFieldState({
    focused: passwordFocused,
    invalid,
    submitting: isSubmitting,
    populated: password.length > 0,
  });

  const visibilityLabel = passwordVisible ? t('auth.hidePassword') : t('auth.showPassword');

  return (
    <View style={styles.root}>
      <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.1}>
        {title}
      </Text>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <View style={[styles.inputField, styles.inputFieldEmail, fieldChrome(emailState)]}>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isSubmitting}
              keyboardType="email-address"
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={colors.onboardingProfilePlaceholder}
              returnKeyType="next"
              selectionColor={colors.onboardingAccent}
              style={styles.input}
              textContentType="emailAddress"
              value={email}
              onBlur={() => setEmailFocused(false)}
              onChangeText={onEmailChange}
              onFocus={() => setEmailFocused(true)}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.password')}</Text>
          <View style={[styles.inputField, fieldChrome(passwordState)]}>
            <TextInput
              autoCapitalize="none"
              autoComplete={passwordAutoComplete}
              autoCorrect={false}
              editable={!isSubmitting}
              placeholderTextColor={colors.onboardingProfilePlaceholder}
              returnKeyType="done"
              secureTextEntry={!passwordVisible}
              selectionColor={colors.onboardingAccent}
              style={styles.input}
              textContentType={passwordTextContentType}
              value={password}
              onBlur={() => setPasswordFocused(false)}
              onChangeText={onPasswordChange}
              onFocus={() => setPasswordFocused(true)}
              onSubmitEditing={onSubmit}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={visibilityLabel}
              accessibilityState={{ selected: passwordVisible }}
              disabled={isSubmitting}
              hitSlop={4}
              onPress={() => setPasswordVisible((visible) => !visible)}
              style={({ pressed }) => [
                styles.visibilityToggle,
                pressed && styles.visibilityTogglePressed,
              ]}
            >
              <Ionicons
                name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.onboardingProfileLabel}
              />
            </Pressable>
          </View>
          {passwordHint ? <Text style={styles.hint}>{passwordHint}</Text> : null}
          {passwordActionHref && passwordActionLabel ? (
            <Link href={passwordActionHref} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={passwordActionLabel}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.passwordAction,
                  pressed && styles.footerLinkPressed,
                ]}
              >
                <Text style={styles.footerLink}>{passwordActionLabel}</Text>
              </Pressable>
            </Link>
          ) : null}
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Button
          label={isSubmitting ? loadingLabel : submitLabel}
          variant="onboarding"
          disabled={isSubmitting}
          accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
          onPress={onSubmit}
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{alternatePrompt}</Text>
        <Link href={alternateHref} asChild>
          <Pressable
            disabled={isSubmitting}
            accessibilityRole="link"
            accessibilityLabel={alternateLabel}
            style={({ pressed }) => [styles.footerLinkHit, pressed && styles.footerLinkPressed]}
          >
            <Text style={styles.footerLink}>{alternateLabel}</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

function fieldChrome(state: AuthFieldState) {
  switch (state) {
    case 'focused':
      return styles.inputFieldFocused;
    case 'invalid':
      return styles.inputFieldInvalid;
    case 'submitting':
      return styles.inputFieldSubmitting;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: authLayout.headingToFormGap,
  },
  title: {
    color: colors.onboardingText,
    fontSize: authLayout.headingSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: authLayout.headingSize * typography.lineHeight.tight,
    letterSpacing: authLayout.headingLetterSpacing,
  },
  form: {
    gap: authLayout.formGap,
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
    minHeight: authLayout.fieldHeight,
    height: authLayout.fieldHeight,
    borderRadius: radii.lg,
    backgroundColor: colors.onboardingProfileFieldBackground,
    borderWidth: 1,
    borderColor: colors.onboardingProfileFieldBorder,
    paddingLeft: authLayout.fieldPaddingHorizontal,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFieldEmail: {
    paddingRight: authLayout.fieldPaddingHorizontal,
  },
  inputFieldFocused: {
    borderColor: colors.onboardingAccent,
  },
  inputFieldInvalid: {
    borderColor: colors.onboardingErrorText,
  },
  inputFieldSubmitting: {
    opacity: 0.7,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.onboardingText,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    paddingVertical: 0,
  },
  visibilityToggle: {
    width: authLayout.toggleSize,
    height: authLayout.toggleSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityTogglePressed: {
    opacity: 0.7,
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
  passwordAction: {
    minHeight: 36,
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  error: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  submitButton: {
    width: '100%',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: authLayout.footerGap,
    marginTop: authLayout.footerTopGap,
  },
  footerText: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.sm,
  },
  footerLinkHit: {
    minHeight: 44,
    justifyContent: 'center',
  },
  footerLinkPressed: {
    opacity: 0.75,
  },
  footerLink: {
    color: colors.onboardingAccent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

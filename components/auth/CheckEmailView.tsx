import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import {
  AUTH_VERIFICATION_COPY,
  buildCheckEmailBody,
} from '@/lib/presentation/auth-verification';
import { colors, typography } from '@/theme';
import { authLayout } from '@/theme/auth';

type CheckEmailViewProps = {
  maskedEmail: string;
  isResending: boolean;
  canResend: boolean;
  resendSuccess: boolean;
  resendError: string | null;
  onResend: () => void;
};

export function CheckEmailView({
  maskedEmail,
  isResending,
  canResend,
  resendSuccess,
  resendError,
  onResend,
}: CheckEmailViewProps) {
  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.1}>
          {AUTH_VERIFICATION_COPY.checkEmailHeading}
        </Text>
        {maskedEmail ? (
          <Text style={styles.body} maxFontSizeMultiplier={1.15}>
            {buildCheckEmailBody(maskedEmail)}
          </Text>
        ) : null}
        <Text style={styles.body} maxFontSizeMultiplier={1.15}>
          {AUTH_VERIFICATION_COPY.checkEmailInstruction}
        </Text>
      </View>

      {resendSuccess ? (
        <Text style={styles.success} maxFontSizeMultiplier={1.1}>
          {AUTH_VERIFICATION_COPY.resendSuccess}
        </Text>
      ) : null}
      {resendError ? (
        <Text style={styles.error} maxFontSizeMultiplier={1.1}>
          {resendError}
        </Text>
      ) : null}

      <Button
        label={isResending ? AUTH_VERIFICATION_COPY.resendSubmitting : AUTH_VERIFICATION_COPY.resend}
        variant="onboarding"
        disabled={isResending || !canResend}
        accessibilityState={{ disabled: isResending || !canResend, busy: isResending }}
        onPress={onResend}
        style={[styles.resendButton, (isResending || !canResend) && styles.resendButtonDisabled]}
      />

      <View style={styles.footer}>
        <Link href={routes.authSignIn} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={AUTH_VERIFICATION_COPY.returnToSignIn}
            style={({ pressed }) => [styles.footerLinkHit, pressed && styles.footerLinkPressed]}
          >
            <Text style={styles.footerLink}>{AUTH_VERIFICATION_COPY.returnToSignIn}</Text>
          </Pressable>
        </Link>
      </View>
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
    letterSpacing: authLayout.headingLetterSpacing,
  },
  body: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  success: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
  },
  error: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
  },
  resendButton: {
    width: '100%',
  },
  resendButtonDisabled: {
    opacity: 0.45,
  },
  footer: {
    marginTop: authLayout.footerTopGap,
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

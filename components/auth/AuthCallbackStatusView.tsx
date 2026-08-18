import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { AUTH_VERIFICATION_COPY } from '@/lib/presentation/auth-verification';
import { colors, typography } from '@/theme';
import { authLayout } from '@/theme/auth';

type AuthCallbackStatusViewProps = {
  heading: string;
  body?: string | null;
  showReturnToSignIn?: boolean;
  retryLabel?: string;
  isRetrying?: boolean;
  onRetry?: () => void;
};

export function AuthCallbackStatusView({
  heading,
  body,
  showReturnToSignIn = false,
  retryLabel,
  isRetrying = false,
  onRetry,
}: AuthCallbackStatusViewProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.1}>
        {heading}
      </Text>
      {body ? (
        <Text style={styles.body} maxFontSizeMultiplier={1.15}>
          {body}
        </Text>
      ) : null}
      {onRetry && retryLabel ? (
        <Button
          label={retryLabel}
          variant="onboarding"
          disabled={isRetrying}
          accessibilityState={{ disabled: isRetrying, busy: isRetrying }}
          onPress={onRetry}
          style={styles.retryButton}
        />
      ) : null}
      {showReturnToSignIn ? (
        <Link href={routes.authSignIn} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={AUTH_VERIFICATION_COPY.returnToSignIn}
            style={({ pressed }) => [styles.footerLinkHit, pressed && styles.footerLinkPressed]}
          >
            <Text style={styles.footerLink}>{AUTH_VERIFICATION_COPY.returnToSignIn}</Text>
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
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
  body: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  retryButton: {
    width: '100%',
    marginTop: 4,
  },
  footerLinkHit: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: authLayout.footerTopGap,
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

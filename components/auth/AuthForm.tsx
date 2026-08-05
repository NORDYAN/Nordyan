import { Link, type Href } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors, radii, spacing, typography } from '@/theme';

type AuthFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  loadingLabel: string;
  alternatePrompt: string;
  alternateHref: Href;
  alternateLabel: string;
  email: string;
  password: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function AuthForm({
  title,
  subtitle,
  submitLabel,
  loadingLabel,
  alternatePrompt,
  alternateHref,
  alternateLabel,
  email,
  password,
  errorMessage,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthFormProps) {
  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text variant="title">{title}</Text>
            <Text variant="subtitle">{subtitle}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>E-post</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!isSubmitting}
                keyboardType="email-address"
                placeholder="din@epost.se"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                textContentType="emailAddress"
                value={email}
                onChangeText={onEmailChange}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Lösenord</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                editable={!isSubmitting}
                placeholder="Minst 8 tecken"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                style={styles.input}
                textContentType="password"
                value={password}
                onChangeText={onPasswordChange}
              />
            </View>

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <Button
              label={isSubmitting ? loadingLabel : submitLabel}
              disabled={isSubmitting}
              onPress={onSubmit}
              style={styles.submitButton}
            />

            {isSubmitting ? (
              <ActivityIndicator color={colors.accent} style={styles.loader} />
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{alternatePrompt}</Text>
            <Link href={alternateHref} asChild>
              <Pressable disabled={isSubmitting}>
                <Text style={styles.footerLink}>{alternateLabel}</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  error: {
    color: '#B42318',
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  loader: {
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  footerLink: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

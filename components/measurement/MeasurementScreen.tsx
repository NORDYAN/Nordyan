import { ScrollView, StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useAuth } from '@/providers/auth-provider';
import { colors, spacing, typography } from '@/theme';

import { MeasurementForm } from './MeasurementForm';

export function MeasurementScreen() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';

  return (
    <ScreenContainer variant="home">
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('health.new.title')}</Text>
          <Text style={styles.subtitle}>{t('health.new.subtitle')}</Text>
        </View>

        <MeasurementForm userId={userId} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    gap: 8,
  },
  title: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.xxl * typography.lineHeight.tight,
  },
  subtitle: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});

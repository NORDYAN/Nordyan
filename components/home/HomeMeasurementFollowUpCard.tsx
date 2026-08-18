import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, homeLayout, typography } from '@/theme';

type HomeMeasurementFollowUpCardProps = {
  onPress: () => void;
};

export function HomeMeasurementFollowUpCard({ onPress }: HomeMeasurementFollowUpCardProps) {
  useI18n();

  return (
    <Card padding={homeLayout.coachCardPadding} borderRadius={homeLayout.coachCardRadius} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="body-outline" size={18} color={colors.onboardingAccent} />
        </View>
        <Text style={styles.title}>{t('home.followUp.title')}</Text>
      </View>

      <Text style={styles.body}>{t('home.followUp.body')}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.registerMeasurements')}
        onPress={onPress}
        style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
      >
        <Text style={styles.actionLabel}>{t('onboarding.registerMeasurements')}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.onboardingText} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    backgroundColor: colors.profileHealthDataSourceCardBackground,
    borderColor: colors.profileHealthDataSourceCardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.profileHealthDataSourceIconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: colors.onboardingText,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  body: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  actionButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: colors.onboardingAccent,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    color: colors.onboardingButtonText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});

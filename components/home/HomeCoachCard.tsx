import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, homeLayout, typography } from '@/theme';

type HomeCoachCardProps = {
  onPressAsk?: () => void;
};

export function HomeCoachCard({ onPressAsk }: HomeCoachCardProps) {
  useI18n();

  return (
    <Card
      padding={homeLayout.coachCardPadding}
      borderRadius={homeLayout.coachCardRadius}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={16} color={colors.onboardingText} />
        </View>
        <Text style={styles.title}>{t('home.coach.title')}</Text>
      </View>

      <Text style={styles.message}>{t('home.coach.askBody')}</Text>

      <Button
        label={t('home.coach.askCta')}
        variant="primary"
        accessibilityLabel={t('home.coach.askCta')}
        style={styles.actionButton}
        labelStyle={styles.actionButtonLabel}
        onPress={onPressAsk}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 36,
  },
  avatar: {
    width: 36,
    height: 32,
    borderRadius: 18,
    backgroundColor: colors.homeAccentSlate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  message: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.light,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  actionButton: {
    backgroundColor: colors.homeAccentSlate,
    borderRadius: 22,
    height: 44,
    paddingVertical: 0,
  },
  actionButtonLabel: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});

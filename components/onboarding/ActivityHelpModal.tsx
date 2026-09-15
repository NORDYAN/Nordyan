import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { PROFILE_ACTIVITY_LEVEL_OPTIONS } from '@/lib/domain/profile';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  colors,
  onboardingLayout,
  onboardingMeasurementHelpLayout,
  typography,
} from '@/theme';

import { OnboardingInfoModalShell } from './OnboardingInfoModalShell';

const ACTIVITY_HELP_DESCRIPTION_KEYS = {
  sedentary: 'profile.activityHelp.sedentary',
  lightly_active: 'profile.activityHelp.lightly_active',
  moderately_active: 'profile.activityHelp.moderately_active',
  very_active: 'profile.activityHelp.very_active',
  extra_active: 'profile.activityHelp.extra_active',
} as const;

type ActivityHelpModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ActivityHelpModal({ visible, onClose }: ActivityHelpModalProps) {
  useI18n();

  return (
    <OnboardingInfoModalShell
      visible={visible}
      onClose={onClose}
      footer={(close) => (
        <Button
          label={t('measureHelp.understood')}
          variant="onboarding"
          style={styles.confirmButton}
          labelStyle={styles.confirmButtonLabel}
          onPress={close}
        />
      )}
    >
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentScrollInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('profile.activityHelp.title')}</Text>
          <Text style={styles.subtitle}>{t('profile.activityHelp.subtitle')}</Text>
        </View>

        <View style={styles.cardsSpacer} />

        <View style={styles.guidelinesContainer}>
          {PROFILE_ACTIVITY_LEVEL_OPTIONS.map((option) => (
            <Card
              key={option.value}
              padding={onboardingMeasurementHelpLayout.cardPadding}
              borderRadius={onboardingMeasurementHelpLayout.cardRadius}
              style={styles.guidelineCard}
            >
              <View style={styles.guidelineCardContent}>
                <Text style={styles.guidelineCardTitle}>{option.label}</Text>
                <Text style={styles.guidelineCardBody}>
                  {t(ACTIVITY_HELP_DESCRIPTION_KEYS[option.value])}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </OnboardingInfoModalShell>
  );
}

const styles = StyleSheet.create({
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    flexGrow: 1,
  },
  titleSection: {
    gap: onboardingMeasurementHelpLayout.titleSectionGap,
    paddingBottom: onboardingMeasurementHelpLayout.titleSectionPaddingBottom,
    width: '100%',
  },
  title: {
    color: colors.onboardingMeasurementHelpText,
    fontSize: onboardingMeasurementHelpLayout.titleFontSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight:
      onboardingMeasurementHelpLayout.titleFontSize * typography.lineHeight.tight,
  },
  subtitle: {
    color: colors.onboardingMeasurementHelpTextMuted,
    fontSize: onboardingMeasurementHelpLayout.subtitleFontSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      onboardingMeasurementHelpLayout.subtitleFontSize * typography.lineHeight.normal,
    width: '100%',
  },
  cardsSpacer: {
    height: onboardingMeasurementHelpLayout.cardsSpacerHeight,
  },
  guidelinesContainer: {
    gap: onboardingMeasurementHelpLayout.cardGap,
    width: '100%',
  },
  guidelineCard: {
    backgroundColor: colors.onboardingMeasurementHelpCardBackground,
    borderColor: colors.onboardingMeasurementHelpCardBorder,
  },
  guidelineCardContent: {
    gap: onboardingMeasurementHelpLayout.bulletGap,
    width: '100%',
  },
  guidelineCardTitle: {
    color: colors.onboardingMeasurementHelpText,
    fontSize: onboardingMeasurementHelpLayout.cardTitleFontSize,
    fontWeight: typography.fontWeight.semibold,
  },
  guidelineCardBody: {
    color: colors.onboardingMeasurementHelpTextMuted,
    fontSize: onboardingMeasurementHelpLayout.bulletTextFontSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      onboardingMeasurementHelpLayout.bulletTextFontSize * typography.lineHeight.normal,
  },
  confirmButton: {
    width: '100%',
    minHeight: onboardingLayout.buttonHeight,
    backgroundColor: colors.onboardingMeasurementHelpAccent,
  },
  confirmButtonLabel: {
    color: colors.onboardingMeasurementHelpText,
    fontWeight: typography.fontWeight.semibold,
  },
});

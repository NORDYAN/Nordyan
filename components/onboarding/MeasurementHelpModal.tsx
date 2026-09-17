import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { liveArray, t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { TranslationKey } from '@/lib/i18n';
import {
  colors,
  onboardingLayout,
  onboardingMeasurementHelpLayout,
  typography,
} from '@/theme';

import { OnboardingInfoModalShell } from './OnboardingInfoModalShell';

export type MeasurementHelpSection = {
  title: string;
  body: string;
};

/** @deprecated Screen 7 uses bullet cards; kept for onboarding step-4 import compatibility. */
export const DEFAULT_MEASUREMENT_HELP_SECTIONS: readonly MeasurementHelpSection[] = liveArray(() => [
  {
    title: t('measureHelp.waistHeading'),
    body: t('measureHelp.waist.body'),
  },
  {
    title: t('measureHelp.neckHeading'),
    body: t('measureHelp.neck.body'),
  },
  {
    title: t('measureHelp.hipHeading'),
    body: t('measureHelp.hip.body'),
  },
]);

const MEASUREMENT_HELP_MIDJA_ITEM_KEYS = [
  'measureHelp.waist.1',
  'measureHelp.waist.2',
  'measureHelp.waist.3',
] as const satisfies readonly TranslationKey[];

const MEASUREMENT_HELP_HALS_ITEM_KEYS = [
  'measureHelp.neck.1',
  'measureHelp.neck.2',
] as const satisfies readonly TranslationKey[];

const MEASUREMENT_HELP_HIP_ITEM_KEYS = [
  'measureHelp.hip.1',
] as const satisfies readonly TranslationKey[];

const MEASUREMENT_HELP_TIPS_ITEM_KEYS = [
  'measureHelp.tip.1',
  'measureHelp.tip.2',
  'measureHelp.tip.3',
  'measureHelp.tip.4',
] as const satisfies readonly TranslationKey[];

const MEASUREMENT_HELP_RELIABILITY_TIP_KEYS = [
  'health.new.tip.morning',
  'health.new.tip.toilet',
  'health.new.tip.beforeTraining',
  'health.new.tip.sameTime',
] as const satisfies readonly TranslationKey[];

type MeasurementHelpModalProps = {
  visible: boolean;
  title: string;
  sections?: readonly MeasurementHelpSection[];
  onClose: () => void;
};

type GuidelineCardProps = {
  icon: ReactNode;
  title: string;
  intro?: string;
  itemKeys: readonly TranslationKey[];
};

function MeasurementHelpGuidelineCard({ icon, title, intro, itemKeys }: GuidelineCardProps) {
  return (
    <Card
      padding={onboardingMeasurementHelpLayout.cardPadding}
      borderRadius={onboardingMeasurementHelpLayout.cardRadius}
      style={styles.guidelineCard}
    >
      <View style={styles.guidelineCardContent}>
        <View style={styles.guidelineCardHeader}>
          {icon}
          <Text style={styles.guidelineCardTitle}>{title}</Text>
        </View>
        {intro ? <Text style={styles.guidelineIntro}>{intro}</Text> : null}
        <View style={styles.bulletList}>
          {itemKeys.map((key) => (
            <View key={key} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{t(key)}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

export function MeasurementHelpModal({
  visible,
  title: _title,
  sections: _sections,
  onClose,
}: MeasurementHelpModalProps) {
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
          <Text style={styles.title}>{t('measureHelp.title')}</Text>
          <Text style={styles.subtitle}>{t('measureHelp.subtitle')}</Text>
        </View>

        <View style={styles.cardsSpacer} />

        <View style={styles.guidelinesContainer}>
          <MeasurementHelpGuidelineCard
            icon={
              <MaterialCommunityIcons
                name="ruler"
                size={onboardingMeasurementHelpLayout.cardIconSize}
                color={colors.onboardingMeasurementHelpText}
              />
            }
            title={t('measureHelp.waistHeading')}
            itemKeys={MEASUREMENT_HELP_MIDJA_ITEM_KEYS}
          />
          <MeasurementHelpGuidelineCard
            icon={
              <MaterialCommunityIcons
                name="ruler"
                size={onboardingMeasurementHelpLayout.cardIconSize}
                color={colors.onboardingMeasurementHelpText}
              />
            }
            title={t('measureHelp.neckHeading')}
            itemKeys={MEASUREMENT_HELP_HALS_ITEM_KEYS}
          />
          <MeasurementHelpGuidelineCard
            icon={
              <MaterialCommunityIcons
                name="ruler"
                size={onboardingMeasurementHelpLayout.cardIconSize}
                color={colors.onboardingMeasurementHelpText}
              />
            }
            title={t('measureHelp.hipHeading')}
            itemKeys={MEASUREMENT_HELP_HIP_ITEM_KEYS}
          />
          <MeasurementHelpGuidelineCard
            icon={
              <Ionicons
                name="bulb-outline"
                size={onboardingMeasurementHelpLayout.cardIconSize}
                color={colors.onboardingMeasurementHelpText}
              />
            }
            title={t('measureHelp.tipsHeading')}
            itemKeys={MEASUREMENT_HELP_TIPS_ITEM_KEYS}
          />
          <MeasurementHelpGuidelineCard
            icon={
              <Ionicons
                name="time-outline"
                size={onboardingMeasurementHelpLayout.cardIconSize}
                color={colors.onboardingMeasurementHelpText}
              />
            }
            title={t('health.new.tipsTitle')}
            intro={t('health.new.tipsIntro')}
            itemKeys={MEASUREMENT_HELP_RELIABILITY_TIP_KEYS}
          />
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
    lineHeight: onboardingMeasurementHelpLayout.subtitleFontSize * typography.lineHeight.normal,
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
    gap: onboardingMeasurementHelpLayout.cardGap,
    width: '100%',
  },
  guidelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: onboardingMeasurementHelpLayout.cardHeaderGap,
  },
  guidelineCardTitle: {
    color: colors.onboardingMeasurementHelpText,
    fontSize: onboardingMeasurementHelpLayout.cardTitleFontSize,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  guidelineIntro: {
    color: colors.onboardingMeasurementHelpTextMuted,
    fontSize: onboardingMeasurementHelpLayout.bulletTextFontSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      onboardingMeasurementHelpLayout.bulletTextFontSize * typography.lineHeight.normal,
    width: '100%',
  },
  bulletList: {
    gap: onboardingMeasurementHelpLayout.bulletGap,
    width: '100%',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: onboardingMeasurementHelpLayout.bulletRowGap,
    width: '100%',
  },
  bulletDot: {
    width: onboardingMeasurementHelpLayout.bulletSize,
    height: onboardingMeasurementHelpLayout.bulletSize,
    borderRadius: onboardingMeasurementHelpLayout.bulletRadius,
    backgroundColor: colors.onboardingMeasurementHelpAccent,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
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

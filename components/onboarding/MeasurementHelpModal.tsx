import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

type MeasurementHelpModalProps = {
  visible: boolean;
  title: string;
  sections?: readonly MeasurementHelpSection[];
  onClose: () => void;
};

const SHEET_SLIDE_OFFSET = 28;

type GuidelineCardProps = {
  icon: ReactNode;
  title: string;
  itemKeys: readonly TranslationKey[];
};

function MeasurementHelpGuidelineCard({ icon, title, itemKeys }: GuidelineCardProps) {
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
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(SHEET_SLIDE_OFFSET)).current;

  useEffect(() => {
    if (visible) {
      screenOpacity.setValue(0);
      screenTranslateY.setValue(SHEET_SLIDE_OFFSET);

      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, screenOpacity, screenTranslateY]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: SHEET_SLIDE_OFFSET,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.screen,
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.navigation}>
            <Pressable
              style={styles.backButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Ionicons
                name="arrow-back"
                size={onboardingMeasurementHelpLayout.backIconSize}
                color={colors.onboardingMeasurementHelpText}
              />
            </Pressable>
          </View>

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
            </View>
          </ScrollView>

          <View style={styles.ctaContainer}>
            <Button
              label={t('measureHelp.understood')}
              variant="onboarding"
              style={styles.confirmButton}
              labelStyle={styles.confirmButtonLabel}
              onPress={handleClose}
            />
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.onboardingMeasurementHelpBackground,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: onboardingMeasurementHelpLayout.horizontalPadding,
    paddingBottom: onboardingMeasurementHelpLayout.bottomPadding,
  },
  navigation: {
    paddingTop: onboardingMeasurementHelpLayout.navPaddingTop,
    paddingBottom: onboardingMeasurementHelpLayout.navPaddingBottom,
  },
  backButton: {
    width: onboardingMeasurementHelpLayout.backTouchSize,
    height: onboardingMeasurementHelpLayout.backTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  ctaContainer: {
    paddingTop: onboardingMeasurementHelpLayout.ctaPaddingTop,
    width: '100%',
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

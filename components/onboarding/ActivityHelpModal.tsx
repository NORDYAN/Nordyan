import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const SHEET_SLIDE_OFFSET = 28;

export function ActivityHelpModal({ visible, onClose }: ActivityHelpModalProps) {
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
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

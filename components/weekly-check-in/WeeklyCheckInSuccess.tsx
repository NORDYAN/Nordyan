import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { WeeklyCheckInPrimaryButton } from '@/components/weekly-check-in/WeeklyCheckInPrimaryButton';
import { WEEKLY_CHECK_IN_COPY, weeklyCheckInResponsiveLayout } from '@/lib/presentation/weekly-check-in';
import { typography } from '@/theme';
import {
  weeklyCheckInColors,
  weeklyCheckInLayout,
  weeklyCheckInTypography,
} from '@/theme/weekly-check-in';

type WeeklyCheckInSuccessProps = {
  onGoHome: () => void;
};

export function WeeklyCheckInSuccess({ onGoHome }: WeeklyCheckInSuccessProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={
        weeklyCheckInResponsiveLayout.successScrollable ? styles.scrollContent : undefined
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.backPlaceholder} />

      <View style={styles.content}>
        <View style={styles.glow}>
          <View style={styles.innerMark}>
            <Ionicons
              name="checkmark"
              size={weeklyCheckInLayout.illustrationIconSize}
              color={weeklyCheckInColors.primary}
            />
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title} maxFontSizeMultiplier={1.1}>
            {WEEKLY_CHECK_IN_COPY.successTitle}
          </Text>
          <Text style={styles.supporting} maxFontSizeMultiplier={1.1}>
            {WEEKLY_CHECK_IN_COPY.successSupporting}
          </Text>
          <Text style={styles.explanation} maxFontSizeMultiplier={1.1}>
            {WEEKLY_CHECK_IN_COPY.successExplanation}
          </Text>
        </View>
      </View>

      <View style={styles.spacer} />

      <View style={styles.actions}>
        <WeeklyCheckInPrimaryButton
          label={WEEKLY_CHECK_IN_COPY.successHomeCta}
          onPress={onGoHome}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backPlaceholder: {
    width: weeklyCheckInLayout.backButtonSize,
    height: weeklyCheckInLayout.backButtonSize,
    marginTop: weeklyCheckInLayout.backHeaderPaddingTop,
    marginHorizontal: weeklyCheckInLayout.horizontalPadding,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: weeklyCheckInLayout.introCopyPadding,
    paddingTop: 60,
    paddingBottom: 24,
  },
  glow: {
    width: weeklyCheckInLayout.illustrationSize,
    height: weeklyCheckInLayout.illustrationSize,
    borderRadius: weeklyCheckInLayout.illustrationRadius,
    backgroundColor: weeklyCheckInColors.card,
    borderWidth: 1,
    borderColor: weeklyCheckInColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerMark: {
    width: weeklyCheckInLayout.illustrationInnerSize,
    height: weeklyCheckInLayout.illustrationInnerSize,
    borderRadius: weeklyCheckInLayout.illustrationInnerRadius,
    backgroundColor: weeklyCheckInColors.successIconFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: weeklyCheckInColors.title,
    fontSize: weeklyCheckInTypography.introTitleSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: weeklyCheckInTypography.introTitleLineHeight,
    includeFontPadding: false,
    textAlign: 'center',
  },
  supporting: {
    color: weeklyCheckInColors.supportingGold,
    fontSize: weeklyCheckInTypography.introSupportingSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
    textAlign: 'center',
  },
  explanation: {
    color: weeklyCheckInColors.muted,
    fontSize: weeklyCheckInTypography.introBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: weeklyCheckInTypography.introBodySize * 1.5,
    includeFontPadding: false,
    textAlign: 'center',
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  actions: {
    width: '100%',
    paddingHorizontal: weeklyCheckInLayout.horizontalPadding,
    paddingBottom: 8,
  },
});

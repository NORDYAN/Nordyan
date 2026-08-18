import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { NordyanMountainLogo } from '@/components/branding/NordyanMountainLogo';
import { Text } from '@/components/ui/Text';
import { WeeklyCheckInPrimaryButton } from '@/components/weekly-check-in/WeeklyCheckInPrimaryButton';
import { WEEKLY_CHECK_IN_COPY, weeklyCheckInResponsiveLayout } from '@/lib/presentation/weekly-check-in';
import { typography } from '@/theme';
import {
  weeklyCheckInColors,
  weeklyCheckInLayout,
  weeklyCheckInTypography,
} from '@/theme/weekly-check-in';

type WeeklyCheckInIntroProps = {
  onStart: () => void;
  onDismiss: () => void;
};

export function WeeklyCheckInIntro({ onStart, onDismiss }: WeeklyCheckInIntroProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={
        weeklyCheckInResponsiveLayout.introScrollable ? styles.scrollContent : undefined
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.branding}>
        <NordyanMountainLogo
          width={weeklyCheckInLayout.headerLogoSize}
          height={weeklyCheckInLayout.headerLogoSize}
        />
        <Text style={styles.brand} maxFontSizeMultiplier={1.1}>
          {WEEKLY_CHECK_IN_COPY.introEyebrow}
        </Text>
      </View>

      <View style={styles.illustration}>
        <View style={styles.glow}>
          <View style={styles.innerMark}>
            <NordyanMountainLogo
              width={(weeklyCheckInLayout.illustrationIconSize + 4) * 1.7}
              height={weeklyCheckInLayout.illustrationIconSize * 1.7}
            />
          </View>
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={styles.title} maxFontSizeMultiplier={1.1}>
          {WEEKLY_CHECK_IN_COPY.introTitle}
        </Text>
        <Text style={styles.supporting} maxFontSizeMultiplier={1.1}>
          {WEEKLY_CHECK_IN_COPY.introSupporting}
        </Text>
        <Text style={styles.explanation} maxFontSizeMultiplier={1.1}>
          {WEEKLY_CHECK_IN_COPY.introExplanation}
        </Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.actions}>
        <View style={styles.timeHint}>
          <Ionicons
            name="time-outline"
            size={weeklyCheckInLayout.clockIconSize}
            color={weeklyCheckInColors.muted}
          />
          <Text style={styles.timeHintText} maxFontSizeMultiplier={1.1}>
            {WEEKLY_CHECK_IN_COPY.introTimeHint}
          </Text>
        </View>
        <WeeklyCheckInPrimaryButton
          label={WEEKLY_CHECK_IN_COPY.introStartCta}
          onPress={onStart}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={WEEKLY_CHECK_IN_COPY.introDismissCta}
          onPress={onDismiss}
          style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}
        >
          <Text style={styles.secondaryLabel} maxFontSizeMultiplier={1.1}>
            {WEEKLY_CHECK_IN_COPY.introDismissCta}
          </Text>
        </Pressable>
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
  branding: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  brand: {
    color: weeklyCheckInColors.supportingGold,
    fontSize: weeklyCheckInTypography.brandSize,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 1,
    includeFontPadding: false,
  },
  illustration: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
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
    backgroundColor: weeklyCheckInColors.selectedFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: weeklyCheckInLayout.introCopyPadding,
    paddingVertical: 12,
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
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: weeklyCheckInLayout.horizontalPadding,
    paddingBottom: 8,
  },
  timeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeHintText: {
    color: weeklyCheckInColors.muted,
    fontSize: weeklyCheckInTypography.timeHintSize,
    fontWeight: typography.fontWeight.regular,
    includeFontPadding: false,
  },
  secondary: {
    paddingVertical: 8,
  },
  secondaryPressed: {
    opacity: 0.75,
  },
  secondaryLabel: {
    color: weeklyCheckInColors.muted,
    fontSize: weeklyCheckInTypography.secondaryLinkSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
  },
});

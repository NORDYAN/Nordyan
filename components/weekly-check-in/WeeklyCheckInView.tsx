import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { WeeklyCheckInIntro } from '@/components/weekly-check-in/WeeklyCheckInIntro';
import { WeeklyCheckInPrimaryButton } from '@/components/weekly-check-in/WeeklyCheckInPrimaryButton';
import { WeeklyCheckInQuestion } from '@/components/weekly-check-in/WeeklyCheckInQuestion';
import { WeeklyCheckInSuccess } from '@/components/weekly-check-in/WeeklyCheckInSuccess';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { UseWeeklyCheckInResult } from '@/lib/hooks/weekly-check-in';
import {
  WEEKLY_CHECK_IN_COPY,
  WEEKLY_CHECK_IN_LOAD_ERROR_MESSAGE,
  getWeeklyCheckInQuestion,
} from '@/lib/presentation/weekly-check-in';
import { typography } from '@/theme';
import {
  weeklyCheckInColors,
  weeklyCheckInLayout,
  weeklyCheckInTypography,
} from '@/theme/weekly-check-in';

type WeeklyCheckInViewProps = {
  flow: UseWeeklyCheckInResult;
  onExit: () => void;
};

export function WeeklyCheckInView({ flow, onExit }: WeeklyCheckInViewProps) {
  useI18n();
  const question =
    flow.step.kind === 'question' ? getWeeklyCheckInQuestion(flow.step.index) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        {flow.loadStatus === 'loading' ? (
          <View style={styles.centered}>
            <ActivityIndicator color={weeklyCheckInColors.primary} size="small" />
          </View>
        ) : null}

        {flow.loadStatus === 'error' ? (
          <View style={styles.centered}>
            <Text style={styles.message} maxFontSizeMultiplier={1.1}>
              {flow.loadError ?? WEEKLY_CHECK_IN_LOAD_ERROR_MESSAGE()}
            </Text>
            <WeeklyCheckInPrimaryButton label={t('common.retry')} onPress={() => void flow.retryLoad()} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={WEEKLY_CHECK_IN_COPY.introDismissCta}
              onPress={onExit}
              style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}
            >
              <Text style={styles.secondaryLabel} maxFontSizeMultiplier={1.1}>
                {WEEKLY_CHECK_IN_COPY.introDismissCta}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {flow.loadStatus === 'ready' && flow.step.kind === 'intro' ? (
          <WeeklyCheckInIntro onStart={flow.start} onDismiss={onExit} />
        ) : null}

        {flow.loadStatus === 'ready' && flow.step.kind === 'question' && question ? (
          <WeeklyCheckInQuestion
            question={question}
            index={flow.step.index}
            answers={flow.answers}
            canAdvance={flow.canAdvance}
            canSubmit={flow.canSubmit}
            saving={flow.saving}
            saveError={flow.saveError}
            onBack={flow.goBack}
            onSelect={(value) => flow.selectAnswer(question.field, value)}
            onNext={flow.goNext}
            onSubmit={() => void flow.submit()}
          />
        ) : null}

        {flow.loadStatus === 'ready' && flow.step.kind === 'success' ? (
          <WeeklyCheckInSuccess onGoHome={onExit} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: weeklyCheckInColors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: weeklyCheckInColors.background,
    paddingBottom: weeklyCheckInLayout.bottomPadding,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: weeklyCheckInLayout.horizontalPadding,
  },
  message: {
    color: weeklyCheckInColors.muted,
    fontSize: weeklyCheckInTypography.questionSupportSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: weeklyCheckInTypography.questionSupportSize * 1.4,
    includeFontPadding: false,
    textAlign: 'center',
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

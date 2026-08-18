import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { WeeklyCheckInBackButton } from '@/components/weekly-check-in/WeeklyCheckInBackButton';
import { WeeklyCheckInOption } from '@/components/weekly-check-in/WeeklyCheckInOption';
import { WeeklyCheckInPrimaryButton } from '@/components/weekly-check-in/WeeklyCheckInPrimaryButton';
import { WeeklyCheckInProgress } from '@/components/weekly-check-in/WeeklyCheckInProgress';
import type {
  WeeklyCheckInFormAnswers,
  WeeklyCheckInQuestion as WeeklyCheckInQuestionModel,
} from '@/lib/presentation/weekly-check-in';
import { typography } from '@/theme';
import {
  weeklyCheckInColors,
  weeklyCheckInLayout,
  weeklyCheckInTypography,
} from '@/theme/weekly-check-in';

type WeeklyCheckInQuestionProps = {
  question: WeeklyCheckInQuestionModel;
  index: number;
  answers: WeeklyCheckInFormAnswers;
  canAdvance: boolean;
  canSubmit: boolean;
  saving: boolean;
  saveError: string | null;
  onBack: () => void;
  onSelect: (value: WeeklyCheckInQuestionModel['options'][number]['value']) => void;
  onNext: () => void;
  onSubmit: () => void;
};

export function WeeklyCheckInQuestion({
  question,
  index,
  answers,
  canAdvance,
  canSubmit,
  saving,
  saveError,
  onBack,
  onSelect,
  onNext,
  onSubmit,
}: WeeklyCheckInQuestionProps) {
  const selected = answers[question.field];
  const ctaDisabled = question.isFinal ? !canSubmit || saving : !canAdvance;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <WeeklyCheckInBackButton onPress={onBack} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WeeklyCheckInProgress index={index} />

        <View style={styles.questionHeader}>
          <Text style={styles.title} maxFontSizeMultiplier={1.1}>
            {question.title}
          </Text>
          <Text style={styles.support} maxFontSizeMultiplier={1.1}>
            {question.support}
          </Text>
        </View>

        <View style={styles.options}>
          {question.options.map((option) => (
            <WeeklyCheckInOption
              key={option.label}
              label={option.label}
              selected={selected === option.value}
              onPress={() => onSelect(option.value)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {saveError ? (
          <Text style={styles.error} maxFontSizeMultiplier={1.1}>
            {saveError}
          </Text>
        ) : null}
        <WeeklyCheckInPrimaryButton
          label={question.cta}
          disabled={ctaDisabled}
          onPress={question.isFinal ? onSubmit : onNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingTop: weeklyCheckInLayout.backHeaderPaddingTop,
    paddingHorizontal: weeklyCheckInLayout.horizontalPadding,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  questionHeader: {
    width: '100%',
    gap: weeklyCheckInLayout.questionHeaderGap,
    paddingHorizontal: weeklyCheckInLayout.horizontalPadding,
    paddingVertical: weeklyCheckInLayout.questionHeaderPaddingVertical,
  },
  title: {
    color: weeklyCheckInColors.title,
    fontSize: weeklyCheckInTypography.questionTitleSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: weeklyCheckInTypography.questionTitleSize * 1.3,
    includeFontPadding: false,
  },
  support: {
    color: weeklyCheckInColors.muted,
    fontSize: weeklyCheckInTypography.questionSupportSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: weeklyCheckInTypography.questionSupportSize * 1.4,
    includeFontPadding: false,
  },
  options: {
    width: '100%',
    gap: weeklyCheckInLayout.optionsGap,
    paddingHorizontal: weeklyCheckInLayout.horizontalPadding,
    paddingVertical: weeklyCheckInLayout.optionsPaddingVertical,
  },
  footer: {
    width: '100%',
    gap: 10,
    paddingHorizontal: weeklyCheckInLayout.horizontalPadding,
    paddingBottom: 8,
  },
  error: {
    color: weeklyCheckInColors.muted,
    fontSize: weeklyCheckInTypography.questionSupportSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: weeklyCheckInTypography.questionSupportSize * 1.4,
    includeFontPadding: false,
    textAlign: 'center',
  },
});

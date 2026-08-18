import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HomeIndicator } from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { colors, typography } from '@/theme';
import {
  initialLifestyleColors,
  initialLifestyleLayout,
  initialLifestyleTypography,
} from '@/theme/initial-lifestyle';
import { InitialLifestyleOption } from '@/components/initial-lifestyle/InitialLifestyleOption';
import type {
  InitialLifestyleFormAnswers,
  InitialLifestyleQuestion as InitialLifestyleQuestionModel,
} from '@/lib/presentation/initial-lifestyle';
import { formatInitialLifestyleProgress } from '@/lib/presentation/initial-lifestyle';

type InitialLifestyleQuestionProps = {
  question: InitialLifestyleQuestionModel;
  index: number;
  answers: InitialLifestyleFormAnswers;
  canAdvance: boolean;
  canSubmit: boolean;
  saving: boolean;
  saveError: string | null;
  onBack: () => void;
  onSelect: (value: InitialLifestyleQuestionModel['options'][number]['value']) => void;
  onNext: () => void;
  onSubmit: () => void;
};

export function InitialLifestyleQuestion({
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
}: InitialLifestyleQuestionProps) {
  const selected = answers[question.field];
  const ctaDisabled = question.isFinal ? !canSubmit || saving : !canAdvance;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={initialLifestyleLayout.backHitSlop}
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons
            name="chevron-back"
            size={initialLifestyleLayout.backIconSize}
            color={initialLifestyleColors.title}
          />
        </Pressable>
        <Text style={styles.progress} maxFontSizeMultiplier={1.1}>
          {formatInitialLifestyleProgress(index)}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.copy}>
          <Text style={styles.title} maxFontSizeMultiplier={1.1}>
            {question.title}
          </Text>
          <Text style={styles.support} maxFontSizeMultiplier={1.1}>
            {question.support}
          </Text>
        </View>

        <View style={styles.options}>
          {question.options.map((option) => (
            <InitialLifestyleOption
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
        <Button
          label={question.cta}
          variant="onboarding"
          disabled={ctaDisabled}
          style={[styles.button, ctaDisabled && styles.buttonDisabled]}
          onPress={question.isFinal ? onSubmit : onNext}
        />
        <HomeIndicator />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: initialLifestyleLayout.headerPaddingTop,
    paddingHorizontal: initialLifestyleLayout.headerPaddingHorizontal,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  progress: {
    color: initialLifestyleColors.muted,
    fontSize: initialLifestyleTypography.progressSize,
    fontWeight: typography.fontWeight.medium,
    includeFontPadding: false,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: initialLifestyleLayout.bodyPaddingTop,
    paddingHorizontal: initialLifestyleLayout.horizontalPadding,
    paddingBottom: 16,
    gap: initialLifestyleLayout.questionToOptionsGap,
  },
  copy: {
    width: '100%',
    gap: initialLifestyleLayout.questionCopyGap,
  },
  title: {
    color: initialLifestyleColors.title,
    fontSize: initialLifestyleTypography.questionTitleSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: initialLifestyleTypography.questionTitleLineHeight,
    includeFontPadding: false,
  },
  support: {
    color: initialLifestyleColors.muted,
    fontSize: initialLifestyleTypography.questionSupportSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: initialLifestyleTypography.questionSupportSize * 1.4,
    includeFontPadding: false,
  },
  options: {
    width: '100%',
    gap: initialLifestyleLayout.optionsGap,
  },
  footer: {
    width: '100%',
    gap: 10,
    paddingTop: initialLifestyleLayout.footerPaddingTop,
    paddingHorizontal: initialLifestyleLayout.horizontalPadding,
  },
  error: {
    color: colors.onboardingErrorText,
    fontSize: initialLifestyleTypography.questionSupportSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: initialLifestyleTypography.questionSupportSize * 1.4,
    includeFontPadding: false,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
});

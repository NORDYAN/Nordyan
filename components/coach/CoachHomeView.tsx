import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { CoachAskComposer } from '@/components/coach/CoachAskComposer';
import { CoachAskSuggestions } from '@/components/coach/CoachAskSuggestions';
import { CoachFocusCard } from '@/components/coach/CoachFocusCard';
import { CoachHomeHeader } from '@/components/coach/CoachHomeHeader';
import { CoachPlanCard } from '@/components/coach/CoachPlanCard';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { useCoachHomeBodyFatDiscovery, type CoachQuestionUiState } from '@/lib/hooks/coach';
import {
  isCoachHomeBodyFatComparisonQuestion,
  selectCoachHomeQuickQuestionSlots,
  type CoachHomeFetchState,
} from '@/lib/presentation/coach-home';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, coachLayout, coachTypography, typography } from '@/theme';

type CoachHomeViewProps = {
  state: CoachHomeFetchState;
  askState: CoachQuestionUiState;
  askVisitKey: number;
  onSubmitQuestion: (question: string) => void;
};

export function CoachHomeView({
  state,
  askState,
  askVisitKey,
  onSubmitQuestion,
}: CoachHomeViewProps) {
  useI18n();
  const scrollRef = useRef<ScrollView>(null);
  const { bodyFatComparisonUsed, markBodyFatComparisonUsed } = useCoachHomeBodyFatDiscovery();

  const scrollComposerIntoView = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
  };

  useEffect(() => {
    if (
      askState.status === 'pending' ||
      askState.status === 'success' ||
      askState.status === 'error' ||
      askState.status === 'unavailable'
    ) {
      scrollComposerIntoView();
    }
  }, [askState.status]);

  const handleSubmitQuestion = (question: string) => {
    if (isCoachHomeBodyFatComparisonQuestion(question)) {
      markBodyFatComparisonUsed();
    }
    onSubmitQuestion(question);
  };

  const quickQuestionSlots = selectCoachHomeQuickQuestionSlots({
    bodyFatComparisonUsed,
  });

  return (
    <ScreenContainer variant="development" style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          {state.status === 'loading' ? (
            <>
              <CoachHomeHeader
                title={t('coach.header.title')}
                coachLabel={t('coach.header.label')}
                coachSubtitle={t('coach.header.subtitle')}
              />
              <View style={styles.stateBlock}>
                <ActivityIndicator color={colors.brandAccent} size="small" />
                <Text style={styles.stateText} maxFontSizeMultiplier={1.1}>
                  {t('coach.loading')}
                </Text>
              </View>
            </>
          ) : null}

          {state.status === 'empty' || state.status === 'error' ? (
            <>
              <CoachHomeHeader
                title={t('coach.header.title')}
                coachLabel={t('coach.header.label')}
                coachSubtitle={t('coach.header.subtitle')}
              />
              <View style={styles.stateBlock}>
                <Text style={styles.stateText} maxFontSizeMultiplier={1.1}>
                  {state.message}
                </Text>
              </View>
            </>
          ) : null}

          {state.status === 'ready' ? (
            <>
              <CoachHomeHeader
                title={state.model.header.title}
                coachLabel={state.model.header.coachLabel}
                coachSubtitle={state.model.header.coachSubtitle}
              />
              <View style={styles.body}>
                <CoachAskComposer
                  key={askVisitKey}
                  ask={state.model.ask}
                  askState={askState}
                  onSubmit={handleSubmitQuestion}
                  onInputFocus={scrollComposerIntoView}
                />
                <CoachFocusCard
                  sectionLabel={state.model.focus.sectionLabel}
                  title={state.model.focus.title}
                  body={state.model.focus.body}
                />
                <CoachPlanCard plan={state.model.plan} />
                <CoachAskSuggestions
                  sectionLabel={state.model.ask.quickQuestionsSectionLabel}
                  slots={quickQuestionSlots}
                  canAsk={state.model.ask.canAsk}
                  askState={askState}
                  onSubmit={handleSubmitQuestion}
                />
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 0,
    paddingBottom: coachLayout.scrollPaddingBottom,
    gap: coachLayout.contentGap,
  },
  body: {
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: coachLayout.horizontalPadding,
    gap: coachLayout.contentGap,
  },
  stateBlock: {
    marginHorizontal: coachLayout.horizontalPadding,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: coachLayout.cardRadius,
    padding: coachLayout.cardPadding,
  },
  stateText: {
    color: colors.developmentTextMuted,
    fontSize: coachTypography.messageSize,
    fontWeight: typography.fontWeight.regular,
    textAlign: 'center',
    lineHeight: coachTypography.messageSize * 1.35,
    includeFontPadding: false,
  },
});

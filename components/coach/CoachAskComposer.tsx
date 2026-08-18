import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Text } from '@/components/ui/Text';
import type { CoachQuestionUiState } from '@/lib/hooks/coach';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { CoachHomeViewModel } from '@/lib/presentation/coach-home';
import { COACH_ASK_QUESTION_MAX_LENGTH } from '@/shared/coach-language';
import { colors, coachLayout, coachTypography, typography } from '@/theme';

type CoachAskComposerProps = {
  ask: Pick<
    CoachHomeViewModel['ask'],
    'sectionLabel' | 'inputPlaceholder' | 'footnote' | 'canAsk'
  >;
  askState: CoachQuestionUiState;
  onSubmit: (question: string) => void;
  onInputFocus?: () => void;
};

export function CoachAskComposer({
  ask,
  askState,
  onSubmit,
  onInputFocus,
}: CoachAskComposerProps) {
  useI18n();
  const [draft, setDraft] = useState('');
  const pending = askState.status === 'pending';
  const canInteract = ask.canAsk && askState.status !== 'unavailable' && !pending;

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!canInteract || !trimmed) {
      return;
    }
    if (trimmed.length > COACH_ASK_QUESTION_MAX_LENGTH) {
      return;
    }
    onSubmit(trimmed);
    setDraft('');
  };

  return (
    <View style={styles.section}>
      <Text style={styles.heading} maxFontSizeMultiplier={1.1}>
        {ask.sectionLabel}
      </Text>
      <View style={styles.card}>
        <View style={styles.inputBar}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={canInteract}
            placeholder={ask.inputPlaceholder}
            placeholderTextColor={colors.developmentTextMuted}
            maxLength={COACH_ASK_QUESTION_MAX_LENGTH}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            onFocus={onInputFocus}
            underlineColorAndroid="transparent"
            textAlignVertical="center"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('coach.ask.sendAccessibilityLabel')}
            disabled={!canInteract || !draft.trim()}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.sendButton,
              (!canInteract || !draft.trim() || pressed) && styles.sendButtonDisabled,
            ]}
          >
            <Ionicons name="arrow-up" size={16} color={colors.developmentBackground} />
          </Pressable>
        </View>

        {askState.status === 'pending' ? (
          <View style={styles.statusRow}>
            <ActivityIndicator color={colors.brandAccent} size="small" />
            <Text style={styles.statusText} maxFontSizeMultiplier={1.1}>
              {t('coach.ask.thinking')}
            </Text>
          </View>
        ) : null}

        {askState.status === 'success' ? (
          <View style={styles.answerCard}>
            <Text style={styles.answerQuestion} maxFontSizeMultiplier={1.1}>
              {askState.question}
            </Text>
            <Text style={styles.answerBody} maxFontSizeMultiplier={1.1}>
              {askState.answer}
            </Text>
          </View>
        ) : null}

        {askState.status === 'error' || askState.status === 'unavailable' ? (
          <Text style={styles.errorText} maxFontSizeMultiplier={1.1}>
            {askState.message}
          </Text>
        ) : null}

        <Text style={styles.footnote} maxFontSizeMultiplier={1.1}>
          {ask.footnote}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    maxWidth: '100%',
    gap: coachLayout.sectionHeadingGap,
  },
  heading: {
    color: colors.developmentTextMuted,
    fontSize: coachTypography.sectionHeadingSize,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  card: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: coachLayout.cardRadius,
    padding: coachLayout.cardPadding,
    gap: coachLayout.askIntroGap,
  },
  inputBar: {
    width: '100%',
    maxWidth: '100%',
    minHeight: coachLayout.inputHeight,
    borderRadius: coachLayout.inputRadius,
    borderWidth: 1,
    borderColor: colors.brandAccent,
    backgroundColor: colors.developmentBackground,
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.developmentText,
    fontSize: coachTypography.inputSize,
    paddingVertical: 10,
  },
  sendButton: {
    width: coachLayout.sendButtonSize,
    height: coachLayout.sendButtonSize,
    flexShrink: 0,
    borderRadius: coachLayout.sendButtonSize / 2,
    backgroundColor: colors.brandAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusText: {
    flexShrink: 1,
    color: colors.developmentTextMuted,
    fontSize: coachTypography.messageSize,
    includeFontPadding: false,
  },
  answerCard: {
    width: '100%',
    maxWidth: '100%',
    borderRadius: coachLayout.answerCardRadius,
    borderWidth: 1,
    borderColor: colors.brandAccent,
    backgroundColor: colors.developmentCoachCardBackground,
    padding: coachLayout.answerCardPadding,
    gap: 6,
  },
  answerQuestion: {
    color: colors.developmentTextMuted,
    fontSize: coachTypography.answerQuestionSize,
    fontWeight: typography.fontWeight.medium,
    includeFontPadding: false,
  },
  answerBody: {
    color: colors.developmentText,
    fontSize: coachTypography.answerBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: coachTypography.answerBodySize * 1.35,
    includeFontPadding: false,
  },
  errorText: {
    color: colors.developmentTextMuted,
    fontSize: coachTypography.messageSize,
    lineHeight: coachTypography.messageSize * 1.35,
    includeFontPadding: false,
  },
  footnote: {
    color: colors.developmentTextMuted,
    fontSize: coachTypography.footnoteSize,
    fontWeight: typography.fontWeight.regular,
    includeFontPadding: false,
  },
});

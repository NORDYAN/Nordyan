import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { CoachQuestionUiState } from '@/lib/hooks/coach';
import type {
  CoachHomeQuickQuestionSlot,
  CoachHomeViewModel,
} from '@/lib/presentation/coach-home';
import { COACH_ASK_QUESTION_MAX_LENGTH } from '@/shared/coach-language';
import { colors, coachLayout, coachTypography, typography } from '@/theme';

type CoachAskSuggestionsProps = {
  sectionLabel: CoachHomeViewModel['ask']['quickQuestionsSectionLabel'];
  slots: readonly CoachHomeQuickQuestionSlot[];
  canAsk: boolean;
  askState: CoachQuestionUiState;
  onSubmit: (question: string) => void;
};

export function CoachAskSuggestions({
  sectionLabel,
  slots,
  canAsk,
  askState,
  onSubmit,
}: CoachAskSuggestionsProps) {
  const pending = askState.status === 'pending';
  const canInteract = canAsk && askState.status !== 'unavailable' && !pending;

  const handleSubmit = (question: string) => {
    const trimmed = question.trim();
    if (!canInteract || !trimmed) {
      return;
    }
    if (trimmed.length > COACH_ASK_QUESTION_MAX_LENGTH) {
      return;
    }
    onSubmit(trimmed);
  };

  if (slots.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading} maxFontSizeMultiplier={1.1}>
        {sectionLabel}
      </Text>
      <View style={styles.chips}>
        {slots.map((slot) => (
          <Pressable
            key={slot.id}
            accessibilityRole="button"
            accessibilityLabel={slot.question}
            disabled={!canInteract}
            onPress={() => handleSubmit(slot.question)}
            style={({ pressed }) => [
              styles.chip,
              (!canInteract || pressed) && styles.chipDisabled,
            ]}
          >
            <Text style={styles.chipText} maxFontSizeMultiplier={1.1}>
              {slot.question}
            </Text>
          </Pressable>
        ))}
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
  chips: {
    width: '100%',
    maxWidth: '100%',
    gap: coachLayout.chipGap,
  },
  chip: {
    width: '100%',
    maxWidth: '100%',
    borderRadius: coachLayout.chipRadius,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    backgroundColor: colors.developmentSurface,
    paddingHorizontal: coachLayout.chipPaddingHorizontal,
    paddingVertical: coachLayout.chipPaddingVertical,
  },
  chipDisabled: {
    opacity: 0.55,
  },
  chipText: {
    color: colors.developmentText,
    fontSize: coachTypography.chipSize,
    fontWeight: typography.fontWeight.medium,
    includeFontPadding: false,
  },
});

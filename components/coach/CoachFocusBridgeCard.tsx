import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { CoachHomeViewModel } from '@/lib/presentation/coach-home';
import { colors, coachLayout, coachTypography, typography } from '@/theme';

type CoachFocusBridgeCardProps = {
  bridge: Extract<CoachHomeViewModel['focusBridge'], { visible: true }>;
  onPressHome: () => void;
};

export function CoachFocusBridgeCard({ bridge, onPressHome }: CoachFocusBridgeCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title} maxFontSizeMultiplier={1.1}>
        {bridge.title}
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={1.1}>
        {bridge.body}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={bridge.ctaLabel}
        onPress={onPressHome}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      >
        <Text style={styles.ctaLabel} maxFontSizeMultiplier={1.1}>
          {bridge.ctaLabel}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.brandAccent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: coachLayout.cardRadius,
    paddingHorizontal: coachLayout.chipPaddingHorizontal,
    paddingVertical: coachLayout.chipPaddingVertical,
    gap: 6,
  },
  title: {
    color: colors.developmentText,
    fontSize: coachTypography.chipSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  body: {
    color: colors.developmentTextMuted,
    fontSize: coachTypography.footnoteSize + 1,
    fontWeight: typography.fontWeight.regular,
    lineHeight: 16,
    includeFontPadding: false,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginTop: 2,
  },
  ctaPressed: {
    opacity: 0.7,
  },
  ctaLabel: {
    color: colors.brandAccent,
    fontSize: coachTypography.chipSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
  },
});

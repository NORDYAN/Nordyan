import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import {
  colors,
  healthScoreExplainedLayout,
  healthScoreExplainedTypography,
  typography,
} from '@/theme';

type HealthScoreExplainedHeaderProps = {
  onBackPress: () => void;
};

export function HealthScoreExplainedHeader({ onBackPress }: HealthScoreExplainedHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={onBackPress}
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="arrow-back"
          size={healthScoreExplainedLayout.backIconSize}
          color={colors.developmentText}
        />
      </Pressable>

      <View style={styles.titleBlock}>
        <Text style={styles.title} maxFontSizeMultiplier={1.1}>
          Health Score
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.1}>
          {t('explained.subtitle')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    gap: healthScoreExplainedLayout.headerGap,
    paddingHorizontal: healthScoreExplainedLayout.horizontalPadding,
    paddingTop: healthScoreExplainedLayout.headerPaddingTop,
  },
  backButton: {
    width: healthScoreExplainedLayout.backButtonSize,
    height: healthScoreExplainedLayout.backButtonSize,
    borderRadius: healthScoreExplainedLayout.backButtonRadius,
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.8,
  },
  titleBlock: {
    width: '100%',
    gap: healthScoreExplainedLayout.headerTitleGap,
  },
  title: {
    color: colors.developmentText,
    fontSize: healthScoreExplainedTypography.titleSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: healthScoreExplainedTypography.titleSize * 1.15,
    includeFontPadding: false,
  },
  subtitle: {
    color: colors.developmentTextMuted,
    fontSize: healthScoreExplainedTypography.subtitleSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: healthScoreExplainedTypography.subtitleSize * 1.35,
    includeFontPadding: false,
  },
});

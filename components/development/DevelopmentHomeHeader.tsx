import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentHomeHeaderProps = {
  onBackPress: () => void;
  subtitle?: string;
};

export function DevelopmentHomeHeader({
  onBackPress,
  subtitle,
}: DevelopmentHomeHeaderProps) {
  useI18n();

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
          size={developmentLayout.backIconSize}
          color={colors.developmentText}
        />
      </Pressable>

      <View style={styles.titleBlock}>
        <Text
          style={styles.title}
          maxFontSizeMultiplier={1.1}
        >
          {t('development.home.title')}
        </Text>
        <Text
          style={styles.subtitle}
          maxFontSizeMultiplier={1.1}
        >
          {subtitle ?? t('development.home.subtitle')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    gap: developmentLayout.headerGap,
    paddingHorizontal: developmentLayout.horizontalPadding,
    paddingTop: developmentLayout.headerPaddingTop,
    paddingBottom: developmentLayout.headerPaddingBottom,
  },
  backButton: {
    width: developmentLayout.backButtonSize,
    height: developmentLayout.backButtonSize,
    borderRadius: developmentLayout.backButtonRadius,
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
    gap: developmentLayout.headerTitleGap,
  },
  title: {
    color: colors.developmentText,
    fontSize: developmentTypography.titleSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: developmentTypography.titleSize * 1.15,
    includeFontPadding: false,
  },
  subtitle: {
    color: colors.developmentTextMuted,
    fontSize: developmentTypography.subtitleSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: developmentTypography.subtitleSize * 1.35,
    includeFontPadding: false,
  },
});

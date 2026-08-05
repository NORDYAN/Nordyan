import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, profileLayout, profileTypography, typography } from '@/theme';

type ProfileSettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  titleColor?: string;
  showChevron?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function ProfileSettingsRow({
  icon,
  title,
  subtitle,
  titleColor = colors.onboardingText,
  showChevron = true,
  onPress,
  accessibilityLabel,
}: ProfileSettingsRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name={icon} size={profileLayout.iconSize} color={colors.onboardingAccent} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {showChevron ? (
        <Ionicons
          name="chevron-forward"
          size={profileLayout.chevronSize}
          color={colors.homeTextMuted}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: profileLayout.rowPaddingHorizontal,
    paddingVertical: profileLayout.rowPaddingVertical,
  },
  rowPressed: {
    opacity: 0.85,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: profileLayout.rowIconGap,
    minWidth: 0,
  },
  iconWrapper: {
    width: profileLayout.iconWrapperSize,
    height: profileLayout.iconWrapperSize,
    borderRadius: profileLayout.iconWrapperRadius,
    backgroundColor: colors.profileIconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: profileLayout.rowTextGap,
    minWidth: 0,
  },
  title: {
    fontSize: profileTypography.rowTitleSize,
    fontWeight: typography.fontWeight.medium,
  },
  subtitle: {
    color: colors.homeTextMuted,
    fontSize: profileTypography.rowSubtitleSize,
    fontWeight: typography.fontWeight.regular,
  },
});

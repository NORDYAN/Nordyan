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
  comingSoon?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function ProfileSettingsRow({
  icon,
  title,
  subtitle,
  titleColor = colors.onboardingText,
  showChevron = true,
  comingSoon = false,
  onPress,
  accessibilityLabel,
}: ProfileSettingsRowProps) {
  const interactive = !comingSoon && onPress != null;
  const resolvedChevron = comingSoon ? false : showChevron;
  const label = accessibilityLabel ?? (comingSoon && subtitle ? `${title}, ${subtitle}` : title);

  const body = (
    <>
      <View style={styles.content}>
        <View style={[styles.iconWrapper, comingSoon && styles.iconWrapperComingSoon]}>
          <Ionicons
            name={icon}
            size={profileLayout.iconSize}
            color={comingSoon ? colors.homeTextMuted : colors.onboardingAccent}
          />
        </View>
        <View style={styles.textBlock}>
          <Text
            style={[styles.title, { color: comingSoon ? colors.profileComingSoonTitle : titleColor }]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, comingSoon && styles.subtitleComingSoon]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {resolvedChevron ? (
        <Ionicons
          name="chevron-forward"
          size={profileLayout.chevronSize}
          color={colors.homeTextMuted}
          style={styles.chevron}
        />
      ) : null}
    </>
  );

  if (!interactive) {
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={label}
        style={styles.row}
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: profileLayout.rowPaddingHorizontal,
    paddingVertical: profileLayout.rowPaddingVertical,
    gap: 8,
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
    flexShrink: 0,
    borderRadius: profileLayout.iconWrapperRadius,
    backgroundColor: colors.profileIconWrapperBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperComingSoon: {
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
  },
  textBlock: {
    flex: 1,
    gap: profileLayout.rowTextGap,
    minWidth: 0,
  },
  title: {
    fontSize: profileTypography.rowTitleSize,
    fontWeight: typography.fontWeight.medium,
    flexShrink: 1,
  },
  subtitle: {
    color: colors.homeTextMuted,
    fontSize: profileTypography.rowSubtitleSize,
    fontWeight: typography.fontWeight.regular,
    flexShrink: 1,
  },
  subtitleComingSoon: {
    color: colors.profileComingSoonSubtitle,
  },
  chevron: {
    flexShrink: 0,
    marginLeft: 8,
  },
});

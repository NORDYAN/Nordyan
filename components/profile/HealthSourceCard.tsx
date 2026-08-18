import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { colors, profileHealthDataSourcesLayout, typography } from '@/theme';

export type HealthSourceStatus = 'disconnected' | 'connecting' | 'connected' | 'comingSoon';

type HealthSourceCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  status: HealthSourceStatus;
  actionLabel?: string;
  onActionPress?: () => void;
  disabled?: boolean;
};

function statusLabel(status: HealthSourceStatus): string {
  switch (status) {
    case 'disconnected':
      return t('health.sources.disconnected');
    case 'connecting':
      return t('health.sources.connecting');
    case 'connected':
      return t('health.sources.connected');
    case 'comingSoon':
      return t('common.comingSoon');
  }
}

export function HealthSourceCard({
  icon,
  title,
  description,
  status,
  actionLabel,
  onActionPress,
  disabled = false,
}: HealthSourceCardProps) {
  const isComingSoon = status === 'comingSoon';
  const isDisabled = disabled || isComingSoon;
  const showAction = Boolean(actionLabel && onActionPress && !isComingSoon);

  const statusDotColor =
    status === 'comingSoon'
      ? colors.profileHealthDataSourceStatusDotDim
      : status === 'connected'
        ? colors.onboardingAccent
        : colors.profileHealthDataSourceStatusDot;

  const statusTextColor =
    status === 'comingSoon'
      ? colors.profileHealthDataSourceTextDim
      : colors.profileHealthDataSourceTextMuted;

  return (
    <View style={[styles.card, isComingSoon && styles.cardComingSoon]}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconBox,
            isComingSoon && styles.iconBoxComingSoon,
          ]}
        >
          <Ionicons
            name={icon}
            size={profileHealthDataSourcesLayout.sourceIconSize}
            color={
              isComingSoon
                ? colors.profileHealthDataSourceTextDim
                : colors.profileHealthDataSourceAccent
            }
          />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actionsRow}>
        <View style={styles.statusGroup}>
          <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
          <Text style={[styles.statusLabel, { color: statusTextColor }]}>
            {statusLabel(status)}
          </Text>
        </View>

        {showAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            disabled={isDisabled || status === 'connecting'}
            onPress={onActionPress}
            style={({ pressed }) => [
              styles.actionButton,
              (isDisabled || status === 'connecting') && styles.actionButtonDisabled,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text style={styles.actionButtonLabel}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.profileHealthDataSourceCardBackground,
    borderWidth: 1,
    borderColor: colors.profileHealthDataSourceCardBorder,
    borderRadius: profileHealthDataSourcesLayout.sourceCardRadius,
    padding: profileHealthDataSourcesLayout.sourceCardPadding,
    gap: profileHealthDataSourcesLayout.sourceCardGap,
    width: '100%',
  },
  cardComingSoon: {
    opacity: profileHealthDataSourcesLayout.comingSoonOpacity,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: profileHealthDataSourcesLayout.sourceCardHeaderGap,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: profileHealthDataSourcesLayout.sourceIconBoxSize,
    height: profileHealthDataSourcesLayout.sourceIconBoxSize,
    borderRadius: profileHealthDataSourcesLayout.sourceIconBoxRadius,
    backgroundColor: colors.profileHealthDataSourceIconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxComingSoon: {
    backgroundColor: colors.profileHealthDataSourceIconBoxDisabled,
  },
  textBlock: {
    flex: 1,
    gap: profileHealthDataSourcesLayout.sourceCardTextGap,
    minWidth: 0,
  },
  title: {
    color: colors.onboardingText,
    fontSize: profileHealthDataSourcesLayout.sourceTitleSize,
    fontWeight: typography.fontWeight.semibold,
  },
  description: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.sourceDescriptionSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      profileHealthDataSourcesLayout.sourceDescriptionSize * typography.lineHeight.relaxed,
  },
  divider: {
    height: 1,
    backgroundColor: colors.profileHealthDataSourceCardBorder,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: profileHealthDataSourcesLayout.sourceStatusGap,
  },
  statusDot: {
    width: profileHealthDataSourcesLayout.sourceStatusDotSize,
    height: profileHealthDataSourcesLayout.sourceStatusDotSize,
    borderRadius: profileHealthDataSourcesLayout.sourceStatusDotSize / 2,
  },
  statusLabel: {
    fontSize: profileHealthDataSourcesLayout.sourceStatusFontSize,
    fontWeight: typography.fontWeight.medium,
  },
  actionButton: {
    backgroundColor: colors.profileHealthDataSourceAccentFill,
    borderWidth: 1,
    borderColor: colors.profileHealthDataSourceAccent,
    borderRadius: profileHealthDataSourcesLayout.connectButtonRadius,
    paddingHorizontal: profileHealthDataSourcesLayout.connectButtonPaddingHorizontal,
    paddingVertical: profileHealthDataSourcesLayout.connectButtonPaddingVertical,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonLabel: {
    color: colors.profileHealthDataSourceAccent,
    fontSize: profileHealthDataSourcesLayout.connectButtonFontSize,
    fontWeight: typography.fontWeight.semibold,
  },
});

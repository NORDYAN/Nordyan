import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProfileAvatar } from './ProfileAvatar';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { PROFILE_ACCOUNT_COPY } from '@/lib/presentation/profile-account';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, profileLayout, profileTypography, typography } from '@/theme';

type ProfileAccountHeaderCardProps = {
  name: string;
  email: string;
  onPress?: () => void;
};

export function ProfileAccountHeaderCard({ name, email, onPress }: ProfileAccountHeaderCardProps) {
  useI18n();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={PROFILE_ACCOUNT_COPY.title}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card padding={profileLayout.headerCardPadding} borderRadius={profileLayout.headerCardRadius}>
        <View style={styles.content}>
          <View style={styles.leading}>
            <ProfileAvatar />
            <View style={styles.textBlock}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={profileLayout.headerChevronSize}
            color={colors.homeTextMuted}
            style={styles.chevron}
          />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: profileLayout.headerContentGap,
    minWidth: 0,
  },
  textBlock: {
    flex: 1,
    gap: profileLayout.headerTextGap,
    minWidth: 0,
  },
  name: {
    color: colors.onboardingText,
    fontSize: profileTypography.headerNameSize,
    fontWeight: typography.fontWeight.semibold,
    flexShrink: 1,
  },
  email: {
    color: colors.homeTextMuted,
    fontSize: profileTypography.headerEmailSize,
    fontWeight: typography.fontWeight.regular,
    flexShrink: 1,
  },
  chevron: {
    flexShrink: 0,
    marginLeft: 8,
  },
});

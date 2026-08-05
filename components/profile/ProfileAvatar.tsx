import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, profileLayout } from '@/theme';

export function ProfileAvatar() {
  return (
    <View style={styles.ring}>
      <View style={styles.inner}>
        <Ionicons
          name="person-outline"
          size={profileLayout.headerAvatarIconSize}
          color={colors.onboardingAccent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: profileLayout.headerAvatarSize,
    height: profileLayout.headerAvatarSize,
    borderRadius: profileLayout.headerAvatarSize / 2,
    borderWidth: profileLayout.headerAvatarRingWidth,
    borderColor: colors.profileAvatarRing,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.profileAvatarFill,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

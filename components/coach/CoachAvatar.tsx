import { Image, StyleSheet, View } from 'react-native';

import { colors, coachLayout } from '@/theme';

const COACH_MASTER_AVATAR = require('../../assets/images/coach/nordyan-coach-master-avatar.png');

/** Approved NORDYAN Coach Master Avatar — static local asset only. */
export function CoachAvatar() {
  return (
    <View style={styles.ring} accessibilityLabel="NORDYAN Coach">
      <Image
        source={COACH_MASTER_AVATAR}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: coachLayout.avatarSize,
    height: coachLayout.avatarSize,
    borderRadius: coachLayout.avatarSize / 2,
    borderWidth: coachLayout.avatarRingWidth,
    borderColor: colors.brandAccent,
    overflow: 'hidden',
    backgroundColor: colors.developmentSurface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

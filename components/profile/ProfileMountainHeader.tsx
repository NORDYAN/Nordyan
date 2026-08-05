import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { onboardingAssets } from '@/assets/images/onboarding';
import { colors, profileLayout } from '@/theme';

export function ProfileMountainHeader() {
  return (
    <View
      style={[styles.root, { height: profileLayout.mountainHeaderHeight }]}
      pointerEvents="none"
    >
      <Image
        source={onboardingAssets.mountainBackground}
        style={styles.image}
        resizeMode="cover"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View style={styles.overlay} />
      <View style={[styles.fade, { height: profileLayout.mountainFadeHeight }]}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="profileMountainFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.profileBackground} stopOpacity="0" />
              <Stop offset="1" stopColor={colors.profileBackground} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#profileMountainFade)" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: profileLayout.headerTopOffset,
    left: 0,
    right: 0,
    overflow: 'hidden',
    backgroundColor: colors.profileBackground,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.profileMountainOverlay,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

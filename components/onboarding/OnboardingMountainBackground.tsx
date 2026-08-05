import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { onboardingAssets } from '@/assets/images/onboarding';
import { colors, onboardingLayout } from '@/theme';

type OnboardingMountainBackgroundProps = {
  backgroundSource?: ImageSourcePropType;
  overlayColor?: string;
  fogEnabled?: boolean;
};

export function OnboardingMountainBackground({
  backgroundSource = onboardingAssets.mountainBackground,
  overlayColor = colors.onboardingOverlay,
  fogEnabled = false,
}: OnboardingMountainBackgroundProps) {
  return (
    <View style={styles.root} pointerEvents="none">
      <Image
        source={backgroundSource}
        style={styles.image}
        resizeMode="cover"
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <View style={[styles.overlay, { backgroundColor: overlayColor }]} />
      {fogEnabled ? (
        <View style={styles.fog}>
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="onboardingFog" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0" stopColor="#E4E6EB" stopOpacity="0.14" />
                <Stop offset="0.55" stopColor="#E4E6EB" stopOpacity="0.05" />
                <Stop offset="1" stopColor="#E4E6EB" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#onboardingFog)" />
          </Svg>
        </View>
      ) : null}
      <View
        style={[
          styles.bottomFade,
          { height: onboardingLayout.backgroundBottomFadeHeight },
        ]}
      >
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="onboardingBottomFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.onboardingBackground} stopOpacity="0" />
              <Stop offset="1" stopColor={colors.onboardingBackground} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#onboardingBottomFade)"
          />
        </Svg>
      </View>
      <View
        style={[
          styles.bottomSolid,
          { height: onboardingLayout.backgroundBottomSolidHeight },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.onboardingBackground,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  fog: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: onboardingLayout.backgroundBottomSolidHeight,
    height: '52%',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: onboardingLayout.backgroundBottomSolidHeight,
  },
  bottomSolid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.onboardingBackground,
  },
});

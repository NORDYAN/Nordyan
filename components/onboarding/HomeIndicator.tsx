import { StyleSheet, View } from 'react-native';

import { colors, onboardingLayout, radii } from '@/theme';

export function HomeIndicator() {
  return (
    <View style={styles.container} accessibilityElementsHidden importantForAccessibility="no">
      <View style={styles.bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: onboardingLayout.homeIndicatorPaddingTop,
    paddingBottom: onboardingLayout.homeIndicatorPaddingBottom,
  },
  bar: {
    width: onboardingLayout.homeIndicatorWidth,
    height: onboardingLayout.homeIndicatorHeight,
    borderRadius: radii.full,
    backgroundColor: colors.onboardingHomeIndicator,
  },
});

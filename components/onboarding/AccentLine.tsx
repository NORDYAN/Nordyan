import { StyleSheet, View } from 'react-native';

import { colors, onboardingLayout } from '@/theme';

export function AccentLine() {
  return <View style={styles.line} accessibilityElementsHidden importantForAccessibility="no" />;
}

const styles = StyleSheet.create({
  line: {
    width: onboardingLayout.accentLineWidth,
    height: onboardingLayout.accentLineHeight,
    backgroundColor: colors.onboardingAccent,
  },
});

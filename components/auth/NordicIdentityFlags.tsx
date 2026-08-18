import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { colors } from '@/theme';
import { authLayout } from '@/theme/auth';

type NordicFlagKind = 'NO' | 'SE' | 'DK' | 'FI';

const FLAGS: readonly NordicFlagKind[] = ['NO', 'SE', 'DK', 'FI'];

function NordicFlagBadge({ kind }: { kind: NordicFlagKind }) {
  return (
    <View style={styles.badge} pointerEvents="none">
      <Svg width={authLayout.flagsSize} height={authLayout.flagsSize} viewBox="0 0 16 16">
        {kind === 'NO' ? (
          <>
            <Rect x="0" y="0" width="16" height="16" fill="#BA0C2F" />
            <Rect x="4" y="0" width="4" height="16" fill="#FFFFFF" />
            <Rect x="0" y="6" width="16" height="4" fill="#FFFFFF" />
            <Rect x="5.15" y="0" width="1.7" height="16" fill="#00205B" />
            <Rect x="0" y="7.15" width="16" height="1.7" fill="#00205B" />
          </>
        ) : null}
        {kind === 'SE' ? (
          <>
            <Rect x="0" y="0" width="16" height="16" fill="#006AA7" />
            <Rect x="5" y="0" width="3" height="16" fill="#FECC00" />
            <Rect x="0" y="6.5" width="16" height="3" fill="#FECC00" />
          </>
        ) : null}
        {kind === 'DK' ? (
          <>
            <Rect x="0" y="0" width="16" height="16" fill="#C8102E" />
            <Rect x="5" y="0" width="2.5" height="16" fill="#FFFFFF" />
            <Rect x="0" y="6.75" width="16" height="2.5" fill="#FFFFFF" />
          </>
        ) : null}
        {kind === 'FI' ? (
          <>
            <Rect x="0" y="0" width="16" height="16" fill="#FFFFFF" />
            <Rect x="5" y="0" width="3" height="16" fill="#002F6C" />
            <Rect x="0" y="6.5" width="16" height="3" fill="#002F6C" />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

export function NordicIdentityFlags() {
  return (
    <View
      style={styles.row}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {FLAGS.map((kind) => (
        <NordicFlagBadge key={kind} kind={kind} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: authLayout.flagsGap,
  },
  badge: {
    width: authLayout.flagsSize,
    height: authLayout.flagsSize,
    borderRadius: authLayout.flagsSize / 2,
    overflow: 'hidden',
    borderWidth: authLayout.flagsBorderWidth,
    borderColor: colors.onboardingAccent,
    backgroundColor: colors.onboardingBackground,
  },
});

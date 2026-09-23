import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import type { DevelopmentDriverRow } from '@/lib/presentation/development';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentDriverCardProps = {
  drivers: DevelopmentDriverRow[];
};

function driverValueColor(row: DevelopmentDriverRow): string {
  if (row.tone === 'positive') {
    return colors.developmentAccent;
  }
  if (row.tone === 'negative') {
    return colors.onboardingErrorText;
  }
  return colors.developmentTextMuted;
}

function driverIconBoxStyle(row: DevelopmentDriverRow) {
  if (row.tone === 'positive') {
    return styles.iconBoxPositive;
  }
  if (row.tone === 'negative') {
    return styles.iconBoxNegative;
  }
  return styles.iconBoxMuted;
}

function driverDisplayValue(row: DevelopmentDriverRow): string {
  if (row.changeText) {
    return row.changeText;
  }

  return row.valueText;
}

export function DevelopmentDriverCard({ drivers }: DevelopmentDriverCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading} maxFontSizeMultiplier={1.1}>
        {t('development.driversHeading')}
      </Text>
      <View style={styles.card}>
        {drivers.map((row, index) => {
          const valueColor = driverValueColor(row);
          const isLast = index === drivers.length - 1;

          return (
            <View
              key={row.id}
              style={[styles.row, !isLast && styles.rowBorder]}
            >
              <View style={styles.left}>
                <View style={[styles.iconBox, driverIconBoxStyle(row)]}>
                  <Ionicons
                    name="checkmark"
                    size={developmentLayout.factorIconGlyphSize}
                    color={valueColor}
                  />
                </View>
                <Text style={styles.label} maxFontSizeMultiplier={1.1}>
                  {row.label}
                </Text>
              </View>
              <Text
                style={[styles.value, { color: valueColor }]}
                maxFontSizeMultiplier={1.1}
              >
                {driverDisplayValue(row)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    gap: developmentLayout.factorsGap,
    paddingHorizontal: developmentLayout.horizontalPadding,
    paddingVertical: developmentLayout.sectionPaddingVertical,
  },
  heading: {
    color: colors.developmentText,
    fontSize: developmentTypography.sectionHeadingSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: developmentTypography.sectionHeadingSize * 1.2,
    includeFontPadding: false,
  },
  card: {
    width: '100%',
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: developmentLayout.factorsCardRadius,
    paddingHorizontal: developmentLayout.factorsCardPaddingHorizontal,
    paddingVertical: developmentLayout.factorsCardPaddingVertical,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
    paddingVertical: developmentLayout.factorRowPaddingVertical,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.developmentBorder,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: developmentLayout.factorLabelGap,
    flexShrink: 1,
  },
  iconBox: {
    width: developmentLayout.factorIconSize,
    height: developmentLayout.factorIconSize,
    borderRadius: developmentLayout.factorIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxPositive: {
    backgroundColor: colors.developmentAccentFill,
  },
  iconBoxNegative: {
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.onboardingErrorText,
  },
  iconBoxMuted: {
    backgroundColor: colors.developmentBorder,
  },
  label: {
    color: colors.developmentText,
    fontSize: developmentTypography.factorLabelSize,
    fontWeight: typography.fontWeight.medium,
    lineHeight: developmentTypography.factorLabelSize * 1.2,
    includeFontPadding: false,
  },
  value: {
    fontSize: developmentTypography.factorValueSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: developmentTypography.factorValueSize * 1.2,
    marginLeft: 10,
    includeFontPadding: false,
  },
});

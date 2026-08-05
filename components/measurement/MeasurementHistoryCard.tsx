import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { Measurement } from '@/lib/domain/measurement';
import {
  formatMeasurementHistoryCircumference,
  formatMeasurementHistoryDate,
  formatMeasurementHistoryWeight,
} from '@/lib/presentation/measurement/measurement-history.presentation';
import {
  colors,
  healthNewMeasurementLayout,
  onboardingProfileLayout,
  spacing,
  typography,
} from '@/theme';

type MeasurementHistoryCardProps = {
  measurement: Measurement;
  /** Wire in a future sprint when measurement detail is implemented. */
  onDetailPress?: (measurementId: string) => void;
};

type MeasurementRowProps = {
  label: string;
  value: string;
};

function MeasurementRow({ label, value }: MeasurementRowProps) {
  return (
    <View style={styles.measurementRow}>
      <Text style={styles.measurementLabel}>{label}</Text>
      <Text style={styles.measurementValue}>{value}</Text>
    </View>
  );
}

function MeasurementHistoryDetailLabel({
  onDetailPress,
  measurementId,
}: {
  onDetailPress?: (measurementId: string) => void;
  measurementId: string;
}) {
  if (onDetailPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Detaljer"
        onPress={() => onDetailPress(measurementId)}
        style={({ pressed }) => [styles.detailRow, pressed && styles.detailRowPressed]}
      >
        <Text style={styles.detailLabelActive}>Detaljer</Text>
        <Ionicons
          name="chevron-forward"
          size={healthNewMeasurementLayout.helpChevronSize}
          color={colors.onboardingAccent}
        />
      </Pressable>
    );
  }

  return (
    <View
      style={styles.detailRow}
      accessibilityRole="text"
      accessibilityState={{ disabled: true }}
      importantForAccessibility="yes"
    >
      <Text style={styles.detailLabelDisabled}>Detaljer</Text>
      <Ionicons
        name="chevron-forward"
        size={healthNewMeasurementLayout.helpChevronSize}
        color={colors.onboardingProfileLabel}
      />
    </View>
  );
}

export function MeasurementHistoryCard({
  measurement,
  onDetailPress,
}: MeasurementHistoryCardProps) {
  return (
    <Card
      padding={onboardingProfileLayout.formCardPadding}
      borderRadius={onboardingProfileLayout.formCardRadius}
      style={styles.card}
    >
      <Text style={styles.dateLabel}>{formatMeasurementHistoryDate(measurement.measuredAt)}</Text>

      <View style={styles.measurementsBlock}>
        <MeasurementRow
          label="Vikt"
          value={formatMeasurementHistoryWeight(measurement.weightKg)}
        />
        <MeasurementRow
          label="Midjemått"
          value={formatMeasurementHistoryCircumference(measurement.waistCm)}
        />
        <MeasurementRow
          label="Halsmått"
          value={formatMeasurementHistoryCircumference(measurement.neckCm)}
        />
      </View>

      <MeasurementHistoryDetailLabel
        measurementId={measurement.id}
        onDetailPress={onDetailPress}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.onboardingProfileFormBackground,
    borderColor: colors.onboardingProfileFormBorder,
    gap: onboardingProfileLayout.formRowGap,
    paddingBottom: onboardingProfileLayout.formCardPadding + spacing.sm,
  },
  dateLabel: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.lg * typography.lineHeight.tight,
  },
  measurementsBlock: {
    gap: onboardingProfileLayout.formRowGap,
    width: '100%',
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: onboardingProfileLayout.formCardGap,
    width: '100%',
  },
  measurementLabel: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  },
  measurementValue: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: onboardingProfileLayout.fieldLabelGap,
    minHeight: onboardingProfileLayout.fieldHeight - spacing.lgAlt,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  detailRowPressed: {
    opacity: 0.75,
  },
  detailLabelActive: {
    color: colors.onboardingAccent,
    fontSize: healthNewMeasurementLayout.helpLinkFontSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: healthNewMeasurementLayout.helpLinkFontSize * typography.lineHeight.normal,
  },
  detailLabelDisabled: {
    color: colors.onboardingProfileLabel,
    fontSize: healthNewMeasurementLayout.helpLinkFontSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: healthNewMeasurementLayout.helpLinkFontSize * typography.lineHeight.normal,
    opacity: 0.72,
  },
});

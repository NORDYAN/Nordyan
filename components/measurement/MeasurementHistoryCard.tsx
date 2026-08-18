import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { Measurement } from '@/lib/domain/measurement';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  formatMeasurementHistoryCircumference,
  formatMeasurementHistoryDate,
  formatMeasurementHistoryWeight,
} from '@/lib/presentation/measurement/measurement-history.presentation';
import {
  colors,
  onboardingProfileLayout,
  spacing,
  typography,
} from '@/theme';

type MeasurementHistoryCardProps = {
  measurement: Measurement;
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

export function MeasurementHistoryCard({ measurement }: MeasurementHistoryCardProps) {
  useI18n();

  return (
    <Card
      padding={onboardingProfileLayout.formCardPadding}
      borderRadius={onboardingProfileLayout.formCardRadius}
      style={styles.card}
    >
      <Text style={styles.dateLabel}>{formatMeasurementHistoryDate(measurement.measuredAt)}</Text>

      <View style={styles.measurementsBlock}>
        <MeasurementRow
          label={t('onboarding.weight')}
          value={formatMeasurementHistoryWeight(measurement.weightKg)}
        />
        <MeasurementRow
          label={t('onboarding.waist')}
          value={formatMeasurementHistoryCircumference(measurement.waistCm)}
        />
        <MeasurementRow
          label={t('onboarding.neck')}
          value={formatMeasurementHistoryCircumference(measurement.neckCm)}
        />
      </View>
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
});

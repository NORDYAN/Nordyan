import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  colors,
  healthNewMeasurementLayout,
  onboardingLayout,
  typography,
} from '@/theme';

export function MeasurementHistoryEmptyState() {
  useI18n();

  const handleRegisterMeasurement = () => {
    router.push(routes.healthNewMeasurement);
  };

  return (
    <View style={styles.root}>
      <View style={styles.copyBlock}>
        <Text style={styles.title}>{t('health.history.emptyTitle')}</Text>
        <Text style={styles.body}>{t('health.history.emptyBody')}</Text>
      </View>

      <Button
        label={t('health.history.register')}
        variant="onboarding"
        style={styles.button}
        onPress={handleRegisterMeasurement}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    gap: onboardingLayout.footerGap,
    paddingHorizontal: healthNewMeasurementLayout.horizontalPadding,
    width: '100%',
  },
  copyBlock: {
    gap: healthNewMeasurementLayout.headerGap,
    width: '100%',
  },
  title: {
    color: colors.onboardingText,
    fontSize: healthNewMeasurementLayout.titleFontSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: healthNewMeasurementLayout.titleFontSize * typography.lineHeight.tight,
    textAlign: 'center',
  },
  body: {
    color: colors.onboardingProfileLabel,
    fontSize: healthNewMeasurementLayout.subtitleFontSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: healthNewMeasurementLayout.subtitleFontSize * typography.lineHeight.relaxed,
    textAlign: 'center',
    width: '100%',
  },
  button: {
    width: '100%',
  },
});

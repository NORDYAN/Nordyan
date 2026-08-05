import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import {
  colors,
  healthNewMeasurementLayout,
  onboardingLayout,
  typography,
} from '@/theme';

export function MeasurementHistoryEmptyState() {
  const handleRegisterMeasurement = () => {
    router.push(routes.healthNewMeasurement);
  };

  return (
    <View style={styles.root}>
      <View style={styles.copyBlock}>
        <Text style={styles.title}>Ingen mäthistorik ännu</Text>
        <Text style={styles.body}>
          Dina registrerade kroppsmått visas här så att du enkelt kan följa din utveckling över
          tid.
        </Text>
      </View>

      <Button
        label="Registrera mätning"
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

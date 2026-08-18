import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  MeasurementHistoryCard,
  MeasurementHistoryEmptyState,
} from '@/components/measurement';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { useMeasurementHistory } from '@/lib/hooks/measurement';
import {
  colors,
  healthNewMeasurementLayout,
  profileHealthDataSourcesLayout,
  typography,
} from '@/theme';

export default function MeasurementHistoryScreen() {
  const { state } = useMeasurementHistory();

  const handleNewMeasurement = () => {
    router.push(routes.healthNewMeasurement);
  };

  return (
    <ScreenContainer variant="dark" style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          state.status === 'empty' && styles.scrollContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerArea}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTopSpacer} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('health.new.add')}
              onPress={handleNewMeasurement}
              style={({ pressed }) => [styles.newMeasurementAction, pressed && styles.newMeasurementActionPressed]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add" size={22} color={colors.onboardingButtonText} />
            </Pressable>
          </View>

          <View style={styles.headerBlock}>
            <Text style={styles.title}>{t('health.history.title')}</Text>
            <Text style={styles.subtitle}>{t('health.history.subtitle')}</Text>
          </View>
        </View>

        {state.status === 'loading' ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.onboardingAccent} size="small" />
          </View>
        ) : null}

        {state.status === 'error' ? (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>{state.message}</Text>
          </View>
        ) : null}

        {state.status === 'empty' ? <MeasurementHistoryEmptyState /> : null}

        {state.status === 'ready' ? (
          <View style={styles.historyList}>
            {state.measurements.map((measurement) => (
              <MeasurementHistoryCard key={measurement.id} measurement={measurement} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: profileHealthDataSourcesLayout.sectionGap,
    paddingHorizontal: healthNewMeasurementLayout.horizontalPadding,
    paddingTop: healthNewMeasurementLayout.headerPaddingTop,
    paddingBottom: healthNewMeasurementLayout.scrollPaddingBottom,
  },
  scrollContentEmpty: {
    flexGrow: 1,
  },
  headerArea: {
    gap: healthNewMeasurementLayout.headerGap,
    width: '100%',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  headerTopSpacer: {
    flex: 1,
  },
  newMeasurementAction: {
    width: profileHealthDataSourcesLayout.backTouchSize,
    height: profileHealthDataSourcesLayout.backTouchSize,
    borderRadius: profileHealthDataSourcesLayout.backTouchSize / 2,
    backgroundColor: colors.onboardingAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMeasurementActionPressed: {
    opacity: 0.85,
  },
  headerBlock: {
    gap: healthNewMeasurementLayout.headerGap,
    width: '100%',
  },
  title: {
    color: colors.onboardingText,
    fontSize: healthNewMeasurementLayout.titleFontSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: healthNewMeasurementLayout.titleFontSize * typography.lineHeight.tight,
  },
  subtitle: {
    color: colors.onboardingProfileLabel,
    fontSize: healthNewMeasurementLayout.subtitleFontSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: healthNewMeasurementLayout.subtitleFontSize * typography.lineHeight.relaxed,
    width: '100%',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: profileHealthDataSourcesLayout.sectionGap,
    width: '100%',
  },
  errorState: {
    width: '100%',
  },
  errorText: {
    color: colors.onboardingErrorText,
    fontSize: healthNewMeasurementLayout.subtitleFontSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: healthNewMeasurementLayout.subtitleFontSize * typography.lineHeight.relaxed,
    width: '100%',
  },
  historyList: {
    gap: profileHealthDataSourcesLayout.sourcesListGap,
    width: '100%',
  },
});

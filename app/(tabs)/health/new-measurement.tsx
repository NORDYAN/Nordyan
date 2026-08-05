import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MeasurementForm } from '@/components/measurement';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/providers/auth-provider';
import {
  colors,
  healthNewMeasurementLayout,
  profileHealthDataSourcesLayout,
  typography,
} from '@/theme';

export default function NewMeasurementScreen() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';

  return (
    <ScreenContainer variant="dark" style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.navRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tillbaka"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="chevron-back"
                size={profileHealthDataSourcesLayout.backIconSize}
                color={colors.onboardingText}
              />
            </Pressable>
          </View>

          <View style={styles.headerBlock}>
            <Text style={styles.title}>Ny mätning</Text>
            <Text style={styles.subtitle}>
              Registrera dina senaste kroppsmått för att uppdatera din utveckling och din NORDYAN
              Health Score.
            </Text>
          </View>

          <MeasurementForm userId={userId} variant="newMeasurement" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: healthNewMeasurementLayout.scrollPaddingBottom,
  },
  navRow: {
    paddingHorizontal: healthNewMeasurementLayout.horizontalPadding,
    paddingTop: healthNewMeasurementLayout.headerPaddingTop,
    width: '100%',
  },
  backButton: {
    width: profileHealthDataSourcesLayout.backTouchSize,
    height: profileHealthDataSourcesLayout.backTouchSize,
    borderRadius: profileHealthDataSourcesLayout.connectButtonRadius,
    padding: profileHealthDataSourcesLayout.backTouchPadding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.75,
  },
  headerBlock: {
    gap: healthNewMeasurementLayout.headerGap,
    paddingHorizontal: healthNewMeasurementLayout.horizontalPadding,
    paddingTop: healthNewMeasurementLayout.headerGap,
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
});

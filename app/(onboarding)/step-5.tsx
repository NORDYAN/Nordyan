import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  HomeIndicator,
  OnboardingCoachCard,
  OnboardingMountainBackground,
  OnboardingResultMetricCard,
} from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { isProfileComplete } from '@/lib/domain/profile';
import { useOnboardingResult } from '@/lib/hooks/onboarding';
import { useCurrentProfile } from '@/lib/hooks/profile';
import { setOnboardingCompleteForUser } from '@/lib/onboarding/completion-storage';
import { syncPendingProfileAfterAuth } from '@/lib/onboarding/sync-pending-profile';
import { profileService } from '@/lib/services/profile/profile.service';
import { useAuth } from '@/providers/auth-provider';
import { colors, onboardingLayout, onboardingResultLayout, typography } from '@/theme';

const SYNC_ERROR_MESSAGE = 'Det gick inte att spara din profil. Försök igen.';

export default function OnboardingResultScreen() {
  const { status, session } = useAuth();
  const { profile } = useCurrentProfile();
  const resultState = useOnboardingResult({ profile });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bodyFatValue =
    resultState.status === 'ready'
      ? resultState.bodyFatPercentLabel
      : resultState.status === 'loading'
        ? '…'
        : '—';

  const healthScoreValue =
    resultState.status === 'ready'
      ? resultState.healthScoreLabel
      : resultState.status === 'loading'
        ? '…'
        : '—';

  const coachHeadline =
    resultState.status === 'ready'
      ? resultState.coachTitle
      : resultState.status === 'loading'
        ? '…'
        : '—';

  const coachMessage =
    resultState.status === 'ready'
      ? resultState.coachMessage
      : resultState.status === 'loading'
        ? '…'
        : '—';

  const handleOpenNordyan = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    if (status === 'authenticated' && session?.user.id) {
      const syncResult = await syncPendingProfileAfterAuth();

      if (__DEV__) {
        console.log('[onboarding/step-5] sync result', syncResult);
      }

      if (!syncResult.ok) {
        if (syncResult.reason === 'missing_pending') {
          const profileResult = await profileService.getCurrentProfile();
          if (
            profileResult.ok &&
            profileResult.value &&
            isProfileComplete(profileResult.value)
          ) {
            await setOnboardingCompleteForUser(session.user.id, true);
            setIsSubmitting(false);
            router.replace(routes.home);
            return;
          }
        }

        setErrorMessage(SYNC_ERROR_MESSAGE);
        setIsSubmitting(false);
        return;
      }

      await setOnboardingCompleteForUser(session.user.id, true);
      setIsSubmitting(false);
      router.replace(routes.home);
      return;
    }

    setIsSubmitting(false);
    router.replace(routes.authSignIn);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground overlayColor={onboardingResultLayout.mountainOverlay} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.resultArea}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerBlock}>
              <Text style={styles.overline}>Analys Klar</Text>
              <Text style={styles.title}>Ditt utgångsläge</Text>
            </View>

            <View style={styles.resultsCards}>
              <OnboardingResultMetricCard
                label="Kroppsfett"
                caption="Uppskattad nivå"
                value={bodyFatValue}
                valueVariant="bodyFat"
              />
              <OnboardingResultMetricCard
                label="NORDYAN Health Score"
                caption="Baserat på din åldersgrupp"
                value={healthScoreValue}
                valueSuffix="/100"
                valueVariant="healthScore"
              />
            </View>

            <OnboardingCoachCard headline={coachHeadline} message={coachMessage} />
          </ScrollView>

          <View style={styles.footer}>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <Button
              label="Öppna NORDYAN"
              variant="onboarding"
              style={styles.button}
              onPress={handleOpenNordyan}
              disabled={isSubmitting}
            />
            <HomeIndicator />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: onboardingLayout.contentPaddingBottom,
  },
  scrollView: {
    flex: 1,
  },
  resultArea: {
    paddingTop: onboardingResultLayout.areaPaddingTop,
    paddingHorizontal: onboardingLayout.horizontalPadding,
    gap: onboardingResultLayout.areaGap,
    paddingBottom: onboardingResultLayout.scrollBottomPadding,
  },
  headerBlock: {
    gap: onboardingResultLayout.headerGap,
    width: '100%',
  },
  overline: {
    color: colors.onboardingAccent,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: onboardingResultLayout.overlineLetterSpacing,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.onboardingText,
    fontSize: onboardingResultLayout.titleFontSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: onboardingResultLayout.titleFontSize * typography.lineHeight.tight,
  },
  resultsCards: {
    width: '100%',
    gap: onboardingResultLayout.cardsGap,
  },
  footer: {
    gap: onboardingResultLayout.footerGap,
    paddingHorizontal: onboardingLayout.horizontalPadding,
  },
  errorText: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});

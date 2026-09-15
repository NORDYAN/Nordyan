import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  HomeIndicator,
  OnboardingCoachCard,
  OnboardingMajorProgress,
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
import { persistPendingInitialLifestyleAfterAuth } from '@/lib/onboarding/pending-initial-lifestyle-storage';
import {
  bindPendingOnboardingToUser,
  clearCompletedOnboardingLocalData,
} from '@/lib/onboarding/pending-onboarding-ownership';
import { syncPendingProfileAfterAuth } from '@/lib/onboarding/sync-pending-profile-runtime';
import { getInitialLifestyleSyncErrorMessage } from '@/lib/presentation/initial-lifestyle';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { profileService } from '@/lib/services/profile';
import { useAuth } from '@/providers/auth-provider';
import { colors, onboardingLayout, onboardingResultLayout, typography } from '@/theme';

const SYNC_ERROR_MESSAGE = () => t('onboarding.syncError');

export default function OnboardingResultScreen() {
  useI18n();
  const { visit } = useLocalSearchParams<{ visit?: string | string[] }>();
  const visitKey = Array.isArray(visit) ? visit[0] : visit;
  const { status, session } = useAuth();
  const { profile } = useCurrentProfile();
  const resultState = useOnboardingResult({ profile, visit: visitKey });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const profileSyncSucceededRef = useRef(false);

  const bodyFatValue =
    resultState.status === 'ready'
      ? resultState.bodyFatPercentLabel
      : resultState.status === 'loading'
        ? '…'
        : '—';
  const bodyFatCaption =
    resultState.status === 'ready' && !resultState.bodyFatAvailable
      ? t('onboarding.bodyFatUnavailable')
      : t('onboarding.bodyFatCaption');

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
      try {
        const ownership = await bindPendingOnboardingToUser(session.user.id);
        if (!ownership.ok) {
          setErrorMessage(SYNC_ERROR_MESSAGE());
          setIsSubmitting(false);
          return;
        }
      } catch {
        setErrorMessage(SYNC_ERROR_MESSAGE());
        setIsSubmitting(false);
        return;
      }

      if (!profileSyncSucceededRef.current) {
        const syncResult = await syncPendingProfileAfterAuth();

        if (!syncResult.ok) {
          if (syncResult.reason === 'missing_pending') {
            const profileResult = await profileService.getCurrentProfile();
            if (
              profileResult.ok &&
              profileResult.value &&
              isProfileComplete(profileResult.value)
            ) {
              await setOnboardingCompleteForUser(session.user.id, true);
              profileSyncSucceededRef.current = true;
            } else {
              setErrorMessage(SYNC_ERROR_MESSAGE());
              setIsSubmitting(false);
              return;
            }
          } else {
            setErrorMessage(SYNC_ERROR_MESSAGE());
            setIsSubmitting(false);
            return;
          }
        } else {
          profileSyncSucceededRef.current = true;
        }
      }

      const lifestyleResult = await persistPendingInitialLifestyleAfterAuth(session.user.id);
      if (!lifestyleResult.ok) {
        setErrorMessage(getInitialLifestyleSyncErrorMessage());
        setIsSubmitting(false);
        return;
      }

      await setOnboardingCompleteForUser(session.user.id, true);
      await clearCompletedOnboardingLocalData(session.user.id);
      setIsSubmitting(false);
      router.replace(routes.home);
      return;
    }

    setIsSubmitting(false);
    router.replace(routes.authSignUp);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground overlayColor={onboardingResultLayout.mountainOverlay} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <OnboardingMajorProgress step="result" />
        <View style={styles.content}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.resultArea}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerBlock}>
              <Text style={styles.overline}>{t('onboarding.result.overline')}</Text>
              <Text style={styles.title}>{t('onboarding.result.title')}</Text>
            </View>

            <View style={styles.resultsCards}>
              <OnboardingResultMetricCard
                label={t('onboarding.bodyFat')}
                caption={bodyFatCaption}
                value={bodyFatValue}
                valueVariant="bodyFat"
              />
              <OnboardingResultMetricCard
                label={t('onboarding.healthScore')}
                caption={t('onboarding.healthScoreCaption')}
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
              label={t('onboarding.openApp')}
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

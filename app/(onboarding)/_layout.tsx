import { Redirect, Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { routes } from '@/constants/routes';
import { isCurrentHealthDataConsentGrant } from '@/lib/domain/health-data-consent';
import { hasPendingAgeConfirmation } from '@/lib/onboarding/pending-age-confirmation-storage';
import { getVisiblePendingHealthDataConsent } from '@/lib/onboarding/pending-health-data-consent-storage';
import {
  isAgeGatedOnboardingPath,
  resolveAgeGatedOnboardingAccess,
} from '@/lib/presentation/age-confirmation';
import {
  isHealthOnboardingCollectionPath,
  resolveHealthOnboardingCollectionAccess,
} from '@/lib/presentation/health-data-consent';
import {
  resolveOnboardingLayoutChrome,
  type OnboardingAccess,
} from '@/lib/presentation/onboarding-layout/onboarding-layout-chrome';
import { healthDataConsentService } from '@/lib/services/health-data-consent';
import { useAuth } from '@/providers/auth-provider';
import { colors } from '@/theme';

export default function OnboardingLayout() {
  const pathname = usePathname();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const requiresAge = isAgeGatedOnboardingPath(pathname);
  const requiresConsent = isHealthOnboardingCollectionPath(pathname);
  const [access, setAccess] = useState<OnboardingAccess>(
    requiresAge || requiresConsent ? 'loading' : 'allow',
  );

  useEffect(() => {
    if (!requiresAge && !requiresConsent) {
      setAccess('allow');
      return;
    }

    let cancelled = false;
    setAccess('loading');

    const run = async () => {
      if (requiresAge) {
        const confirmed = await hasPendingAgeConfirmation();
        if (resolveAgeGatedOnboardingAccess(confirmed) === 'block') {
          if (!cancelled) {
            setAccess('age');
          }
          return;
        }
      }

      if (!requiresConsent) {
        if (!cancelled) {
          setAccess('allow');
        }
        return;
      }

      const pendingGrant = await getVisiblePendingHealthDataConsent(userId);
      if (isCurrentHealthDataConsentGrant(pendingGrant)) {
        if (!cancelled) {
          setAccess('allow');
        }
        return;
      }

      const serverHasActiveCurrent = userId
        ? await healthDataConsentService.hasActiveCurrentConsent(userId)
        : false;
      const next = resolveHealthOnboardingCollectionAccess({
        pendingGrant,
        serverHasActiveCurrent,
      });
      if (!cancelled) {
        setAccess(next === 'allow' ? 'allow' : 'consent');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [requiresAge, requiresConsent, userId]);

  const chrome = resolveOnboardingLayoutChrome({
    requiresAge,
    requiresConsent,
    access,
  });

  return (
    <View style={styles.root}>
      <View style={styles.stackHost} collapsable={false}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      {chrome.showLoadingOverlay ? (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator color={colors.onboardingAccent} size="large" />
        </View>
      ) : null}
      {chrome.redirect === 'age' ? <Redirect href={routes.onboardingAgeConfirmation} /> : null}
      {chrome.redirect === 'consent' ? (
        <Redirect href={routes.onboardingHealthDataConsent} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  stackHost: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onboardingBackground,
  },
});

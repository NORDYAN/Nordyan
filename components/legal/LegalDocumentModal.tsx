import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { OnboardingInfoModalShell } from '@/components/onboarding/OnboardingInfoModalShell';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  isAllowedLegalNavigationUrl,
  legalDocumentUrlFor,
  type LegalDocumentId,
} from '@/lib/presentation/legal-documents';
import { colors, onboardingLayout, typography } from '@/theme';

type LegalDocumentModalProps = {
  visible: boolean;
  document: LegalDocumentId | null;
  onClose: () => void;
};

export function LegalDocumentModal({ visible, document, onClose }: LegalDocumentModalProps) {
  const { locale } = useI18n();
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const activeDocument = document ?? 'privacy';
  const uri = useMemo(
    () => legalDocumentUrlFor(locale, activeDocument),
    [locale, activeDocument],
  );
  const title =
    activeDocument === 'terms'
      ? t('legal.document.termsTitle')
      : t('legal.document.privacyTitle');

  useEffect(() => {
    if (visible && document) {
      setLoadFailed(false);
    }
  }, [visible, document]);

  const handleShouldStart = useCallback((request: { url: string }) => {
    return isAllowedLegalNavigationUrl(request.url);
  }, []);

  const handleClose = () => {
    setLoadFailed(false);
    onClose();
  };

  return (
    <OnboardingInfoModalShell
      visible={visible && document !== null}
      onClose={handleClose}
      footer={(close) => (
        <Button
          label={t('common.close')}
          variant="onboarding"
          style={styles.closeButton}
          labelStyle={styles.closeButtonLabel}
          onPress={close}
        />
      )}
    >
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.viewer}>
        {visible && document ? (
          <WebView
            key={`${uri}:${reloadToken}`}
            source={{ uri }}
            style={styles.webView}
            originWhitelist={['https://nordyan.app', 'https://www.nordyan.app']}
            setSupportMultipleWindows={false}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.statusOverlay} pointerEvents="none">
                <ActivityIndicator color={colors.onboardingAccent} size="large" />
              </View>
            )}
            onShouldStartLoadWithRequest={handleShouldStart}
            onError={() => setLoadFailed(true)}
            onHttpError={() => setLoadFailed(true)}
          />
        ) : null}
        {loadFailed ? (
          <View style={styles.statusOverlay}>
            <Text style={styles.errorText}>{t('legal.document.loadError')}</Text>
            <Button
              label={t('common.retry')}
              variant="onboarding"
              style={styles.retryButton}
              onPress={() => {
                setLoadFailed(false);
                setReloadToken((current) => current + 1);
              }}
            />
          </View>
        ) : null}
      </View>
    </OnboardingInfoModalShell>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.onboardingMeasurementHelpText,
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 12,
  },
  viewer: {
    flex: 1,
    minHeight: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.onboardingMeasurementHelpCardBackground,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
    backgroundColor: colors.onboardingMeasurementHelpBackground,
  },
  errorText: {
    color: colors.onboardingMeasurementHelpTextMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  retryButton: {
    width: '100%',
  },
  closeButton: {
    width: '100%',
    minHeight: onboardingLayout.buttonHeight,
    backgroundColor: colors.onboardingMeasurementHelpAccent,
  },
  closeButtonLabel: {
    color: colors.onboardingMeasurementHelpText,
    fontWeight: typography.fontWeight.semibold,
  },
});

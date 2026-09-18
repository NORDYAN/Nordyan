import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { t } from '@/lib/i18n';
import { colors, onboardingMeasurementHelpLayout } from '@/theme';
import { initialLifestyleLayout } from '@/theme/initial-lifestyle';

const SHEET_SLIDE_OFFSET = 28;

type OnboardingInfoModalShellProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  footer: (close: () => void) => ReactNode;
};

export function OnboardingInfoModalShell({
  visible,
  onClose,
  children,
  footer,
}: OnboardingInfoModalShellProps) {
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslateY = useRef(new Animated.Value(SHEET_SLIDE_OFFSET)).current;

  useEffect(() => {
    if (visible) {
      screenOpacity.setValue(0);
      screenTranslateY.setValue(SHEET_SLIDE_OFFSET);

      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, screenOpacity, screenTranslateY]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslateY, {
        toValue: SHEET_SLIDE_OFFSET,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <Animated.View
          style={[
            styles.screen,
            {
              opacity: screenOpacity,
              transform: [{ translateY: screenTranslateY }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.navigation}>
              <Pressable
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons
                  name="close"
                  size={initialLifestyleLayout.backIconSize}
                  color={colors.onboardingMeasurementHelpText}
                />
              </Pressable>
            </View>

            {children}

            <View style={styles.ctaContainer}>{footer(handleClose)}</View>
          </SafeAreaView>
        </Animated.View>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.onboardingMeasurementHelpBackground,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: onboardingMeasurementHelpLayout.horizontalPadding,
    paddingBottom: onboardingMeasurementHelpLayout.bottomPadding,
  },
  navigation: {
    paddingTop: onboardingMeasurementHelpLayout.navPaddingTop,
    paddingBottom: onboardingMeasurementHelpLayout.navPaddingBottom,
  },
  closeButton: {
    width: onboardingMeasurementHelpLayout.backTouchSize,
    height: onboardingMeasurementHelpLayout.backTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaContainer: {
    paddingTop: onboardingMeasurementHelpLayout.ctaPaddingTop,
    width: '100%',
  },
});

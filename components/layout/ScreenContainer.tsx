import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type ScreenContainerProps = ViewProps & {
  children: React.ReactNode;
  variant?: 'default' | 'dark' | 'home' | 'profile' | 'healthDataSources';
};

export function ScreenContainer({
  children,
  style,
  variant = 'default',
  ...props
}: ScreenContainerProps) {
  const isDark = variant === 'dark';
  const isHome = variant === 'home';
  const isProfile = variant === 'profile';
  const isHealthDataSources = variant === 'healthDataSources';

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        isHealthDataSources
          ? styles.safeAreaHealthDataSources
          : isProfile
            ? styles.safeAreaProfile
            : isHome
              ? styles.safeAreaHome
              : isDark
                ? styles.safeAreaDark
                : styles.safeAreaDefault,
      ]}
      edges={isHome || isProfile || isHealthDataSources ? ['top'] : undefined}
    >
      <View
        style={[
          styles.container,
          isHealthDataSources
            ? styles.containerHealthDataSources
            : isProfile
              ? styles.containerProfile
              : isHome
                ? styles.containerHome
                : isDark
                  ? styles.containerDark
                  : styles.containerDefault,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  safeAreaDefault: {
    backgroundColor: colors.background,
  },
  safeAreaDark: {
    backgroundColor: colors.onboardingBackground,
  },
  safeAreaHome: {
    backgroundColor: colors.homeBackground,
  },
  safeAreaProfile: {
    backgroundColor: colors.profileBackground,
  },
  safeAreaHealthDataSources: {
    backgroundColor: colors.profileHealthDataSourcesBackground,
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  containerDefault: {
    backgroundColor: colors.background,
  },
  containerDark: {
    backgroundColor: colors.onboardingBackground,
  },
  containerHome: {
    backgroundColor: colors.homeBackground,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 0,
  },
  containerProfile: {
    backgroundColor: colors.profileBackground,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  containerHealthDataSources: {
    backgroundColor: colors.profileHealthDataSourcesBackground,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
});

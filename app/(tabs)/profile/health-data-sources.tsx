import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HealthSourceCard } from '@/components/profile/HealthSourceCard';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { colors, profileHealthDataSourcesLayout, typography } from '@/theme';

function handleConnectPress(sourceName: string) {
  if (__DEV__) {
    console.warn(`[health-data-sources] ${sourceName} integration coming in next version`);
  }

  Alert.alert('Kommer i nästa version', 'Den här integrationen är inte tillgänglig ännu.');
}

export default function HealthDataSourcesScreen() {
  return (
    <ScreenContainer variant="healthDataSources" style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <Text style={styles.title}>Hälsodatakällor</Text>
          <Text style={styles.subtitle}>
            Koppla dina hälsodatakällor för att ge NORDYAN ett bättre underlag för personliga
            insikter.
          </Text>
        </View>

        <View style={styles.sourcesList}>
          <HealthSourceCard
            icon="heart-outline"
            title="Apple Health"
            description="Aktivitet, puls, sömn och annan hälsodata från Apple-enheter och anslutna appar."
            status="disconnected"
            actionLabel="Anslut"
            onActionPress={() => handleConnectPress('Apple Health')}
          />
          <HealthSourceCard
            icon="git-network-outline"
            title="Health Connect (Android)"
            description="Samla hälsodata från kompatibla appar och enheter på Android."
            status="disconnected"
            actionLabel="Anslut"
            onActionPress={() => handleConnectPress('Health Connect')}
          />
          <HealthSourceCard
            icon="watch-outline"
            title="Garmin Connect"
            description="Aktivitet, puls, sömn, träning och återhämtning från Garmin."
            status="comingSoon"
          />
        </View>

        <View style={styles.privacyCard}>
          <View style={styles.privacyIconBox}>
            <Ionicons
              name="shield-outline"
              size={profileHealthDataSourcesLayout.privacyIconSize}
              color={colors.profileHealthDataSourceAccent}
            />
          </View>
          <View style={styles.privacyTextBlock}>
            <Text style={styles.privacyTitle}>Så använder NORDYAN din data</Text>
            <Text style={styles.privacyBody}>
              Ansluten hälsodata används för att förbättra dina insikter, din utveckling och
              framtida coachrekommendationer.
            </Text>
          </View>
        </View>

        <Text style={styles.footerNote}>
          Du bestämmer vilka datakällor som är anslutna och kan när som helst koppla från dem.
        </Text>
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
    paddingHorizontal: profileHealthDataSourcesLayout.horizontalPadding,
    paddingTop: profileHealthDataSourcesLayout.scrollPaddingTop,
    paddingBottom: profileHealthDataSourcesLayout.scrollPaddingBottom,
  },
  navRow: {
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
    gap: profileHealthDataSourcesLayout.headerGap,
    width: '100%',
  },
  title: {
    color: colors.onboardingText,
    fontSize: profileHealthDataSourcesLayout.titleFontSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight:
      profileHealthDataSourcesLayout.titleFontSize * typography.lineHeight.tight,
  },
  subtitle: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.subtitleFontSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      profileHealthDataSourcesLayout.subtitleFontSize * typography.lineHeight.normal,
    width: '100%',
  },
  sourcesList: {
    gap: profileHealthDataSourcesLayout.sourcesListGap,
    width: '100%',
  },
  privacyCard: {
    flexDirection: 'row',
    gap: profileHealthDataSourcesLayout.privacyCardGap,
    backgroundColor: colors.profileHealthDataSourceCardBackground,
    borderWidth: 1,
    borderColor: colors.profileHealthDataSourceCardBorder,
    borderRadius: profileHealthDataSourcesLayout.privacyCardRadius,
    padding: profileHealthDataSourcesLayout.privacyCardPadding,
    width: '100%',
  },
  privacyIconBox: {
    width: profileHealthDataSourcesLayout.privacyIconBoxSize,
    height: profileHealthDataSourcesLayout.privacyIconBoxSize,
    borderRadius: profileHealthDataSourcesLayout.privacyIconBoxRadius,
    backgroundColor: colors.profileHealthDataSourceIconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTextBlock: {
    flex: 1,
    gap: profileHealthDataSourcesLayout.sourceCardTextGap,
    minWidth: 0,
  },
  privacyTitle: {
    color: colors.onboardingText,
    fontSize: profileHealthDataSourcesLayout.privacyTitleSize,
    fontWeight: typography.fontWeight.semibold,
  },
  privacyBody: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.privacyBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      profileHealthDataSourcesLayout.privacyBodySize * typography.lineHeight.relaxed,
  },
  footerNote: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.footerNoteSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      profileHealthDataSourcesLayout.footerNoteSize * typography.lineHeight.relaxed,
    textAlign: 'center',
    width: '100%',
  },
});

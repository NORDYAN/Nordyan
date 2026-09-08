import { StyleSheet, View } from 'react-native';

import { HomeIndicator } from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { INITIAL_LIFESTYLE_COPY } from '@/lib/presentation/initial-lifestyle';
import { typography } from '@/theme';
import {
  initialLifestyleColors,
  initialLifestyleLayout,
  initialLifestyleTypography,
} from '@/theme/initial-lifestyle';

type InitialLifestyleIntroProps = {
  saving: boolean;
  onStart: () => void;
};

export function InitialLifestyleIntro({ saving, onStart }: InitialLifestyleIntroProps) {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={styles.headline}>
          <Text style={styles.overline} maxFontSizeMultiplier={1.1}>
            {INITIAL_LIFESTYLE_COPY.introOverline}
          </Text>
          <Text style={styles.title} maxFontSizeMultiplier={1.1}>
            {INITIAL_LIFESTYLE_COPY.introTitle}
          </Text>
        </View>
        <View style={styles.bodyGroup}>
          <Text style={styles.body} maxFontSizeMultiplier={1.1}>
            {INITIAL_LIFESTYLE_COPY.introBody}
          </Text>
          <Text style={styles.hint} maxFontSizeMultiplier={1.1}>
            {INITIAL_LIFESTYLE_COPY.introTimeHint}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.actions}>
          <Button
            label={INITIAL_LIFESTYLE_COPY.introStartCta}
            variant="onboarding"
            disabled={saving}
            style={styles.button}
            onPress={onStart}
          />
        </View>
        <HomeIndicator />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: initialLifestyleLayout.horizontalPadding,
    gap: initialLifestyleLayout.introSectionGap,
  },
  headline: {
    gap: initialLifestyleLayout.introHeadlineGap,
  },
  overline: {
    color: initialLifestyleColors.primary,
    fontSize: initialLifestyleTypography.overlineSize,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  title: {
    color: initialLifestyleColors.title,
    fontSize: initialLifestyleTypography.introTitleSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: initialLifestyleTypography.introTitleLineHeight,
    includeFontPadding: false,
  },
  bodyGroup: {
    width: '100%',
    gap: initialLifestyleLayout.introHeadlineGap,
  },
  body: {
    color: initialLifestyleColors.body,
    fontSize: initialLifestyleTypography.introBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: initialLifestyleTypography.introBodyLineHeight,
    includeFontPadding: false,
  },
  hint: {
    color: initialLifestyleColors.muted,
    fontSize: initialLifestyleTypography.timeHintSize,
    fontWeight: typography.fontWeight.regular,
    includeFontPadding: false,
  },
  footer: {
    width: '100%',
    gap: 20,
    paddingHorizontal: initialLifestyleLayout.horizontalPadding,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: initialLifestyleLayout.introFooterGap,
  },
  button: {
    width: '100%',
  },
});

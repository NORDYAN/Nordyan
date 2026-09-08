import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { HomeSectionHeading } from '@/components/home/HomeSectionHeading';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { HomeDailyFocusView } from '@/lib/presentation/home/home-daily-focus.presentation';
import { colors, homeLayout, typography } from '@/theme';

type DailyFocusCardProps = {
  view: HomeDailyFocusView;
  onComplete: () => void;
  onUndo: () => void;
  onSwap: () => void;
};

export function DailyFocusCard({ view, onComplete, onUndo, onSwap }: DailyFocusCardProps) {
  useI18n();
  const [whyOpen, setWhyOpen] = useState(false);
  const actionKey = view.kind === 'ready' ? `${view.title}:${view.body}` : view.kind;

  useEffect(() => {
    setWhyOpen(false);
  }, [actionKey]);

  return (
    <View style={styles.section}>
      <HomeSectionHeading title={t('home.dailyFocus.heading')} />
      <Card
        padding={homeLayout.coachCardPadding}
        borderRadius={homeLayout.coachCardRadius}
        style={styles.card}
      >
        {view.kind === 'loading' ? (
          <Text style={styles.loading}>…</Text>
        ) : null}

        {view.kind === 'unavailable' ? (
          <Text style={styles.quiet}>{t('home.dailyFocus.unavailable')}</Text>
        ) : null}

        {view.kind === 'unknown' ? (
          <>
            <Text style={styles.quiet}>{t('home.dailyFocus.unknown')}</Text>
            {view.mutationError ? (
              <Text style={styles.error}>{t('home.dailyFocus.mutationError')}</Text>
            ) : null}
          </>
        ) : null}

        {view.kind === 'ready' ? (
          <>
            <Text style={styles.title}>{view.title}</Text>
            <Text style={styles.body}>{view.body}</Text>

            {view.completed ? (
              <>
                <Text
                  style={styles.completed}
                  accessibilityRole="text"
                  accessibilityLabel={t('home.dailyFocus.completed')}
                >
                  ✓ {t('home.dailyFocus.completed')}
                </Text>
                <Button
                  label={t('home.dailyFocus.undo')}
                  variant="secondary"
                  disabled={view.mutating}
                  accessibilityLabel={t('home.dailyFocus.undo')}
                  onPress={onUndo}
                  style={styles.primaryAction}
                />
              </>
            ) : (
              <Button
                label={t('home.dailyFocus.markComplete')}
                variant="primary"
                disabled={view.mutating}
                accessibilityLabel={t('home.dailyFocus.markComplete')}
                onPress={onComplete}
                style={styles.primaryAction}
                labelStyle={styles.primaryActionLabel}
              />
            )}

            {view.whyText ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: whyOpen }}
                accessibilityLabel={t('home.dailyFocus.why')}
                onPress={() => setWhyOpen((open) => !open)}
                style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryLabel}>{t('home.dailyFocus.why')}</Text>
              </Pressable>
            ) : null}

            {whyOpen && view.whyText ? <Text style={styles.why}>{view.whyText}</Text> : null}

            {view.canSwap ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('home.dailyFocus.swap')}
                disabled={view.mutating}
                onPress={onSwap}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.pressed,
                  view.mutating && styles.disabled,
                ]}
              >
                <Text style={styles.secondaryLabel}>{t('home.dailyFocus.swap')}</Text>
              </Pressable>
            ) : null}

            {view.mutationError ? (
              <Text style={styles.error}>{t('home.dailyFocus.mutationError')}</Text>
            ) : null}
          </>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  card: {
    gap: 12,
  },
  loading: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.md,
  },
  quiet: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  title: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  body: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  completed: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  primaryAction: {
    minHeight: 44,
    borderRadius: 22,
    height: 44,
    paddingVertical: 0,
    backgroundColor: colors.homeAccentSlate,
  },
  primaryActionLabel: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  secondaryAction: {
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: colors.homeAccentSlate,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  why: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  error: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});

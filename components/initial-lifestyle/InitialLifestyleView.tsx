import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InitialLifestyleIntro } from '@/components/initial-lifestyle/InitialLifestyleIntro';
import { InitialLifestyleQuestion } from '@/components/initial-lifestyle/InitialLifestyleQuestion';
import { OnboardingMountainBackground } from '@/components/onboarding';
import type { UseOnboardingInitialLifestyleResult } from '@/lib/hooks/initial-lifestyle';
import { getInitialLifestyleQuestion } from '@/lib/presentation/initial-lifestyle';
import { colors } from '@/theme';
import { initialLifestyleColors } from '@/theme/initial-lifestyle';

type InitialLifestyleViewProps = {
  flow: UseOnboardingInitialLifestyleResult;
};

export function InitialLifestyleView({ flow }: InitialLifestyleViewProps) {
  const question =
    flow.step.kind === 'question' ? getInitialLifestyleQuestion(flow.step.index) : null;
  const isIntro = flow.step.kind === 'intro';

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      {isIntro ? (
        <OnboardingMountainBackground
          overlayColor={initialLifestyleColors.introOverlay}
          edgeFadeEnabled={false}
        />
      ) : null}
      <SafeAreaView
        style={[styles.safeArea, !isIntro && styles.questionSafeArea]}
        edges={['top', 'bottom']}
      >
        {isIntro ? (
          <InitialLifestyleIntro
            saving={flow.saving}
            onStart={flow.start}
            onSkip={() => void flow.skip()}
          />
        ) : null}

        {flow.step.kind === 'question' && question ? (
          <InitialLifestyleQuestion
            question={question}
            index={flow.step.index}
            answers={flow.answers}
            canAdvance={flow.canAdvance}
            canSubmit={flow.canSubmit}
            saving={flow.saving}
            saveError={flow.saveError}
            onBack={flow.goBack}
            onSelect={(value) => flow.selectAnswer(question.field, value)}
            onNext={flow.goNext}
            onSubmit={() => void flow.complete()}
          />
        ) : null}
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
  questionSafeArea: {
    backgroundColor: initialLifestyleColors.background,
  },
});

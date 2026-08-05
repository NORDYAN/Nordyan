import { OnboardingPersonalizationIllustration } from './OnboardingPersonalizationIllustration';

type OnboardingWaveformIllustrationProps = {
  width?: number | string;
  height?: number | string;
};

/** Drop-in replacement: personalization constellation illustration (replaces waveform). */
export function OnboardingWaveformIllustration(props: OnboardingWaveformIllustrationProps) {
  return <OnboardingPersonalizationIllustration {...props} />;
}

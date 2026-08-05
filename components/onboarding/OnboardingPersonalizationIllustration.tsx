import Svg, { Circle, Line, Path } from 'react-native-svg';

import { colors } from '@/theme';

type OnboardingPersonalizationIllustrationProps = {
  width?: number | string;
  height?: number | string;
};

const ACCENT = colors.onboardingAccent;

/** Network nodes placed around the silhouette — personal profile / insights constellation. */
const DATA_POINTS = [
  { cx: 42, cy: 34 },
  { cx: 198, cy: 36 },
  { cx: 214, cy: 88 },
  { cx: 188, cy: 142 },
  { cx: 120, cy: 158 },
  { cx: 52, cy: 142 },
  { cx: 26, cy: 88 },
  { cx: 48, cy: 52 },
] as const;

const PERSON_ANCHOR = { x: 120, y: 96 };

export function OnboardingPersonalizationIllustration({
  width = '100%',
  height = '100%',
}: OnboardingPersonalizationIllustrationProps) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 240 180"
      fill="none"
      accessibilityLabel="Personalized health insights illustration"
    >
      {DATA_POINTS.map((point, index) => (
        <Line
          key={`link-${index}`}
          x1={PERSON_ANCHOR.x}
          y1={PERSON_ANCHOR.y}
          x2={point.cx}
          y2={point.cy}
          stroke={ACCENT}
          strokeWidth={1}
          opacity={0.55}
        />
      ))}

      <Line
        x1={DATA_POINTS[0].cx}
        y1={DATA_POINTS[0].cy}
        x2={DATA_POINTS[7].cx}
        y2={DATA_POINTS[7].cy}
        stroke={ACCENT}
        strokeWidth={1}
        opacity={0.35}
      />
      <Line
        x1={DATA_POINTS[1].cx}
        y1={DATA_POINTS[1].cy}
        x2={DATA_POINTS[2].cx}
        y2={DATA_POINTS[2].cy}
        stroke={ACCENT}
        strokeWidth={1}
        opacity={0.35}
      />
      <Line
        x1={DATA_POINTS[4].cx}
        y1={DATA_POINTS[4].cy}
        x2={DATA_POINTS[5].cx}
        y2={DATA_POINTS[5].cy}
        stroke={ACCENT}
        strokeWidth={1}
        opacity={0.35}
      />

      <Circle cx={PERSON_ANCHOR.x} cy={62} r={11} stroke={ACCENT} strokeWidth={1.5} />
      <Path
        d="M96 78 C104 74 136 74 144 78 L136 118 C132 122 108 122 104 118 Z"
        stroke={ACCENT}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M104 118 L96 138 M136 118 L144 138"
        stroke={ACCENT}
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {DATA_POINTS.map((point, index) => (
        <Circle key={`node-${index}`} cx={point.cx} cy={point.cy} r={3.5} fill={ACCENT} />
      ))}
    </Svg>
  );
}

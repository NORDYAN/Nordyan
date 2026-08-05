export const NORDYAN_COACH_PROMPT_VERSION_V1 = 'nordyan-coach-v1' as const;
export const NORDYAN_COACH_PROMPT_VERSION_V2 = 'nordyan-coach-v2' as const;

export type NordyanCoachPromptVersion =
  | typeof NORDYAN_COACH_PROMPT_VERSION_V1
  | typeof NORDYAN_COACH_PROMPT_VERSION_V2;

export const NORDYAN_COACH_PROMPT_VERSIONS = [
  NORDYAN_COACH_PROMPT_VERSION_V1,
  NORDYAN_COACH_PROMPT_VERSION_V2,
] as const;

export const DEFAULT_NORDYAN_COACH_PROMPT_VERSION = NORDYAN_COACH_PROMPT_VERSION_V2;

export function isNordyanCoachPromptVersion(value: unknown): value is NordyanCoachPromptVersion {
  return (
    value === NORDYAN_COACH_PROMPT_VERSION_V1 || value === NORDYAN_COACH_PROMPT_VERSION_V2
  );
}

export function resolveCoachPromptVersion(value: unknown): NordyanCoachPromptVersion {
  if (isNordyanCoachPromptVersion(value)) {
    return value;
  }

  return DEFAULT_NORDYAN_COACH_PROMPT_VERSION;
}

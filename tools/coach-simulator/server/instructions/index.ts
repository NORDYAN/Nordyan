import {
  NORDYAN_COACH_PROMPT_VERSION_V1,
  NORDYAN_COACH_PROMPT_VERSION_V2,
  type NordyanCoachPromptVersion,
} from '../../shared/coachPromptVersions';
import {
  COACH_MESSAGE_JSON_SCHEMA,
  NORDYAN_COACH_SYSTEM_INSTRUCTIONS,
} from './nordyan-coach-v1';
import {
  COACH_MESSAGE_JSON_SCHEMA_V2,
  NORDYAN_COACH_V2_SYSTEM_INSTRUCTIONS,
} from './nordyan-coach-v2';

export type CoachInstructionBundle = {
  version: NordyanCoachPromptVersion;
  systemInstructions: string;
  jsonSchema: typeof COACH_MESSAGE_JSON_SCHEMA;
};

const INSTRUCTIONS: Record<NordyanCoachPromptVersion, CoachInstructionBundle> = {
  [NORDYAN_COACH_PROMPT_VERSION_V1]: {
    version: NORDYAN_COACH_PROMPT_VERSION_V1,
    systemInstructions: NORDYAN_COACH_SYSTEM_INSTRUCTIONS,
    jsonSchema: COACH_MESSAGE_JSON_SCHEMA,
  },
  [NORDYAN_COACH_PROMPT_VERSION_V2]: {
    version: NORDYAN_COACH_PROMPT_VERSION_V2,
    systemInstructions: NORDYAN_COACH_V2_SYSTEM_INSTRUCTIONS,
    jsonSchema: COACH_MESSAGE_JSON_SCHEMA_V2,
  },
};

export function getCoachInstructionBundle(
  version: NordyanCoachPromptVersion,
): CoachInstructionBundle {
  return INSTRUCTIONS[version];
}

export function listCoachInstructionVersions(): NordyanCoachPromptVersion[] {
  return [NORDYAN_COACH_PROMPT_VERSION_V1, NORDYAN_COACH_PROMPT_VERSION_V2];
}

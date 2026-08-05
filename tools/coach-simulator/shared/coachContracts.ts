export const COACH_PROMPT_PAYLOAD_VERSION = 'coach-simulator-v2' as const;

export {
  DEFAULT_NORDYAN_COACH_PROMPT_VERSION,
  NORDYAN_COACH_PROMPT_VERSION_V1,
  NORDYAN_COACH_PROMPT_VERSION_V2,
  NORDYAN_COACH_PROMPT_VERSIONS,
  isNordyanCoachPromptVersion,
  resolveCoachPromptVersion,
  type NordyanCoachPromptVersion,
} from './coachPromptVersions';

/** @deprecated Use NORDYAN_COACH_PROMPT_VERSION_V1 or version-aware APIs. */
export const NORDYAN_COACH_PROMPT_VERSION = 'nordyan-coach-v1' as const;

export const FORBIDDEN_REQUEST_FIELDS = [
  'name',
  'email',
  'userId',
  'user_id',
  'birthDate',
  'birth_date',
  'measurementHistory',
  'measurement_history',
  'healthRecords',
  'health_records',
  'supabaseId',
  'supabase_id',
  'deviceId',
  'device_id',
] as const;

export type CoachPromptPayload = {
  version: typeof COACH_PROMPT_PAYLOAD_VERSION;
  locale: 'sv-SE';
  generatedAt: string;
  decision: {
    topStrength: string;
    topOpportunity: string;
    coachGoal: string;
    recommendedAction: string;
    confidence: number;
    insufficientData: boolean;
    silenceEligible: boolean;
  };
  supportingFacts: string[];
  instructions: {
    role: string;
    tone: string;
    maxWords: number;
  };
};

export type CoachMessageTone = 'encouraging' | 'supportive' | 'neutral';

export type CoachMessage = {
  headline: string;
  body: string;
  recommendedAction: string | null;
  tone: CoachMessageTone;
  promptVersion: string;
  isQuiet?: boolean;
};

export type CoachLanguageProvider = 'openai' | 'mock' | 'fallback';

export type CoachGenerateMeta = {
  provider: CoachLanguageProvider;
  latencyMs: number;
  promptVersion: string;
  validationStatus: 'valid' | 'fallback';
  usedFallback: boolean;
  requestId: string;
};

export type CoachGenerateResponse = {
  message: CoachMessage;
  meta: CoachGenerateMeta;
};

export type CoachGenerateRequest = CoachPromptPayload & {
  coachPromptVersion?: import('./coachPromptVersions').NordyanCoachPromptVersion;
};

export type CoachServerStatus = {
  openaiConfigured: boolean;
  promptVersion: string;
  availablePromptVersions: import('./coachPromptVersions').NordyanCoachPromptVersion[];
  defaultModel: string;
};

export function isQuietDecision(payload: CoachPromptPayload): boolean {
  return payload.decision.insufficientData || payload.decision.coachGoal === 'Tiga';
}

export function formatCoachMessageText(message: CoachMessage): string {
  if (message.isQuiet) {
    return message.body || message.headline;
  }

  return [message.headline, message.body].filter(Boolean).join('\n\n');
}

import type {
  CoachGenerateMeta,
  CoachGenerateResponse,
  CoachMessage,
  CoachPromptPayload,
} from '../shared/coachContracts';

export type {
  CoachGenerateMeta,
  CoachGenerateResponse,
  CoachLanguageProvider,
  CoachMessage,
  CoachMessageTone,
  CoachPromptPayload,
  CoachServerStatus,
} from '../shared/coachContracts';

export {
  COACH_PROMPT_PAYLOAD_VERSION,
  NORDYAN_COACH_PROMPT_VERSION,
  formatCoachMessageText,
  isQuietDecision,
} from '../shared/coachContracts';

export type CoachTrend = 'improving' | 'declining' | 'stable';
export type ActivityTrend = 'up' | 'down' | 'stable';
export type DataCompleteness = 'complete' | 'insufficient';

export type CoachSimulatorTestData = {
  healthScore: number;
  healthScoreDelta: number;
  trend: CoachTrend;
  weightKg: number;
  weightDeltaKg: number;
  waistCm: number;
  waistDeltaCm: number;
  neckCm: number;
  activity: string;
  activityTrend: ActivityTrend;
  sleep: string;
  daysSinceLastMeasurement: number;
  dataCompleteness: DataCompleteness;
};

export type CoachDecisionResult = {
  topStrength: string;
  topOpportunity: string;
  coachGoal: string;
  recommendedAction: string;
  confidence: number;
  supportingFacts: string[];
  insufficientData: boolean;
  silenceEligible: boolean;
};

export type CoachLanguageProviderChoice = 'mock' | 'openai';

export interface CoachLanguageService {
  generate(
    payload: CoachPromptPayload,
    coachPromptVersion?: import('../shared/coachPromptVersions').NordyanCoachPromptVersion,
  ): Promise<CoachGenerateResponse>;
}

export type CoachSimulatorPipelineOptions = {
  provider?: CoachLanguageProviderChoice;
  coachPromptVersion?: import('../shared/coachPromptVersions').NordyanCoachPromptVersion;
  existingDecision?: CoachDecisionResult;
  existingPrompt?: CoachPromptPayload;
};

export type CoachSimulatorRunResult = {
  decision: CoachDecisionResult;
  prompt: CoachPromptPayload;
  coachMessage: CoachMessage;
  meta: CoachGenerateMeta;
};

import {
  allAutomatedCriteriaPass,
  scoreCoachMessage,
  type ScoringCriterionResult,
} from '../shared/coachLanguageScoring';
import {
  detectNearDuplicateVariants,
  factsPreservedAcrossVariants,
  tonesAreCompatible,
  type RepetitionFlag,
} from '../shared/coachRepetitionCheck';
import {
  isQuietDecision,
  type CoachGenerateResponse,
  type CoachPromptPayload,
} from '../shared/coachContracts';
import type { NordyanCoachPromptVersion } from '../shared/coachPromptVersions';
import { COACH_SCENARIOS } from './coachScenarioLibrary';
import { runCoachDecisionEngine } from './coachDecisionEngine';
import { buildCoachPromptPayload } from './coachPromptBuilder';
import type { CoachDecisionResult } from './coachSimulator.types';
import type { CoachLanguageProviderChoice } from './coachSimulator.types';
import { mockCoachLanguageService, serverCoachLanguageService } from './coachLanguageService';

export const BATCH_VARIANT_COUNT = 3;

export type BatchVariantEvaluation = {
  variantIndex: number;
  response: CoachGenerateResponse;
  automatedScores: ScoringCriterionResult[];
  automatedPass: boolean;
};

export type BatchScenarioEvaluation = {
  scenarioId: string;
  scenarioLabel: string;
  decision: CoachDecisionResult;
  prompt: CoachPromptPayload;
  isQuiet: boolean;
  variants: BatchVariantEvaluation[];
  repetitionFlags: RepetitionFlag[];
  tonesCompatible: boolean;
  factsPreserved: boolean;
};

export type BatchEvaluationResult = {
  batchRunId: string;
  exportedAt: string;
  coachPromptVersion: NordyanCoachPromptVersion;
  provider: CoachLanguageProviderChoice;
  scenarios: BatchScenarioEvaluation[];
};

function createBatchRunId(): string {
  return `batch_${Date.now().toString(36)}`;
}

export async function runBatchLanguageEvaluation(options: {
  provider: CoachLanguageProviderChoice;
  coachPromptVersion: NordyanCoachPromptVersion;
}): Promise<BatchEvaluationResult> {
  const languageService =
    options.provider === 'openai' ? serverCoachLanguageService : mockCoachLanguageService;

  const scenarios: BatchScenarioEvaluation[] = [];

  for (const scenario of COACH_SCENARIOS) {
    const decision = runCoachDecisionEngine(scenario.data);
    const prompt = buildCoachPromptPayload(decision);
    const isQuiet = isQuietDecision(prompt);
    const variantCount = isQuiet ? 1 : BATCH_VARIANT_COUNT;
    const variants: BatchVariantEvaluation[] = [];

    for (let variantIndex = 0; variantIndex < variantCount; variantIndex += 1) {
      const response = await languageService.generate(prompt, options.coachPromptVersion);
      const automatedScores = scoreCoachMessage(response.message, prompt);

      variants.push({
        variantIndex,
        response,
        automatedScores,
        automatedPass: allAutomatedCriteriaPass(automatedScores),
      });
    }

    const messages = variants.map((variant) => variant.response.message);
    const expectedAction =
      decision.recommendedAction === 'Ingen rekommendation' ? null : decision.recommendedAction;

    scenarios.push({
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      decision,
      prompt,
      isQuiet,
      variants,
      repetitionFlags: isQuiet ? [] : detectNearDuplicateVariants(messages),
      tonesCompatible: tonesAreCompatible(messages),
      factsPreserved: factsPreservedAcrossVariants(messages, expectedAction),
    });
  }

  return {
    batchRunId: createBatchRunId(),
    exportedAt: new Date().toISOString(),
    coachPromptVersion: options.coachPromptVersion,
    provider: options.provider,
    scenarios,
  };
}

export function allScenariosEvaluated(result: BatchEvaluationResult): boolean {
  return result.scenarios.length === COACH_SCENARIOS.length;
}

export function allVariantsShareDecision(result: BatchEvaluationResult): boolean {
  return result.scenarios.every((scenario) =>
    scenario.variants.every(
      (variant) =>
        variant.response.message.recommendedAction ===
        (scenario.decision.recommendedAction === 'Ingen rekommendation'
          ? null
          : scenario.decision.recommendedAction),
    ),
  );
}

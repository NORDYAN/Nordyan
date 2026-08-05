import { DEFAULT_NORDYAN_COACH_PROMPT_VERSION } from '../shared/coachPromptVersions';
import type {
  CoachSimulatorPipelineOptions,
  CoachSimulatorRunResult,
  CoachSimulatorTestData,
} from './coachSimulator.types';
import { mockCoachLanguageService, serverCoachLanguageService } from './coachLanguageService';
import { DEFAULT_COACH_SCENARIO } from './coachScenarioLibrary';
import { runCoachDecisionEngine } from './coachDecisionEngine';
import { buildCoachPromptPayload } from './coachPromptBuilder';

export const DEFAULT_COACH_SIMULATOR_TEST_DATA: CoachSimulatorTestData = DEFAULT_COACH_SCENARIO.data;

export async function runCoachSimulatorPipeline(
  testData: CoachSimulatorTestData,
  options: CoachSimulatorPipelineOptions = {},
): Promise<CoachSimulatorRunResult> {
  const decision = options.existingDecision ?? runCoachDecisionEngine(testData);
  const prompt = options.existingPrompt ?? buildCoachPromptPayload(decision);

  const languageService =
    options.provider === 'openai' ? serverCoachLanguageService : mockCoachLanguageService;

  const { message: coachMessage, meta } = await languageService.generate(
    prompt,
    options.coachPromptVersion ?? DEFAULT_NORDYAN_COACH_PROMPT_VERSION,
  );

  return {
    decision,
    prompt,
    coachMessage,
    meta,
  };
}

import {
  type CoachPromptPayload,
  type NordyanCoachPromptVersion,
} from '../../../shared/coach-language';
import { getCoachInstructionBundle } from './instructions';

export type OpenAiCoachClient = {
  responses: {
    create: (params: Record<string, unknown>) => Promise<{
      output_text?: string;
      status?: string;
      incomplete_details?: { reason?: string } | null;
      usage?: {
        output_tokens?: number;
        output_tokens_details?: { reasoning_tokens?: number };
      };
      output?: Array<{
        type?: string;
        content?: Array<{ type?: string; text?: string }>;
      }>;
    }>;
  };
};

export class OpenAiCoachLanguageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAiCoachLanguageError';
  }
}

function buildUserPrompt(payload: CoachPromptPayload, coachPromptVersion: NordyanCoachPromptVersion): string {
  return JSON.stringify(
    {
      decision: payload.decision,
      supportingFacts: payload.supportingFacts,
      instructions: payload.instructions,
      outputContract: {
        promptVersion: coachPromptVersion,
        recommendedAction:
          payload.decision.recommendedAction === 'Ingen rekommendation'
            ? null
            : payload.decision.recommendedAction,
      },
    },
    null,
    2,
  );
}

export async function generateOpenAiCoachMessage(
  payload: CoachPromptPayload,
  coachPromptVersion: NordyanCoachPromptVersion,
  config: { openaiApiKey?: string; openaiCoachModel: string; openaiTimeoutMs: number },
  client?: OpenAiCoachClient,
): Promise<string> {
  if (!config.openaiApiKey) {
    throw new OpenAiCoachLanguageError('OPENAI_API_KEY is not configured.');
  }

  const instructionBundle = getCoachInstructionBundle(coachPromptVersion);
  const OpenAI = (await import('openai')).default;
  const openai =
    client ??
    new OpenAI({
      apiKey: config.openaiApiKey,
      timeout: config.openaiTimeoutMs,
    });

  const response = await openai.responses.create({
    model: config.openaiCoachModel,
    store: false,
    input: [
      {
        role: 'system',
        content: instructionBundle.systemInstructions,
      },
      {
        role: 'user',
        content: buildUserPrompt(payload, coachPromptVersion),
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'coach_message',
        strict: true,
        schema: instructionBundle.jsonSchema,
      },
    },
  });

  const outputText = response.output_text;
  if (!outputText) {
    throw new OpenAiCoachLanguageError('OpenAI response did not include output_text.');
  }

  return outputText;
}

export { buildUserPrompt };

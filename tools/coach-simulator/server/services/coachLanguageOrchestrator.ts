import {
  type CoachGenerateResponse,
  type CoachPromptPayload,
  isQuietDecision,
  type NordyanCoachPromptVersion,
} from '../../shared/coachContracts';
import type { CoachServerConfig } from '../config';
import { createRequestId, logCoachRequest } from '../logger';
import {
  generateFallbackCoachMessage,
  generateQuietCoachMessage,
} from './fallbackCoachMessage';
import {
  generateOpenAiCoachMessage,
  type OpenAiCoachClient,
} from './openaiCoachLanguageService';
import {
  parseCoachMessageJson,
  validateCoachMessageContent,
} from '../validation/contentValidation';

export type CoachLanguageOrchestratorOptions = {
  config: CoachServerConfig;
  coachPromptVersion: NordyanCoachPromptVersion;
  openAiClient?: OpenAiCoachClient;
  forceOpenAi?: boolean;
};

function buildMeta(
  requestId: string,
  coachPromptVersion: NordyanCoachPromptVersion,
  provider: CoachGenerateResponse['meta']['provider'],
  latencyMs: number,
  validationStatus: CoachGenerateResponse['meta']['validationStatus'],
  usedFallback: boolean,
): CoachGenerateResponse['meta'] {
  return {
    requestId,
    provider,
    latencyMs,
    promptVersion: coachPromptVersion,
    validationStatus,
    usedFallback,
  };
}

export async function generateCoachLanguage(
  payload: CoachPromptPayload,
  options: CoachLanguageOrchestratorOptions,
): Promise<CoachGenerateResponse> {
  const started = Date.now();
  const requestId = createRequestId();
  const { coachPromptVersion } = options;

  if (isQuietDecision(payload)) {
    const message = generateQuietCoachMessage(coachPromptVersion);
    const latencyMs = Date.now() - started;

    logCoachRequest({
      requestId,
      promptVersion: coachPromptVersion,
      provider: 'fallback',
      latencyMs,
      category: 'quiet',
    });

    return {
      message,
      meta: buildMeta(requestId, coachPromptVersion, 'fallback', latencyMs, 'valid', false),
    };
  }

  const shouldUseOpenAi =
    options.forceOpenAi !== false && Boolean(options.config.openaiApiKey);

  if (!shouldUseOpenAi) {
    const message = generateFallbackCoachMessage(payload, coachPromptVersion);
    const latencyMs = Date.now() - started;

    logCoachRequest({
      requestId,
      promptVersion: coachPromptVersion,
      provider: 'fallback',
      latencyMs,
      category: 'fallback',
    });

    return {
      message,
      meta: buildMeta(requestId, coachPromptVersion, 'fallback', latencyMs, 'valid', true),
    };
  }

  try {
    const rawOutput = await generateOpenAiCoachMessage(
      payload,
      coachPromptVersion,
      options.config,
      options.openAiClient,
    );
    const parsed = parseCoachMessageJson(rawOutput);

    if (!parsed) {
      throw new Error('Invalid OpenAI JSON output');
    }

    const validation = validateCoachMessageContent(parsed, payload, coachPromptVersion);
    const latencyMs = Date.now() - started;

    if (!validation.valid) {
      const fallbackMessage = generateFallbackCoachMessage(payload, coachPromptVersion);

      logCoachRequest({
        requestId,
        promptVersion: coachPromptVersion,
        provider: 'fallback',
        latencyMs,
        category: 'validation_error',
      });

      return {
        message: fallbackMessage,
        meta: buildMeta(requestId, coachPromptVersion, 'fallback', latencyMs, 'fallback', true),
      };
    }

    logCoachRequest({
      requestId,
      promptVersion: coachPromptVersion,
      provider: 'openai',
      latencyMs,
      category: 'success',
    });

    return {
      message: validation.message,
      meta: buildMeta(requestId, coachPromptVersion, 'openai', latencyMs, 'valid', false),
    };
  } catch (error) {
    const latencyMs = Date.now() - started;
    const category =
      error instanceof Error && error.message.toLowerCase().includes('timeout')
        ? 'timeout'
        : 'openai_error';

    logCoachRequest({
      requestId,
      promptVersion: coachPromptVersion,
      provider: 'fallback',
      latencyMs,
      category,
    });

    return {
      message: generateFallbackCoachMessage(payload, coachPromptVersion),
      meta: buildMeta(requestId, coachPromptVersion, 'fallback', latencyMs, 'fallback', true),
    };
  }
}

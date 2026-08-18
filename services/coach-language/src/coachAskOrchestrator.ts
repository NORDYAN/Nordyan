import {
  getCoachAskPromptVersion,
  type CoachAskRequest,
  type CoachAskResponse,
} from '../../../shared/coach-language';
import type { CoachServerConfig } from './config';
import { createRequestId, logCoachRequest } from './logger';
import {
  CoachAskIncompleteError,
  generateOpenAiCoachAskAnswer,
} from './openaiCoachAskService';
import type { OpenAiCoachClient } from './openaiCoachLanguageService';

export type CoachAskOrchestratorOptions = {
  config: CoachServerConfig;
  openAiClient?: OpenAiCoachClient;
  forceOpenAi?: boolean;
};

export async function generateCoachAskAnswer(
  request: CoachAskRequest,
  options: CoachAskOrchestratorOptions,
): Promise<CoachAskResponse> {
  const started = Date.now();
  const requestId = createRequestId();
  const promptVersion = getCoachAskPromptVersion(request.version);

  const shouldUseOpenAi =
    options.forceOpenAi !== false && Boolean(options.config.openaiApiKey);

  if (!shouldUseOpenAi) {
    const latencyMs = Date.now() - started;
    logCoachRequest({
      requestId,
      promptVersion,
      provider: 'fallback',
      latencyMs,
      category: 'fallback',
      usedFallback: true,
      endpoint: 'ask',
      locale: request.locale,
      requestVersion: request.version,
      model: options.config.openaiCoachModel,
      responseSource: 'unavailable',
    });
    return {
      answer: '',
      meta: {
        source: 'unavailable',
        requestId,
        latencyMs,
        promptVersion,
      },
    };
  }

  try {
    const generated = await generateOpenAiCoachAskAnswer(request, options.config, options.openAiClient);
    const latencyMs = Date.now() - started;
    logCoachRequest({
      requestId,
      promptVersion,
      provider: 'openai',
      latencyMs,
      category: 'success',
      usedFallback: false,
      endpoint: 'ask',
      locale: request.locale,
      requestVersion: request.version,
      model: options.config.openaiCoachModel,
      responseSource: 'ai',
      openaiStatus: generated.diagnostics.openaiStatus,
      incompleteReason: generated.diagnostics.incompleteReason,
      completenessReason: generated.diagnostics.completenessReason,
      outputTokenCount: generated.diagnostics.outputTokenCount,
      answerCharCount: generated.diagnostics.answerCharCount,
      retryAttempt: generated.diagnostics.retryAttempt,
    });
    return {
      answer: generated.answer,
      meta: {
        source: 'ai',
        requestId,
        latencyMs,
        promptVersion,
      },
    };
  } catch (error) {
    const latencyMs = Date.now() - started;
    const diagnostics = error instanceof CoachAskIncompleteError ? error.diagnostics : undefined;
    logCoachRequest({
      requestId,
      promptVersion,
      provider: 'fallback',
      latencyMs,
      category: 'openai_error',
      usedFallback: true,
      endpoint: 'ask',
      locale: request.locale,
      requestVersion: request.version,
      model: options.config.openaiCoachModel,
      responseSource: 'unavailable',
      openaiStatus: diagnostics?.openaiStatus,
      incompleteReason: diagnostics?.incompleteReason,
      completenessReason: diagnostics?.completenessReason,
      outputTokenCount: diagnostics?.outputTokenCount,
      answerCharCount: diagnostics?.answerCharCount,
      retryAttempt: diagnostics?.retryAttempt,
    });
    return {
      answer: '',
      meta: {
        source: 'unavailable',
        requestId,
        latencyMs,
        promptVersion,
      },
    };
  }
}

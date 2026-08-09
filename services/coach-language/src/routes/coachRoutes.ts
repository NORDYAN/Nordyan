import type { Express, Response } from 'express';

import { DEFAULT_NORDYAN_COACH_PROMPT_VERSION } from '../../../../shared/coach-language';
import {
  createRequireSupabaseAuth,
  type AccessTokenVerifier,
  type AuthenticatedCoachRequest,
} from '../auth';
import { generateCoachLanguage } from '../coachLanguageOrchestrator';
import {
  DOCUMENTED_DEFAULT_MODEL,
  isOpenAiConfigured,
  loadCoachServerConfig,
  type CoachServerConfig,
} from '../config';
import { listCoachInstructionVersions } from '../instructions';
import { createRequestId, logCoachRequest } from '../logger';
import {
  coachGenerateRateLimiter,
  createMemoryRateLimiter,
} from '../rateLimit';
import {
  CoachRequestValidationError,
  validateCoachGenerateRequest,
} from '../validation/requestValidation';

export type CoachRouteOptions = {
  verifyAccessToken?: AccessTokenVerifier;
  rateLimiter?: ReturnType<typeof createMemoryRateLimiter>;
};

export function registerCoachRoutes(
  app: Express,
  config: CoachServerConfig = loadCoachServerConfig(),
  options: CoachRouteOptions = {},
): void {
  const requireAuth = createRequireSupabaseAuth(config, {
    verifyAccessToken: options.verifyAccessToken,
  });
  const rateLimiter = options.rateLimiter ?? coachGenerateRateLimiter;

  app.get('/health', (_request, response) => {
    response.json({ ok: true, service: 'nordyan-coach-language' });
  });

  app.get(
    '/api/coach/status',
    requireAuth,
    (_request: AuthenticatedCoachRequest, response: Response) => {
      response.json({
        openaiConfigured: isOpenAiConfigured(config),
        promptVersion: DEFAULT_NORDYAN_COACH_PROMPT_VERSION,
        availablePromptVersions: listCoachInstructionVersions(),
        defaultModel: config.openaiCoachModel || DOCUMENTED_DEFAULT_MODEL,
      });
    },
  );

  app.post(
    '/api/coach/generate',
    requireAuth,
    async (request: AuthenticatedCoachRequest, response: Response) => {
      const started = Date.now();
      const userId = request.coachAuthUserId;

      if (!userId) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const rate = rateLimiter.check(userId);
      if (!rate.ok) {
        logCoachRequest({
          requestId: createRequestId(),
          promptVersion: DEFAULT_NORDYAN_COACH_PROMPT_VERSION,
          provider: 'fallback',
          latencyMs: Date.now() - started,
          category: 'rate_limited',
          usedFallback: true,
        });
        response.status(429).json({ error: 'Too many requests.' });
        return;
      }

      try {
        const { payload, coachPromptVersion } = validateCoachGenerateRequest(request.body);
        const result = await generateCoachLanguage(payload, { config, coachPromptVersion });
        response.json(result);
      } catch (error) {
        if (error instanceof CoachRequestValidationError) {
          logCoachRequest({
            requestId: createRequestId(),
            promptVersion: DEFAULT_NORDYAN_COACH_PROMPT_VERSION,
            provider: 'fallback',
            latencyMs: Date.now() - started,
            category: 'validation_error',
            usedFallback: true,
          });
          response.status(400).json({ error: error.message });
          return;
        }

        // Generic only — never forward OpenAI or internal error details.
        response.status(500).json({ error: 'Coach language generation failed.' });
      }
    },
  );
}

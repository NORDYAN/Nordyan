import type { Express, Response } from 'express';

import {
  createRequireSupabaseAuth,
  type AccessTokenVerifier,
  type AuthenticatedAccountRequest,
} from '../auth';
import {
  loadAccountServerConfig,
  type AccountServerConfig,
} from '../config';
import { createSupabaseAuthUserDeleter, type AuthUserDeleter } from '../deleteUser';
import { createRequestId, logAccountRequest } from '../logger';

export type AccountRouteOptions = {
  verifyAccessToken?: AccessTokenVerifier;
  deleteAuthUser?: AuthUserDeleter;
};

export function registerAccountRoutes(
  app: Express,
  config: AccountServerConfig = loadAccountServerConfig(),
  options: AccountRouteOptions = {},
): void {
  const requireAuth = createRequireSupabaseAuth(config, {
    verifyAccessToken: options.verifyAccessToken,
  });
  const deleteAuthUser = options.deleteAuthUser ?? createSupabaseAuthUserDeleter(config);

  app.get('/health', (_request, response) => {
    response.json({ ok: true, service: 'nordyan-account' });
  });

  app.post(
    '/api/account/delete',
    requireAuth,
    async (request: AuthenticatedAccountRequest, response: Response) => {
      const started = Date.now();
      const userId = request.accountAuthUserId;

      if (!userId) {
        logAccountRequest({
          requestId: createRequestId(),
          latencyMs: Date.now() - started,
          category: 'auth_error',
        });
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      try {
        const result = await deleteAuthUser(userId);
        if (!result.ok) {
          logAccountRequest({
            requestId: createRequestId(),
            latencyMs: Date.now() - started,
            category: result.reason === 'not_configured' ? 'not_configured' : 'delete_error',
          });
          if (result.reason === 'not_configured') {
            response.status(503).json({ error: 'Account deletion is not configured.' });
            return;
          }
          response.status(500).json({ error: 'Account deletion failed.' });
          return;
        }

        logAccountRequest({
          requestId: createRequestId(),
          latencyMs: Date.now() - started,
          category: 'success',
          alreadyDeleted: result.alreadyDeleted,
        });
        response.status(200).json({ ok: true });
      } catch {
        logAccountRequest({
          requestId: createRequestId(),
          latencyMs: Date.now() - started,
          category: 'delete_error',
        });
        response.status(500).json({ error: 'Account deletion failed.' });
      }
    },
  );
}

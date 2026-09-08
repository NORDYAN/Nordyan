import { createClient } from '@supabase/supabase-js';
import type { NextFunction, Request, Response } from 'express';

import type { AccountServerConfig } from './config';
import { isSupabaseAuthConfigured } from './config';
import { createRequestId, logAccountRequest } from './logger';

export type AuthenticatedAccountRequest = Request & {
  accountAuthUserId?: string;
};

/** Returns authenticated user id, or null when the token is invalid. */
export type AccessTokenVerifier = (token: string) => Promise<string | null>;

export type RequireAuthOptions = {
  verifyAccessToken?: AccessTokenVerifier;
};

export function createDefaultAccessTokenVerifier(
  config: AccountServerConfig,
): AccessTokenVerifier {
  return async (token: string) => {
    if (!isSupabaseAuthConfigured(config)) {
      return null;
    }

    const supabase = createClient(config.supabaseUrl!, config.supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.id) {
      return null;
    }

    return data.user.id;
  };
}

/**
 * Verifies Supabase JWT from Authorization: Bearer <token>.
 * Rejects with 401 when missing or invalid. Does not log tokens or user PII.
 */
export function createRequireSupabaseAuth(
  config: AccountServerConfig,
  options: RequireAuthOptions = {},
) {
  const verifyAccessToken =
    options.verifyAccessToken ?? createDefaultAccessTokenVerifier(config);
  const skipEnvGate = Boolean(options.verifyAccessToken);

  return async function requireSupabaseAuth(
    request: AuthenticatedAccountRequest,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    if (!skipEnvGate && !isSupabaseAuthConfigured(config)) {
      logAccountRequest({
        requestId: createRequestId(),
        latencyMs: 0,
        category: 'auth_error',
      });
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const header = request.header('authorization') ?? request.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const userId = await verifyAccessToken(token);
      if (!userId) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      request.accountAuthUserId = userId;
      next();
    } catch {
      response.status(401).json({ error: 'Unauthorized' });
    }
  };
}

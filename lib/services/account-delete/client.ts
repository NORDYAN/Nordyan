import { getAccountApiBaseUrl } from './env';

export type AccountDeleteClientResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'not_configured' | 'unauthorized' | 'timeout' | 'network' | 'rejected';
    };

export type RequestAccountDeleteOptions = {
  accessToken: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

/**
 * Authenticated client for POST /api/account/delete.
 * Sends the Bearer token only — never an authoritative user_id.
 */
export async function requestAccountDelete(
  options: RequestAccountDeleteOptions,
): Promise<AccountDeleteClientResult> {
  const baseUrl = getAccountApiBaseUrl();
  if (!baseUrl) {
    return { ok: false, reason: 'not_configured' };
  }

  if (!options.accessToken.trim()) {
    return { ok: false, reason: 'unauthorized' };
  }

  const timeoutMs = options.timeoutMs ?? 15_000;
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`${baseUrl}/api/account/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.accessToken}`,
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      return { ok: false, reason: 'unauthorized' };
    }

    if (!response.ok) {
      return { ok: false, reason: 'rejected' };
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, reason: 'timeout' };
    }
    return { ok: false, reason: 'network' };
  } finally {
    clearTimeout(timer);
  }
}

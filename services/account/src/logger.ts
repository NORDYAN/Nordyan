export type AccountLogCategory =
  | 'success'
  | 'auth_error'
  | 'not_configured'
  | 'delete_error';

export type AccountRequestLog = {
  requestId: string;
  latencyMs: number;
  category: AccountLogCategory;
  alreadyDeleted?: boolean;
};

/** Metadata-only logging — never tokens, emails, user UUIDs, or health data. */
export function logAccountRequest(entry: AccountRequestLog): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const payload: Record<string, unknown> = {
    event: 'account.delete',
    requestId: entry.requestId,
    latencyMs: entry.latencyMs,
    category: entry.category,
  };

  if (entry.alreadyDeleted !== undefined) {
    payload.alreadyDeleted = entry.alreadyDeleted;
  }

  console.info(JSON.stringify(payload));
}

export function createRequestId(): string {
  return `account_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

import type { AppError } from '../errors';

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

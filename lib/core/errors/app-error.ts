export type AppErrorCode =
  | 'UNKNOWN'
  | 'NETWORK'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'INTEGRATION';

export type AppError = {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
};

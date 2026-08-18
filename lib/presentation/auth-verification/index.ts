export {
  AUTH_RESEND_COOLDOWN_MS,
  AUTH_VERIFICATION_COPY,
  buildCheckEmailBody,
  canResendVerification,
  maskEmailAddress,
  parseAuthCallbackParams,
  parseAuthCallbackUrl,
} from './auth-verification.presentation';
export { completeAuthEmailCallback } from './complete-auth-email-callback';
export type { CompleteAuthEmailCallbackDeps } from './complete-auth-email-callback';
export type { AuthCallbackParseResult } from './auth-verification.presentation';

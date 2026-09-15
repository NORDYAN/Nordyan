export {
  AUTH_RESEND_COOLDOWN_MS,
  AUTH_VERIFICATION_COPY,
  buildCheckEmailBody,
  canResendVerification,
  decideAuthCallbackStart,
  hasActionableAuthCallbackParams,
  maskEmailAddress,
  parseAuthCallbackParams,
  parseAuthCallbackUrl,
} from './auth-verification.presentation';
export { completeAuthEmailCallback } from './complete-auth-email-callback';
export { shouldPreventCheckEmailNativeBack } from './check-email-native-back';
export type {
  CompleteAuthEmailCallbackDeps,
  CompleteAuthEmailCallbackResult,
} from './complete-auth-email-callback';
export type {
  AuthCallbackFailureDiagnostic,
  AuthCallbackFailureStage,
} from './auth-callback-failure-diagnostic';
export type {
  AuthCallbackParamsInput,
  AuthCallbackParseResult,
  AuthCallbackStartDecision,
} from './auth-verification.presentation';

/** Canonical PKCE email-verification callback for NORDYAN dev builds and production. */
export const AUTH_CALLBACK_PATH = '/auth/callback';
export const PASSWORD_RECOVERY_CALLBACK_PATH = '/auth/recovery-callback';

export const AUTH_EMAIL_REDIRECT_TO = `nordyan://${AUTH_CALLBACK_PATH.replace(/^\//, '')}`;
export const PASSWORD_RECOVERY_REDIRECT_TO =
  `nordyan://${PASSWORD_RECOVERY_CALLBACK_PATH.replace(/^\//, '')}`;

export function getAuthEmailRedirectTo(): string {
  return AUTH_EMAIL_REDIRECT_TO;
}

export function getPasswordRecoveryRedirectTo(): string {
  return PASSWORD_RECOVERY_REDIRECT_TO;
}
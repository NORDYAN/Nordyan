/** Native Expo Router path that exchanges the PKCE code after the website bridge. */
export const AUTH_CALLBACK_PATH = '/auth/callback';
export const PASSWORD_RECOVERY_CALLBACK_PATH = '/auth/recovery-callback';

/** Signup / resend `emailRedirectTo` — HTTPS bridge, not the custom scheme. */
export const EMAIL_VERIFICATION_WEB_REDIRECT = `https://nordyan.app${AUTH_CALLBACK_PATH}`;

/** App callback opened only after an explicit tap on the website bridge. */
export const EMAIL_VERIFICATION_NATIVE_CALLBACK = `nordyan://${AUTH_CALLBACK_PATH.replace(/^\//, '')}`;

export const PASSWORD_RECOVERY_REDIRECT = `nordyan://${PASSWORD_RECOVERY_CALLBACK_PATH.replace(
  /^\//,
  '',
)}`;

/** Signup and resend confirmation use the HTTPS bridge. */
export const AUTH_EMAIL_REDIRECT_TO = EMAIL_VERIFICATION_WEB_REDIRECT;

export const PASSWORD_RECOVERY_REDIRECT_TO = PASSWORD_RECOVERY_REDIRECT;

export function getAuthEmailRedirectTo(): string {
  return EMAIL_VERIFICATION_WEB_REDIRECT;
}

export function getPasswordRecoveryRedirectTo(): string {
  return PASSWORD_RECOVERY_REDIRECT;
}

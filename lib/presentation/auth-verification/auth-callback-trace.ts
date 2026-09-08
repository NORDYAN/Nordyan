/**
 * Temporary DEV-only Android auth-callback forensics.
 * Remove after the physical reproduction is diagnosed.
 * Never log codes, tokens, emails, or full URLs.
 */
export function logNordyanAuthTrace(
  event: string,
  details?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  const ts = Date.now();
  if (details && Object.keys(details).length > 0) {
    console.warn(`[nordyan-auth-trace] ${ts} ${event}`, details);
  } else {
    console.warn(`[nordyan-auth-trace] ${ts} ${event}`);
  }
}

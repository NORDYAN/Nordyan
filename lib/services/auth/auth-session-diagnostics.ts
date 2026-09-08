export function logAuthHydrationDiagnostic(details: {
  localSessionPresent: boolean;
  serverUserValidated: boolean;
  staleSessionCleared: boolean;
  errorClass: string;
}): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  console.info('[nordyan-auth]', details);
}

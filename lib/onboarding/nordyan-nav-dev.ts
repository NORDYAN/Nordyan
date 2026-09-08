export type NordyanNavTrace = {
  source: string;
  href: string;
  hrefJson: string;
  gateDestination: string;
  pathname: string;
  expoRemaining: string;
  predictedReplaceName: string;
};

const FORBIDDEN_NAV_TRACE_KEYS = [
  'userId',
  'email',
  'token',
  'tokens',
  'uuid',
  'session',
] as const;

/** Mirrors Expo Router `getUrlWithReactNavigationConcessions` + `cleanPath` remaining. */
export function inspectOnboardingHref(href: string): Pick<
  NordyanNavTrace,
  'href' | 'hrefJson' | 'expoRemaining' | 'predictedReplaceName'
> {
  let pathname = href;
  try {
    pathname = new URL(href, 'file:').pathname;
  } catch {
    pathname = href;
  }

  const nonstandardPathname = pathname.replace(/^\/+/g, '').replace(/\/+$/g, '') + '/';
  const expoRemaining = nonstandardPathname.replace(/\/+/g, '/').replace(/^\//, '');
  const predictedReplaceName = expoRemaining.split('/').find(Boolean) ?? '';

  return {
    href,
    hrefJson: JSON.stringify(href),
    expoRemaining,
    predictedReplaceName,
  };
}

export function assertNordyanNavTraceSafe(payload: NordyanNavTrace): void {
  const keys = Object.keys(payload);
  for (const forbidden of FORBIDDEN_NAV_TRACE_KEYS) {
    if (keys.includes(forbidden)) {
      throw new Error(`nordyan-nav must not include ${forbidden}`);
    }
  }
}

export function logNordyanOnboardingRedirect(input: {
  source: string;
  href: string;
  gateDestination: string;
  pathname: string;
}): void {
  if (!__DEV__) {
    return;
  }

  const inspected = inspectOnboardingHref(input.href);
  const payload: NordyanNavTrace = {
    source: input.source,
    gateDestination: input.gateDestination,
    pathname: input.pathname,
    ...inspected,
  };
  assertNordyanNavTraceSafe(payload);
  console.log('[nordyan-nav]', payload);
}

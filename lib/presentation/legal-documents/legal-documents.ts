import { PRIVACY_POLICY_URL } from '@/lib/domain/health-data-consent';
import type { AppLocale } from '@/lib/i18n/locales';

export const TERMS_OF_SERVICE_URL = 'https://nordyan.app/terms';

export type LegalDocumentId = 'privacy' | 'terms';

export const LEGAL_DOCUMENT_URLS = {
  sv: {
    privacy: PRIVACY_POLICY_URL,
    terms: TERMS_OF_SERVICE_URL,
  },
  nb: {
    privacy: PRIVACY_POLICY_URL,
    terms: TERMS_OF_SERVICE_URL,
  },
} as const satisfies Record<AppLocale, Record<LegalDocumentId, string>>;

const ALLOWED_LEGAL_HOSTS = new Set(['nordyan.app', 'www.nordyan.app']);

export function legalDocumentUrlFor(locale: AppLocale, document: LegalDocumentId): string {
  return LEGAL_DOCUMENT_URLS[locale][document];
}

function parseHttpsUrl(url: string): URL | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isAllowedLegalHost(hostname: string): boolean {
  return ALLOWED_LEGAL_HOSTS.has(hostname.toLowerCase());
}

function isLegalDocumentPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === '/privacy' || normalized === '/terms';
}

function isLegalAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith('/assets/') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon-16x16.png' ||
    pathname === '/favicon-32x32.png' ||
    pathname === '/apple-touch-icon.png'
  );
}

/** Main-frame and subresource navigations allowed inside the in-app legal viewer. */
export function isAllowedLegalNavigationUrl(url: string): boolean {
  if (url === 'about:blank') {
    return true;
  }

  const parsed = parseHttpsUrl(url);
  if (!parsed || !isAllowedLegalHost(parsed.hostname)) {
    return false;
  }

  return isLegalDocumentPath(parsed.pathname) || isLegalAssetPath(parsed.pathname);
}

/** Document the viewer was opened to — not CSS/favicon subresources. */
export function isAllowedLegalDocumentUrl(url: string): boolean {
  const parsed = parseHttpsUrl(url);
  if (!parsed || !isAllowedLegalHost(parsed.hostname)) {
    return false;
  }

  return isLegalDocumentPath(parsed.pathname);
}

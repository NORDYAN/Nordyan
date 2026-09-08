import { t } from '@/lib/i18n';

export const NORDYAN_SUPPORT_EMAIL = 'support@nordyan.app';

export function buildMailtoUrl(input: { subject: string; body?: string }): string {
  const params = [`subject=${encodeURIComponent(input.subject)}`];
  if (input.body != null && input.body.length > 0) {
    params.push(`body=${encodeURIComponent(input.body)}`);
  }
  return `mailto:${NORDYAN_SUPPORT_EMAIL}?${params.join('&')}`;
}

export function buildFeedbackMailto(): string {
  return buildMailtoUrl({
    subject: t('profile.feedback.mailSubject'),
  });
}

export function buildHelpAndSupportMailto(): string {
  return buildMailtoUrl({
    subject: t('profile.help.mailSubject'),
    body: t('profile.help.mailBody'),
  });
}

export function buildIntegrationSuggestionMailto(): string {
  return buildMailtoUrl({
    subject: t('health.sources.suggest.mailSubject'),
    body: t('health.sources.suggest.mailBody'),
  });
}

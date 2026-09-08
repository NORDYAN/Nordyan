import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { setActiveLocale, t } from '../../i18n';
import {
  NORDYAN_SUPPORT_EMAIL,
  buildFeedbackMailto,
  buildHelpAndSupportMailto,
  buildIntegrationSuggestionMailto,
} from './support-mail';

afterEach(() => {
  setActiveLocale('sv');
});

const PERSONAL_OR_HEALTH = /userId|user_id|Health Score|healthScore|measurement|midjemått|kroppsfett|Coach|device|diagnostics|session/i;

describe('Beta 1 support mailto builders', () => {
  it('builds a localized feedback mailto without personal or health data', () => {
    setActiveLocale('sv');
    const href = buildFeedbackMailto();
    assert.equal(href.startsWith(`mailto:${NORDYAN_SUPPORT_EMAIL}?`), true);
    assert.equal(href.includes(`subject=${encodeURIComponent('Feedback – NORDYAN')}`), true);
    assert.equal(href.includes('body='), false);
    assert.doesNotMatch(href, PERSONAL_OR_HEALTH);
    assert.equal(decodeURIComponent(href).includes(t('profile.feedback.mailSubject')), true);
  });

  it('localizes the feedback subject in Bokmål', () => {
    setActiveLocale('nb');
    const href = buildFeedbackMailto();
    assert.equal(href.includes(`subject=${encodeURIComponent('Tilbakemelding – NORDYAN')}`), true);
    assert.equal(href.includes('body='), false);
    assert.doesNotMatch(href, PERSONAL_OR_HEALTH);
  });

  it('builds a localized integration-suggestion mailto with a short non-personal body', () => {
    setActiveLocale('sv');
    const href = buildIntegrationSuggestionMailto();
    assert.equal(href.startsWith(`mailto:${NORDYAN_SUPPORT_EMAIL}?`), true);
    assert.equal(
      href.includes(`subject=${encodeURIComponent('Integrationsförslag – NORDYAN')}`),
      true,
    );
    assert.equal(
      decodeURIComponent(href).includes('Hej NORDYAN,\n\nJag skulle vilja kunna ansluta:'),
      true,
    );
    assert.doesNotMatch(href, PERSONAL_OR_HEALTH);
  });

  it('localizes the integration suggestion subject and body in Bokmål', () => {
    setActiveLocale('nb');
    const href = buildIntegrationSuggestionMailto();
    assert.equal(
      href.includes(`subject=${encodeURIComponent('Integrasjonsforslag – NORDYAN')}`),
      true,
    );
    assert.equal(
      decodeURIComponent(href).includes('Hei NORDYAN,\n\nJeg ønsker å kunne koble til:'),
      true,
    );
    assert.doesNotMatch(href, PERSONAL_OR_HEALTH);
  });
});

describe('Beta 1 help-and-support mailto', () => {
  it('builds a localized help mailto with a short non-personal body', () => {
    setActiveLocale('sv');
    const href = buildHelpAndSupportMailto();
    assert.equal(href.startsWith(`mailto:${NORDYAN_SUPPORT_EMAIL}?`), true);
    assert.equal(
      href.includes(`subject=${encodeURIComponent('Hjälp & support – NORDYAN')}`),
      true,
    );
    assert.equal(
      decodeURIComponent(href).includes('Hej NORDYAN,\n\nJag behöver hjälp med:'),
      true,
    );
    assert.doesNotMatch(href, PERSONAL_OR_HEALTH);
  });

  it('localizes the help subject and body in Bokmål', () => {
    setActiveLocale('nb');
    const href = buildHelpAndSupportMailto();
    assert.equal(
      href.includes(`subject=${encodeURIComponent('Hjelp og support – NORDYAN')}`),
      true,
    );
    assert.equal(
      decodeURIComponent(href).includes('Hei NORDYAN,\n\nJeg trenger hjelp med:'),
      true,
    );
    assert.doesNotMatch(href, PERSONAL_OR_HEALTH);
  });
});

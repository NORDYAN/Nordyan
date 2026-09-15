import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PRIVACY_POLICY_URL } from '@/lib/domain/health-data-consent';

import {
  LEGAL_DOCUMENT_URLS,
  TERMS_OF_SERVICE_URL,
  isAllowedLegalDocumentUrl,
  isAllowedLegalNavigationUrl,
  legalDocumentUrlFor,
} from './legal-documents';

describe('legal document URL mapping', () => {
  it('maps sv and nb to the current canonical nordyan.app pages', () => {
    assert.equal(legalDocumentUrlFor('sv', 'privacy'), 'https://nordyan.app/privacy');
    assert.equal(legalDocumentUrlFor('sv', 'terms'), 'https://nordyan.app/terms');
    assert.equal(legalDocumentUrlFor('nb', 'privacy'), 'https://nordyan.app/privacy');
    assert.equal(legalDocumentUrlFor('nb', 'terms'), 'https://nordyan.app/terms');
    assert.equal(LEGAL_DOCUMENT_URLS.sv.privacy, PRIVACY_POLICY_URL);
    assert.equal(LEGAL_DOCUMENT_URLS.nb.terms, TERMS_OF_SERVICE_URL);
    assert.equal(TERMS_OF_SERVICE_URL, 'https://nordyan.app/terms');
  });

  it('does not invent locale website routes that do not exist', () => {
    assert.equal(legalDocumentUrlFor('sv', 'privacy').includes('/en/'), false);
    assert.equal(legalDocumentUrlFor('nb', 'privacy').includes('/nb/'), false);
    assert.equal(legalDocumentUrlFor('nb', 'terms').includes('/nb/'), false);
  });
});

describe('legal viewer navigation allowlist', () => {
  it('allows only NORDYAN privacy and terms documents', () => {
    assert.equal(isAllowedLegalDocumentUrl('https://nordyan.app/privacy'), true);
    assert.equal(isAllowedLegalDocumentUrl('https://nordyan.app/privacy/'), true);
    assert.equal(isAllowedLegalDocumentUrl('https://nordyan.app/terms'), true);
    assert.equal(isAllowedLegalDocumentUrl('https://www.nordyan.app/terms'), true);
    assert.equal(isAllowedLegalDocumentUrl('https://nordyan.app/'), false);
    assert.equal(isAllowedLegalDocumentUrl('https://nordyan.app/auth/callback'), false);
    assert.equal(isAllowedLegalDocumentUrl('https://example.com/privacy'), false);
    assert.equal(isAllowedLegalDocumentUrl('http://nordyan.app/privacy'), false);
  });

  it('allows legal page assets but not arbitrary nordyan.app paths', () => {
    assert.equal(isAllowedLegalNavigationUrl('https://nordyan.app/privacy'), true);
    assert.equal(isAllowedLegalNavigationUrl('https://nordyan.app/assets/logo-mark.png'), true);
    assert.equal(isAllowedLegalNavigationUrl('about:blank'), true);
    assert.equal(isAllowedLegalNavigationUrl('https://nordyan.app/'), false);
    assert.equal(isAllowedLegalNavigationUrl('https://google.com'), false);
    assert.equal(isAllowedLegalNavigationUrl('https://nordyan.app/coach'), false);
  });
});

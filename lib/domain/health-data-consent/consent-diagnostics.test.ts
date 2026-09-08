import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { consentUserIdDiagnosticSuffix } from './consent-diagnostics';

describe('consentUserIdDiagnosticSuffix', () => {
  it('returns only the last six characters and never a missing id', () => {
    assert.equal(consentUserIdDiagnosticSuffix('123e4567-e89b-12d3-a456-426614174000'), '174000');
    assert.equal(consentUserIdDiagnosticSuffix(null), null);
    assert.equal(consentUserIdDiagnosticSuffix('   '), null);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ACCOUNT_FIRST_NAME_MAX_LENGTH,
  normalizeAccountFirstName,
  validateAccountFirstName,
} from './account-first-name';

describe('normalizeAccountFirstName', () => {
  it('trims surrounding whitespace', () => {
    assert.equal(normalizeAccountFirstName('  Anna  '), 'Anna');
  });

  it('persists blank values as null', () => {
    assert.equal(normalizeAccountFirstName(''), null);
    assert.equal(normalizeAccountFirstName('   '), null);
    assert.equal(normalizeAccountFirstName(null), null);
    assert.equal(normalizeAccountFirstName(undefined), null);
  });

  it('does not capitalize or split names', () => {
    assert.equal(normalizeAccountFirstName('nisse1975'), 'nisse1975');
    assert.equal(normalizeAccountFirstName('mary jane'), 'mary jane');
  });

  it('accepts Unicode names', () => {
    assert.equal(normalizeAccountFirstName('Åsa'), 'Åsa');
    assert.equal(normalizeAccountFirstName('田中'), '田中');
    assert.equal(normalizeAccountFirstName('Élodie'), 'Élodie');
  });
});

describe('validateAccountFirstName', () => {
  it('accepts null and Unicode within the limit', () => {
    assert.equal(validateAccountFirstName(null), null);
    assert.equal(validateAccountFirstName('Åsa'), null);
  });

  it('rejects names above the conservative code-point limit', () => {
    const tooLong = 'A'.repeat(ACCOUNT_FIRST_NAME_MAX_LENGTH + 1);
    const error = validateAccountFirstName(tooLong);
    assert.ok(error);
    assert.equal(error?.code, 'VALIDATION');
  });
});

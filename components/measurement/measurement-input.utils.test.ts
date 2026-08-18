import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  isPositiveMeasurementInput,
  normalizeMeasurementDecimalInput,
  parseMeasurementNumericInput,
} from './measurement-input.utils';

describe('normalizeMeasurementDecimalInput', () => {
  it('accepts comma and dot decimal separators', () => {
    assert.equal(normalizeMeasurementDecimalInput('89,7'), '89.7');
    assert.equal(normalizeMeasurementDecimalInput('89.7'), '89.7');
    assert.equal(normalizeMeasurementDecimalInput(' 90 '), '90');
    assert.equal(normalizeMeasurementDecimalInput(''), '');
  });
});

describe('parseMeasurementNumericInput', () => {
  it('parses Swedish/Norwegian comma decimals without rounding', () => {
    assert.equal(parseMeasurementNumericInput('89,7'), 89.7);
    assert.equal(parseMeasurementNumericInput('89.7'), 89.7);
    assert.equal(parseMeasurementNumericInput('90'), 90);
    assert.notEqual(parseMeasurementNumericInput('89,7'), 90);
    assert.notEqual(parseMeasurementNumericInput('89.7'), 90);
  });

  it('returns null for empty or invalid input', () => {
    assert.equal(parseMeasurementNumericInput(''), null);
    assert.equal(parseMeasurementNumericInput('   '), null);
    assert.equal(parseMeasurementNumericInput('abc'), null);
  });
});

describe('isPositiveMeasurementInput', () => {
  it('accepts comma and dot decimals and rejects empty or non-positive values', () => {
    assert.equal(isPositiveMeasurementInput('89,7'), true);
    assert.equal(isPositiveMeasurementInput('89.7'), true);
    assert.equal(isPositiveMeasurementInput('90'), true);
    assert.equal(isPositiveMeasurementInput(''), false);
    assert.equal(isPositiveMeasurementInput('0'), false);
    assert.equal(isPositiveMeasurementInput('abc'), false);
  });
});

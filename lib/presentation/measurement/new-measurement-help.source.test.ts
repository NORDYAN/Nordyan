import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('new measurement help placement', () => {
  it('keeps only the measurement-help entry on the New Health Measurement form', () => {
    const form = source('components/measurement/MeasurementForm.tsx');

    assert.match(form, /t\('health\.new\.help'\)/);
    assert.match(form, /<MeasurementHelpModal/);
    assert.doesNotMatch(form, /health\.new\.tipsTitle/);
    assert.doesNotMatch(form, /health\.new\.tipsIntro/);
    assert.doesNotMatch(form, /health\.new\.tip\.morning/);
    assert.doesNotMatch(form, /tipsSection|tipsCard/);
    assert.equal((form.match(/t\('health\.new\.help'\)/g) ?? []).length, 2);

    const helpIndex = form.indexOf("t('health.new.help')");
    const sectionIndex = form.indexOf("t('health.new.section')");
    const saveIndex = form.indexOf('styles.newMeasurementSaveSection');
    assert.ok(helpIndex !== -1 && sectionIndex !== -1 && saveIndex !== -1);
    assert.ok(helpIndex < sectionIndex);
    assert.ok(sectionIndex < saveIndex);
  });
});

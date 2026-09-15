import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { setActiveLocale } from '../../i18n/translate';

import { buildProfilePrivacyView } from './profile-privacy.presentation';

describe('buildProfilePrivacyView', () => {
  afterEach(() => {
    setActiveLocale('sv');
  });

  it('uses the approved Swedish deletion copy', () => {
    setActiveLocale('sv');
    const view = buildProfilePrivacyView();
    assert.equal(view.deleteTitle, 'Radera konto');
    assert.equal(
      view.body,
      'När du raderar ditt konto tas din profil och din hälsohistorik bort permanent från NORDYAN. Detta kan inte ångras.',
    );
    assert.equal(
      view.confirmCheck,
      'Jag vill permanent radera mitt konto och förstår att detta inte kan ångras.',
    );
    assert.match(view.confirmCheck, /vill permanent radera mitt konto/);
    assert.equal(view.action, 'Radera mitt konto');
    assert.equal(view.alertTitle, 'Radera ditt konto permanent?');
    assert.equal(
      view.alertMessage,
      'Din profil och hälsohistorik tas bort permanent från NORDYAN. Detta kan inte ångras.',
    );
    assert.match(view.alertMessage, /permanent/);
    assert.match(view.alertMessage, /kan inte ångras/);
    assert.equal(view.alertConfirm, 'Radera mitt konto');
    assert.equal(view.processing, 'Raderar konto…');
    assert.equal(view.error, 'Kunde inte radera kontot. Försök igen.');
    assert.equal(view.cancel, 'Avbryt');
    assert.doesNotMatch(view.action, /Bekräfta|Fortsätt|Klar|^OK$/);
    assert.doesNotMatch(view.alertConfirm, /Bekräfta|Fortsätt|Klar|^OK$/);
    assert.doesNotMatch(view.body, /Coach/i);
  });

  it('provides Norwegian Bokmål deletion copy', () => {
    setActiveLocale('nb');
    const view = buildProfilePrivacyView();
    assert.equal(view.deleteTitle, 'Slett konto');
    assert.equal(
      view.body,
      'Når du sletter kontoen din, fjernes profilen og helsehistorikken din permanent fra NORDYAN. Dette kan ikke angres.',
    );
    assert.equal(
      view.confirmCheck,
      'Jeg vil slette kontoen min permanent og forstår at dette ikke kan angres.',
    );
    assert.match(view.confirmCheck, /vil slette kontoen min permanent/);
    assert.equal(view.action, 'Slett kontoen min');
    assert.equal(view.alertTitle, 'Slette kontoen din permanent?');
    assert.equal(
      view.alertMessage,
      'Profilen og helsehistorikken din fjernes permanent fra NORDYAN. Dette kan ikke angres.',
    );
    assert.match(view.alertMessage, /permanent/);
    assert.match(view.alertMessage, /kan ikke angres/);
    assert.equal(view.alertConfirm, 'Slett kontoen min');
    assert.equal(view.processing, 'Sletter konto…');
    assert.equal(view.cancel, 'Avbryt');
    assert.doesNotMatch(view.body, /Coach/i);
  });
});

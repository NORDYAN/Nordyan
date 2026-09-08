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
    assert.equal(view.confirmCheck, 'Jag förstår att detta inte kan ångras');
    assert.equal(view.action, 'Radera konto');
    assert.equal(view.alertTitle, 'Radera konto?');
    assert.equal(
      view.alertMessage,
      'Din profil och hälsohistorik kommer att tas bort permanent.',
    );
    assert.equal(view.alertConfirm, 'Radera');
    assert.equal(view.processing, 'Raderar konto…');
    assert.equal(view.error, 'Kunde inte radera kontot. Försök igen.');
    assert.equal(view.cancel, 'Avbryt');
    assert.doesNotMatch(view.body, /Coach/i);
  });

  it('provides Norwegian Bokmål deletion copy', () => {
    setActiveLocale('nb');
    const view = buildProfilePrivacyView();
    assert.equal(view.deleteTitle, 'Slett konto');
    assert.equal(view.confirmCheck.length > 0, true);
    assert.equal(view.alertConfirm, 'Slett');
    assert.doesNotMatch(view.body, /Coach/i);
  });
});

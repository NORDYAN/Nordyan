import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { setActiveLocale } from '../../i18n';
import { buildProfileSubscriptionView } from './profile-subscription.presentation';

afterEach(() => {
  setActiveLocale('sv');
});

const FORBIDDEN_COMMERCIAL = /pris|price|köp|kjøp|purchase|trial|återställ|gjenopprett|restore|RevenueCat|StoreKit|waitlist|månad|årlig|monthly|yearly/i;

describe('buildProfileSubscriptionView', () => {
  it('resolves Swedish title, intro, four pillars, core reassurance, and footer', () => {
    setActiveLocale('sv');
    const view = buildProfileSubscriptionView();
    assert.equal(view.title, 'NORDYAN Premium');
    assert.equal(
      view.subtitle,
      'Få ännu mer ut av din hälsodata med fördjupad analys och fler smarta verktyg.',
    );
    assert.deepEqual(
      view.pillars.map((pillar) => pillar.title),
      ['Coach+', 'Food Scanner', 'Blodprover', 'Fördjupade insikter'],
    );
    assert.equal(
      view.pillars[0].body,
      'Få utökad tillgång till NORDYAN Coach för fler frågor och djupare personliga hälsoinsikter.',
    );
    assert.equal(
      view.pillars[1].body,
      'Registrera mat enklare och få bättre överblick över energiintag och hur kosten hänger ihop med dina mål.',
    );
    assert.equal(
      view.pillars[2].body,
      'Samla relevanta blodvärden och få pedagogisk hjälp att förstå dem i sammanhang med din övriga hälsodata.',
    );
    assert.equal(
      view.pillars[3].body,
      'Upptäck förändringar och samband över tid mellan exempelvis aktivitet, sömn, kroppsmått och hur du mår.',
    );
    assert.equal(view.coreTitle, 'NORDYAN fortsätter fungera utan Premium');
    assert.equal(
      view.coreBody,
      'Health Score, dagens och veckans fokus, mätningar, Veckokoll och grundläggande utveckling är en del av NORDYANs kärna.',
    );
    assert.equal(view.footer, 'NORDYAN Premium kommer snart.');
  });

  it('resolves Bokmål title, intro, four pillars, core reassurance, and footer', () => {
    setActiveLocale('nb');
    const view = buildProfileSubscriptionView();
    assert.equal(view.title, 'NORDYAN Premium');
    assert.equal(
      view.subtitle,
      'Få enda mer ut av helsedataene dine med dypere analyse og flere smarte verktøy.',
    );
    assert.deepEqual(
      view.pillars.map((pillar) => pillar.title),
      ['Coach+', 'Food Scanner', 'Blodprøver', 'Dypere innsikt'],
    );
    assert.equal(
      view.pillars[0].body,
      'Få utvidet tilgang til NORDYAN Coach for flere spørsmål og dypere personlige helseinnsikter.',
    );
    assert.equal(
      view.pillars[1].body,
      'Registrer mat enklere og få bedre oversikt over energiinntak og hvordan kostholdet henger sammen med målene dine.',
    );
    assert.equal(
      view.pillars[2].body,
      'Samle relevante blodverdier og få pedagogisk hjelp til å forstå dem i sammenheng med de øvrige helsedataene dine.',
    );
    assert.equal(
      view.pillars[3].body,
      'Oppdag endringer og sammenhenger over tid mellom for eksempel aktivitet, søvn, kroppsmål og hvordan du har det.',
    );
    assert.equal(view.coreTitle, 'NORDYAN fungerer fortsatt uten Premium');
    assert.equal(
      view.coreBody,
      'Health Score, dagens og ukens fokus, målinger, Ukessjekk og grunnleggende utvikling er en del av kjernen i NORDYAN.',
    );
    assert.equal(view.footer, 'NORDYAN Premium kommer snart.');
  });

  it('does not include purchase, price, trial, or restore copy', () => {
    for (const locale of ['sv', 'nb'] as const) {
      setActiveLocale(locale);
      const view = buildProfileSubscriptionView();
      const blob = [
        view.title,
        view.subtitle,
        ...view.pillars.flatMap((pillar) => [pillar.title, pillar.body]),
        view.coreTitle,
        view.coreBody,
        view.footer,
      ].join('\n');
      assert.doesNotMatch(blob, FORBIDDEN_COMMERCIAL);
      assert.doesNotMatch(blob, /diagnos|diagnose|behandling|unlimited|obegränsat|ubegrenset/i);
      assert.match(view.pillars[3].body, /samband|sammenhenger/);
      assert.doesNotMatch(view.pillars[3].body, /orsak|forårsak|caused/i);
    }
  });
});

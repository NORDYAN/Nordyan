const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  mapExplicitLang,
  mapBrowserLang,
  resolveLocale,
  stripLangSearchParam,
} = require('./locale.js');

describe('website locale resolution', () => {
  it('maps explicit query aliases', () => {
    assert.equal(mapExplicitLang('nb'), 'nb');
    assert.equal(mapExplicitLang('NO'), 'nb');
    assert.equal(mapExplicitLang('sv'), 'sv');
    assert.equal(mapExplicitLang('en'), null);
  });

  it('maps browser language tags', () => {
    assert.equal(mapBrowserLang('nb-NO'), 'nb');
    assert.equal(mapBrowserLang('nn-NO'), 'nb');
    assert.equal(mapBrowserLang('no'), 'nb');
    assert.equal(mapBrowserLang('sv-SE'), 'sv');
    assert.equal(mapBrowserLang('en-US'), null);
  });

  it('lets an explicit lang query override a saved preference', () => {
    const resolved = resolveLocale({
      searchParams: new URLSearchParams('lang=nb'),
      stored: 'sv',
      languages: ['sv-SE'],
    });
    assert.deepEqual(resolved, { locale: 'nb', source: 'query' });
  });

  it('uses stored preference when no lang query is present', () => {
    const resolved = resolveLocale({
      searchParams: new URLSearchParams('utm=1'),
      stored: 'nb',
      languages: ['sv-SE'],
    });
    assert.deepEqual(resolved, { locale: 'nb', source: 'stored' });
  });

  it('falls back through browser language to Swedish', () => {
    assert.equal(
      resolveLocale({
        searchParams: new URLSearchParams(''),
        stored: null,
        languages: ['en-GB', 'nb-NO'],
      }).locale,
      'nb',
    );
    assert.deepEqual(
      resolveLocale({
        searchParams: new URLSearchParams(''),
        stored: null,
        languages: ['en-US'],
      }),
      { locale: 'sv', source: 'fallback' },
    );
  });

  it('removes only the lang parameter and keeps other query params and hashes', () => {
    assert.equal(
      stripLangSearchParam('https://nordyan.app/?lang=nb&utm=spring#sa-fungerar'),
      '/?utm=spring#sa-fungerar',
    );
    assert.equal(stripLangSearchParam('https://nordyan.app/?lang=sv#hur'), '/#hur');
    assert.equal(stripLangSearchParam('https://nordyan.app/privacy?ref=1'), '/privacy?ref=1');
  });
});

(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.NordyanWebsiteLocale = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var STORAGE_KEY = 'nordyan.website.locale';
  var OG_LOCALES = { sv: 'sv_SE', nb: 'nb_NO' };

  function mapExplicitLang(raw) {
    if (raw == null) {
      return null;
    }
    var value = String(raw).trim().toLowerCase();
    if (value === 'nb' || value === 'no') {
      return 'nb';
    }
    if (value === 'sv') {
      return 'sv';
    }
    return null;
  }

  function mapBrowserLang(tag) {
    if (!tag) {
      return null;
    }
    var primary = String(tag).trim().toLowerCase().split('-')[0];
    if (primary === 'nb' || primary === 'no' || primary === 'nn') {
      return 'nb';
    }
    if (primary === 'sv') {
      return 'sv';
    }
    return null;
  }

  function resolveLocale(input) {
    var searchParams = input && input.searchParams;
    var explicit = mapExplicitLang(searchParams && searchParams.get ? searchParams.get('lang') : null);
    if (explicit) {
      return { locale: explicit, source: 'query' };
    }

    var stored = input && input.stored;
    if (stored === 'sv' || stored === 'nb') {
      return { locale: stored, source: 'stored' };
    }

    var languages = (input && input.languages) || [];
    for (var i = 0; i < languages.length; i += 1) {
      var mapped = mapBrowserLang(languages[i]);
      if (mapped) {
        return { locale: mapped, source: 'browser' };
      }
    }

    return { locale: 'sv', source: 'fallback' };
  }

  function stripLangSearchParam(href, base) {
    var url = new URL(href, base || 'https://nordyan.app/');
    if (!url.searchParams.has('lang')) {
      return url.pathname + url.search + url.hash;
    }
    url.searchParams.delete('lang');
    return url.pathname + url.search + url.hash;
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    OG_LOCALES: OG_LOCALES,
    mapExplicitLang: mapExplicitLang,
    mapBrowserLang: mapBrowserLang,
    resolveLocale: resolveLocale,
    stripLangSearchParam: stripLangSearchParam,
  };
});

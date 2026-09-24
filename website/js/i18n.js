(function () {
  function clearPending() {
    document.documentElement.removeAttribute('data-i18n-pending');
  }

  var core = window.NordyanWebsiteLocale;
  if (!core) {
    clearPending();
    return;
  }

  function dictionaries() {
    return window.NORDYAN_WEBSITE_STRINGS || {};
  }

  function readStoredLocale() {
    try {
      return window.localStorage.getItem(core.STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function writeStoredLocale(locale) {
    try {
      window.localStorage.setItem(core.STORAGE_KEY, locale);
    } catch (error) {
      // Private mode or blocked storage must not break the page.
    }
  }

  function browserLanguages() {
    if (window.navigator.languages && window.navigator.languages.length) {
      return Array.prototype.slice.call(window.navigator.languages);
    }
    return window.navigator.language ? [window.navigator.language] : [];
  }

  function lookup(locale, key) {
    var pack = dictionaries()[locale] || {};
    if (Object.prototype.hasOwnProperty.call(pack, key)) {
      return pack[key];
    }
    var fallback = dictionaries().sv || {};
    return Object.prototype.hasOwnProperty.call(fallback, key) ? fallback[key] : null;
  }

  function applyDocument(locale) {
    var html = document.documentElement;
    html.lang = locale;
    html.setAttribute('lang', locale);

    var og = document.querySelector('meta[property="og:locale"]');
    if (og) {
      og.setAttribute('content', core.OG_LOCALES[locale] || core.OG_LOCALES.sv);
    }

    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      var key = node.getAttribute('data-i18n');
      var value = lookup(locale, key);
      if (value == null) {
        continue;
      }
      var attr = node.getAttribute('data-i18n-attr');
      if (attr) {
        node.setAttribute(attr, value);
        if (node.tagName === 'TITLE' && attr === 'text') {
          document.title = value;
        }
      } else if (node.tagName === 'TITLE') {
        node.textContent = value;
        document.title = value;
      } else {
        node.textContent = value;
      }
    }

    var buttons = document.querySelectorAll('[data-lang-choice]');
    for (var j = 0; j < buttons.length; j += 1) {
      var pressed = buttons[j].getAttribute('data-lang-choice') === locale;
      buttons[j].setAttribute('aria-pressed', pressed ? 'true' : 'false');
      buttons[j].classList.toggle('is-active', pressed);
    }
  }

  function consumeExplicitLang() {
    var resolved = core.resolveLocale({
      searchParams: new URL(window.location.href).searchParams,
      stored: readStoredLocale(),
      languages: browserLanguages(),
    });

    if (resolved.source === 'query') {
      writeStoredLocale(resolved.locale);
      var next = core.stripLangSearchParam(window.location.href, window.location.origin + '/');
      var current = window.location.pathname + window.location.search + window.location.hash;
      if (next !== current) {
        window.history.replaceState(window.history.state, '', next);
      }
    }

    return resolved;
  }

  function bindSwitcher() {
    document.querySelectorAll('[data-lang-choice]').forEach(function (button) {
      button.addEventListener('click', function () {
        var locale = button.getAttribute('data-lang-choice');
        if (locale !== 'sv' && locale !== 'nb') {
          return;
        }
        writeStoredLocale(locale);
        applyDocument(locale);
      });
    });
  }

  function start() {
    var resolved = consumeExplicitLang();
    applyDocument(resolved.locale);
    bindSwitcher();
    clearPending();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

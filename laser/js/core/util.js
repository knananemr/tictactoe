// js/core/util.js
// Small helpers with no knowledge of the data: ids, escaping, the html tag, clone, debounce, platform.
(function (L) {
  'use strict';

  // ---- ids (4.1) -------------------------------------------------------------------------

  function hex(n, width) {
    let s = n.toString(16);
    while (s.length < width) s = '0' + s;
    return s;
  }

  function uuidFromBytes(b) {
    b[6] = (b[6] & 0x0f) | 0x40;   // version 4
    b[8] = (b[8] & 0x3f) | 0x80;   // variant
    let out = '';
    for (let i = 0; i < 16; i++) {
      out += hex(b[i], 2);
      if (i === 3 || i === 5 || i === 7 || i === 9) out += '-';
    }
    return out;
  }

  // A UUID v4. crypto.randomUUID where it exists, else crypto.getRandomValues,
  // and as a last resort Math.random mixed with the clock.
  function uid() {
    const c = (typeof crypto !== 'undefined') ? crypto : null;
    if (c && typeof c.randomUUID === 'function') {
      try { return c.randomUUID(); } catch (e) { /* not a secure context: fall through */ }
    }
    const bytes = new Array(16);
    if (c && typeof c.getRandomValues === 'function') {
      try {
        const buf = c.getRandomValues(new Uint8Array(16));
        for (let i = 0; i < 16; i++) bytes[i] = buf[i];
        return uuidFromBytes(bytes);
      } catch (e) { /* fall through */ }
    }
    let seed = L.core.dates ? L.core.dates.now().getTime() : 0;
    for (let i = 0; i < 16; i++) {
      seed = Math.floor(seed / 7) + 13;
      bytes[i] = (Math.floor(Math.random() * 256) ^ (seed & 0xff)) & 0xff;
    }
    return uuidFromBytes(bytes);
  }

  // ---- escaping and the html tag (2.6) ---------------------------------------------------

  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (ch) { return ESCAPES[ch]; });
  }

  const KEY = {};   // only this file can make a SafeHtml

  function SafeHtml(text, key) {
    if (key !== KEY) throw new Error('SafeHtml can only be made by the html tag');
    this.text = text;
    Object.freeze(this);
  }
  SafeHtml.prototype.toString = function () { return this.text; };

  function isSafeHtml(value) {
    return value instanceof SafeHtml;
  }

  function renderValue(value) {
    if (value instanceof SafeHtml) return value.text;
    if (Array.isArray(value)) {
      let out = '';
      for (let i = 0; i < value.length; i++) out += renderValue(value[i]);
      return out;
    }
    if (value === null || value === undefined || value === false || value === true) return '';
    return escape(value);
  }

  // Tagged template. Every interpolated value is escaped unless it is itself the result of
  // html (or an array of such results). null, undefined, false and true render as nothing.
  // It must be used as a tag: html`<p>${name}</p>`. Calling it with a hand-made array throws,
  // so there is no way to pass a plain string through unescaped.
  function html(strings) {
    if (!Array.isArray(strings) || !Array.isArray(strings.raw) || !Object.isFrozen(strings)) {
      throw new Error('html must be used as a template tag');
    }
    let out = strings[0];
    for (let i = 1; i < arguments.length; i++) {
      out += renderValue(arguments[i]) + strings[i];
    }
    return new SafeHtml(out, KEY);
  }

  // ---- data helpers ----------------------------------------------------------------------

  // Deep copy of plain data (the doc is JSON by definition).
  function clone(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  // Cuts text to at most `max` characters without leaving half of an emoji at the end.
  function clip(text, max) {
    if (text.length <= max) return text;
    let end = max;
    const code = text.charCodeAt(end - 1);
    if (code >= 0xd800 && code <= 0xdbff) end -= 1;
    return text.slice(0, end);
  }

  // debounce(fn, ms) returns a function that waits `ms` after the last call.
  // .flush() runs a waiting call now; .cancel() drops it; .pending() says whether one waits.
  function debounce(fn, ms) {
    let timer = null;
    let lastArgs = null;
    function run() {
      timer = null;
      const args = lastArgs;
      lastArgs = null;
      fn.apply(null, args);
    }
    function debounced() {
      lastArgs = Array.prototype.slice.call(arguments);
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(run, ms);
    }
    debounced.flush = function () {
      if (timer !== null) { clearTimeout(timer); run(); }
    };
    debounced.cancel = function () {
      if (timer !== null) { clearTimeout(timer); timer = null; lastArgs = null; }
    };
    debounced.pending = function () { return timer !== null; };
    return debounced;
  }

  // ---- platform (9.4) --------------------------------------------------------------------

  // 'phone' for a phone or tablet, 'computer' for everything else.
  // `nav` and `media` are only for tests; the app calls platform() with no arguments.
  function platform(nav, media) {
    if (!nav) nav = (typeof navigator !== 'undefined') ? navigator : null;
    if (!nav) return 'computer';
    if (nav.userAgentData && nav.userAgentData.mobile === true) return 'phone';
    const ua = String(nav.userAgent || '');
    if (/Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(ua)) return 'phone';
    const touch = Number(nav.maxTouchPoints) || 0;
    // iPadOS says it is a Mac, but a Mac has no touch screen.
    if (/Macintosh/.test(ua) && touch > 1) return 'phone';
    if (!media && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      media = function (query) { return window.matchMedia(query).matches; };
    }
    if (touch > 0 && media) {
      try {
        if (media('(pointer: coarse)') && media('(hover: none)')) return 'phone';
      } catch (e) { /* no media queries: a computer */ }
    }
    return 'computer';
  }

  L.core.util = {
    uid: uid,
    escape: escape,
    html: html,
    isSafeHtml: isSafeHtml,
    clone: clone,
    clip: clip,
    debounce: debounce,
    platform: platform
  };
})(window.Laser);

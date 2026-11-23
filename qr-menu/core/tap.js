/*
 * QR Menu — the main page (index.html): what an NFC tag, a card or an Instagram link opens.
 * Big Menu button, social tiles, then WhatsApp / Call / Directions.
 * Do not edit per client: each client's settings live in clients/<name>/config.js
 * (its "tap" section, plus brand, theme.accent and info, which the menu uses too).
 * This file builds the whole page, so client folders hold no markup of their own.
 * Plain ES5, so older phones run it too.
 */
(function boot() {
  "use strict";

  // Works even if the scripts are placed in <head>: wait until the page body exists.
  if (!document.body) {
    document.addEventListener("DOMContentLoaded", boot);
    return;
  }

  var mc = window.MENU_CONFIG;

  function fatal() {
    document.body.innerHTML =
      '<div class="fatal" role="alert">' +
      '<p lang="he" dir="rtl">התפריט אינו זמין כרגע</p>' +
      '<p lang="en" dir="ltr">The menu is unavailable right now</p>' +
      "</div>";
  }

  // A broken or missing config.js must not leave a blank page.
  if (!mc || typeof mc !== "object") {
    console.error("[tap] config.js did not load (window.MENU_CONFIG is not set).");
    fatal();
    return;
  }

  try { build(); } catch (err) {
    console.error("[tap] could not build the page:", err);
    fatal();
  }

  function build() {

  /* ---------- Small helpers ---------- */
  function own(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
  function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function extend(a) {
    for (var i = 1; i < arguments.length; i++) {
      var b = arguments[i];
      if (b) for (var k in b) if (own(b, k)) a[k] = b[k];
    }
    return a;
  }
  // Characters, not UTF-16 halves, so a name that starts with an emoji keeps it whole.
  function chars(s) { return String(s).match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\s\S]/g) || []; }
  // Text left over from a broken config ("NaN", "undefined") counts as empty.
  function clean(s) { s = String(s == null ? "" : s).trim(); return /^(NaN|-?Infinity|undefined|null)$/.test(s) ? "" : s; }
  function $(id) { return document.getElementById(id); }
  function up(el, sel) {                         // Element.closest() for older browsers
    if (el && el.nodeType === 3) el = el.parentNode;
    for (; el && el.nodeType === 1; el = el.parentNode) {
      var m = el.matches || el.webkitMatchesSelector || el.msMatchesSelector;
      if (m && m.call(el, sel)) return el;
    }
    return null;
  }
  function focusQuiet(el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
  function media(q) { return !!(window.matchMedia && matchMedia(q).matches); }

  /* ---------- Words per language (brand names stay in Latin so they match the logos) ---------- */
  var STRINGS = {
    en: { dir: "ltr", tagline: "Tap what you need.", menu: "Menu", menuSub: "Prices and services", google: "Rate us",
          googleLong: "Rate us on Google", web: "Website", call: "Call", directions: "Directions",
          nav: "Choose where to go", pending: "This link isn't set yet. Add it in config.js.",
          dial: "Call", copy: "Copy number", copied: "Copied", cancel: "Cancel",
          callHint: "Call didn't start? Copy the number instead.", copyHint: "Press and hold the number to copy it." },
    he: { dir: "rtl", tagline: "בחרו מה שאתם צריכים", menu: "תפריט", menuSub: "מחירים ושירותים", google: "דרגו אותנו",
          googleLong: "דרגו אותנו בגוגל", web: "אתר", call: "התקשרו", directions: "ניווט",
          nav: "בחרו לאן להמשיך", pending: "הקישור הזה עוד לא הוגדר. הוסיפו אותו בקובץ config.js.",
          dial: "חיוג", copy: "העתקת המספר", copied: "הועתק", cancel: "ביטול",
          callHint: "השיחה לא התחילה? העתיקו את המספר.", copyHint: "לחצו לחיצה ארוכה על המספר כדי להעתיק." },
    ar: { dir: "rtl", tagline: "اختر ما تحتاجه", menu: "القائمة", menuSub: "الأسعار والخدمات", google: "قيّمونا",
          googleLong: "قيّمونا على جوجل", web: "الموقع", call: "اتصال", directions: "الاتجاهات",
          nav: "اختر وجهتك", pending: "هذا الرابط غير مضبوط بعد. أضفه في ملف config.js.",
          dial: "اتصال", copy: "نسخ الرقم", copied: "تم النسخ", cancel: "إلغاء",
          callHint: "لم يبدأ الاتصال؟ انسخ الرقم.", copyHint: "اضغط مطولاً على الرقم لنسخه." }
  };
  var BRAND = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", whatsapp: "WhatsApp" };

  /* ---------- Language: the same rules as the menu, so both pages agree ---------- */
  var LANGS = (Array.isArray(mc.languages) && mc.languages.length ? mc.languages : [mc.defaultLang || "en"])
    .filter(function (l) { return own(STRINGS, l); });
  if (!LANGS.length) LANGS = ["en"];
  var DEFAULT_LANG = LANGS.indexOf(mc.defaultLang) >= 0 ? mc.defaultLang : LANGS[0];
  var lang = (function () {
    var fromUrl = null, saved = null;
    try { fromUrl = new URLSearchParams(location.search).get("lang"); } catch (e) {}
    try { saved = localStorage.getItem("menu-lang"); } catch (e) {}   // the language the customer picked in the menu
    // A language the customer picked themselves wins over ?lang= in the link.
    return [saved, fromUrl].filter(function (l) { return LANGS.indexOf(l) >= 0; })[0] || DEFAULT_LANG;
  })();

  // One text (a string, a number, or either one per language) → { s, l }: the text and the language it is in.
  function tl(v, l0) {
    if (typeof v === "string") return { s: clean(v), l: l0 || null };
    if (typeof v === "number") return { s: isFinite(v) ? String(v) : "", l: l0 || null };
    if (!isObj(v)) return { s: "", l: null };
    var order = [lang, DEFAULT_LANG].concat(LANGS), k;
    for (var i = 0; i < order.length; i++) {
      k = order[i];
      if (own(v, k) && tl(v[k]).s) return tl(v[k], k);
    }
    for (k in v) if (own(v, k) && tl(v[k]).s) return tl(v[k], own(STRINGS, k) ? k : null);
    return { s: "", l: null };
  }
  function t(v) { return tl(v).s; }
  // dir/lang for client text written in another language than the page, so it reads the right way round.
  function attrs(r) {
    if (!r.l || r.l === lang) return "";
    return ' dir="' + STRINGS[r.l].dir + '" lang="' + r.l + '"';
  }
  function setText(el, r) {
    el.textContent = r.s;
    if (r.l && r.l !== lang) { el.dir = STRINGS[r.l].dir; el.lang = r.l; }
  }

  /* ---------- Settings (missing keys fall back to these) ---------- */
  var tap = isObj(mc.tap) ? mc.tap : {}, brand = isObj(mc.brand) ? mc.brand : {}, info = isObj(mc.info) ? mc.info : {};
  var theme = isObj(mc.theme) ? mc.theme : {};
  var T = extend({}, STRINGS.en, STRINGS[lang], BRAND, isObj(tap.text) ? tap.text : {});

  // The first opening-hours row, for the footer: rows of { days, time }, a row as one text,
  // the list per language, or { "Sun–Thu": "12:00–23:00" }, like the menu's About page.
  function firstHours(h, row) {
    if (Array.isArray(h)) return row ? h.map(t).filter(Boolean).join(" ") : (h.length ? firstHours(h[0], true) : "");
    if (typeof h === "string" || typeof h === "number") return t(h);
    if (!isObj(h)) return "";
    var days = own(h, "days") ? h.days : h.day, time = own(h, "time") ? h.time : h.hours;
    if (time === undefined && (own(h, "from") || own(h, "open"))) time = h;      // { days, from, to } or { days, open, close }
    if (days === undefined && time === undefined) {
      var k, perLang = false;                    // the list per language, or { "Sun–Thu": "12:00–23:00" }
      for (k in h) if (own(h, k) && own(STRINGS, k)) perLang = true;
      if (perLang) { k = pickKey(h); return k == null ? "" : firstHours(h[k], row); }
      for (k in h) if (own(h, k)) return clean(k + " " + t(h[k]));
      return "";
    }
    if (isObj(time) && (own(time, "from") || own(time, "open"))) {
      time = [t(own(time, "open") ? time.open : time.from), t(own(time, "close") ? time.close : time.to)]
        .filter(Boolean).join(" \u2013 ");
    }
    return (t(days) + " " + t(time)).trim();
  }
  function pickKey(v) {
    var order = [lang, DEFAULT_LANG].concat(LANGS);
    for (var i = 0; i < order.length; i++) if (own(v, order[i])) return order[i];
    for (var k in v) if (own(v, k)) return k;
    return null;
  }

  // The first phone number in info.phone: "03-555-1234, 050-...", a list, or with words around it
  // ("Delivery 24/7: 050-123-4567", "03-555-1234 (ext. 5)"). Star numbers (*6060) work too.
  // For anything else (letters in the number), set tap.contact.phone.
  function firstPhone(v) {
    var parts = Array.isArray(v) ? v : String(t(v) || (typeof v === "string" ? v : "")).split(/[,;\n]/);
    for (var i = 0; i < parts.length; i++) {
      var s = t(parts[i]), re = /\*\d{2,6}|\+?(?:\(\d{1,4}\)\s?)?\d[\d\s.‐-―−-]*\d/g, m;
      while ((m = re.exec(s))) {
        var run = m[0].trim(), digits = run.replace(/\D/g, ""), most = /^(\+|00)/.test(run) ? 15 : 10;
        // "03-555-1234 24/7": a number written after it is not part of it.
        while (digits.length > most && /[\s.\u2010-\u2015\u2212-]\d+$/.test(run)) {
          run = run.replace(/[\s.\u2010-\u2015\u2212-]+\d+$/, "");
          digits = run.replace(/\D/g, "");
        }
        if (run.charAt(0) === "*" || digits.length >= 7) return run;
      }
    }
    return "";
  }
  function dialOf(phone) { return String(phone).replace(/[^\d+*#]/g, ""); }

  var name = t(brand.name) || "";
  var contact = extend({ phone: firstPhone(info.phone) }, isObj(tap.contact) ? tap.contact : {});
  var menuCfg = { url: own(tap, "menuUrl") ? String(tap.menuUrl || "") : "menu.html", label: tl(tap.menuLabel), sub: tl(tap.menuSub) };
  var footerR = tl(tap.footer);
  if (!footerR.s) {
    var addr = tl(info.address);
    footerR = { s: [addr.s, firstHours(info.hours)].filter(Boolean).join(" · "), l: addr.l };
  }

  var root = document.documentElement;
  root.lang = lang;
  root.dir = STRINGS[lang].dir;

  /* ---------- Accent colours: text on the accent always reads at 4.5:1 or better ---------- */
  // Any CSS colour works (#c62828, rgb(), hsl(), names): a 1×1 canvas reads it back as red, green, blue.
  function rgbOf(c) {
    c = String(c == null ? "" : c).trim();
    if (!c || /^(inherit|initial|unset|revert|revert-layer|currentcolor|transparent)$/i.test(c)) return null;
    try {
      var cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      var x = cv.getContext("2d");
      x.fillStyle = "#000"; x.fillStyle = c; var a = x.fillStyle;
      x.fillStyle = "#fff"; x.fillStyle = c;
      if (x.fillStyle !== a) return null;      // not a colour: the canvas kept the old one
      x.fillStyle = "#0f0f12"; x.fillRect(0, 0, 1, 1);   // see-through colours sit on the page background
      x.fillStyle = c; x.fillRect(0, 0, 1, 1);
      var d = x.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    } catch (e) { return null; }
  }
  function lin(c) { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }
  function lum(c) { return .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function mix(a, b, f) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * f); }); }
  function hex(c) { return "#" + c.map(function (v) { return (v < 16 ? "0" : "") + v.toString(16); }).join(""); }
  var WHITE = [255, 255, 255], DARK = [24, 18, 20], BLACK = [0, 0, 0];

  if (theme.accent != null && !rgbOf(theme.accent)) console.warn("[tap] theme.accent is not a colour:", theme.accent);
  var A = rgbOf(theme.accent) || [226, 112, 111];
  var ink, stopA, stopB;
  if (contrast(WHITE, A) >= 4.5) {               // dark enough accent: white text, gradient goes darker
    ink = WHITE; stopA = A; stopB = mix(A, BLACK, .14);
  } else if (contrast(DARK, A) >= 4.5) {         // light accent: dark text, gradient goes lighter
    ink = DARK; stopA = mix(A, WHITE, .1); stopB = A;
  } else {                                       // mid-tone accent: darken it until white text passes
    var f = 0, c = A;
    while (contrast(WHITE, c) < 4.5 && f < .7) { f += .04; c = mix(A, BLACK, f); }
    ink = WHITE; stopA = c; stopB = mix(c, BLACK, .12);
  }
  var css = root.style;
  css.setProperty("--accent", hex(A));
  css.setProperty("--accent-a", hex(stopA));
  css.setProperty("--accent-b", hex(stopB));
  css.setProperty("--accent-ink", hex(ink));
  css.setProperty("--accent-glow", "rgba(" + A.join(",") + ",.32)");
  var fg = A, ft = 0;                            // icons on the dark tiles need at least 3:1
  while (contrast(fg, [28, 28, 33]) < 3 && ft < .8) { ft += .05; fg = mix(A, WHITE, ft); }
  css.setProperty("--accent-fg", hex(fg));
  // The tab icon follows the accent, unless the client set their own icon file.
  var icon = document.querySelector('link[rel~="icon"]');
  if (!icon) { icon = document.createElement("link"); icon.rel = "icon"; document.head.appendChild(icon); }
  if (!icon.getAttribute("href") || icon.getAttribute("href").indexOf("data:") === 0) {
    icon.href = "data:image/svg+xml," + encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='16' fill='" + hex(A) +
      "'/><path d='M18 22h28M18 32h28M18 42h28' stroke='" + hex(ink) + "' stroke-width='5' stroke-linecap='round'/></svg>");
  }

  /* ---------- Icons ---------- */
  var ICON = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.7 2.3 4.6 5 5"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/></svg>',
    google: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
    web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3.2 3 13.8 0 17M12 3.5c-3 3.2-3 13.8 0 17"/></svg>',
    call: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.8z"/><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1-1.2 1.8.8c-.2 1-1 1.7-2 1.7A6 6 0 0 1 8.3 9.3c0-1 .7-1.8 1.7-2l.8 1.8z" stroke-width="1.4"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
  };

  /* ---------- Page skeleton ---------- */
  document.body.innerHTML =
    '<header class="hero">' +
      '<canvas class="hero-bg" id="heroBg" aria-hidden="true"></canvas>' +
      '<div class="hero-inner">' +
        '<div class="logo" id="logo" aria-hidden="true"></div>' +
        '<div class="titles"><h1 id="name"></h1><p class="tagline" id="tagline"></p></div>' +
      '</div>' +
    '</header>' +
    '<main id="links"></main>' +
    '<footer id="foot"></footer>' +
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>' +
    '<div class="sheet-bg" id="sheetBg" hidden></div>' +
    '<div class="sheet" id="callSheet" hidden role="alertdialog" aria-modal="true" aria-labelledby="sheetNum">' +
      '<p class="sheet-num" id="sheetNum"></p>' +
      '<div class="sheet-row">' +
        '<button type="button" class="sheet-btn sheet-cancel" id="sheetCancel"></button>' +
        '<a class="sheet-btn sheet-call" id="sheetCall" href="#"></a>' +
      '</div>' +
      '<p class="sheet-hint" id="sheetHint" role="status" hidden></p>' +
      '<button type="button" class="sheet-btn sheet-copy" id="sheetCopy" hidden></button>' +
    '</div>';

  /* ---------- Placeholder rules: hidden when demo is false, dashed + hint when demo is true ---------- */
  var DEMO = !!tap.demo;
  function isPlaceholder(v) { return !v || !String(v).trim() || /YOUR_|yourbusiness|example\.com/i.test(String(v)); }
  function isPlaceholderNumber(v) { return isPlaceholder(v) || /0{7,}/.test(String(v).replace(/\D/g, "")); }
  function present(v) { return v != null && String(v).trim() !== ""; }
  function shows(pending, value) { return !pending || (DEMO && present(value)); }
  // Inside a preview frame, phone links are often blocked, so Call also shows the number.
  var FRAMED = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  // Call sheet in previews and on computers (no dialer). Phones on the live page dial directly.
  var USE_SHEET = FRAMED || !media("(pointer: coarse)");

  function tag(cls, href, inner, o) {
    o = o || {};
    var aria = o.aria ? ' aria-label="' + esc(o.aria) + '"' : "";
    if (o.pending) return '<button type="button" class="' + cls + ' pending" data-pending="1"' + aria + '>' + inner + '</button>';
    var target = o.sameTab ? "" : ' target="_blank" rel="noopener"';
    return '<a class="' + cls + '" href="' + esc(href) + '"' + target + aria + '>' + inner + '</a>';
  }
  function grid(items, extra) {
    var n = items.length, cols = n <= 3 ? n : (n === 4 ? 2 : 3);
    return '<div class="grid' + (n > cols ? " multi" : "") + (n === 5 ? " five" : "") + (extra ? " " + extra : "") +
      '" style="--cols:' + cols + '">' + items.join("") + '</div>';
  }
  function label(r, fallback) { return r && r.s ? '<span' + attrs(r) + '>' + esc(r.s) + '</span>' : esc(fallback); }

  /* ---------- Header + footer ---------- */
  if (name) document.title = name;
  var h1 = $("name");
  setText(h1, tl(brand.name));
  var len = chars(name).length;
  if (len > 26) h1.className = "xlong"; else if (len > 16) h1.className = "long";
  var tagR = tl(tap.tagline);
  setText($("tagline"), tagR.s ? tagR : { s: T.tagline, l: null });
  function ltrNumbers(s) { return esc(s).replace(/\d[\d:.]*(?:\s*[–—-]\s*\d[\d:.]*)?/g, '<bdi dir="ltr">$&</bdi>'); }
  $("foot").innerHTML = footerR.s ? ICON.pin + "<span" + attrs(footerR) + ">" + ltrNumbers(footerR.s) + "</span>" : "";

  var logo = $("logo"), initial = (chars(name.trim())[0] || "").toUpperCase();
  logo.textContent = initial;
  if (brand.logo) {                              // a logo that fails to load leaves the first letter
    var logoImg = document.createElement("img");
    logoImg.alt = "";
    logoImg.onload = function () { logo.textContent = ""; logo.appendChild(logoImg); };
    logoImg.src = String(brand.logo);
  }

  // A header photo covers the lights; if it fails to load, the lights show instead.
  var heroImg = null;
  if (tap.heroImage) {
    heroImg = document.createElement("img");
    heroImg.className = "hero-img"; heroImg.alt = "";
    heroImg.onerror = function () {
      if (heroImg.parentNode) heroImg.parentNode.removeChild(heroImg);
      heroImg = null;
      if (typeof start === "function") start();
    };
    heroImg.src = String(tap.heroImage);
    var heroCv = $("heroBg");
    heroCv.parentNode.insertBefore(heroImg, heroCv.nextSibling);
  }

  /* ---------- Buttons ---------- */
  var main = $("links");
  main.setAttribute("aria-label", T.nav);
  var html = "";

  // The menu opens in the same language as this page.
  var menuUrl = menuCfg.url, menuPending = isPlaceholder(menuUrl);
  if (!menuPending && !/[?&]lang=/.test(menuUrl)) {
    var hash = menuUrl.indexOf("#"), base = hash < 0 ? menuUrl : menuUrl.slice(0, hash), rest = hash < 0 ? "" : menuUrl.slice(hash);
    menuUrl = base + (base.indexOf("?") >= 0 ? "&" : "?") + "lang=" + lang + rest;
  }
  if (shows(menuPending, menuCfg.url)) {
    html += tag("primary", menuUrl,
      '<span class="ico">' + ICON.menu + '</span><span class="txt"><b>' + label(menuCfg.label, T.menu) + '</b><span>' +
      label(menuCfg.sub, T.menuSub) + '</span></span><span class="go">' + ICON.go + '</span>',
      { sameTab: true, pending: menuPending });
  }

  var tiles = (Array.isArray(tap.socials) ? tap.socials : []).map(function (s) {
    if (!isObj(s)) return "";
    var pending = isPlaceholder(s.url);
    if (!shows(pending, s.url)) return "";
    var lab = tl(s.label), type = String(s.type || "web");
    var aria = type === "google" && !lab.s ? T.googleLong : "";
    return tag("tile", s.url, (own(ICON, type) ? ICON[type] : ICON.web) + label(lab, own(T, type) ? T[type] : T.web),
      { pending: pending, aria: aria });
  }).filter(Boolean);
  if (tiles.length) html += grid(tiles);

  var pills = [];
  // WhatsApp wants the number with its country code: 054-..., 00972... and +972... all work.
  var wa = String(contact.whatsapp == null ? "" : contact.whatsapp).replace(/\D/g, "");
  if (/^00/.test(wa)) wa = wa.slice(2); else if (/^0/.test(wa)) wa = "972" + wa.slice(1);
  var waPending = isPlaceholderNumber(contact.whatsapp);
  if (shows(waPending, contact.whatsapp))
    pills.push(tag("tile", "https://wa.me/" + wa, ICON.whatsapp + "<span>" + esc(T.whatsapp) + "</span>", { pending: waPending }));
  var phone = String(contact.phone == null ? "" : contact.phone).trim();
  var phPending = isPlaceholderNumber(phone);
  if (shows(phPending, phone))
    pills.push(tag("tile call", "tel:" + dialOf(phone), ICON.call + "<span>" + esc(T.call) + "</span>",
      { pending: phPending, sameTab: true, aria: T.call + " " + phone }));
  var lat = parseFloat(contact.lat), lon = parseFloat(contact.lon);
  var place = t(contact.place) || t(info.address);   // no place set: the address from info
  var waze = isFinite(lat) && isFinite(lon)
    ? "https://waze.com/ul?ll=" + lat + "," + lon + "&navigate=yes"
    : (present(place) ? "https://waze.com/ul?q=" + encodeURIComponent(place) + "&navigate=yes" : "");
  if (waze) pills.push(tag("tile", waze, ICON.pin + "<span>" + esc(T.directions) + "</span>"));
  if (pills.length) html += grid(pills, "contact");

  main.innerHTML = html;

  /* ---------- Call card (previews and computers) and the hint for unset links ---------- */
  var toast = $("toast"), toastTimer = 0;
  var sheet = $("callSheet"), sheetBg = $("sheetBg"), sheetCall = $("sheetCall"), sheetCopy = $("sheetCopy");
  var sheetHint = $("sheetHint"), sheetCancel = $("sheetCancel");
  var reduceMotion = media("(prefers-reduced-motion: reduce)");
  var behindSheet = [document.querySelector(".hero"), main, $("foot")];
  var lastFocus = null, closeTimer = 0, copyTimer = 0;
  sheetCancel.textContent = T.cancel;
  function raf(fn) { return (window.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(fn); }
  function setInert(on) { behindSheet.forEach(function (el) { if (el) el.inert = on; }); }
  function showHint(msg) {
    sheetHint.hidden = false;
    sheetHint.textContent = "";
    raf(function () { sheetHint.textContent = msg; });   // set after showing, so screen readers announce it
  }
  function openSheet(num, href) {
    clearTimeout(closeTimer); clearTimeout(copyTimer); stopCallWatch();
    $("sheetNum").textContent = num;
    sheetCall.href = href;
    if (FRAMED) { sheetCall.target = "_blank"; sheetCall.rel = "noopener"; }   // a preview frame only lets links out through a new window
    else { sheetCall.removeAttribute("target"); sheetCall.removeAttribute("rel"); } // computer: same tab, no blank tab left behind
    sheetCall.textContent = T.dial;
    sheetCall.setAttribute("aria-label", T.dial + " " + num);
    sheetCopy.textContent = T.copy;
    sheetCopy.hidden = true;                     // Copy only appears if the call gets blocked
    sheetHint.hidden = true; sheetHint.textContent = "";
    sheet.hidden = sheetBg.hidden = false;
    setInert(true);
    raf(function () { sheet.className = "sheet open"; sheetBg.className = "sheet-bg open"; });
    lastFocus = document.activeElement;
    focusQuiet(sheetCall);
    document.addEventListener("keydown", onSheetKey);
  }
  function closeSheet() {
    stopCallWatch(); clearTimeout(copyTimer);
    sheet.className = "sheet"; sheetBg.className = "sheet-bg";
    document.removeEventListener("keydown", onSheetKey);
    setInert(false);
    closeTimer = setTimeout(function () { sheet.hidden = sheetBg.hidden = true; }, reduceMotion ? 0 : 200);
    if (lastFocus && lastFocus.focus) focusQuiet(lastFocus);
  }
  function sheetIsOpen() { return !sheet.hidden && /\bopen\b/.test(sheet.className); }

  // Did tapping the Call button actually leave the page (dialer, call prompt)? If not, it was blocked.
  var callWatchTimer = 0, callLeft = false;
  function onCallBlur() { callLeft = true; }
  function onCallVis() { if (document.hidden) callLeft = true; }
  function stopCallWatch() {
    clearTimeout(callWatchTimer);
    window.removeEventListener("blur", onCallBlur);
    document.removeEventListener("visibilitychange", onCallVis);
  }
  function onSheetKey(e) {
    if (e.key === "Escape" || e.key === "Esc") { closeSheet(); return; }
    if (e.key !== "Tab") return;                 // Tab / Shift+Tab cycle inside the card
    var items = [sheetCancel, sheetCall, sheetCopy].filter(function (el) { return !el.hidden; });
    var i = items.indexOf(document.activeElement);
    e.preventDefault();
    var next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i < 0 || i === items.length - 1 ? 0 : i + 1);
    items[next].focus();
  }
  sheetBg.addEventListener("click", closeSheet);
  sheetCancel.addEventListener("click", closeSheet);
  sheetCall.addEventListener("click", function () {   // no preventDefault: the link still tries to dial
    stopCallWatch();
    callLeft = false;
    window.addEventListener("blur", onCallBlur);
    document.addEventListener("visibilitychange", onCallVis);
    callWatchTimer = setTimeout(function () {
      stopCallWatch();
      if (!sheetIsOpen()) return;                // closed meanwhile
      if (callLeft) { closeSheet(); return; }    // the phone took over: done
      sheetCopy.hidden = false;                  // blocked: keep the card, offer Copy
      showHint(T.callHint);
      focusQuiet(sheetCopy);
    }, 1500);
  });
  function copied() {
    sheetCopy.textContent = T.copied + " ✓";
    clearTimeout(copyTimer);
    copyTimer = setTimeout(function () { if (sheetIsOpen()) closeSheet(); }, 900);
  }
  function copyByHand() {                        // clipboard refused: select the number, try the older copy command
    var r = document.createRange(); r.selectNodeContents($("sheetNum"));
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    if (ok) copied();
    else showHint(T.copyHint);                   // still blocked: the number stays selected, tell them to press and hold
  }
  sheetCopy.addEventListener("click", function () {
    var text = $("sheetNum").textContent;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(copied, copyByHand);
        return;
      }
    } catch (e) {}
    copyByHand();
  });
  main.addEventListener("click", function (e) {
    var call = up(e.target, "a.call");
    if (call && USE_SHEET) {                     // preview frame or computer: show the call card instead
      e.preventDefault();
      openSheet(phone || call.getAttribute("href").slice(4), call.getAttribute("href"));
      return;
    }
    if (!up(e.target, "[data-pending]")) return;
    toast.textContent = T.pending;
    toast.className = "toast show";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.className = "toast"; }, 2600);
  });

  /* ---------- Default header background: warm restaurant lights (only when there is no heroImage) ---------- */
  var cv = $("heroBg");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  if (!ctx) return;
  var reduce = reduceMotion;
  var W = 0, H = 0, dots = [], frameId = 0, running = false, last = 0;
  var caf = window.cancelAnimationFrame || clearTimeout;

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function seed() {
    dots = [];
    for (var i = 0; i < 26; i++) dots.push({
      x: Math.random() * W, fy: Math.random() * .75,
      r: 8 + Math.random() * 34, a: .12 + Math.random() * .35,
      hue: 28 + Math.random() * 18, vx: (Math.random() - .5) * .24, ph: Math.random() * 6.28
    });
  }
  var LAMPS = [[.25, .16], [.55, .08], [.82, .2]];
  function draw(time) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2a1d14"); g.addColorStop(.55, "#18120e"); g.addColorStop(1, "#0f0f12");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    LAMPS.forEach(function (p) {
      var lg = ctx.createRadialGradient(p[0] * W, p[1] * H, 0, p[0] * W, p[1] * H, W * .28);
      lg.addColorStop(0, "rgba(255,190,120,.55)"); lg.addColorStop(.25, "rgba(255,160,90,.18)"); lg.addColorStop(1, "rgba(255,140,70,0)");
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    });
    dots.forEach(function (d) {
      var y = d.fy * H;
      var tw = reduce ? 1 : .75 + .25 * Math.sin(time / 1400 + d.ph);
      var rg = ctx.createRadialGradient(d.x, y, 0, d.x, y, d.r);
      rg.addColorStop(0, "hsla(" + d.hue + ",90%,70%," + (d.a * tw) + ")");
      rg.addColorStop(.7, "hsla(" + d.hue + ",90%,60%," + (d.a * .4 * tw) + ")");
      rg.addColorStop(1, "hsla(" + d.hue + ",90%,55%,0)");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(d.x, y, d.r, 0, 6.283); ctx.fill();
      if (!reduce) { d.x += d.vx; if (d.x < -40) d.x = W + 40; if (d.x > W + 40) d.x = -40; }
    });
  }
  function frame(time) {                         // about 30 frames a second
    frameId = raf(frame);
    if (time - last < 33) return;
    last = time; draw(time);
  }
  function start() { if (!ctx || reduce || running || heroImg) return; running = true; frameId = raf(frame); }
  function stop() { running = false; caf(frameId); }

  size(); seed(); draw(0); start();
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  window.addEventListener("resize", function () {
    var oldW = W;
    size();
    if (W !== oldW) seed();                      // address-bar height changes keep the same lights
    draw(last);
  });
  }
})();

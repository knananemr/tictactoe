/*
 * QR Menu — shared template logic.
 * Do not edit per client: each client's content lives in clients/<name>/config.js.
 * This file builds the whole page, so client folders hold no markup of their own.
 */
(function boot() {
  "use strict";

  // Works even if the scripts are placed in <head>: wait until the page body exists.
  if (!document.body) {
    document.addEventListener("DOMContentLoaded", boot);
    return;
  }

  var $ = function (id) { return document.getElementById(id); };
  var cfg = window.MENU_CONFIG;

  function fatal() {
    document.body.className = "";
    document.body.innerHTML =
      '<div class="fatal" role="alert">' +
      '<p lang="he" dir="rtl">התפריט אינו זמין כרגע</p>' +
      '<p lang="en" dir="ltr">The menu is unavailable right now</p>' +
      "</div>";
  }

  // A broken or missing config.js must not leave a blank page.
  if (!cfg || typeof cfg !== "object" || !Array.isArray(cfg.categories)) {
    console.error("[menu] config.js did not load or has no categories list.");
    fatal();
    return;
  }

  /* ---------- Interface texts (shared by every client) ---------- */
  var UI = {
    en: {
      dir: "ltr", langName: "English",
      home: "Home", menu: "Menu", about: "About & Hours",
      viewMenu: "View the menu", picks: "Today's picks", categories: "Categories",
      item: "item", items: "items", dish: "Dish",
      search: "Search the menu…", searchLabel: "Search the menu", noResults: "Nothing found. Try another word.",
      prep: "Preparation", approx: "~", min: "min", calories: "Calories", kcal: "kcal", ingredients: "Ingredients",
      aboutUs: "About us", hours: "Opening hours", contact: "Contact", address: "Address", phone: "Phone",
      openMenu: "Open navigation", close: "Close", categoriesNav: "Menu categories",
      tags: { popular: "Best seller", "new": "New", spicy: "Spicy", vegan: "Vegan" }
    },
    he: {
      dir: "rtl", langName: "עברית",
      home: "בית", menu: "תפריט", about: "אודות ושעות פתיחה",
      viewMenu: "לתפריט", picks: "המומלצים של היום", categories: "קטגוריות",
      item: "מנה", items: "מנות", dish: "מנה",
      search: "חיפוש בתפריט…", searchLabel: "חיפוש בתפריט", noResults: "לא נמצאו תוצאות. נסו מילה אחרת.",
      prep: "זמן הכנה", approx: "כ-", min: "דק׳", calories: "קלוריות", kcal: "קק״ל", ingredients: "מרכיבים",
      aboutUs: "עלינו", hours: "שעות פתיחה", contact: "יצירת קשר", address: "כתובת", phone: "טלפון",
      openMenu: "פתיחת ניווט", close: "סגירה", categoriesNav: "קטגוריות בתפריט",
      tags: { popular: "הכי נמכר", "new": "חדש", spicy: "חריף", vegan: "טבעוני" }
    }
  };

  var LANGS = (Array.isArray(cfg.languages) && cfg.languages.length ? cfg.languages : [cfg.defaultLang || "en"])
    .filter(function (l) { return own(UI, l); });
  if (!LANGS.length) LANGS = ["en"];
  var DEFAULT_LANG = LANGS.indexOf(cfg.defaultLang) >= 0 ? cfg.defaultLang : LANGS[0];
  var brandCfg = cfg.brand || {}, homeCfg = cfg.home || {}, infoCfg = cfg.info || {};

  var lang = pickLang();
  var view = null;
  var activeCat;

  // The About page is left out when the client gave nothing it can show.
  if (allText(infoCfg.hours).join("").trim() && !hoursRows(infoCfg.hours).length) {
    console.warn("[menu] info.hours has no rows to show. Write it as a list of { days, time } in config.js.");
  }
  var HAS_ABOUT = t(infoCfg.about).trim() !== "" || t(infoCfg.address).trim() !== "" ||
    texts(infoCfg.phone).some(function (r) { return /[^\s,\/|;.\-–—]/.test(r.s); }) || hoursRows(infoCfg.hours).length > 0;
  var VIEWS = HAS_ABOUT ? ["home", "menu", "about"] : ["home", "menu"];

  // Opening-hours rows, in the page language. Each row is { days, time }, or one text
  // ("Sun–Thu 12:00–23:00"). The list, a row, or a text can each be written per language.
  // Rows with neither days nor time are left out.
  function hoursRows(v, l) {
    if (Array.isArray(v)) return v.reduce(function (a, x) {
      // A row written as a list of texts (["Sun–Thu", "12:00–23:00"]) is one row; a list of rows is read as rows.
      var one = Array.isArray(x) && x.every(function (y) { return typeof y === "string" || typeof y === "number"; });
      return a.concat(hoursRows(one ? { days: "", time: x } : x, l));
    }, []);
    if (v && typeof v === "object" && !own(v, "days") && !own(v, "time") && !own(v, "day") && !own(v, "hours") &&
        !own(v, "open") && !own(v, "close")) {
      var ks = Object.keys(v);
      if (ks.some(function (k) { return own(UI, k); })) { // written per language
        var k = pickKey(v, function (x) { return hoursRows(x).length > 0; });
        return k == null ? [] : hoursRows(v[k], own(UI, k) ? k : l);
      }
      // Days → times ({ "Sun–Thu": "12:00–23:00", "Fri": "9:00–14:00" }): one row each.
      return ks.reduce(function (a, d) { return a.concat(hoursRows({ days: d, time: v[d] }, l)); }, []);
    }
    var h = v && typeof v === "object" ? v : { days: "", time: v };
    // Other names for the same fields: { day, hours } or { days, open, close }.
    var days = own(h, "days") ? h.days : h.day, time = own(h, "time") ? h.time : own(h, "hours") ? h.hours :
      [t(h.open).trim(), t(h.close).trim()].filter(Boolean).join(" – ");
    return clean(t(days)) || clean(t(time)) ? [{ days: days, time: time, l: l || null }] : [];
  }
  // Text left over from a broken config ("NaN", "undefined") counts as empty.
  function clean(s) { s = String(s).trim(); return /^(NaN|-?Infinity|undefined|null)$/.test(s) ? "" : s; }

  /* ---------- Small helpers ---------- */
  // Own keys only, so a tag or id such as "constructor" is not mistaken for a built-in.
  function own(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Client text is { s: text, l: the language it was written in, or null when it is written once for all }.
  // Its direction comes from that language, so "BBQ צלעות" reads right to left on the Hebrew page and
  // an English "Fish & Chips!" shown there keeps its "!" at the end. Text written once for all languages
  // takes its direction from its first letter. Text in another language than the page also gets its
  // lang, so screen readers use the right voice.
  function attrs(r) {
    if (!r.l) return ' dir="auto"';
    return ' dir="' + UI[r.l].dir + '"' + (r.l !== lang ? ' lang="' + r.l + '"' : "");
  }
  function bdi(r) {
    if (typeof r !== "object" || !r) r = { s: r == null ? "" : String(r), l: null };
    return r.s === "" ? "" : "<bdi" + attrs(r) + ">" + esc(r.s) + "</bdi>";
  }
  function ui(s) { return { s: s, l: lang }; } // interface text, always in the page language
  function setText(el, r) {
    el.textContent = r.s;
    el.dir = r.l ? UI[r.l].dir : "auto";
    if (r.l && r.l !== lang) el.lang = r.l; else el.removeAttribute("lang");
  }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function motion() {
    return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
  }

  function pickLang() {
    var fromUrl = null, saved = null;
    try { fromUrl = new URLSearchParams(location.search).get("lang"); } catch (e) {}
    try { saved = localStorage.getItem("menu-lang"); } catch (e) {}
    // A language the customer picked themselves wins over ?lang= in the link,
    // so an old history entry that still carries ?lang= cannot switch it back.
    var want = [saved, fromUrl].filter(function (l) { return LANGS.indexOf(l) >= 0; })[0];
    return want || DEFAULT_LANG;
  }
  function nextLang() { return LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]; }

  // Pick the current language out of { en, he }; fall back to the default
  // language, then to any language that has a value. Returns the key used.
  function pickKey(v, ok) {
    if (own(v, lang) && ok(v[lang])) return lang;
    if (own(v, DEFAULT_LANG) && ok(v[DEFAULT_LANG])) return DEFAULT_LANG;
    for (var k in v) if (own(v, k) && ok(v[k])) return k;
    return null;
  }
  // One text (a string, a number, or either one per language) → { s, l }.
  // A list of texts is read as one text, its parts joined by spaces.
  function tl(v, l0) {
    if (typeof v === "string") return { s: v, l: l0 || null };
    if (typeof v === "number") return { s: isFinite(v) ? String(v) : "", l: l0 || null };
    if (Array.isArray(v)) {
      var xs = texts(v, l0);
      return { s: xs.map(function (x) { return x.s; }).join(" "),
        l: xs.length && xs.every(function (x) { return x.l === xs[0].l; }) ? xs[0].l : null };
    }
    if (!v || typeof v !== "object") return { s: "", l: null };
    var k = pickKey(v, function (x) { return tl(x).s.trim() !== ""; });
    return k == null ? { s: "", l: null } : tl(v[k], own(UI, k) ? k : null);
  }
  function t(v) { return tl(v).s; }
  // A list of texts (one text, a list, or a list per language) → [{ s, l }], empty entries left out.
  // An object without language keys ({ office: "03-…", mobile: "050-…" }) is a list of its values.
  function texts(v, l0) {
    if (Array.isArray(v)) return v.reduce(function (a, x) { return a.concat(texts(x, l0)); }, []);
    if (v && typeof v === "object" && !Object.keys(v).some(function (k) { return own(UI, k); })) {
      return texts(Object.keys(v).map(function (k) { return v[k]; }), l0);
    }
    if (v && typeof v === "object") {
      var k = pickKey(v, function (x) { return texts(x).length > 0; });
      return k == null ? [] : texts(v[k], own(UI, k) ? k : l0);
    }
    var r = tl(v, l0);
    return r.s.trim() === "" ? [] : [{ s: r.s.trim(), l: r.l }];
  }

  // A number, or a string that holds only a number ("32", "32.5").
  function num(v) {
    if (typeof v === "number") return isFinite(v) ? v : NaN;
    return typeof v === "string" && /^\s*\d+(\.\d+)?\s*$/.test(v) ? Number(v) : NaN;
  }
  function priceText(p) {
    var r = tl(p), s = clean(r.s);
    if (!s) return { s: "", l: null };
    var n = num(s);
    if (!isNaN(n)) return { s: (cfg.currency || "") + (Number.isInteger(n) ? String(n) : n.toFixed(2)), l: null };
    return { s: s, l: r.l, free: true }; // free text such as "Market price" is shown as written
  }
  function price(p) {
    var r = priceText(p);
    if (!r.s) return "";
    return '<bdi class="price' + (r.free ? " free" : "") + '"' + attrs(r) + ">" + esc(r.s) + "</bdi>";
  }
  // "~30 min" for a number; a range such as "20-30" gets the unit; other text is shown as written.
  function approx(v, unit) {
    var r = tl(v), s = clean(r.s);
    if (!s) return { s: "", l: null };
    var n = num(s);
    if (n === 0) return { s: "", l: null }; // 0 means "not given", as before
    if (!isNaN(n)) return ui(UI[lang].approx + n.toLocaleString("en") + " " + unit);
    return /^[\d\s.,\-–]+$/.test(s) ? ui(s + " " + unit) : { s: s, l: r.l };
  }
  // A built-in tag ("spicy") in the page language, or the client's own tag as written.
  function tagText(g) {
    if (typeof g === "object") return tl(g);
    var tags = UI[lang].tags;
    return own(tags, g) ? ui(tags[g]) : { s: g, l: null };
  }
  // A dish's tags → a list of built-in keys ("spicy"), the client's own texts, and the client's
  // own tags per language ({ he: "ללא גלוטן", en: "Gluten free" }). A single tag works like a list,
  // nested lists are read as one list, and a list per language ({ en: [...], he: [...] }, like
  // ingredients) is paired up by place.
  function tagList(v) {
    var flat = (function f(x) {
      if (Array.isArray(x)) return x.reduce(function (a, y) { return a.concat(f(y)); }, []);
      var langs = x && typeof x === "object" ? Object.keys(x).filter(function (k) { return own(UI, k); }) : [];
      if (!langs.some(function (k) { return Array.isArray(x[k]); })) return [x];
      // Each language's list, flattened; a single text next to a list counts as a list of one.
      var lists = {}, n = 0, z = [];
      langs.forEach(function (k) { lists[k] = f(Array.isArray(x[k]) ? x[k] : [x[k]]); n = Math.max(n, lists[k].length); });
      for (var i = 0; i < n; i++) {
        var o = {};
        langs.forEach(function (k) { if (lists[k][i] != null) o[k] = lists[k][i]; });
        z.push(o);
      }
      return z;
    })(v);
    return flat.map(function (g) {
      if (typeof g === "number") return isFinite(g) ? String(g) : "";
      if (typeof g === "string") return g.trim();
      if (!g || typeof g !== "object") return "";
      // { en: "spicy", he: "spicy" } is the built-in tag, shown in each language.
      var vals = Object.keys(g).map(function (k) { return typeof g[k] === "string" ? g[k].trim() : ""; }).filter(Boolean);
      if (vals.length && own(UI.en.tags, vals[0]) && vals.every(function (s) { return s === vals[0]; })) return vals[0];
      return t(g).trim() !== "" ? g : "";
    }).filter(Boolean);
  }

  /* ---------- Search normalisation ---------- */
  var FINALS = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[֑-ׇ]/g, "")                                  // Hebrew vowel points and marks
      .replace(/['"`׳״‘’“”‐-―-]/g, "") // apostrophes, geresh, quotes, dashes
      .replace(/[ךםןףץ]/g, function (ch) { return FINALS[ch]; })        // final letters match regular ones
      .replace(/\s+/g, " ");
  }
  function allText(v) {
    if (v == null) return [];
    if (typeof v === "string" || typeof v === "number") return [String(v)];
    if (Array.isArray(v)) return v.reduce(function (a, x) { return a.concat(allText(x)); }, []);
    if (typeof v === "object") return Object.keys(v).reduce(function (a, k) { return a.concat(allText(v[k])); }, []);
    return [];
  }
  function haystack(it, catName) {
    // Every language, so a search works whichever language is on screen.
    // The category name is included, so typing "desserts" lists the desserts.
    var parts = allText(it.name).concat(allText(it.desc), allText(it.ingredients), allText(catName));
    it.tags.forEach(function (g) {
      if (typeof g === "object") { parts = parts.concat(allText(g)); return; }
      Object.keys(UI).forEach(function (l) { if (own(UI[l].tags, g)) parts.push(UI[l].tags[g]); });
    });
    return norm(parts.join(" "));
  }

  /* ---------- Normalise the client's categories ---------- */
  var cats = [], itemsByKey = Object.create(null), hayByKey = Object.create(null);
  // Ids end up in element ids and attribute selectors, so keep only letters (any script), digits, _ and -.
  var UNSAFE_ID = (function () {
    try { return new RegExp("[^\\p{L}\\p{N}_-]", "gu"); } catch (e) { return /[^A-Za-z0-9_-]/g; }
  })();
  function unique(base, seen) {
    var id = base, n = 2;
    while (seen[id]) id = base + "-" + n++;
    seen[id] = true;
    return id;
  }
  function given(v) { return v != null && String(v).trim() !== ""; }
  function hasText(v) { return t(v).trim() !== ""; } // the same test as what is shown
  function normalise() {
    var seenCat = Object.create(null), seenKey = Object.create(null);
    var rawCat = Object.create(null), rawItem = Object.create(null);
    cfg.categories.forEach(function (c, ci) {
      if (!c || !Array.isArray(c.items)) return;
      if (given(c.id) && rawCat[c.id]) {
        console.warn('[menu] Two categories use the id "' + c.id + '". Give each category its own id in config.js.');
      }
      if (given(c.id)) rawCat[c.id] = true;
      var id = unique(given(c.id) ? String(c.id).trim().replace(UNSAFE_ID, "-") : "c" + ci, seenCat);
      var name = c.name;
      if (!hasText(name)) {
        // A nameless category would show an empty chip and heading: use its id, or "Menu 3".
        console.warn("[menu] Category " + (ci + 1) + " has no name. Give it a name in config.js.");
        if (given(c.id)) name = String(c.id).trim(); // as written, so it takes its own direction
        else {
          name = {};
          Object.keys(UI).forEach(function (l) { name[l] = UI[l].menu + " " + (ci + 1); });
        }
      }
      var items = [];
      c.items.forEach(function (raw, ii) {
        if (!raw || typeof raw !== "object") return;
        // Work on a copy: the same dish object may be listed in two categories.
        var it = merge(raw, {}), seen = given(it.id) ? rawItem[it.id] : null;
        it._raw = raw;
        if (seen && seen.raw !== raw) {
          console.warn('[menu] Two dishes use the id "' + it.id + '" (in "' + seen.cat + '" and "' + id +
            '"). Give each dish its own id in config.js.');
        }
        if (given(it.id) && !seen) rawItem[it.id] = { cat: id, raw: raw };
        if (!hasText(it.name)) {
          console.warn('[menu] A dish in "' + id + '" has no name. Give it a name in config.js.');
          if (given(it.id)) it.name = String(it.id).trim();
          else {
            // Without a name or an id the card would have nothing to read out: "Dish 4".
            it.name = {};
            Object.keys(UI).forEach(function (l) { it.name[l] = UI[l].dish + " " + (ii + 1); });
          }
        }
        it.tags = tagList(it.tags);
        if (it.price && typeof it.price === "object" && !Array.isArray(it.price) &&
            !Object.keys(it.price).some(function (k) { return own(UI, k); })) {
          console.warn('[menu] The price of "' + t(it.name) + '" has no language keys, so only its first value is shown.');
        }
        var key = unique(id + "/" + (given(it.id) ? String(it.id).trim() : ii), seenKey);
        it._key = key;
        itemsByKey[key] = it;
        hayByKey[key] = haystack(it, name);
        items.push(it);
      });
      if (items.length) cats.push({ id: id, name: name, emoji: c.emoji, items: items }); // empty categories are skipped
    });
  }

  /* ---------- Page shell ---------- */
  var SEARCH_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5" fill="none" ' +
    'stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5 20 20" stroke="currentColor" stroke-width="2.2" ' +
    'stroke-linecap="round"/></svg>';

  var SHELL =
    '<header class="topbar" id="topbar">' +
      '<button class="icon-btn" id="menuBtn" aria-controls="drawer" aria-expanded="false">' +
        '<span class="burger" aria-hidden="true"><i></i><i></i><i></i></span></button>' +
      '<a class="brand" id="brand" href="#home"></a>' +
      '<button class="lang-btn" id="langBtn"></button>' +
    "</header>" +
    '<div class="backdrop" id="backdrop" hidden></div>' +
    '<div class="drawer" id="drawer" role="dialog" aria-modal="true" aria-hidden="true" inert>' +
      '<div class="drawer-head"><span class="drawer-brand" id="drawerBrand"></span>' +
        '<button class="icon-btn close" id="drawerClose"><span aria-hidden="true">✕</span></button></div>' +
      '<nav class="drawer-links" id="drawerLinks"></nav>' +
    "</div>" +
    '<main id="main">' +
      '<section class="view" id="view-home" hidden></section>' +
      '<section class="view" id="view-menu" hidden>' +
        '<h1 class="sr-only" id="menuTitle"></h1>' +
        '<div class="menu-layout">' +
          '<nav class="side-cats" id="sideCats"></nav>' +
          '<div class="menu-main">' +
            '<div class="search-wrap"><input type="search" id="search" class="search" autocomplete="off" enterkeyhint="search"></div>' +
            '<nav class="chips-bar" id="chipsBar">' +
              '<button class="chip-icon" id="searchJump">' + SEARCH_ICON + "</button>" +
              '<div class="chips" id="chips"></div>' +
            "</nav>" +
            '<div id="sections"></div>' +
          "</div>" +
        "</div>" +
      "</section>" +
      '<section class="view" id="view-about" hidden></section>' +
    "</main>" +
    '<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-hidden="true" inert>' +
      '<div class="sheet-handle" aria-hidden="true"></div>' +
      '<button class="icon-btn close sheet-close" id="sheetClose"><span aria-hidden="true">✕</span></button>' +
      // tabindex: long dish text can be scrolled with the keyboard too.
      '<div class="sheet-body" id="sheetBody" tabindex="0"></div>' +
    "</div>";

  // A CSS colour as [r, g, b] bytes, drawn over `under` (so a see-through colour counts as it looks),
  // or null when it is not a colour. A canvas reads every colour syntax the browser knows.
  function isColour(c) { return typeof c === "string" && (!window.CSS || !CSS.supports || CSS.supports("color", c)); }
  function rgbOf(c, under) {
    try {
      if (!isColour(c)) return null;
      var cv = document.createElement("canvas"), x;
      cv.width = cv.height = 1;
      x = cv.getContext("2d");
      x.fillStyle = under ? "rgb(" + under.join(",") + ")" : "#fff";
      x.fillRect(0, 0, 1, 1);
      x.fillStyle = c;
      x.fillRect(0, 0, 1, 1);
      var d = x.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    } catch (e) { return null; }
  }
  function luminance(c) {
    var v = c.map(function (x) { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(a, b) {
    var x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function applyTheme() {
    var map = { bg: "--bg", card: "--card", ink: "--ink", muted: "--muted", line: "--line", accent: "--accent", radius: "--radius" };
    var th = cfg.theme || {}, root = document.documentElement.style;
    Object.keys(map).forEach(function (k) {
      if (!th[k]) return;
      var ok = k === "radius" ? !window.CSS || !CSS.supports || CSS.supports("border-radius", th[k]) : isColour(th[k]);
      if (ok) root.setProperty(map[k], th[k]);
      else console.warn("[menu] theme." + k + ' "' + th[k] + '" is not a CSS ' + (k === "radius" ? "size" : "colour") + "; the default is used.");
    });
    // Text on the accent ("Best seller" in the dish sheet) is white or black, whichever reads better.
    // "Best seller" on a card is the accent itself, moved toward the ink only as far as it needs to
    // read on the card colour (4.5:1).
    var card = rgbOf(th.card) || [255, 255, 255], ink = rgbOf(th.ink, card) || [17, 17, 17];
    var acc = rgbOf(th.accent, card) || rgbOf("#c62828", card);
    if (acc) {
      root.setProperty("--on-accent", contrast(acc, [255, 255, 255]) >= contrast(acc, [0, 0, 0]) ? "#fff" : "#000");
      var txt = acc;
      for (var k = 1; k <= 10 && contrast(txt, card) < 4.5; k++) {
        txt = acc.map(function (v, i) { return Math.round(v + (ink[i] - v) * k / 10); });
      }
      root.setProperty("--accent-text", "rgb(" + txt.join(",") + ")");
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = isColour(th.card) ? th.card : "#ffffff";
  }

  /* ---------- Rendering ---------- */
  // The emoji is always there; a photo, when set, sits on top of it.
  // If the photo fails to load it is removed and the emoji shows.
  function thumb(it) {
    return '<span class="thumb"><span class="thumb-emoji" aria-hidden="true">' + esc(t(it.emoji).trim() || "🍽️") + "</span>" +
      (it.image ? '<img src="' + esc(it.image) + '" alt="" loading="lazy" decoding="async">' : "") + "</span>";
  }
  // Text that is cut short with "…" carries its own direction (not an inner <bdi>),
  // so the "…" lands at the end of the text even when it is in the other script.
  function card(it) {
    var g = it.tags[0], name = tl(it.name), tag = g ? tagText(g) : { s: "", l: lang };
    return '<button class="card" data-item="' + esc(it._key) + '">' + thumb(it) +
      '<span class="card-name"' + attrs(name) + ">" + esc(name.s) + "</span>" +
      '<span class="card-tag' + (g === "popular" ? " hot" : "") + '"' + attrs(tag) + ">" + esc(tag.s) + "</span>" +
      price(it.price) + "</button>";
  }
  function countLabel(n) { var u = UI[lang]; return n + " " + (n === 1 ? u.item : u.items); }
  function brandText() {
    var name = tl(brandCfg.name);
    return '<span class="brand-text"' + attrs(name) + ">" + esc(name.s) + "</span>";
  }
  function brandHtml() {
    var name = tl(brandCfg.name), other = name.s && name.l && name.l !== lang;
    return brandCfg.logo
      ? '<img src="' + esc(brandCfg.logo) + '" alt="' + esc(name.s || UI[lang].home) + '"' +
        (other ? ' lang="' + name.l + '"' : "") + ">"
      : brandText();
  }

  function renderChrome() {
    var u = UI[lang], name = t(brandCfg.name), root = document.documentElement;
    root.lang = lang;
    root.dir = u.dir;
    document.title = (name ? name + " · " : "") + u.menu;

    $("brand").innerHTML = brandHtml();
    // Without a name the link would have nothing to read out.
    if (name) $("brand").removeAttribute("aria-label"); else $("brand").setAttribute("aria-label", u.home);
    setText($("drawerBrand"), tl(brandCfg.name));
    $("drawer").setAttribute("aria-label", u.menu);
    $("menuBtn").setAttribute("aria-label", u.openMenu);
    $("drawerClose").setAttribute("aria-label", u.close);
    $("sheetClose").setAttribute("aria-label", u.close);

    var next = nextLang(), lb = $("langBtn");
    lb.hidden = LANGS.length < 2;
    lb.textContent = UI[next].langName;
    lb.lang = next;
    lb.dir = UI[next].dir;

    $("search").placeholder = u.search;
    $("search").setAttribute("aria-label", u.searchLabel);
    $("searchJump").setAttribute("aria-label", u.searchLabel);
    $("menuTitle").textContent = u.menu;
    $("sideCats").setAttribute("aria-label", u.categoriesNav);
    $("chipsBar").setAttribute("aria-label", u.categoriesNav);

    $("drawerLinks").innerHTML = VIEWS.map(function (v) { return [v, u[v]]; }).map(function (l) {
      var html = '<button class="drawer-link" data-view="' + l[0] + '">' + esc(l[1]) + "</button>";
      if (l[0] === "menu" && cats.length) {
        html += '<div class="drawer-sub">' + cats.map(function (c) {
          return '<button data-cat="' + c.id + '"><span>' + bdi(tl(c.name)) + '</span><span class="count">' +
            pad2(c.items.length) + "</span></button>";
        }).join("") + "</div>";
      }
      return html;
    }).join("");
    markView();
  }

  function renderHome() {
    var u = UI[lang], picks = [], picked = [];
    // A dish listed in two categories is still one pick.
    cats.forEach(function (c) {
      c.items.forEach(function (it) {
        if (it.featured && picked.indexOf(it._raw) < 0) { picked.push(it._raw); picks.push(it); }
      });
    });
    var subtitle = tl(homeCfg.subtitle), title = tl(homeCfg.headline);
    if (!title.s.trim()) title = tl(brandCfg.name);
    $("view-home").innerHTML =
      '<div class="hero">' + (title.s ? "<h1>" + bdi(title) + "</h1>" : '<h1 class="sr-only">' + esc(u.home) + "</h1>") +
      (subtitle.s ? "<p>" + bdi(subtitle) + "</p>" : "") +
      '<button class="btn" data-view="menu">' + esc(u.viewMenu) + "</button></div>" +
      (picks.length ? '<div class="section-title"><h2>' + esc(u.picks) + '</h2></div><div class="h-scroll">' +
        picks.map(card).join("") + "</div>" : "") +
      (cats.length ? '<div class="section-title"><h2>' + esc(u.categories) + '</h2></div><div class="cat-tiles">' +
        cats.map(function (c) {
          return '<button class="cat-tile" data-cat="' + c.id + '">' +
            (t(c.emoji).trim() ? '<span class="emoji" aria-hidden="true">' + esc(t(c.emoji).trim()) + "</span>" : "") +
            "<span>" + bdi(tl(c.name)) + "<small>" + esc(countLabel(c.items.length)) + "</small></span></button>";
        }).join("") + "</div>" : "");
  }

  // Sections are built once per language; searching only shows and hides cards.
  function renderMenu() {
    var u = UI[lang];
    $("sections").innerHTML = cats.map(function (c) {
      return '<section class="cat-section" id="cat-' + c.id + '" data-cat-id="' + c.id + '" aria-labelledby="h-' + c.id + '">' +
        '<div class="section-title"><h2 id="h-' + c.id + '">' + bdi(tl(c.name)) + '</h2><span class="count">' +
        pad2(c.items.length) + "</span></div>" +
        '<div class="grid">' + c.items.map(card).join("") + "</div></section>";
    }).join("") + '<p class="empty" id="noResults" hidden>' + esc(u.noResults) + "</p>";

    $("chips").innerHTML = cats.map(function (c) {
      var name = tl(c.name);
      return '<button class="chip" data-cat="' + c.id + '"' + attrs(name) + ">" + esc(name.s) + "</button>";
    }).join("");
    $("sideCats").innerHTML = cats.map(function (c) {
      return '<button data-cat="' + c.id + '"><span>' + bdi(tl(c.name)) + '</span><span class="count">' +
        pad2(c.items.length) + "</span></button>";
    }).join("");
    filterMenu();
  }

  function filterMenu() {
    var terms = norm($("search").value).trim().split(" ").filter(Boolean);
    var any = false, last = null;
    cats.forEach(function (c) {
      var sec = $("cat-" + c.id), n = 0;
      sec.classList.remove("is-last");
      sec.querySelectorAll(".card").forEach(function (el) {
        var hay = hayByKey[el.dataset.item] || "";
        var ok = terms.every(function (w) { return hay.indexOf(w) >= 0; });
        el.hidden = !ok;
        if (ok) n++;
      });
      sec.hidden = n === 0;
      sec.querySelector(".count").textContent = pad2(n);
      document.querySelectorAll('#chips [data-cat="' + c.id + '"], #sideCats [data-cat="' + c.id + '"]').forEach(function (b) {
        b.hidden = n === 0;
        var count = b.querySelector(".count");
        if (count) count.textContent = pad2(n);
      });
      if (n) { any = true; last = sec; }
    });
    // The last category shown gets room below it, so a tap on it can bring its title to the top.
    if (last) last.classList.add("is-last");
    $("noResults").hidden = any;
    unlockSpy();
    activeCat = undefined;
    spy();
  }
  function clearSearch() {
    if ($("search").value) {
      $("search").value = "";
      filterMenu();
      saveQuery();
    }
  }
  // The search text is kept for its history entry at once, since Back or a reload can come before
  // the next save. It goes to memory and sessionStorage, not to history on every key: Safari
  // refuses history calls after 100 in a short time, and then dish and view entries would be lost.
  function saveQuery() {
    var q = $("search").value;
    if (!curId || qs[curId] === q) return;
    delete qs[curId];
    qs[curId] = q; // last in the list, so trimming old entries never drops the current one
    // Without sessionStorage (blocked by the browser), the entry itself keeps it, as before.
    if (!writeStore(Q_KEY, qs)) try { history.replaceState(merge(state(), { q: q }), ""); } catch (e) {}
  }

  // Numbers in a phone or hours text ("*6060", "12:00 – 23:00") always read left to right;
  // the words around them ("24 שעות", "מוקד הזמנות") keep the direction of their own language.
  // Every kind of hyphen (‐ ‑ ‒ – — ― −) joins the parts of a number; a colon only inside a time
  // ("12:00"), so in "24/7: 050-…" the colon stays with the words. Latin letters stuck to a digit
  // ("24h", "24x7", "9am") read with it.
  var NUM_TOK = "\\d(?:[A-Za-z]{1,3}(?![A-Za-z]))?";
  var NUM_RUN = new RegExp("(?:\\(\\+|[+*#(])?" + NUM_TOK + "(?:(?:" + NUM_TOK + "|[\\s().*#\\/‐-―−-]|:(?=\\d))*(?:" +
    NUM_TOK + "|[)#]))?", "g");
  var NUM_END = /[\s.:\/‐-―−-]+$/;
  function count(s, ch) { return s.split(ch).length - 1; }
  // Where a number run must end so its brackets pair up. A bracket opened or closed among the
  // words ("(שלוחה 5)", "050-123-4567 (24 שעות)") stays with the words, so it mirrors with them.
  function pairedEnd(m) {
    var open = [];
    for (var k = 0; k < m.length; k++) {
      var c = m.charAt(k);
      if (c === "(") open.push(k);
      else if (c === ")") { if (!open.length) return k; open.pop(); }
    }
    return open.length ? open[0] : m.length;
  }
  function nums(s) {
    var out = "", last = 0, m, re = new RegExp(NUM_RUN.source, "g");
    while ((m = re.exec(s))) {
      var i = m.index, end = pairedEnd(m[0]);
      if (end === 0) { re.lastIndex = i + 1; continue; } // an opening bracket of the words: look after it
      var r = m[0].slice(0, end).replace(NUM_END, "");
      out += esc(s.slice(last, i)) + '<bdi dir="ltr">' + esc(r) + "</bdi>";
      last = re.lastIndex = i + r.length;
    }
    return out + esc(s.slice(last));
  }
  // A phone text: each phone number is one left-to-right piece, exactly as it is dialled, so
  // "סניף 2 03-555-1234" keeps the 2 with its word, and "1-800-FLOWERS" and "*6060#" stay whole.
  // Other numbers in it ("24/7", "24h", "שלוחה 5") read as in any other text.
  function phoneNums(p) {
    var n = dialText(p), units = [], m, re = /\*\d{2,6}#?/g, out = "", last = 0;
    while ((m = re.exec(n))) units.push([m.index, m.index + m[0].length]);
    phoneRuns(n).forEach(function (r) {
      if (r.d < 3) return;
      var i = r.i, j = r.j, o = count(p.slice(i, j), "("), c = count(p.slice(i, j), ")");
      if (c > o && p.charAt(i - 1) === "(") i--; // "(+972) 3-…"
      else if (o > c && p.charAt(j) === ")") j++;
      if (p.charAt(j) === "#") j++;
      if (count(p.slice(i, j), "(") !== count(p.slice(i, j), ")")) return; // left to nums()
      if (!units.some(function (u) { return i < u[1] && j > u[0]; })) units.push([i, j]);
    });
    units.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (u) {
      out += nums(p.slice(last, u[0])) + '<bdi dir="ltr">' + esc(p.slice(u[0], u[1])) + "</bdi>";
      last = u[1];
    });
    return out + nums(p.slice(last));
  }
  // Text with no letters ("12:00 – 15:30, 18:00 – 23:30") always reads left to right, however
  // it was written; text with words ("24 שעות", "Orders: 03-555-1234") takes its own direction.
  var LETTER = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ֐-׿؀-ۿ]/;
  function numAttrs(r) { return LETTER.test(r.s) ? attrs(r) : ' dir="ltr"'; }
  function meaningful(s) { return /[^\s,\/|;.\-–—]/.test(s); }

  // The number a phone text dials. Words and other numbers around it ("Delivery 24/7:", "24 hours",
  // "(9:00-17:00)", "Branch 2", "Since 1998", "from ₪150", "Closed 1.1.2025") are shown but not
  // dialled, and neither is an extension ("ext. 5", "(ext. 5)", "שלוחה 5", "доб. 12").
  // "(+972) 3-…", "+972 (0)3-…" and "0044 (0)20 …" drop the bracket, "030/1234567" is one number,
  // a star number (*6060) is dialled as it is, and a number written with letters (1-800-FLOWERS)
  // dials the keypad digits.
  var KEYPAD = "22233344455566677778889999";
  var EXT = /(^|[^A-Za-z\s])\s*(?:[(\[]\s*)?(?:ext\.?|extension|x|доб\.?)\s*:?\s*\d{1,5}(?!\s*[-–—]?\s*\d)\s*[)\]]?|\s*(?:[(\[]\s*)?שלוחה\s*:?\s*\d{1,5}(?!\s*[-–—]?\s*\d)\s*[)\]]?/gi;
  var VANITY = /(\+?\d[\d ().-]*?)([ -]?)([A-Za-z][A-Za-z-]*[A-Za-z])/g;
  var AREA_SLASH = /(^|[^\d\/])(0\d{1,4}|\+\d{1,3}[\s.-]?\d{1,4})\/(?=\d{3})/g; // "030/1234567", "+49 30/1234567"
  function digits(s) { return s.replace(/\D/g, "").length; }
  function blank(n) { return new Array(n + 1).join(" "); }
  function blankAll(m) { return blank(m.length); }
  // The phone text with all that is not part of a number to dial turned into spaces. It keeps the
  // length of the text, so a number found in it is at the same place in the text itself.
  function dialText(p) {
    var n = p.replace(/[‐-‒−]/g, "-").replace(/(\d)[–-―](?=\d)/g, "$1-").replace(/\+(\s+)(?=\d)/g, "$1+");
    n = n.replace(/(^|[^\d.\/])(\d{1,2}([.\/])\d{1,2}\3(?:\d{4}|\d{2}))(?![\d.\/])/g, function (m, a, d) { return a + blank(d.length); }); // dates
    n = n.replace(AREA_SLASH, function (m, a, b) { return a + b + " "; });
    n = n.replace(EXT, function (m, pre) { pre = pre || ""; return pre + blank(m.length - pre.length); });
    n = n.replace(/\(\s*(\+\d{1,4})\s*\)/g, function (m, cc) { return " " + cc + blank(m.length - cc.length - 1); });
    n = n.replace(/(\+\d{1,4}|\b00\d{1,4})([\s.-]*\(0\))/g, function (m, cc, z) { return cc + blank(z.length); }); // the 0 is only dialled from inside the country
    n = n.replace(/\b\d{1,2}[.:]\d{2}\s*[-–—]\s*\d{1,2}[.:]\d{2}\b|\d{1,2}:\d{2}|\b\d{1,2}\/\d{1,2}\b/g, blankAll); // hours, "24/7"
    n = n.replace(/[₪$€£]\s*\d[\d,.]*|\d[\d,.]*\s*(?:₪|\$|€|£|NIS|ILS|ש["״]ח|שקל)/g, blankAll); // prices
    n = n.replace(/((?:since|est\.?|established|founded|מאז|משנת)\s*)((?:19|20)\d\d)\b/gi, function (m, a, y) { return a + blank(y.length); });
    return n.replace(VANITY, function (m, d, sep, w) {
      var dd = digits(d), all = dd + w.replace(/-/g, "").length;
      // A real number with letters ("1-800-FLOWERS", "1-800-555-FOOD", 10 to 12 digits), not
      // "24 hours", "555-0123 Mike" or "03-555-1234 Danny".
      if (dd < 3 || dd > 7 || (dd === 7 && sep !== "-") || all < 10 || all > 12) return m;
      return d + sep + w.replace(/[A-Za-z]/g, function (c) { return KEYPAD.charAt(c.toUpperCase().charCodeAt(0) - 65); });
    });
  }
  // The phone numbers in a dial text: groups of digits ("03", "555", "+972", "(03)") joined across
  // a space or one "-" or "." (spaces around it allowed: "050 - 123 - 4567"). Not across ", " or
  // words, not after a whole number ("03-555-1234 24", "03-555-1234 - 050-…") unless the last
  // pair is written like the ones before it ("8-800-555-35-35", "0171 123 45 67"), and not from a
  // short number before a whole one ("Branch 2 03-…", "Room 101 - 03-…").
  function phoneRuns(n) {
    var re = /\+?\d+|\(\d+\)/g, m, runs = [], cur = null;
    while ((m = re.exec(n))) {
      var g = m[0], j = m.index + g.length, sep = cur ? n.slice(cur.j, m.index) : "";
      if (cur && joins(cur, g, sep, n.slice(m.index))) { cur.j = j; cur.d += digits(g); cur.sep = sep; cur.last = digits(g); }
      else runs.push(cur = { i: m.index, j: j, d: digits(g), first: g, sep: null, last: digits(g) });
    }
    return runs;
  }
  function joins(run, g, sep, rest) {
    var dash = /^\s?[.\-–]\s?$/.test(sep), spaced = /\s/.test(sep), gd = digits(g), intl = /^(\+|00)/.test(run.first);
    if (!(sep === "" || dash || /^\s+$/.test(sep))) return false;
    if (g.charAt(0) === "+") return false; // a new number
    if (g.charAt(0) === "(") return run.d <= 4; // an area code after a country code: "+1 (212) …"
    if (run.d >= (intl ? 11 : 9) && !(sep === run.sep && gd <= 2 && run.last <= 3 &&
        run.d + gd <= (/^\+/.test(run.first) ? 13 : intl ? 15 : 11))) return false; // the number is already whole
    if (spaced && run.d >= 7 && (dash || (gd <= 2 && sep !== run.sep))) return false; // "555-1234 - 24 hours", "5551234 24 hours"
    return !(spaced && g.charAt(0) === "0" && /^\d/.test(run.first) && !intl &&
      digits(/^0\d*(?:(?:\s?[.\-–]\s?|\s+)\d+)*/.exec(rest)[0]) >= 9);
  }
  function dialOf(p) {
    var n = dialText(p), star = /\*\d{2,6}#?(?![A-Za-z\d])/.exec(n), first = null, best = null;
    if (star) return star[0].replace(/#/g, "%23");
    phoneRuns(n).forEach(function (r) {
      var s = n.slice(r.i, r.j), next = (/^\s*(\S)/.exec(n.slice(r.j)) || [])[1] || "";
      if (r.d < 3 || /^\d{1,2}\s?[-–]\s?\d{1,2}$/.test(s) || /^(19|20)\d\d$/.test(s)) return; // "9-17", a year
      if (r.d < 5 && LETTER.test(next)) return; // a count: "120 guests", "365 days"
      if (!first && r.d >= 7) first = r;
      if (!best || r.d > best.d) best = r;
    });
    best = first || best; // the main number, not a longer one in a note after it ("(fax 153-…)")
    return best ? n.slice(best.i, best.j).replace(/[^\d+]/g, "") : "";
  }
  // A phone text → its parts, each on its own line with its own call link. It is split at ",", "/",
  // "|", ";", " or " and " או " (not inside brackets, not in "24/7", a date or "030/1234567"), and
  // between two whole numbers ("03-555-1234 050-123-4567"). A label with no number ("Tel" in
  // "Tel/Fax: 03-…", "Call" in "Call or WhatsApp 050-…") stays with the number after it; a note
  // after a number gets its own line.
  var PHONE_SEP = /\s*[,\/|;]\s*|\s+(?:or|או)\s+/gi;
  function phoneParts(s) {
    var pieces = [], last = 0, depth = 0, seen = 0, m, re = new RegExp(PHONE_SEP.source, "gi");
    while ((m = re.exec(s))) {
      var gap = s.slice(seen, m.index), before = s.slice(Math.max(0, m.index - 12), m.index),
        after = s.slice(m.index + m[0].length, m.index + m[0].length + 12);
      depth += count(gap, "(") - count(gap, ")");
      seen = m.index;
      if (depth > 0) continue;
      if (m[0] === "/" && ((/(^|\D)\d{1,2}$/.test(before) && /^\d{1,2}(\D|$)/.test(after)) ||
          (/\d{1,2}\/\d{1,2}$/.test(before) && /^\d{2,4}(\D|$)/.test(after)) ||
          (new RegExp(AREA_SLASH.source.replace("\\/(?=\\d{3})", "$")).test(before) && /^\d{3}/.test(after)))) continue;
      pieces.push({ s: s.slice(last, m.index), sep: m[0] });
      last = m.index + m[0].length;
    }
    pieces.push({ s: s.slice(last), sep: "" });
    var out = [];
    pieces.forEach(function (pc) {
      var prev = out[out.length - 1], none = !dialOf(pc.s);
      if (prev && prev.none) { prev.s += prev.sep + pc.s; prev.sep = pc.sep; prev.none = none; }
      else out.push({ s: pc.s, sep: pc.sep, none: none });
    });
    var res = [];
    out.forEach(function (pc) {
      var p = pc.s, at = 0, big = phoneRuns(dialText(p)).filter(function (r) { return r.d >= 7; });
      for (var k = 1; k < big.length; k++) {
        var cut = big[k - 1].j, note = /^\s*\([^()]*\)/.exec(p.slice(cut));
        if (note) cut += note[0].length; // "(office)" after a number stays with it
        if (cut > big[k].i) continue;
        res.push(p.slice(at, cut));
        at = cut;
      }
      res.push(p.slice(at));
    });
    return res.map(function (p) { return p.replace(/^[\s,;|\/\-–—]+|[\s,;|\/\-–—]+$/g, ""); }).filter(meaningful);
  }

  function renderAbout() {
    var u = UI[lang], hours = hoursRows(infoCfg.hours);
    var about = tl(infoCfg.about), address = tl(infoCfg.address);
    function row(key, valHtml) {
      return '<div class="info-row"><span class="info-key">' + bdi(key) + '</span><span class="info-val">' + valHtml + "</span></div>";
    }
    // "12:00 – 15:30, 18:00 – 23:30": each part stays on one line when it fits; a long value wraps between parts.
    // A "/" splits with spaces around it or before a time ("12:00–15:00/18:00–23:00"), so "24/7" and
    // "1/6–30/9" stay whole. The separator stays at the end of its part, so a "," never starts a line.
    function parts(s) {
      var bits = String(s).split(/(\s*[,|]\s*|\s+\/\s+|\/(?=\d{1,2}[:.]\d\d))/), out = "";
      for (var i = 0; i < bits.length; i += 2) {
        var sep = bits[i + 1] || "", end = sep.replace(/\s+$/, "");
        out += '<span class="nw">' + nums(bits[i]) + esc(end) + "</span>" + (sep === end ? (sep ? "<wbr>" : "") : " ");
      }
      return out;
    }
    // Several numbers ("03-555-1234 / 050-123-4567", "... or ...", "... או ...") each get their own call link.
    // Each keeps the language it was written in.
    var phones = [];
    texts(infoCfg.phone).forEach(function (r) {
      phoneParts(r.s).forEach(function (p) {
        var dial = dialOf(p);
        var text = '<span class="nw"' + numAttrs({ s: p, l: r.l }) + ">" + phoneNums(p) + "</span>";
        phones.push(dial ? '<a href="tel:' + dial + '">' + text + "</a>" : text);
      });
    });
    $("view-about").innerHTML = '<h1 class="sr-only">' + esc(u.about) + '</h1><div class="info-wrap">' +
      (about.s.trim() ? '<div class="info-card"><h2>' + esc(u.aboutUs) + "</h2><p>" + bdi(about) + "</p></div>" : "") +
      (hours.length ? '<div class="info-card"><h2>' + esc(u.hours) + "</h2>" + hours.map(function (h) {
        var time = tl(h.time, h.l), days = tl(h.days, h.l);
        if (!clean(time.s)) time = { s: "", l: null };
        if (!clean(days.s)) days = { s: "", l: null };
        return row(days, "<span" + numAttrs(time) + ">" + parts(time.s) + "</span>");
      }).join("") + "</div>" : "") +
      (address.s.trim() || phones.length ? '<div class="info-card"><h2>' + esc(u.contact) + "</h2>" +
        (address.s.trim() ? row(ui(u.address), bdi(address)) : "") +
        (phones.length ? row(ui(u.phone), phones.join("<br>")) : "") +
        "</div>" : "") +
      "</div>";
  }

  function renderAll() { renderChrome(); renderHome(); renderMenu(); renderAbout(); }

  /* ---------- Views and history ---------- */
  function viewFromHash() {
    var h = location.hash.slice(1);
    return VIEWS.indexOf(h) >= 0 ? h : "home";
  }
  function markView() {
    document.querySelectorAll(".drawer-link").forEach(function (b) {
      var on = b.dataset.view === view;
      b.classList.toggle("active", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }
  // Shows a view. Never writes history; navigate() does that.
  function show(v, catId) {
    var prev = view;
    view = VIEWS.indexOf(v) >= 0 ? v : "home";
    VIEWS.forEach(function (n) { $("view-" + n).hidden = n !== view; });
    markView();
    var target = catId && view === "menu" ? $("cat-" + catId) : null;
    if (target && !target.hidden) {
      unpin(); // a new scroll replaces any pending scrollNow()
      setActive(catId);
      lockSpy();
      anchor = { cat: catId, off: 0 }; // where the scroll will end, should the phone turn before then
      target.scrollIntoView({ block: "start", behavior: prev === view ? motion() : "instant" });
    } else {
      scrollNow(0);
    }
    spy();
  }
  // Each view change is a history entry, so the phone's Back button moves between views.
  // `clear` empties the search, after the entry being left has saved it with its position.
  // Clearing a search on the menu is a new entry too (a drawer link on the searched menu), so Back
  // brings the search back. On Home and About the box is hidden, so text left in it does not count.
  function navigate(v, catId, clear) {
    v = VIEWS.indexOf(v) >= 0 ? v : "home";
    if (v !== view || (clear && view === "menu" && $("search").value)) {
      saveScroll();
      push({ view: v }, "#" + v);
    }
    if (clear) clearSearch();
    show(v, catId);
  }
  function state() {
    try { return history.state || {}; } catch (e) { return {}; }
  }
  function merge(a, b) {
    var o = {}, k;
    for (k in a) if (own(a, k)) o[k] = a[k];
    for (k in b) if (own(b, k)) o[k] = b[k];
    return o;
  }

  /* ---------- Scroll positions ---------- */
  // The page restores its own scroll position (scrollRestoration is "manual"), so Back,
  // Forward and a reload return the customer to the same place in the menu. Every history
  // entry gets an id. Its position is updated on every scroll, kept in memory and in
  // sessionStorage (which, unlike history, a reload cannot drop), and also on the entry itself.
  // The entry also keeps the search text, so its position matches the list it was taken on.
  var POS_KEY = "menu-pos:" + location.pathname, Q_KEY = "menu-q:" + location.pathname;
  var curId = null, curOv = false, curTwin = false, curUnder = false, pinTok = 0;
  function readStore(key) {
    try {
      var o = JSON.parse(sessionStorage.getItem(key) || "{}");
      return o && typeof o === "object" && !Array.isArray(o) ? o : {};
    } catch (e) { return {}; }
  }
  function writeStore(key, o) {
    try {
      var keys = Object.keys(o);
      while (keys.length > 60) delete o[keys.shift()]; // only recent entries matter
      sessionStorage.setItem(key, JSON.stringify(o));
      return true;
    } catch (e) { return false; }
  }
  var ANC_KEY = "menu-anc:" + location.pathname, pos = readStore(POS_KEY), qs = readStore(Q_KEY), anc = readStore(ANC_KEY);
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function remember() { if (curId) pos[curId] = Math.round(window.scrollY); }
  function posOf(st) { return st.id && typeof pos[st.id] === "number" ? pos[st.id] : st.y > 0 ? st.y : 0; }
  function qOf(st) { return st.id && typeof qs[st.id] === "string" ? qs[st.id] : st.q; }
  // Each menu entry also keeps the category being read (see keepAnchor). If the phone was turned,
  // or the language changed, while another view was shown, the menu comes back to that category
  // instead of to a pixel position from the old layout.
  function keepAnc() {
    if (!curId) return;
    if (view === "menu" && anchor && anchor.h > 0) {
      anc[curId] = { w: window.innerWidth, l: lang, c: anchor.cat, o: Math.round(anchor.off), h: Math.round(anchor.h) };
    } else delete anc[curId];
  }
  function yOf(st) {
    var y = posOf(st), a = st.id ? anc[st.id] : null;
    var sec = a && view === "menu" && (a.w !== window.innerWidth || a.l !== lang) ? $("cat-" + a.c) : null;
    if (!sec || sec.hidden) return y;
    var r = sec.getBoundingClientRect(), off = a.o < 0 && a.h > 0 ? a.o * r.height / a.h : a.o;
    return Math.max(0, Math.round(r.top + window.scrollY - marginTop(sec) - off));
  }
  function saveScroll() {
    remember();
    writeStore(POS_KEY, pos);
    keepAnc();
    writeStore(ANC_KEY, anc);
    saveQuery();
    try { history.replaceState(merge(state(), { y: Math.round(window.scrollY), q: $("search").value }), ""); } catch (e) {}
  }
  function push(st, url) {
    st = merge(st, { id: newId() });
    try {
      if (url) history.pushState(st, "", url); else history.pushState(st, "");
      curId = st.id;
      curOv = !!st.overlay;
    } catch (e) {}
  }
  // An entry without the drawer or a dish on it.
  function plain(st) {
    var o = merge(st, {});
    delete o.overlay; delete o.item; delete o.under;
    return o;
  }
  function setSearch(q) {
    q = typeof q === "string" ? q : "";
    if ($("search").value !== q) { $("search").value = q; filterMenu(); }
  }
  // Scrolls at once, then holds that position while something keeps moving the page: a smooth
  // scroll that was still running (a category tap just before Back), or a finger fling. The hold
  // ends 150 ms after the page stops drifting (at most 4 s, as a strong fling can last that long),
  // and at once on any touch, wheel, key or focus change by the customer.
  var pinY = null, pinEnd = 0, pinMax = 0;
  function scrollNow(y) {
    var tk = ++pinTok, now = Date.now();
    pinY = y;
    pinEnd = now + 150;
    pinMax = now + 4000;
    window.scrollTo({ top: y, behavior: "instant" });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (tk === pinTok && pinY !== null && Math.abs(window.scrollY - y) >= 0.5) window.scrollTo({ top: y, behavior: "instant" });
      });
    });
  }
  function unpin() { pinTok++; pinY = null; }
  // Runs in the scroll event, before the frame is painted. True when the page was put back.
  function holdPin() {
    if (pinY === null) return false;
    var now = Date.now();
    if (now > pinEnd || now > pinMax) { pinY = null; return false; }
    if (Math.abs(window.scrollY - pinY) < 0.5) return false; // exact, so no drift is saved and added up
    window.scrollTo({ top: pinY, behavior: "instant" });
    pinEnd = now + 150;
    return true;
  }

  /* ---------- Category highlighting ---------- */
  // While a tap scrolls to a category, the highlight stays on that category. The lock ends
  // when the scroll ends (scrollend, or no scroll event for 250 ms), on wheel or touch, or
  // after 900 ms if nothing scrolled at all.
  var spyLock = false, lockTimer = 0;
  function lockSpy() { spyLock = true; clearTimeout(lockTimer); lockTimer = setTimeout(unlockSpy, 900); }
  function unlockSpy() { spyLock = false; clearTimeout(lockTimer); keepAnchor(); }
  var saveTimer = 0;
  function onScroll() {
    holdPin();
    remember();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveScroll, 300);
    if (spyLock) { clearTimeout(lockTimer); lockTimer = setTimeout(unlockSpy, 250); return; }
    spy();
  }
  // The category being read, how far its title is from the top and how tall it is, so turning
  // the phone (or resizing the window) keeps the same place even though the layout changes.
  var anchor = null, lastW = window.innerWidth;
  function marginTop(el) { return parseFloat(getComputedStyle(el).scrollMarginTop) || 0; }
  function keepAnchor() {
    var sec = view === "menu" && activeCat ? $("cat-" + activeCat) : null;
    var r = sec && !sec.hidden ? sec.getBoundingClientRect() : null;
    anchor = r ? { cat: activeCat, off: r.top - marginTop(sec), h: r.height } : null;
  }
  function onResize() {
    var a = anchor, w = window.innerWidth;
    // Only a change of width moves the layout; the phone's toolbar or keyboard only change the height.
    if (w !== lastW && a && view === "menu") {
      var sec = $("cat-" + a.cat);
      if (sec && !sec.hidden) {
        var r = sec.getBoundingClientRect(), off = a.off;
        // Deep inside a category, keep the same share of it above the top: its height changes too.
        if (off < 0 && a.h > 0) off = off * r.height / a.h;
        unpin();
        window.scrollTo({ top: r.top + window.scrollY - marginTop(sec) - off, behavior: "instant" });
      }
    }
    lastW = w;
    // While a tap or a language switch is still scrolling, its category stays the anchor.
    if (!spyLock) { activeCat = undefined; spy(); }
  }

  function setActive(id) {
    activeCat = id;
    document.querySelectorAll("#chips [data-cat], #sideCats [data-cat]").forEach(function (b) {
      var on = b.dataset.cat === id;
      b.classList.toggle("active", on);
      if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
    // Keep the active chip (phones) or sidebar entry (desktop) in view inside its own list.
    var chip = id ? document.querySelector('#chips [data-cat="' + id + '"]') : null, strip = $("chips");
    if (chip && strip.offsetParent) {
      var cr = chip.getBoundingClientRect(), sr = strip.getBoundingClientRect();
      strip.scrollBy({ left: cr.left + cr.width / 2 - (sr.left + sr.width / 2), behavior: motion() });
    }
    var side = id ? document.querySelector('#sideCats [data-cat="' + id + '"]') : null, list = $("sideCats");
    if (side && list.offsetParent && list.scrollHeight > list.clientHeight + 1) {
      var br = side.getBoundingClientRect(), lr = list.getBoundingClientRect();
      if (br.top < lr.top || br.bottom > lr.bottom) {
        list.scrollBy({ top: br.top + br.height / 2 - (lr.top + lr.height / 2), behavior: motion() });
      }
    }
  }
  // Highlights the category currently on screen.
  function spy() {
    if (view !== "menu" || spyLock) return;
    var sections = document.querySelectorAll(".cat-section:not([hidden])");
    if (!sections.length) { if (activeCat !== null) setActive(null); return; }
    var line = marginTop(sections[0]) + 12 + 1; // 1px for a title that sits a fraction of a pixel low
    var current = sections[0];
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) current = s; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1];
    if (current.dataset.catId !== activeCat) setActive(current.dataset.catId);
    keepAnchor();
  }

  /* ---------- Drawer and item sheet ---------- */
  var lastFocus = null, popping = false, afterPop = null, popTimer = 0, closedAt = 0;

  function setOpen(el, open) {
    el.classList.toggle("open", open);
    el.setAttribute("aria-hidden", String(!open));
    el.inert = !open;
  }
  function isOpen(el) { return el.classList.contains("open"); }
  function anyOpen() { return isOpen($("drawer")) || isOpen($("sheet")); }
  function syncOverlay() {
    var open = anyOpen();
    $("backdrop").hidden = !open;
    document.body.classList.toggle("locked", open);
    // Keeps keyboard focus inside the open drawer or sheet.
    $("main").inert = open;
    $("topbar").inert = open;
  }
  function overlayEntry() { return !!state().overlay; }
  // An open drawer or sheet gets its own history entry, so Back closes it. The entry
  // records what was open, so Forward or a reload can open it again.
  // `under` marks an entry the page pushed on top of its own entry for the same view.
  function pushOverlay(kind, key) {
    if (overlayEntry()) return;
    saveScroll();
    push({ overlay: kind, item: key || null, view: view, y: Math.round(window.scrollY), q: $("search").value, under: curId });
  }
  // A drawer or dish entry that cannot be opened again (that dish is no longer in config.js).
  function deadOverlay(st) {
    if (st.under) { stepBack(); return; } // go back to the entry under it, so Back is not a dead press
    // Not one the page made: there may be nothing under it, so stay and drop the overlay from it.
    try { history.replaceState(plain(st), ""); } catch (e) {}
    curOv = false;
  }
  function canReopen(st) { return st.overlay === "drawer" || (st.overlay === "sheet" && !!itemsByKey[st.item]); }
  function reopen(st) {
    if (!canReopen(st)) return false;
    if (st.overlay === "drawer") { openDrawer(); return true; }
    if (st.overlay === "sheet") {
      var from = null;
      document.querySelectorAll("#view-" + view + " [data-item]").forEach(function (el) {
        if (!from && el.dataset.item === st.item) from = el;
      });
      openItem(st.item, from);
      return true;
    }
    return false;
  }
  function focusNoScroll(el) {
    if (!el || !el.focus) return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  function openDrawer() {
    if (anyOpen()) return;
    lastFocus = document.activeElement;
    setOpen($("drawer"), true);
    $("menuBtn").setAttribute("aria-expanded", "true");
    pushOverlay("drawer");
    syncOverlay();
    focusNoScroll($("drawerClose"));
  }

  function openItem(key, from) {
    var it = itemsByKey[key];
    if (!it || anyOpen()) return;
    var u = UI[lang], desc = tl(it.desc), stats = [], seen = {};
    var ing = texts(it.ingredients);
    // The same tag written twice ("vegan" and { he: "טבעוני" }) is shown once.
    var tags = it.tags.filter(function (g) {
      var k = "~" + tagText(g).s.trim().toLowerCase();
      return seen[k] ? false : (seen[k] = true);
    });
    var time = approx(it.time, u.min), kcal = approx(it.calories, u.kcal);
    if (time.s) stats.push('<div class="stat"><small>' + esc(u.prep) + "</small><b>" + bdi(time) + "</b></div>");
    if (kcal.s) stats.push('<div class="stat"><small>' + esc(u.calories) + "</small><b>" + bdi(kcal) + "</b></div>");
    $("sheetBody").innerHTML = thumb(it) +
      '<div class="sheet-head"><h2 id="sheetTitle">' + bdi(tl(it.name)) + "</h2>" + price(it.price) + "</div>" +
      (tags.length ? '<div class="tags">' + tags.map(function (g) {
        return '<span class="tag' + (g === "popular" ? " hot" : "") + '">' + bdi(tagText(g)) + "</span>";
      }).join("") + "</div>" : "") +
      (desc.s.trim() ? '<p class="sheet-desc">' + bdi(desc) + "</p>" : "") +
      (stats.length ? '<div class="stats">' + stats.join("") + "</div>" : "") +
      (ing.length ? "<h3>" + esc(u.ingredients) + '</h3><ul class="ingredients">' +
        ing.map(function (x) { return "<li>" + bdi(x) + "</li>"; }).join("") + "</ul>" : "");
    $("sheet").setAttribute("aria-labelledby", "sheetTitle");
    lastFocus = from || document.activeElement;
    $("sheetBody").scrollTop = 0;
    setOpen($("sheet"), true);
    pushOverlay("sheet", key);
    syncOverlay();
    focusNoScroll($("sheetClose"));
  }

  // A close started by a tap blocks taps for 400 ms (see bind), counted from when it really closes.
  // Escape, the Back button and a swipe do not: no second tap can follow them.
  function tapClose(e) { if (e && e.detail) closedAt = Date.now(); }
  function closeAll() {
    if (!anyOpen()) return;
    if (Date.now() - closedAt < 400) closedAt = Date.now();
    var sheet = $("sheet");
    setOpen($("drawer"), false);
    setOpen(sheet, false);
    sheet.classList.remove("dragging");
    sheet.style.removeProperty("--drag");
    $("menuBtn").setAttribute("aria-expanded", "false");
    syncOverlay();
    if (lastFocus && document.contains(lastFocus)) focusNoScroll(lastFocus);
    lastFocus = null;
  }

  // Close by stepping back over the overlay's history entry, then run `then`.
  function popOverlay(then) {
    if (popping) return;
    if (!overlayEntry()) { closeAll(); if (then) then(); return; }
    afterPop = then || null;
    stepBack();
  }
  // An overlay entry always sits right on top of the entry for the same view without it.
  function stepBack() {
    popping = true;
    clearTimeout(popTimer);
    popTimer = setTimeout(function () { // in case popstate never arrives: there was nothing to go back to
      if (!popping) return;
      try { history.replaceState(plain(state()), ""); } catch (e) {}
      settlePop();
    }, 700);
    history.back();
  }
  function settlePop() {
    var ours = popping; // true when the page stepped back itself, false for the browser's Back or Forward
    popping = false;
    clearTimeout(popTimer);
    clearTimeout(saveTimer); // a pending save belongs to the entry we just left
    // scrollRestoration is "manual", so the page has not moved yet: this is the position of the entry left.
    var y = Math.round(window.scrollY), leftOv = curOv, leftTwin = curTwin, leftUnder = curUnder;
    if (curId) { pos[curId] = y; keepAnc(); }
    var st = state(), v = viewFromHash(), fresh = !st.id;
    if (fresh) { // an entry the page did not make, such as a #about typed into the address bar
      st = merge(st, { id: newId(), view: v });
      try { history.replaceState(st, ""); } catch (e) {}
    }
    curId = st.id;
    curOv = !!st.overlay;
    curTwin = !!st.twin;
    curUnder = !!st.twinUnder;
    closeAll();
    if (v !== view) {
      if (v === "menu") setSearch(qOf(st));
      show(v);
      scrollNow(yOf(st));
    } else if (fresh || leftOv || st.overlay) {
      pos[curId] = y; // an overlay opened or closed, or a new entry: the page stays where it is
    } else if (!ours && leftTwin && Math.abs(posOf(st) - y) <= 2 && (v !== "menu" || (qOf(st) || "") === $("search").value)) {
      // Back from an entry made from an older version's open drawer or dish (see the start-up code)
      // reached the entry it was made over, which shows exactly the same: step over it. That entry
      // is marked, so Forward from it steps over the twin the same way.
      try { history.replaceState(merge(st, { twinUnder: true }), ""); } catch (e) {}
      curUnder = true;
      history.back();
      return;
    } else if (!ours && leftUnder && st.twin && Math.abs(posOf(st) - y) <= 2 && (v !== "menu" || (qOf(st) || "") === $("search").value)) {
      history.forward();
      return;
    } else {
      // Two entries of the same view (#menu typed in the address bar while on the menu).
      if (v === "menu") setSearch(qOf(st));
      scrollNow(yOf(st));
    }
    saveScroll();
    var fn = afterPop;
    afterPop = null;
    if (fn) fn();
    else if (!ours && st.overlay && !reopen(st)) deadOverlay(st);
    // (Forward onto an open dish or drawer opens it again.)
  }

  /* ---------- Swipe down to close the sheet (phones and tablets) ---------- */
  function bindSwipe() {
    var sheet = $("sheet"), body = $("sheetBody"), drag = null;
    var touchLayout = window.matchMedia ? matchMedia("(max-width: 899px)") : { matches: true };
    sheet.addEventListener("touchstart", function (e) {
      if (!touchLayout.matches || e.touches.length !== 1 || e.target.closest("#sheetClose")) return;
      if (!e.target.closest(".sheet-handle") && body.scrollTop > 0) return;
      drag = { y0: e.touches[0].clientY, dy: 0, active: false };
    }, { passive: true });
    sheet.addEventListener("touchmove", function (e) {
      if (!drag) return;
      var dy = e.touches[0].clientY - drag.y0;
      if (!drag.active) {
        if (dy < -4) { drag = null; return; } // scrolling the text up, not a drag
        if (dy < 6) return;
        drag.active = true;
        sheet.classList.add("dragging");
      }
      e.preventDefault();
      drag.dy = Math.max(0, dy);
      sheet.style.setProperty("--drag", drag.dy + "px");
    }, { passive: false });
    function end() {
      var d = drag;
      drag = null;
      if (!d || !d.active) return;
      sheet.classList.remove("dragging");
      if (d.dy > 100) popOverlay();
      else sheet.style.setProperty("--drag", "0px");
    }
    sheet.addEventListener("touchend", end);
    sheet.addEventListener("touchcancel", end);
  }

  /* ---------- Events ---------- */
  function bind() {
    // The sheet and drawer stop catching taps the moment they close, while they are still
    // sliding away. A quick second tap must not land on the dish or link underneath.
    document.addEventListener("click", function (e) {
      if (e.detail && Date.now() - closedAt < 400) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    $("menuBtn").addEventListener("click", openDrawer);
    ["drawerClose", "sheetClose", "backdrop"].forEach(function (id) {
      $(id).addEventListener("click", function (e) { tapClose(e); popOverlay(); });
    });
    // A flick on the dim area must not start a fling: Chrome would then swallow the next tap.
    $("backdrop").addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && anyOpen()) popOverlay();
    });

    document.addEventListener("click", function (e) {
      var el = e.target.closest ? e.target.closest("[data-item], [data-view], [data-cat]") : null;
      if (!el) return;
      if (el.dataset.item) { openItem(el.dataset.item); return; }
      var v = el.dataset.view || "menu", cat = el.dataset.cat || null;
      // Category chips and the sidebar list only show matching categories, so they keep the search.
      // Every other link clears it, so a category link always shows the whole category.
      var keepSearch = !!el.closest("#chips, #sideCats");
      var go = function () { navigate(v, cat, !keepSearch); };
      if (el.closest("#drawer")) { tapClose(e); popOverlay(go); } else go();
    });

    // A keyboard user tabbing along the category chips or "Today's picks" sees the whole item.
    document.addEventListener("focusin", function (e) {
      var el = e.target;
      if (!el.closest || !el.closest(".h-scroll, #chips, #sideCats")) return;
      var keyboard = true;
      try { keyboard = el.matches(":focus-visible"); } catch (x) {}
      if (keyboard && el.scrollIntoView) el.scrollIntoView({ block: "nearest", inline: "nearest" });
    });

    $("brand").addEventListener("click", function (e) {
      e.preventDefault();
      navigate("home", null, true);
    });

    $("langBtn").addEventListener("click", function () {
      unpin();
      // Keep the reading position: the same distance from the top of the same category.
      var keep = view === "menu" ? activeCat : null, y = window.scrollY;
      var old = keep ? $("cat-" + keep) : null;
      var off = old && !old.hidden ? old.getBoundingClientRect().top : null;
      lang = nextLang();
      try { localStorage.setItem("menu-lang", lang); } catch (e) {}
      // The customer's own choice wins over a ?lang= in the link; drop it from the address too.
      try {
        var url = new URL(location.href);
        if (url.searchParams.has("lang")) {
          url.searchParams.delete("lang");
          history.replaceState(history.state, "", url.pathname + url.search + url.hash);
        }
      } catch (e) {}
      renderAll();
      var sec = keep ? $("cat-" + keep) : null;
      if (off !== null && sec && !sec.hidden) {
        setActive(keep);
        lockSpy();
        window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY - off, behavior: "instant" });
        keepAnchor();
      } else {
        window.scrollTo({ top: y, behavior: "instant" });
      }
      spy();
    });

    var search = $("search");
    search.addEventListener("input", function () {
      filterMenu();
      saveQuery();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveScroll, 300);
      // Typing scrolls the box into view, but under the top bar: bring it out from under the bar.
      requestAnimationFrame(function () {
        if (document.activeElement !== search) return;
        var top = search.getBoundingClientRect().top, bar = $("topbar").getBoundingClientRect().bottom;
        if (top < bar) window.scrollBy({ top: top - bar - 12, behavior: "instant" });
      });
    });
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); search.blur(); } // closes the phone keyboard
    });
    $("searchJump").addEventListener("click", function () {
      unpin();
      window.scrollTo({ top: 0, behavior: motion() });
      focusNoScroll(search);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", saveScroll); // sessionStorage keeps it through a reload
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") saveScroll(); // phones may discard a tab without pagehide
    });
    window.addEventListener("scrollend", function () { if (spyLock) unlockSpy(); });
    // The customer scrolling themselves ends both the highlight lock and the position hold.
    window.addEventListener("wheel", function () { unpin(); unlockSpy(); }, { passive: true });
    window.addEventListener("touchstart", function () { unpin(); unlockSpy(); }, { passive: true });
    ["pointerdown", "keydown", "focusin"].forEach(function (type) { window.addEventListener(type, unpin, true); });
    window.addEventListener("resize", onResize);
    window.addEventListener("popstate", settlePop);
    bindSwipe();
  }

  // Broken photos fall back to the emoji; a broken logo falls back to the name.
  document.addEventListener("error", function (e) {
    var el = e.target;
    if (!el || el.tagName !== "IMG") return;
    if (el.closest(".thumb")) el.remove();
    else if (el.closest("#brand")) $("brand").innerHTML = brandText();
  }, true);

  try {
    normalise();
    if (!cats.length) {
      console.error("[menu] config.js has no dishes to show.");
      fatal();
      return;
    }
    // Scroll positions are handled by the page. With the browser's own restoration, the
    // history.back() that closes the drawer would undo the scroll to the tapped category.
    try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
    document.body.insertAdjacentHTML("afterbegin", SHELL);
    applyTheme();
    bind();
    renderAll();
    var st = state();
    show(viewFromHash());
    var same = st.view === view;
    if (same && view === "menu") setSearch(qOf(st)); // the search the position was taken on
    var y = same ? yOf(st) : 0;
    curId = st.id && same ? st.id : newId();
    if (y > 0) scrollNow(y);
    var here = { view: view, id: curId, y: y, q: $("search").value };
    if (same && st.twin) here.twin = true; // a reload keeps the marks (see settlePop)
    if (same && st.twinUnder) here.twinUnder = true;
    // After a reload with a dish or the drawer open, open it again on the same history entry.
    if (same && st.overlay && !st.under && canReopen(st)) {
      // An open drawer or dish the page did not put on an entry of its own (older versions wrote
      // these). What is under it is unknown, maybe another site, so going back to close it is not
      // safe: keep this entry without it and open it again on a new entry above, so closing it
      // stays on this view. Those older versions put it over an entry for the same view, so it is
      // marked `twin`: Back that reaches an entry showing exactly the same steps over it.
      try { history.replaceState(merge(merge(plain(st), here), { twin: true }), "", "#" + view); } catch (e) {}
      here = null;
      reopen(st);
    } else if (same && st.overlay) {
      curOv = true;
      if (reopen(st)) here = merge(st, here);
      else if (st.under) {
        // That dish is no longer in config.js: go back to the entry under it, so Back is not a dead press.
        try { history.replaceState(merge(st, here), ""); } catch (e) {}
        stepBack();
        here = null;
      } else {
        curOv = false; // not an entry the page made: stay on it, without the overlay
        here = merge(plain(st), here);
      }
    }
    if (here) {
      try { history.replaceState(here, "", "#" + view); } catch (e) {}
    }
    curTwin = !!state().twin;
    curUnder = !!state().twinUnder;
  } catch (err) {
    console.error("[menu] Could not build the menu:", err);
    fatal();
  }
})();

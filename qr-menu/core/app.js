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
      item: "item", items: "items",
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
      item: "מנה", items: "מנות",
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

  // Opening-hours rows with neither days nor time are ignored.
  var HOURS = (Array.isArray(infoCfg.hours) ? infoCfg.hours : []).filter(function (h) {
    return h && allText([h.days, h.time]).join("").trim() !== "";
  });
  // The About page is left out when the client gave nothing to put on it.
  var HAS_ABOUT = allText([infoCfg.about, infoCfg.address, infoCfg.phone]).join("").trim() !== "" || HOURS.length > 0;
  var VIEWS = HAS_ABOUT ? ["home", "menu", "about"] : ["home", "menu"];

  var lang = pickLang();
  var view = null;
  var activeCat;

  /* ---------- Small helpers ---------- */
  // Own keys only, so a tag or id such as "constructor" is not mistaken for a built-in.
  function own(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Client text, isolated so a name in the other script keeps its own order
  // (an English "Fish & Chips!" on the Hebrew page keeps its "!" at the end).
  function bdi(s) { return s === "" ? "" : "<bdi>" + esc(s) + "</bdi>"; }
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
  // language, then to any language that has a value.
  function pickValue(v, ok) {
    if (ok(v[lang])) return v[lang];
    if (ok(v[DEFAULT_LANG])) return v[DEFAULT_LANG];
    for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k) && ok(v[k])) return v[k];
    return undefined;
  }
  function t(v) {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v !== "object" || Array.isArray(v)) return "";
    var r = pickValue(v, function (x) { return typeof x === "string" && x.trim() !== ""; });
    return r == null ? "" : r;
  }
  function list(v) {
    if (Array.isArray(v)) return v;
    if (!v || typeof v !== "object") return [];
    var r = pickValue(v, function (x) { return Array.isArray(x) && x.length > 0; });
    return Array.isArray(r) ? r : [];
  }

  // A value that may be written per language ({ en, he }) or once for all languages.
  function val(v) { return v && typeof v === "object" && !Array.isArray(v) ? t(v) : v; }
  // A number, or a string that holds only a number ("32", "32.5").
  function num(v) {
    if (typeof v === "number") return isFinite(v) ? v : NaN;
    return typeof v === "string" && /^\s*\d+(\.\d+)?\s*$/.test(v) ? Number(v) : NaN;
  }
  function priceText(p) {
    p = val(p);
    if (p == null || String(p).trim() === "") return "";
    var n = num(p);
    if (!isNaN(n)) return (cfg.currency || "") + (Number.isInteger(n) ? String(n) : n.toFixed(2));
    return String(p).trim(); // free text such as "Market price" is shown as written
  }
  function price(p) {
    var s = priceText(p);
    if (!s) return "";
    return '<bdi class="price' + (isNaN(num(val(p))) ? " free" : "") + '">' + esc(s) + "</bdi>";
  }
  // "~30 min" for a number; a range such as "20-30" gets the unit; other text is shown as written.
  function approx(v, unit) {
    v = val(v);
    if (v == null) return "";
    var u = UI[lang], n = num(v);
    if (!isNaN(n)) return u.approx + n.toLocaleString("en") + " " + unit;
    var s = String(v).trim();
    return /^[\d\s.,\-–]+$/.test(s) ? s + " " + unit : s;
  }
  function tagLabel(g, l) { var tags = UI[l || lang].tags; return own(tags, g) ? tags[g] : g; }

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
  function hasText(v) { return allText(v).join("").trim() !== ""; }
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
        name = {};
        Object.keys(UI).forEach(function (l) { name[l] = given(c.id) ? String(c.id).trim() : UI[l].menu + " " + (ci + 1); });
      }
      var items = [];
      c.items.forEach(function (raw, ii) {
        if (!raw || typeof raw !== "object") return;
        // Work on a copy: the same dish object may be listed in two categories.
        var it = merge(raw, {});
        if (given(it.id) && rawItem[it.id]) {
          console.warn('[menu] Two dishes use the id "' + it.id + '" (in "' + rawItem[it.id] + '" and "' + id +
            '"). Give each dish its own id in config.js.');
        }
        if (given(it.id) && !rawItem[it.id]) rawItem[it.id] = id;
        if (!hasText(it.name)) {
          console.warn('[menu] A dish in "' + id + '" has no name. Give it a name in config.js.');
          if (given(it.id)) it.name = String(it.id).trim();
        }
        // A single tag written as text ("spicy") works the same as a list (["spicy"]).
        var tags = Array.isArray(it.tags) ? it.tags : [it.tags];
        it.tags = tags.filter(function (g) { return typeof g === "number" || (typeof g === "string" && g.trim()); })
          .map(function (g) { return String(g).trim(); });
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

  function applyTheme() {
    var map = { bg: "--bg", card: "--card", ink: "--ink", muted: "--muted", line: "--line", accent: "--accent", radius: "--radius" };
    var th = cfg.theme || {};
    Object.keys(map).forEach(function (k) {
      if (th[k]) document.documentElement.style.setProperty(map[k], th[k]);
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = th.card || "#ffffff";
  }

  /* ---------- Rendering ---------- */
  // The emoji is always there; a photo, when set, sits on top of it.
  // If the photo fails to load it is removed and the emoji shows.
  function thumb(it) {
    return '<span class="thumb"><span class="thumb-emoji" aria-hidden="true">' + esc(it.emoji || "🍽️") + "</span>" +
      (it.image ? '<img src="' + esc(it.image) + '" alt="" loading="lazy" decoding="async">' : "") + "</span>";
  }
  function card(it) {
    var tag = it.tags[0];
    return '<button class="card" data-item="' + esc(it._key) + '">' + thumb(it) +
      '<span class="card-name">' + bdi(t(it.name)) + "</span>" +
      '<span class="card-tag' + (tag === "popular" ? " hot" : "") + '">' + (tag ? bdi(tagLabel(tag)) : "") + "</span>" +
      price(it.price) + "</button>";
  }
  function countLabel(n) { var u = UI[lang]; return n + " " + (n === 1 ? u.item : u.items); }
  function brandHtml() {
    var name = t(brandCfg.name);
    return brandCfg.logo
      ? '<img src="' + esc(brandCfg.logo) + '" alt="' + esc(name || UI[lang].home) + '">'
      : '<span class="brand-text">' + bdi(name) + "</span>";
  }

  function renderChrome() {
    var u = UI[lang], name = t(brandCfg.name), root = document.documentElement;
    root.lang = lang;
    root.dir = u.dir;
    document.title = (name ? name + " · " : "") + u.menu;

    $("brand").innerHTML = brandHtml();
    // Without a name the link would have nothing to read out.
    if (name) $("brand").removeAttribute("aria-label"); else $("brand").setAttribute("aria-label", u.home);
    $("drawerBrand").innerHTML = bdi(name);
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
          return '<button data-cat="' + c.id + '"><span>' + bdi(t(c.name)) + '</span><span class="count">' +
            pad2(c.items.length) + "</span></button>";
        }).join("") + "</div>";
      }
      return html;
    }).join("");
    markView();
  }

  function renderHome() {
    var u = UI[lang], picks = [];
    cats.forEach(function (c) { c.items.forEach(function (it) { if (it.featured) picks.push(it); }); });
    var subtitle = t(homeCfg.subtitle), title = t(homeCfg.headline) || t(brandCfg.name);
    $("view-home").innerHTML =
      '<div class="hero">' + (title ? "<h1>" + bdi(title) + "</h1>" : '<h1 class="sr-only">' + esc(u.home) + "</h1>") +
      (subtitle ? "<p>" + bdi(subtitle) + "</p>" : "") +
      '<button class="btn" data-view="menu">' + esc(u.viewMenu) + "</button></div>" +
      (picks.length ? '<div class="section-title"><h2>' + esc(u.picks) + '</h2></div><div class="h-scroll">' +
        picks.map(card).join("") + "</div>" : "") +
      (cats.length ? '<div class="section-title"><h2>' + esc(u.categories) + '</h2></div><div class="cat-tiles">' +
        cats.map(function (c) {
          return '<button class="cat-tile" data-cat="' + c.id + '">' +
            (c.emoji ? '<span class="emoji" aria-hidden="true">' + esc(c.emoji) + "</span>" : "") +
            "<span>" + bdi(t(c.name)) + "<small>" + esc(countLabel(c.items.length)) + "</small></span></button>";
        }).join("") + "</div>" : "");
  }

  // Sections are built once per language; searching only shows and hides cards.
  function renderMenu() {
    var u = UI[lang];
    $("sections").innerHTML = cats.map(function (c) {
      return '<section class="cat-section" id="cat-' + c.id + '" data-cat-id="' + c.id + '" aria-labelledby="h-' + c.id + '">' +
        '<div class="section-title"><h2 id="h-' + c.id + '">' + bdi(t(c.name)) + '</h2><span class="count">' +
        pad2(c.items.length) + "</span></div>" +
        '<div class="grid">' + c.items.map(card).join("") + "</div></section>";
    }).join("") + '<p class="empty" id="noResults" hidden>' + esc(u.noResults) + "</p>";

    $("chips").innerHTML = cats.map(function (c) {
      return '<button class="chip" data-cat="' + c.id + '">' + bdi(t(c.name)) + "</button>";
    }).join("");
    $("sideCats").innerHTML = cats.map(function (c) {
      return '<button data-cat="' + c.id + '"><span>' + bdi(t(c.name)) + '</span><span class="count">' +
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
    }
  }

  function renderAbout() {
    var u = UI[lang], hours = HOURS;
    var about = t(infoCfg.about), address = t(infoCfg.address);
    var phone = Array.isArray(infoCfg.phone) ? infoCfg.phone.map(val).join(", ") : String(val(infoCfg.phone) || "");
    function row(key, valHtml) {
      return '<div class="info-row"><span class="info-key">' + bdi(key) + '</span><span class="info-val">' + valHtml + "</span></div>";
    }
    // "12:00 – 15:30, 18:00 – 23:30": each part stays on one line when it fits; a long value wraps between parts.
    function parts(s) {
      return String(s).split(/(\s*[,\/|]\s*)/).map(function (p, i) {
        return i % 2 ? esc(p) : '<span class="nw">' + esc(p) + "</span>";
      }).join("");
    }
    // Several numbers ("03-555-1234 / 050-123-4567", "... or ...", "... או ...") each get their own call link.
    // The link keeps digits, + and star codes (*6060); an extension ("ext. 5", "שלוחה 5") is not dialled.
    var phones = phone.split(/\s*[,\/|;]\s*|\s+(?:or|או)\s+/i).filter(function (p) { return p.trim(); }).map(function (p) {
      var dial = p.replace(/\s*(?:ext\.?|extension|x|שלוחה)\s*:?\s*\d[\d\s-]*$/i, "")
        .replace(/[^\d+*#]/g, "").replace(/#/g, "%23");
      var text = '<span class="nw" dir="ltr">' + esc(p.trim()) + "</span>";
      return dial.replace(/[^\d]/g, "") ? '<a href="tel:' + dial + '">' + text + "</a>" : text;
    });
    $("view-about").innerHTML = '<h1 class="sr-only">' + esc(u.about) + '</h1><div class="info-wrap">' +
      (about ? '<div class="info-card"><h2>' + esc(u.aboutUs) + "</h2><p>" + bdi(about) + "</p></div>" : "") +
      (hours.length ? '<div class="info-card"><h2>' + esc(u.hours) + "</h2>" + hours.map(function (h) {
        return row(t(h.days), '<span dir="ltr">' + parts(t(h.time)) + "</span>");
      }).join("") + "</div>" : "") +
      (address || phones.length ? '<div class="info-card"><h2>' + esc(u.contact) + "</h2>" +
        (address ? row(u.address, bdi(address)) : "") +
        (phones.length ? row(u.phone, phones.join("<br>")) : "") +
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
      pinTok++; // a new scroll replaces any pending scrollNow()
      setActive(catId);
      lockSpy();
      target.scrollIntoView({ block: "start", behavior: prev === view ? motion() : "instant" });
    } else {
      scrollNow(0);
    }
    spy();
  }
  // Each view change is a history entry, so the phone's Back button moves between views.
  function navigate(v, catId) {
    v = VIEWS.indexOf(v) >= 0 ? v : "home";
    if (v !== view) {
      saveScroll();
      push({ view: v }, "#" + v);
    }
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
  var POS_KEY = "menu-pos:" + location.pathname, curId = null, pinTok = 0;
  var pos = (function () {
    try {
      var o = JSON.parse(sessionStorage.getItem(POS_KEY) || "{}");
      return o && typeof o === "object" && !Array.isArray(o) ? o : {};
    } catch (e) { return {}; }
  })();
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function remember() { if (curId) pos[curId] = Math.round(window.scrollY); }
  function writePos() {
    try {
      var keys = Object.keys(pos);
      while (keys.length > 60) delete pos[keys.shift()]; // only recent entries matter
      sessionStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch (e) {}
  }
  function posOf(st) { return st.id && typeof pos[st.id] === "number" ? pos[st.id] : st.y > 0 ? st.y : 0; }
  function saveScroll() {
    remember();
    writePos();
    try { history.replaceState(merge(state(), { y: Math.round(window.scrollY) }), ""); } catch (e) {}
  }
  function push(st, url) {
    st = merge(st, { id: newId() });
    try {
      if (url) history.pushState(st, "", url); else history.pushState(st, "");
      curId = st.id;
    } catch (e) {}
  }
  // Scrolls at once. A smooth scroll that was still running (a category tap just before
  // Back) can land one more frame after that, so the position is applied again two frames later.
  function scrollNow(y) {
    var tk = ++pinTok;
    window.scrollTo({ top: y, behavior: "instant" });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (tk === pinTok && Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y, behavior: "instant" });
      });
    });
  }

  /* ---------- Category highlighting ---------- */
  // While a tap scrolls to a category, the highlight stays on that category. The lock ends
  // when the scroll ends (scrollend, or no scroll event for 250 ms), on wheel or touch, or
  // after 900 ms if nothing scrolled at all.
  var spyLock = false, lockTimer = 0;
  function lockSpy() { spyLock = true; clearTimeout(lockTimer); lockTimer = setTimeout(unlockSpy, 900); }
  function unlockSpy() { spyLock = false; clearTimeout(lockTimer); }
  var saveTimer = 0;
  function onScroll() {
    remember();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveScroll, 300);
    if (spyLock) { clearTimeout(lockTimer); lockTimer = setTimeout(unlockSpy, 250); return; }
    spy();
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
    var line = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) + 12;
    var current = sections[0];
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) current = s; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1];
    if (current.dataset.catId !== activeCat) setActive(current.dataset.catId);
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
  function pushOverlay(kind, key) {
    if (overlayEntry()) return;
    saveScroll();
    push({ overlay: kind, item: key || null, view: view, y: Math.round(window.scrollY) });
  }
  function reopen(st) {
    if (st.overlay === "drawer") { openDrawer(); return true; }
    if (st.overlay === "sheet" && itemsByKey[st.item]) {
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
    var u = UI[lang], desc = t(it.desc), stats = [];
    var ing = list(it.ingredients).map(t).filter(function (x) { return x.trim() !== ""; });
    var time = val(it.time), kcal = val(it.calories);
    if (time && given(time)) stats.push('<div class="stat"><small>' + esc(u.prep) + "</small><b>" + bdi(approx(time, u.min)) + "</b></div>");
    if (kcal && given(kcal)) stats.push('<div class="stat"><small>' + esc(u.calories) + "</small><b>" + bdi(approx(kcal, u.kcal)) + "</b></div>");
    $("sheetBody").innerHTML = thumb(it) +
      '<div class="sheet-head"><h2 id="sheetTitle">' + bdi(t(it.name)) + "</h2>" + price(it.price) + "</div>" +
      (it.tags.length ? '<div class="tags">' + it.tags.map(function (g) {
        return '<span class="tag' + (g === "popular" ? " hot" : "") + '">' + bdi(tagLabel(g)) + "</span>";
      }).join("") + "</div>" : "") +
      (desc ? '<p class="sheet-desc">' + bdi(desc) + "</p>" : "") +
      (stats.length ? '<div class="stats">' + stats.join("") + "</div>" : "") +
      (ing.length ? "<h3>" + esc(u.ingredients) + '</h3><ul class="ingredients">' +
        ing.map(function (x) { return "<li>" + bdi(t(x)) + "</li>"; }).join("") + "</ul>" : "");
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
    popTimer = setTimeout(function () { if (popping) settlePop(); }, 700); // in case popstate never arrives
    history.back();
  }
  function settlePop() {
    var ours = popping; // true when the page stepped back itself, false for the browser's Back or Forward
    popping = false;
    clearTimeout(popTimer);
    clearTimeout(saveTimer); // a pending save belongs to the entry we just left
    // scrollRestoration is "manual", so the page has not moved yet: this is the position of the entry left.
    var y = Math.round(window.scrollY);
    if (curId) pos[curId] = y;
    var st = state(), v = viewFromHash();
    if (!st.id) { // an entry the page did not make, such as a #about typed into the address bar
      st = merge(st, { id: newId(), view: v });
      try { history.replaceState(st, ""); } catch (e) {}
    }
    curId = st.id;
    closeAll();
    if (v !== view) {
      show(v);
      scrollNow(posOf(st));
    } else {
      pos[curId] = y; // an overlay opened or closed: the page stays where it is
    }
    saveScroll();
    var fn = afterPop;
    afterPop = null;
    if (fn) fn();
    else if (!ours && st.overlay && !reopen(st)) stepBack(); // a dish no longer in config.js: skip its entry
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
      var go = function () {
        if (!keepSearch) clearSearch();
        navigate(v, cat);
      };
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
      clearSearch();
      navigate("home");
    });

    $("langBtn").addEventListener("click", function () {
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
      } else {
        window.scrollTo({ top: y, behavior: "instant" });
      }
      spy();
    });

    var search = $("search");
    search.addEventListener("input", filterMenu);
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); search.blur(); } // closes the phone keyboard
    });
    $("searchJump").addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: motion() });
      focusNoScroll(search);
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", saveScroll); // sessionStorage keeps it through a reload
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") saveScroll(); // phones may discard a tab without pagehide
    });
    window.addEventListener("scrollend", function () { if (spyLock) unlockSpy(); });
    window.addEventListener("wheel", unlockSpy, { passive: true });
    window.addEventListener("touchstart", unlockSpy, { passive: true });
    window.addEventListener("resize", function () { activeCat = undefined; spy(); });
    window.addEventListener("popstate", settlePop);
    bindSwipe();
  }

  // Broken photos fall back to the emoji; a broken logo falls back to the name.
  document.addEventListener("error", function (e) {
    var el = e.target;
    if (!el || el.tagName !== "IMG") return;
    if (el.closest(".thumb")) el.remove();
    else if (el.closest("#brand")) $("brand").innerHTML = '<span class="brand-text">' + bdi(t(brandCfg.name)) + "</span>";
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
    var same = st.view === view, y = same ? posOf(st) : 0;
    curId = st.id && same ? st.id : newId();
    if (y > 0) scrollNow(y);
    var here = { view: view, id: curId, y: y };
    // After a reload with a dish or the drawer open, open it again on the same history entry.
    if (same && st.overlay) {
      if (reopen(st)) here = merge(st, here);
      else {
        // That dish is no longer in config.js: go back to the entry under it, so Back is not a dead press.
        try { history.replaceState(merge(st, here), ""); } catch (e) {}
        stepBack();
        here = null;
      }
    }
    if (here) {
      try { history.replaceState(here, "", "#" + view); } catch (e) {}
    }
  } catch (err) {
    console.error("[menu] Could not build the menu:", err);
    fatal();
  }
})();

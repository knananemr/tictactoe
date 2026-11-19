/* QR Menu — core template logic. Client content lives in config.js. */
(function () {
  "use strict";

  var cfg = window.MENU_CONFIG;
  var $ = function (id) { return document.getElementById(id); };

  // Interface texts (not client specific).
  var UI = {
    en: {
      dir: "ltr", switchTo: "עב", home: "Home", menu: "Menu", about: "About & Hours",
      viewMenu: "View the menu", picks: "Today's picks", categories: "Categories",
      items: "items", search: "Search the menu…", noResults: "Nothing found. Try another word.",
      prep: "Preparation", approx: "~", min: "min", calories: "Calories", kcal: "kcal", ingredients: "Ingredients",
      aboutUs: "About us", hours: "Opening hours", contact: "Contact", address: "Address", phone: "Phone",
      openMenu: "Open navigation", close: "Close",
      tags: { popular: "Best seller", "new": "New", spicy: "Spicy", vegan: "Vegan" }
    },
    he: {
      dir: "rtl", switchTo: "EN", home: "בית", menu: "תפריט", about: "אודות ושעות פתיחה",
      viewMenu: "לתפריט", picks: "המומלצים של היום", categories: "קטגוריות",
      items: "מנות", search: "חיפוש בתפריט…", noResults: "לא נמצאו תוצאות. נסו מילה אחרת.",
      prep: "זמן הכנה", approx: "כ-", min: "דק׳", calories: "קלוריות", kcal: "קק״ל", ingredients: "מרכיבים",
      aboutUs: "עלינו", hours: "שעות פתיחה", contact: "יצירת קשר", address: "כתובת", phone: "טלפון",
      openMenu: "פתיחת ניווט", close: "סגירה",
      tags: { popular: "הכי נמכר", "new": "חדש", spicy: "חריף", vegan: "טבעוני" }
    }
  };

  var lang = pickLang();
  var view = "home";
  var itemsById = {};
  cfg.categories.forEach(function (c) { c.items.forEach(function (it) { itemsById[it.id] = it; }); });

  function pickLang() {
    var langs = cfg.languages || ["en"];
    var fromUrl = new URLSearchParams(location.search).get("lang");
    var saved = null;
    try { saved = localStorage.getItem("menu-lang"); } catch (e) {}
    var want = fromUrl || saved || cfg.defaultLang;
    return langs.indexOf(want) >= 0 ? want : langs[0];
  }

  function t(v) { // pick the current language out of { en, he }
    if (v == null) return "";
    if (typeof v === "string") return v;
    return v[lang] != null ? v[lang] : (v.en || "");
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function price(p) { return '<bdi class="price">' + esc(cfg.currency || "") + esc(p) + "</bdi>"; }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function applyTheme() {
    var map = { bg: "--bg", card: "--card", ink: "--ink", muted: "--muted", line: "--line", accent: "--accent", radius: "--radius" };
    Object.keys(cfg.theme || {}).forEach(function (k) {
      if (map[k]) document.documentElement.style.setProperty(map[k], cfg.theme[k]);
    });
  }

  /* ---------- Rendering ---------- */
  function thumb(it) {
    return '<span class="thumb">' +
      (it.image ? '<img src="' + esc(it.image) + '" alt="" loading="lazy">' : esc(it.emoji || "🍽️")) +
      "</span>";
  }
  function card(it) {
    var tag = (it.tags || [])[0];
    return '<button class="card" data-item="' + esc(it.id) + '">' + thumb(it) +
      '<span class="card-name">' + esc(t(it.name)) + "</span>" +
      '<span class="card-tag' + (tag === "popular" ? " hot" : "") + '">' + (tag ? esc(UI[lang].tags[tag] || "") : "") + "</span>" +
      price(it.price) + "</button>";
  }

  function renderChrome() {
    var u = UI[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = u.dir;
    document.title = t(cfg.brand.name) + " · " + u.menu;
    var brand = cfg.brand.logo
      ? '<img src="' + esc(cfg.brand.logo) + '" alt="' + esc(t(cfg.brand.name)) + '">'
      : esc(t(cfg.brand.name));
    $("brand").innerHTML = brand;
    $("drawerBrand").textContent = t(cfg.brand.name);
    $("menuBtn").setAttribute("aria-label", u.openMenu);
    $("drawerClose").setAttribute("aria-label", u.close);
    $("sheetClose").setAttribute("aria-label", u.close);
    var lb = $("langBtn");
    lb.hidden = (cfg.languages || []).length < 2;
    lb.textContent = u.switchTo;
    $("search").placeholder = u.search;
    $("search").setAttribute("aria-label", u.search);

    var links = [["home", u.home], ["menu", u.menu], ["about", u.about]];
    $("drawerLinks").innerHTML = links.map(function (l) {
      var html = '<button class="drawer-link' + (view === l[0] ? " active" : "") + '" data-view="' + l[0] + '">' + esc(l[1]) + "</button>";
      if (l[0] === "menu") {
        html += '<div class="drawer-sub">' + cfg.categories.map(function (c) {
          return '<button data-cat="' + esc(c.id) + '"><span>' + esc(t(c.name)) + '</span><span class="count">' + pad2(c.items.length) + "</span></button>";
        }).join("") + "</div>";
      }
      return html;
    }).join("");
  }

  function renderHome() {
    var u = UI[lang];
    var picks = Object.keys(itemsById).map(function (k) { return itemsById[k]; }).filter(function (it) { return it.featured; });
    $("view-home").innerHTML =
      '<div class="hero"><h1>' + esc(t(cfg.home.headline)) + "</h1><p>" + esc(t(cfg.home.subtitle)) + "</p>" +
      '<button class="btn" data-view="menu">' + esc(u.viewMenu) + "</button></div>" +
      (picks.length ? '<div class="section-title"><h2>' + esc(u.picks) + '</h2></div><div class="h-scroll">' + picks.map(card).join("") + "</div>" : "") +
      '<div class="section-title"><h2>' + esc(u.categories) + '</h2></div><div class="cat-tiles">' +
      cfg.categories.map(function (c) {
        return '<button class="cat-tile" data-cat="' + esc(c.id) + '"><span class="emoji">' + esc(c.emoji || "") + "</span><span>" +
          esc(t(c.name)) + "<small>" + c.items.length + " " + esc(u.items) + "</small></span></button>";
      }).join("") + "</div>";
  }

  function renderMenu() {
    var q = $("search").value.trim().toLowerCase();
    var visible = [];
    var html = cfg.categories.map(function (c) {
      var items = c.items.filter(function (it) {
        if (!q) return true;
        var hay = [t(it.name), t(it.desc)].concat((it.ingredients && it.ingredients[lang]) || []).join(" ").toLowerCase();
        return hay.indexOf(q) >= 0;
      });
      if (!items.length) return "";
      visible.push(c);
      return '<section class="cat-section" id="cat-' + esc(c.id) + '" data-cat-id="' + esc(c.id) + '">' +
        '<div class="section-title"><h2>' + esc(t(c.name)) + '</h2><span class="count">' + pad2(items.length) + "</span></div>" +
        '<div class="grid">' + items.map(card).join("") + "</div></section>";
    }).join("");
    $("sections").innerHTML = html || '<p class="empty">' + esc(UI[lang].noResults) + "</p>";

    $("chips").innerHTML = visible.map(function (c) {
      return '<button class="chip" data-cat="' + esc(c.id) + '">' + esc(t(c.name)) + "</button>";
    }).join("");
    $("sideCats").innerHTML = visible.map(function (c) {
      return '<button data-cat="' + esc(c.id) + '"><span>' + esc(t(c.name)) + '</span><span class="count">' + pad2(c.items.length) + "</span></button>";
    }).join("");
    activeCat = null;
    spy();
  }

  function renderAbout() {
    var u = UI[lang], info = cfg.info || {};
    $("view-about").innerHTML = '<div class="info-wrap">' +
      '<div class="info-card"><h2>' + esc(u.aboutUs) + "</h2><p>" + esc(t(info.about)) + "</p></div>" +
      '<div class="info-card"><h2>' + esc(u.hours) + "</h2>" + (info.hours || []).map(function (h) {
        return '<div class="info-row"><span>' + esc(t(h.days)) + "</span><span dir=\"ltr\">" + esc(h.time) + "</span></div>";
      }).join("") + "</div>" +
      '<div class="info-card"><h2>' + esc(u.contact) + "</h2>" +
      (info.address ? '<div class="info-row"><span>' + esc(u.address) + "</span><span>" + esc(t(info.address)) + "</span></div>" : "") +
      (info.phone ? '<div class="info-row"><span>' + esc(u.phone) + '</span><a dir="ltr" href="tel:' + esc(info.phone) + '"><span>' + esc(info.phone) + "</span></a></div>" : "") +
      "</div></div>";
  }

  function renderAll() { renderChrome(); renderHome(); renderMenu(); renderAbout(); }

  /* ---------- Navigation ---------- */
  function show(v, catId) {
    view = ["home", "menu", "about"].indexOf(v) >= 0 ? v : "home";
    ["home", "menu", "about"].forEach(function (n) { $("view-" + n).hidden = n !== view; });
    document.querySelectorAll(".drawer-link").forEach(function (b) {
      b.classList.toggle("active", b.dataset.view === view);
    });
    if (location.hash !== "#" + view) { try { history.replaceState(null, "", "#" + view); } catch (e) {} }
    var target = catId && view === "menu" ? $("cat-" + catId) : null;
    if (target) target.scrollIntoView({ block: "start" });
    else window.scrollTo(0, 0);
    spy();
  }

  var activeCat = null;
  function spy() { // highlight the category currently on screen
    if (view !== "menu") return;
    var sections = document.querySelectorAll(".cat-section");
    if (!sections.length) return;
    var line = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) + 12;
    var current = sections[0];
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) current = s; });
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) current = sections[sections.length - 1];
    var id = current.dataset.catId;
    if (id === activeCat) return;
    activeCat = id;
    document.querySelectorAll("#chips .chip, #sideCats button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.cat === id);
    });
    var chip = document.querySelector('#chips .chip[data-cat="' + id + '"]');
    var strip = $("chips");
    if (chip && strip.offsetParent) {
      var cr = chip.getBoundingClientRect(), sr = strip.getBoundingClientRect();
      strip.scrollBy({ left: cr.left + cr.width / 2 - (sr.left + sr.width / 2), behavior: "smooth" });
    }
  }

  /* ---------- Drawer & sheet ---------- */
  var lastFocus = null;
  function setOpen(el, open) {
    el.classList.toggle("open", open);
    el.setAttribute("aria-hidden", String(!open));
    el.inert = !open;
  }
  function anyOpen() { return $("drawer").classList.contains("open") || $("sheet").classList.contains("open"); }
  function syncOverlay() {
    $("backdrop").hidden = !anyOpen();
    document.body.classList.toggle("locked", anyOpen());
  }
  function openDrawer() {
    lastFocus = document.activeElement;
    setOpen($("drawer"), true);
    $("menuBtn").setAttribute("aria-expanded", "true");
    syncOverlay();
    $("drawerClose").focus();
  }
  function openItem(id) {
    var it = itemsById[id];
    if (!it) return;
    var u = UI[lang];
    var ing = (it.ingredients && it.ingredients[lang]) || [];
    $("sheetBody").innerHTML = thumb(it) +
      '<div class="sheet-head"><h2 id="sheetTitle">' + esc(t(it.name)) + "</h2>" + price(it.price) + "</div>" +
      ((it.tags || []).length ? '<div class="tags">' + it.tags.map(function (g) {
        return '<span class="tag' + (g === "popular" ? " hot" : "") + '">' + esc(u.tags[g] || g) + "</span>";
      }).join("") + "</div>" : "") +
      (t(it.desc) ? '<p class="sheet-desc">' + esc(t(it.desc)) + "</p>" : "") +
      '<div class="stats">' +
      (it.time ? '<div class="stat"><small>' + esc(u.prep) + "</small><b>" + esc(u.approx) + esc(it.time) + " " + esc(u.min) + "</b></div>" : "") +
      (it.calories ? '<div class="stat"><small>' + esc(u.calories) + "</small><b>" + esc(u.approx) + esc(Number(it.calories).toLocaleString("en")) + " " + esc(u.kcal) + "</b></div>" : "") +
      "</div>" +
      (ing.length ? "<h3>" + esc(u.ingredients) + '</h3><ul class="ingredients">' + ing.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "");
    $("sheet").setAttribute("aria-labelledby", "sheetTitle");
    lastFocus = document.activeElement;
    $("sheet").scrollTop = 0;
    setOpen($("sheet"), true);
    syncOverlay();
    $("sheetClose").focus();
  }
  function closeAll() {
    if (!anyOpen()) return;
    setOpen($("drawer"), false);
    setOpen($("sheet"), false);
    $("menuBtn").setAttribute("aria-expanded", "false");
    syncOverlay();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- Events ---------- */
  $("menuBtn").addEventListener("click", openDrawer);
  $("drawerClose").addEventListener("click", closeAll);
  $("sheetClose").addEventListener("click", closeAll);
  $("backdrop").addEventListener("click", closeAll);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(); });

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-item], [data-view], [data-cat]");
    if (!el) return;
    if (el.dataset.item) { openItem(el.dataset.item); return; }
    closeAll();
    if (el.dataset.view) show(el.dataset.view);
    else show("menu", el.dataset.cat);
  });

  $("brand").addEventListener("click", function (e) { e.preventDefault(); show("home"); });
  $("langBtn").addEventListener("click", function () {
    var langs = cfg.languages;
    lang = langs[(langs.indexOf(lang) + 1) % langs.length];
    try { localStorage.setItem("menu-lang", lang); } catch (e) {}
    renderAll();
    show(view);
  });
  $("search").addEventListener("input", renderMenu);
  window.addEventListener("scroll", spy, { passive: true });
  window.addEventListener("resize", function () { activeCat = null; spy(); });
  window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });

  applyTheme();
  renderAll();
  show(location.hash.slice(1) || "home");
})();

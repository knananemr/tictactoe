/* Nearby — local shop & clinic finder (front-end prototype, no server yet). */
(function () {
  "use strict";

  const STORE_KEY = "nearby.myShops";
  const LANG_KEY = "nearby.lang";
  const MAX_PHOTOS = 4;

  const TEXT = {
    en: {
      addShop: "Open your shop", langSwitch: "עברית",
      heroTitle: "Find great local shops & clinics near you",
      heroSub: "Barbers, salons, clinics and more — including the small ones you'd never spot from the street.",
      searchPh: "Search a shop, service or street…",
      all: "All", nearMe: "📍 Near me", locating: "Finding your location…",
      locOn: "Sorted by distance from you", locDenied: "Couldn't get your location — showing all shops.",
      anyDistance: "Any distance", within: "Within", openNow: "Open now",
      results: n => n === 1 ? "1 shop" : n + " shops",
      empty: "No shops match. Try another search or category.",
      open: "Open", closed: "Closed", closedDay: "Closed", from: "from",
      back: "← Back to all shops", about: "About", services: "Services & prices", hours: "Opening hours",
      contact: "Contact & location", call: "📞 Call", email: "✉️ Email", directions: "🗺️ Directions",
      min: "min", km: "km", m: "m", notFound: "Shop not found.", remove: "Delete my shop",
      removeConfirm: "Delete this shop?",
      formTitle: "Open your shop", formSub: "Fill in the details — your shop appears in the app right away.",
      demoNote: "Prototype: shops you add are saved only on this device for now.",
      fName: "Shop name", fCategory: "Category", fAbout: "About the shop", fAddress: "Address",
      fPhone: "Phone", fEmail: "Email", fLocation: "Location on the map",
      useLocation: "📍 Use my current location", locSet: "Location saved ✓", locNone: "Not set — customers won't see distance",
      fHours: "Opening hours", fClosed: "Closed", fServices: "Services & prices",
      svcName: "Service", svcPrice: "Price", svcMin: "Minutes", addService: "+ Add service",
      fPhotos: "Photos (up to " + MAX_PHOTOS + ")", publish: "Publish shop",
      errRequired: "Please fill in the shop name, category, address and phone.",
      errStorage: "Couldn't save — photos are too large for this device. Try fewer photos."
    },
    he: {
      addShop: "פתיחת עסק", langSwitch: "English",
      heroTitle: "מצאו עסקים וקליניקות מעולים קרוב אליכם",
      heroSub: "מספרות, סלונים, קליניקות ועוד — כולל הקטנים שלא רואים מהרחוב.",
      searchPh: "חיפוש עסק, שירות או רחוב…",
      all: "הכול", nearMe: "📍 קרוב אליי", locating: "מאתר את המיקום שלך…",
      locOn: "ממוין לפי מרחק ממך", locDenied: "לא הצלחנו לקבל מיקום — מוצגים כל העסקים.",
      anyDistance: "כל מרחק", within: "עד", openNow: "פתוח עכשיו",
      results: n => n === 1 ? "עסק אחד" : n + " עסקים",
      empty: "לא נמצאו עסקים. נסו חיפוש או קטגוריה אחרת.",
      open: "פתוח", closed: "סגור", closedDay: "סגור", from: "החל מ-",
      back: "→ חזרה לכל העסקים", about: "אודות", services: "שירותים ומחירים", hours: "שעות פתיחה",
      contact: "יצירת קשר ומיקום", call: "📞 חיוג", email: "✉️ מייל", directions: "🗺️ ניווט",
      min: "דק׳", km: "ק״מ", m: "מ׳", notFound: "העסק לא נמצא.", remove: "מחיקת העסק שלי",
      removeConfirm: "למחוק את העסק?",
      formTitle: "פתיחת עסק", formSub: "ממלאים את הפרטים — והעסק מופיע באפליקציה מיד.",
      demoNote: "אב-טיפוס: עסקים שתוסיפו נשמרים בינתיים רק במכשיר הזה.",
      fName: "שם העסק", fCategory: "קטגוריה", fAbout: "על העסק", fAddress: "כתובת",
      fPhone: "טלפון", fEmail: "מייל", fLocation: "מיקום על המפה",
      useLocation: "📍 שימוש במיקום הנוכחי שלי", locSet: "המיקום נשמר ✓", locNone: "לא הוגדר — לקוחות לא יראו מרחק",
      fHours: "שעות פתיחה", fClosed: "סגור", fServices: "שירותים ומחירים",
      svcName: "שירות", svcPrice: "מחיר", svcMin: "דקות", addService: "+ הוספת שירות",
      fPhotos: "תמונות (עד " + MAX_PHOTOS + ")", publish: "פרסום העסק",
      errRequired: "יש למלא שם עסק, קטגוריה, כתובת וטלפון.",
      errStorage: "השמירה נכשלה — התמונות גדולות מדי למכשיר. נסו פחות תמונות."
    }
  };

  // ---------- state ----------
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } }
  };

  let lang = store.get(LANG_KEY, "he");
  if (!TEXT[lang]) lang = "he";
  let myShops = store.get(STORE_KEY, []);
  let userPos = null;          // { lat, lng } once the customer shares location
  let locState = "";           // "", "locating", "on", "denied"
  const filter = { q: "", category: "", radius: 0, openNow: false };

  const app = document.getElementById("app");
  const L = () => TEXT[lang];
  const tx = v => (v && typeof v === "object") ? (v[lang] || v.en || v.he || "") : (v || "");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const allShops = () => myShops.concat(window.SAMPLE_SHOPS);
  const category = id => window.CATEGORIES.find(c => c.id === id) || { emoji: "🏪", name: "" };
  const dayName = i => new Intl.DateTimeFormat(lang, { weekday: "long" }).format(new Date(2024, 0, 7 + i));

  // ---------- helpers ----------
  function distanceKm(a, b) {
    const rad = x => x * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  }
  function shopDistance(shop) {
    if (!userPos || typeof shop.lat !== "number" || typeof shop.lng !== "number") return null;
    return distanceKm(userPos, shop);
  }
  function formatDistance(km) {
    return km < 1 ? Math.round(km * 1000 / 10) * 10 + " " + L().m : km.toFixed(1) + " " + L().km;
  }
  function isOpenNow(shop) {
    const now = new Date();
    const slot = shop.hours && shop.hours[now.getDay()];
    if (!slot) return false;
    const hm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    return hm >= slot[0] && hm < slot[1];
  }
  function minPrice(shop) {
    const prices = (shop.services || []).map(s => Number(s.price)).filter(p => p > 0);
    return prices.length ? Math.min(...prices) : null;
  }
  function coverHtml(shop, photo) {
    const cat = category(shop.category);
    if (photo) return `<div class="cover" style="background-image:url('${esc(photo)}')" role="img" aria-label="${esc(tx(shop.name))}"></div>`;
    return `<div class="cover" style="background:${esc(shop.color || "#374151")}" aria-hidden="true">${cat.emoji}</div>`;
  }
  function searchText(shop) {
    const both = v => (v && typeof v === "object") ? (v.en || "") + " " + (v.he || "") : (v || "");
    const cat = category(shop.category);
    return [both(shop.name), both(shop.about), both(shop.address), both(cat.name),
      (shop.services || []).map(s => both(s.name)).join(" ")].join(" ").toLowerCase();
  }

  // ---------- home ----------
  function renderHome() {
    const t = L();
    app.innerHTML = `
      <section class="hero">
        <h1>${esc(t.heroTitle)}</h1>
        <p>${esc(t.heroSub)}</p>
        <div class="search"><input id="q" type="search" autocomplete="off" placeholder="${esc(t.searchPh)}" aria-label="${esc(t.searchPh)}" value="${esc(filter.q)}"></div>
      </section>
      <div class="chips" id="chips">
        <button class="chip" type="button" data-cat="" aria-pressed="${filter.category === ""}">${esc(t.all)}</button>
        ${window.CATEGORIES.map(c => `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${filter.category === c.id}">${c.emoji} ${esc(tx(c.name))}</button>`).join("")}
      </div>
      <div class="filters">
        <button class="chip" type="button" id="nearBtn" aria-pressed="${!!userPos}">${esc(t.nearMe)}</button>
        <select id="radius" aria-label="${esc(t.anyDistance)}" ${userPos ? "" : "hidden"}>
          <option value="0">${esc(t.anyDistance)}</option>
          ${[1, 3, 5, 10].map(r => `<option value="${r}" ${filter.radius === r ? "selected" : ""}>${esc(t.within)} ${r} ${esc(t.km)}</option>`).join("")}
        </select>
        <button class="chip" type="button" id="openBtn" aria-pressed="${filter.openNow}">${esc(t.openNow)}</button>
        <span class="loc-status" id="locStatus" role="status"></span>
      </div>
      <p class="count" id="count"></p>
      <div class="grid" id="grid"></div>`;

    document.getElementById("q").addEventListener("input", e => { filter.q = e.target.value; renderList(); });
    document.getElementById("chips").addEventListener("click", e => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      filter.category = b.dataset.cat;
      document.querySelectorAll("#chips .chip").forEach(c => c.setAttribute("aria-pressed", c === b));
      renderList();
    });
    document.getElementById("radius").addEventListener("change", e => { filter.radius = Number(e.target.value); renderList(); });
    document.getElementById("openBtn").addEventListener("click", e => {
      filter.openNow = !filter.openNow;
      e.currentTarget.setAttribute("aria-pressed", filter.openNow);
      renderList();
    });
    document.getElementById("nearBtn").addEventListener("click", locate);
    renderList();
  }

  function renderList() {
    const t = L();
    const grid = document.getElementById("grid");
    if (!grid) return;
    const words = filter.q.toLowerCase().split(/\s+/).filter(Boolean);

    let shops = allShops().map(shop => ({ shop, dist: shopDistance(shop) })).filter(({ shop, dist }) => {
      if (filter.category && shop.category !== filter.category) return false;
      if (filter.openNow && !isOpenNow(shop)) return false;
      if (userPos && filter.radius && (dist === null || dist > filter.radius)) return false;
      if (words.length) { const hay = searchText(shop); if (!words.every(w => hay.includes(w))) return false; }
      return true;
    });
    if (userPos) shops.sort((a, b) => (a.dist === null ? Infinity : a.dist) - (b.dist === null ? Infinity : b.dist));

    const status = { locating: t.locating, on: t.locOn, denied: t.locDenied }[locState] || "";
    document.getElementById("locStatus").textContent = status;
    document.getElementById("count").textContent = t.results(shops.length);

    grid.innerHTML = shops.length ? shops.map(({ shop, dist }) => {
      const cat = category(shop.category);
      const open = isOpenNow(shop);
      const price = minPrice(shop);
      return `
        <a class="card" href="#/shop/${encodeURIComponent(shop.id)}">
          ${coverHtml(shop, shop.photos && shop.photos[0])}
          <div class="card-body">
            <h3>${esc(tx(shop.name))}</h3>
            <p class="meta">${cat.emoji} ${esc(tx(cat.name))}${price !== null ? " · " + esc(t.from) + (lang === "he" ? "" : " ") + window.CURRENCY + price : ""}</p>
            <p class="meta">${esc(tx(shop.address))}</p>
            <div class="row">
              <span class="${open ? "open" : "closed"}">${esc(open ? t.open : t.closed)}</span>
              ${dist !== null ? `<span class="dist">${esc(formatDistance(dist))}</span>` : ""}
            </div>
          </div>
        </a>`;
    }).join("") : `<p class="empty">${esc(t.empty)}</p>`;
  }

  function locate() {
    if (!navigator.geolocation) { locState = "denied"; renderList(); return; }
    locState = "locating"; renderList();
    navigator.geolocation.getCurrentPosition(pos => {
      userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      locState = "on";
      if (currentRoute() === "home") renderHome();
    }, () => {
      locState = "denied";
      renderList();
    }, { timeout: 10000, maximumAge: 300000 });
  }

  // ---------- shop page ----------
  function renderShop(id) {
    const t = L();
    const shop = allShops().find(s => s.id === id);
    if (!shop) { app.innerHTML = `<a class="back" href="#/">${esc(t.back)}</a><p class="empty">${esc(t.notFound)}</p>`; return; }
    const cat = category(shop.category);
    const open = isOpenNow(shop);
    const dist = shopDistance(shop);
    const today = new Date().getDay();
    const photos = shop.photos || [];
    const hasPos = typeof shop.lat === "number" && typeof shop.lng === "number";
    const mapUrl = "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(hasPos ? shop.lat + "," + shop.lng : tx(shop.address));
    const isMine = myShops.some(s => s.id === shop.id);

    app.innerHTML = `
      <a class="back" href="#/">${esc(t.back)}</a>
      <div class="gallery ${photos.length > 1 ? "multi" : ""}">
        ${photos.length ? photos.map(p => coverHtml(shop, p)).join("") : coverHtml(shop)}
      </div>
      <div class="shop-head">
        <h1>${esc(tx(shop.name))}</h1>
        <p class="meta">${cat.emoji} ${esc(tx(cat.name))} · <span class="${open ? "open" : "closed"}">${esc(open ? t.open : t.closed)}</span>${dist !== null ? " · " + esc(formatDistance(dist)) : ""}</p>
        <div class="actions">
          ${shop.phone ? `<a class="btn" href="tel:${esc(shop.phone.replace(/[^\d+]/g, ""))}">${esc(t.call)}</a>` : ""}
          <a class="btn btn-ghost" href="${esc(mapUrl)}" target="_blank" rel="noopener">${esc(t.directions)}</a>
          ${shop.email ? `<a class="btn btn-ghost" href="mailto:${esc(shop.email)}">${esc(t.email)}</a>` : ""}
        </div>
      </div>
      ${tx(shop.about) ? `<section class="panel"><h2>${esc(t.about)}</h2><p>${esc(tx(shop.about))}</p></section>` : ""}
      ${(shop.services || []).length ? `<section class="panel"><h2>${esc(t.services)}</h2><ul class="list">
        ${shop.services.map(s => `<li><span>${esc(tx(s.name))}${s.minutes ? ` <span class="meta">· ${esc(s.minutes)} ${esc(t.min)}</span>` : ""}</span><span class="price">${window.CURRENCY}${esc(s.price)}</span></li>`).join("")}
      </ul></section>` : ""}
      <section class="panel"><h2>${esc(t.hours)}</h2><ul class="list">
        ${(shop.hours || []).map((h, i) => `<li class="${i === today ? "today" : ""}"><span>${esc(dayName(i))}</span><span dir="ltr">${h ? esc(h[0]) + " – " + esc(h[1]) : esc(t.closedDay)}</span></li>`).join("")}
      </ul></section>
      <section class="panel contact"><h2>${esc(t.contact)}</h2>
        <p>📍 ${esc(tx(shop.address))}</p>
        ${shop.phone ? `<p>📞 <a href="tel:${esc(shop.phone.replace(/[^\d+]/g, ""))}" dir="ltr">${esc(shop.phone)}</a></p>` : ""}
        ${shop.email ? `<p>✉️ <a href="mailto:${esc(shop.email)}" dir="ltr">${esc(shop.email)}</a></p>` : ""}
      </section>
      ${isMine ? `<div class="actions"><button class="btn btn-danger" type="button" id="removeBtn">${esc(t.remove)}</button></div>` : ""}`;

    const removeBtn = document.getElementById("removeBtn");
    if (removeBtn) removeBtn.addEventListener("click", () => {
      if (!confirm(t.removeConfirm)) return;
      myShops = myShops.filter(s => s.id !== shop.id);
      store.set(STORE_KEY, myShops);
      location.hash = "#/";
    });
  }

  // ---------- "open your shop" form ----------
  function renderForm() {
    const t = L();
    let pos = null;
    let photos = [];

    const serviceRow = () => `
      <div class="service-row">
        <input name="svcName" placeholder="${esc(t.svcName)}" aria-label="${esc(t.svcName)}">
        <input name="svcPrice" type="number" min="0" inputmode="numeric" placeholder="${esc(t.svcPrice)} ${window.CURRENCY}" aria-label="${esc(t.svcPrice)}">
        <input name="svcMin" type="number" min="0" inputmode="numeric" placeholder="${esc(t.svcMin)}" aria-label="${esc(t.svcMin)}">
        <button class="btn btn-ghost" type="button" data-remove aria-label="✕">✕</button>
      </div>`;

    app.innerHTML = `
      <a class="back" href="#/">${esc(t.back)}</a>
      <h1>${esc(t.formTitle)}</h1>
      <p class="meta">${esc(t.formSub)}</p>
      <form id="shopForm" class="panel" novalidate>
        <p class="hint">${esc(t.demoNote)}</p>
        <div class="field"><label for="fName">${esc(t.fName)} *</label><input id="fName" maxlength="60" required></div>
        <div class="field"><label for="fCategory">${esc(t.fCategory)} *</label>
          <select id="fCategory" required><option value=""></option>
            ${window.CATEGORIES.map(c => `<option value="${c.id}">${c.emoji} ${esc(tx(c.name))}</option>`).join("")}
          </select></div>
        <div class="field"><label for="fAbout">${esc(t.fAbout)}</label><textarea id="fAbout" maxlength="400"></textarea></div>
        <div class="field"><label for="fAddress">${esc(t.fAddress)} *</label><input id="fAddress" maxlength="100" autocomplete="street-address" required></div>
        <div class="two">
          <div class="field"><label for="fPhone">${esc(t.fPhone)} *</label><input id="fPhone" type="tel" maxlength="20" autocomplete="tel" dir="ltr" required></div>
          <div class="field"><label for="fEmail">${esc(t.fEmail)}</label><input id="fEmail" type="email" maxlength="80" autocomplete="email" dir="ltr"></div>
        </div>
        <div class="field"><label>${esc(t.fLocation)}</label>
          <div><button class="btn btn-ghost" type="button" id="fLocBtn">${esc(t.useLocation)}</button></div>
          <p class="hint" id="fLocStatus" role="status">${esc(t.locNone)}</p></div>
        <fieldset class="field"><legend>${esc(t.fHours)}</legend>
          ${[0, 1, 2, 3, 4, 5, 6].map(i => `
            <div class="hours-row" data-day="${i}">
              <span>${esc(dayName(i))}</span>
              <label><input type="checkbox" name="closed" ${i === 6 ? "checked" : ""}> ${esc(t.fClosed)}</label>
              <input type="time" name="from" value="09:00" aria-label="${esc(dayName(i))} ${esc(t.open)}">
              <input type="time" name="to" value="${i === 5 ? "14:00" : "19:00"}" aria-label="${esc(dayName(i))} ${esc(t.closed)}">
            </div>`).join("")}
        </fieldset>
        <fieldset class="field"><legend>${esc(t.fServices)}</legend>
          <div id="services">${serviceRow()}</div>
          <div><button class="btn btn-ghost" type="button" id="addService">${esc(t.addService)}</button></div>
        </fieldset>
        <div class="field"><label for="fPhotos">${esc(t.fPhotos)}</label>
          <input id="fPhotos" type="file" accept="image/*" multiple>
          <div class="thumbs" id="thumbs"></div></div>
        <p class="error" id="formError" role="alert" hidden></p>
        <button class="btn submit" type="submit">${esc(t.publish)}</button>
      </form>`;

    const form = document.getElementById("shopForm");
    const services = document.getElementById("services");
    const error = document.getElementById("formError");

    document.getElementById("addService").addEventListener("click", () => services.insertAdjacentHTML("beforeend", serviceRow()));
    services.addEventListener("click", e => {
      if (e.target.closest("[data-remove]") && services.children.length > 1) e.target.closest(".service-row").remove();
    });

    document.getElementById("fLocBtn").addEventListener("click", () => {
      const status = document.getElementById("fLocStatus");
      if (!navigator.geolocation) { status.textContent = t.locDenied; return; }
      status.textContent = t.locating;
      navigator.geolocation.getCurrentPosition(p => {
        pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        status.textContent = t.locSet;
      }, () => { status.textContent = t.locDenied; }, { timeout: 10000 });
    });

    document.getElementById("fPhotos").addEventListener("change", async e => {
      const files = Array.from(e.target.files).slice(0, MAX_PHOTOS);
      photos = (await Promise.all(files.map(shrinkImage))).filter(Boolean);
      document.getElementById("thumbs").innerHTML = photos.map(p => `<img src="${esc(p)}" alt="">`).join("");
    });

    form.addEventListener("submit", e => {
      e.preventDefault();
      const val = id => document.getElementById(id).value.trim();
      if (!val("fName") || !val("fCategory") || !val("fAddress") || !val("fPhone")) {
        error.textContent = t.errRequired; error.hidden = false; return;
      }
      const shop = {
        id: "u" + Date.now().toString(36),
        name: val("fName"), category: val("fCategory"), about: val("fAbout"),
        address: val("fAddress"), phone: val("fPhone"), email: val("fEmail"),
        color: "#374151", photos,
        hours: Array.from(form.querySelectorAll(".hours-row")).map(row => {
          const from = row.querySelector('[name="from"]').value, to = row.querySelector('[name="to"]').value;
          return row.querySelector('[name="closed"]').checked || !from || !to ? null : [from, to];
        }),
        services: Array.from(services.children).map(row => ({
          name: row.querySelector('[name="svcName"]').value.trim(),
          price: Number(row.querySelector('[name="svcPrice"]').value) || 0,
          minutes: Number(row.querySelector('[name="svcMin"]').value) || 0
        })).filter(s => s.name)
      };
      if (pos) { shop.lat = pos.lat; shop.lng = pos.lng; }

      if (!store.set(STORE_KEY, [shop].concat(myShops))) {
        error.textContent = t.errStorage; error.hidden = false; return;
      }
      myShops = [shop].concat(myShops);
      location.hash = "#/shop/" + shop.id;
    });
  }

  // Resize a picked photo so it fits in local storage.
  function shrinkImage(file) {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 900 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  // ---------- routing & chrome ----------
  function currentRoute() {
    const h = location.hash;
    if (h.startsWith("#/shop/")) return "shop";
    if (h === "#/new") return "new";
    return "home";
  }
  function render() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.title = tx(window.APP_NAME);
    document.getElementById("brand").textContent = tx(window.APP_NAME);
    document.getElementById("navNew").textContent = L().addShop;
    document.getElementById("langBtn").textContent = L().langSwitch;

    const route = currentRoute();
    if (route === "shop") renderShop(decodeURIComponent(location.hash.slice("#/shop/".length)));
    else if (route === "new") renderForm();
    else renderHome();
  }

  document.getElementById("langBtn").addEventListener("click", () => {
    lang = lang === "he" ? "en" : "he";
    store.set(LANG_KEY, lang);
    render();
  });
  window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
  render();
})();

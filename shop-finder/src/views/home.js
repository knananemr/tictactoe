// Home: hero, search, categories, filters, "near me" and the list of shops.
import { state } from "../state.js";
import { L, tx, formatDistance } from "../text.js";
import { esc, normalizeText, HE_PREFIX, setText, app } from "../util.js";
import { ICON, catIcon, awningSvg } from "../icons.js";
import { CATEGORIES, category } from "../categories.js";
import { allShops, shopDistance } from "../shops.js";
import { openState, stateDetail } from "../hours.js";
import { noticeHtml } from "../notices.js";
import { cardHtml } from "./card.js";

const DEMO_POS = { lat: 32.0753, lng: 34.7749 }; // Dizengoff Center, for trying "near me" without location access

function searchText(shop) {
  if (shop._hay) return shop._hay;
  const both = v => (v && typeof v === "object") ? v.en + " " + v.he : (v || "");
  const cat = category(shop.category);
  shop._hay = " " + normalizeText([both(shop.name), both(shop.about), both(shop.address), both(cat.name), both(cat.keywords),
    shop.services.map(s => both(s.name)).join(" ")].join(" ")).split(/\s+/).filter(Boolean).join(" ") + " ";
  return shop._hay;
}
// A Hebrew word may carry a one-letter prefix (ה, ו, ב, ל, מ, ש, כ): "המספרה" should find "מספרה".
// The shortened word must then be a whole word (or, from 4 letters, the start of one), so
// "כאבי" does not match "אבי" inside "תל אביב".
function wordMatches(hay, w) {
  if (hay.includes(w)) return true;
  if (w.length < 4 || !HE_PREFIX.test(w)) return false;
  const rest = w.slice(1);
  return hay.includes(" " + rest + " ") || (rest.length >= 4 && hay.includes(" " + rest));
}

function renderHome() {
  const t = L();
  document.title = t.titleHome;
  const shops = allShops();
  const counts = {};
  shops.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
  const catTile = (c, label, n, extraClass, icon) => `
      <button class="shopfront ${extraClass || ""}" type="button" data-cat="${esc(c ? c.id : "")}" aria-pressed="${state.filter.category === (c ? c.id : "")}">
        <span class="tile-icon" aria-hidden="true">${icon}</span>
        <span class="name">${esc(label)}</span>
        <span class="n" data-count="${esc(c ? c.id : "")}">${esc(t.places(n))}</span>
      </button>`;

  app.innerHTML = `
      ${noticeHtml()}
      <section class="hero">
        <p class="eyebrow fade-in" id="eyebrow"><span class="dot" aria-hidden="true"></span><span>${esc(t.eyebrow(shops.length))}</span></p>
        <h1 class="fade-in" tabindex="-1">${esc(t.heroA)} <em>${esc(t.heroEm)}</em></h1>
        <p class="hero-sub fade-in">${esc(t.heroSub)}</p>
        <form class="searchbar fade-in" role="search" id="searchForm">
          ${ICON.search}
          <label class="sr-only" for="q">${esc(t.searchLabel)}</label>
          <input id="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="${esc(t.searchPh)}" value="${esc(state.filter.q)}">
          <button class="btn btn-sm near-btn" type="button" id="nearBtn" aria-pressed="${!!state.userPos}">${ICON.locate}<span class="label-long">${esc(t.nearMe)}</span></button>
        </form>
        <div class="hero-art" aria-hidden="true">
          <div class="store">
            ${awningSvg("store-awning")}
            <div class="facade">
              <div class="pane">${ICON.scissors}</div>
              <div class="door"><span class="sign">${esc(t.openSign)}</span></div>
              <div class="pane">${ICON.polish}</div>
            </div>
            <div class="step"></div>
            <span class="plant">${ICON.leaf}</span>
          </div>
        </div>
      </section>
      <div class="street" id="street" role="group" aria-label="${esc(t.catsLabel)}">
        ${catTile(null, t.allCats, shops.length, "all", ICON.grid)}
        ${CATEGORIES.map(c => catTile(c, tx(c.name), counts[c.id] || 0, "", catIcon(c))).join("")}
      </div>
      <section aria-labelledby="resultsTitle">
        <div class="toolbar">
          <div>
            <h2 id="resultsTitle" tabindex="-1"></h2>
            <p class="count" id="count" aria-live="polite"></p>
          </div>
          <div class="toolbar-filters">
            <button class="toggle" type="button" id="openBtn" aria-pressed="${state.filter.openNow}"><span class="sw" aria-hidden="true"></span>${esc(t.openNow)}</button>
            <label class="sr-only" for="radius">${esc(t.distanceLabel)}</label>
            <select class="select" id="radius">
              <option value="0">${esc(t.anyDistance)}</option>
              ${[1, 3, 5, 10].map(r => `<option value="${r}" ${state.filter.radius === r ? "selected" : ""}>${esc(t.within(r))}</option>`).join("")}
            </select>
          </div>
          <p class="status-line" id="locStatus" role="status"></p>
          <button class="btn btn-ghost btn-sm demo-btn" type="button" id="demoBtn" hidden>${ICON.locate}${esc(t.demoSpot)}</button>
        </div>
        <div class="grid" id="grid"></div>
      </section>
      <section class="owner-cta">
        <div class="cta-text">
          <h2>${esc(t.ctaTitle)}</h2>
          <p>${esc(t.ctaText)}</p>
        </div>
        <a class="btn" href="#/new">${esc(t.ctaBtn)}${ICON.arrow}</a>
        <div class="cta-art" aria-hidden="true">${awningSvg("cta-awning")}<span class="cta-body"><span class="cta-win"></span><span class="cta-door"></span></span></div>
      </section>`;

  const q = document.getElementById("q");
  let qTimer = 0;
  q.addEventListener("input", () => {
    state.filter.q = q.value;
    clearTimeout(qTimer);
    qTimer = setTimeout(() => updateResults(false), 90);
  });
  document.getElementById("searchForm").addEventListener("submit", e => {
    e.preventDefault();
    clearTimeout(qTimer);
    updateResults(false);
    // moving focus (not blur) closes the phone keyboard and keeps screen readers in place
    const title = document.getElementById("resultsTitle");
    title.focus({ preventScroll: true });
    title.scrollIntoView({ block: "start" });
  });
  const street = document.getElementById("street");
  street.addEventListener("click", e => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    // pressing the selected category again turns it off (back to "All")
    state.filter.category = state.filter.category === b.dataset.cat ? "" : b.dataset.cat;
    updateResults(true);
  });
  // keep a focused tile clear of the faded edge
  street.addEventListener("focusin", e => {
    const b = e.target.closest(".shopfront");
    if (b && street.scrollWidth > street.clientWidth) b.scrollIntoView({ inline: "nearest", block: "nearest" });
  });
  document.getElementById("radius").addEventListener("change", e => { state.filter.radius = Number(e.target.value) || 0; updateResults(true); });
  document.getElementById("openBtn").addEventListener("click", () => { state.filter.openNow = !state.filter.openNow; updateResults(true); });
  document.getElementById("nearBtn").addEventListener("click", toggleNearMe);
  document.getElementById("demoBtn").addEventListener("click", () => {
    state.locToken++;
    state.userPos = Object.assign({}, DEMO_POS);
    state.locState = "demo";
    updateResults(true);
    document.getElementById("nearBtn").focus();
  });
  updateResults(state.firstRender);
}

function filteredShops() {
  const words = normalizeText(state.filter.q).split(/\s+/).filter(Boolean);
  const list = allShops().map(shop => ({ shop, dist: shopDistance(shop) })).filter(({ shop, dist }) => {
    if (state.filter.category && shop.category !== state.filter.category) return false;
    if (state.filter.openNow && !openState(shop).open) return false;
    if (state.userPos && state.filter.radius && (dist === null || dist > state.filter.radius)) return false;
    if (words.length) { const hay = searchText(shop); if (!words.every(w => wordMatches(hay, w))) return false; }
    return true;
  });
  if (state.userPos) list.sort((a, b) => (a.dist === null ? Infinity : a.dist) - (b.dist === null ? Infinity : b.dist));
  return list;
}

// What the list shows right now; the minute refresh only redraws when this changes.
const resultsSignature = list => state.lang + "|" + list.map(({ shop, dist }) => { const st = openState(shop); return shop.id + ":" + st.open + ":" + stateDetail(st) + ":" + (dist === null ? "" : formatDistance(dist)); }).join(",");

function updateResults(animate) {
  const t = L();
  const grid = document.getElementById("grid");
  if (!grid) return;
  const list = filteredShops();

  document.querySelectorAll("#street [data-cat]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.cat === state.filter.category)));
  document.getElementById("openBtn").setAttribute("aria-pressed", String(state.filter.openNow));
  const near = document.getElementById("nearBtn");
  near.setAttribute("aria-pressed", String(!!state.userPos));
  near.setAttribute("aria-busy", String(state.locState === "locating"));
  const radius = document.getElementById("radius");
  radius.hidden = !state.userPos;
  radius.value = String(state.filter.radius);

  const cat = state.filter.category ? category(state.filter.category) : null;
  setText(document.getElementById("resultsTitle"), cat ? tx(cat.name) : (state.userPos ? t.nearYou : t.allShops));
  setText(document.getElementById("count"), t.results(list.length));
  const status = document.getElementById("locStatus");
  setText(status, { locating: t.locating, on: t.locOn, demo: t.locDemo, denied: t.locDenied, unavailable: t.locUnavailable, unsupported: t.locUnsupported }[state.locState] || "");
  const failed = state.locState === "denied" || state.locState === "unavailable" || state.locState === "unsupported";
  status.classList.toggle("warn", failed);
  document.getElementById("demoBtn").hidden = !failed;

  state.homeSig = resultsSignature(list);
  grid.classList.toggle("calm", !animate);
  grid.innerHTML = list.length
    ? list.map(({ shop, dist }, i) => cardHtml(shop, dist, i)).join("")
    : `<div class="empty"><span class="big" aria-hidden="true">${ICON.search}</span><h3>${esc(t.emptyTitle)}</h3><p>${esc(t.empty)}</p>
           <button class="btn btn-ghost btn-sm" type="button" id="clearBtn">${esc(t.clearFilters)}</button></div>`;
  const clear = document.getElementById("clearBtn");
  if (clear) clear.addEventListener("click", () => {
    Object.assign(state.filter, { q: "", category: "", radius: 0, openNow: false });
    document.getElementById("q").value = "";
    updateResults(true);
    document.getElementById("q").focus();
  });
}

function toggleNearMe() {
  if (state.locState === "locating") return;
  if (state.userPos) {
    state.userPos = null; state.locState = ""; state.filter.radius = 0;
    updateResults(true);
    return;
  }
  if (!navigator.geolocation) { state.locState = "unsupported"; updateResults(false); return; }
  const token = ++state.locToken;
  state.locState = "locating"; updateResults(false);
  navigator.geolocation.getCurrentPosition(pos => {
    if (token !== state.locToken) return;
    state.userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    state.locState = "on";
    updateResults(true);
  }, err => {
    if (token !== state.locToken) return;
    // only a refused permission is the browser setting; no fix or a timeout is worth retrying
    state.locState = err && err.code === 1 ? "denied" : "unavailable";
    updateResults(false);
  }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
}

// The counts in the hero and on the category tiles (another tab changed the shops).
function refreshHomeCounts() {
  const t = L();
  const shops = allShops();
  const counts = {};
  shops.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
  setText(document.querySelector("#eyebrow > span:last-child"), t.eyebrow(shops.length));
  document.querySelectorAll("#street [data-count]").forEach(el => setText(el, t.places(el.dataset.count ? counts[el.dataset.count] || 0 : shops.length)));
}

export { renderHome, filteredShops, resultsSignature, updateResults, refreshHomeCounts };

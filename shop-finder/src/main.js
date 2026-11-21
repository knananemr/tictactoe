/* Nearby — local shop & clinic finder (front-end prototype, no server yet). */
// Entry point: the start-up order and the router (routes, render, focus, history).
// Views never import this file: they get navigate / render through nav.js.
// The CSS comes before the app so the dev server injects it first; in a build
// Vite writes it as a <link rel="stylesheet"> instead.
import "./fonts.css";
import "./styles.css";
import { state } from "./state.js";
import { nav } from "./nav.js";
import { store } from "./store/index.js";
import { savedLang, saveLang } from "./prefs.js";
import { L, tx } from "./text.js";
import { APP_NAME } from "./categories.js";
import { ICON } from "./icons.js";
import { esc, normHash, app } from "./util.js";
import { hideToast, announce } from "./notices.js";
import { startDrafts, discardDraft } from "./drafts.js";
import { renderHome, homeTick, homeStoreChanged } from "./views/home.js";
import { renderShop, shopTick, shopStoreChanged } from "./views/shop.js";
import { renderForm, formStoreChanged } from "./views/form.js";

// "#/", "#/shop/<id>", "#/edit/<id>", "#/new". Anything else shows home.
function currentRoute() {
  const h = location.hash;
  if (h.startsWith("#/shop/")) return "shop";
  if (h.startsWith("#/edit/")) return "edit";
  if (h === "#/new") return "new";
  return "home";
}
function routeId(prefix) {
  try { return decodeURIComponent(location.hash.slice(prefix.length)); } catch (e) { return ""; }
}

function renderChrome() {
  const t = L();
  const route = currentRoute();
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === "he" ? "rtl" : "ltr";
  document.getElementById("skipLink").textContent = t.skip;
  document.querySelector(".brand").setAttribute("aria-label", tx(APP_NAME)); // the logo shows both names
  const nav = document.getElementById("navNew");
  nav.innerHTML = `${ICON.plus}<span class="label-long">${esc(t.ownerBtn)}</span><span class="label-short">${esc(t.ownerBtnShort)}</span>`;
  if (route === "new") nav.setAttribute("aria-current", "page"); else nav.removeAttribute("aria-current");
  const lb = document.getElementById("langBtn");
  lb.textContent = t.langBtn;
  lb.setAttribute("aria-label", t.langLabel); // starts with the visible text (EN / עב)
  lb.lang = state.lang === "he" ? "en" : "he";
  renderNetBanner();
}

// The offline banner under the header: shown while the store says the device is offline
// (local mode only follows the connection when the test seam is installed). A change
// after start-up is also announced.
let bannerOnline = null;
function renderNetBanner() {
  const box = document.getElementById("netBanner");
  if (!box) return;
  const online = store.snapshot().online;
  const sig = online ? "" : state.lang;
  if (box.dataset.sig !== sig) {
    box.innerHTML = online ? "" : `${ICON.offline}<span>${esc(L().offlineBanner)}</span>`;
    box.hidden = online;
    box.dataset.sig = sig;
  }
  if (bannerOnline !== null && bannerOnline !== online) announce(online ? L().backOnline : L().offlineBanner);
  bannerOnline = online;
}

function render(opts) {
  opts = opts || {};
  state.routeToken++; // late store answers for the drawing being replaced are dropped
  state.formUi = null;
  renderChrome();
  const route = currentRoute();
  if (route === "shop") renderShop(routeId("#/shop/"), !!opts.entering);
  else if (route === "edit") renderForm(routeId("#/edit/"), !!opts.entering);
  else if (route === "new") renderForm(null, !!opts.entering);
  else renderHome();

  if (opts.focus) {
    let target = null;
    if (route === "home" && opts.fromShop && state.lastShopId) {
      target = Array.from(app.querySelectorAll(".card")).find(a => a.getAttribute("href") === "#/shop/" + encodeURIComponent(state.lastShopId)) || null;
    }
    (target || app.querySelector("h1") || app).focus({ preventScroll: true });
  }
  state.firstRender = false;
  state.lastRoute = route;
}

// Guards against going back twice on a double click (see the click listener in init).
let navigating = false, navTimer = 0;

function navigate(hash, opts) {
  hash = normHash(hash);
  const st = history.state || {};
  if (opts && opts.replace) {
    // e.g. Save on an edit page opened from the shop page: go back to that entry instead of duplicating it
    if (st.prev === hash) { history.back(); return; }
    const from = state.lastRoute;
    history.replaceState({ prev: st.prev === undefined ? null : st.prev }, "", hash);
    onRoute(from);
    return;
  }
  location.hash = hash;
}

function onRoute(fromRoute) {
  navigating = false;
  if (state.pageNotice && state.pageNotice.hash !== normHash(location.hash)) state.pageNotice = null;
  hideToast();
  const to = currentRoute();
  render({ focus: true, fromShop: fromRoute === "shop", entering: true });
  if (to === "home" && fromRoute && fromRoute !== "home") window.scrollTo(0, state.homeScrollY);
  else window.scrollTo(0, 0);
}

// Keep "Open / Closed" honest while the page stays open, on the minute. Each screen
// redraws from what it has (never waits for the store).
function refreshOpenState() {
  const route = currentRoute();
  if (route === "home") homeTick();
  else if (route === "shop") shopTick();
  if ((route === "new" || route === "edit") && state.formUi) state.formUi.renderPreview();
}

// The store changed (a list landed, another tab saved or deleted a shop, online / offline):
// the banner, then the screen on display. Only the current route hears it.
function onStoreChange(change) {
  renderNetBanner();
  if (change.type !== "shops" && change.type !== "status") return; // "session" and later types: Step 4
  const route = currentRoute();
  if (route === "home") homeStoreChanged(change);
  else if (route === "shop") shopStoreChanged(change, routeId("#/shop/"));
  else if (route === "edit") formStoreChanged(change, routeId("#/edit/"));
}

// Start-up, in the order the old single script ran it. Everything before this point only
// defines things; importing a module never touches storage, history or listeners.
function init() {
  state.lang = savedLang();
  store.start();  // fills the snapshot (local: before it returns); listens for other tabs and the connection
  startDrafts();  // drafts kept by older versions move to the device

  // Each history entry remembers the page before it (history.state.prev), so in-app
  // "back" links can really go back (keeping the list's place) only when that is where they lead.
  if (!history.state || !("prev" in history.state)) history.replaceState({ prev: null }, "");
  // the router's functions, for views (views never import main.js); set before any render
  nav.navigate = navigate;
  nav.render = render;

  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-back]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.dataset.discard) discardDraft(a.dataset.discard); // Cancel / leaving the edit page throws the edits away
    if (navigating) { e.preventDefault(); return; }       // a double click must not go back twice
    const st = history.state;
    if (st && st.prev === normHash(a.getAttribute("href")) && normHash(location.hash) !== st.prev) {
      e.preventDefault();
      navigating = true;
      clearTimeout(navTimer);
      navTimer = setTimeout(() => { navigating = false; }, 1500);
      history.back();
    }
  });

  // The skip link moves focus to the page heading; it must not change the route.
  document.getElementById("skipLink").addEventListener("click", e => {
    e.preventDefault();
    const target = app.querySelector("h1") || app;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  });

  window.addEventListener("scroll", () => {
    if (currentRoute() === "home" && state.lastRoute === "home") state.homeScrollY = window.scrollY;
  }, { passive: true });

  document.getElementById("langBtn").addEventListener("click", () => {
    const form = document.getElementById("shopForm");
    if (form && form._collect) form._collect(); // keep what the owner typed
    state.lang = state.lang === "he" ? "en" : "he";
    saveLang(state.lang);
    const y = window.scrollY;
    hideToast();
    render();
    window.scrollTo(0, y);
    document.getElementById("langBtn").focus({ preventScroll: true });
  });

  window.addEventListener("hashchange", e => {
    // a fresh entry (link, typed URL): remember where it came from
    if (!history.state) history.replaceState({ prev: normHash(e.oldURL) }, "");
    onRoute(state.lastRoute);
  });

  (function tick() {
    setTimeout(() => { refreshOpenState(); tick(); }, 60000 - (Date.now() % 60000) + 50);
  })();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshOpenState(); });

  // The store's changes (another tab added, changed or deleted a shop; a late answer).
  store.onChange(onStoreChange);

  render({ entering: true });
}

init();

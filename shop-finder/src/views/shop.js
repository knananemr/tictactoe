// The shop page: photos, hours, services, contact, share, and the owner's edit / delete.
import { state } from "../state.js";
import { nav } from "../nav.js";
import { L, tx, langAttr, linkify, money, formatDistance } from "../text.js";
import { esc, phoneDigits, whatsappNumber, normHash, app } from "../util.js";
import { ICON, catIcon } from "../icons.js";
import { category, APP_NAME } from "../categories.js";
import { shopDistance, sameShop } from "../shops.js";
import { store, errorCode } from "../store/index.js";
import { nowIn, openState, stateDetail, statusPill, hoursListHtml } from "../hours.js";
import { noticeHtml, announce, showToast, hideToast } from "../notices.js";
import { discardDraft } from "../drafts.js";
import { keepFocus, deleteErrorText } from "./states.js";

const newTabNote = () => `<span class="sr-only"> ${esc(L().newTab)}</span>`;

const backLink = () => `<a class="back" href="#/" data-back>${ICON.back}<span>${esc(L().back)}</span></a>`;

function renderNotFound(title, sub, link) {
  const t = L();
  document.title = (title || t.notFound) + " — " + tx(APP_NAME);
  app.innerHTML = `${backLink()}
      <div class="empty"><span class="big" aria-hidden="true">${link ? ICON.lock : ICON.store}</span><h1 tabindex="-1">${esc(title || t.notFound)}</h1><p>${esc(sub || t.notFoundSub)}</p>
        ${link ? `<a class="btn" href="${esc(link)}">${esc(t.viewShop)}</a>` : `<a class="btn" href="#/" data-back>${esc(t.back)}</a>`}</div>`;
}

let drawn = null;    // the shop this page drew (the minute tick and store changes compare with it)
let deleting = null; // id of the shop this tab is deleting (refuses a second delete)

// entering: the user just came to this page (main.js); a redraw passes false.
function renderShop(id, entering) {
  drawn = null;
  const t = L();
  const shop = store.snapshot().shops.find(s => s.id === id);
  if (!shop) { renderNotFound(); return; }
  drawn = shop;
  state.lastShopId = shop.id;
  const name = tx(shop.name);
  document.title = name + " — " + tx(APP_NAME);
  const cat = category(shop.category);
  const st = openState(shop);
  const dist = shopDistance(shop);
  const hasPos = shop.lat !== undefined;
  const mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(hasPos ? shop.lat + "," + shop.lng : tx(shop.address));
  const wazeUrl = hasPos ? "https://waze.com/ul?ll=" + encodeURIComponent(shop.lat + "," + shop.lng) + "&navigate=yes" : "";
  const tel = phoneDigits(shop.phone);
  const wa = whatsappNumber(shop.phone);

  const callBtn = cls => tel ? `<a class="btn${cls ? " " + cls : ""}" href="tel:${esc(tel)}">${ICON.phone}${esc(t.call)}</a>` : "";
  const dirBtn = cls => `<a class="btn${cls ? " " + cls : ""}" href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer">${ICON.map}${esc(t.directions)}${newTabNote()}</a>`;
  const shareBtn = (cls, iconOnly) => `<button class="btn${cls ? " " + cls : ""}" type="button" data-share${iconOnly ? ` aria-label="${esc(t.share)}"` : ""}>${ICON.share}${iconOnly ? "" : esc(t.share)}</button>`;
  const multi = shop.photos.length > 1;

  const about = tx(shop.about);

  app.innerHTML = `
      <div class="shop-page">
        ${backLink()}
        ${noticeHtml()}
        ${shop.mine ? `<div class="owner-bar fade-in">
            <span class="owner-tag">${esc(t.yourShop)}</span>
            <span class="owner-actions" id="ownerActions">
              <a class="btn btn-sm" href="#/edit/${encodeURIComponent(shop.id)}">${ICON.edit}${esc(t.edit)}</a>
              <button class="btn btn-danger btn-sm" type="button" id="removeBtn">${ICON.trash}${esc(t.remove)}</button>
            </span>
            <div class="confirm-box" id="confirmBox" role="group" aria-labelledby="confirmText" hidden>
              <p id="confirmText">${esc(t.removeConfirm)}</p>
              <span class="owner-actions">
                <button class="btn btn-sm btn-confirm-danger" type="button" id="confirmRemove">${ICON.trash}${esc(t.removeYes)}</button>
                <button class="btn btn-sm" type="button" id="cancelRemove">${esc(t.removeNo)}</button>
              </span>
            </div>
            <p class="owner-error" id="ownerError" role="alert" hidden></p>
          </div>` : ""}
        <div class="shop-layout">
          <div class="shop-main">
            <article class="shop-hero fade-in" style="--c:${cat.color}">
              <div class="gallery-wrap">
                <div class="gallery ${multi ? "multi" : ""}" id="gallery"${multi ? ` tabindex="0" role="region" aria-label="${esc(t.photos)}"` : ""}>
                  ${shop.photos.length
                    ? shop.photos.map((p, i) => `<div class="window"><img class="backdrop" src="${esc(p)}" alt="" aria-hidden="true" decoding="async"><img class="photo" src="${esc(p)}" alt="${esc(t.photoAlt(name, i + 1))}" decoding="async"></div>`).join("")
                    : `<div class="window" aria-hidden="true"><span class="ph-icon">${catIcon(cat)}</span></div>`}
                </div>
                ${multi ? `<button class="gallery-btn prev" type="button" data-step="-1" aria-label="${esc(t.prevPhoto)}" aria-controls="gallery">${ICON.back}</button>
                  <button class="gallery-btn next" type="button" data-step="1" aria-label="${esc(t.nextPhoto)}" aria-controls="gallery">${ICON.back}</button>
                  <span class="gallery-count" id="galleryCount" aria-hidden="true">1 / ${shop.photos.length}</span>` : ""}
              </div>
              <div class="shop-title">
                <span class="logo-tile" aria-hidden="true">${catIcon(cat)}</span>
                <h1 tabindex="-1"><bdi${langAttr(name)}>${esc(name)}</bdi></h1>
                <p class="card-meta shop-sub"><span>${esc(tx(cat.name))}</span>${dist !== null ? `<span class="meta-dist"><span class="meta-icon" aria-hidden="true">${ICON.pin}</span><span>${esc(formatDistance(dist))}</span></span>` : ""}</p>
                <p class="card-meta" id="shopStatus" data-id="${esc(shop.id)}" data-sig="${esc(st.open + "|" + stateDetail(st))}">${statusPill(st)} <span>${esc(stateDetail(st))}</span></p>
                <div class="actions desktop-only">
                  ${callBtn("btn-accent")}
                  ${dirBtn("")}
                  ${shareBtn("")}
                </div>
              </div>
            </article>
            ${about ? `<section class="panel fade-in"><h2>${esc(t.about)}</h2><p class="about" dir="auto"${langAttr(about)}>${linkify(about)}</p></section>` : ""}
            ${shop.services.length ? `<section class="panel fade-in"><h2>${esc(t.services)}</h2><ul class="price-list">
              ${shop.services.map(s => `<li><span class="svc-icon" aria-hidden="true">${catIcon(cat)}</span><span class="svc"><bdi${langAttr(tx(s.name))}>${esc(tx(s.name))}</bdi></span>${s.minutes ? `<span class="dur">${ICON.clock}<span>${esc(t.min(s.minutes))}</span></span>` : ""}<span class="price">${s.price ? esc(money(s.price)) : "—"}</span></li>`).join("")}
            </ul></section>` : ""}
          </div>
          <aside class="shop-side">
            <section class="panel fade-in"><h2>${esc(t.hours)}</h2>${hoursListHtml(shop)}</section>
            <section class="panel fade-in"><h2>${esc(t.contact)}</h2><ul class="contact-list">
              <li><span class="c-icon" aria-hidden="true">${ICON.map}</span><a href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer"><bdi${langAttr(tx(shop.address))}>${esc(tx(shop.address))}</bdi>${newTabNote()}</a></li>
              ${wazeUrl ? `<li><span class="c-icon" aria-hidden="true">${ICON.nav}</span><a href="${esc(wazeUrl)}" target="_blank" rel="noopener noreferrer">${esc(t.waze)}${newTabNote()}</a></li>` : ""}
              ${tel ? `<li><span class="c-icon" aria-hidden="true">${ICON.phone}</span><a href="tel:${esc(tel)}"><bdi dir="ltr">${esc(shop.phone)}</bdi></a></li>` : ""}
              ${wa ? `<li><span class="c-icon" aria-hidden="true">${ICON.chat}</span><a href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener noreferrer">${esc(t.whatsapp)}${newTabNote()}</a></li>` : ""}
              ${shop.email ? `<li><span class="c-icon" aria-hidden="true">${ICON.mail}</span><a href="mailto:${esc(shop.email)}"><bdi dir="ltr">${esc(shop.email)}</bdi></a></li>` : ""}
            </ul></section>
          </aside>
        </div>
        <div class="action-bar">${callBtn("btn-accent")}${dirBtn(tel ? "" : "btn-accent")}${shareBtn("btn-icon", true)}</div>
      </div>`;

  app.querySelectorAll("[data-share]").forEach(b => b.addEventListener("click", async () => {
    const url = location.href;
    if (navigator.share) {
      try { await navigator.share({ title: name, url }); return; }
      catch (e) { if (e && e.name === "AbortError") return; /* refused (e.g. inside a frame): copy instead */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast(`${ICON.check}<span>${esc(t.copied)}</span>`);
      announce(t.copied);
    } catch (e) {
      // no clipboard access: show the link ready to copy by hand
      showToast(`<label for="toastUrl">${esc(t.copyThis)}</label>
          <input id="toastUrl" class="toast-url" type="text" readonly dir="ltr" value="${esc(url)}">
          <button class="btn btn-ghost btn-sm btn-icon" type="button" id="toastClose" aria-label="${esc(t.close)}">${ICON.x}</button>`, { sticky: true });
      const input = document.getElementById("toastUrl");
      input.focus(); input.select();
      document.getElementById("toastClose").addEventListener("click", () => { hideToast(); b.focus(); });
    }
  }));

  const gallery = document.getElementById("gallery");
  if (multi && gallery) setupGallery(gallery, shop.photos.length);

  const removeBtn = document.getElementById("removeBtn");
  if (removeBtn) {
    const actions = document.getElementById("ownerActions"), box = document.getElementById("confirmBox");
    const ask = open => {
      actions.hidden = open;
      box.hidden = !open;
      document.getElementById(open ? "cancelRemove" : "removeBtn").focus();
    };
    removeBtn.addEventListener("click", () => { document.getElementById("ownerError").hidden = true; ask(true); });
    document.getElementById("cancelRemove").addEventListener("click", () => ask(false));
    box.addEventListener("keydown", e => { if (e.key === "Escape") ask(false); });
    document.getElementById("confirmRemove").addEventListener("click", () => deleteShop(shop, ask));
  }
}

function deleteShop(shop, ask) {
  if (deleting) return;
  const id = shop.id, page = normHash(location.hash);
  deleting = id;
  const done = () => {
    deleting = null;
    discardDraft("edit." + id);
    if (normHash(location.hash) !== page) return; // the user left meanwhile
    state.pageNotice = { hash: "#/", kind: "removed" };
    announce(L().removed);
    nav.navigate("#/", { replace: true });
  };
  store.deleteShop(id).then(done, err => {
    if (errorCode(err) === "not-found") { done(); return; } // already gone
    deleting = null;
    const box = document.getElementById("ownerError");
    if (!box || normHash(location.hash) !== page) return;
    box.textContent = deleteErrorText(err);
    box.hidden = false;
    ask(false);
  });
}

// The minute tick (main.js): keep the open state and today's row of the drawn shop honest.
function shopTick() {
  const st = document.getElementById("shopStatus");
  const shop = drawn;
  if (!st || !shop || st.dataset.id !== shop.id) return;
  const os = openState(shop);
  const sig = os.open + "|" + stateDetail(os);
  if (st.dataset.sig !== sig) { st.innerHTML = statusPill(os) + " <span>" + esc(stateDetail(os)) + "</span>"; st.dataset.sig = sig; }
  const list = document.getElementById("hoursList");
  if (list && Number(list.dataset.day) !== nowIn(shop.tz).day) list.outerHTML = hoursListHtml(shop);
}
// The store changed while this shop's page (#/shop/<id>) is on screen (main.js dispatches it):
// redraw when this shop changed or went (e.g. edited or deleted in another tab), keeping focus.
// This tab's own delete is not redrawn: its end navigates home.
function shopStoreChanged(change, id) {
  if (!change || change.type !== "shops" || change.source === "detail") return;
  if (change.source === "delete" && deleting === id) return;
  const gone = (change.removed || []).includes(id), changed = (change.changed || []).includes(id);
  if (!gone && !changed) return;
  if (!gone && drawn && drawn.id === id && sameShop(store.snapshot().shops.find(s => s.id === id), drawn)) return;
  keepFocus(() => nav.render());
}

// Previous / next buttons and a "2 / 4" counter for the shop photos.
function setupGallery(gallery, n) {
  const count = document.getElementById("galleryCount");
  const prev = app.querySelector(".gallery-btn.prev"), next = app.querySelector(".gallery-btn.next");
  const slideWidth = () => { const w = gallery.querySelector(".window"); return w ? w.getBoundingClientRect().width + 8 : gallery.clientWidth; };
  const index = () => Math.min(n - 1, Math.max(0, Math.round(Math.abs(gallery.scrollLeft) / slideWidth())));
  const sync = () => {
    const i = index();
    count.textContent = (i + 1) + " / " + n;
    prev.disabled = i === 0;
    next.disabled = i === n - 1;
  };
  [prev, next].forEach(b => b.addEventListener("click", () => {
    const target = Math.min(n - 1, Math.max(0, index() + Number(b.dataset.step)));
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    gallery.querySelectorAll(".window")[target].scrollIntoView({ inline: "center", block: "nearest", behavior: smooth ? "smooth" : "auto" });
  }));
  let raf = 0;
  gallery.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, { passive: true });
  sync();
}

export { backLink, renderNotFound, renderShop, shopTick, shopStoreChanged };

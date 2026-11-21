// The shop card, used by the home list and by the form's preview.
import { L, tx, langAttr, money, formatDistance } from "../text.js";
import { esc } from "../util.js";
import { ICON, catIcon } from "../icons.js";
import { category } from "../categories.js";
import { openState, stateDetail, statusPill } from "../hours.js";

function minPrice(shop) {
  const prices = shop.services.map(s => s.price).filter(p => p > 0);
  return prices.length ? Math.min(...prices) : null;
}

function cardHtml(shop, dist, i, opts) {
  const t = L();
  const preview = !!(opts && opts.preview);
  const cat = category(shop.category);
  const st = openState(shop);
  const price = minPrice(shop);
  const photo = shop.photos[0];
  const uid = preview ? "pv" : "c" + i;
  const name = tx(shop.name) || (preview ? t.previewName : "");
  const addr = tx(shop.address) || (preview ? t.previewAddr : "");
  const tag = preview ? "div" : "a";
  const linkAttrs = preview ? "" : ` href="#/shop/${encodeURIComponent(shop.id)}" aria-labelledby="${uid}-n" aria-describedby="${uid}-d"`;
  const hasDist = dist !== null && dist !== undefined;
  const summary = [shop.mine && !preview ? t.yours : "", tx(cat.name), (st.open ? t.open : t.closed) + ", " + stateDetail(st), hasDist ? formatDistance(dist) : "", price !== null ? t.from + money(price) : ""].filter(Boolean).join(" · ");
  return `
      <${tag} class="card"${linkAttrs} style="--c:${cat.color};--i:${Math.min(i, 12)}">
        <div class="card-media">
          <div class="window${photo ? " has-photo" : ""}" aria-hidden="true">
            ${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" decoding="async">` : `<span class="ph-icon">${catIcon(cat)}</span>`}
            ${shop.mine && !preview ? `<span class="pill mine">${esc(t.yours)}</span>` : ""}
          </div>
          <div class="card-top">
            <span class="badge" aria-hidden="true">${catIcon(cat)}</span>
            <h3 id="${uid}-n"><bdi${langAttr(name)}>${esc(name)}</bdi></h3>
            <span class="card-cat">${esc(tx(cat.name))}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="card-foot">
            <span class="foot-status">${statusPill(st)}</span>
            ${hasDist ? `<span class="dist">${ICON.pin}<span>${esc(formatDistance(dist))}</span></span>` : ""}
          </div>
          <p class="hint-small">${esc(stateDetail(st))}</p>
          <p class="card-meta"><span class="meta-in">${price !== null ? `<span class="from">${esc(t.from)}<b>${esc(money(price))}</b></span>` : ""}<span class="card-addr"><bdi${langAttr(addr)}>${esc(addr)}</bdi></span></span></p>
          <span class="card-cta" aria-hidden="true"><span>${esc(t.viewShop)}</span>${ICON.chevron}</span>
          ${preview ? "" : `<span class="sr-only" id="${uid}-d">${esc(summary)}</span>`}
        </div>
      </${tag}>`;
}

export { cardHtml };

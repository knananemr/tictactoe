// The shop data model, as pure helpers: cleaning a stored shop, the stored form,
// change detection, and distance from the customer. Where shops come from and where
// they are saved is the store's job (the store folder; views use store/index.js).
import { state } from "./state.js";
import { EMAIL_RE, TIME_RE, PHOTO_RE, ALL_DAY, MAX_PHOTOS, DEFAULT_TZ, distanceKm } from "./util.js";
import { tx } from "./text.js";

// Coerce any stored shop into a safe, complete shape (or drop it).
// statuses: the allowed shop statuses (the store passes its SHOP_STATUSES; this file
// cannot import the store, which imports it). Any other status becomes "published".
function cleanShop(s, mine, statuses) {
  if (!s || typeof s !== "object" || typeof s.id !== "string" || !s.id) return null;
  const text = v => typeof v === "string" ? v
    : (v && typeof v === "object") ? { en: typeof v.en === "string" ? v.en : "", he: typeof v.he === "string" ? v.he : "" } : "";
  const shop = {
    id: s.id,
    name: text(s.name), about: text(s.about), address: text(s.address),
    category: typeof s.category === "string" ? s.category : "",
    phone: typeof s.phone === "string" ? s.phone : "",
    email: typeof s.email === "string" && EMAIL_RE.test(s.email) ? s.email : "",
    tz: typeof s.tz === "string" ? s.tz : DEFAULT_TZ,
    hours: Array.from({ length: 7 }, (_, i) => {
      const h = Array.isArray(s.hours) ? s.hours[i] : null;
      if (!(Array.isArray(h) && TIME_RE.test(h[0]) && TIME_RE.test(h[1]))) return null;
      return h[0] === h[1] ? ALL_DAY.slice() : [h[0], h[1]];
    }),
    services: (Array.isArray(s.services) ? s.services : [])
      .filter(x => x && typeof x === "object")
      .map(x => ({ name: text(x.name), price: Math.max(0, Number(x.price) || 0), minutes: Math.max(0, Math.round(Number(x.minutes) || 0)) }))
      .filter(x => tx(x.name)),
    photos: (Array.isArray(s.photos) ? s.photos : []).filter(p => typeof p === "string" && PHOTO_RE.test(p)).slice(0, MAX_PHOTOS),
    status: Array.isArray(statuses) && statuses.includes(s.status) ? s.status : "published",
    mine: !!mine
  };
  if (typeof s.rejectionReason === "string" && s.rejectionReason) shop.rejectionReason = s.rejectionReason.slice(0, 300);
  if (Number.isFinite(s.lat) && Number.isFinite(s.lng) && Math.abs(s.lat) <= 90 && Math.abs(s.lng) <= 180) { shop.lat = s.lat; shop.lng = s.lng; }
  return tx(shop.name) ? shop : null;
}
// Stored form drops the runtime-only fields.
const toStored = s => { const o = Object.assign({}, s); delete o.mine; delete o._hay; delete o.full; return o; };
// What a shop looks like to the user: the stored fields, plus whether it is the owner's
// and whether it is a slim list entry. Two shops with the same signature draw the same.
const shopSig = s => JSON.stringify(toStored(s)) + (s.mine ? "|mine" : "") + (s.full === false ? "|partial" : "");
const sameShop = (a, b) => !!a && !!b && shopSig(a) === shopSig(b);

const shopDistance = shop => (state.userPos && shop.lat !== undefined) ? distanceKm(state.userPos, shop) : null;

export { cleanShop, toStored, shopSig, sameShop, shopDistance };

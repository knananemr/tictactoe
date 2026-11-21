// The shop data model for now: cleaning stored shops, the sample shops, the owner's
// shops saved on this device (state.myShops), and distance from the customer.
// Step 2 replaces this with src/store/.
import { state } from "./state.js";
import { EMAIL_RE, TIME_RE, PHOTO_RE, ALL_DAY, MAX_PHOTOS, DEFAULT_TZ, distanceKm } from "./util.js";
import { tx } from "./text.js";
import { storage, STORE_KEY } from "./storage.js";
import { SAMPLE_SHOPS } from "./demo-data.js";

// Coerce any stored shop into a safe, complete shape (or drop it).
function cleanShop(s, mine) {
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
    mine: !!mine
  };
  if (Number.isFinite(s.lat) && Number.isFinite(s.lng) && Math.abs(s.lat) <= 90 && Math.abs(s.lng) <= 180) { shop.lat = s.lat; shop.lng = s.lng; }
  return tx(shop.name) ? shop : null;
}
// Stored form drops the runtime-only fields.
const toStored = s => { const o = Object.assign({}, s); delete o.mine; delete o._hay; return o; };

const sampleShops = SAMPLE_SHOPS.map(s => cleanShop(s, false)).filter(Boolean);
function loadMyShops() {
  const raw = storage.get("localStorage", STORE_KEY, []);
  return (Array.isArray(raw) ? raw : []).map(s => cleanShop(s, true)).filter(Boolean);
}
const allShops = () => state.myShops.concat(sampleShops);

const shopDistance = shop => (state.userPos && shop.lat !== undefined) ? distanceKm(state.userPos, shop) : null;

export { cleanShop, toStored, sampleShops, loadMyShops, allShops, shopDistance };

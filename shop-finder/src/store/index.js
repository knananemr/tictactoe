// The only door to shop data. Code outside src/store/ imports from this file only
// (tests/boundaries.js checks it).
//
// store.start()        once, from main.js: fills the snapshot (in local mode before it returns)
// store.snapshot()     { phase, shops, error, busy, online, session, rev }, synchronous, frozen;
//                      the same object until something changes. phase: "loading" (no list yet),
//                      "ready", "stale" (list loaded, last refresh failed), "error" (no list).
//                      shops: the owner's own shops (mine: true, any status), then the public list.
// store.onChange(fn)   fn({ type: "shops", source, changed, removed } | { type: "status" }) right
//                      after the snapshot changed, before the causing call's promise settles;
//                      returns unsubscribe(). Ignore types and sources you do not know.
// store.info           { backend, listIsWhole, photoTypes, maxPhotoBytes }
// Promises (reject with storeError codes from contract.js; read them with errorCode(err)):
//   refresh(), getShop(id), myShops(), saveShop(draft, { onProgress }), deleteShop(id),
//   uploadPhoto(shopId, blob, { onProgress }), reportShop(id, reason, details), session(),
//   signUp(), signIn(), signOut(), resetPassword(), deleteAccount().
// Every store promise a caller does not return needs a .catch (an unhandled rejection is a
// console error). Drafts on the device: draftStore (store/draft-storage.js).
export { ERROR_CODES, SHOP_STATUSES, REPORT_REASONS, storeError, errorCode } from "./contract.js";
export { draftStore } from "./draft-storage.js";
import { createLocalStore } from "./local.js";

// Chosen at build time. Step 4 adds supabase.js behind the same interface (views do not change);
// it should then select the file with a Vite alias so a Supabase build does not bundle the sample shops.
const BACKEND = import.meta.env.VITE_BACKEND || "local";
if (BACKEND !== "local") throw new Error(`VITE_BACKEND=${BACKEND}: only "local" exists until Step 4`);
export const store = createLocalStore();

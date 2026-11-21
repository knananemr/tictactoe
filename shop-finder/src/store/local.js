// The local store: the behaviour the app had before Step 2, behind the store interface
// (members documented in store/index.js). Shops: the owner's shops saved on this device
// (nearby.myShops, any status) first, then the sample shops without those ids.
// Accounts do not exist in local mode: their calls reject with "unsupported".
//
// The test seam: globalThis.__nearbyTest, read on every call (nothing else reads it),
// can slow down or fail any call so the screens' loading and error states can be
// tested. Without it every call runs inside the call, as before, and no timer is set.
//   delay    { op: ms } or one number for all ops (read when the call starts; a write: when dequeued)
//   fail     { op: code } every call of that op rejects (read when the delay ends)
//   failOnce { op: code } the next call rejects, then the key is deleted
//   status   saveShop stores and returns this status (default "published")
//   partial  list entries that are not mine are slim (full: false), like Step 4's list
//   info     merged over store.info
//   log      if an array, "<op>:start" / "<op>:end" are pushed
//   calls    written here: underlying calls started per op (a shared call counts once)
// Its mere presence also makes the store follow navigator.onLine (online / offline).
import { ERROR_CODES, SHOP_STATUSES, REPORT_REASONS, storeError, errorCode } from "./contract.js";
import { device, STORE_KEY } from "./device.js";
import { SAMPLE_SHOPS } from "../demo-data.js";
import { cleanShop, toStored, shopSig } from "../shops.js";
import { MAX_PHOTOS, PHOTO_RE } from "../util.js";

const noop = () => {};
const DEVICE_OWNER = Object.freeze({ userId: "device", email: "", local: true });

// ---- the test seam
const seam = () => globalThis.__nearbyTest || null;
const delayFor = op => {
  const t = seam();
  const ms = !t || !t.delay ? 0 : typeof t.delay === "number" ? t.delay : Number(t.delay[op]) || 0;
  return ms > 0 ? ms : 0;
};
function failFor(op) {
  const t = seam(); if (!t) return "";
  if (t.failOnce && t.failOnce[op]) { const c = t.failOnce[op]; delete t.failOnce[op]; return c; }
  return (t.fail && t.fail[op]) || "";
}
function count(op) { const t = seam(); if (t) { t.calls = t.calls || {}; t.calls[op] = (t.calls[op] || 0) + 1; } }
const log = s => { const t = seam(); if (t && Array.isArray(t.log)) t.log.push(s); };
const wrap = e => (e && ERROR_CODES.includes(e.code) ? e : storeError("unknown")); // keeps extras such as err.limit

// count → delay → fail → job. With no delay the gate and the job run inside the call
// (sync: true). onFail(err) runs as soon as the seam fails the call, before the promise settles.
function gate(op, job, onFail) {
  count(op); log(op + ":start");
  const go = () => {
    const code = failFor(op);
    if (code) { const e = storeError(code); if (onFail) onFail(e); throw e; }
    return job();
  };
  const ms = delayFor(op);
  let p;
  if (!ms) { try { p = Promise.resolve(go()); } catch (e) { p = Promise.reject(e); } }
  else p = new Promise(r => setTimeout(r, ms)).then(go);
  return { sync: !ms, promise: p.then(v => { log(op + ":end"); return v; }, e => { log(op + ":end"); throw wrap(e); }) };
}

const isBlob = b => typeof Blob !== "undefined" && b instanceof Blob;
// Never fetch() a data: or blob: URL (the CSP blocks it and logs an error): FileReader only.
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    let r;
    try { r = new FileReader(); } catch (e) { reject(storeError("unknown")); return; }
    r.onload = () => (typeof r.result === "string" && PHOTO_RE.test(r.result) ? resolve(r.result) : reject(storeError("invalid")));
    r.onerror = r.onabort = () => reject(storeError("unknown"));
    try { r.readAsDataURL(blob); } catch (e) { reject(storeError("invalid")); }
  });
}
const newId = () => "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const unique = list => { const seen = new Set(); return list.filter(s => !seen.has(s.id) && seen.add(s.id)); };

export function createLocalStore() {
  const samples = SAMPLE_SHOPS.map(s => cleanShop(s, false, SHOP_STATUSES)).filter(Boolean).map(s => Object.assign(s, { full: true }));
  // the owner's shops, as stored (any status), full
  const readMine = () => {
    const raw = device.get("localStorage", STORE_KEY, []);
    return unique((Array.isArray(raw) ? raw : []).map(s => cleanShop(s, true, SHOP_STATUSES)).filter(Boolean)).map(s => Object.assign(s, { full: true }));
  };
  const slim = s => Object.assign({}, s, { full: false, phone: "", email: "", photos: s.photos.slice(0, 1), services: s.services.map(x => Object.assign({}, x, { minutes: 0 })) });
  // the list: own shops, then the samples without those ids (slim under the seam's partial)
  const listed = () => {
    const mine = readMine(), ids = new Set(mine.map(s => s.id)), t = seam();
    return mine.concat(samples.filter(s => !ids.has(s.id)).map(s => (t && t.partial ? slim(s) : s)));
  };
  const findFull = id => readMine().concat(samples).find(s => s.id === id) || null;

  // ---- the snapshot and change events
  let snap = Object.freeze({ phase: "loading", shops: Object.freeze([]), error: null, busy: false, online: true, session: null, rev: 0 });
  const listeners = new Set();
  function emit(change) {
    Array.from(listeners).forEach(fn => { try { fn(change); } catch (e) { console.error(e); } });
  }
  function patchSnap(patch) { // true if anything changed
    if (!Object.keys(patch).some(k => snap[k] !== patch[k])) return false;
    snap = Object.freeze(Object.assign({}, snap, patch));
    return true;
  }
  const setStatus = patch => { if (patchSnap(patch)) emit({ type: "status" }); };
  // Put a fresh list in the snapshot: unchanged entries keep their objects (and what views
  // cached on them); changed = new ids or a different shopSig, removed = ids gone.
  function setShops(list, source, patch) {
    const before = snap.shops, old = new Map(before.map(s => [s.id, s]));
    const changed = [], seen = new Set(), next = [];
    list.forEach(s => {
      if (seen.has(s.id)) return;
      seen.add(s.id);
      const o = old.get(s.id);
      if (o && shopSig(o) === shopSig(s)) next.push(o); else { changed.push(s.id); next.push(s); }
    });
    const removed = before.filter(s => !seen.has(s.id)).map(s => s.id);
    if (!changed.length && !removed.length && next.some((s, i) => s !== before[i])) next.forEach(s => changed.push(s.id)); // order only
    const p = Object.assign({}, patch);
    if (changed.length || removed.length) { p.shops = Object.freeze(next); p.rev = snap.rev + 1; }
    const any = patchSnap(p);
    if (changed.length || removed.length) emit({ type: "shops", source, changed, removed });
    else if (any) emit({ type: "status" });
  }
  // a write landed: the data is on the device, so the list is whole again
  const afterWrite = source => setShops(listed(), source, { phase: "ready", error: null });
  function dropFromSnapshot(id) {
    if (!snap.shops.some(s => s.id === id)) return;
    patchSnap({ shops: Object.freeze(snap.shops.filter(s => s.id !== id)), rev: snap.rev + 1 });
    emit({ type: "shops", source: "detail", changed: [], removed: [id] });
  }

  // ---- reads: a call made while the same one is in flight gets the same promise
  const flights = new Map();
  function shared(key, op, job, onFail) {
    if (flights.has(key)) return flights.get(key);
    const land = () => { flights.delete(key); };
    const g = gate(op, () => { land(); return job(); }, e => { land(); if (onFail) onFail(e); });
    if (!g.sync) flights.set(key, g.promise);
    return g.promise;
  }
  function refreshAs(source) {
    const flying = flights.has("refresh");
    const p = shared("refresh", "refresh",
      () => { setShops(listed(), source, { phase: "ready", error: null, busy: false }); return snap; },
      e => setStatus({ busy: false, error: errorCode(e), phase: snap.phase === "ready" || snap.phase === "stale" ? "stale" : "error" }));
    if (!flying && flights.has("refresh")) setStatus(snap.phase === "error" ? { busy: true, phase: "loading" } : { busy: true });
    return p;
  }
  function getShop(id) {
    const key = String(id);
    return shared("shop:" + key, "getShop", () => {
      const s = findFull(key);
      if (!s) { dropFromSnapshot(key); throw storeError("not-found"); }
      const i = snap.shops.findIndex(x => x.id === key);
      if (i < 0) return s;
      if (shopSig(snap.shops[i]) === shopSig(s)) return snap.shops[i];
      const next = snap.shops.slice(); next[i] = s;
      patchSnap({ shops: Object.freeze(next), rev: snap.rev + 1 });
      emit({ type: "shops", source: "detail", changed: [key], removed: [] });
      return s;
    }, e => { if (e.code === "not-found") dropFromSnapshot(key); });
  }

  // ---- writes: one queue in call order (enqueue → dequeued → count → delay → fail → job)
  let writing = false;
  const waiting = [];
  function write(op, job) {
    if (writing) return new Promise((res, rej) => waiting.push(() => startWrite(op, job).then(res, rej)));
    return startWrite(op, job);
  }
  function startWrite(op, job) {
    writing = true;
    const next = () => { writing = false; const w = waiting.shift(); if (w) w(); };
    return gate(op, job).promise.then(v => { next(); return v; }, e => { next(); throw e; });
  }
  const progressFn = opts => {
    const fn = opts && typeof opts.onProgress === "function" ? opts.onProgress : null;
    return p => { if (fn) try { fn(p); } catch (e) { console.error(e); } };
  };
  const statusForSave = () => { const t = seam(); return (t && t.status) || "published"; };
  const isPhotoEntry = p => !!p && typeof p === "object" && (typeof p.url === "string" || isBlob(p.blob));

  // One storage write per call. Photos ({ blob }) are converted first; with none, the
  // whole job runs inside the call. Failed photos are left out → "photo-upload".
  async function saveJob(draft, progress) {
    progress({ step: "saving" });
    if (!draft || typeof draft !== "object") throw storeError("invalid");
    const editId = typeof draft.id === "string" && draft.id ? draft.id : "";
    if (editId && !readMine().some(s => s.id === editId)) throw storeError("not-found");
    const photos = Array.isArray(draft.photos) ? draft.photos : [];
    if (photos.length > MAX_PHOTOS) throw storeError("limit", { limit: "photos" });
    if (!photos.every(isPhotoEntry)) throw storeError("invalid");
    const id = editId || newId();
    const base = Object.assign({}, draft, { id, status: statusForSave() });
    delete base.rejectionReason;
    if (!cleanShop(Object.assign({}, base, { photos: [] }), true, SHOP_STATUSES)) throw storeError("invalid");
    const urls = [], failed = [];
    const total = photos.filter(p => typeof p.url !== "string").length;
    let done = 0;
    for (let i = 0; i < photos.length; i++) {
      const ph = photos[i];
      if (typeof ph.url === "string") { urls.push(ph.url); continue; }
      progress({ step: "photos", done, total });
      try { urls.push(await gate("uploadPhoto", () => blobToDataUrl(ph.blob)).promise); } catch (e) { failed.push(i); }
      done++;
      progress({ step: "photos", done, total });
    }
    const shop = cleanShop(Object.assign(base, { photos: urls }), true, SHOP_STATUSES);
    if (!shop) throw storeError("invalid");
    shop.full = true;
    const before = readMine(); // read again right before the write
    if (editId && !before.some(s => s.id === editId)) throw storeError("not-found");
    const next = editId ? before.map(s => (s.id === editId ? shop : s)) : [shop].concat(before);
    const err = device.save("localStorage", STORE_KEY, next.map(toStored));
    if (err) throw storeError(err);
    afterWrite("save");
    const saved = snap.shops.find(s => s.id === id) || shop;
    progress({ step: "saved", shop: saved, status: saved.status });
    if (failed.length) throw storeError("photo-upload", { saved: { shop: saved, status: saved.status }, failed });
    progress({ step: "done" });
    return { shop: saved, status: saved.status };
  }
  function deleteJob(id) {
    const before = readMine();
    if (!before.some(s => s.id === id)) throw storeError("not-found");
    const err = device.save("localStorage", STORE_KEY, before.filter(s => s.id !== id).map(toStored));
    if (err) throw storeError(err);
    afterWrite("delete");
  }
  async function uploadJob(shopId, blob, progress) {
    if (!isBlob(blob)) throw storeError("invalid");
    const first = readMine().find(s => s.id === shopId);
    if (!first) throw storeError("not-found");
    if (first.photos.length >= MAX_PHOTOS) throw storeError("limit", { limit: "photos" });
    progress({ step: "photos", done: 0, total: 1 });
    const url = await blobToDataUrl(blob);
    const before = readMine(), shop = before.find(s => s.id === shopId);
    if (!shop) throw storeError("not-found");
    if (shop.photos.length >= MAX_PHOTOS) throw storeError("limit", { limit: "photos" });
    shop.photos.push(url);
    const err = device.save("localStorage", STORE_KEY, before.map(toStored));
    if (err) throw storeError(err);
    afterWrite("photo");
    progress({ step: "photos", done: 1, total: 1 });
    return { url, position: shop.photos.length - 1 };
  }

  // ---- start-up and the browser's events
  const readOnline = () => (seam() ? navigator.onLine !== false : true);
  let started = false;
  function start() {
    if (started) return;
    started = true;
    patchSnap({ session: DEVICE_OWNER, online: readOnline() });
    // another tab saved or deleted a shop (draft keys change too, and are ignored)
    window.addEventListener("storage", e => { if (e.key === STORE_KEY) refreshAs("other-tab").catch(noop); });
    window.addEventListener("offline", () => setStatus({ online: readOnline() }));
    window.addEventListener("online", () => {
      setStatus({ online: readOnline() });
      if (snap.phase === "error" || snap.phase === "stale") refreshAs("refresh").catch(noop);
    });
    refreshAs("refresh").catch(noop);
  }
  const unsupported = op => () => gate(op, () => { throw storeError("unsupported"); }).promise;

  return Object.freeze({
    start,
    snapshot: () => snap,
    onChange(fn) {
      if (typeof fn !== "function") return noop;
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },
    get info() {
      const t = seam();
      return Object.assign({ backend: "local", listIsWhole: true, photoTypes: ["image/webp", "image/jpeg"], maxPhotoBytes: Infinity },
        t && t.info && typeof t.info === "object" ? t.info : {});
    },
    refresh: () => refreshAs("refresh"),
    getShop,
    myShops: () => gate("myShops", () => readMine()).promise,
    saveShop: (draft, opts) => { const progress = progressFn(opts); return write("saveShop", () => saveJob(draft, progress)); },
    deleteShop: id => write("deleteShop", () => deleteJob(String(id))),
    uploadPhoto: (shopId, blob, opts) => { const progress = progressFn(opts); return write("uploadPhoto", () => uploadJob(String(shopId), blob, progress)); },
    reportShop: (id, reason, details) => gate("reportShop", () => {
      if (!REPORT_REASONS.includes(reason) || typeof details !== "string" || details.length > 500) throw storeError("invalid");
      if (!findFull(String(id))) throw storeError("not-found");
    }).promise,
    session: () => gate("session", () => Object.assign({}, DEVICE_OWNER)).promise,
    signUp: unsupported("signUp"),
    signIn: unsupported("signIn"),
    signOut: unsupported("signOut"),
    resetPassword: unsupported("resetPassword"),
    deleteAccount: unsupported("deleteAccount")
  });
}

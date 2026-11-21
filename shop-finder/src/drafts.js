// Form drafts: one per form, kept for this page load (state.drafts) and in session
// storage across a reload. Used by the form, the shop page (delete) and main.js.
import { state } from "./state.js";
import { storage, DRAFT_PREFIX, OLD_KEYS } from "./storage.js";
import { TIME_RE, MAX_PHOTOS, isAllDay } from "./util.js";
import { tx } from "./text.js";

// Each form keeps its own draft: "new" for a new shop, "edit.<id>" for each shop being edited.
const blankHours = () => Array.from({ length: 7 }, (_, i) => ({ from: "09:00", to: i === 5 ? "14:00" : "19:00", closed: i === 6, allDay: false }));
const blankService = () => ({ name: "", price: "", minutes: "" });
function emptyDraft(slot) {
  return {
    slot: slot || "new", editId: "",
    name: "", category: "", about: "", address: "", phone: "", email: "", pos: null,
    hours: blankHours(), services: [blankService()], photos: [],
    dirty: false, photosChanged: false, pending: 0, showErrors: false, restored: false, photoNote: null
  };
}
function shopToDraft(shop) {
  const plain = v => typeof v === "string" ? v : tx(v);
  return Object.assign(emptyDraft("edit." + shop.id), {
    editId: shop.id,
    name: plain(shop.name), category: shop.category, about: plain(shop.about), address: plain(shop.address),
    phone: shop.phone, email: shop.email, pos: shop.lat !== undefined ? { lat: shop.lat, lng: shop.lng } : null,
    hours: shop.hours.map(h => !h ? { from: "09:00", to: "19:00", closed: true, allDay: false }
      : isAllDay(h) ? { from: "09:00", to: "19:00", closed: false, allDay: true }
      : { from: h[0], to: h[1], closed: false, allDay: false }),
    services: shop.services.length
      ? shop.services.map(s => ({ name: plain(s.name), price: s.price ? String(s.price) : "", minutes: s.minutes ? String(s.minutes) : "" }))
      : [blankService()],
    photos: shop.photos.slice()
  });
}
// A draft saved in this tab before a reload. Photos are too big for session storage, so they are not kept.
function readStoredDraft(slot, editing) {
  const raw = storage.get("sessionStorage", DRAFT_PREFIX + slot, null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const d = editing ? shopToDraft(editing) : emptyDraft(slot);
  ["name", "category", "about", "address", "phone", "email"].forEach(k => { if (typeof raw[k] === "string") d[k] = raw[k]; });
  if (Array.isArray(raw.hours) && raw.hours.length === 7 && raw.hours.every(h => h && typeof h === "object")) {
    d.hours = raw.hours.map(h => ({ from: TIME_RE.test(h.from) ? h.from : "09:00", to: TIME_RE.test(h.to) ? h.to : "19:00", closed: !!h.closed, allDay: !!h.allDay && !h.closed }));
  }
  if (Array.isArray(raw.services) && raw.services.length && raw.services.every(s => s && typeof s === "object")) {
    d.services = raw.services.map(s => ({ name: String(s.name || ""), price: String(s.price || ""), minutes: String(s.minutes || "") }));
  }
  if (raw.pos && Number.isFinite(raw.pos.lat) && Number.isFinite(raw.pos.lng)) d.pos = { lat: raw.pos.lat, lng: raw.pos.lng };
  d.dirty = !!raw.dirty;
  if (editing && raw.photosChanged) d.photoNote = "reset";
  else if (!editing && Number(raw.photoCount) > 0) d.photoNote = Math.min(MAX_PHOTOS, Math.round(Number(raw.photoCount)));
  return d;
}
// Older versions kept one shared draft; move a new-shop draft over and drop the rest.
// main.js calls this when the app starts.
function migrateOldKeys() {
  const old = storage.get("sessionStorage", OLD_KEYS[0], null);
  if (old && typeof old === "object" && !old.editId && storage.get("sessionStorage", DRAFT_PREFIX + "new", null) === null) {
    storage.save("sessionStorage", DRAFT_PREFIX + "new", Object.assign({}, old, { dirty: true }));
  }
  OLD_KEYS.forEach(k => storage.del("sessionStorage", k));
}

function getDraft(slot, editing) {
  if (state.drafts[slot]) return { d: state.drafts[slot], existed: true };
  const stored = readStoredDraft(slot, editing);
  state.drafts[slot] = stored || (editing ? shopToDraft(editing) : emptyDraft(slot));
  return { d: state.drafts[slot], existed: !!stored };
}
function saveDraft(d) {
  if (state.drafts[d.slot] !== d) return; // discarded meanwhile
  storage.save("sessionStorage", DRAFT_PREFIX + d.slot, {
    name: d.name, category: d.category, about: d.about, address: d.address, phone: d.phone, email: d.email, pos: d.pos,
    hours: d.hours, services: d.services.map(s => ({ name: s.name, price: s.price, minutes: s.minutes })),
    dirty: d.dirty, photosChanged: d.photosChanged, photoCount: d.photos.length
  });
}
function discardDraft(slot) {
  delete state.drafts[slot];
  storage.del("sessionStorage", DRAFT_PREFIX + slot);
  if (state.draft && state.draft.slot === slot) state.draft = null;
}
const isLive = d => !!state.formUi && state.formUi.d === d;

export { blankService, migrateOldKeys, getDraft, saveDraft, discardDraft, isLive };

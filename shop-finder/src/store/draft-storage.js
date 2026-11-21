// Form drafts on this device. Text: one localStorage key per form slot
// (nearby.draft.new, nearby.draft.edit.<shop id>), so a draft outlives the tab.
// drafts.js is the only user (through store/index.js). Picked photos (IndexedDB) are
// added here by the form work; these text functions and migrate() stay as they are.
import { device, DRAFT_PREFIX, OLD_KEYS } from "./device.js";

const keyOf = slot => DRAFT_PREFIX + slot;
const isSlotKey = k => k === DRAFT_PREFIX + "new" || (typeof k === "string" && k.startsWith(DRAFT_PREFIX + "edit."));

const draftStore = {
  // the stored draft object of a slot, or null
  read(slot) {
    const v = device.get("localStorage", keyOf(slot), null);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  },
  // "" when saved, else "full" or "blocked" (a draft that cannot be saved is simply not kept)
  write(slot, obj) { return device.save("localStorage", keyOf(slot), obj); },
  remove(slot) { device.del("localStorage", keyOf(slot)); },
  // Once per start (drafts.js startDrafts), safe to repeat. Older versions kept drafts in
  // sessionStorage: move them to localStorage unchanged (a localStorage copy wins), move
  // the even older single draft (nearby.draft) to the new-shop slot, drop the old keys.
  // Only these keys are touched: sessionStorage is never cleared.
  migrate() {
    const moving = device.keys("sessionStorage").filter(isSlotKey);
    moving.forEach(k => {
      const v = device.getRaw("sessionStorage", k);
      if (v !== null && device.getRaw("localStorage", k) === null) device.setRaw("localStorage", k, v);
      device.del("sessionStorage", k);
    });
    const old = device.get("sessionStorage", OLD_KEYS[0], null);
    if (old && typeof old === "object" && !old.editId && device.getRaw("localStorage", keyOf("new")) === null) {
      device.save("localStorage", keyOf("new"), Object.assign({}, old, { dirty: true }));
    }
    OLD_KEYS.forEach(k => device.del("sessionStorage", k));
  }
};

export { draftStore };

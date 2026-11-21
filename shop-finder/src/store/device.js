// Device storage: the keys the app uses and a safe wrapper around localStorage and
// sessionStorage (was src/storage.js). Only files in src/store/ and src/prefs.js use it;
// store/index.js never exposes it. The keys must not change, or saved data is lost.
const STORE_KEY = "nearby.myShops";
const LANG_KEY = "nearby.lang";
const DRAFT_PREFIX = "nearby.draft."; // + "new" or "edit.<id>": one draft per form
const OLD_KEYS = ["nearby.draft", "nearby.notice"];

const device = {
  get(area, key, fallback) {
    try { const v = window[area].getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  },
  // returns "" on success, otherwise "full" or "blocked"
  save(area, key, value) {
    try { window[area].setItem(key, JSON.stringify(value)); return ""; } catch (e) {
      return e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22 || e.code === 1014) ? "full" : "blocked";
    }
  },
  del(area, key) { try { window[area].removeItem(key); } catch (e) { /* ignore */ } },
  // the stored string as it is (null when missing or unreadable), for moving values unchanged
  getRaw(area, key) { try { return window[area].getItem(key); } catch (e) { return null; } },
  setRaw(area, key, text) { try { window[area].setItem(key, text); return true; } catch (e) { return false; } },
  // every key in that area ([] when it cannot be read)
  keys(area) {
    try { const s = window[area], out = []; for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k !== null) out.push(k); } return out; } catch (e) { return []; }
  }
};

export { STORE_KEY, LANG_KEY, DRAFT_PREFIX, OLD_KEYS, device };

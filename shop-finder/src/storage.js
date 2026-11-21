// Device storage: the keys the app uses and a safe wrapper around localStorage and
// sessionStorage. (Named "storage" so it is not confused with the shop data store
// that Step 2 adds in src/store/.) The keys must not change, or saved data is lost.
const STORE_KEY = "nearby.myShops";
const LANG_KEY = "nearby.lang";
const DRAFT_PREFIX = "nearby.draft."; // + "new" or "edit.<id>": one draft per form
const OLD_KEYS = ["nearby.draft", "nearby.notice"];

const storage = {
  get(area, key, fallback) {
    try { const v = window[area].getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  },
  // returns "" on success, otherwise "full" or "blocked"
  save(area, key, value) {
    try { window[area].setItem(key, JSON.stringify(value)); return ""; } catch (e) {
      return e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22 || e.code === 1014) ? "full" : "blocked";
    }
  },
  del(area, key) { try { window[area].removeItem(key); } catch (e) { /* ignore */ } }
};

export { STORE_KEY, LANG_KEY, DRAFT_PREFIX, OLD_KEYS, storage };

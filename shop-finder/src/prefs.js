// Preferences kept on this device (not shop data): the language choice (nearby.lang).
// Besides src/store/, the only file that reads or writes device storage.
import { device, LANG_KEY } from "./store/device.js";

// "he" or "en"; Hebrew when nothing (or something unexpected) is saved
function savedLang() {
  const lang = device.get("localStorage", LANG_KEY, "he");
  return lang === "he" || lang === "en" ? lang : "he";
}
function saveLang(lang) { device.save("localStorage", LANG_KEY, lang); }

export { savedLang, saveLang };

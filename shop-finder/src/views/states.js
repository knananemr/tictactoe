// Shared pieces for the screens' loading, error, progress and status states (Step 2),
// and the focus helpers for redrawing under the user. Every screen uses these; only
// the foundation changes them.
import { state } from "../state.js";
import { L } from "../text.js";
import { ICON } from "../icons.js";
import { esc, app } from "../util.js";
import { store, errorCode } from "../store/index.js";

// A late store answer draws only while the drawing it belongs to is still current
// (render() adds 1 to state.routeToken on every full render).
export const isCurrent = token => token === state.routeToken;

// One skeleton line (width w, e.g. "9em"); decoration only.
export const skelLine = (w, cls) => `<span class="skel skel-line${cls ? " " + cls : ""}" style="--w:${w}" aria-hidden="true"></span>`;

// "Couldn't load" box with Try again (#retryBtn). tag "h1" (a whole page; focusable) or
// "h3" (inside the home grid). title: the screen's own title text (or its text key).
// Offline (the code, or the store) uses the offline wording instead.
export function errorBoxHtml({ tag, title, code }) {
  const t = L();
  const offline = code === "offline" || !store.snapshot().online;
  const h = tag === "h1" ? "h1" : "h3";
  const head = offline ? t.offlineTitle : (typeof t[title] === "string" ? t[title] : title || "");
  return `<div class="empty load-error${offline ? " is-offline" : ""}">` +
    `<span class="big" aria-hidden="true">${offline ? ICON.offline : ICON.alert}</span>` +
    `<${h}${h === "h1" ? ' tabindex="-1"' : ""}>${esc(head)}</${h}>` +
    `<p>${esc(offline ? t.offlineRetry : t.loadErrorText)}</p>` +
    `<button class="btn" type="button" id="retryBtn">${ICON.retry}${esc(t.tryAgain)}</button></div>`;
}

// A progress bar. No arguments: indeterminate (still working; decoration next to the
// status text, so hidden from screen readers). Otherwise role="progressbar" with done of
// total whole photos (aria-valuenow), the bar also showing part (0..1) of the next one.
// labelledBy (optional): the id of the text that names the bar (e.g. "saveStatus").
export function progressHtml(done, total, part, labelledBy) {
  if (done === undefined || done === null) return `<div class="progress is-busy" aria-hidden="true"><span></span></div>`;
  const name = labelledBy ? ` aria-labelledby="${esc(labelledBy)}"` : "";
  const n = Math.max(0, Number(total) || 0), d = Math.min(n, Math.max(0, Number(done) || 0));
  const share = n ? Math.min(1, (d + Math.min(1, Math.max(0, Number(part) || 0))) / n) : 0;
  return `<div class="progress" role="progressbar"${name} aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${d}"><span style="--p:${(share * 100).toFixed(1)}%"></span></div>`;
}

// The owner's own shop that customers do not see (yet): a pill with icon and text.
// "" for published shops and for shops that are not mine.
const BADGES = { pending: ["clock", "pendingBadge"], rejected: ["alert", "statusRejected"], hidden: ["lock", "statusHidden"] };
export function statusBadgeHtml(shop, id) {
  const b = shop && shop.mine && shop.status !== "published" ? BADGES[shop.status] : null;
  if (!b) return "";
  return `<span class="pill status-badge is-${shop.status}"${id ? ` id="${esc(id)}"` : ""}>${ICON[b[0]]}<span>${esc(L()[b[1]])}</span></span>`;
}

// Error texts for a failed save or delete. They take the rejection itself and read only
// its code and err.limit (never err.message).
const COMMON = { full: "errStorageFull", blocked: "errStorageBlocked", forbidden: "errForbidden",
  "signed-out": "errSignedOut", "rate-limited": "errRateLimited" };
export function saveErrorText(err) {
  const t = L(), code = errorCode(err);
  if (COMMON[code]) return t[COMMON[code]];
  if (code === "not-found") return t.errDeleted;
  if (code === "offline") return t.errSaveOffline;
  if (code === "invalid") return t.errSaveInvalid;
  if (code === "limit") return err.limit === "shops" ? t.errLimitShops : t.errLimitPhotos;
  return t.errSaveNetwork;
}
export function deleteErrorText(err) {
  const t = L(), code = errorCode(err);
  if (COMMON[code]) return t[COMMON[code]];
  if (code === "offline") return t.errDeleteOffline;
  return t.errDeleteNetwork;
}

// Re-render without losing keyboard focus (used when data changes under the user).
export function keepFocus(fn) {
  const a = document.activeElement;
  let sel = "";
  if (a && a !== document.body && app.contains(a)) {
    if (a.id) sel = "#" + CSS.escape(a.id);
    else if (a.getAttribute("href")) sel = `[href="${CSS.escape(a.getAttribute("href"))}"]`;
    else if (a.dataset.cat !== undefined) sel = `[data-cat="${CSS.escape(a.dataset.cat)}"]`;
  }
  const value = a && a.id === "q" ? { start: a.selectionStart, end: a.selectionEnd } : null;
  fn();
  if (!sel) return;
  const el = app.querySelector(sel);
  if (el && el !== document.activeElement) {
    el.focus({ preventScroll: true });
    if (value && el.setSelectionRange) try { el.setSelectionRange(value.start, value.end); } catch (e) { /* ignore */ }
  }
}

// A late draw that replaces a whole page (a skeleton or an error page): keepFocus, and if
// the focus was on that page's h1 (where the router put it), move it to the new h1.
export function swapPage(draw) {
  const a = document.activeElement;
  const onH1 = !!a && a.tagName === "H1" && app.contains(a);
  keepFocus(draw);
  if (!onH1) return;
  const h1 = app.querySelector("h1");
  if (h1 && h1 !== document.activeElement) h1.focus({ preventScroll: true });
}

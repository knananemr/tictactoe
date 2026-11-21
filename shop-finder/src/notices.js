// Messages to the user: the page notice ("Your shop is live", "Sent for review"), the
// screen-reader announcer and the toast.
import { state } from "./state.js";
import { L } from "./text.js";
import { ICON } from "./icons.js";
import { esc, normHash } from "./util.js";

function noticeHtml() {
  if (!state.pageNotice || state.pageNotice.hash !== normHash(location.hash)) return "";
  const t = L();
  const kind = state.pageNotice.kind;
  const text = { edit: t.saved, removed: t.removed, pending: t.sentForReview }[kind] || t.published;
  const icon = kind === "removed" ? ICON.trash : kind === "pending" ? ICON.clock : ICON.check;
  return `<p class="note fade-in" id="pageNote"><span class="note-icon" aria-hidden="true">${icon}</span><span>${esc(text)}</span></p>`;
}
// Screen readers hear changes in a live region that already exists, so we use one fixed region.
let announceTimer = 0;
function announce(text) {
  const box = document.getElementById("announcer");
  if (!box) return;
  box.textContent = "";
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { box.textContent = text; }, 150);
}
let toastTimer = 0;
function showToast(html, opts) {
  const box = document.getElementById("toast");
  if (!box) return;
  clearTimeout(toastTimer);
  box.innerHTML = html;
  box.hidden = false;
  box.classList.toggle("has-bar", !!document.querySelector(".action-bar"));
  if (!(opts && opts.sticky)) toastTimer = setTimeout(hideToast, 3200);
}
function hideToast() {
  const box = document.getElementById("toast");
  if (box) { box.hidden = true; box.innerHTML = ""; }
}

export { noticeHtml, announce, showToast, hideToast };

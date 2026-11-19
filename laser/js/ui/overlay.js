// js/ui/overlay.js
// The sheet (side panel on a wide screen), the modal and the toast (6.4).
// At most one sheet or modal is open at a time, as the one child of #overlay-root;
// at most one toast is shown, inside #toast-root.
//
// Focus (2.6): opening moves focus into the sheet or modal and keeps it there; Esc closes;
// after closing, focus returns to the element that opened it (found again by its
// data-action and data-id, because the view has been drawn afresh), or to the page title.
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const mount = L.ui.mount;

  const TOAST_MS = 6000;
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

  let current = null;        // { kind, key, onRequestClose, holdsInput, onConfirm, onCancel, opener }
  let notice = null;         // SafeHtml shown at the top of an open sheet (the red banners), or null
  let pendingFocus = null;   // the opener to give the focus back to
  let focusQueued = false;
  let toastTimer = null;
  let toastRun = null;
  let toastUndoOf = null;    // the commit label an Undo toast belongs to

  function overlayRoot() { return document.getElementById('overlay-root'); }
  function toastRoot() { return document.getElementById('toast-root'); }
  function box() { return overlayRoot().querySelector('.sheet, .modal'); }

  function shown(el) { return el.getClientRects().length > 0; }

  // ---- focus -----------------------------------------------------------------------------

  // The element the owner clicked just now, as { action, id }.
  function recentTrigger() {
    const t = L.ui.actions.lastTrigger();
    if (!t || !t.action) return null;
    return { action: t.action, id: t.id || null };
  }

  function focusInside(selector) {
    const el = box();
    if (!el) return;
    let target = selector ? el.querySelector(selector) : null;
    if (!target) target = el.querySelector('[data-autofocus]');
    if (!target) {
      const all = el.querySelectorAll(FOCUSABLE);
      for (let i = 0; i < all.length; i++) {
        if (shown(all[i])) { target = all[i]; break; }
      }
    }
    if (target) target.focus();
  }

  function findOpener(want) {
    if (!want || !want.action) return null;
    const all = document.querySelectorAll('#app [data-action]');
    let hiddenMatch = null;
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el.getAttribute('data-action') !== want.action) continue;
      if ((el.getAttribute('data-id') || null) !== want.id) continue;
      if (shown(el)) return el;
      if (!hiddenMatch) hiddenMatch = el;
    }
    // an item of a closed overflow menu: its three-dots button stands in for it
    if (hiddenMatch && typeof hiddenMatch.closest === 'function') {
      const wrap = hiddenMatch.closest('.menu-wrap');
      const button = wrap ? wrap.querySelector('[aria-haspopup="menu"]') : null;
      if (button && shown(button)) return button;
    }
    return null;
  }

  function applyFocus() {
    focusQueued = false;
    const want = pendingFocus;
    pendingFocus = null;
    if (current) return;                       // something else opened in the meantime
    const el = findOpener(want) || document.querySelector('#app .topbar__title');
    if (el) el.focus();
  }

  // Runs once the code that closed the overlay (and drew the view again) has finished.
  function queueFocus(opener) {
    pendingFocus = opener || null;
    if (focusQueued) return;
    focusQueued = true;
    Promise.resolve().then(applyFocus);
  }

  // ---- sheet -----------------------------------------------------------------------------

  // sheet(content, options) opens a sheet. content is the SafeHtml of one
  // <section class="sheet">; it should hold <div data-partial="notice"></div> at the top of
  // its body, where the red banners are repeated (a full-height sheet hides the page).
  //   key             a word that names this sheet ("client:<id>")
  //   onRequestClose  called when the owner asks to close (Esc, the scrim, Close, Cancel)
  //   holdsInput      () => true while the sheet holds typing that is not saved
  //   focus           selector of the field to focus (default: the first control)
  //   keepOpener      true when this sheet replaces itself ("Save and add another")
  function sheet(content, options) {
    const o = options || {};
    const replacing = !!o.keepOpener && !!current && current.kind === 'sheet';
    if (!replacing) hideToast();               // a toast would lie over the sheet's buttons
    const opener = (o.keepOpener && current) ? current.opener : recentTrigger();
    current = {
      kind: 'sheet',
      key: o.key || 'sheet',
      onRequestClose: o.onRequestClose || null,
      holdsInput: o.holdsInput || null,
      opener: opener
    };
    mount(overlayRoot(), html`<div class="${replacing ? 'overlay overlay--still' : 'overlay'}"><div class="overlay__scrim" data-action="overlay.close"></div>${content}</div>`);
    drawNotice();
    focusInside(o.focus);
  }

  function drawNotice() {
    if (!current || current.kind !== 'sheet') return;
    const slot = overlayRoot().querySelector('[data-partial="notice"]');
    if (!slot) return;
    mount(slot, notice || html``);
    slot.hidden = !notice;
  }

  // setNotice(safeHtml or null): what an open sheet shows above its fields.
  function setNotice(safeHtml) {
    const next = safeHtml || null;
    const same = (next === null && notice === null) ||
      (next !== null && notice !== null && next.toString() === notice.toString());
    notice = next;
    if (!same) drawNotice();
  }

  // ---- modal -----------------------------------------------------------------------------

  // modal({ name, title, body, confirmLabel, danger, confirmOff, onConfirm, cancelLabel, onCancel })
  //   body          SafeHtml: one or two <p>, and form fields where a decision needs them
  //   confirmLabel  the confirm button; left out, the modal has only its closing button
  //   danger        the confirm button is the red one (a destructive confirmation)
  //   confirmOff    the confirm button starts disabled (setConfirmEnabled turns it on)
  //   onConfirm     called on confirm; return false to keep the modal open
  //   cancelLabel   "Cancel" by default
  function modal(o) {
    hideToast();
    current = {
      kind: 'modal',
      key: 'modal:' + (o.name || ''),
      onConfirm: o.onConfirm || null,
      onCancel: o.onCancel || null,
      opener: recentTrigger()
    };
    const cancelClass = o.confirmLabel ? 'btn btn--ghost' : 'btn btn--secondary';
    const confirmClass = o.danger ? 'btn btn--danger' : 'btn btn--primary';
    let confirm = '';
    if (o.confirmLabel) {
      confirm = o.confirmOff
        ? html`<button class="${confirmClass}" type="button" data-action="modal.confirm" disabled>${o.confirmLabel}</button>`
        : html`<button class="${confirmClass}" type="button" data-action="modal.confirm">${o.confirmLabel}</button>`;
    }
    mount(overlayRoot(), html`<div class="overlay"><div class="overlay__scrim" data-action="overlay.close"></div>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-text" data-modal="${o.name || ''}">
        <h2 class="modal__title" id="modal-title">${o.title}</h2>
        <div class="modal__body" id="modal-text">${o.body}</div>
        <footer class="modal__foot">
          <button class="${cancelClass}" type="button" data-action="overlay.close">${o.cancelLabel || 'Cancel'}</button>
          ${confirm}
        </footer>
      </section>
    </div>`);
    focusInside(null);
  }

  function setConfirmEnabled(on) {
    const button = overlayRoot().querySelector('[data-action="modal.confirm"]');
    if (button) button.disabled = !on;
  }

  // ---- closing ---------------------------------------------------------------------------

  // remove() takes the sheet or modal off the page, with no questions asked, and hands the
  // focus back to whatever opened it.
  function remove() {
    if (!current) return;
    const opener = current.opener;
    current = null;
    mount(overlayRoot(), html``);
    queueFocus(opener);
  }

  // The owner asked to close: Esc, a click on the scrim, the Close or Cancel button.
  function requestClose() {
    if (!current) return;
    if (current.kind === 'sheet') {
      if (current.onRequestClose) current.onRequestClose();
      else remove();
      return;
    }
    const onCancel = current.onCancel;
    remove();
    if (onCancel) onCancel();
  }

  function confirmModal() {
    if (!current || current.kind !== 'modal') return;
    const mine = current;
    const result = mine.onConfirm ? mine.onConfirm() : undefined;
    if (result !== false && current === mine) remove();
  }

  // ---- keys ------------------------------------------------------------------------------

  // Esc closes; Tab stays inside the open sheet or modal. Returns true when the key was used.
  function handleKey(event) {
    if (!current) return false;
    if (event.key === 'Escape') {
      requestClose();
      return true;
    }
    if (event.key !== 'Tab') return false;
    const el = box();
    if (!el) return false;
    const all = Array.prototype.filter.call(el.querySelectorAll(FOCUSABLE), shown);
    if (!all.length) return true;
    const first = all[0];
    const last = all[all.length - 1];
    const active = document.activeElement;
    if (!el.contains(active)) { first.focus(); return true; }
    if (event.shiftKey && active === first) { last.focus(); return true; }
    if (!event.shiftKey && active === last) { first.focus(); return true; }
    return false;
  }

  // ---- toast -----------------------------------------------------------------------------

  function hideToast() {
    if (toastTimer !== null) { clearTimeout(toastTimer); toastTimer = null; }
    toastRun = null;
    toastUndoOf = null;
    const root = toastRoot();
    if (root && root.firstChild) mount(root, html``);
  }

  // toast('Backup loaded.')
  // toast(text, { action: { label: 'Undo', run: fn }, tone: 'done' })
  // toast(text, { undoOf: 'Client deleted', action: { label: 'Undo', run: fn } })
  // text may be SafeHtml (for a name inside <bdi>). One toast at a time, 6 seconds.
  function toast(text, options) {
    const o = options || {};
    hideToast();
    toastRun = o.action ? o.action.run : null;
    toastUndoOf = o.undoOf || null;
    const action = o.action
      ? html`<button class="toast__action" type="button" data-action="toast.action">${o.action.label}</button>`
      : '';
    const inner = html`<span class="toast__text">${text}</span>${action}`;
    mount(toastRoot(), o.tone
      ? html`<div class="toast" data-tone="${o.tone}">${inner}</div>`
      : html`<div class="toast">${inner}</div>`);
    toastTimer = setTimeout(hideToast, TOAST_MS);
  }

  // An Undo toast goes away as soon as its change can no longer be undone (another change
  // was saved after it): expireUndo(store.flags().canUndo).
  function expireUndo(canUndo) {
    if (toastUndoOf !== null && toastUndoOf !== canUndo) hideToast();
  }

  function runToastAction() {
    const run = toastRun;
    hideToast();
    if (run) run();
  }

  // ---- start -----------------------------------------------------------------------------

  // start() registers the overlay's own actions and keys. Called once at boot.
  function start() {
    const actions = L.ui.actions;
    actions.on('overlay.close', requestClose);
    actions.on('modal.confirm', confirmModal);
    actions.on('toast.action', runToastAction);
    actions.onKey(handleKey);
  }

  L.ui.overlay = {
    start: start,
    sheet: sheet,
    modal: modal,
    toast: toast,
    hideToast: hideToast,
    expireUndo: expireUndo,
    remove: remove,
    requestClose: requestClose,
    setNotice: setNotice,
    setConfirmEnabled: setConfirmEnabled,
    isOpen: function () { return current !== null; },
    kind: function () { return current ? current.kind : null; },
    key: function () { return current ? current.key : null; },
    // true while an open sheet holds typing that is not saved (the two-tab guard asks this)
    holdsInput: function () {
      return !!(current && current.kind === 'sheet' && current.holdsInput && current.holdsInput());
    }
  };
})(window.Laser);

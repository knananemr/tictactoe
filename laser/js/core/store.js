// js/core/store.js
// The in-memory state and the only way to change it: commit (3.3).
// Also: undo, the two-tab guard, failed-save handling, drafts of half-typed forms.
(function (L) {
  'use strict';

  const util = L.core.util;
  const dates = L.core.dates;
  const schema = L.core.schema;

  const DRAFT_HOURS = 24;

  let adapter = null;        // the storage adapter in use
  let state = null;          // the current doc; null while the data cannot be opened
  let raw = null;            // the stored text exactly as it was found at init
  let lastSavedRev = null;   // the revision this tab last saw in storage
  let lastUndo = null;       // { label, doc } of the last undoable commit
  let stale = false;
  let saveFailed = false;
  let blocked = null;        // null, or { reason, storedFormat, appVersion, dataFormat }
  let firstRun = false;
  let loadErrors = [];
  let subscribers = [];
  let stopListening = null;
  let holdsInput = null;     // () => true while this tab holds unsaved typing

  function isInt(v) { return typeof v === 'number' && Number.isInteger(v); }

  function store() { return adapter || L.core.storage; }

  // ---- subscribers -----------------------------------------------------------------------

  // subscribe(fn) -> a function that removes the subscription.
  // fn(state, info) is called after every change. info.type is one of:
  //   'commit'    a commit was applied (info.label, info.saved)
  //   'undo'      the last commit was undone (info.label, info.saved)
  //   'replace'   the whole doc was replaced (import, undo of an import)
  //   'external'  another tab changed the data and this tab reloaded it silently
  //   'saved'     "Try again" succeeded after a failed save
  //   'flags'     only flags() changed (tab out of date, data erased)
  function subscribe(fn) {
    subscribers.push(fn);
    return function () {
      subscribers = subscribers.filter(function (x) { return x !== fn; });
    };
  }

  function notify(info) {
    let firstError = null;
    subscribers.slice().forEach(function (fn) {
      try { fn(state, info); } catch (e) { if (!firstError) firstError = e; }
    });
    if (firstError) throw firstError;
  }

  // ---- reading stored text ---------------------------------------------------------------

  function blockedInfo(reason, storedFormat) {
    return {
      reason: reason,
      storedFormat: storedFormat === undefined ? null : storedFormat,
      appVersion: L.VERSION,
      dataFormat: L.DATA_FORMAT
    };
  }

  // -> { doc } or { blocked }
  function open(text, now) {
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { return { blocked: blockedInfo('unreadable') }; }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.app !== L.APP_ID) {
      return { blocked: blockedInfo('unreadable') };
    }
    if (!isInt(parsed.schemaVersion) || parsed.schemaVersion < 1) {
      return { blocked: blockedInfo('unreadable') };
    }
    if (parsed.schemaVersion > L.DATA_FORMAT) {
      return { blocked: blockedInfo('newer', parsed.schemaVersion) };
    }
    let doc;
    try { doc = L.core.migrations.migrate(parsed); } catch (e) { return { blocked: blockedInfo('unreadable') }; }
    schema.normalize(doc);
    const ok = doc.meta && typeof doc.meta === 'object' && doc.settings && typeof doc.settings === 'object' &&
      Array.isArray(doc.people) && Array.isArray(doc.appointments) && Array.isArray(doc.payments);
    if (!ok) return { blocked: blockedInfo('unreadable') };
    schema.purge(doc, now);
    return { doc: doc };
  }

  // ---- init ------------------------------------------------------------------------------

  // init({ adapter, holdsInput }) loads the doc and returns flags().
  //   adapter     a storage adapter (default: Laser.core.storage)
  //   holdsInput  () => boolean: true while this tab holds unsaved typing (an open sheet)
  // A missing doc means first run: an empty doc is created and saved.
  // init starts from scratch every time it is called (subscribers are dropped too), so call
  // it once at boot, before subscribing.
  function init(options) {
    if (stopListening) stopListening();
    adapter = (options && options.adapter) || L.core.storage;
    holdsInput = (options && typeof options.holdsInput === 'function') ? options.holdsInput : null;
    state = null;
    raw = null;
    lastUndo = null;
    stale = false;
    saveFailed = false;
    blocked = null;
    firstRun = false;
    loadErrors = [];
    subscribers = [];
    stopListening = null;

    const now = dates.now();
    const text = adapter.load();
    if (text === null || text === undefined) {
      firstRun = true;
      state = schema.emptyDoc(now);
      const result = adapter.write(JSON.stringify(state), state.rev);
      if (result.ok) {
        lastSavedRev = state.rev;
      } else {
        saveFailed = true;
        lastSavedRev = adapter.readRev();
      }
    } else {
      raw = text;
      lastSavedRev = adapter.readRev();
      const opened = open(text, now);
      if (opened.blocked) {
        blocked = opened.blocked;
      } else {
        state = opened.doc;
        loadErrors = schema.validate(state);
      }
    }
    if (typeof adapter.onChange === 'function') {
      stopListening = adapter.onChange(checkOtherTabs);
    }
    return flags();
  }

  // The current doc. Treat it as read-only. null while flags().blocked is set because the
  // stored data could not be opened.
  function get() { return state; }

  // flags() -> { stale, saveFailed, blocked, firstRun, canUndo, loadErrors }
  //   stale       this tab is out of date (another tab changed the data while this one held
  //               typing). Commits are refused. The only way out is reloading the page.
  //   saveFailed  the last change is only on this screen. Commits are refused until
  //               retrySave() succeeds.
  //   blocked     null, or { reason, storedFormat, appVersion, dataFormat } with reason
  //               'newer' (the stored data is of a newer format: show the "older than your
  //               data" page), 'unreadable' (the stored text is not a Laser doc) or
  //               'erased' (erase() was called: reload the page).
  //   firstRun    this init found no doc and created one.
  //   canUndo     the label of the commit undo() would take back, or null.
  //   loadErrors  what validate said about the stored doc at init ([] when fine).
  function flags() {
    return {
      stale: stale,
      saveFailed: saveFailed,
      blocked: blocked,
      firstRun: firstRun,
      canUndo: lastUndo ? lastUndo.label : null,
      loadErrors: loadErrors
    };
  }

  // The stored text exactly as it was found at init (null on a first run). Used by the
  // "Save a backup of my data" button of the blocked page, which exports it unchanged.
  function rawText() { return raw; }

  // The adapter in use (for backup.js).
  function currentAdapter() { return store(); }

  function setHoldsInput(fn) { holdsInput = typeof fn === 'function' ? fn : null; }

  // ---- commit ----------------------------------------------------------------------------

  function result(ok, saved, reason, errors) {
    return {
      ok: ok,
      saved: saved,
      reason: reason || null,
      errors: errors || [],
      rev: state ? state.rev : null
    };
  }

  // Why a change cannot be made right now: null, 'blocked', 'stale' or 'saveFailed'.
  // Also runs the two-tab check, so a tab that fell behind finds out before it writes.
  function refusal() {
    if (!state || blocked) return 'blocked';
    if (stale) return 'stale';
    if (saveFailed) return 'saveFailed';
    if (store().readRev() !== lastSavedRev) {
      stale = true;
      notify({ type: 'flags' });
      return 'stale';
    }
    return null;
  }

  // Steps 3 to 9 of 3.3 for a finished draft.
  function apply(draft, o) {
    const errors = schema.validate(draft);
    if (errors.length) return result(false, false, 'invalid', errors);
    draft.rev = (o.baseRev === undefined ? state.rev : o.baseRev) + 1;
    if (o.countsAsChange) {
      draft.meta.changesSinceExport += 1;
      if (draft.meta.unsavedSince === null) draft.meta.unsavedSince = dates.stamp(o.at);
    }
    if (store().readRev() !== lastSavedRev) {
      stale = true;
      notify({ type: 'flags' });
      return result(false, false, 'stale');
    }
    const written = store().write(JSON.stringify(draft), draft.rev);
    lastUndo = o.undoable ? { label: o.label, doc: state } : null;
    state = draft;
    loadErrors = [];
    if (written.ok) lastSavedRev = draft.rev;
    else saveFailed = true;
    notify({ type: o.type, label: o.label, saved: written.ok });
    return result(true, written.ok, written.ok ? null : 'saveFailed');
  }

  // commit(label, mutator, options) -> { ok, saved, reason, errors, rev }
  //
  //   label     a few words for the Undo toast ("Client deleted")
  //   mutator   function (draft, ctx): change `draft` (a copy of the doc) in place.
  //             ctx = { now (Date), stamp (ISO string), today ('YYYY-MM-DD'), touch(record) }
  //             ctx.touch(record) stamps updatedAt on a record the mutator changed.
  //   options   { undoable: true, countsAsChange: true }
  //
  // Result:
  //   ok       the change is now in store.get() (on screen)
  //   saved    it is also on disk
  //   reason   null, or why not:
  //     'invalid'     validate refused the draft; errors holds the faults (first one first).
  //                   Nothing changed. Show errors[0].message under the field errors[0].field.
  //     'stale'       this tab is out of date. Nothing changed.
  //     'saveFailed'  either the write failed just now (ok true, saved false: the change is on
  //                   screen only), or an earlier write failed and this commit was refused
  //                   (ok false).
  //     'blocked'     the data could not be opened, or was erased. Nothing changed.
  //   errors   [] or the list from schema.validate
  //   rev      the revision of the doc now in store.get()
  //
  // The write is synchronous: when commit returns with saved true, the change is on disk.
  // An exception thrown by the mutator is passed on; the state is untouched.
  function commit(label, mutator, options) {
    const reason = refusal();
    if (reason) return result(false, false, reason);
    const undoable = !(options && options.undoable === false);
    const countsAsChange = !(options && options.countsAsChange === false);
    const at = dates.now();
    const draft = util.clone(state);
    const ctx = {
      now: at,
      stamp: dates.stamp(at),
      today: dates.today(at),
      touch: function (record) { return schema.touch(record, at); }
    };
    mutator(draft, ctx);
    return apply(draft, {
      type: 'commit', label: label, undoable: undoable, countsAsChange: countsAsChange, at: at
    });
  }

  // undo() takes back the last undoable commit by restoring the whole previous doc as a
  // new save (the revision keeps counting up). Same result shape as commit;
  // reason 'nothingToUndo' when there is nothing to take back.
  function undo() {
    if (!lastUndo) return result(false, false, 'nothingToUndo');
    const reason = refusal();
    if (reason) return result(false, false, reason);
    return apply(util.clone(lastUndo.doc), {
      type: 'undo', label: lastUndo.label, undoable: false, countsAsChange: false, at: dates.now()
    });
  }

  // replace(doc, { label }) puts a whole other doc in place of the current one (import,
  // undo of an import). The revision becomes max(current, doc.rev) + 1. Not undoable through
  // undo(). Same result shape as commit.
  function replace(doc, options) {
    const reason = refusal();
    if (reason) return result(false, false, reason);
    const draft = util.clone(doc);
    const base = Math.max(state.rev, isInt(draft.rev) ? draft.rev : 0);
    return apply(draft, {
      type: 'replace', label: (options && options.label) || '', undoable: false,
      countsAsChange: false, at: dates.now(), baseRev: base
    });
  }

  // retrySave() is the "Try again" button of the failed-save banner: writes the on-screen
  // doc again. -> { ok, saved, reason, errors, rev }; saved true clears flags().saveFailed.
  function retrySave() {
    if (!state || blocked) return result(false, false, 'blocked');
    if (stale) return result(false, false, 'stale');
    if (!saveFailed) return result(true, true, null);
    if (store().readRev() !== lastSavedRev) {
      stale = true;
      notify({ type: 'flags' });
      return result(false, false, 'stale');
    }
    const written = store().write(JSON.stringify(state), state.rev);
    if (!written.ok) return result(false, false, 'saveFailed');
    saveFailed = false;
    lastSavedRev = state.rev;
    notify({ type: 'saved' });
    return result(true, true, null);
  }

  // ---- two-tab guard ---------------------------------------------------------------------

  // Called when another tab changed the stored revision (the adapter's onChange), and safe to
  // call at any time (for example when the page becomes visible again).
  //   nothing typed here:   the state is reloaded from storage, silently ('external')
  //   unsaved typing here:  flags().stale is set ('flags'); what was typed is kept
  // -> 'same' | 'reloaded' | 'stale' | 'blocked'
  function checkOtherTabs() {
    if (!adapter) return 'same';
    if (blocked) return 'blocked';
    if (stale) return 'stale';
    const rev = adapter.readRev();
    if (rev === lastSavedRev) return 'same';
    const typing = !!(holdsInput && holdsInput());
    const text = adapter.load();
    if (saveFailed || typing || text === null || text === undefined) {
      stale = true;
      notify({ type: 'flags' });
      return 'stale';
    }
    const opened = open(text, dates.now());
    raw = text;
    lastSavedRev = rev;
    lastUndo = null;
    if (opened.blocked) {
      blocked = opened.blocked;
      state = null;
      notify({ type: 'flags' });
      return 'blocked';
    }
    state = opened.doc;
    loadErrors = schema.validate(state);
    notify({ type: 'external' });
    return 'reloaded';
  }

  // ---- erase (3.11) ----------------------------------------------------------------------

  // erase() removes this app's stored data on this device. Afterwards flags().blocked is
  // { reason: 'erased' } and nothing more can be saved: reload the page to start afresh.
  // -> { ok }
  function erase() {
    const done = store().erase();
    if (done && done.ok === false) return { ok: false };
    lastUndo = null;
    lastSavedRev = null;
    blocked = blockedInfo('erased');
    notify({ type: 'flags' });
    return { ok: true };
  }

  // ---- drafts (2.6 rendering rule 3) -----------------------------------------------------
  // One half-typed form is kept in the small screen state, so it survives a discarded page.
  // The view decides when to call save (debounced by 400 ms with util.debounce).

  function validDraft(d) {
    return d && typeof d === 'object' && typeof d.sheet === 'string' && d.values &&
      typeof d.values === 'object' && dates.isStamp(d.at);
  }

  const drafts = {
    // save('client', idOrNull, { name: 'Dan', ... }) -> true when written
    save: function (sheet, id, values) {
      return store().ui.set({
        draft: { sheet: sheet, id: id || null, values: values, at: dates.stamp() }
      });
    },
    // current() -> { sheet, id, values, at } or null. A draft older than 24 hours is gone.
    current: function () {
      const d = store().ui.get().draft;
      if (!validDraft(d)) return null;
      const age = dates.now().getTime() - dates.stampMs(d.at);
      if (age > DRAFT_HOURS * 3600000) {
        store().ui.set({ draft: null });
        return null;
      }
      return d;
    },
    // find('client', idOrNull) -> the draft of exactly that sheet and record, or null
    find: function (sheet, id) {
      const d = drafts.current();
      return (d && d.sheet === sheet && (d.id || null) === (id || null)) ? d : null;
    },
    // discard() removes the draft (after Save and after Discard)
    discard: function () {
      return store().ui.set({ draft: null });
    }
  };

  L.core.store = {
    init: init,
    get: get,
    flags: flags,
    rawText: rawText,
    adapter: currentAdapter,
    setHoldsInput: setHoldsInput,
    subscribe: subscribe,
    commit: commit,
    undo: undo,
    replace: replace,
    retrySave: retrySave,
    refusal: refusal,
    checkOtherTabs: checkOtherTabs,
    erase: erase,
    drafts: drafts
  };
})(window.Laser);

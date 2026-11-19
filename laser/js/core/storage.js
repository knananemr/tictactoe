// js/core/storage.js
// The storage adapter (3.1, 3.12). The only file that knows the key names.
// Every key starts with Laser.STORE_NAME, read at call time: 'laser' in the app and
// 'laser-test' on the test page. This file never clears the whole store.
//
// The adapter interface (store.init accepts any object with these members):
//   load()            -> the stored doc text, or null
//   readRev()         -> the stored revision as a whole number, or null
//   write(text, rev)  -> { ok, error }   synchronous write of the doc and its revision
//   save(text, rev)   -> Promise of the same result; the write has happened before it returns
//   usage()           -> { used, cap, fraction }
//   savePrev(text)    -> { ok, reason }  the one fallback copy
//   prevMax           the fallback copy is kept only for a doc shorter than this many characters
//   loadPrev()        -> text or null
//   clearPrev()
//   ui.get()          -> the small screen state object ({} when there is none)
//   ui.set(patch)     -> true when written; a key set to null or undefined is removed
//   onChange(fn)      -> calls fn() when another tab changed the revision; returns a function
//                        that stops listening
//   erase()           -> removes every key of this app
(function (L) {
  'use strict';

  const CAP_CHARS = 5200000;        // measured cap of the browser store, in characters (3.1)
  const PREV_MAX_CHARS = 1500000;   // the fallback copy is kept only below this size (3.5)
  const PARTS = ['doc', 'rev', 'prev', 'ui'];

  function key(part) { return L.STORE_NAME + '.' + part; }

  // The browser store. Reading the property can itself throw (blocked storage).
  function area() { return window.localStorage; }

  function read(part) {
    try { return area().getItem(key(part)); } catch (e) { return null; }
  }

  function message(e) { return String((e && e.message) || e); }

  function load() { return read('doc'); }

  function readRev() {
    const text = read('rev');
    if (text === null || !/^\d+$/.test(text)) return null;
    return parseInt(text, 10);
  }

  // Writes the doc and its revision, then reads the doc back and compares lengths.
  function write(text, rev) {
    try {
      const store = area();
      store.setItem(key('doc'), text);
      store.setItem(key('rev'), String(rev));
      const back = store.getItem(key('doc'));
      if (back === null || back.length !== text.length) {
        return { ok: false, error: 'The saved data did not read back.' };
      }
      if (store.getItem(key('rev')) !== String(rev)) {
        return { ok: false, error: 'The saved revision did not read back.' };
      }
      return { ok: true, error: null };
    } catch (e) {
      return { ok: false, error: message(e) };
    }
  }

  // Same as write, as a promise that is already settled: the write is done before it returns.
  function save(text, rev) { return Promise.resolve(write(text, rev)); }

  // How much of the store this app uses, in characters.
  function usage() {
    let used = 0;
    for (let i = 0; i < PARTS.length; i++) {
      const value = read(PARTS[i]);
      if (value !== null) used += value.length + key(PARTS[i]).length;
    }
    return { used: used, cap: CAP_CHARS, fraction: used / CAP_CHARS };
  }

  // The one fallback copy: the data as it was before the last import.
  function savePrev(text) {
    if (typeof text !== 'string') return { ok: false, reason: 'empty' };
    if (text.length >= PREV_MAX_CHARS) return { ok: false, reason: 'tooLarge' };
    try {
      area().setItem(key('prev'), text);
      return { ok: true, reason: null };
    } catch (e) {
      return { ok: false, reason: 'failed' };
    }
  }

  function loadPrev() { return read('prev'); }

  function clearPrev() {
    try { area().removeItem(key('prev')); } catch (e) { /* nothing to remove */ }
  }

  // Small screen state that must survive a discarded page: { draft, sent }.
  // Not business data: never in a backup, never changes the revision.
  const ui = {
    get: function () {
      const text = read('ui');
      if (text === null) return {};
      try {
        const value = JSON.parse(text);
        return (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};
      } catch (e) {
        return {};
      }
    },
    set: function (patch) {
      const next = ui.get();
      Object.keys(patch || {}).forEach(function (name) {
        if (patch[name] === null || patch[name] === undefined) delete next[name];
        else next[name] = patch[name];
      });
      try {
        if (Object.keys(next).length === 0) area().removeItem(key('ui'));
        else area().setItem(key('ui'), JSON.stringify(next));
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  // Tells when another tab changed the data (the storage event also fires for local files).
  function onChange(callback) {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return function () {};
    }
    function handler(event) {
      if (event.key === null || event.key === key('rev')) callback();
    }
    window.addEventListener('storage', handler);
    return function () { window.removeEventListener('storage', handler); };
  }

  // Erase this device (3.11): removes this app's keys one by one, and nothing else.
  function erase() {
    let ok = true;
    for (let i = 0; i < PARTS.length; i++) {
      try { area().removeItem(key(PARTS[i])); } catch (e) { ok = false; }
    }
    return { ok: ok };
  }

  L.core.storage = {
    load: load,
    readRev: readRev,
    write: write,
    save: save,
    usage: usage,
    savePrev: savePrev,
    prevMax: PREV_MAX_CHARS,
    loadPrev: loadPrev,
    clearPrev: clearPrev,
    ui: ui,
    onChange: onChange,
    erase: erase
  };
})(window.Laser);

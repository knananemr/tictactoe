// tests/unit/harness.js
// The unit test harness: test(name, fn), eq(a, b), ok(x), throws(fn), memoryAdapter().
// It is loaded straight after js/core/ns.js and BEFORE every other core file, and its first
// act is to move every storage key to the test prefix, so this page can never touch the
// owner's data (2.7).
(function (L) {
  'use strict';

  L.STORE_NAME = 'laser-test';

  const tests = [];

  function show(value) {
    if (typeof value === 'string') return JSON.stringify(value);
    if (value === undefined) return 'undefined';
    if (typeof value === 'number' && isNaN(value)) return 'NaN';
    try {
      const text = JSON.stringify(value);
      return text === undefined ? String(value) : (text.length > 300 ? text.slice(0, 300) + ' ...' : text);
    } catch (e) {
      return String(value);
    }
  }

  function same(a, b) {
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number') return isNaN(a) && isNaN(b);
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!same(a[i], b[i])) return false;
      return true;
    }
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (ka.length !== kb.length) return false;
    for (let i = 0; i < ka.length; i++) {
      if (ka[i] !== kb[i] || !same(a[ka[i]], b[ka[i]])) return false;
    }
    return true;
  }

  // test('dates: addDays crosses a month end', function () { ... })
  // The function may return a promise.
  function test(name, fn) { tests.push({ name: name, fn: fn }); }

  // eq(actual, expected): deep equality of plain data
  function eq(actual, expected, note) {
    if (!same(actual, expected)) {
      throw new Error((note ? note + ': ' : '') + 'expected ' + show(expected) + ' but got ' + show(actual));
    }
  }

  function ok(value, note) {
    if (!value) throw new Error(note || 'expected a true value but got ' + show(value));
  }

  function throws(fn, note) {
    let thrown = null;
    try { fn(); } catch (e) { thrown = e; }
    if (!thrown) throw new Error(note || 'expected an exception');
    return thrown;
  }

  // An in-memory storage adapter with the interface of js/core/storage.js. Tests of store,
  // backup and migrations use it, so they never write to the browser's storage.
  //   adapter.mem          what is "on disk": { doc, rev, prev, ui }
  //   adapter.failWrites   set to true to make every write fail
  //   adapter.otherTab(text, rev)   pretend another tab saved
  function memoryAdapter(seed) {
    const mem = { doc: null, rev: null, prev: null, ui: {} };
    if (seed && typeof seed.doc === 'string') mem.doc = seed.doc;
    if (seed && typeof seed.rev === 'number') mem.rev = seed.rev;
    let listener = null;
    const adapter = {
      mem: mem,
      failWrites: false,
      writes: 0,
      load: function () { return mem.doc; },
      readRev: function () { return mem.rev; },
      write: function (text, rev) {
        if (adapter.failWrites) return { ok: false, error: 'The test made this write fail.' };
        mem.doc = text;
        mem.rev = rev;
        adapter.writes++;
        return { ok: true, error: null };
      },
      save: function (text, rev) { return Promise.resolve(adapter.write(text, rev)); },
      usage: function () {
        const used = (mem.doc || '').length + (mem.prev || '').length;
        return { used: used, cap: 5200000, fraction: used / 5200000 };
      },
      savePrev: function (text) {
        if (adapter.failWrites) return { ok: false, reason: 'failed' };
        mem.prev = text;
        return { ok: true, reason: null };
      },
      loadPrev: function () { return mem.prev; },
      clearPrev: function () { mem.prev = null; },
      ui: {
        get: function () { return JSON.parse(JSON.stringify(mem.ui)); },
        set: function (patch) {
          Object.keys(patch || {}).forEach(function (name) {
            if (patch[name] === null || patch[name] === undefined) delete mem.ui[name];
            else mem.ui[name] = JSON.parse(JSON.stringify(patch[name]));
          });
          return true;
        }
      },
      onChange: function (fn) {
        listener = fn;
        return function () { listener = null; };
      },
      erase: function () {
        mem.doc = null; mem.rev = null; mem.prev = null; mem.ui = {};
        return { ok: true };
      },
      otherTab: function (text, rev) {
        mem.doc = text;
        mem.rev = rev;
        if (listener) listener();
      }
    };
    return adapter;
  }

  // ---- running and reporting -------------------------------------------------------------

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function report(results) {
    const failures = results.filter(function (r) { return !r.passed; });
    const root = document.getElementById('results') || document.body;
    const summary = document.getElementById('summary') || root.appendChild(element('p'));
    summary.className = failures.length ? 'summary fail' : 'summary pass';
    summary.textContent = failures.length
      ? failures.length + ' of ' + results.length + ' tests failed'
      : 'All ' + results.length + ' tests passed';
    document.title = (failures.length ? 'FAILED ' + failures.length : 'Passed ' + results.length) + ' - Laser unit tests';

    const list = element('ul', 'tests');
    failures.concat(results.filter(function (r) { return r.passed; })).forEach(function (r) {
      const item = element('li', r.passed ? 'pass' : 'fail');
      item.appendChild(element('span', 'mark', r.passed ? 'pass' : 'FAIL'));
      item.appendChild(element('span', 'name', r.name));
      if (!r.passed) item.appendChild(element('pre', 'why', r.error));
      list.appendChild(item);
    });
    root.appendChild(list);

    window.__unit = {
      total: results.length,
      failed: failures.length,
      failures: failures.map(function (r) { return r.name + ': ' + r.error; })
    };
  }

  async function run() {
    const results = [];
    for (let i = 0; i < tests.length; i++) {
      const t = tests[i];
      try {
        await t.fn();
        results.push({ name: t.name, passed: true, error: null });
      } catch (e) {
        results.push({ name: t.name, passed: false, error: String((e && e.message) || e) });
      }
    }
    report(results);
  }

  window.test = test;
  window.eq = eq;
  window.ok = ok;
  window.throws = throws;
  window.memoryAdapter = memoryAdapter;

  // Deferred scripts have all run by the time this event fires.
  document.addEventListener('DOMContentLoaded', function () {
    run();
  });
})(window.Laser);

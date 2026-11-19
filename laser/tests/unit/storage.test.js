// tests/unit/storage.test.js
// The ONE test that writes to the browser's storage (2.7 guard 2). It uses only keys that
// start with the test prefix and removes every one of them before it ends.
(function (L) {
  'use strict';
  const storage = L.core.storage;

  function keysWithPrefix(prefix) {
    const found = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const name = window.localStorage.key(i);
      if (name.indexOf(prefix) === 0) found.push(name);
    }
    return found.sort();
  }

  test('storage: the test page uses its own prefix, never the app\'s', function () {
    eq(L.STORE_NAME, 'laser-test');
  });

  test('storage: the browser adapter writes, reads back and removes, on the test keys only', function () {
    const prefix = L.STORE_NAME + '.';
    let saved = null;
    const before = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const name = window.localStorage.key(i);
      if (name.indexOf(prefix) !== 0) before[name] = window.localStorage.getItem(name);
    }
    try {
      storage.erase();
      eq(keysWithPrefix(prefix), []);

      // nothing stored yet
      eq(storage.load(), null);
      eq(storage.readRev(), null);
      eq(storage.loadPrev(), null);
      eq(storage.ui.get(), {});
      eq(storage.usage().used, 0);

      // write and read back
      const text = JSON.stringify({ app: 'laser-practice', note: 'שלום 😀', n: 1 });
      eq(storage.write(text, 7), { ok: true, error: null });
      eq(storage.load(), text);
      eq(storage.readRev(), 7);
      eq(keysWithPrefix(prefix), [prefix + 'doc', prefix + 'rev']);
      eq(window.localStorage.getItem(prefix + 'rev'), '7');

      // usage counts what is stored
      const usage = storage.usage();
      ok(usage.used >= text.length, 'usage counts the document');
      eq(usage.cap, 5200000);
      ok(usage.fraction > 0 && usage.fraction < 0.001);

      // the fallback copy
      eq(storage.savePrev('{"old":true}'), { ok: true, reason: null });
      eq(storage.loadPrev(), '{"old":true}');
      eq(storage.savePrev(new Array(1500002).join('x')).reason, 'tooLarge');
      eq(storage.prevMax, 1500000);
      eq(storage.loadPrev(), '{"old":true}', 'a copy that is too large does not replace the kept one');
      storage.clearPrev();
      eq(storage.loadPrev(), null);

      // the small screen state: merged by key, removed with null, never touches the revision
      ok(storage.ui.set({ draft: { sheet: 'client', id: null, values: { name: 'Dan' }, at: '2026-11-18T08:12:44.000Z' } }));
      ok(storage.ui.set({ sent: { kind: 'rebook', id: 'x' } }));
      eq(Object.keys(storage.ui.get()).sort(), ['draft', 'sent']);
      eq(storage.ui.get().draft.values.name, 'Dan');
      ok(storage.ui.set({ sent: null }));
      eq(Object.keys(storage.ui.get()), ['draft']);
      eq(storage.readRev(), 7);
      ok(storage.ui.set({ draft: null }));
      eq(storage.ui.get(), {});
      eq(keysWithPrefix(prefix), [prefix + 'doc', prefix + 'rev'], 'an empty screen state leaves no key');

      // a broken value reads as empty instead of throwing
      window.localStorage.setItem(prefix + 'ui', 'not json');
      eq(storage.ui.get(), {});
      window.localStorage.setItem(prefix + 'rev', 'seven');
      eq(storage.readRev(), null);

      // a second write replaces the first
      eq(storage.write('{"n":2}', 8).ok, true);
      eq(storage.load(), '{"n":2}');
      eq(storage.readRev(), 8);

      // the key prefix is read at call time (2.7 guard 1), not when the file loads
      const name = L.STORE_NAME;
      try {
        L.STORE_NAME = name + '-b';
        eq(storage.load(), null);
        eq(storage.write('{"b":1}', 1).ok, true);
        eq(window.localStorage.getItem(name + '-b.doc'), '{"b":1}');
        eq(storage.erase(), { ok: true });
        eq(window.localStorage.getItem(name + '-b.doc'), null);
      } finally {
        L.STORE_NAME = name;
      }
      eq(storage.load(), '{"n":2}', 'the other prefix did not touch this one');

      // save is the same write, as a promise that is already settled when it returns
      saved = storage.save('{"n":3}', 9);
      eq(storage.load(), '{"n":3}', 'the write happened before save returned');
      eq(storage.readRev(), 9);
    } finally {
      // erase removes this app's keys one by one, and nothing else
      eq(storage.erase(), { ok: true });
    }
    eq(keysWithPrefix(L.STORE_NAME), [], 'no test key is left behind');
    eq(storage.load(), null);
    const after = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const name = window.localStorage.key(i);
      after[name] = window.localStorage.getItem(name);
    }
    eq(after, before, 'every other key in the browser is exactly as it was');
    return saved.then(function (result) { eq(result, { ok: true, error: null }); });
  });

  test('storage.write: a failing store is reported, not thrown', function () {
    const prefix = L.STORE_NAME + '.';
    const real = Storage.prototype.setItem;
    try {
      Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); };
      const result = storage.write('{"n":4}', 10);
      eq(result.ok, false);
      ok(result.error.indexOf('Quota') !== -1);
      eq(storage.savePrev('{}').ok, false);
      eq(storage.ui.set({ draft: { a: 1 } }), false);
    } finally {
      Storage.prototype.setItem = real;
      storage.erase();
    }
    eq(storage.load(), null);
    eq(keysWithPrefix(prefix), []);
  });

  test('storage.onChange: listens for the revision key of this app only', function () {
    let calls = 0;
    const stop = storage.onChange(function () { calls++; });
    try {
      window.dispatchEvent(new StorageEvent('storage', { key: L.STORE_NAME + '.rev', newValue: '3' }));
      eq(calls, 1);
      window.dispatchEvent(new StorageEvent('storage', { key: 'tictactoe-score', newValue: '3' }));
      window.dispatchEvent(new StorageEvent('storage', { key: L.STORE_NAME + '.doc', newValue: '{}' }));
      eq(calls, 1);
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
      eq(calls, 2);
    } finally {
      stop();
    }
    window.dispatchEvent(new StorageEvent('storage', { key: L.STORE_NAME + '.rev', newValue: '4' }));
    eq(calls, 2, 'no calls after stop');
  });
})(window.Laser);

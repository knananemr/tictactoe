// tests/unit/store.test.js
// Every test here gives store.init an in-memory adapter (2.7 guard 2): nothing is written to
// the browser's storage.
(function (L) {
  'use strict';
  const store = L.core.store;
  const schema = L.core.schema;
  const dates = L.core.dates;

  function start(options) {
    const adapter = memoryAdapter();
    const flags = store.init(Object.assign({ adapter: adapter }, options || {}));
    return { adapter: adapter, flags: flags };
  }

  function seeded(doc, options) {
    const adapter = memoryAdapter({ doc: typeof doc === 'string' ? doc : JSON.stringify(doc), rev: typeof doc === 'string' ? 0 : doc.rev });
    const flags = store.init(Object.assign({ adapter: adapter }, options || {}));
    return { adapter: adapter, flags: flags };
  }

  function addPerson(name, options) {
    return store.commit('Client added', function (draft) {
      draft.people.push(schema.newPerson({ name: name }));
    }, options);
  }

  function onDisk(adapter) { return JSON.parse(adapter.mem.doc); }

  function withClock(date, fn) {
    const real = dates.now;
    dates.now = function () { return date; };
    try { return fn(); } finally { dates.now = real; }
  }

  // ---- init ------------------------------------------------------------------------------

  test('store.init: a first run creates an empty document and saves it', function () {
    const s = start();
    eq(s.flags.firstRun, true);
    eq(s.flags.blocked, null);
    eq(s.flags.stale, false);
    eq(s.flags.saveFailed, false);
    const doc = store.get();
    eq(doc.app, 'laser-practice');
    eq(doc.rev, 0);
    eq(doc.meta.startedOn, dates.today());
    eq(doc.meta.welcomeDone, false);
    eq(doc.people, []);
    eq(onDisk(s.adapter), doc, 'the new document is on disk at once');
    eq(s.adapter.mem.rev, 0);
    eq(store.rawText(), null);
  });

  test('store.init: the next start finds the document, so it is no longer a first run', function () {
    const s = start();
    addPerson('Dana Levi');
    const flags = store.init({ adapter: s.adapter });
    eq(flags.firstRun, false);
    eq(store.get().people.length, 1);
    eq(store.get().people[0].name, 'Dana Levi');
    eq(store.get().meta.welcomeDone, false, 'the Welcome card is still due after a reload');
    eq(flags.loadErrors, []);
    eq(store.rawText(), s.adapter.mem.doc);
  });

  test('store.init: normalizes what it loads (missing fields get their defaults)', function () {
    const s = seeded({
      app: 'laser-practice', schemaVersion: 1, rev: 4, createdAt: '2026-06-01T08:00:00.000Z',
      people: [{ id: 'p1', name: 'Dana Levi', clientSince: '2026-06-01', somethingNew: 1 }]
    });
    eq(s.flags.firstRun, false);
    const doc = store.get();
    eq(doc.rev, 4);
    eq(doc.people[0].phone, '');
    eq(doc.people[0].somethingNew, 1);
    eq(doc.settings.rebookWeeks, 4);
    eq(doc.appointments, []);
    eq(schema.validate(doc), []);
    const r = addPerson('Maya Cohen');
    eq(r.ok, true);
    eq(r.rev, 5);
  });

  test('store.init: records deleted more than 30 days ago are removed for good', function () {
    const doc = schema.emptyDoc(new Date(2026, 8, 1, 9, 0));
    const old = schema.newPerson({ name: 'Old' });
    old.deletedAt = dates.stamp(new Date(dates.now().getTime() - 31 * 86400000));
    const recent = schema.newPerson({ name: 'Recent' });
    recent.deletedAt = dates.stamp(new Date(dates.now().getTime() - 29 * 86400000));
    doc.people.push(old, recent, schema.newPerson({ name: 'Live' }));
    seeded(doc);
    eq(store.get().people.map(function (p) { return p.name; }), ['Recent', 'Live']);
  });

  test('store.init: stored data of a newer format is not opened', function () {
    const newer = JSON.stringify({ app: 'laser-practice', schemaVersion: 2, rev: 9, people: [{ id: 'p1', fullName: 'Dana' }] });
    const s = seeded(newer);
    eq(s.flags.blocked, { reason: 'newer', storedFormat: 2, appVersion: L.VERSION, dataFormat: 1 });
    eq(store.get(), null);
    eq(store.rawText(), newer, 'the raw text is kept for "Save a backup of my data"');
    const r = store.commit('x', function () {});
    eq([r.ok, r.saved, r.reason], [false, false, 'blocked']);
    eq(s.adapter.mem.doc, newer, 'nothing was written');
    eq(s.adapter.writes, 0);
  });

  test('store.init: stored text that is not a Laser document is not opened either', function () {
    eq(seeded('this is not json').flags.blocked.reason, 'unreadable');
    eq(store.get(), null);
    eq(seeded(JSON.stringify({ app: 'tictactoe', score: 3 })).flags.blocked.reason, 'unreadable');
    eq(seeded(JSON.stringify({ app: 'laser-practice', schemaVersion: 1, people: 'none' })).flags.blocked.reason, 'unreadable');
    eq(seeded(JSON.stringify([1, 2])).flags.blocked.reason, 'unreadable');
    eq(store.rawText(), '[1,2]');
  });

  test('store.init: when the first save fails the app still opens, with saveFailed set', function () {
    const adapter = memoryAdapter();
    adapter.failWrites = true;
    const flags = store.init({ adapter: adapter });
    eq(flags.firstRun, true);
    eq(flags.saveFailed, true);
    ok(store.get() !== null);
    eq(adapter.mem.doc, null);
    adapter.failWrites = false;
    eq(store.retrySave().saved, true);
    eq(store.flags().saveFailed, false);
    eq(onDisk(adapter), store.get());
  });

  // ---- commit ----------------------------------------------------------------------------

  test('store.commit: changes the state, saves at once, and counts the change', function () {
    const s = start();
    const before = store.get();
    const r = addPerson('Dana Levi');
    eq(r, { ok: true, saved: true, reason: null, errors: [], rev: 1 });
    const doc = store.get();
    ok(doc !== before, 'a new document object');
    eq(before.people, [], 'the previous document was not touched');
    eq(doc.people.length, 1);
    eq(doc.rev, 1);
    eq(doc.meta.changesSinceExport, 1);
    ok(dates.isStamp(doc.meta.unsavedSince));
    eq(onDisk(s.adapter), doc, 'on disk when commit returns');
    eq(s.adapter.mem.rev, 1);
    const first = doc.meta.unsavedSince;
    addPerson('Maya Cohen');
    eq(store.get().meta.changesSinceExport, 2);
    eq(store.get().meta.unsavedSince, first, 'unsavedSince is the FIRST change after a backup');
    eq(store.get().rev, 2);
  });

  test('store.commit: a bookkeeping commit does not count as a change', function () {
    start();
    const r = store.commit('Welcome done', function (draft) { draft.meta.welcomeDone = true; },
      { undoable: false, countsAsChange: false });
    eq(r.ok, true);
    eq(store.get().meta.welcomeDone, true);
    eq(store.get().meta.changesSinceExport, 0);
    eq(store.get().meta.unsavedSince, null);
    eq(store.get().rev, 1);
    eq(store.flags().canUndo, null);
  });

  test('store.commit: validates every save; an invalid draft is refused and nothing changes', function () {
    const s = start();
    addPerson('Dana Levi');
    const before = store.get();
    const text = s.adapter.mem.doc;
    const r = store.commit('Client added', function (draft) {
      draft.people.push(schema.newPerson({ name: '' }));
    });
    eq([r.ok, r.saved, r.reason, r.rev], [false, false, 'invalid', 1]);
    eq(r.errors.length, 1);
    eq([r.errors[0].collection, r.errors[0].field, r.errors[0].message], ['people', 'name', 'Enter a name']);
    ok(store.get() === before, 'the state is the same object as before');
    eq(s.adapter.mem.doc, text, 'nothing was written');
    eq(store.flags().canUndo, 'Client added', 'the earlier undo is still there');

    const r2 = store.commit('Email', function (draft) { draft.people[0].email = 'dana'; });
    eq([r2.ok, r2.reason, r2.errors[0].field], [false, 'invalid', 'email']);
    const r3 = store.commit('Email', function (draft) { draft.people[0].email = 'dana@gmail'; });
    eq([r3.ok, r3.saved], [true, true]);
  });

  test('store.commit: an exception in the mutator is passed on and the state is untouched', function () {
    const s = start();
    const before = store.get();
    throws(function () {
      store.commit('Broken', function (draft) { draft.people.push({}); throw new Error('bug'); });
    });
    ok(store.get() === before);
    eq(s.adapter.mem.rev, 0);
    eq(addPerson('Dana').ok, true);
  });

  test('store.commit: the mutator gets the clock of this save and a touch helper', function () {
    start();
    addPerson('Dana Levi');
    withClock(new Date(2026, 10, 18, 1, 30), function () {
      let seen = null;
      store.commit('Edit', function (draft, ctx) {
        seen = ctx;
        draft.people[0].phone = '054-123 4567';
        ctx.touch(draft.people[0]);
      });
      eq(seen.today, '2026-11-18');
      eq(seen.stamp, dates.stamp(new Date(2026, 10, 18, 1, 30)));
      ok(seen.now instanceof Date);
      eq(store.get().people[0].updatedAt, seen.stamp);
    });
  });

  test('store.subscribe: called after every change, until unsubscribed', function () {
    start();
    const seen = [];
    const stop = store.subscribe(function (state, info) { seen.push([info.type, info.label, state.people.length]); });
    addPerson('Dana Levi');
    store.undo();
    eq(seen, [['commit', 'Client added', 1], ['undo', 'Client added', 0]]);
    stop();
    addPerson('Maya Cohen');
    eq(seen.length, 2);
    const r = store.commit('Bad', function (draft) { draft.people[0].name = ''; });
    eq(r.reason, 'invalid');
  });

  // ---- undo ------------------------------------------------------------------------------

  test('store.undo: restores the previous document as a new save', function () {
    const s = start();
    addPerson('Dana Levi');
    addPerson('Maya Cohen');
    eq(store.flags().canUndo, 'Client added');
    const r = store.undo();
    eq([r.ok, r.saved, r.rev], [true, true, 3], 'the revision keeps counting up');
    const doc = store.get();
    eq(doc.people.map(function (p) { return p.name; }), ['Dana Levi']);
    eq(doc.meta.changesSinceExport, 1, 'the counters are those of the restored document');
    eq(onDisk(s.adapter), doc);
    eq(store.flags().canUndo, null);
    eq(store.undo().reason, 'nothingToUndo');
    eq(store.get().rev, 3);
  });

  test('store.undo: a save that touched three records is undone as one', function () {
    start();
    addPerson('Dana Levi');
    const id = store.get().people[0].id;
    store.commit('Session finished', function (draft, ctx) {
      const done = schema.newAppointment({ personId: id, date: ctx.today, time: '14:00', status: 'done' }, { now: ctx.now });
      draft.appointments.push(done);
      draft.payments.push(schema.newPayment({ personId: id, appointmentId: done.id, paidOn: ctx.today, amountMinor: 25000 }, { now: ctx.now }));
      draft.appointments.push(schema.newAppointment({ personId: id, date: dates.addDays(ctx.today, 28), time: '14:00' }, { now: ctx.now }));
    });
    eq([store.get().appointments.length, store.get().payments.length], [2, 1]);
    store.undo();
    eq([store.get().people.length, store.get().appointments.length, store.get().payments.length], [1, 0, 0]);
  });

  test('store.undo: a commit that is not undoable clears the undo', function () {
    start();
    addPerson('Dana Levi');
    eq(store.flags().canUndo, 'Client added');
    store.commit('Backup saved', function (draft, ctx) { draft.meta.lastExportAt = ctx.stamp; },
      { undoable: false, countsAsChange: false });
    eq(store.flags().canUndo, null);
    eq(store.undo().ok, false);
    eq(store.get().people.length, 1);
  });

  test('store.undo: deleting and undoing brings the same record back', function () {
    start();
    addPerson('Dana Levi');
    const before = store.get().people[0];
    store.commit('Client deleted', function (draft, ctx) { schema.markDeleted(draft.people[0], ctx.now); });
    ok(store.get().people[0].deletedAt !== null);
    store.undo();
    eq(store.get().people[0], before);
  });

  // ---- the two-tab guard -----------------------------------------------------------------

  function otherTabAdds(adapter, name) {
    const doc = JSON.parse(adapter.mem.doc);
    doc.people.push(schema.newPerson({ name: name }));
    doc.rev += 1;
    adapter.otherTab(JSON.stringify(doc), doc.rev);
    return doc;
  }

  test('two tabs: with nothing being typed, the other tab\'s change appears silently', function () {
    const s = start();
    addPerson('Dana Levi');
    const seen = [];
    store.subscribe(function (state, info) { seen.push(info.type); });
    otherTabAdds(s.adapter, 'Maya Cohen');
    eq(seen, ['external']);
    eq(store.flags().stale, false);
    eq(store.get().people.map(function (p) { return p.name; }), ['Dana Levi', 'Maya Cohen']);
    eq(store.flags().canUndo, null, 'an undo from before the reload is gone');
    const r = addPerson('Noa Bar');
    eq([r.ok, r.saved, r.rev], [true, true, 3], 'and this tab can save again');
  });

  test('two tabs: with a half-typed form, the tab goes out of date and refuses to save', function () {
    let typing = false;
    const s = start({ holdsInput: function () { return typing; } });
    addPerson('Dana Levi');
    const seen = [];
    store.subscribe(function (state, info) { seen.push(info.type); });
    typing = true;
    const theirs = otherTabAdds(s.adapter, 'Maya Cohen');
    eq(seen, ['flags']);
    eq(store.flags().stale, true);
    eq(store.get().people.length, 1, 'this tab keeps what it showed');
    const r = addPerson('Typed Here');
    eq([r.ok, r.saved, r.reason], [false, false, 'stale']);
    eq(onDisk(s.adapter), theirs, 'the other tab\'s data was not overwritten');
    eq(store.undo().reason, 'stale');
    eq(store.checkOtherTabs(), 'stale');
  });

  test('two tabs: setHoldsInput can set the typing check after init', function () {
    const s = start();
    store.setHoldsInput(function () { return true; });
    otherTabAdds(s.adapter, 'Maya Cohen');
    eq(store.flags().stale, true);
  });

  test('two tabs: a save is refused when storage moved on without this tab noticing', function () {
    const s = start();
    addPerson('Dana Levi');
    // the other tab saved, but this tab never got the event
    const theirs = JSON.parse(s.adapter.mem.doc);
    theirs.people[0].phone = '054-999 9999';
    theirs.rev = 2;
    s.adapter.mem.doc = JSON.stringify(theirs);
    s.adapter.mem.rev = 2;
    const writes = s.adapter.writes;
    const r = addPerson('Typed Here');
    eq([r.ok, r.reason], [false, 'stale']);
    eq(s.adapter.writes, writes, 'nothing written');
    eq(onDisk(s.adapter), theirs);
    eq(store.flags().stale, true);
  });

  test('two tabs: the check runs right before the write, after the mutator (3.3 step 5)', function () {
    const s = start();
    addPerson('Dana Levi');
    const before = store.get();
    const r = store.commit('Client added', function (draft) {
      draft.people.push(schema.newPerson({ name: 'Typed Here' }));
      // meanwhile, another tab saves
      s.adapter.mem.doc = '{"theirs":true}';
      s.adapter.mem.rev = 7;
    });
    eq([r.ok, r.saved, r.reason], [false, false, 'stale']);
    eq(s.adapter.mem.doc, '{"theirs":true}', 'last write does not win');
    ok(store.get() === before);
    eq(store.flags().stale, true);
  });

  test('two tabs: checkOtherTabs can be called at any time', function () {
    const s = start();
    eq(store.checkOtherTabs(), 'same');
    const theirs = JSON.parse(s.adapter.mem.doc);
    theirs.people.push(schema.newPerson({ name: 'Maya Cohen' }));
    theirs.rev = 1;
    s.adapter.mem.doc = JSON.stringify(theirs);
    s.adapter.mem.rev = 1;
    eq(store.checkOtherTabs(), 'reloaded');
    eq(store.get().people.length, 1);
    eq(store.checkOtherTabs(), 'same');
  });

  test('two tabs: if the other tab erased the data, this tab goes out of date', function () {
    const s = start();
    addPerson('Dana Levi');
    s.adapter.mem.doc = null;
    s.adapter.otherTab(null, null);
    eq(store.flags().stale, true);
    eq(addPerson('x').reason, 'stale');
    eq(s.adapter.mem.doc, null);
  });

  test('two tabs: if the other tab wrote a newer data format, this tab stops', function () {
    const s = start();
    addPerson('Dana Levi');
    s.adapter.otherTab(JSON.stringify({ app: 'laser-practice', schemaVersion: 2, rev: 5 }), 5);
    eq(store.flags().blocked.reason, 'newer');
    eq(store.get(), null);
    eq(addPerson('x').reason, 'blocked');
  });

  // ---- a failed save ---------------------------------------------------------------------

  test('failed save: the change stays on screen, the flag is set, further edits are refused', function () {
    const s = start();
    addPerson('Dana Levi');
    const disk = s.adapter.mem.doc;
    const seen = [];
    store.subscribe(function (state, info) { seen.push([info.type, info.saved]); });
    s.adapter.failWrites = true;
    const r = addPerson('Maya Cohen');
    eq([r.ok, r.saved, r.reason, r.rev], [true, false, 'saveFailed', 2]);
    eq(seen, [['commit', false]]);
    eq(store.flags().saveFailed, true);
    eq(store.get().people.length, 2, 'the last change is on this screen');
    eq(s.adapter.mem.doc, disk, 'but not on disk');
    eq(s.adapter.mem.rev, 1);

    const r2 = addPerson('Noa Bar');
    eq([r2.ok, r2.saved, r2.reason], [false, false, 'saveFailed']);
    eq(store.get().people.length, 2);
    eq(store.undo().reason, 'saveFailed');

    const again = store.retrySave();
    eq([again.ok, again.saved, again.reason], [false, false, 'saveFailed']);
    eq(store.flags().saveFailed, true);
  });

  test('failed save: "Try again" writes the on-screen document and lifts the block', function () {
    const s = start();
    addPerson('Dana Levi');
    s.adapter.failWrites = true;
    addPerson('Maya Cohen');
    s.adapter.failWrites = false;
    const seen = [];
    store.subscribe(function (state, info) { seen.push(info.type); });
    const again = store.retrySave();
    eq([again.ok, again.saved, again.reason, again.rev], [true, true, null, 2]);
    eq(seen, ['saved']);
    eq(store.flags().saveFailed, false);
    eq(onDisk(s.adapter), store.get());
    eq(s.adapter.mem.rev, 2);
    eq(addPerson('Noa Bar').saved, true);
    eq(store.retrySave().saved, true, 'retrySave with nothing to retry is fine');
  });

  test('failed save: the on-screen document can still be exported', function () {
    const s = start();
    s.adapter.failWrites = true;
    addPerson('Dana Levi');
    const file = L.core.backup.buildFile(store.get());
    eq(JSON.parse(file.text).people[0].name, 'Dana Levi');
  });

  test('failed save: if another tab then changes the data, this tab is out of date', function () {
    const s = start();
    addPerson('Dana Levi');
    s.adapter.failWrites = true;
    addPerson('Only On Screen');
    s.adapter.failWrites = false;
    otherTabAdds(s.adapter, 'Maya Cohen');
    eq(store.flags().stale, true);
    eq(store.retrySave().reason, 'stale');
    eq(onDisk(s.adapter).people.map(function (p) { return p.name; }), ['Dana Levi', 'Maya Cohen']);
  });

  // ---- replace and erase -----------------------------------------------------------------

  test('store.replace: the revision becomes max(current, new) + 1', function () {
    const s = start();
    addPerson('Dana Levi');
    addPerson('Maya Cohen');
    const other = schema.emptyDoc();
    other.people.push(schema.newPerson({ name: 'From Backup' }));
    other.rev = 40;
    const seen = [];
    store.subscribe(function (state, info) { seen.push(info.type); });
    const r = store.replace(other, { label: 'Backup loaded' });
    eq([r.ok, r.saved, r.rev], [true, true, 41]);
    eq(seen, ['replace']);
    eq(store.get().people[0].name, 'From Backup');
    eq(store.flags().canUndo, null);
    eq(onDisk(s.adapter).rev, 41);
    other.rev = 3;
    eq(store.replace(other).rev, 42);
    eq(other.rev, 3, 'the document given is not changed');
    const bad = schema.emptyDoc();
    bad.people.push({ id: 5 });
    eq(store.replace(bad).reason, 'invalid');
    eq(store.get().rev, 42);
  });

  test('store.erase: removes the stored data and stops further saves', function () {
    const s = start();
    addPerson('Dana Levi');
    s.adapter.savePrev('{}');
    s.adapter.ui.set({ draft: { sheet: 'client' } });
    const seen = [];
    store.subscribe(function (state, info) { seen.push(info.type); });
    eq(store.erase(), { ok: true });
    eq(s.adapter.mem, { doc: null, rev: null, prev: null, ui: {} });
    eq(store.flags().blocked.reason, 'erased');
    eq(seen, ['flags']);
    eq(addPerson('x').reason, 'blocked');
    eq(s.adapter.mem.doc, null);
    eq(store.init({ adapter: s.adapter }).firstRun, true, 'the next start is a first run');
  });

  // ---- drafts ----------------------------------------------------------------------------

  test('store.drafts: a half-typed form is kept and found again', function () {
    const s = start();
    eq(store.drafts.current(), null);
    ok(store.drafts.save('client', null, { name: 'Dan', phone: '054', email: '', since: 'today' }));
    const d = store.drafts.current();
    eq([d.sheet, d.id, d.values.name], ['client', null, 'Dan']);
    ok(dates.isStamp(d.at));
    eq(store.drafts.find('client', null).values.phone, '054');
    eq(store.drafts.find('client', undefined).values.phone, '054');
    eq(store.drafts.find('client', 'some-id'), null, 'another record');
    eq(store.drafts.find('lead', null), null, 'another sheet');
    eq(s.adapter.mem.rev, 0, 'a draft never changes the revision');
    eq(s.adapter.writes, 1, 'and is not a save of the document');
  });

  test('store.drafts: survives a reload of the page (a new init on the same storage)', function () {
    const s = start();
    store.drafts.save('client', 'abc', { name: 'Dana Lev' });
    store.init({ adapter: s.adapter });
    eq(store.drafts.find('client', 'abc').values, { name: 'Dana Lev' });
  });

  test('store.drafts: a newer draft replaces the older; discard removes it', function () {
    start();
    store.drafts.save('client', null, { name: 'D' });
    store.drafts.save('client', null, { name: 'Da' });
    eq(store.drafts.current().values.name, 'Da');
    store.drafts.discard();
    eq(store.drafts.current(), null);
    eq(store.drafts.find('client', null), null);
  });

  test('store.drafts: restored within 24 hours, gone after', function () {
    const s = start();
    withClock(new Date(2026, 10, 18, 9, 0), function () {
      store.drafts.save('client', null, { name: 'Dan' });
    });
    withClock(new Date(2026, 10, 19, 8, 59), function () {
      eq(store.drafts.find('client', null).values.name, 'Dan');
    });
    withClock(new Date(2026, 10, 19, 9, 1), function () {
      eq(store.drafts.find('client', null), null);
      eq(s.adapter.mem.ui, {}, 'the expired draft is removed');
    });
  });

  test('store.drafts: a stored draft that is not a draft is ignored', function () {
    const s = start();
    s.adapter.mem.ui = { draft: 'oops' };
    eq(store.drafts.current(), null);
    s.adapter.mem.ui = { draft: { sheet: 'client', id: null, values: { name: 'x' }, at: 'yesterday' } };
    eq(store.drafts.current(), null);
  });

  test('store: while the data cannot be opened, nothing can be saved', function () {
    const adapter = memoryAdapter();
    adapter.mem.doc = 'not a document';
    store.init({ adapter: adapter });
    eq(store.commit('x', function () {}).reason, 'blocked');
    eq(store.undo().reason, 'nothingToUndo');
    eq(store.retrySave().reason, 'blocked');
    eq(adapter.writes, 0);
  });
})(window.Laser);

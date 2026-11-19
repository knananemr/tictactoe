// tests/unit/backup.test.js
// Every test gives store.init an in-memory adapter: nothing is written to the browser's storage.
(function (L) {
  'use strict';
  const backup = L.core.backup;
  const store = L.core.store;
  const schema = L.core.schema;
  const dates = L.core.dates;
  const util = L.core.util;

  const AT = new Date(2026, 10, 18, 10, 0);
  const STAMP = '2026-11-18T08:12:44.000Z';
  const LAST_WEEK = dates.stamp(new Date(dates.now().getTime() - 7 * 86400000));

  function x(n) { return new Array(n + 1).join('x'); }

  // A document with a bit of everything, including the three fields that describe the device.
  function practice() {
    const doc = schema.emptyDoc(AT);
    doc.rev = 12;
    doc.settings.currency = 'ILS';
    doc.settings.countryCode = '972';
    doc.settings.whatsappOnComputer = 'app';
    doc.meta.welcomeDone = true;
    doc.meta.changesSinceExport = 5;
    doc.meta.unsavedSince = STAMP;
    doc.meta.homeDevice = 'laptop';
    doc.meta.reopenedAt = STAMP;
    doc.meta.persist = { askedAt: STAMP, granted: false };
    const dana = schema.newPerson({ name: 'Dana Levi', phone: '054-123 4567', email: 'dana@gmail', notes: 'Line 1\nLine 2 "quoted"' }, { now: AT });
    const hebrew = schema.newPerson({ name: 'דנה לוי', clientSince: '2024-03-01' }, { now: AT });
    const markup = schema.newPerson({ name: '<img src=x onerror=alert(1)>' }, { now: AT });
    const lead = schema.newPerson({ name: 'Noa Bar', leadInterest: 'legs' }, { now: AT, lead: true });
    const gone = schema.newPerson({ name: 'Deleted Last Week' }, { now: AT });
    gone.deletedAt = LAST_WEEK;   // recent, whenever the tests are run, so it is not purged on load
    const done = schema.newAppointment({ personId: dana.id, date: '2026-11-10', status: 'done', areas: ['fullLegs'] }, { now: AT });
    const booked = schema.newAppointment({ personId: dana.id, date: '2026-12-08', time: '14:00' }, { now: AT });
    const paid = schema.newPayment({ personId: dana.id, appointmentId: done.id, paidOn: '2026-11-10', amountMinor: 25000 }, { now: AT });
    doc.people.push(dana, hebrew, markup, lead, gone);
    doc.appointments.push(done, booked);
    doc.payments.push(paid);
    return doc;
  }

  // Starts the store on an in-memory adapter holding `doc` (or on a first run).
  function open(doc) {
    const adapter = doc ? memoryAdapter({ doc: JSON.stringify(doc), rev: doc.rev }) : memoryAdapter();
    store.init({ adapter: adapter });
    return adapter;
  }

  function fileOf(doc) { return backup.buildFile(doc, AT).text; }

  // ---- export ----------------------------------------------------------------------------

  test('backup.fileName: laser-backup-YYYY-MM-DD-HHMM.json in local time', function () {
    eq(backup.fileName(new Date(2026, 10, 18, 9, 5)), 'laser-backup-2026-11-18-0905.json');
    eq(backup.fileName(new Date(2026, 11, 31, 23, 59)), 'laser-backup-2026-12-31-2359.json');
    eq(backup.fileName(new Date(2027, 0, 1, 0, 0)), 'laser-backup-2027-01-01-0000.json');
    ok(/^laser-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/.test(backup.fileName()));
  });

  test('backup.buildFile: the document as stored plus exportedAt and appVersion, readable', function () {
    const doc = practice();
    const before = JSON.stringify(doc);
    const file = backup.buildFile(doc, AT);
    eq(file.name, 'laser-backup-2026-11-18-1000.json');
    eq(file.type, 'application/json');
    ok(file.text.indexOf('{\n  "app": "laser-practice",\n  "schemaVersion": 1,') === 0, 'indented with two spaces');
    ok(file.text.indexOf('"currencyDecimals": 2') !== -1);
    const parsed = JSON.parse(file.text);
    eq(parsed.exportedAt, dates.stamp(AT));
    eq(parsed.appVersion, L.VERSION);
    delete parsed.exportedAt;
    delete parsed.appVersion;
    eq(parsed, doc);
    eq(JSON.stringify(doc), before, 'building the file changes nothing');
    ok(parsed.people.some(function (p) { return p.deletedAt !== null; }), 'deleted records stay in the file');
  });

  test('backup.rawFile: the stored text, unchanged', function () {
    const raw = '{"app":"laser-practice","schemaVersion":2,"people":[{"fullName":"Dana"}]}';
    const file = backup.rawFile(raw, AT);
    eq(file.text, raw);
    eq(file.name, 'laser-backup-2026-11-18-1000.json');
    eq(file.type, 'application/json');
  });

  // ---- the round trip (2.7) --------------------------------------------------------------

  test('backup: export then import gives an identical document, apart from the three device fields', function () {
    const original = practice();
    open(original);
    eq(store.get(), original, 'loading changed nothing');
    const prepared = backup.prepareImport(fileOf(store.get()));
    eq(prepared.ok, true);
    eq(prepared.repairs, [], 'a file written by this app needs no repair');
    const expected = util.clone(original);
    expected.meta.homeDevice = null;
    expected.meta.reopenedAt = null;
    expected.meta.persist = null;
    eq(prepared.doc, expected);
    eq(prepared.exportedAt, dates.stamp(AT));
    eq(prepared.savedOn, '2026-11-18');
    eq(prepared.appVersion, L.VERSION);
    eq(prepared.counts, { people: 4, clients: 3, leads: 1, appointments: 2, treatments: 1, payments: 1 });
    eq(prepared.currentCounts, prepared.counts);
  });

  test('backup: the round trip through applyImport on an empty browser', function () {
    const original = practice();
    const text = fileOf(original);
    const adapter = open(null);   // a first run somewhere else
    const prepared = backup.prepareImport(text);
    eq(prepared.currentCounts, { people: 0, clients: 0, leads: 0, appointments: 0, treatments: 0, payments: 0 });
    const result = backup.applyImport(prepared);
    eq([result.ok, result.saved, result.reason, result.prevKept], [true, true, null, true]);
    const loaded = store.get();
    eq(loaded.rev, 13, 'max(current 0, imported 12) + 1');
    eq(result.rev, 13);
    eq(loaded.meta.unsavedSince, null);
    ok(dates.isStamp(loaded.meta.backupCheckedAt), 'loading a backup proves it can be read');
    eq([loaded.meta.homeDevice, loaded.meta.reopenedAt, loaded.meta.persist], [null, null, null]);
    const expected = util.clone(original);
    expected.rev = 13;
    expected.meta.unsavedSince = null;
    expected.meta.backupCheckedAt = loaded.meta.backupCheckedAt;
    expected.meta.changesSinceExport = 0;           // the file holds exactly this data (V02)
    expected.meta.lastExportAt = dates.stamp(AT);   // the file's own exportedAt
    expected.meta.homeDevice = null;
    expected.meta.reopenedAt = null;
    expected.meta.persist = null;
    eq(loaded, expected, 'everything else is identical');
    eq(JSON.parse(adapter.mem.doc), loaded, 'and it is on disk');
    eq(adapter.mem.rev, 13);

    // and again: what was loaded exports and imports with no error and no repair
    const again = backup.prepareImport(backup.buildFile(store.get()).text);
    eq([again.ok, again.repairs.length], [true, 0]);
  });

  // ---- soft faults (3.7) -----------------------------------------------------------------

  test('backup.prepareImport: a file with a soft fault is repaired and the repair is reported', function () {
    open(null);
    const doc = practice();
    doc.people[0].notes = x(2500);
    doc.people[1].email = 'maya@';
    doc.people[1].name = 'Maya Cohen';
    const prepared = backup.prepareImport(fileOf(doc));
    eq(prepared.ok, true);
    eq(prepared.repairs, [
      'Dana Levi: note shortened to 2,000 characters',
      "Maya Cohen: email 'maya@' removed"
    ]);
    eq(prepared.doc.people[0].notes.length, 2000);
    eq(prepared.doc.people[1].email, '');
    eq(schema.validate(prepared.doc), []);
    eq(backup.applyImport(prepared).ok, true);
    eq(store.get().people[0].notes.length, 2000);
  });

  test('backup.prepareImport: a file from before a field existed loads with the defaults', function () {
    open(null);
    const old = JSON.stringify({
      app: 'laser-practice', schemaVersion: 1, rev: 3, createdAt: STAMP, exportedAt: STAMP,
      settings: { currency: 'ILS', currencyDecimals: 2, countryCode: '972' },
      people: [{ id: 'p1', name: 'Dana Levi', phone: '054-123 4567', clientSince: '2026-11-01', createdAt: STAMP, updatedAt: STAMP, deletedAt: null }]
    });
    const prepared = backup.prepareImport(old);
    eq([prepared.ok, prepared.repairs.length], [true, 0]);
    eq(prepared.doc.people[0].hairColor, null);
    eq(prepared.doc.settings.rebookWeeks, 4);
    eq(prepared.doc.appointments, []);
    eq(prepared.counts.clients, 1);
  });

  test('backup.prepareImport: accepts a file that starts with a byte order mark', function () {
    open(null);
    eq(backup.prepareImport('﻿' + fileOf(practice())).ok, true);
  });

  // ---- refusals (acceptance 14) ----------------------------------------------------------

  function refuses(text, code) {
    const adapter = open(practice());
    const before = store.get();
    const disk = adapter.mem.doc;
    const result = backup.prepareImport(text);
    eq(result.ok, false);
    eq(result.code, code);
    ok(typeof result.message === 'string' && result.message.length > 10, 'a clear message');
    ok(store.get() === before, 'the state is untouched');
    eq(adapter.mem.doc, disk, 'storage is untouched');
    eq(adapter.mem.prev, null);
    eq(backup.applyImport(result).ok, false, 'a refused file cannot be applied');
    ok(store.get() === before);
    return result;
  }

  test('backup.prepareImport: refuses a text file that is not JSON', function () {
    refuses('Dear Dana, see you on Thursday.', 'notJson');
    refuses('', 'notJson');
    refuses('{"app": "laser-practice", ', 'notJson');
  });

  test('backup.prepareImport: refuses a JSON file from another app', function () {
    refuses(JSON.stringify({ app: 'tictactoe', schemaVersion: 1, board: [] }), 'otherApp');
    refuses(JSON.stringify({ people: [] }), 'otherApp');
    refuses(JSON.stringify([1, 2, 3]), 'otherApp');
    refuses('null', 'otherApp');
    refuses('"text"', 'otherApp');
  });

  test('backup.prepareImport: refuses a backup from a newer version of the app', function () {
    const doc = practice();
    doc.schemaVersion = 2;
    const result = refuses(JSON.stringify(doc), 'newer');
    eq(result.message, 'This backup comes from a newer version of the app.');
  });

  test('backup.prepareImport: refuses a schemaVersion that is not a whole number from 1', function () {
    const doc = practice();
    doc.schemaVersion = '1';
    refuses(JSON.stringify(doc), 'badVersion');
    doc.schemaVersion = 0;
    refuses(JSON.stringify(doc), 'badVersion');
    delete doc.schemaVersion;
    refuses(JSON.stringify(doc), 'badVersion');
  });

  test('backup.prepareImport: refuses a backup in which a phone is a number', function () {
    const doc = practice();
    doc.people[0].phone = 541234567;
    const result = refuses(JSON.stringify(doc), 'invalid');
    eq(result.errors, ['Dana Levi, phone: Must be text']);
    eq(result.errorCount, 1);
  });

  test('backup.prepareImport: refuses a backup with two people sharing one id', function () {
    const doc = practice();
    doc.people[1].id = doc.people[0].id;
    const result = refuses(JSON.stringify(doc), 'invalid');
    eq(result.errors, ['דנה לוי, id: Two records share this id']);
  });

  test('backup.prepareImport: refuses the other structural faults of 3.7', function () {
    let doc = practice(); doc.people = 'none';
    refuses(JSON.stringify(doc), 'invalid');
    doc = practice(); doc.people[3].name = '';
    eq(refuses(JSON.stringify(doc), 'invalid').errors[0], 'Person 4, name: Enter a name');
    doc = practice(); doc.payments[0].amountMinor = 250.5;
    refuses(JSON.stringify(doc), 'invalid');
    doc = practice(); doc.appointments[1].date = '8 December';
    refuses(JSON.stringify(doc), 'invalid');
    doc = practice(); doc.appointments[1].time = '2pm';
    refuses(JSON.stringify(doc), 'invalid');
    doc = practice(); doc.appointments[0].personId = 'nobody';
    refuses(JSON.stringify(doc), 'invalid');
    doc = practice(); doc.payments[0].appointmentId = 'nothing';
    refuses(JSON.stringify(doc), 'invalid');
    doc = practice();
    doc.payments.push(schema.newPayment({ personId: doc.people[0].id, appointmentId: doc.appointments[0].id, paidOn: '2026-11-10', amountMinor: 100 }, { now: AT }));
    refuses(JSON.stringify(doc), 'invalid');
  });

  test('backup.prepareImport: shows the first five faults and says how many there are', function () {
    const doc = practice();
    for (let i = 0; i < 9; i++) doc.people.push({ id: 'broken-' + i, name: 5, createdAt: STAMP, updatedAt: STAMP });
    const result = refuses(JSON.stringify(doc), 'invalid');
    eq(result.errors.length, 5);
    eq(result.errorCount, 9);
  });

  // ---- applying and undoing an import ----------------------------------------------------

  test('backup.applyImport: keeps the old data as the one fallback copy and replaces the state', function () {
    const mine = schema.emptyDoc(AT);
    mine.rev = 50;
    mine.people.push(schema.newPerson({ name: 'Already Here' }, { now: AT }));
    const adapter = open(mine);
    const seen = [];
    store.subscribe(function (state, info) { seen.push(info.type); });
    eq(backup.canUndoImport(), false);

    const result = backup.applyImport(backup.prepareImport(fileOf(practice())));
    eq([result.ok, result.saved, result.prevKept], [true, true, true]);
    eq(seen, ['replace']);
    eq(store.get().rev, 51, 'max(current 50, imported 12) + 1');
    eq(store.get().people.length, 5);
    eq(JSON.parse(adapter.mem.prev), mine, 'the fallback copy is the data from before');
    eq(backup.canUndoImport(), true);
    eq(store.flags().canUndo, null, 'an import is not undone by the Undo toast');
  });

  test('backup.undoImport: brings the old data back', function () {
    const mine = schema.emptyDoc(AT);
    mine.rev = 50;
    mine.people.push(schema.newPerson({ name: 'Already Here' }, { now: AT }));
    mine.meta.unsavedSince = STAMP;
    const adapter = open(mine);
    backup.applyImport(backup.prepareImport(fileOf(practice())));
    const result = backup.undoImport();
    eq([result.ok, result.saved, result.rev], [true, true, 52]);
    const expected = util.clone(mine);
    expected.rev = 52;
    eq(store.get(), expected, 'exactly the old data, with the revision still counting up');
    eq(JSON.parse(adapter.mem.doc), expected);
    eq(JSON.parse(adapter.mem.prev).people.length, 5, 'the replaced data is kept, so the undo can be taken back');
    eq(backup.canUndoImport(), true);
  });

  test('backup.undoImport: can itself be taken back; nothing is lost either way (D01)', function () {
    const mine = schema.emptyDoc(AT);
    mine.rev = 50;
    const adapter = open(mine);
    backup.applyImport(backup.prepareImport(fileOf(practice())));
    store.commit('Add', function (draft) { draft.people.push(schema.newPerson({ name: 'Added Later' }, { now: AT })); });
    const info = backup.undoInfo();
    eq([info.kept.clients, info.current.clients], [0, 4], 'the question can say what comes back and what goes');
    eq(backup.undoImport().ok, true);
    eq(store.get().people.length, 0);
    ok(JSON.parse(adapter.mem.prev).people.some(function (p) { return p.name === 'Added Later'; }), 'the replaced data is kept');
    eq(backup.undoInfo().kept.clients, 4);
    eq(backup.undoImport().ok, true);
    eq(store.get().people.length, 6, 'undoing the undo brings everything back, including what was added later');
    eq(store.get().people.filter(function (p) { return p.name === 'Added Later'; }).length, 1);
  });

  test('backup.undoInfo: null when no copy is kept', function () {
    open(practice());
    eq(backup.undoInfo(), null);
  });

  test('backup.applyImport: when the copy is too large, no older copy is left behind (D02)', function () {
    const adapter = open(practice());
    adapter.mem.prev = JSON.stringify(schema.emptyDoc(AT));   // a copy from an earlier import
    adapter.savePrev = function () { return { ok: false, reason: 'tooLarge' }; };
    const result = backup.applyImport(backup.prepareImport(fileOf(practice())));
    eq([result.ok, result.saved, result.prevKept], [true, true, false]);
    eq(adapter.mem.prev, null, 'an older copy would bring back the wrong data');
    eq(backup.canUndoImport(), false);
  });

  test('backup.applyImport: when the copy cannot be written, nothing is loaded (D02)', function () {
    const mine = schema.emptyDoc(AT);
    mine.rev = 50;
    mine.people.push(schema.newPerson({ name: 'Already Here' }, { now: AT }));
    const adapter = open(mine);
    adapter.savePrev = function () { return { ok: false, reason: 'failed' }; };
    const before = store.get();
    const result = backup.applyImport(backup.prepareImport(fileOf(practice())));
    eq([result.ok, result.saved, result.reason, result.prevKept], [false, false, 'prevFailed', false]);
    ok(store.get() === before);
    eq(JSON.parse(adapter.mem.doc), mine, 'the stored data is unchanged');
  });

  // ---- what a loaded backup says about the last backup (V02) -------------------------------

  test('backup.applyImport: the loaded file counts as the last backup, with 0 changes since', function () {
    open(null);
    const original = practice();
    const sixDaysAgo = new Date(dates.now().getTime() - 6 * 86400000);
    const result = backup.applyImport(backup.prepareImport(backup.buildFile(original, sixDaysAgo).text));
    eq(result.ok, true);
    eq(store.get().meta.lastExportAt, dates.stamp(sixDaysAgo));
    eq(store.get().meta.changesSinceExport, 0);
    eq(schema.validate(store.get()), []);
  });

  test('backup.applyImport: a later lastExportAt in the file is kept', function () {
    open(null);
    const original = practice();
    const later = dates.stamp(new Date(dates.now().getTime() - 86400000));
    original.meta.lastExportAt = later;
    const fileTime = new Date(dates.now().getTime() - 3 * 86400000);
    backup.applyImport(backup.prepareImport(backup.buildFile(original, fileTime).text));
    eq(store.get().meta.lastExportAt, later);
  });

  test('backup.applyImport: a file stamped in the future counts as saved now, not later', function () {
    open(null);
    const nextYear = new Date(dates.now().getTime() + 365 * 86400000);
    const before = dates.now().getTime();
    backup.applyImport(backup.prepareImport(backup.buildFile(practice(), nextYear).text));
    const ms = dates.stampMs(store.get().meta.lastExportAt);
    ok(ms >= before && ms <= dates.now().getTime(), 'cut to now');
  });

  test('backup.applyImport: a file with no exportedAt leaves lastExportAt alone', function () {
    open(null);
    const original = practice();
    backup.applyImport(backup.prepareImport(JSON.stringify(original)));
    eq(store.get().meta.lastExportAt, null);
    eq(store.get().meta.changesSinceExport, 0);
  });

  test('backup.prepareImport: refuses a revision too large to count up from (D03)', function () {
    [9007199254740991, 1e21].forEach(function (rev) {
      const doc = practice();
      doc.rev = rev;
      const result = backup.prepareImport(fileOf(doc));
      eq([result.ok, result.code], [false, 'invalid'], String(rev));
    });
  });

  test('backup.applyImport: refused while the tab cannot save; nothing changes', function () {
    const adapter = open(practice());
    const prepared = backup.prepareImport(fileOf(practice()));
    adapter.failWrites = true;
    store.commit('Edit', function (draft) { draft.people[0].phone = '1'; });
    adapter.failWrites = false;
    const before = store.get();
    const result = backup.applyImport(prepared);
    eq([result.ok, result.saved, result.reason, result.prevKept], [false, false, 'saveFailed', false]);
    ok(store.get() === before);
    eq(adapter.mem.prev, null);
    eq(backup.undoImport().reason, 'nothingToUndo');
  });

  test('backup.applyImport: only takes what prepareImport returned', function () {
    open(practice());
    eq(backup.applyImport(null).ok, false);
    eq(backup.applyImport({}).reason, 'invalid');
    eq(backup.applyImport({ ok: false, message: 'x' }).ok, false);
  });

  // ---- checking a backup file (3.6) ------------------------------------------------------

  test('backup.checkFile: reads a file as import would, compares counts, changes nothing', function () {
    const adapter = open(practice());
    const text = backup.buildFile(store.get(), new Date(dates.now().getTime() - 60000)).text;
    const before = store.get();
    const writes = adapter.writes;
    const result = backup.checkFile(text);
    eq(result.ok, true);
    eq(result.counts, { people: 4, clients: 3, leads: 1, appointments: 2, treatments: 1, payments: 1 });
    eq(result.currentCounts, result.counts);
    eq(result.sameCounts, true);
    eq(result.savedDaysAgo, dates.diffDays(result.savedOn, dates.today()));
    ok(result.savedDaysAgo === 0 || result.savedDaysAgo === 1);
    eq(result.repairs, []);
    ok(store.get() === before, 'the state is untouched');
    eq(adapter.writes, writes, 'nothing was written');
    eq(store.get().meta.backupCheckedAt, null, 'checkFile itself marks nothing');
    eq(adapter.mem.prev, null);
  });

  test('backup.checkFile: an older backup is still good, with different counts', function () {
    open(practice());
    const older = practice();
    older.people.pop(); older.people.pop();   // the deleted person and the lead
    const result = backup.checkFile(backup.buildFile(older, new Date(2026, 10, 15, 9, 0)).text, new Date(2026, 10, 18, 9, 0));
    eq([result.ok, result.sameCounts, result.savedDaysAgo, result.savedOn], [true, false, 3, '2026-11-15']);
    eq(result.counts.leads, 0);
    eq(result.currentCounts.leads, 1);
  });

  test('backup.checkFile: a file that import would refuse is not good', function () {
    open(practice());
    const bad = backup.checkFile('not a backup');
    eq([bad.ok, bad.code], [false, 'notJson']);
    const doc = practice();
    doc.people[0].phone = 5;
    eq(backup.checkFile(JSON.stringify(doc)).code, 'invalid');
  });

  test('backup.markChecked: records the check without counting as a change', function () {
    const adapter = open(practice());
    const r = backup.markChecked();
    eq([r.ok, r.saved], [true, true]);
    const meta = store.get().meta;
    ok(dates.isStamp(meta.backupCheckedAt));
    eq(meta.changesSinceExport, 5);
    eq(meta.unsavedSince, STAMP);
    eq(JSON.parse(adapter.mem.doc).meta.backupCheckedAt, meta.backupCheckedAt);
  });

  test('backup.markSaved: a backup that counts resets the nudge', function () {
    open(practice());
    eq(L.core.selectors.backupStatus(store.get(), new Date(2027, 0, 18)).level, 'urgent');
    const r = backup.markSaved();
    eq([r.ok, r.saved], [true, true]);
    const meta = store.get().meta;
    ok(dates.isStamp(meta.lastExportAt));
    eq(meta.changesSinceExport, 0);
    eq(meta.unsavedSince, null);
    eq(store.get().rev, 13);
    const status = L.core.selectors.backupStatus(store.get());
    eq([status.level, status.homeLine], ['quiet', 'Backed up today']);
    store.commit('Client added', function (draft) { draft.people.push(schema.newPerson({ name: 'New' })); });
    eq(store.get().meta.changesSinceExport, 1);
    ok(store.get().meta.unsavedSince !== null);
  });

  test('backup.markSaved: while saving fails the backup cannot be recorded, so the nudge stays', function () {
    const adapter = open(practice());
    adapter.failWrites = true;
    store.commit('Edit', function (draft) { draft.people[0].phone = '2'; });
    const file = backup.buildFile(store.get());
    eq(JSON.parse(file.text).people[0].phone, '2', '"Back up now" still produces a file');
    eq(backup.markSaved().reason, 'saveFailed');
    eq(store.get().meta.lastExportAt, null);
  });
})(window.Laser);

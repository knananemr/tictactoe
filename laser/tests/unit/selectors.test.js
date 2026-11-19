// tests/unit/selectors.test.js
(function (L) {
  'use strict';
  const selectors = L.core.selectors;
  const schema = L.core.schema;
  const dates = L.core.dates;

  const AT = new Date(2026, 10, 18, 10, 0);

  function doc() {
    const d = schema.emptyDoc(AT);
    const dana = schema.newPerson({ name: 'Dana Levi', phone: '054-123 4567', email: 'Dana.Levi@Gmail.com' }, { now: AT });
    const maya = schema.newPerson({ name: 'maya cohen', phone: '+44 7700 900123' }, { now: AT });
    const avi = schema.newPerson({ name: 'Avi Bar', email: 'avi@example.org' }, { now: AT });
    const hebrew = schema.newPerson({ name: 'דנה לוי', phone: '052-7654321' }, { now: AT });
    const lead = schema.newPerson({ name: 'Noa Lead', phone: '050-0000000' }, { now: AT, lead: true });
    const gone = schema.newPerson({ name: 'Deleted Client' }, { now: AT });
    gone.deletedAt = dates.stamp(AT);
    d.people.push(dana, maya, avi, hebrew, lead, gone);
    return d;
  }

  function names(list) { return list.map(function (p) { return p.name; }); }

  test('selectors.clients: live clients only, sorted by name without regard to case', function () {
    const d = doc();
    const before = JSON.stringify(d);
    eq(names(selectors.clients(d)), ['Avi Bar', 'Dana Levi', 'maya cohen', 'דנה לוי']);
    eq(JSON.stringify(d), before, 'the document is not reordered');
  });

  test('selectors.isClient / isLead: a person is a client when clientSince has a date', function () {
    const d = doc();
    ok(selectors.isClient(d.people[0]));
    ok(!selectors.isLead(d.people[0]));
    ok(selectors.isLead(d.people[4]));
    ok(!selectors.isClient(d.people[4]));
  });

  test('selectors.person: finds a live person by id', function () {
    const d = doc();
    eq(selectors.person(d, d.people[1].id).name, 'maya cohen');
    eq(selectors.person(d, d.people[5].id), null, 'a deleted person is invisible');
    eq(selectors.person(d, 'no-such-id'), null);
  });

  test('selectors.search: part of the name, any case (acceptance 8: "dan")', function () {
    const list = selectors.clients(doc());
    eq(names(selectors.search(list, 'dan')), ['Dana Levi']);
    eq(names(selectors.search(list, 'DAN')), ['Dana Levi']);
    eq(names(selectors.search(list, ' levi ')), ['Dana Levi']);
    eq(names(selectors.search(list, 'COHEN')), ['maya cohen']);
    eq(names(selectors.search(list, 'לוי')), ['דנה לוי']);
  });

  test('selectors.search: 3 or more digits are looked up in the phone (acceptance 8: "4567")', function () {
    const list = selectors.clients(doc());
    eq(names(selectors.search(list, '4567')), ['Dana Levi']);
    eq(names(selectors.search(list, '054 123')), ['Dana Levi']);
    eq(names(selectors.search(list, '7700-900')), ['maya cohen']);
    eq(names(selectors.search(list, '765')), ['דנה לוי']);
    eq(names(selectors.search(list, '45')), [], 'two digits are not enough');
    eq(names(selectors.search(list, '99999')), []);
  });

  test('selectors.search: part of the email', function () {
    const list = selectors.clients(doc());
    eq(names(selectors.search(list, 'gmail')), ['Dana Levi']);
    eq(names(selectors.search(list, 'avi@ex')), ['Avi Bar']);
    eq(names(selectors.search(list, '.org')), ['Avi Bar']);
  });

  test('selectors.search: nothing matches "zzz"; an empty search shows everyone', function () {
    const list = selectors.clients(doc());
    eq(selectors.search(list, 'zzz'), []);
    eq(names(selectors.search(list, '')), names(list));
    eq(names(selectors.search(list, '   ')), names(list));
    eq(names(selectors.search(list, null)), names(list));
    ok(selectors.search(list, '') !== list, 'a new array');
  });

  test('selectors.counts: live records by kind', function () {
    const d = doc();
    eq(selectors.counts(d), { people: 5, clients: 4, leads: 1, appointments: 0, treatments: 0, payments: 0 });
    const id = d.people[0].id;
    const done = schema.newAppointment({ personId: id, date: '2026-11-10', status: 'done' }, { now: AT });
    const booked = schema.newAppointment({ personId: id, date: '2026-12-08', time: '14:00' }, { now: AT });
    const removed = schema.newAppointment({ personId: id, date: '2026-11-01', status: 'done' }, { now: AT });
    removed.deletedAt = dates.stamp(AT);
    d.appointments.push(done, booked, removed);
    d.payments.push(schema.newPayment({ personId: id, appointmentId: done.id, paidOn: '2026-11-10', amountMinor: 25000 }, { now: AT }));
    eq(selectors.counts(d), { people: 5, clients: 4, leads: 1, appointments: 2, treatments: 1, payments: 1 });
    eq(selectors.counts(schema.emptyDoc(AT)), { people: 0, clients: 0, leads: 0, appointments: 0, treatments: 0, payments: 0 });
  });

  // ---- backup status (3.8) ---------------------------------------------------------------

  function daysLater(n, hours) { return new Date(2026, 10, 18 + n, 10 + (hours || 0), 0); }

  test('selectors.backupStatus: quiet with no records, whatever the dates say', function () {
    const d = schema.emptyDoc(AT);
    d.meta.unsavedSince = dates.stamp(AT);
    const s = selectors.backupStatus(d, daysLater(60));
    eq([s.level, s.tone, s.banner, s.days], ['quiet', null, null, 0]);
    eq(s.homeLine, 'No backup yet');
    eq(s.sidebarLine, 'No backup yet');
    eq(s.settingsLine, 'No backup yet');
    eq([s.lastBackupDays, s.minutesSinceBackup, s.backedUpToday, s.checked], [null, null, false, false]);
  });

  test('selectors.backupStatus: quiet while unsavedSince is null', function () {
    const d = doc();
    const s = selectors.backupStatus(d, daysLater(60));
    eq([s.level, s.banner], ['quiet', null]);
  });

  test('selectors.backupStatus: quiet for the first 6 days of unsaved changes', function () {
    const d = doc();
    d.meta.unsavedSince = dates.stamp(AT);
    eq(selectors.backupStatus(d, AT).level, 'quiet');
    const s = selectors.backupStatus(d, daysLater(6, 23));
    eq([s.level, s.days, s.banner], ['quiet', 6, null]);
  });

  test('selectors.backupStatus: yellow from 7 days (acceptance 20: 8 days)', function () {
    const d = doc();
    d.meta.unsavedSince = dates.stamp(AT);
    const at7 = selectors.backupStatus(d, daysLater(7, 1));
    eq([at7.level, at7.tone, at7.days], ['important', 'important', 7]);
    eq(at7.banner, 'You have changes from the last 7 days that are not in a backup file.');
    const at8 = selectors.backupStatus(d, daysLater(8, 1));
    eq(at8.level, 'important');
    eq(at8.banner, 'You have changes from the last 8 days that are not in a backup file.');
    eq(selectors.backupStatus(d, daysLater(29, 1)).level, 'important');
  });

  test('selectors.backupStatus: red from 30 days (acceptance 20: 31 days)', function () {
    const d = doc();
    d.meta.unsavedSince = dates.stamp(AT);
    eq(selectors.backupStatus(d, daysLater(30, 1)).level, 'urgent');
    const s = selectors.backupStatus(d, daysLater(31, 1));
    eq([s.level, s.tone, s.days], ['urgent', 'urgent', 31]);
    eq(s.banner, "No backup for 31 days. If this browser's data is cleared, those changes are gone.");
  });

  test('selectors.backupStatus: after a backup the banner is gone and the line says so', function () {
    const d = doc();
    d.meta.unsavedSince = null;
    d.meta.lastExportAt = dates.stamp(AT);
    d.meta.changesSinceExport = 0;
    const today = selectors.backupStatus(d, new Date(2026, 10, 18, 23, 0));
    eq([today.level, today.banner, today.backedUpToday, today.lastBackupDays], ['quiet', null, true, 0]);
    eq(today.homeLine, 'Backed up today');
    eq(today.sidebarLine, 'Backed up today');
    eq(today.settingsLine, 'Last backup today, 0 changes since');
    eq(today.minutesSinceBackup, 780);

    const next = selectors.backupStatus(d, new Date(2026, 10, 19, 0, 30));
    eq([next.lastBackupDays, next.backedUpToday], [1, false], 'the calendar day decides, not 24 hours');
    eq(next.homeLine, 'Last backup: 1 day ago');
    eq(next.sidebarLine, 'Backed up 1 day ago');

    d.meta.changesSinceExport = 14;
    d.meta.unsavedSince = dates.stamp(new Date(2026, 10, 19, 9, 0));
    const later = selectors.backupStatus(d, daysLater(3));
    eq(later.homeLine, 'Last backup: 3 days ago');
    eq(later.sidebarLine, 'Backed up 3 days ago');
    eq(later.settingsLine, 'Last backup 3 days ago, 14 changes since');
    eq([later.level, later.changes], ['quiet', 14]);
    d.meta.changesSinceExport = 1;
    eq(selectors.backupStatus(d, daysLater(3)).settingsLine, 'Last backup 3 days ago, 1 change since');
  });

  test('selectors.backupStatus: reads the clock through dates.now when no time is given', function () {
    const d = doc();
    d.meta.unsavedSince = dates.stamp(new Date(dates.now().getTime() - 9 * 86400000));
    eq(selectors.backupStatus(d).level, 'important');
    eq(selectors.backupStatus(d).days, 9);
  });

  // ---- getting started (3.9) -------------------------------------------------------------

  test('selectors.gettingStarted: the Welcome card stays until one of its buttons is tapped', function () {
    const d = schema.emptyDoc(AT);
    let g = selectors.gettingStarted(d);
    eq([g.showWelcome, g.showChecklist, g.showCheckBackup, g.allDone], [true, false, false, false]);
    d.meta.welcomeDone = true;
    g = selectors.gettingStarted(d);
    eq([g.showWelcome, g.showChecklist], [false, true]);
    eq(g.items.map(function (i) { return [i.key, i.label, i.done, i.note]; }), [
      ['client', 'Add your first client.', false, null],
      ['backup', 'Save your first backup file and check it.', false, null]
    ]);
  });

  test('selectors.gettingStarted: the two items tick themselves from the data', function () {
    const d = schema.emptyDoc(AT);
    d.meta.welcomeDone = true;
    d.people.push(schema.newPerson({ name: 'Dana Levi' }, { now: AT }));
    let g = selectors.gettingStarted(d);
    eq(g.items[0].done, true);
    eq(g.items[1].done, false);

    d.meta.lastExportAt = dates.stamp(AT);
    g = selectors.gettingStarted(d);
    eq([g.items[1].done, g.items[1].note, g.showCheckBackup], [false, 'Saved, not checked yet', true]);

    d.meta.backupCheckedAt = dates.stamp(AT);
    g = selectors.gettingStarted(d);
    eq([g.items[1].done, g.items[1].note, g.showCheckBackup], [true, null, false]);
    eq([g.allDone, g.showChecklist], [true, false]);

    d.people[0].deletedAt = dates.stamp(AT);
    eq(selectors.gettingStarted(d).items[0].done, false, 'a deleted person does not count');
  });
})(window.Laser);

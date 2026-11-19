// tests/unit/schema.test.js
(function (L) {
  'use strict';
  const schema = L.core.schema;
  const dates = L.core.dates;
  const check = schema.check;

  const AT = new Date(2026, 10, 18, 10, 0);
  const STAMP = '2026-11-18T08:12:44.000Z';

  function x(n) { return new Array(n + 1).join('x'); }

  // A small valid document: two clients, one lead, two appointments, two payments.
  //   people[0] Dana (client), people[1] Maya (client), people[2] Noa (lead)
  //   appointments[0] Dana, done, no time, with a linked payment
  //   appointments[1] Dana, booked 14:00
  //   appointments[2] Maya, done, no payment
  //   payments[0] linked to appointments[0]; payments[1] stand-alone, Maya
  function baseDoc() {
    const doc = schema.emptyDoc(AT);
    const dana = schema.newPerson({ name: 'Dana Levi', phone: '054-123 4567', email: 'dana@example.com' }, { now: AT });
    const maya = schema.newPerson({ name: 'Maya Cohen' }, { now: AT });
    const noa = schema.newPerson({ name: 'Noa Bar' }, { now: AT, lead: true });
    const done = schema.newAppointment({ personId: dana.id, date: '2026-11-10', status: 'done' }, { now: AT });
    const booked = schema.newAppointment({ personId: dana.id, date: '2026-12-08', time: '14:00' }, { now: AT });
    const mayaDone = schema.newAppointment({ personId: maya.id, date: '2026-11-11', status: 'done' }, { now: AT });
    const linked = schema.newPayment({ personId: dana.id, appointmentId: done.id, paidOn: '2026-11-10', amountMinor: 25000 }, { now: AT });
    const alone = schema.newPayment({ personId: maya.id, paidOn: '2026-11-12', amountMinor: 12000 }, { now: AT });
    doc.people.push(dana, maya, noa);
    doc.appointments.push(done, booked, mayaDone);
    doc.payments.push(linked, alone);
    return doc;
  }

  function errorsAt(doc, collection, field, index) {
    return schema.validate(doc).filter(function (e) {
      return e.collection === collection && e.field === field && (index === undefined || e.index === index);
    });
  }

  // ---- the document and its defaults -----------------------------------------------------

  test('schema.emptyDoc: the document of 3.2, valid, with all three collections', function () {
    const doc = schema.emptyDoc(AT);
    eq(Object.keys(doc), ['app', 'schemaVersion', 'rev', 'createdAt', 'meta', 'settings', 'people', 'appointments', 'payments']);
    eq(doc.app, 'laser-practice');
    eq(doc.schemaVersion, 1);
    eq(doc.rev, 0);
    ok(dates.isStamp(doc.createdAt));
    eq(doc.people, []);
    eq(doc.appointments, []);
    eq(doc.payments, []);
    eq(schema.validate(doc), []);
  });

  test('schema.emptyDoc: meta defaults of 4.7, startedOn is the local day', function () {
    eq(schema.emptyDoc(new Date(2026, 10, 18, 1, 30)).meta, {
      startedOn: '2026-11-18', welcomeDone: false, lastExportAt: null, backupCheckedAt: null,
      changesSinceExport: 0, unsavedSince: null, lastCopyOn: null, homeDevice: null,
      reopenedAt: null, persist: null
    });
  });

  test('schema.emptyDoc: every setting of 4.6 exists with its default', function () {
    const s = schema.emptyDoc(AT).settings;
    eq(s.currency, null);
    eq(s.currencyDecimals, 2);
    eq(s.countryCode, '');
    eq(s.whatsappOnComputer, 'browser');
    eq(s.usualPriceMinor, null);
    eq(s.trackBalances, false);
    eq(s.rebookWeeks, 4);
    eq(s.messageLocale, 'en-GB');
    eq(Object.keys(s.templates).sort(), ['before', 'lead', 'rebook', 'sameDay']);
    eq(s.templates.sameDay, 'Hi {name}, see you today at {time}. Shaved, clean skin please.');
    eq(s.templates.rebook, 'Hi {name}, it has been {weeks} weeks since your last session, which is the ideal time for the next one. Which day suits you?');
    eq(s.templates.lead, 'Hi {name}, thank you for your interest in laser hair removal. Would you like to book a first session? I am happy to answer any questions.');
    ok(s.templates.before.indexOf('Hi {name}, a reminder of your laser session on {date} at {time}.') === 0);
    ok(/let me know if you need another time\.$/.test(s.templates.before));
    eq(s.reminderDaysBefore, 2);
    eq(s.sameDayHoursBefore, 2);
    eq(s.currencySymbol, null);
    eq(s.quickPickWeeks, [4, 6, 8]);
    eq(s.sessionMinutes, 30);
    eq(s.rebookHeadsUpDays, 7);
    eq(s.askAgainDays, 7);
    eq(s.eveningFrom, '18:00');
    eq(s.dailyAlarmTime, '08:30');
    eq(s.dailyAlarmDays, [1, 2, 3, 4, 5, 6, 7]);
    eq(s.ownerWhatsApp, '');
    eq(s.requestPageUrl, '');
    eq(s.investPercent, 0);
    eq(Object.keys(s).length, 22);
  });

  test('schema.lists: the fixed lists of 4.2', function () {
    function values(name) { return schema.lists[name].map(function (item) { return item.value; }); }
    eq(values('hairColor'), ['black', 'darkBrown', 'lightBrown', 'blonde', 'red', 'grey']);
    eq(values('hairThickness'), ['fine', 'medium', 'coarse']);
    eq(values('areas'), ['upperLip', 'chin', 'fullFace', 'neck', 'underarms', 'arms', 'chest', 'abdomen',
      'back', 'bikini', 'brazilian', 'halfLegs', 'fullLegs', 'other']);
    eq(values('skinType'), [1, 2, 3, 4, 5, 6]);
    eq(values('clientStatus'), ['active', 'paused', 'finished']);
    eq(values('leadStatus'), ['new', 'contacted', 'notInterested']);
    eq(values('appointmentStatus'), ['booked', 'done', 'cancelled', 'noShow']);
    eq(values('slotAction'), ['sent', 'skipped']);
    eq(values('channel'), ['whatsapp', 'sms', 'email', 'copy']);
    eq(values('whatsappOnComputer'), ['browser', 'app', 'web']);
    eq(schema.label('hairColor', 'grey'), 'Grey / white');
    eq(schema.label('clientStatus', 'finished'), 'Course finished');
    eq(schema.label('skinType', 4), 'IV, olive, rarely burns');
    eq(schema.label('whatsappOnComputer', 'app'), 'WhatsApp app');
    eq(schema.label('hairColor', 'purple'), '');
  });

  // ---- record factories ------------------------------------------------------------------

  test('schema.newPerson: a client by default, with the defaults of 4.3', function () {
    const p = schema.newPerson({ name: '  Dana Levi ', phone: ' 054-123 4567 ', email: ' dana@example.com ' }, { now: AT });
    ok(/^[0-9a-f-]{36}$/.test(p.id));
    eq(p.name, 'Dana Levi');
    eq(p.phone, '054-123 4567');
    eq(p.email, 'dana@example.com');
    eq(p.clientSince, '2026-11-18');
    eq(p.clientStatus, 'active');
    eq(p.leadSince, null);
    eq(p.leadStatus, null);
    eq([p.hairColor, p.hairThickness, p.skinType, p.intervalWeeks], [null, null, null, null]);
    eq([p.notes, p.leadInterest], ['', '']);
    eq(p.areas, []);
    eq([p.priorSessions, p.priorPaidMinor, p.rebookAsks], [0, 0, 0]);
    eq([p.followUpOn, p.rebookAskedOn, p.rebookSnoozeUntil, p.rebookFor, p.deletedAt], [null, null, null, null, null]);
    ok(dates.isStamp(p.createdAt));
    eq(p.updatedAt, p.createdAt);
    eq(Object.keys(p).length, 25);
  });

  test('schema.newPerson: only a name is needed; an earlier client-since date is kept', function () {
    const p = schema.newPerson({ name: 'Maya', clientSince: '2024-03-01' }, { now: AT });
    eq(p.clientSince, '2024-03-01');
    eq(p.phone, '');
    eq(p.email, '');
    const doc = schema.emptyDoc(AT);
    doc.people.push(p);
    eq(schema.validate(doc), []);
  });

  test('schema.newPerson: a value that is undefined does not wipe a default', function () {
    const p = schema.newPerson({ name: 'Dana', phone: undefined, clientSince: undefined, notes: undefined }, { now: AT });
    eq([p.phone, p.clientSince, p.notes], ['', '2026-11-18', '']);
    const a = schema.newAppointment({ personId: 'p1', date: '2026-12-08', time: undefined, status: undefined }, { now: AT });
    eq([a.time, a.status], [null, 'booked']);
    const pay = schema.newPayment({ personId: 'p1', amountMinor: 100, note: undefined }, { now: AT });
    eq(pay.note, '');
    eq(schema.newPerson({ name: 'Maya', clientSince: null }, { now: AT }).clientSince, null, 'null is a value');
  });

  test('schema.newPerson: a lead has no client-since date, lead since today, status new', function () {
    const p = schema.newPerson({ name: 'Noa' }, { now: AT, lead: true });
    eq(p.clientSince, null);
    eq(p.leadSince, '2026-11-18');
    eq(p.leadStatus, 'new');
  });

  test('schema.newAppointment and newPayment: defaults of 4.4 and 4.5', function () {
    const a = schema.newAppointment({ personId: 'p1', date: '2026-12-08', time: '14:00' }, { now: AT });
    eq(a.status, 'booked');
    eq(a.scheduledOn, '2026-11-18');
    eq([a.areas, a.priceMinor, a.notes, a.reminderBefore, a.reminderSameDay, a.deletedAt], [[], null, '', null, null, null]);
    eq(Object.keys(a).length, 14);
    const pay = schema.newPayment({ personId: 'p1', amountMinor: 25000 }, { now: AT });
    eq(pay.paidOn, '2026-11-18');
    eq([pay.appointmentId, pay.note, pay.deletedAt], [null, '', null]);
    eq(Object.keys(pay).length, 9);
    ok(a.id !== pay.id);
  });

  test('schema.touch and markDeleted: stamp the record', function () {
    const p = schema.newPerson({ name: 'Dana' }, { now: AT });
    const later = new Date(2026, 10, 19, 9, 0);
    schema.touch(p, later);
    eq(p.updatedAt, dates.stamp(later));
    eq(p.deletedAt, null);
    schema.markDeleted(p, later);
    eq(p.deletedAt, dates.stamp(later));
  });

  // ---- validate: the faults named in 2.7 -------------------------------------------------

  test('schema.validate: the base document of these tests is valid', function () {
    eq(schema.validate(baseDoc()), []);
  });

  test('schema.validate: rejects wrong types', function () {
    let doc = baseDoc();
    doc.people[0].phone = 541234567;
    let errors = schema.validate(doc);
    eq(errors.length, 1);
    eq([errors[0].collection, errors[0].index, errors[0].field, errors[0].id], ['people', 0, 'phone', doc.people[0].id]);
    eq(errors[0].text, 'Dana Levi, phone: Must be text');

    doc = baseDoc(); doc.people = {};
    ok(errorsAt(doc, 'root', 'people').length === 1, 'a collection that is not a list');
    doc = baseDoc(); doc.appointments = 'none';
    ok(errorsAt(doc, 'root', 'appointments').length === 1);
    doc = baseDoc(); doc.people[1] = 'Maya';
    ok(errorsAt(doc, 'people', '', 1).length === 1, 'a record that is not a record');
    doc = baseDoc(); doc.people[0].name = '';
    eq(errorsAt(doc, 'people', 'name', 0)[0].message, 'Enter a name');
    doc = baseDoc(); doc.people[0].areas = 'chin';
    ok(errorsAt(doc, 'people', 'areas', 0).length === 1);
    doc = baseDoc(); doc.settings.trackBalances = 'yes';
    ok(errorsAt(doc, 'settings', 'trackBalances').length === 1);
    doc = baseDoc(); doc.settings = null;
    ok(errorsAt(doc, 'settings', '').length === 1);
    doc = baseDoc(); doc.meta.welcomeDone = 1;
    ok(errorsAt(doc, 'meta', 'welcomeDone').length === 1);
    doc = baseDoc(); doc.rev = '3';
    ok(errorsAt(doc, 'root', 'rev').length === 1);
    doc = baseDoc(); doc.rev = 9007199254740991;
    ok(errorsAt(doc, 'root', 'rev').length === 1, 'a rev that can no longer count up (D03)');
    doc = baseDoc(); doc.rev = 1e21;
    ok(errorsAt(doc, 'root', 'rev').length === 1);
    doc = baseDoc(); doc.rev = 1e12;
    ok(errorsAt(doc, 'root', 'rev').length === 0);
    ok(schema.validate(null).length === 1);
    ok(schema.validate([]).length === 1);
    ok(schema.validate('text').length === 1);
  });

  test('schema.validate: rejects another app and another data format', function () {
    let doc = baseDoc(); doc.app = 'tictactoe';
    ok(errorsAt(doc, 'root', 'app').length === 1);
    doc = baseDoc(); doc.schemaVersion = 2;
    ok(errorsAt(doc, 'root', 'schemaVersion').length === 1);
  });

  test('schema.validate: rejects unknown enum values', function () {
    let doc = baseDoc(); doc.people[0].clientStatus = 'gone';
    ok(errorsAt(doc, 'people', 'clientStatus', 0).length === 1);
    doc = baseDoc(); doc.people[2].leadStatus = 'hot';
    ok(errorsAt(doc, 'people', 'leadStatus', 2).length === 1);
    doc = baseDoc(); doc.appointments[0].status = 'maybe';
    ok(errorsAt(doc, 'appointments', 'status', 0).length === 1);
    doc = baseDoc(); doc.people[0].hairColor = 'purple';
    ok(errorsAt(doc, 'people', 'hairColor', 0).length === 1);
    doc = baseDoc(); doc.people[0].areas = ['elbow'];
    ok(errorsAt(doc, 'people', 'areas', 0).length === 1);
    doc = baseDoc(); doc.settings.whatsappOnComputer = 'fax';
    ok(errorsAt(doc, 'settings', 'whatsappOnComputer').length === 1);
    doc = baseDoc(); doc.settings.currency = 'ISL';
    ok(errorsAt(doc, 'settings', 'currency').length === 1, 'a typo such as ISL is refused');
    doc = baseDoc(); doc.meta.homeDevice = 'tablet';
    ok(errorsAt(doc, 'meta', 'homeDevice').length === 1);
    doc = baseDoc();
    doc.appointments[1].reminderBefore = { action: 'sent', channel: 'pigeon', at: STAMP, forDate: '2026-12-08', forTime: '14:00' };
    ok(errorsAt(doc, 'appointments', 'reminderBefore', 1).length === 1);
  });

  test('schema.validate: rejects bad dates and times', function () {
    let doc = baseDoc(); doc.people[0].clientSince = '2026-02-30';
    ok(errorsAt(doc, 'people', 'clientSince', 0).length === 1);
    doc = baseDoc(); doc.appointments[2].date = '11/11/2026';
    ok(errorsAt(doc, 'appointments', 'date', 2).length === 1);
    doc = baseDoc(); doc.appointments[1].time = '25:00';
    ok(errorsAt(doc, 'appointments', 'time', 1).length === 1);
    doc = baseDoc(); doc.appointments[1].time = '2 pm';
    ok(errorsAt(doc, 'appointments', 'time', 1).length === 1);
    doc = baseDoc(); doc.payments[1].paidOn = '2026-11-31';
    ok(errorsAt(doc, 'payments', 'paidOn', 1).length === 1);
    doc = baseDoc(); doc.people[0].createdAt = '2026-11-18';
    ok(errorsAt(doc, 'people', 'createdAt', 0).length === 1);
    doc = baseDoc(); doc.meta.startedOn = 'yesterday';
    ok(errorsAt(doc, 'meta', 'startedOn').length === 1);
    doc = baseDoc(); doc.settings.dailyAlarmTime = '8:30';
    ok(errorsAt(doc, 'settings', 'dailyAlarmTime').length === 1);
  });

  test('schema.validate: rejects money that is not a whole number', function () {
    let doc = baseDoc(); doc.payments[1].amountMinor = 250.5;
    ok(errorsAt(doc, 'payments', 'amountMinor', 1).length === 1);
    doc = baseDoc(); doc.payments[1].amountMinor = '250';
    ok(errorsAt(doc, 'payments', 'amountMinor', 1).length === 1);
    doc = baseDoc(); doc.payments[1].amountMinor = 0;
    ok(errorsAt(doc, 'payments', 'amountMinor', 1).length === 1, 'a payment of 0 is no payment');
    doc = baseDoc(); doc.payments[1].amountMinor = -12000;
    eq(schema.validate(doc), [], 'a negative amount is a refund');
    doc = baseDoc(); doc.appointments[0].priceMinor = 1.5;
    ok(errorsAt(doc, 'appointments', 'priceMinor', 0).length === 1);
    doc = baseDoc(); doc.people[0].priorPaidMinor = 99.9;
    ok(errorsAt(doc, 'people', 'priorPaidMinor', 0).length === 1);
    doc = baseDoc(); doc.settings.usualPriceMinor = 250.25;
    ok(errorsAt(doc, 'settings', 'usualPriceMinor').length === 1);
  });

  test('schema.validate: rejects broken references', function () {
    let doc = baseDoc(); doc.appointments[0].personId = 'nobody';
    eq(errorsAt(doc, 'appointments', 'personId', 0)[0].message, 'This client does not exist');
    doc = baseDoc(); doc.payments[1].personId = 'nobody';
    eq(errorsAt(doc, 'payments', 'personId', 1)[0].message, 'This client does not exist');
    doc = baseDoc(); doc.payments[0].appointmentId = 'nothing';
    eq(errorsAt(doc, 'payments', 'appointmentId', 0)[0].message, 'This appointment does not exist');
    doc = baseDoc(); doc.payments[1].appointmentId = doc.appointments[0].id;
    ok(errorsAt(doc, 'payments', 'appointmentId', 1).length >= 1, 'an appointment of another client');
    doc = baseDoc(); doc.people.splice(1, 1);
    ok(schema.validate(doc).length >= 2, 'removing a person breaks what points at them');
  });

  test('schema.validate: rejects duplicate ids', function () {
    let doc = baseDoc(); doc.people[1].id = doc.people[0].id;
    eq(errorsAt(doc, 'people', 'id', 1)[0].message, 'Two records share this id');
    doc = baseDoc(); doc.appointments[2].id = doc.appointments[1].id;
    ok(errorsAt(doc, 'appointments', 'id', 2).length === 1);
  });

  test('schema.validate: the whole-document rules of 4.8', function () {
    let doc = baseDoc();
    doc.payments.push(schema.newPayment({ personId: doc.people[0].id, appointmentId: doc.appointments[0].id, paidOn: '2026-11-10', amountMinor: 1000 }, { now: AT }));
    eq(errorsAt(doc, 'payments', 'appointmentId', 2)[0].message, 'Two payments are linked to this appointment');
    doc.payments[2].deletedAt = STAMP;
    eq(schema.validate(doc), [], 'a deleted second payment is fine (rule 2)');

    doc = baseDoc(); doc.appointments[1].time = null;
    eq(errorsAt(doc, 'appointments', 'time', 1)[0].message, 'A booked appointment needs a time');
    doc.appointments[1].status = 'cancelled';
    eq(schema.validate(doc), [], 'only a booked appointment needs a time');

    doc = baseDoc(); doc.appointments[2].personId = doc.people[2].id;
    eq(errorsAt(doc, 'appointments', 'personId', 2)[0].message, 'An appointment needs a client');

    doc = baseDoc(); doc.payments[0].paidOn = '2026-11-11';
    eq(errorsAt(doc, 'payments', 'paidOn', 0)[0].message, 'Must be the date of its appointment');

    doc = baseDoc(); doc.people[1].deletedAt = STAMP;
    ok(errorsAt(doc, 'appointments', 'personId', 2).length === 1, 'a live appointment of a deleted client');
    ok(errorsAt(doc, 'payments', 'personId', 1).length === 1, 'a live payment of a deleted client');
    doc.appointments[2].deletedAt = STAMP;
    doc.payments[1].deletedAt = STAMP;
    eq(schema.validate(doc), [], 'deleted together (rule 7) is fine');

    doc = baseDoc(); doc.appointments[0].deletedAt = STAMP;
    ok(errorsAt(doc, 'payments', 'appointmentId', 0).length === 1, 'a live payment of a deleted appointment (rule 6)');
  });

  test('schema.validate: lists at most 100 faults', function () {
    const doc = baseDoc();
    for (let i = 0; i < 300; i++) doc.people.push({ id: 5 });
    eq(schema.validate(doc).length, 100);
  });

  // ---- one check per field, and validate agrees with it (D22) ----------------------------

  const SLOT = { action: 'sent', channel: 'whatsapp', at: STAMP, forDate: '2026-12-08', forTime: '14:00' };
  const SKIPPED = { action: 'skipped', channel: null, at: STAMP, forDate: '2026-12-08', forTime: '14:00' };
  const DATE_SAMPLES = ['2026-11-18', '2028-02-29', '2026-02-30', '18/11/2026', '', 20261118, null];
  const STAMP_SAMPLES = [STAMP, '2026-11-18T08:12:44Z', '2026-11-18', 'now', 5, null];
  const LONG_EMAIL = x(112) + '@mail.com';   // 121 characters

  // [collection, index, field, check name, sample values]
  const FIELD_CASES = [
    ['people', 1, 'id', 'id', ['abc-123', 'A_b-9', '', 'has space', 5, null]],
    ['people', 1, 'name', 'personName', ['Dana', 'דנה לוי', ' padded ', '', '   ', x(80), x(81), 5, null]],
    ['people', 1, 'phone', 'phone', ['', '054-123 4567', x(30), x(31), 541234567, null]],
    ['people', 1, 'email', 'email', ['', 'dana@gmail', 'dana@gmail.com', 'dana+x@gmail.com', 'dana', 'dana@', '@gmail.com',
      'dana levi@gmail.com', 'a@b@c', x(110) + '@mail.com', LONG_EMAIL, 5, null]],
    ['people', 1, 'hairColor', 'hairColor', [null, 'black', 'grey', 'purple', '', 3]],
    ['people', 1, 'hairThickness', 'hairThickness', [null, 'fine', 'coarse', 'thick', 1]],
    ['people', 1, 'notes', 'notes', ['', 'allergic to aloe', x(2000), x(2001), null, 7]],
    ['people', 1, 'areas', 'areas', [[], ['chin', 'back'], ['chin', 'chin'], ['elbow'], [1], 'chin', null]],
    ['people', 1, 'skinType', 'skinType', [null, 1, 6, 0, 7, 2.5, '3']],
    ['people', 1, 'intervalWeeks', 'intervalWeeks', [null, 1, 26, 0, 27, 4.5, '4']],
    ['people', 1, 'priorSessions', 'priorSessions', [0, 6, 999, 1000, -1, 1.5, '6', null]],
    ['people', 1, 'priorPaidMinor', 'priorPaidMinor', [0, 150000, -1, 0.5, '100', null]],
    ['people', 1, 'clientSince', 'clientSince', DATE_SAMPLES],
    ['people', 1, 'clientStatus', 'clientStatus', ['active', 'paused', 'finished', 'gone', '', null, 1]],
    ['people', 1, 'leadSince', 'dateOrNull', DATE_SAMPLES],
    ['people', 1, 'leadStatus', 'leadStatus', [null, 'new', 'contacted', 'notInterested', 'hot', 2]],
    ['people', 1, 'leadInterest', 'leadInterest', ['', 'legs', x(120), x(121), null]],
    ['people', 1, 'followUpOn', 'dateOrNull', DATE_SAMPLES],
    ['people', 1, 'rebookAskedOn', 'dateOrNull', DATE_SAMPLES],
    ['people', 1, 'rebookAsks', 'rebookAsks', [0, 3, -1, 1.5, '1', null]],
    ['people', 1, 'rebookSnoozeUntil', 'dateOrNull', DATE_SAMPLES],
    ['people', 1, 'rebookFor', 'idOrNull', [null, 'some-id', '', 'has space', 5]],
    ['people', 1, 'createdAt', 'stamp', STAMP_SAMPLES],
    ['people', 1, 'updatedAt', 'stamp', STAMP_SAMPLES],
    ['people', 1, 'deletedAt', 'stampOrNull', STAMP_SAMPLES],

    ['appointments', 2, 'id', 'id', ['abc-123', '', 5, null]],
    ['appointments', 2, 'personId', 'id', [function (doc) { return doc.people[0].id; }, '', 'has space', 5, null]],
    ['appointments', 2, 'date', 'date', DATE_SAMPLES],
    ['appointments', 2, 'time', 'timeOrNull', [null, '14:00', '00:00', '24:00', '9:05', '2 pm', 1400]],
    ['appointments', 2, 'status', 'appointmentStatus', ['done', 'cancelled', 'noShow', 'maybe', '', null]],
    ['appointments', 2, 'scheduledOn', 'date', DATE_SAMPLES],
    ['appointments', 2, 'areas', 'areas', [[], ['fullLegs'], ['legs'], 'fullLegs', null]],
    ['appointments', 2, 'priceMinor', 'priceMinor', [null, 0, 25000, -1, 2.5, '250']],
    ['appointments', 2, 'notes', 'appointmentNotes', ['', x(1000), x(1001), null, 3]],
    ['appointments', 2, 'reminderBefore', 'slot', [null, SLOT, SKIPPED, { action: 'sent' }, 'sent', [],
      { action: 'sent', channel: 'pigeon', at: STAMP, forDate: '2026-12-08', forTime: '14:00' },
      { action: 'done', channel: 'sms', at: STAMP, forDate: '2026-12-08', forTime: '14:00' },
      { action: 'sent', channel: 'sms', at: 'now', forDate: '2026-12-08', forTime: '14:00' },
      { action: 'sent', channel: 'sms', at: STAMP, forDate: '8 Dec', forTime: '14:00' },
      { action: 'sent', channel: 'sms', at: STAMP, forDate: '2026-12-08', forTime: '2pm' }]],
    ['appointments', 2, 'reminderSameDay', 'slot', [null, SLOT, SKIPPED, 5]],
    ['appointments', 2, 'createdAt', 'stamp', STAMP_SAMPLES],
    ['appointments', 2, 'updatedAt', 'stamp', STAMP_SAMPLES],
    ['appointments', 2, 'deletedAt', 'stampOrNull', STAMP_SAMPLES],

    ['payments', 1, 'id', 'id', ['abc-123', '', 5, null]],
    ['payments', 1, 'personId', 'id', [function (doc) { return doc.people[0].id; }, '', 5, null]],
    ['payments', 1, 'appointmentId', 'idOrNull', [null, '', 5]],
    ['payments', 1, 'paidOn', 'date', DATE_SAMPLES],
    ['payments', 1, 'amountMinor', 'amount', [25000, 1, -5000, 0, 2.5, '250', null]],
    ['payments', 1, 'note', 'paymentNote', ['', 'cash', x(200), x(201), null]],
    ['payments', 1, 'createdAt', 'stamp', STAMP_SAMPLES],
    ['payments', 1, 'updatedAt', 'stamp', STAMP_SAMPLES],
    ['payments', 1, 'deletedAt', 'stampOrNull', STAMP_SAMPLES],

    ['settings', -1, 'currency', 'currency', [null, 'ILS', 'USD', 'JPY', 'ISL', 'ils', 'shekel', '', 5]],
    ['settings', -1, 'currencyDecimals', 'currencyDecimals', [0, 2, 3, 4, 5, -1, 1.5, '2', null]],
    ['settings', -1, 'countryCode', 'countryCode', ['', '1', '972', '1234', '12345', '+972', 'abc', 972, null]],
    ['settings', -1, 'whatsappOnComputer', 'whatsappOnComputer', ['browser', 'app', 'web', 'fax', null]],
    ['settings', -1, 'usualPriceMinor', 'usualPriceMinor', [null, 0, 25000, -1, 2.5, '250']],
    ['settings', -1, 'trackBalances', 'yesNo', [true, false, 0, 'yes', null]],
    ['settings', -1, 'rebookWeeks', 'rebookWeeks', [1, 4, 26, 0, 27, 4.5, '4', null]],
    ['settings', -1, 'messageLocale', 'messageLocale', ['en-GB', 'device', 'he', 'ar', 'ru', 'fr', 'es', 'de', 'xx', '', null]],
    ['settings', -1, 'templates', 'templates', [
      { before: 'a', sameDay: 'b', rebook: 'c', lead: 'd' },
      { before: x(1000), sameDay: '', rebook: '', lead: '' },
      { before: x(1001), sameDay: 'b', rebook: 'c', lead: 'd' },
      { before: 'a', sameDay: 'b', rebook: 'c' },
      { before: 'a', sameDay: 'b', rebook: 'c', lead: 5 },
      'text', null, []]],
    ['settings', -1, 'reminderDaysBefore', 'reminderDaysBefore', [0, 1, 2, 3, 7, 4, 14, -1, '2', null]],
    ['settings', -1, 'sameDayHoursBefore', 'sameDayHoursBefore', [0, 1, 2, 3, 4, -1, '2', null]],
    ['settings', -1, 'currencySymbol', 'currencySymbol', [null, '', 'NIS', 'abcd', 'abcde', 5]],
    ['settings', -1, 'quickPickWeeks', 'quickPickWeeks', [[4], [4, 6, 8], [], [4, 6, 8, 10], [0], [27], [4, 4], [4.5], ['4'], 4, null]],
    ['settings', -1, 'sessionMinutes', 'sessionMinutes', [5, 30, 240, 4, 241, 30.5, '30', null]],
    ['settings', -1, 'rebookHeadsUpDays', 'rebookHeadsUpDays', [0, 7, 14, 15, -1, '7', null]],
    ['settings', -1, 'askAgainDays', 'askAgainDays', [1, 7, 30, 0, 31, '7', null]],
    ['settings', -1, 'eveningFrom', 'time', ['18:00', '00:00', '24:00', '6 pm', 1800, null]],
    ['settings', -1, 'dailyAlarmTime', 'time', ['08:30', '8:30', '', null]],
    ['settings', -1, 'dailyAlarmDays', 'dailyAlarmDays', [[1], [1, 2, 3, 4, 5, 6, 7], [], [0], [8], [1, 1], ['1'], 1, null]],
    ['settings', -1, 'ownerWhatsApp', 'ownerWhatsApp', ['', '+972 54 123 4567', x(30), x(31), 972541234567, null]],
    ['settings', -1, 'requestPageUrl', 'requestPageUrl', ['', 'https://example.github.io/tictactoe/laser/request/',
      'http://example.com/', 'example.com', 'javascript:alert(1)', 'https://' + x(193), 'https://' + x(192), 5, null]],
    ['settings', -1, 'investPercent', 'investPercent', [0, 20, 100, 101, -1, 12.5, '20', null]],

    ['meta', -1, 'startedOn', 'date', DATE_SAMPLES],
    ['meta', -1, 'welcomeDone', 'yesNo', [true, false, 1, 'true', null]],
    ['meta', -1, 'lastExportAt', 'stampOrNull', STAMP_SAMPLES],
    ['meta', -1, 'backupCheckedAt', 'stampOrNull', STAMP_SAMPLES],
    ['meta', -1, 'changesSinceExport', 'count', [0, 14, -1, 1.5, '3', null]],
    ['meta', -1, 'unsavedSince', 'stampOrNull', STAMP_SAMPLES],
    ['meta', -1, 'lastCopyOn', 'dateOrNull', DATE_SAMPLES],
    ['meta', -1, 'homeDevice', 'homeDevice', [null, 'laptop', 'phone', 'tablet', '', 1]],
    ['meta', -1, 'reopenedAt', 'stampOrNull', STAMP_SAMPLES],
    ['meta', -1, 'persist', 'persist', [null, { askedAt: STAMP, granted: false }, { askedAt: STAMP, granted: true },
      { askedAt: 'now', granted: true }, { askedAt: STAMP, granted: 'no' }, {}, 'granted', true]]
  ];

  function target(doc, collection, index) {
    return index === -1 ? doc[collection] : doc[collection][index];
  }

  FIELD_CASES.forEach(function (c) {
    const collection = c[0], index = c[1], field = c[2], name = c[3], samples = c[4];
    test('schema.check.' + name + ' gives the same verdict as validate on ' + collection + '.' + field, function () {
      ok(typeof check[name] === 'function', 'there is no check called ' + name);
      let good = 0, bad = 0;
      samples.forEach(function (sample) {
        const doc = baseDoc();
        // a sample that is a function picks its value from the document (an id that exists)
        const value = typeof sample === 'function' ? sample(doc) : sample;
        target(doc, collection, index)[field] = value;
        const found = errorsAt(doc, collection, field, index);
        const verdict = check[name](value);
        ok(verdict === null || (typeof verdict === 'string' && verdict.length > 0), 'a check returns null or a message');
        if ((verdict !== null) !== (found.length > 0)) {
          throw new Error('value ' + JSON.stringify(value) + ': check says ' + JSON.stringify(verdict) +
            ' but validate says ' + JSON.stringify(found.map(function (e) { return e.message; })));
        }
        if (verdict !== null) { eq(found[0].message, verdict); bad++; } else { good++; }
      });
      ok(good > 0, 'at least one accepted sample');
      ok(bad > 0, 'at least one refused sample');
    });
  });

  test('schema: every field of every record, of settings and of meta has a check in the table above', function () {
    function covered(collection) {
      return FIELD_CASES.filter(function (c) { return c[0] === collection; }).map(function (c) { return c[2]; }).sort();
    }
    eq(covered('people'), Object.keys(schema.newPerson({ name: 'x' })).sort());
    eq(covered('appointments'), Object.keys(schema.newAppointment({})).sort());
    eq(covered('payments'), Object.keys(schema.newPayment({})).sort());
    eq(covered('settings'), Object.keys(schema.defaultSettings()).sort());
    eq(covered('meta'), Object.keys(schema.defaultMeta('2026-11-18')).sort());
  });

  test('schema.check: the words the client form shows', function () {
    eq(check.personName(''), 'Enter a name');
    eq(check.personName('   '), 'Enter a name');
    eq(check.personName('Dana Levi'), null);
    eq(check.email('dana@gmail'), null, 'dana@gmail is accepted (4.3)');
    eq(check.email(''), null);
    ok(typeof check.email('dana') === 'string', 'an email with no @ is refused');
    ok(typeof check.email('dana@') === 'string');
    eq(check.phone('054-123 4567'), null);
    eq(check.phone(''), null);
    eq(check.countryCode('972'), null);
    ok(typeof check.countryCode('+972') === 'string');
    eq(check.amount(0), 'Enter an amount that is not 0');
  });

  test('schema.check.clientSince: with today given, a future date is refused (the form\'s rule)', function () {
    eq(check.clientSince('2026-11-18', '2026-11-18'), null);
    eq(check.clientSince('2020-01-01', '2026-11-18'), null);
    eq(check.clientSince(null, '2026-11-18'), null);
    eq(check.clientSince('2026-11-19', '2026-11-18'), 'The date cannot be in the future');
    eq(check.clientSince('2026-11-19'), null, 'a stored date may be any valid date');
    eq(check.clientSince('2026-02-30', '2026-11-18'), 'Enter a valid date');
  });

  // ---- normalize -------------------------------------------------------------------------

  test('schema.normalize: fills every missing field and keeps unknown fields', function () {
    const old = {
      app: 'laser-practice', schemaVersion: 1, createdAt: dates.stamp(new Date(2026, 5, 1, 1, 30)),
      futureRootField: { keep: true },
      settings: { currency: 'ILS', futureSetting: 7 },
      people: [{ id: 'p1', name: 'Dana Levi', clientSince: '2026-06-01', futureField: 'keep me' }],
      appointments: [{ id: 'a1', personId: 'p1', date: '2026-06-02', status: 'done' }],
      payments: [{ id: 'm1', personId: 'p1', appointmentId: 'a1', paidOn: '2026-06-02', amountMinor: 25000 }]
    };
    const out = schema.normalize(old);
    ok(out.doc === old, 'normalize works in place');
    eq(out.repairs, []);
    eq(schema.validate(old), []);
    eq(old.rev, 0);
    eq(old.futureRootField, { keep: true });
    eq(old.settings.futureSetting, 7);
    eq(old.settings.currency, 'ILS');
    eq(old.settings.rebookWeeks, 4);
    eq(old.settings.templates.sameDay, schema.defaultTemplates.sameDay);
    eq(old.people[0].futureField, 'keep me');
    eq(old.people[0].phone, '');
    eq(old.people[0].clientStatus, 'active');
    eq(old.people[0].areas, []);
    eq(old.appointments[0].time, null);
    eq(old.appointments[0].scheduledOn, '2026-06-02');
    eq(old.payments[0].note, '');
    eq(old.meta.startedOn, '2026-06-01', 'startedOn is the local day of createdAt (4.8 rule 13)');
    eq(old.meta.welcomeDone, false);
  });

  test('schema.normalize: a valid document comes back unchanged', function () {
    const doc = baseDoc();
    const before = JSON.stringify(doc);
    const out = schema.normalize(doc);
    eq(out.repairs, []);
    eq(JSON.stringify(doc), before);
  });

  test('schema.normalize: soft faults are repaired, listed, and the result is valid', function () {
    const doc = baseDoc();
    doc.people[0].notes = x(2500);
    doc.people[1].email = 'maya@';
    doc.people[1].hairColor = 'purple';
    doc.people[1].hairThickness = 'thick';
    doc.people[1].areas = ['chin', 'elbow', 'chin'];
    doc.people[1].skinType = 9;
    doc.people[2].name = '  ' + x(100) + '  ';
    doc.people[2].phone = x(40);
    doc.people[2].leadInterest = x(130);
    doc.appointments[0].notes = x(1200);
    doc.appointments[0].areas = ['back', 'wing'];
    doc.payments[1].note = x(300);
    doc.settings.rebookWeeks = 99;
    doc.settings.currency = 'ISL';
    doc.settings.templates.rebook = x(1500);
    doc.settings.countryCode = '+972';
    doc.settings.quickPickWeeks = [4, 40];
    ok(schema.validate(doc).length > 0, 'the faults are real');
    const out = schema.normalize(doc);
    eq(schema.validate(doc), []);
    eq(doc.people[0].notes.length, 2000);
    eq(doc.people[1].email, '');
    eq(doc.people[1].hairColor, null);
    eq(doc.people[1].hairThickness, null);
    eq(doc.people[1].areas, ['chin']);
    eq(doc.people[1].skinType, null);
    eq(doc.people[2].name, x(80));
    eq(doc.people[2].phone.length, 30);
    eq(doc.people[2].leadInterest.length, 120);
    eq(doc.appointments[0].notes.length, 1000);
    eq(doc.appointments[0].areas, ['back']);
    eq(doc.payments[1].note.length, 200);
    eq(doc.settings.rebookWeeks, 4);
    eq(doc.settings.currency, null);
    eq(doc.settings.templates.rebook.length, 1000);
    eq(doc.settings.countryCode, '');
    eq(doc.settings.quickPickWeeks, [4, 6, 8]);
    ok(out.repairs.indexOf('Dana Levi: note shortened to 2,000 characters') !== -1, out.repairs.join(' | '));
    ok(out.repairs.indexOf("Maya Cohen: email 'maya@' removed") !== -1, out.repairs.join(' | '));
    ok(out.repairs.indexOf("Maya Cohen: hair colour 'purple' removed") !== -1);
    ok(out.repairs.indexOf("Maya Cohen: treated area 'elbow' removed") !== -1);
    ok(out.repairs.indexOf('Maya Cohen: skin type 9 removed') !== -1);
    ok(out.repairs.indexOf('Settings: weeks between sessions set back to 4') !== -1, out.repairs.join(' | '));
    eq(out.repairs.length, 17, out.repairs.join(' | '));
  });

  test('schema.normalize: one fault gives one line, and a second run finds nothing', function () {
    const doc = baseDoc();
    doc.people[0].notes = x(2001);
    eq(schema.normalize(doc).repairs, ['Dana Levi: note shortened to 2,000 characters']);
    eq(schema.normalize(doc).repairs, []);
  });

  test('schema.normalize: structural faults are left alone, so validate still refuses them', function () {
    const doc = baseDoc();
    doc.people[0].phone = 541234567;            // a phone that is a number
    doc.people[1].id = doc.people[0].id;        // two people sharing one id
    doc.people[2].name = '';                    // a person with no name
    doc.payments[1].amountMinor = 120.5;        // money that is not a whole number
    doc.appointments[2].date = '11.11.2026';    // a date in the wrong format
    doc.settings.rebookWeeks = '4';             // a setting of the wrong type
    doc.people[0].email = 5;
    doc.people[0].hairColor = 3;
    const out = schema.normalize(doc);
    eq(out.repairs, []);
    eq(doc.people[0].phone, 541234567);
    eq(doc.settings.rebookWeeks, '4');
    const fields = schema.validate(doc).map(function (e) { return e.collection + '.' + e.field; });
    ['people.phone', 'people.id', 'people.name', 'payments.amountMinor', 'appointments.date',
      'settings.rebookWeeks', 'people.email', 'people.hairColor'].forEach(function (f) {
      ok(fields.indexOf(f) !== -1, 'missing fault: ' + f);
    });
  });

  test('schema.normalize: things that are not documents are returned as they are', function () {
    eq(schema.normalize(null), { doc: null, repairs: [] });
    eq(schema.normalize('text'), { doc: 'text', repairs: [] });
  });

  // ---- client since, regions, compaction -------------------------------------------------

  test('schema.clientSince: "Earlier" with no date is the day before the app was first used', function () {
    const doc = schema.emptyDoc(new Date(2026, 10, 10, 9, 0));   // started 10 Nov
    const today = '2026-11-18';
    eq(schema.clientSince.earlierDate(doc), '2026-11-09');
    eq(schema.clientSince.fromChoice('today', '', doc, today), '2026-11-18');
    eq(schema.clientSince.fromChoice('earlier', '', doc, today), '2026-11-09');
    eq(schema.clientSince.fromChoice('earlier', '2025-03-01', doc, today), '2025-03-01');
    eq(schema.clientSince.toChoice('2026-11-18', doc, today), { choice: 'today', date: '' });
    eq(schema.clientSince.toChoice('2026-11-09', doc, today), { choice: 'earlier', date: '' });
    eq(schema.clientSince.toChoice('2025-03-01', doc, today), { choice: 'earlier', date: '2025-03-01' });
    eq(schema.clientSince.toChoice('2026-11-17', doc, today), { choice: 'earlier', date: '2026-11-17' });
    const first = schema.emptyDoc(new Date(2026, 0, 1, 9, 0));
    eq(schema.clientSince.earlierDate(first), '2025-12-31');
  });

  test('schema.suggestRegion: currency and country code from the device region (3.9)', function () {
    eq(schema.suggestRegion('he-IL'), { region: 'IL', currency: 'ILS', currencyName: 'Israeli new shekel', countryCode: '972' });
    eq(schema.suggestRegion('en-GB'), { region: 'GB', currency: 'GBP', currencyName: 'British pound', countryCode: '44' });
    eq(schema.suggestRegion('en-US').currency, 'USD');
    eq(schema.suggestRegion('en-US').countryCode, '1');
    eq(schema.suggestRegion('fr-FR').currency, 'EUR');
    eq(schema.suggestRegion('zh-Hans-CN').countryCode, '86');
    eq(schema.suggestRegion('en_AU').currency, 'AUD');
  });

  test('schema.suggestRegion: an unknown region gives two empty fields', function () {
    const none = { region: null, currency: null, currencyName: '', countryCode: '' };
    eq(schema.suggestRegion('en-AQ'), none);
    eq(schema.suggestRegion('xx'), none);
    eq(schema.suggestRegion(''), none);
    eq(schema.suggestRegion(undefined), none);
    eq(schema.suggestRegion('not a language tag at all'), none);
  });

  test('schema: currencies', function () {
    ok(schema.isCurrency('ILS'));
    ok(schema.isCurrency('USD'));
    ok(!schema.isCurrency('ISL'));
    ok(!schema.isCurrency('usd'));
    ok(!schema.isCurrency(null));
    eq(schema.currencyName('ILS'), 'Israeli new shekel');
    ok(schema.currencyName('THB').length > 0);
    ok(schema.currencies.length >= 30);
    schema.currencies.forEach(function (c) { ok(schema.isCurrency(c.code), c.code + ' is not known to this browser'); });
  });

  test('schema.setCurrency: the decimals are written together with the currency', function () {
    const s = schema.defaultSettings();
    schema.setCurrency(s, 'JPY');
    eq([s.currency, s.currencyDecimals], ['JPY', 0]);
    schema.setCurrency(s, 'KWD');
    eq([s.currency, s.currencyDecimals], ['KWD', 3]);
    schema.setCurrency(s, 'ILS');
    eq([s.currency, s.currencyDecimals], ['ILS', 2]);
    schema.setCurrency(s, null);
    eq([s.currency, s.currencyDecimals], [null, 2]);
  });

  test('schema.purge: removes records deleted more than 30 days ago, and only those', function () {
    const now = new Date(2026, 10, 18, 10, 0);
    const old = dates.stamp(new Date(2026, 9, 17, 10, 0));      // 32 days ago
    const recent = dates.stamp(new Date(2026, 9, 21, 10, 0));   // 28 days ago
    const doc = baseDoc();
    const gone = schema.newPerson({ name: 'Gone Long Ago' }, { now: AT });
    const goneVisit = schema.newAppointment({ personId: gone.id, date: '2026-09-01', status: 'done' }, { now: AT });
    const gonePay = schema.newPayment({ personId: gone.id, appointmentId: goneVisit.id, paidOn: '2026-09-01', amountMinor: 100 }, { now: AT });
    gone.deletedAt = old; goneVisit.deletedAt = old; gonePay.deletedAt = old;
    const lately = schema.newPerson({ name: 'Deleted Lately' }, { now: AT });
    lately.deletedAt = recent;
    const kept = schema.newPerson({ name: 'Old But Needed' }, { now: AT });
    const keptVisit = schema.newAppointment({ personId: kept.id, date: '2026-09-02', status: 'done' }, { now: AT });
    kept.deletedAt = old; keptVisit.deletedAt = recent;
    doc.people.push(gone, lately, kept);
    doc.appointments.push(goneVisit, keptVisit);
    doc.payments.push(gonePay);
    eq(schema.validate(doc), []);
    eq(schema.purge(doc, now), 3);
    const names = doc.people.map(function (p) { return p.name; });
    eq(names, ['Dana Levi', 'Maya Cohen', 'Noa Bar', 'Deleted Lately', 'Old But Needed']);
    eq(doc.appointments.length, 4);
    eq(doc.payments.length, 2);
    eq(schema.validate(doc), [], 'no reference is broken');
    eq(schema.purge(doc, now), 0);
  });

  // ---- acceptance item 23 ----------------------------------------------------------------

  test('schema.validate: 500 clients and 6,000 appointments in under 30 ms', function () {
    const doc = schema.emptyDoc(AT);
    for (let i = 0; i < 500; i++) {
      const p = schema.newPerson({
        name: 'Client ' + i, phone: '054-123 ' + (1000 + i), email: 'client' + i + '@example.com',
        notes: 'Sensitive skin, prefers mornings', areas: ['underarms', 'fullLegs'], hairColor: 'darkBrown'
      }, { now: AT });
      doc.people.push(p);
      for (let k = 0; k < 12; k++) {
        doc.appointments.push(schema.newAppointment({
          personId: p.id, date: dates.addDays('2025-12-01', k * 28 + (i % 20)), time: '14:00',
          status: k < 11 ? 'done' : 'booked', areas: ['underarms', 'fullLegs'], notes: 'ok'
        }, { now: AT }));
      }
    }
    eq(doc.people.length, 500);
    eq(doc.appointments.length, 6000);
    eq(schema.validate(doc), []);
    let best = Infinity;
    for (let run = 0; run < 7; run++) {
      const t0 = performance.now();
      const errors = schema.validate(doc);
      const ms = performance.now() - t0;
      if (errors.length) throw new Error('unexpected faults');
      if (ms < best) best = ms;
    }
    window.__timings = window.__timings || {};
    window.__timings.validateMs = best;
    window.__timings.docChars = JSON.stringify(doc).length;
    ok(best < 30, 'validate took ' + best.toFixed(1) + ' ms');
  });
})(window.Laser);

// tests/unit/dates.test.js
// The page is opened under five time zones (unit.spec.js); every test here must give the
// same answer in all of them.
(function (L) {
  'use strict';
  const dates = L.core.dates;
  const DAY = 86400000;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  // An independent calendar: walks day by day with a month-length table.
  function calendar(fromYear, years) {
    const out = [];
    for (let y = fromYear; y < fromYear + years; y++) {
      const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= lengths[m]; d++) out.push(y + '-' + pad(m + 1) + '-' + pad(d));
      }
    }
    return out;
  }

  // The reference of 4.1: Date.UTC arithmetic read back with UTC getters.
  function viaUtc(date, n) {
    const p = date.split('-').map(Number);
    const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]) + n * DAY);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  test('dates.addDays: equals Date.UTC arithmetic for every start date across two years', function () {
    const days = calendar(2026, 2);
    eq(days.length, 730);
    const steps = [1, 7, 28, 42, 56, 182, 365, -1, -7, -28];
    let checked = 0;
    for (let i = 0; i < days.length; i++) {
      for (let s = 0; s < steps.length; s++) {
        const got = dates.addDays(days[i], steps[s]);
        if (got !== viaUtc(days[i], steps[s])) {
          throw new Error(days[i] + ' + ' + steps[s] + ' gave ' + got + ', expected ' + viaUtc(days[i], steps[s]));
        }
        checked++;
      }
    }
    eq(checked, 7300);
  });

  test('dates.addDays: agrees with an independent day-by-day calendar, leap day included', function () {
    const days = calendar(2026, 4);   // 2028 is a leap year
    eq(days.length, 1461);
    const steps = [1, 28, 59, 366];
    for (let i = 0; i < days.length; i++) {
      for (let s = 0; s < steps.length; s++) {
        if (i + steps[s] >= days.length) continue;
        const got = dates.addDays(days[i], steps[s]);
        if (got !== days[i + steps[s]]) {
          throw new Error(days[i] + ' + ' + steps[s] + ' gave ' + got + ', expected ' + days[i + steps[s]]);
        }
        const back = dates.addDays(days[i + steps[s]], -steps[s]);
        if (back !== days[i]) throw new Error(days[i + steps[s]] + ' - ' + steps[s] + ' gave ' + back);
      }
    }
  });

  test('dates.addDays: 4 weeks is exactly 28 days and keeps the weekday across clock changes', function () {
    eq(dates.addDays('2026-11-18', 28), '2026-12-16');
    eq(dates.addDays('2026-03-06', 28), '2026-04-03');   // clocks change in between in most zones
    eq(dates.addDays('2026-10-09', 28), '2026-11-06');
    eq(dates.weekday(dates.addDays('2026-03-06', 28)), dates.weekday('2026-03-06'));
    eq(dates.addDays('2026-12-31', 1), '2027-01-01');
    eq(dates.addDays('2028-02-28', 1), '2028-02-29');
    eq(dates.addDays('2027-02-28', 1), '2027-03-01');
    eq(dates.addDays('2026-11-18', 0), '2026-11-18');
  });

  test('dates.today: at 01:30 local it is the local day, in every time zone', function () {
    eq(dates.today(new Date(2026, 10, 18, 1, 30)), '2026-11-18');
    eq(dates.today(new Date(2026, 10, 18, 23, 45)), '2026-11-18');
    eq(dates.today(new Date(2027, 0, 1, 0, 0)), '2027-01-01');
    eq(dates.today(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
  });

  test('dates.today and nowTime: read the clock through dates.now, the one seam', function () {
    const real = dates.now;
    try {
      dates.now = function () { return new Date(2026, 10, 18, 1, 30); };
      eq(dates.today(), '2026-11-18');
      eq(dates.nowTime(), '01:30');
      ok(dates.isStamp(dates.stamp()));
      eq(dates.localDay(dates.stamp()), '2026-11-18');
    } finally {
      dates.now = real;
    }
    ok(dates.now() instanceof Date);
    ok(dates.isDate(dates.today()));
  });

  test('dates.nowTime: 24-hour HH:MM', function () {
    eq(dates.nowTime(new Date(2026, 10, 18, 9, 5)), '09:05');
    eq(dates.nowTime(new Date(2026, 10, 18, 0, 0)), '00:00');
    eq(dates.nowTime(new Date(2026, 10, 18, 23, 59)), '23:59');
  });

  test('dates.diffDays: whole days from the first date to the second', function () {
    eq(dates.diffDays('2026-11-18', '2026-11-18'), 0);
    eq(dates.diffDays('2026-11-18', '2026-11-19'), 1);
    eq(dates.diffDays('2026-11-19', '2026-11-18'), -1);
    eq(dates.diffDays('2026-12-31', '2027-01-01'), 1);
    eq(dates.diffDays('2026-03-20', '2026-04-03'), 14);   // across a clock change
    eq(dates.diffDays('2026-10-20', '2026-11-03'), 14);
    eq(dates.diffDays('2026-01-01', '2027-01-01'), 365);
    eq(dates.diffDays('2028-01-01', '2029-01-01'), 366);
    const days = calendar(2026, 2);
    for (let i = 0; i < days.length; i += 3) {
      if (dates.diffDays(days[0], days[i]) !== i) throw new Error('diffDays wrong at ' + days[i]);
    }
  });

  test('dates.weekday: 1 is Monday, 7 is Sunday', function () {
    eq(dates.weekday('2026-11-18'), 3);   // a Wednesday
    eq(dates.weekday('2026-11-22'), 7);
    eq(dates.weekday('2026-11-23'), 1);
    eq(dates.weekday('2026-12-16'), 3);
    eq(dates.weekday('2028-02-29'), 2);
  });

  test('dates: month keys', function () {
    eq(dates.monthKey('2026-11-18'), '2026-11');
    eq(dates.monthStart('2026-11'), '2026-11-01');
    eq(dates.monthEnd('2026-11'), '2026-11-30');
    eq(dates.monthEnd('2028-02'), '2028-02-29');
    eq(dates.monthEnd('2027-02'), '2027-02-28');
    eq(dates.daysInMonth('2026-12'), 31);
    eq(dates.addMonths('2026-12', 1), '2027-01');
    eq(dates.addMonths('2026-01', -1), '2025-12');
    eq(dates.addMonths('2026-11', -11), '2025-12');
    eq(dates.addMonths('2026-11', 0), '2026-11');
    ok(dates.isMonthKey('2026-11'));
    ok(!dates.isMonthKey('2026-13'));
    ok(!dates.isMonthKey('2026-11-18'));
  });

  test('dates.make and parts', function () {
    eq(dates.make(2026, 11, 18), '2026-11-18');
    eq(dates.make(2026, 12, 32), '2027-01-01');
    eq(dates.parts('2026-11-18'), { y: 2026, m: 11, d: 18 });
    throws(function () { dates.parts('18/11/2026'); });
  });

  test('dates.isDate, isTime, isStamp: only the stored forms are accepted', function () {
    ok(dates.isDate('2026-11-18'));
    ok(dates.isDate('2028-02-29'));
    ok(!dates.isDate('2027-02-29'));
    ok(!dates.isDate('2026-02-30'));
    ok(!dates.isDate('2026-13-01'));
    ok(!dates.isDate('2026-2-3'));
    ok(!dates.isDate('18/11/2026'));
    ok(!dates.isDate(''));
    ok(!dates.isDate(null));
    ok(!dates.isDate(20261118));
    ok(dates.isTime('00:00'));
    ok(dates.isTime('14:00'));
    ok(dates.isTime('23:59'));
    ok(!dates.isTime('24:00'));
    ok(!dates.isTime('9:05'));
    ok(!dates.isTime('14:60'));
    ok(!dates.isTime('2 pm'));
    ok(!dates.isTime(null));
    ok(dates.isStamp('2026-11-18T08:12:44.000Z'));
    ok(dates.isStamp('2026-11-18T08:12:44Z'));
    ok(!dates.isStamp('2026-11-18'));
    ok(!dates.isStamp('2026-11-18T08:12:44+02:00'));
    ok(!dates.isStamp('2026-02-30T08:12:44.000Z'));
    ok(!dates.isStamp(1795000000000));
    ok(!dates.isStamp(null));
  });

  test('dates.localDay and localTime: the local day and time of an audit stamp', function () {
    const stamp = dates.stamp(new Date(2026, 10, 18, 1, 30));
    ok(dates.isStamp(stamp));
    eq(dates.localDay(stamp), '2026-11-18');
    eq(dates.localTime(stamp), '01:30');
    eq(dates.localDay(dates.stamp(new Date(2026, 10, 18, 23, 30))), '2026-11-18');
    eq(dates.localDay('not a stamp'), null);
    eq(dates.localDay(null), null);
    ok(isNaN(dates.stampMs('2026-11-18')));
    eq(dates.stampMs('2026-11-18T00:00:00.000Z'), Date.UTC(2026, 10, 18));
  });

  test('dates.format: the four styles in en-GB', function () {
    const today = '2026-11-18';
    eq(dates.format('2026-12-16', 'short', 'en-GB', today), 'Wed 16 Dec');
    eq(dates.format('2026-12-16', 'long', 'en-GB', today), 'Wednesday 16 December');
    eq(dates.format('2026-11-18', 'month', 'en-GB', today), 'November 2026');
    eq(dates.format('2026-11-18', 'monthShort', 'en-GB', today), 'Nov');
    eq(dates.format('2026-11', 'month', 'en-GB', today), 'November 2026');
    eq(dates.format('2026-11', 'monthShort', 'en-GB', today), 'Nov');
    eq(dates.format('2026-11-01', 'short', 'en-GB', today), 'Sun 1 Nov');
    eq(dates.format('2026-11-18', 'long', undefined, today), 'Wednesday 18 November');
    eq(dates.format('2026-11-12', 'full', 'en-GB', today), 'Thursday 12 Nov 2026');
    eq(dates.format('2025-03-01', 'full', 'en-GB', today), 'Saturday 1 Mar 2025');
  });

  test('dates.format: the year is added when it is not the current year', function () {
    const today = '2026-11-18';
    eq(dates.format('2027-12-16', 'short', 'en-GB', today), 'Thu 16 Dec 2027');
    eq(dates.format('2027-12-16', 'long', 'en-GB', today), 'Thursday 16 December 2027');
    eq(dates.format('2025-07-01', 'monthShort', 'en-GB', today), 'Jul 2025');
    eq(dates.format('2025-07-01', 'month', 'en-GB', today), 'July 2025');
    eq(dates.format('2026-01-01', 'short', 'en-GB', '2026-12-31'), 'Thu 1 Jan');
    eq(dates.format('2027-01-01', 'short', 'en-GB', '2026-12-31'), 'Fri 1 Jan 2027');
  });

  test('dates.format: other languages, and the device language, give a date too', function () {
    const he = dates.format('2026-12-16', 'long', 'he', '2026-11-18');
    ok(he.indexOf('16') !== -1 && he.indexOf('December') === -1, 'Hebrew date: ' + he);
    const fr = dates.format('2026-12-16', 'long', 'fr', '2026-11-18');
    eq(fr, 'mercredi 16 décembre');
    ok(dates.format('2026-12-16', 'long', 'device', '2026-11-18').indexOf('16') !== -1);
    throws(function () { dates.format('2026-12-16', 'tiny'); });
  });
})(window.Laser);

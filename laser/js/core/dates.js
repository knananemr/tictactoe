// js/core/dates.js
// The only place date and time maths happens (4.1).
// A calendar date is the string YYYY-MM-DD. A time of day is the string HH:MM.
// A date string is never turned into a Date in local time: all arithmetic is done in UTC.
(function (L) {
  'use strict';

  const DAY_MS = 86400000;
  const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
  const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
  const STAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function pad4(n) {
    let s = String(n);
    while (s.length < 4) s = '0' + s;
    return s;
  }

  // ---- the clock seam --------------------------------------------------------------------

  // The one place the clock is read. Everything else calls L.core.dates.now().
  function now() { return new Date(); }

  function clock(at) { return at instanceof Date ? at : L.core.dates.now(); }

  // Today's calendar date, from the device's local getters.
  function today(at) {
    const d = clock(at);
    return pad4(d.getFullYear()) + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  // The local wall-clock time as HH:MM.
  function nowTime(at) {
    const d = clock(at);
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  // An audit stamp: ISO 8601 in UTC. Only for createdAt, updatedAt, deletedAt, at.
  function stamp(at) { return clock(at).toISOString(); }

  // ---- checks ----------------------------------------------------------------------------

  function daysInMonthOf(y, m) {
    if (m === 2) return (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28;
    return (m === 4 || m === 6 || m === 9 || m === 11) ? 30 : 31;
  }

  function isDate(value) {
    if (typeof value !== 'string' || value.length !== 10) return false;
    const m = DATE_RE.exec(value);
    if (!m) return false;
    const y = +m[1], mo = +m[2], d = +m[3];
    return y >= 1 && mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonthOf(y, mo);
  }

  function isTime(value) { return typeof value === 'string' && TIME_RE.test(value); }

  function isMonthKey(value) { return typeof value === 'string' && MONTH_RE.test(value); }

  function isStamp(value) {
    return typeof value === 'string' && STAMP_RE.test(value) && isDate(value.slice(0, 10));
  }

  // ---- arithmetic ------------------------------------------------------------------------

  function parts(date) {
    const m = DATE_RE.exec(date);
    if (!m) throw new Error('Not a date: ' + date);
    return { y: +m[1], m: +m[2], d: +m[3] };
  }

  // Milliseconds of 00:00 UTC on that calendar date.
  function utc(date) {
    const p = parts(date);
    return Date.UTC(p.y, p.m - 1, p.d);
  }

  function fromUtc(ms) {
    const d = new Date(ms);
    return pad4(d.getUTCFullYear()) + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
  }

  // make(2026, 11, 18) -> '2026-11-18'. Out-of-range days and months roll over, as in Date.UTC.
  function make(y, m, d) { return fromUtc(Date.UTC(y, m - 1, d)); }

  function addDays(date, n) {
    const p = parts(date);
    return fromUtc(Date.UTC(p.y, p.m - 1, p.d + n));
  }

  // Whole days from `from` to `to`: positive when `to` is later.
  function diffDays(from, to) {
    return Math.round((utc(to) - utc(from)) / DAY_MS);
  }

  // 1 = Monday ... 7 = Sunday.
  function weekday(date) {
    const day = new Date(utc(date)).getUTCDay();
    return day === 0 ? 7 : day;
  }

  // ---- months ----------------------------------------------------------------------------

  function monthKey(date) { return date.slice(0, 7); }

  function monthStart(key) { return key + '-01'; }

  function daysInMonth(key) {
    const m = MONTH_RE.exec(key);
    if (!m) throw new Error('Not a month: ' + key);
    return daysInMonthOf(+m[1], +m[2]);
  }

  function monthEnd(key) { return key + '-' + pad2(daysInMonth(key)); }

  function addMonths(key, n) {
    const m = MONTH_RE.exec(key);
    if (!m) throw new Error('Not a month: ' + key);
    const d = new Date(Date.UTC(+m[1], +m[2] - 1 + n, 1));
    return pad4(d.getUTCFullYear()) + '-' + pad2(d.getUTCMonth() + 1);
  }

  // ---- stamps ----------------------------------------------------------------------------

  // Milliseconds of an audit stamp, or NaN.
  function stampMs(value) {
    return isStamp(value) ? Date.parse(value) : NaN;
  }

  // The local calendar day on which an audit stamp fell, or null.
  function localDay(value) {
    const ms = stampMs(value);
    if (isNaN(ms)) return null;
    return today(new Date(ms));
  }

  // The local time of day (HH:MM) of an audit stamp, or null.
  function localTime(value) {
    const ms = stampMs(value);
    if (isNaN(ms)) return null;
    return nowTime(new Date(ms));
  }

  // ---- display ---------------------------------------------------------------------------

  const STYLES = {
    short: { weekday: 'short', day: 'numeric', month: 'short' },
    long: { weekday: 'long', day: 'numeric', month: 'long' },
    full: { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' },
    month: { month: 'long', year: 'numeric' },
    monthShort: { month: 'short' }
  };
  const formatters = {};

  function formatter(locale, style, withYear) {
    const id = String(locale) + '|' + style + '|' + (withYear ? 'y' : '');
    if (!formatters[id]) {
      const options = Object.assign({ timeZone: 'UTC' }, STYLES[style]);
      if (withYear) options.year = 'numeric';
      formatters[id] = new Intl.DateTimeFormat(locale, options);
    }
    return formatters[id];
  }

  // format('2026-12-16', 'short') -> "Wed 16 Dec"
  // Styles: short "Wed 16 Dec", long "Wednesday 16 December", month "November 2026",
  // monthShort "Nov", full "Thursday 12 Nov 2026" (the day a backup was saved, 3.7).
  // The year is added when it is not the current year (month and full always have it).
  // `date` may also be a month key (YYYY-MM) for the two month styles.
  // locale: 'en-GB' by default; 'device' means the device's own language.
  // todayDate: only for tests; decides what "the current year" is.
  function format(date, style, locale, todayDate) {
    if (!STYLES[style]) throw new Error('Unknown date style: ' + style);
    const full = isMonthKey(date) ? date + '-01' : date;
    const p = parts(full);
    const loc = (!locale) ? 'en-GB' : (locale === 'device' ? undefined : locale);
    const currentYear = +(todayDate || today()).slice(0, 4);
    const withYear = style !== 'month' && p.y !== currentYear;
    let fmt;
    try {
      fmt = formatter(loc, style, withYear);
    } catch (e) {
      fmt = formatter('en-GB', style, withYear);
    }
    let text = fmt.format(new Date(Date.UTC(p.y, p.m - 1, p.d)));
    // English: "Thu, 16 Dec 2027" in some browsers and "Thu 16 Dec 2027" in others. One form.
    if (/^en\b/i.test(fmt.resolvedOptions().locale)) text = text.replace(/,/g, '');
    return text;
  }

  L.core.dates = {
    now: now,
    today: today,
    nowTime: nowTime,
    stamp: stamp,
    isDate: isDate,
    isTime: isTime,
    isMonthKey: isMonthKey,
    isStamp: isStamp,
    parts: parts,
    make: make,
    addDays: addDays,
    diffDays: diffDays,
    weekday: weekday,
    monthKey: monthKey,
    monthStart: monthStart,
    monthEnd: monthEnd,
    daysInMonth: daysInMonth,
    addMonths: addMonths,
    stampMs: stampMs,
    localDay: localDay,
    localTime: localTime,
    format: format
  };
})(window.Laser);

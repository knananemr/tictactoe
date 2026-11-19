// js/core/schema.js
// The full version 1 schema of section 4: fixed lists, defaults, record factories,
// normalize (fill and repair), validate (the whole doc) and one check per field (D22).
// The same checks are used by every form, by every save and by import.
// "doc" in the core files always means the app's one data record of blueprint 3.2. Core never
// touches the page, and the short word keeps a search of js/core for the page object empty.
(function (L) {
  'use strict';

  const dates = L.core.dates;
  const util = L.core.util;

  // ---- fixed lists (4.2) -----------------------------------------------------------------

  function list(pairs) {
    return Object.freeze(pairs.map(function (p) {
      return Object.freeze({ value: p[0], label: p[1] });
    }));
  }

  const lists = Object.freeze({
    hairColor: list([
      ['black', 'Black'], ['darkBrown', 'Dark brown'], ['lightBrown', 'Light brown'],
      ['blonde', 'Blonde'], ['red', 'Red'], ['grey', 'Grey / white']
    ]),
    hairThickness: list([['fine', 'Fine'], ['medium', 'Medium'], ['coarse', 'Coarse']]),
    areas: list([
      ['upperLip', 'Upper lip'], ['chin', 'Chin'], ['fullFace', 'Full face'], ['neck', 'Neck'],
      ['underarms', 'Underarms'], ['arms', 'Arms'], ['chest', 'Chest'], ['abdomen', 'Abdomen'],
      ['back', 'Back'], ['bikini', 'Bikini'], ['brazilian', 'Brazilian'],
      ['halfLegs', 'Half legs'], ['fullLegs', 'Full legs'], ['other', 'Other']
    ]),
    skinType: list([
      [1, 'I, very fair, always burns'], [2, 'II, fair, usually burns'],
      [3, 'III, medium, sometimes burns'], [4, 'IV, olive, rarely burns'],
      [5, 'V, brown, very rarely burns'], [6, 'VI, deeply pigmented, never burns']
    ]),
    clientStatus: list([['active', 'Active'], ['paused', 'Paused'], ['finished', 'Course finished']]),
    leadStatus: list([['new', 'New'], ['contacted', 'Contacted'], ['notInterested', 'Not interested']]),
    appointmentStatus: list([
      ['booked', 'Booked'], ['done', 'Done'], ['cancelled', 'Cancelled'], ['noShow', 'No-show']
    ]),
    slotAction: list([['sent', 'sent'], ['skipped', 'skipped']]),
    channel: list([['whatsapp', 'whatsapp'], ['sms', 'sms'], ['email', 'email'], ['copy', 'copy']]),
    whatsappOnComputer: list([
      ['browser', 'In the browser'], ['app', 'WhatsApp app'], ['web', 'WhatsApp Web']
    ]),
    messageLocale: list([
      ['en-GB', 'English'], ['device', "My device's language"], ['he', 'Hebrew'], ['ar', 'Arabic'],
      ['ru', 'Russian'], ['fr', 'French'], ['es', 'Spanish'], ['de', 'German']
    ]),
    homeDevice: list([['laptop', 'This computer'], ['phone', 'My phone']])
  });

  const sets = {};
  Object.keys(lists).forEach(function (name) {
    sets[name] = new Set(lists[name].map(function (item) { return item.value; }));
  });

  // label('hairColor', 'darkBrown') -> 'Dark brown'; '' for a value that is not in the list.
  function label(listName, value) {
    const items = lists[listName] || [];
    for (let i = 0; i < items.length; i++) if (items[i].value === value) return items[i].label;
    return '';
  }

  // ---- currencies and regions (3.9, 4.6) -------------------------------------------------

  const currencies = list([
    ['ILS', 'Israeli new shekel'], ['USD', 'US dollar'], ['EUR', 'Euro'], ['GBP', 'British pound'],
    ['CAD', 'Canadian dollar'], ['AUD', 'Australian dollar'], ['NZD', 'New Zealand dollar'],
    ['CHF', 'Swiss franc'], ['SEK', 'Swedish krona'], ['NOK', 'Norwegian krone'],
    ['DKK', 'Danish krone'], ['PLN', 'Polish zloty'], ['CZK', 'Czech koruna'],
    ['HUF', 'Hungarian forint'], ['RON', 'Romanian leu'], ['RUB', 'Russian rouble'],
    ['UAH', 'Ukrainian hryvnia'], ['TRY', 'Turkish lira'], ['AED', 'UAE dirham'],
    ['SAR', 'Saudi riyal'], ['QAR', 'Qatari riyal'], ['KWD', 'Kuwaiti dinar'],
    ['JOD', 'Jordanian dinar'], ['EGP', 'Egyptian pound'], ['INR', 'Indian rupee'],
    ['CNY', 'Chinese yuan'], ['JPY', 'Japanese yen'], ['KRW', 'South Korean won'],
    ['SGD', 'Singapore dollar'], ['ZAR', 'South African rand'], ['BRL', 'Brazilian real'],
    ['MXN', 'Mexican peso'], ['ARS', 'Argentine peso']
  ]).map(function (item) { return Object.freeze({ code: item.value, name: item.label }); });
  Object.freeze(currencies);

  // region -> [currency, country code]
  const REGIONS = {
    IL: ['ILS', '972'], US: ['USD', '1'], CA: ['CAD', '1'], GB: ['GBP', '44'], IE: ['EUR', '353'],
    FR: ['EUR', '33'], DE: ['EUR', '49'], ES: ['EUR', '34'], IT: ['EUR', '39'], NL: ['EUR', '31'],
    BE: ['EUR', '32'], AT: ['EUR', '43'], PT: ['EUR', '351'], GR: ['EUR', '30'], FI: ['EUR', '358'],
    CY: ['EUR', '357'], HR: ['EUR', '385'], BG: ['EUR', '359'], CH: ['CHF', '41'], SE: ['SEK', '46'],
    NO: ['NOK', '47'], DK: ['DKK', '45'], PL: ['PLN', '48'], CZ: ['CZK', '420'], HU: ['HUF', '36'],
    RO: ['RON', '40'], RU: ['RUB', '7'], UA: ['UAH', '380'], TR: ['TRY', '90'], AE: ['AED', '971'],
    SA: ['SAR', '966'], QA: ['QAR', '974'], KW: ['KWD', '965'], JO: ['JOD', '962'], EG: ['EGP', '20'],
    IN: ['INR', '91'], CN: ['CNY', '86'], JP: ['JPY', '81'], KR: ['KRW', '82'], SG: ['SGD', '65'],
    AU: ['AUD', '61'], NZ: ['NZD', '64'], ZA: ['ZAR', '27'], BR: ['BRL', '55'], MX: ['MXN', '52'],
    AR: ['ARS', '54']
  };

  let supported = null;   // Set of the currency codes this browser knows

  function supportedCurrencies() {
    if (supported) return supported;
    let codes = null;
    try {
      if (typeof Intl.supportedValuesOf === 'function') codes = Intl.supportedValuesOf('currency');
    } catch (e) { codes = null; }
    if (!codes || !codes.length) codes = currencies.map(function (c) { return c.code; });
    supported = new Set(codes);
    return supported;
  }

  // true for a currency code the app accepts: one the browser lists, or, where the browser
  // has no list, one of the built-in common currencies.
  function isCurrency(code) {
    return typeof code === 'string' && /^[A-Z]{3}$/.test(code) && supportedCurrencies().has(code);
  }

  // currencyName('ILS') -> 'Israeli new shekel'. For a code outside the built-in list the
  // browser's own English name, or the code itself.
  function currencyName(code) {
    for (let i = 0; i < currencies.length; i++) if (currencies[i].code === code) return currencies[i].name;
    try {
      const name = new Intl.DisplayNames('en', { type: 'currency' }).of(code);
      if (name) return name;
    } catch (e) { /* fall through */ }
    return String(code || '');
  }

  // suggestRegion('he-IL') -> { region: 'IL', currency: 'ILS', currencyName: 'Israeli new shekel',
  //                             countryCode: '972' }
  // An unknown region gives { region: null, currency: null, currencyName: '', countryCode: '' }.
  // A tag with no region ('he') is completed by the browser ('he' -> IL) where it can.
  function suggestRegion(languageTag) {
    const none = { region: null, currency: null, currencyName: '', countryCode: '' };
    const tag = String(languageTag || '');
    let region = null;
    const m = /^[A-Za-z]{2,3}(?:[-_][A-Za-z]{4})?[-_]([A-Za-z]{2})(?:[-_]|$)/.exec(tag);
    if (m) {
      region = m[1].toUpperCase();
    } else {
      try { region = new Intl.Locale(tag).maximize().region || null; } catch (e) { region = null; }
    }
    if (!region || !REGIONS[region]) return none;
    const currency = REGIONS[region][0];
    if (!isCurrency(currency)) return none;
    return {
      region: region, currency: currency, currencyName: currencyName(currency),
      countryCode: REGIONS[region][1]
    };
  }

  // setCurrency(settings, 'ILS') writes the currency and, with it, the number of decimals the
  // browser reports for it (4.1: read once, when the currency is chosen, then only the stored
  // number is used). setCurrency(settings, null) clears the currency and keeps the decimals.
  // Changes `settings` in place (use it inside a commit) and returns it.
  function setCurrency(settings, code) {
    settings.currency = code;
    if (code !== null) settings.currencyDecimals = L.core.money.decimalsFor(code);
    return settings;
  }

  // ---- limits and defaults ---------------------------------------------------------------

  const LIMITS = Object.freeze({
    name: 80, phone: 30, email: 120, notes: 2000, leadInterest: 120,
    appointmentNotes: 1000, paymentNote: 200, template: 1000, currencySymbol: 4,
    ownerWhatsApp: 30, requestPageUrl: 200
  });

  const TEMPLATES = Object.freeze({
    before: 'Hi {name}, a reminder of your laser session on {date} at {time}. Please shave the area ' +
      'the day before, avoid sun and self-tan, and come with clean skin (no lotion or deodorant on ' +
      'the area). If you have started any new medication, tell me before we begin. Reply to confirm, ' +
      'or let me know if you need another time.',
    sameDay: 'Hi {name}, see you today at {time}. Shaved, clean skin please.',
    rebook: 'Hi {name}, it has been {weeks} weeks since your last session, which is the ideal time ' +
      'for the next one. Which day suits you?',
    lead: 'Hi {name}, thank you for your interest in laser hair removal. Would you like to book a ' +
      'first session? I am happy to answer any questions.'
  });

  function defaultSettings() {
    return {
      currency: null,
      currencyDecimals: 2,
      countryCode: '',
      whatsappOnComputer: 'browser',
      usualPriceMinor: null,
      trackBalances: false,
      rebookWeeks: 4,
      messageLocale: 'en-GB',
      templates: {
        before: TEMPLATES.before, sameDay: TEMPLATES.sameDay,
        rebook: TEMPLATES.rebook, lead: TEMPLATES.lead
      },
      reminderDaysBefore: 2,
      sameDayHoursBefore: 2,
      currencySymbol: null,
      quickPickWeeks: [4, 6, 8],
      sessionMinutes: 30,
      rebookHeadsUpDays: 7,
      askAgainDays: 7,
      eveningFrom: '18:00',
      dailyAlarmTime: '08:30',
      dailyAlarmDays: [1, 2, 3, 4, 5, 6, 7],
      ownerWhatsApp: '',
      requestPageUrl: '',
      investPercent: 0
    };
  }

  function defaultMeta(today) {
    return {
      startedOn: today,
      welcomeDone: false,
      lastExportAt: null,
      backupCheckedAt: null,
      changesSinceExport: 0,
      unsavedSince: null,
      lastCopyOn: null,
      homeDevice: null,
      reopenedAt: null,
      persist: null
    };
  }

  // A new, empty doc (3.2). `now` is a Date; left out, the clock is read.
  function emptyDoc(now) {
    const at = now instanceof Date ? now : dates.now();
    return {
      app: L.APP_ID,
      schemaVersion: L.DATA_FORMAT,
      rev: 0,
      createdAt: dates.stamp(at),
      meta: defaultMeta(dates.today(at)),
      settings: defaultSettings(),
      people: [],
      appointments: [],
      payments: []
    };
  }

  // ---- record factories ------------------------------------------------------------------

  function optionsNow(options) {
    return options && options.now instanceof Date ? options.now : dates.now();
  }

  function trimmed(value) { return typeof value === 'string' ? value.trim() : value; }

  // Copies the given values over the defaults. A value that is undefined is skipped, so a
  // form may pass a field it did not fill without wiping the default.
  function take(record, values) {
    const keys = Object.keys(values || {});
    for (let i = 0; i < keys.length; i++) {
      if (values[keys[i]] !== undefined) record[keys[i]] = values[keys[i]];
    }
    return record;
  }

  function personDefaults() {
    return {
      id: null, name: '', phone: '', email: '',
      hairColor: null, hairThickness: null, notes: '', areas: [], skinType: null,
      intervalWeeks: null, priorSessions: 0, priorPaidMinor: 0,
      clientSince: null, clientStatus: 'active',
      leadSince: null, leadStatus: null, leadInterest: '', followUpOn: null,
      rebookAskedOn: null, rebookAsks: 0, rebookSnoozeUntil: null, rebookFor: null,
      createdAt: null, updatedAt: null, deletedAt: null
    };
  }

  // newPerson({ name, phone, email, clientSince, ... }, { now, lead })
  // A client by default: clientSince is values.clientSince, or today when it is left out.
  // With { lead: true }: clientSince null, leadSince today, leadStatus 'new'.
  // name, phone and email are trimmed. Nothing is checked here: commit validates.
  function newPerson(values, options) {
    const at = optionsNow(options);
    const today = dates.today(at);
    const stamp = dates.stamp(at);
    const lead = !!(options && options.lead);
    const p = personDefaults();
    p.id = util.uid();
    p.clientSince = lead ? null : today;
    p.leadSince = lead ? today : null;
    p.leadStatus = lead ? 'new' : null;
    p.createdAt = stamp;
    p.updatedAt = stamp;
    take(p, values);
    p.name = trimmed(p.name);
    p.phone = trimmed(p.phone);
    p.email = trimmed(p.email);
    return p;
  }

  function appointmentDefaults() {
    return {
      id: null, personId: null, date: null, time: null, status: 'booked', scheduledOn: null,
      areas: [], priceMinor: null, notes: '', reminderBefore: null, reminderSameDay: null,
      createdAt: null, updatedAt: null, deletedAt: null
    };
  }

  // newAppointment({ personId, date, time, status, ... }, { now })
  function newAppointment(values, options) {
    const at = optionsNow(options);
    const stamp = dates.stamp(at);
    const a = appointmentDefaults();
    a.id = util.uid();
    a.scheduledOn = dates.today(at);
    a.createdAt = stamp;
    a.updatedAt = stamp;
    return take(a, values);
  }

  function paymentDefaults() {
    return {
      id: null, personId: null, appointmentId: null, paidOn: null, amountMinor: null, note: '',
      createdAt: null, updatedAt: null, deletedAt: null
    };
  }

  // newPayment({ personId, amountMinor, appointmentId, paidOn, note }, { now })
  function newPayment(values, options) {
    const at = optionsNow(options);
    const stamp = dates.stamp(at);
    const p = paymentDefaults();
    p.id = util.uid();
    p.paidOn = dates.today(at);
    p.createdAt = stamp;
    p.updatedAt = stamp;
    return take(p, values);
  }

  // Stamps updatedAt on a record that was changed. Returns the record.
  function touch(record, now) {
    record.updatedAt = dates.stamp(now instanceof Date ? now : dates.now());
    return record;
  }

  // Soft delete (4.1): stamps deletedAt and updatedAt. Returns the record.
  function markDeleted(record, now) {
    const stamp = dates.stamp(now instanceof Date ? now : dates.now());
    record.deletedAt = stamp;
    record.updatedAt = stamp;
    return record;
  }

  // ---- "Client since" in the form (4.3, 7.9) ---------------------------------------------

  // The date stored for "Earlier" with no date: the day before the app was first used.
  function earlierDate(doc) {
    return dates.addDays(doc.meta.startedOn, -1);
  }

  const clientSince = {
    earlierDate: earlierDate,
    // fromChoice('today' | 'earlier', dateOrEmpty, doc, today) -> the date to store
    fromChoice: function (choice, date, doc, today) {
      if (choice === 'earlier') return date ? date : earlierDate(doc);
      return today || dates.today();
    },
    // toChoice(storedDate, doc, today) -> { choice: 'today' | 'earlier', date: '' | 'YYYY-MM-DD' }
    // 'today' only when the stored date is today; date is '' when none was given.
    toChoice: function (stored, doc, today) {
      const day = today || dates.today();
      if (stored === day) return { choice: 'today', date: '' };
      if (stored === earlierDate(doc)) return { choice: 'earlier', date: '' };
      return { choice: 'earlier', date: stored || '' };
    }
  };

  // ---- per-field checks (D22) ------------------------------------------------------------
  // Each takes the value as it would be stored and returns null (fine) or a short message.

  const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
  const EMAIL_RE = /^[^@\s]+@[^@\s]+$/;
  const COUNTRY_RE = /^\d{1,4}$/;

  function isInt(v) { return typeof v === 'number' && Number.isInteger(v); }
  function isRecord(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  function tooLong(max) { return 'Use ' + max.toLocaleString('en') + ' characters or fewer'; }

  function textUpTo(max) {
    return function (v) {
      if (typeof v !== 'string') return 'Must be text';
      return v.length > max ? tooLong(max) : null;
    };
  }

  function intBetween(min, max) {
    const message = 'Enter a whole number from ' + min + ' to ' + max;
    return function (v) { return (isInt(v) && v >= min && v <= max) ? null : message; };
  }

  function orNull(fn) {
    return function (v, extra) { return v === null ? null : fn(v, extra); };
  }

  function oneOf(set) {
    return function (v) { return set.has(v) ? null : 'Not one of the choices'; };
  }

  function wholeFromZero(v) {
    return (isInt(v) && v >= 0) ? null : 'Enter a whole number, 0 or more';
  }

  function dateCheck(v) { return dates.isDate(v) ? null : 'Enter a valid date'; }
  function timeCheck(v) { return dates.isTime(v) ? null : 'Enter a time, for example 14:00'; }
  function stampCheck(v) { return dates.isStamp(v) ? null : 'Must be a date and time stamp'; }

  function areasCheck(v) {
    if (!Array.isArray(v)) return 'Must be a list';
    for (let i = 0; i < v.length; i++) {
      if (!sets.areas.has(v[i])) return 'Not one of the choices';
      if (v.indexOf(v[i]) !== i) return 'An area is listed twice';
    }
    return null;
  }

  function slotCheck(v) {
    if (v === null) return null;
    if (!isRecord(v)) return 'Must be a reminder record';
    if (!sets.slotAction.has(v.action)) return 'Not one of the choices';
    if (v.channel !== null && !sets.channel.has(v.channel)) return 'Not one of the choices';
    if (!dates.isStamp(v.at)) return 'Must be a date and time stamp';
    if (!dates.isDate(v.forDate)) return 'Enter a valid date';
    if (!dates.isTime(v.forTime)) return 'Enter a time, for example 14:00';
    return null;
  }

  function intListCheck(minCount, maxCount, minValue, maxValue, message) {
    return function (v) {
      if (!Array.isArray(v)) return 'Must be a list';
      if (v.length < minCount || v.length > maxCount) return message;
      for (let i = 0; i < v.length; i++) {
        if (!isInt(v[i]) || v[i] < minValue || v[i] > maxValue) return message;
        if (v.indexOf(v[i]) !== i) return message;
      }
      return null;
    };
  }

  const check = {
    // shared
    id: function (v) { return (typeof v === 'string' && ID_RE.test(v)) ? null : 'Must be an id'; },
    idOrNull: function (v) { return v === null ? null : check.id(v); },
    date: dateCheck,
    dateOrNull: orNull(dateCheck),
    time: timeCheck,
    timeOrNull: orNull(timeCheck),
    stamp: stampCheck,
    stampOrNull: orNull(stampCheck),
    yesNo: function (v) { return typeof v === 'boolean' ? null : 'Must be yes or no'; },
    count: wholeFromZero,

    // person (4.3)
    personName: function (v) {
      if (typeof v !== 'string' || v.trim() === '') return 'Enter a name';
      return v.trim().length > LIMITS.name ? tooLong(LIMITS.name) : null;
    },
    phone: textUpTo(LIMITS.phone),
    email: function (v) {
      if (typeof v !== 'string') return 'Must be text';
      if (v === '') return null;
      if (v.length > LIMITS.email) return tooLong(LIMITS.email);
      return EMAIL_RE.test(v) ? null : 'Enter an email address like name@example.com';
    },
    hairColor: orNull(oneOf(sets.hairColor)),
    hairThickness: orNull(oneOf(sets.hairThickness)),
    notes: textUpTo(LIMITS.notes),
    areas: areasCheck,
    skinType: orNull(function (v) {
      return (isInt(v) && v >= 1 && v <= 6) ? null : 'Not one of the choices';
    }),
    intervalWeeks: orNull(intBetween(1, 26)),
    priorSessions: intBetween(0, 999),
    priorPaidMinor: wholeFromZero,
    // With `today` (the form passes it) a future date is refused too.
    clientSince: function (v, today) {
      if (v === null) return null;
      if (!dates.isDate(v)) return 'Enter a valid date';
      return (today && v > today) ? 'The date cannot be in the future' : null;
    },
    clientStatus: oneOf(sets.clientStatus),
    leadStatus: orNull(oneOf(sets.leadStatus)),
    leadInterest: textUpTo(LIMITS.leadInterest),
    rebookAsks: wholeFromZero,

    // appointment (4.4)
    appointmentStatus: oneOf(sets.appointmentStatus),
    appointmentNotes: textUpTo(LIMITS.appointmentNotes),
    priceMinor: orNull(wholeFromZero),
    slot: slotCheck,

    // payment (4.5)
    amount: function (v) {
      if (!isInt(v)) return 'Must be a whole number of minor units';
      return v === 0 ? 'Enter an amount that is not 0' : null;
    },
    paymentNote: textUpTo(LIMITS.paymentNote),

    // settings (4.6)
    currency: function (v) {
      if (v === null) return null;
      return isCurrency(v) ? null : 'Choose a currency from the list';
    },
    currencyDecimals: intBetween(0, 4),
    countryCode: function (v) {
      if (typeof v !== 'string') return 'Must be text';
      return (v === '' || COUNTRY_RE.test(v)) ? null : 'Use 1 to 4 digits, for example 972';
    },
    whatsappOnComputer: oneOf(sets.whatsappOnComputer),
    usualPriceMinor: orNull(wholeFromZero),
    rebookWeeks: intBetween(1, 26),
    messageLocale: oneOf(sets.messageLocale),
    template: textUpTo(LIMITS.template),
    templates: function (v) {
      if (!isRecord(v)) return 'Must be a set of message texts';
      const keys = ['before', 'sameDay', 'rebook', 'lead'];
      for (let i = 0; i < keys.length; i++) {
        const message = check.template(v[keys[i]]);
        if (message) return message;
      }
      return null;
    },
    reminderDaysBefore: function (v) {
      return (v === 0 || v === 1 || v === 2 || v === 3 || v === 7) ? null : 'Not one of the choices';
    },
    sameDayHoursBefore: function (v) {
      return (v === 0 || v === 1 || v === 2 || v === 3) ? null : 'Not one of the choices';
    },
    currencySymbol: orNull(textUpTo(LIMITS.currencySymbol)),
    quickPickWeeks: intListCheck(1, 3, 1, 26, 'Use 1 to 3 different numbers of weeks, each from 1 to 26'),
    sessionMinutes: intBetween(5, 240),
    rebookHeadsUpDays: intBetween(0, 14),
    askAgainDays: intBetween(1, 30),
    dailyAlarmDays: intListCheck(1, 7, 1, 7, 'Choose at least one day'),
    ownerWhatsApp: textUpTo(LIMITS.ownerWhatsApp),
    requestPageUrl: function (v) {
      if (typeof v !== 'string') return 'Must be text';
      if (v === '') return null;
      if (v.length > LIMITS.requestPageUrl) return tooLong(LIMITS.requestPageUrl);
      return L.core.links.isSecureAddress(v) ? null : 'The address must start with ' + L.core.links.securePrefix;
    },
    investPercent: intBetween(0, 100),

    // meta (4.7)
    homeDevice: orNull(oneOf(sets.homeDevice)),
    persist: function (v) {
      if (v === null) return null;
      if (!isRecord(v)) return 'Must be a record';
      if (!dates.isStamp(v.askedAt)) return 'Must be a date and time stamp';
      return typeof v.granted === 'boolean' ? null : 'Must be yes or no';
    }
  };

  // field -> check, per kind of record. validate walks these tables, so a form that uses
  // check.<name> on a value always agrees with validate on a doc holding that value.
  const PERSON_FIELDS = [
    ['id', check.id], ['name', check.personName], ['phone', check.phone], ['email', check.email],
    ['hairColor', check.hairColor], ['hairThickness', check.hairThickness], ['notes', check.notes],
    ['areas', check.areas], ['skinType', check.skinType], ['intervalWeeks', check.intervalWeeks],
    ['priorSessions', check.priorSessions], ['priorPaidMinor', check.priorPaidMinor],
    ['clientSince', check.clientSince], ['clientStatus', check.clientStatus],
    ['leadSince', check.dateOrNull], ['leadStatus', check.leadStatus],
    ['leadInterest', check.leadInterest], ['followUpOn', check.dateOrNull],
    ['rebookAskedOn', check.dateOrNull], ['rebookAsks', check.rebookAsks],
    ['rebookSnoozeUntil', check.dateOrNull], ['rebookFor', check.idOrNull],
    ['createdAt', check.stamp], ['updatedAt', check.stamp], ['deletedAt', check.stampOrNull]
  ];
  const APPOINTMENT_FIELDS = [
    ['id', check.id], ['personId', check.id], ['date', check.date], ['time', check.timeOrNull],
    ['status', check.appointmentStatus], ['scheduledOn', check.date], ['areas', check.areas],
    ['priceMinor', check.priceMinor], ['notes', check.appointmentNotes],
    ['reminderBefore', check.slot], ['reminderSameDay', check.slot],
    ['createdAt', check.stamp], ['updatedAt', check.stamp], ['deletedAt', check.stampOrNull]
  ];
  const PAYMENT_FIELDS = [
    ['id', check.id], ['personId', check.id], ['appointmentId', check.idOrNull],
    ['paidOn', check.date], ['amountMinor', check.amount], ['note', check.paymentNote],
    ['createdAt', check.stamp], ['updatedAt', check.stamp], ['deletedAt', check.stampOrNull]
  ];
  const SETTINGS_FIELDS = [
    ['currency', check.currency], ['currencyDecimals', check.currencyDecimals],
    ['countryCode', check.countryCode], ['whatsappOnComputer', check.whatsappOnComputer],
    ['usualPriceMinor', check.usualPriceMinor], ['trackBalances', check.yesNo],
    ['rebookWeeks', check.rebookWeeks], ['messageLocale', check.messageLocale],
    ['templates', check.templates], ['reminderDaysBefore', check.reminderDaysBefore],
    ['sameDayHoursBefore', check.sameDayHoursBefore], ['currencySymbol', check.currencySymbol],
    ['quickPickWeeks', check.quickPickWeeks], ['sessionMinutes', check.sessionMinutes],
    ['rebookHeadsUpDays', check.rebookHeadsUpDays], ['askAgainDays', check.askAgainDays],
    ['eveningFrom', check.time], ['dailyAlarmTime', check.time],
    ['dailyAlarmDays', check.dailyAlarmDays], ['ownerWhatsApp', check.ownerWhatsApp],
    ['requestPageUrl', check.requestPageUrl], ['investPercent', check.investPercent]
  ];
  const META_FIELDS = [
    ['startedOn', check.date], ['welcomeDone', check.yesNo], ['lastExportAt', check.stampOrNull],
    ['backupCheckedAt', check.stampOrNull], ['changesSinceExport', check.count],
    ['unsavedSince', check.stampOrNull], ['lastCopyOn', check.dateOrNull],
    ['homeDevice', check.homeDevice], ['reopenedAt', check.stampOrNull], ['persist', check.persist]
  ];

  // Words for a field in a message that names it (import errors and repairs).
  const FIELD_WORDS = {
    name: 'name', phone: 'phone', email: 'email', hairColor: 'hair colour',
    hairThickness: 'hair thickness', notes: 'note', note: 'note', areas: 'treated areas',
    skinType: 'skin type', intervalWeeks: 'weeks between sessions',
    priorSessions: 'sessions already done', priorPaidMinor: 'already paid in total',
    clientSince: 'client since', clientStatus: 'status', leadInterest: 'interested in',
    followUpOn: 'follow-up date', personId: 'client', appointmentId: 'appointment',
    date: 'date', time: 'time', status: 'status', priceMinor: 'price',
    amountMinor: 'amount', paidOn: 'date', currency: 'currency',
    currencyDecimals: 'currency decimals', countryCode: 'country code',
    whatsappOnComputer: 'WhatsApp on a computer', usualPriceMinor: 'usual price',
    trackBalances: 'track what clients owe', rebookWeeks: 'weeks between sessions',
    messageLocale: 'language of dates in messages', templates: 'message texts',
    reminderDaysBefore: 'days-before reminder', sameDayHoursBefore: 'same-day reminder',
    currencySymbol: 'currency symbol', quickPickWeeks: 'quick date buttons',
    sessionMinutes: 'length of a session', rebookHeadsUpDays: 'ask-to-rebook days',
    askAgainDays: 'ask-again days', eveningFrom: 'evening time', dailyAlarmTime: 'alarm time',
    dailyAlarmDays: 'alarm days', ownerWhatsApp: 'your WhatsApp number',
    requestPageUrl: 'request page address', investPercent: 'invest percent'
  };

  function fieldWords(field) { return FIELD_WORDS[field] || field; }

  // ---- validate (the whole doc) -----------------------------------------------------

  const MAX_ERRORS = 100;

  function recordLabel(collection, record, index) {
    if (collection === 'people') {
      if (isRecord(record) && typeof record.name === 'string' && record.name.trim() !== '') {
        return util.clip(record.name.trim(), 60);
      }
      return 'Person ' + (index + 1);
    }
    if (collection === 'appointments') return 'Appointment ' + (index + 1);
    if (collection === 'payments') return 'Payment ' + (index + 1);
    if (collection === 'settings') return 'Settings';
    if (collection === 'meta') return 'App details';
    return 'The file';
  }

  // validate(doc) -> [] when the doc may be saved, else a list of
  //   { collection, index, id, field, message, label, text }
  // collection: 'root' | 'meta' | 'settings' | 'people' | 'appointments' | 'payments'
  // field: the field name ('' when the record itself is wrong); message: the short message of
  // the field's check; text: one line that names the record, for a list of faults.
  // At most 100 errors are listed.
  function validate(doc) {
    const errors = [];

    function add(collection, record, index, field, message) {
      if (errors.length >= MAX_ERRORS) return;
      const lbl = recordLabel(collection, record, index);
      errors.push({
        collection: collection,
        index: index,
        id: (isRecord(record) && typeof record.id === 'string') ? record.id : null,
        field: field,
        message: message,
        label: lbl,
        text: lbl + (field ? ', ' + fieldWords(field) : '') + ': ' + message
      });
    }

    function walk(collection, record, index, fields) {
      for (let i = 0; i < fields.length; i++) {
        const message = fields[i][1](record[fields[i][0]]);
        if (message !== null) add(collection, record, index, fields[i][0], message);
      }
    }

    if (!isRecord(doc)) {
      add('root', null, -1, '', 'This is not Laser data');
      return errors;
    }
    if (doc.app !== L.APP_ID) add('root', null, -1, 'app', 'This is not Laser data');
    if (doc.schemaVersion !== L.DATA_FORMAT) add('root', null, -1, 'schemaVersion', 'Wrong data format');
    if (!isInt(doc.rev) || doc.rev < 0) add('root', null, -1, 'rev', 'Must be a whole number');
    if (!dates.isStamp(doc.createdAt)) add('root', null, -1, 'createdAt', 'Must be a date and time stamp');

    if (isRecord(doc.meta)) walk('meta', doc.meta, -1, META_FIELDS);
    else add('meta', null, -1, '', 'Must be a record');
    if (isRecord(doc.settings)) walk('settings', doc.settings, -1, SETTINGS_FIELDS);
    else add('settings', null, -1, '', 'Must be a record');

    const people = Array.isArray(doc.people) ? doc.people : null;
    const appointments = Array.isArray(doc.appointments) ? doc.appointments : null;
    const payments = Array.isArray(doc.payments) ? doc.payments : null;
    if (!people) add('root', null, -1, 'people', 'Must be a list');
    if (!appointments) add('root', null, -1, 'appointments', 'Must be a list');
    if (!payments) add('root', null, -1, 'payments', 'Must be a list');
    if (!people || !appointments || !payments) return errors;

    const personById = new Map();
    for (let i = 0; i < people.length; i++) {
      const p = people[i];
      if (!isRecord(p)) { add('people', p, i, '', 'Must be a record'); continue; }
      walk('people', p, i, PERSON_FIELDS);
      if (typeof p.id === 'string') {
        if (personById.has(p.id)) add('people', p, i, 'id', 'Two records share this id');
        else personById.set(p.id, p);
      }
    }

    const appointmentById = new Map();
    for (let i = 0; i < appointments.length; i++) {
      const a = appointments[i];
      if (!isRecord(a)) { add('appointments', a, i, '', 'Must be a record'); continue; }
      walk('appointments', a, i, APPOINTMENT_FIELDS);
      if (typeof a.id === 'string') {
        if (appointmentById.has(a.id)) add('appointments', a, i, 'id', 'Two records share this id');
        else appointmentById.set(a.id, a);
      }
      const live = a.deletedAt === null;
      if (typeof a.personId === 'string') {
        const person = personById.get(a.personId);
        if (!person) {
          add('appointments', a, i, 'personId', 'This client does not exist');
        } else if (live) {
          if (person.deletedAt !== null) add('appointments', a, i, 'personId', 'This client was deleted');
          else if (person.clientSince === null) add('appointments', a, i, 'personId', 'An appointment needs a client');
        }
      }
      if (live && a.status === 'booked' && a.time === null) {
        add('appointments', a, i, 'time', 'A booked appointment needs a time');
      }
    }

    const paidFor = new Set();   // appointments that already have a live payment
    for (let i = 0; i < payments.length; i++) {
      const pay = payments[i];
      if (!isRecord(pay)) { add('payments', pay, i, '', 'Must be a record'); continue; }
      walk('payments', pay, i, PAYMENT_FIELDS);
      const live = pay.deletedAt === null;
      if (typeof pay.personId === 'string') {
        const person = personById.get(pay.personId);
        if (!person) add('payments', pay, i, 'personId', 'This client does not exist');
        else if (live && person.deletedAt !== null) add('payments', pay, i, 'personId', 'This client was deleted');
      }
      if (typeof pay.appointmentId === 'string') {
        const a = appointmentById.get(pay.appointmentId);
        if (!a) {
          add('payments', pay, i, 'appointmentId', 'This appointment does not exist');
        } else {
          if (a.personId !== pay.personId) {
            add('payments', pay, i, 'appointmentId', 'This appointment belongs to another client');
          }
          if (live) {
            if (a.deletedAt !== null) add('payments', pay, i, 'appointmentId', 'This appointment was deleted');
            if (paidFor.has(a.id)) add('payments', pay, i, 'appointmentId', 'Two payments are linked to this appointment');
            paidFor.add(a.id);
            if (pay.paidOn !== a.date) add('payments', pay, i, 'paidOn', 'Must be the date of its appointment');
          }
        }
      }
    }
    return errors;
  }

  // ---- normalize (fill and repair, 3.4 and 3.7) ------------------------------------------

  function fill(record, defaults) {
    const keys = Object.keys(defaults);
    for (let i = 0; i < keys.length; i++) {
      if (record[keys[i]] === undefined) record[keys[i]] = defaults[keys[i]];
    }
  }

  function chars(n) { return n.toLocaleString('en') + ' characters'; }

  function clipField(record, field, max, who, repairs) {
    const v = record[field];
    if (typeof v === 'string' && v.length > max) {
      record[field] = util.clip(v, max);
      repairs.push(who + ': ' + fieldWords(field) + ' shortened to ' + chars(max));
    }
  }

  function repairAreas(record, who, repairs) {
    const v = record.areas;
    if (!Array.isArray(v)) return;
    const kept = [];
    for (let i = 0; i < v.length; i++) {
      if (typeof v[i] !== 'string') { kept.push(v[i]); continue; }   // wrong type: validate rejects
      if (!sets.areas.has(v[i])) {
        repairs.push(who + ": treated area '" + util.clip(v[i], 40) + "' removed");
      } else if (kept.indexOf(v[i]) === -1) {
        kept.push(v[i]);
      }
    }
    if (kept.length !== v.length) record.areas = kept;
  }

  function normalizePerson(p, index, stamp, repairs) {
    fill(p, personDefaults());
    if (p.createdAt === null) p.createdAt = stamp;
    if (p.updatedAt === null) p.updatedAt = p.createdAt;
    const who = recordLabel('people', p, index);
    if (typeof p.name === 'string' && p.name.trim().length > LIMITS.name) {
      p.name = util.clip(p.name.trim(), LIMITS.name);
      repairs.push(who + ': name shortened to ' + chars(LIMITS.name));
    }
    clipField(p, 'phone', LIMITS.phone, who, repairs);
    if (typeof p.email === 'string' && check.email(p.email) !== null) {
      repairs.push(who + ": email '" + util.clip(p.email, 60) + "' removed");
      p.email = '';
    }
    clipField(p, 'notes', LIMITS.notes, who, repairs);
    clipField(p, 'leadInterest', LIMITS.leadInterest, who, repairs);
    if (typeof p.hairColor === 'string' && !sets.hairColor.has(p.hairColor)) {
      repairs.push(who + ": hair colour '" + util.clip(p.hairColor, 40) + "' removed");
      p.hairColor = null;
    }
    if (typeof p.hairThickness === 'string' && !sets.hairThickness.has(p.hairThickness)) {
      repairs.push(who + ": hair thickness '" + util.clip(p.hairThickness, 40) + "' removed");
      p.hairThickness = null;
    }
    repairAreas(p, who, repairs);
    if (isInt(p.skinType) && (p.skinType < 1 || p.skinType > 6)) {
      repairs.push(who + ': skin type ' + p.skinType + ' removed');
      p.skinType = null;
    }
  }

  function shown(value) {
    if (value === null || value === '') return 'empty';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  // What kind of value each setting holds. A value of the right kind that fails its check is
  // "outside its range" (repaired); a value of another kind is a wrong type (refused).
  const SETTINGS_KIND = {
    currency: 'text', currencyDecimals: 'int', countryCode: 'text', whatsappOnComputer: 'text',
    usualPriceMinor: 'int', trackBalances: 'yesNo', rebookWeeks: 'int', messageLocale: 'text',
    reminderDaysBefore: 'int', sameDayHoursBefore: 'int', currencySymbol: 'text',
    quickPickWeeks: 'ints', sessionMinutes: 'int', rebookHeadsUpDays: 'int', askAgainDays: 'int',
    eveningFrom: 'text', dailyAlarmTime: 'text', dailyAlarmDays: 'ints', ownerWhatsApp: 'text',
    requestPageUrl: 'text', investPercent: 'int'
  };

  function rightKind(value, kind) {
    if (kind === 'text') return typeof value === 'string';
    if (kind === 'int') return isInt(value);
    if (kind === 'yesNo') return typeof value === 'boolean';
    if (kind === 'ints') return Array.isArray(value) && value.every(isInt);
    return false;
  }

  function normalizeSettings(s, repairs) {
    const defaults = defaultSettings();
    fill(s, defaults);
    if (isRecord(s.templates)) {
      fill(s.templates, defaults.templates);
      ['before', 'sameDay', 'rebook', 'lead'].forEach(function (key) {
        if (typeof s.templates[key] === 'string' && s.templates[key].length > LIMITS.template) {
          s.templates[key] = util.clip(s.templates[key], LIMITS.template);
          repairs.push('Settings: message text shortened to ' + chars(LIMITS.template));
        }
      });
    }
    if (typeof s.currencySymbol === 'string' && s.currencySymbol.length > LIMITS.currencySymbol) {
      s.currencySymbol = util.clip(s.currencySymbol, LIMITS.currencySymbol);
      repairs.push('Settings: currency symbol shortened to ' + chars(LIMITS.currencySymbol));
    }
    if (typeof s.ownerWhatsApp === 'string' && s.ownerWhatsApp.length > LIMITS.ownerWhatsApp) {
      s.ownerWhatsApp = util.clip(s.ownerWhatsApp, LIMITS.ownerWhatsApp);
      repairs.push('Settings: your WhatsApp number shortened to ' + chars(LIMITS.ownerWhatsApp));
    }
    for (let i = 0; i < SETTINGS_FIELDS.length; i++) {
      const key = SETTINGS_FIELDS[i][0];
      if (key === 'templates') continue;
      const def = defaults[key];
      // a value of the right kind that is outside its range goes back to its default;
      // a value of the wrong kind is left for validate to refuse
      if (SETTINGS_FIELDS[i][1](s[key]) !== null && rightKind(s[key], SETTINGS_KIND[key])) {
        s[key] = def;
        repairs.push('Settings: ' + fieldWords(key) + ' set back to ' + shown(def));
      }
    }
  }

  // normalize(doc) -> { doc, repairs }
  // Runs on every load and import. Changes `doc` in place (pass a clone to keep the original):
  // fills every missing field with its default, keeps unknown fields untouched, and repairs
  // the soft faults of 3.7 (text clipped to its limit, a bad email emptied, an unknown value
  // in an optional list emptied, a setting outside its range back to its default).
  // repairs: one plain sentence per repair, for example "Dana Levi: note shortened to
  // 2,000 characters". Wrong types are left alone: validate then refuses them.
  function normalize(doc) {
    const repairs = [];
    if (!isRecord(doc)) return { doc: doc, repairs: repairs };
    const stamp = dates.stamp();
    if (doc.rev === undefined) doc.rev = 0;
    if (doc.createdAt === undefined) doc.createdAt = stamp;
    if (doc.meta === undefined) doc.meta = {};
    if (doc.settings === undefined) doc.settings = {};
    if (doc.people === undefined) doc.people = [];
    if (doc.appointments === undefined) doc.appointments = [];
    if (doc.payments === undefined) doc.payments = [];

    if (isRecord(doc.meta)) {
      // 4.8 rule 13: startedOn is the local day the doc was created
      fill(doc.meta, defaultMeta(dates.localDay(doc.createdAt) || dates.today()));
    }
    if (isRecord(doc.settings)) normalizeSettings(doc.settings, repairs);

    const names = new Map();
    if (Array.isArray(doc.people)) {
      for (let i = 0; i < doc.people.length; i++) {
        const p = doc.people[i];
        if (!isRecord(p)) continue;
        normalizePerson(p, i, stamp, repairs);
        if (typeof p.id === 'string') names.set(p.id, recordLabel('people', p, i));
      }
    }
    if (Array.isArray(doc.appointments)) {
      for (let i = 0; i < doc.appointments.length; i++) {
        const a = doc.appointments[i];
        if (!isRecord(a)) continue;
        fill(a, appointmentDefaults());
        if (a.createdAt === null) a.createdAt = stamp;
        if (a.updatedAt === null) a.updatedAt = a.createdAt;
        if (a.scheduledOn === null && dates.isDate(a.date)) a.scheduledOn = a.date;
        const who = (names.get(a.personId) || 'Appointment ' + (i + 1)) +
          (dates.isDate(a.date) ? ', ' + a.date : '');
        clipField(a, 'notes', LIMITS.appointmentNotes, who, repairs);
        repairAreas(a, who, repairs);
      }
    }
    if (Array.isArray(doc.payments)) {
      for (let i = 0; i < doc.payments.length; i++) {
        const pay = doc.payments[i];
        if (!isRecord(pay)) continue;
        fill(pay, paymentDefaults());
        if (pay.createdAt === null) pay.createdAt = stamp;
        if (pay.updatedAt === null) pay.updatedAt = pay.createdAt;
        const who = (names.get(pay.personId) || 'Payment ' + (i + 1)) +
          (dates.isDate(pay.paidOn) ? ', ' + pay.paidOn : '');
        clipField(pay, 'note', LIMITS.paymentNote, who, repairs);
      }
    }
    return { doc: doc, repairs: repairs };
  }

  // ---- compaction (3.4) ------------------------------------------------------------------

  const KEEP_DELETED_DAYS = 30;

  // purge(doc, now) removes, for good, records whose deletedAt is older than 30 days.
  // Changes `doc` in place and returns how many records were removed. A deleted record that
  // a kept record still points at stays, so no reference is ever broken.
  function purge(doc, now) {
    const at = now instanceof Date ? now : dates.now();
    const limit = at.getTime() - KEEP_DELETED_DAYS * 86400000;
    function old(record) {
      if (!isRecord(record) || record.deletedAt === null || record.deletedAt === undefined) return false;
      const ms = dates.stampMs(record.deletedAt);
      return !isNaN(ms) && ms < limit;
    }
    if (!Array.isArray(doc.people) || !Array.isArray(doc.appointments) || !Array.isArray(doc.payments)) {
      return 0;
    }
    const before = doc.payments.length + doc.appointments.length + doc.people.length;
    doc.payments = doc.payments.filter(function (pay) { return !old(pay); });
    const neededAppointments = new Set();
    const neededPeople = new Set();
    doc.payments.forEach(function (pay) {
      if (isRecord(pay)) { neededAppointments.add(pay.appointmentId); neededPeople.add(pay.personId); }
    });
    doc.appointments = doc.appointments.filter(function (a) {
      return !old(a) || neededAppointments.has(a.id);
    });
    doc.appointments.forEach(function (a) { if (isRecord(a)) neededPeople.add(a.personId); });
    doc.people = doc.people.filter(function (p) { return !old(p) || neededPeople.has(p.id); });
    return before - (doc.payments.length + doc.appointments.length + doc.people.length);
  }

  L.core.schema = {
    lists: lists,
    label: label,
    limits: LIMITS,
    currencies: currencies,
    isCurrency: isCurrency,
    currencyName: currencyName,
    suggestRegion: suggestRegion,
    setCurrency: setCurrency,
    defaultTemplates: TEMPLATES,
    defaultSettings: defaultSettings,
    defaultMeta: defaultMeta,
    emptyDoc: emptyDoc,
    newPerson: newPerson,
    newAppointment: newAppointment,
    newPayment: newPayment,
    touch: touch,
    markDeleted: markDeleted,
    clientSince: clientSince,
    check: check,
    validate: validate,
    normalize: normalize,
    purge: purge
  };
})(window.Laser);

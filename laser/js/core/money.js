// js/core/money.js
// Money is an integer number of minor units (cents, agorot) everywhere (4.1).
// Nothing in this file holds an amount in a float.
(function (L) {
  'use strict';

  function isInt(n) { return typeof n === 'number' && Number.isInteger(n); }

  function count(text, ch) {
    let n = 0;
    for (let i = 0; i < text.length; i++) if (text[i] === ch) n++;
    return n;
  }

  function fail(message) { return { minor: null, error: message }; }

  // parse(text, decimals) -> { minor, error }
  //   an amount:        { minor: 25050, error: null }
  //   nothing typed:    { minor: null,  error: null }   (empty is never 0)
  //   cannot be read:   { minor: null,  error: 'Too many decimals' }
  // The rules are those of 4.1, in the same order.
  function parse(text, decimals) {
    if (!isInt(decimals) || decimals < 0) decimals = 2;
    // 1. spaces and apostrophes are grouping marks people type
    let s = String(text === null || text === undefined ? '' : text).replace(/[\s'’]/g, '');
    if (s === '') return { minor: null, error: null };
    if (/[^0-9.,]/.test(s)) return fail('Use digits only');
    if (!/[0-9]/.test(s)) return fail('Enter a number');

    const dots = count(s, '.');
    const commas = count(s, ',');
    let mark = null;   // the decimal mark, if there is one

    if (dots > 0 && commas > 0) {
      // 2. the one that appears last is the decimal mark
      mark = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
      if (count(s, mark) !== 1) return fail('Not a number');
      s = s.split(mark === '.' ? ',' : '.').join('');
    } else if (dots > 0 || commas > 0) {
      // 3. only one kind appears
      const ch = dots > 0 ? '.' : ',';
      const n = dots > 0 ? dots : commas;
      if (n > 1) {
        s = s.split(ch).join('');                         // (a) thousands separators
      } else {
        const at = s.indexOf(ch);
        const after = s.length - at - 1;
        if (ch === ',' && at >= 1 && after === 3 && decimals !== 3) {
          s = s.replace(',', '');                          // (b) 1,150 is one thousand ...
        } else if (ch === '.' && after === 3 && decimals !== 3) {
          return fail('Too many decimals');                // (c) a dot is never a thousands mark
        } else {
          mark = ch;                                       // (d)
        }
      }
    }

    // 4. whole and fraction
    let whole = s;
    let fraction = '';
    if (mark !== null) {
      const at = s.indexOf(mark);
      whole = s.slice(0, at);
      fraction = s.slice(at + 1);
    }
    if (fraction.length > decimals) return fail('Too many decimals');
    while (fraction.length < decimals) fraction += '0';
    if (whole === '') whole = '0';
    // 5.
    if (whole.length > 8) return fail('Too large');
    return { minor: parseInt(whole + fraction, 10), error: null };
  }

  // ---- display ---------------------------------------------------------------------------

  const formatters = {};

  function numberFormatter(digits) {
    const id = 'n' + digits;
    if (!formatters[id]) {
      formatters[id] = new Intl.NumberFormat('en', {
        minimumFractionDigits: digits, maximumFractionDigits: digits
      });
    }
    return formatters[id];
  }

  function currencyFormatter(currency, digits) {
    const id = currency + digits;
    if (!formatters[id]) {
      formatters[id] = new Intl.NumberFormat('en', {
        style: 'currency', currency: currency,
        minimumFractionDigits: digits, maximumFractionDigits: digits
      });
    }
    return formatters[id];
  }

  function scaleOf(decimals) {
    let scale = 1;
    for (let i = 0; i < decimals; i++) scale *= 10;
    return scale;
  }

  function fractionText(frac, decimals) {
    let s = String(frac);
    while (s.length < decimals) s = '0' + s;
    return s;
  }

  // Formats |minor| with a formatter that was built for an integer and puts our own
  // fraction digits in, so the amount never passes through a float.
  function build(fmt, abs, decimals, digits) {
    const scale = scaleOf(decimals);
    const whole = Math.floor(abs / scale);
    const frac = abs - whole * scale;
    const text = fractionText(frac, decimals);
    return fmt.formatToParts(whole).map(function (part) {
      return part.type === 'fraction' && digits > 0 ? text : part.value;
    }).join('');
  }

  function digitsFor(minor, decimals, options) {
    if (options && options.short && Math.abs(minor) % scaleOf(decimals) === 0) return 0;
    return decimals;
  }

  // formatNumber(115000, 2) -> "1,150.00". The plain number, no currency.
  // options.short: a whole amount drops its decimals ("250", not "250.00").
  function formatNumber(minor, decimals, options) {
    if (!isInt(minor)) return '';
    if (!isInt(decimals) || decimals < 0) decimals = 2;
    const digits = digitsFor(minor, decimals, options);
    const text = build(numberFormatter(digits), Math.abs(minor), decimals, digits);
    return (minor < 0 ? '-' : '') + text;
  }

  // format(25000, settings) -> "₪250.00"; with { short: true } -> "₪250".
  // Uses settings.currencyDecimals, and settings.currencySymbol when it is set (4.1).
  // With no currency chosen yet the plain number is returned.
  function format(minor, settings, options) {
    if (!isInt(minor)) return '';
    const s = settings || {};
    const decimals = isInt(s.currencyDecimals) && s.currencyDecimals >= 0 ? s.currencyDecimals : 2;
    const digits = digitsFor(minor, decimals, options);
    const abs = Math.abs(minor);
    const sign = minor < 0 ? '-' : '';
    if (typeof s.currencySymbol === 'string' && s.currencySymbol !== '') {
      return sign + s.currencySymbol + build(numberFormatter(digits), abs, decimals, digits);
    }
    if (typeof s.currency === 'string' && s.currency !== '') {
      try {
        return sign + build(currencyFormatter(s.currency, digits), abs, decimals, digits);
      } catch (e) { /* a code this browser does not know: show the plain number */ }
    }
    return sign + build(numberFormatter(digits), abs, decimals, digits);
  }

  // The number of decimals of a currency, read once when the currency is chosen and then
  // stored as settings.currencyDecimals (4.1). 2 when the browser does not know the code.
  function decimalsFor(currency) {
    try {
      const n = new Intl.NumberFormat('en', { style: 'currency', currency: currency })
        .resolvedOptions().maximumFractionDigits;
      return (isInt(n) && n >= 0 && n <= 4) ? n : 2;
    } catch (e) {
      return 2;
    }
  }

  L.core.money = {
    parse: parse,
    format: format,
    formatNumber: formatNumber,
    decimalsFor: decimalsFor
  };
})(window.Laser);

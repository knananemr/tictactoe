// js/core/phone.js
// Phone normalisation (9.4). A phone is stored as typed; these functions work out the
// international form for links and for the line "WhatsApp will use +...".
(function (L) {
  'use strict';

  // Only the digits of whatever was typed.
  function digits(raw) {
    return String(raw === null || raw === undefined ? '' : raw).replace(/\D/g, '');
  }

  function codeDigits(countryCode) {
    return digits(countryCode);
  }

  // toInternational('054-123 4567', '972') -> '972541234567'; null when it cannot be made.
  // The eight rules of 9.4, in order.
  function toInternational(raw, countryCode) {
    const text = String(raw === null || raw === undefined ? '' : raw).trim();
    const plus = text.charAt(0) === '+';                     // 1
    const d = digits(text);
    if (d === '') return null;
    const code = codeDigits(countryCode);
    let result;
    let national = false;   // true when the number came from rule 5, 6 or 7
    if (plus) {
      result = d;                                            // 2
    } else if (d.slice(0, 2) === '00') {
      result = d.slice(2);                                   // 3
    } else if (code === '') {
      return null;                                           // 4
    } else if (d.charAt(0) === '0') {
      result = code + d.slice(1);                            // 5
      national = true;
    } else if (d.slice(0, code.length) === code && d.length >= code.length + 8) {
      result = d;                                            // 6
      national = true;
    } else {
      result = code + d;                                     // 7
      national = true;
    }
    if (result.length < 8 || result.length > 15) return null; // 8
    if (national && result.length - code.length < 7) return null;
    return result;
  }

  // display('972541234567', '972') -> '+972 541234567'
  // display('447700900123', '972') -> '+447700900123' (a foreign number typed with +)
  function display(internationalDigits, countryCode) {
    const d = digits(internationalDigits);
    if (d === '') return '';
    const code = codeDigits(countryCode);
    if (code !== '' && d.length > code.length && d.slice(0, code.length) === code) {
      return '+' + code + ' ' + d.slice(code.length);
    }
    return '+' + d;
  }

  L.core.phone = {
    digits: digits,
    toInternational: toInternational,
    display: display
  };
})(window.Laser);

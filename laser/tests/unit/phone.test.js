// tests/unit/phone.test.js
// The normalisation table of blueprint 9.4 is the test, row by row.
(function (L) {
  'use strict';
  const phone = L.core.phone;

  // [typed, country code, result]
  const TABLE = [
    ['054-123 4567', '972', '972541234567'],
    ['+972 54 123 4567', '972', '972541234567'],
    ['00972541234567', '972', '972541234567'],
    ['972541234567', '972', '972541234567'],
    ['541234567', '972', '972541234567'],
    ['+44 7700 900123', '972', '447700900123'],
    ['1234567', '972', '9721234567'],
    ['12345', '972', null],
    ['054-1234', '972', null],
    ['(415) 555-0123', '1', '14155550123'],
    ['1 415 555 0123', '1', '14155550123'],
    ['054-123 4567', '', null]
  ];

  TABLE.forEach(function (row) {
    test('phone.toInternational: "' + row[0] + '" with country code ' + (row[1] || 'none'), function () {
      eq(phone.toInternational(row[0], row[1]), row[2]);
    });
  });

  test('phone.toInternational: the table has all 12 rows of the blueprint', function () {
    eq(TABLE.length, 12);
  });

  test('phone.toInternational: more of the rules', function () {
    eq(phone.toInternational('', '972'), null);
    eq(phone.toInternational(null, '972'), null);
    eq(phone.toInternational('no number', '972'), null);
    eq(phone.toInternational('  +972-54-123-4567  ', '972'), '972541234567', 'trimmed before looking for +');
    eq(phone.toInternational('+1234567', '972'), null, 'typed with +, but fewer than 8 digits');
    eq(phone.toInternational('+1234567890123456', '972'), null, 'more than 15 digits');
    eq(phone.toInternational('+12345678', ''), '12345678', 'a + number needs no country code');
    eq(phone.toInternational('0044 7700 900123', ''), '447700900123', '00 needs no country code');
    eq(phone.toInternational('054-123 4567', null), null);
    eq(phone.toInternational('054-123 4567', undefined), null);
    eq(phone.toInternational('97254123', '972'), '97297254123', 'starts with the code but is too short to hold it already');
    eq(phone.toInternational('07700 900123', '44'), '447700900123');
  });

  test('phone.display: + code, a space, the rest', function () {
    eq(phone.display('972541234567', '972'), '+972 541234567');
    eq(phone.display('14155550123', '1'), '+1 4155550123');
  });

  test('phone.display: a foreign number is + and all the digits', function () {
    eq(phone.display('447700900123', '972'), '+447700900123');
    eq(phone.display('972541234567', ''), '+972541234567');
    eq(phone.display(null, '972'), '');
    eq(phone.display('', '972'), '');
  });

  test('phone.display of toInternational: the line "WhatsApp will use ..."', function () {
    eq(phone.display(phone.toInternational('054-123 4567', '972'), '972'), '+972 541234567');
    eq(phone.display(phone.toInternational('+44 7700 900123', '972'), '972'), '+447700900123');
  });

  test('phone.digits: only the digits of what was typed', function () {
    eq(phone.digits('054-123 4567'), '0541234567');
    eq(phone.digits('+972 (54) 123'), '97254123');
    eq(phone.digits(null), '');
    eq(phone.digits('abc'), '');
  });
})(window.Laser);

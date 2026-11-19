// tests/unit/money.test.js
// The parse table of blueprint 4.1 is the test, row by row.
(function (L) {
  'use strict';
  const money = L.core.money;

  // [typed, decimals, result] where result is a whole number, null (no amount) or an error text
  const PARSE_TABLE = [
    ['250', 2, 25000],
    ['250.5', 2, 25050],
    ['250,5', 2, 25050],
    ['1,5', 2, 150],
    ['.5', 2, 50],
    ['1,150', 2, 115000],
    ['12,345', 2, 1234500],
    ['1 150', 2, 115000],
    ['1,150.50', 2, 115050],
    ['1.150,50', 2, 115050],
    ['1,150,000', 2, 115000000],
    ['1.150', 2, 'Too many decimals'],
    ['12.345', 2, 'Too many decimals'],
    ['', 2, null],
    ['.', 2, 'Enter a number'],
    ['12a', 2, 'Use digits only'],
    ['1,150', 0, 1150],
    ['250.5', 0, 'Too many decimals'],
    ['12.345', 3, 12345],
    ['1,150', 3, 1150]
  ];

  PARSE_TABLE.forEach(function (row) {
    const typed = row[0], decimals = row[1], expected = row[2];
    const shown = typed === '' ? '(empty)' : typed;
    test('money.parse: "' + shown + '" with ' + decimals + ' decimals', function () {
      const got = money.parse(typed, decimals);
      if (typeof expected === 'string') eq(got, { minor: null, error: expected });
      else eq(got, { minor: expected, error: null });
    });
  });

  test('money.parse: the table has all 20 rows of the blueprint', function () {
    eq(PARSE_TABLE.length, 20);
  });

  test('money.parse: more of the rule', function () {
    eq(money.parse('   ', 2), { minor: null, error: null }, 'spaces only is empty');
    eq(money.parse(null, 2), { minor: null, error: null });
    eq(money.parse(undefined, 2), { minor: null, error: null });
    eq(money.parse("1'150", 2), { minor: 115000, error: null }, 'apostrophes are removed');
    eq(money.parse('0', 2), { minor: 0, error: null }, '0 is an amount, not empty');
    eq(money.parse('0.00', 2), { minor: 0, error: null });
    eq(money.parse('5.', 2), { minor: 500, error: null });
    eq(money.parse('1.2.3,4.5', 2), { minor: null, error: 'Not a number' });
    eq(money.parse('1,2,3.4,5', 2), { minor: null, error: 'Not a number' });
    eq(money.parse('1.150.000', 2), { minor: 115000000, error: null }, 'repeated dots are thousands marks');
    eq(money.parse('1.5', 0), { minor: null, error: 'Too many decimals' });
    eq(money.parse('1.2345', 3), { minor: null, error: 'Too many decimals' });
    eq(money.parse('123456789', 2), { minor: null, error: 'Too large' });
    eq(money.parse('12345678', 2), { minor: 1234567800, error: null });
    eq(money.parse('-250', 2), { minor: null, error: 'Use digits only' });
    eq(money.parse('250$', 2), { minor: null, error: 'Use digits only' });
    eq(money.parse(',', 2), { minor: null, error: 'Enter a number' });
    eq(money.parse(250, 2), { minor: 25000, error: null }, 'a number is read as its text');
  });

  test('money.parse: never uses floating point (0.1 + 0.2 cases)', function () {
    eq(money.parse('0.1', 2).minor + money.parse('0.2', 2).minor, 30);
    eq(money.parse('1.15', 2).minor, 115);
    eq(money.parse('19.99', 2).minor, 1999);
    eq(money.parse('4.35', 2).minor, 435);
    eq(money.parse('1.005', 3).minor, 1005);
  });

  function plain(text) { return text.replace(/\s/g, ' '); }

  test('money.format: a 2-decimal currency (USD)', function () {
    const usd = { currency: 'USD', currencyDecimals: 2, currencySymbol: null };
    eq(money.format(115000, usd), '$1,150.00');
    eq(money.format(25050, usd), '$250.50');
    eq(money.format(5, usd), '$0.05');
    eq(money.format(0, usd), '$0.00');
  });

  test('money.format: a 0-decimal currency (JPY)', function () {
    const jpy = { currency: 'JPY', currencyDecimals: 0, currencySymbol: null };
    eq(money.format(1150, jpy), '¥1,150');
    eq(money.format(250, jpy), '¥250');
  });

  test('money.format: a 3-decimal currency (KWD)', function () {
    const kwd = { currency: 'KWD', currencyDecimals: 3, currencySymbol: null };
    eq(plain(money.format(12345, kwd)), 'KWD 12.345');
    eq(plain(money.format(1150, kwd)), 'KWD 1.150');
    eq(plain(money.format(1234567, kwd)), 'KWD 1,234.567');
  });

  test('money.format: the symbol override goes in front of the number', function () {
    const s = { currency: 'ILS', currencyDecimals: 2, currencySymbol: 'NIS ' };
    eq(money.format(115000, s), 'NIS 1,150.00');
    eq(money.format(115000, { currency: 'USD', currencyDecimals: 2, currencySymbol: '$$' }), '$$1,150.00');
    eq(money.format(1150, { currency: 'JPY', currencyDecimals: 0, currencySymbol: 'Y' }), 'Y1,150');
    eq(money.format(25000, { currency: 'ILS', currencyDecimals: 2, currencySymbol: '' }), '₪250.00', 'an empty symbol is no override');
  });

  test('money.format: whole amounts drop the decimals in lists (short)', function () {
    const ils = { currency: 'ILS', currencyDecimals: 2, currencySymbol: null };
    eq(money.format(25000, ils, { short: true }), '₪250');
    eq(money.format(25050, ils, { short: true }), '₪250.50');
    eq(money.format(25000, ils), '₪250.00');
    eq(money.format(0, ils, { short: true }), '₪0');
  });

  test('money.format: uses the stored decimals, not the browser\'s idea of the currency', function () {
    eq(money.format(115000, { currency: 'JPY', currencyDecimals: 2, currencySymbol: null }), '¥1,150.00');
    eq(money.format(1150, { currency: 'USD', currencyDecimals: 0, currencySymbol: null }), '$1,150');
  });

  test('money.format: refunds, no currency yet, and things that are not amounts', function () {
    const usd = { currency: 'USD', currencyDecimals: 2, currencySymbol: null };
    eq(money.format(-25000, usd), '-$250.00');
    eq(money.format(-50, usd), '-$0.50');
    eq(money.format(-25000, { currency: 'USD', currencyDecimals: 2, currencySymbol: 'US$' }), '-US$250.00');
    eq(money.format(115000, { currency: null, currencyDecimals: 2, currencySymbol: null }), '1,150.00');
    eq(money.format(115000, { currency: 'ZZZZ', currencyDecimals: 2, currencySymbol: null }), '1,150.00');
    eq(money.format(null, usd), '');
    eq(money.format(2.5, usd), '');
  });

  test('money.formatNumber: the "= 1,150.00" line under a money field', function () {
    eq(money.formatNumber(115000, 2), '1,150.00');
    eq(money.formatNumber(1150, 0), '1,150');
    eq(money.formatNumber(12345, 3), '12.345');
    eq(money.formatNumber(25000, 2, { short: true }), '250');
    eq(money.formatNumber(-120, 2), '-1.20');
    eq(money.formatNumber(null, 2), '');
  });

  test('money.format: large amounts keep every digit', function () {
    eq(money.format(9999999999, { currency: 'USD', currencyDecimals: 2, currencySymbol: null }), '$99,999,999.99');
    eq(money.formatNumber(123456789012, 4), '12,345,678.9012');
  });

  test('money.decimalsFor: read once from the browser when the currency is chosen', function () {
    eq(money.decimalsFor('USD'), 2);
    eq(money.decimalsFor('ILS'), 2);
    eq(money.decimalsFor('JPY'), 0);
    eq(money.decimalsFor('KWD'), 3);
    eq(money.decimalsFor('not a code'), 2);
  });
})(window.Laser);

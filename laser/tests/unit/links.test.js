// tests/unit/links.test.js
// Every link form of the table in blueprint 9.4.
(function (L) {
  'use strict';
  const links = L.core.links;

  const IL = { countryCode: '972', whatsappOnComputer: 'browser' };
  const NONE = { countryCode: '', whatsappOnComputer: 'browser' };
  const PHONE = '054-123 4567';

  function settings(mode) { return { countryCode: '972', whatsappOnComputer: mode }; }

  test('links.whatsapp: on a phone or tablet, the wa.me form', function () {
    eq(links.whatsapp(PHONE, 'Hello Dana', IL, 'phone'), 'https://wa.me/972541234567?text=Hello%20Dana');
    eq(links.whatsapp(PHONE, 'Hello Dana', settings('app'), 'phone'), 'https://wa.me/972541234567?text=Hello%20Dana',
      'the computer setting does not apply on a phone');
    eq(links.whatsapp(PHONE, 'Hello Dana', settings('web'), 'phone'), 'https://wa.me/972541234567?text=Hello%20Dana');
  });

  test('links.whatsapp: on a computer, "in the browser" is the wa.me form', function () {
    eq(links.whatsapp(PHONE, 'Hello Dana', settings('browser'), 'computer'), 'https://wa.me/972541234567?text=Hello%20Dana');
  });

  test('links.whatsapp: on a computer, "WhatsApp app" is the whatsapp:// form', function () {
    eq(links.whatsapp(PHONE, 'Hello Dana', settings('app'), 'computer'), 'whatsapp://send?phone=972541234567&text=Hello%20Dana');
  });

  test('links.whatsapp: on a computer, "WhatsApp Web" is the web.whatsapp.com form', function () {
    eq(links.whatsapp(PHONE, 'Hello Dana', settings('web'), 'computer'),
      'https://web.whatsapp.com/send?phone=972541234567&text=Hello%20Dana');
  });

  test('links.whatsapp: with no text there is no text part', function () {
    eq(links.whatsapp(PHONE, '', IL, 'phone'), 'https://wa.me/972541234567');
    eq(links.whatsapp(PHONE, null, IL, 'computer'), 'https://wa.me/972541234567');
    eq(links.whatsapp(PHONE, undefined, settings('app'), 'computer'), 'whatsapp://send?phone=972541234567');
    eq(links.whatsapp(PHONE, '', settings('web'), 'computer'), 'https://web.whatsapp.com/send?phone=972541234567');
  });

  test('links.whatsapp: needs an international number', function () {
    eq(links.whatsapp(PHONE, 'Hi', NONE, 'phone'), null, 'no country code');
    eq(links.whatsapp('', 'Hi', IL, 'phone'), null, 'no phone');
    eq(links.whatsapp('12345', 'Hi', IL, 'phone'), null, 'too short');
    eq(links.whatsapp('+44 7700 900123', '', NONE, 'phone'), 'https://wa.me/447700900123', 'typed with +');
  });

  test('links.whatsapp: with no platform given, util.platform decides', function () {
    const href = links.whatsapp(PHONE, '', settings('app'));
    const expected = L.core.util.platform() === 'computer'
      ? 'whatsapp://send?phone=972541234567' : 'https://wa.me/972541234567';
    eq(href, expected);
  });

  test('links.whatsapp: text is encoded, emoji and Hebrew included', function () {
    eq(links.whatsapp(PHONE, 'a&b=c #1?\n100%', IL, 'phone'),
      'https://wa.me/972541234567?text=a%26b%3Dc%20%231%3F%0A100%25');
    eq(links.whatsapp(PHONE, 'שלום 😀', IL, 'phone'),
      'https://wa.me/972541234567?text=' + encodeURIComponent('שלום 😀'));
  });

  test('links: half of an emoji is repaired by toWellFormed where it exists', function () {
    if (typeof ''.toWellFormed !== 'function') return;
    eq(links.whatsapp(PHONE, 'Hi \ud83d', IL, 'phone'), 'https://wa.me/972541234567?text=Hi%20%EF%BF%BD');
    ok(links.canEncode('Hi \ud83d'));
  });

  test('links: where toWellFormed is missing, text that cannot be encoded gives no link', function () {
    const real = String.prototype.toWellFormed;
    try {
      String.prototype.toWellFormed = undefined;
      eq(links.whatsapp(PHONE, 'Hi \ud83d', IL, 'phone'), null);
      eq(links.sms(PHONE, 'Hi \ud83d', IL), null);
      eq(links.mailto('dana@example.com', 'Hi \ud83d', 'x'), null);
      ok(!links.canEncode('Hi \ud83d'));
      ok(links.canEncode('Hi 😀'));
      eq(links.whatsapp(PHONE, 'Hi', IL, 'phone'), 'https://wa.me/972541234567?text=Hi');
    } finally {
      if (real) String.prototype.toWellFormed = real; else delete String.prototype.toWellFormed;
    }
  });

  test('links.sms: sms:+digits?&body=text', function () {
    eq(links.sms(PHONE, 'See you at 14:00', IL), 'sms:+972541234567?&body=See%20you%20at%2014%3A00');
    eq(links.sms(PHONE, '', IL), 'sms:+972541234567');
  });

  test('links.sms: with no international form, the typed digits', function () {
    eq(links.sms(PHONE, 'Hi', NONE), 'sms:0541234567?&body=Hi');
    eq(links.sms('', 'Hi', IL), null);
    eq(links.sms('call me', 'Hi', IL), null);
  });

  test('links.mailto: the @ stays literal and a + in the address is encoded', function () {
    eq(links.mailto('dana+laser@example.com', 'Your appointment', 'Hi Dana'),
      'mailto:dana%2Blaser@example.com?subject=Your%20appointment&body=Hi%20Dana');
    ok(links.mailto('dana@gmail.com').indexOf('%40') === -1);
    eq(links.mailto('dana@gmail.com'), 'mailto:dana@gmail.com');
    eq(links.mailto('dana@gmail'), 'mailto:dana@gmail', 'the rule of 4.3: one @ with text on both sides');
    eq(links.mailto('  dana@gmail.com  '), 'mailto:dana@gmail.com');
  });

  test('links.mailto: line breaks become \\r\\n', function () {
    eq(links.mailto('dana@example.com', 'Your next session', 'Line 1\nLine 2\r\nLine 3\rLine 4'),
      'mailto:dana@example.com?subject=Your%20next%20session&body=Line%201%0D%0ALine%202%0D%0ALine%203%0D%0ALine%204');
    eq(links.mailto('dana@example.com', '', 'Body only'), 'mailto:dana@example.com?body=Body%20only');
    eq(links.mailto('dana@example.com', 'Laser hair removal'), 'mailto:dana@example.com?subject=Laser%20hair%20removal');
  });

  test('links.mailto: no link without a usable address', function () {
    eq(links.mailto('', 'x', 'y'), null);
    eq(links.mailto(null, 'x', 'y'), null);
    eq(links.mailto('dana', 'x', 'y'), null);
    eq(links.mailto('dana@', 'x', 'y'), null);
    eq(links.mailto('@gmail.com', 'x', 'y'), null);
    eq(links.mailto('dana levi@gmail.com', 'x', 'y'), null);
    eq(links.mailto('a@b@c', 'x', 'y'), null);
    eq(links.mailto('javascript:alert(1)', 'x', 'y'), null);
  });

  test('links.mailto: odd characters in the address cannot break out of it', function () {
    eq(links.mailto('a?b&c@d/e', 's', 'b'), 'mailto:a%3Fb%26c@d%2Fe?subject=s&body=b');
  });

  test('links.tel: tel:+digits, or the typed digits with no international form', function () {
    eq(links.tel(PHONE, IL), 'tel:+972541234567');
    eq(links.tel('+44 7700 900123', IL), 'tel:+447700900123');
    eq(links.tel(PHONE, NONE), 'tel:0541234567');
    eq(links.tel('12345', IL), 'tel:12345');
    eq(links.tel('', IL), null);
    eq(links.tel('javascript:alert(1)', IL), 'tel:1', 'only digits ever reach a link');
    eq(links.tel(PHONE, null), 'tel:0541234567');
  });

  test('links: a stored value is never used as an address', function () {
    const evil = 'javascript:alert(1)//';
    const made = [
      links.tel(evil, IL), links.sms(evil, 'x', IL), links.whatsapp(evil, 'x', IL, 'phone'),
      links.mailto(evil, 'x', 'y'), links.mailto('a@b', evil, evil), links.whatsapp(PHONE, evil, IL, 'computer')
    ];
    made.forEach(function (href) {
      if (href === null) return;
      ok(/^(tel:|sms:|mailto:|https:\/\/wa\.me\/|whatsapp:\/\/send\?|https:\/\/web\.whatsapp\.com\/send\?)/.test(href), href);
      ok(href.indexOf('javascript:') !== 0, href);
    });
  });

  test('links.opensNewTab: only the two WhatsApp web addresses open a tab', function () {
    ok(links.opensNewTab('https://wa.me/972541234567'));
    ok(links.opensNewTab('https://web.whatsapp.com/send?phone=972541234567'));
    ok(!links.opensNewTab('whatsapp://send?phone=972541234567'));
    ok(!links.opensNewTab('tel:+972541234567'));
    ok(!links.opensNewTab('sms:+972541234567'));
    ok(!links.opensNewTab('mailto:dana@example.com'));
    ok(!links.opensNewTab(null));
  });

  test('links.isSecureAddress: the rule for the request page address', function () {
    ok(links.isSecureAddress('https://example.github.io/tictactoe/laser/request/'));
    ok(!links.isSecureAddress('http://example.com/'));
    ok(!links.isSecureAddress('https://'));
    ok(!links.isSecureAddress('example.com'));
    ok(!links.isSecureAddress('javascript:alert(1)'));
    ok(!links.isSecureAddress('https://exa mple.com'));
    ok(!links.isSecureAddress(null));
    eq(links.securePrefix, 'https://');
  });
})(window.Laser);

// tests/unit/util.test.js
(function (L) {
  'use strict';
  const util = L.core.util;
  const html = util.html;

  test('util.html: an <img onerror> payload in a name renders as text', function () {
    const name = '<img src=x onerror=alert(1)>';
    const out = html`<p class="name">${name}</p>`;
    eq(out.toString(), '<p class="name">&lt;img src=x onerror=alert(1)&gt;</p>');
    ok(out.toString().indexOf('<img') === -1, 'no tag may survive');
  });

  test('util.html: escapes & < > " and \'', function () {
    eq(html`${'&<>"\''}`.toString(), '&amp;&lt;&gt;&quot;&#39;');
    eq(html`<a title="${'" onmouseover="x'}">`.toString(), '<a title="&quot; onmouseover=&quot;x">');
  });

  test('util.html: the result of html is not escaped again, alone or in an array', function () {
    const inner = html`<b>${'a<b'}</b>`;
    eq(html`<p>${inner}</p>`.toString(), '<p><b>a&lt;b</b></p>');
    const rows = ['x', '<y>'].map(function (t) { return html`<li>${t}</li>`; });
    eq(html`<ul>${rows}</ul>`.toString(), '<ul><li>x</li><li>&lt;y&gt;</li></ul>');
  });

  test('util.html: a plain string inside an array is still escaped', function () {
    eq(html`${['<i>', html`<b></b>`]}`.toString(), '&lt;i&gt;<b></b>');
  });

  test('util.html: numbers are shown; null, undefined, false and true show nothing', function () {
    eq(html`${0}|${12}|${null}|${undefined}|${false}|${true}|`.toString(), '0|12|||||');
  });

  test('util.html: there is no way to pass a plain string through unescaped', function () {
    throws(function () { html(['<b>raw</b>']); });
    throws(function () { html('<b>raw</b>'); });
    const made = html`<b></b>`;
    throws(function () { return new made.constructor('<script>'); });
    ok(util.isSafeHtml(made));
    ok(!util.isSafeHtml('<b></b>'));
    ok(!util.isSafeHtml({ text: '<b></b>', toString: function () { return '<b></b>'; } }));
  });

  test('util.escape: turns markup into text', function () {
    eq(util.escape('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    eq(util.escape(5), '5');
  });

  test('util.uid: gives UUID v4 strings that do not repeat', function () {
    const seen = {};
    for (let i = 0; i < 500; i++) {
      const id = util.uid();
      ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id), 'not a UUID v4: ' + id);
      ok(!seen[id], 'repeated id');
      seen[id] = true;
    }
  });

  test('util.clone: a deep copy that shares nothing', function () {
    const a = { list: [1, { x: 2 }], text: 'a', none: null };
    const b = util.clone(a);
    eq(b, a);
    b.list[1].x = 3;
    eq(a.list[1].x, 2);
  });

  test('util.clip: cuts to the limit and never leaves half an emoji', function () {
    eq(util.clip('abcdef', 4), 'abcd');
    eq(util.clip('abc', 4), 'abc');
    const smile = '😀';
    eq(util.clip('abc' + smile, 4), 'abc');
    eq(util.clip('ab' + smile, 4), 'ab' + smile);
  });

  test('util.debounce: runs once after the pause, with the last arguments', function () {
    return new Promise(function (resolve, reject) {
      const calls = [];
      const d = util.debounce(function (x) { calls.push(x); }, 20);
      d(1); d(2); d(3);
      ok(d.pending());
      eq(calls, []);
      setTimeout(function () {
        try { eq(calls, [3]); ok(!d.pending()); resolve(); } catch (e) { reject(e); }
      }, 80);
    });
  });

  test('util.debounce: flush runs a waiting call now, cancel drops it', function () {
    const calls = [];
    const d = util.debounce(function (x) { calls.push(x); }, 10000);
    d('a');
    d.flush();
    eq(calls, ['a']);
    d.flush();
    eq(calls, ['a']);
    d('b');
    d.cancel();
    ok(!d.pending());
    d.flush();
    eq(calls, ['a']);
  });

  test('util.platform: tells a phone or tablet from a computer', function () {
    const none = function () { return false; };
    const touchy = function () { return true; };
    eq(util.platform({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', maxTouchPoints: 0 }, none), 'computer');
    eq(util.platform({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0', maxTouchPoints: 0 }, none), 'computer');
    eq(util.platform({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1', maxTouchPoints: 5 }, touchy), 'phone');
    eq(util.platform({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/130.0 Mobile Safari/537.36', maxTouchPoints: 5 }, touchy), 'phone');
    eq(util.platform({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', maxTouchPoints: 5 }, none), 'phone', 'an iPad that says it is a Mac');
    eq(util.platform({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0', maxTouchPoints: 1 }, touchy), 'phone', 'touch only, no mouse');
    eq(util.platform({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0', maxTouchPoints: 10 }, none), 'computer', 'a laptop with a touch screen');
    eq(util.platform({ userAgent: 'x', userAgentData: { mobile: true } }, none), 'phone');
    ok(['phone', 'computer'].indexOf(util.platform()) !== -1);
  });
})(window.Laser);

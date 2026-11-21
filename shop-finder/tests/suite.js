// End-to-end checks for shop-finder. Usage: node suite.js [dir containing index.html]
// The folder defaults to dist/ (the build): run `npm test`, or `npm run build` first.
const { chromium } = require('playwright');
const path = require('path');
const DIR = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const URL = 'https://nearby.test/index.html'; // served from DIR via request interception
const fs = require('fs');
const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', woff2: 'font/woff2', woff: 'font/woff', svg: 'image/svg+xml', json: 'application/json', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
if (!fs.existsSync(path.join(DIR, 'index.html'))) { console.log('No index.html in ' + DIR + ' (build first: npm run build, or run npm test)'); process.exit(1); }
if (/src="\/src\/main\.js"/.test(fs.readFileSync(path.join(DIR, 'index.html'), 'utf8'))) { console.log(DIR + ' is the unbuilt source; test the build: npm test (or npm run build, then node tests/suite.js dist)'); process.exit(1); }
const OUT = path.join(__dirname, 'suite-out');
require('fs').mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
const ok = (cond, name, extra) => { if (cond) { pass++; } else { fail++; console.log('FAIL', name, extra === undefined ? '' : JSON.stringify(extra)); } };

// Israel is UTC+2 in November. 2026-11-22 is a Sunday.
const IL = (iso) => new Date(iso + '+02:00');

const FONT_FILE = /\.(woff2?|ttf|otf)([?#]|$)/; // what the noFonts option blocks

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 390, height: 844 },
    deviceScaleFactor: 1,
    geolocation: { latitude: 32.0700, longitude: 34.7740 },
    permissions: opts.noGeo ? [] : ['geolocation'],
    timezoneId: opts.tz || 'Asia/Jerusalem'
  });
  await ctx.route('https://nearby.test/**', r => {
    const f = r.request().url().replace('https://nearby.test/', '').split(/[?#]/)[0] || 'index.html';
    try { r.fulfill({ status: 200, contentType: TYPES[f.split('.').pop()] || 'application/octet-stream', body: fs.readFileSync(path.join(DIR, f)) }); }
    catch (e) { r.fulfill({ status: 404, body: '' }); }
  });
  if (opts.noFonts) await ctx.route(FONT_FILE, r => r.abort());
  if (opts.reducedMotion) await ctx.addInitScript(() => {});
  if (opts.time) await ctx.clock.install({ time: opts.time });
  if (opts.seed) await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, opts.seed);
  if (opts.lang) await ctx.addInitScript(l => { if (!localStorage.getItem('nearby.lang')) localStorage.setItem('nearby.lang', JSON.stringify(l)); }, opts.lang);
  if (opts.geoError) await ctx.addInitScript(code => {
    navigator.geolocation.getCurrentPosition = (ok, err) => setTimeout(() => err({ code, message: 'stub' }), 30);
  }, opts.geoError);
  // Step 2 test seam (src/store/local.js): opts.store becomes globalThis.__nearbyTest before the app
  // starts, re-installed on every load (failOnce comes back after a reload)
  if (opts.store) await ctx.addInitScript(cfg => { globalThis.__nearbyTest = cfg; }, opts.store);
  // opts.idb: "missing" (no indexedDB) | "broken" (open throws, as in some private modes) | "full" (put throws
  // QuotaExceededError) | { slowMs } (every IDBRequest onsuccess handler runs slowMs late)
  if (opts.idb) await ctx.addInitScript(m => {
    if (m === 'missing') Object.defineProperty(window, 'indexedDB', { configurable: true, get: () => undefined });
    else if (m === 'broken') IDBFactory.prototype.open = function () { throw new DOMException('blocked', 'SecurityError'); };
    else if (m === 'full') IDBObjectStore.prototype.put = function () { throw new DOMException('full', 'QuotaExceededError'); };
    else if (m && m.slowMs) {
      const d = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'onsuccess');
      Object.defineProperty(IDBRequest.prototype, 'onsuccess', { configurable: true, get: d.get,
        set(f) { d.set.call(this, typeof f === 'function' ? function (e) { setTimeout(() => f.call(this, e), m.slowMs); } : f); } });
    }
  }, opts.idb);
  // opts.watchSkel: window.__skel counts every skeleton (.skel) ever added to the page
  if (opts.watchSkel) await ctx.addInitScript(() => {
    window.__skel = 0;
    new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && (n.classList.contains('skel') || n.querySelector('.skel'))) window.__skel++; })
      .observe(document, { childList: true, subtree: true });
  });
  const page = await ctx.newPage();
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !(opts.noFonts && FONT_FILE.test((m.location() || {}).url || ''))) page.errors.push(m.text()); });
  page.on('dialog', d => d.accept());
  return page;
}
const names = p => p.locator('#grid .card h3').allTextContents();
// Step 2 seam helpers: change the seam of a loaded page, read its call counts, count skeletons seen,
// photos to pick, and the drafts / photo records kept on the device.
const setStore = (p, patch) => p.evaluate(x => Object.assign(globalThis.__nearbyTest || (globalThis.__nearbyTest = {}), x), patch);
const calls = (p, op) => p.evaluate(op => ((globalThis.__nearbyTest || {}).calls || {})[op] || 0, op);
const skelSeen = p => p.evaluate(() => window.__skel || 0);
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC', 'base64');
const photoFiles = n => Array.from({ length: n }, (_, i) => ({ name: `p${i}.png`, mimeType: 'image/png', buffer: PNG }));
const storedDraft = (p, slot) => p.evaluate(s => JSON.parse(localStorage.getItem('nearby.draft.' + s) || 'null'), slot);
const idbPhotos = (p, slot) => p.evaluate(s => new Promise(res => {     // [{ id, isBlob }] in nearby-drafts for slot
  let r; try { r = indexedDB.open('nearby-drafts'); } catch (e) { return res([]); }   // idb "missing" / "broken"
  r.onupgradeneeded = () => r.transaction.abort();                         // never create the database from a test
  r.onerror = () => res([]);
  r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains('draftPhotos')) { db.close(); return res([]); }
    const q = db.transaction('draftPhotos').objectStore('draftPhotos').index('slot').getAll(s);
    q.onsuccess = () => { db.close(); res(q.result.map(x => ({ id: x.id, isBlob: x.blob instanceof Blob }))); }; };
}), slot);

(async () => {
  const browser = await chromium.launch();

  // 1. Home renders in both languages, no errors
  {
    const p = await newPage(browser);
    await p.goto(URL);
    ok(await p.locator('#grid .card').count() === 10, 'home shows 10 cards');
    ok(await p.evaluate(() => document.documentElement.dir) === 'rtl', 'hebrew is rtl by default');
    await p.click('#langBtn');
    ok(await p.evaluate(() => document.documentElement.dir) === 'ltr', 'english is ltr');
    ok(await p.locator('#grid .card').count() === 10, 'english shows 10 cards');
    ok((await p.locator('#langBtn').getAttribute('aria-label') || '').length > 0, 'lang button has aria-label');
    ok(p.errors.length === 0, 'no console errors on home', p.errors);
    await p.context().close();
  }

  // 2. Open now with a fixed Israel clock (Sunday 10:00) and Friday 16:00
  {
    const p = await newPage(browser, { lang: 'en', time: IL('2026-11-22T10:00:00') });
    await p.goto(URL);
    await p.click('#openBtn');
    const open = await names(p);
    ok(open.length === 9, 'Sunday 10:00: 9 open (only Ink & Needle closed)', open);
    ok(!open.includes('Ink & Needle'), 'tattoo closed Sunday');
    await p.context().close();
    const q = await newPage(browser, { lang: 'en', time: IL('2026-11-27T16:00:00') });
    await q.goto(URL);
    await q.click('#openBtn');
    ok((await names(q)).length === 0, 'Friday 16:00: nothing open', await names(q));
    ok(await q.locator('.empty').count() === 1, 'empty state shown');
    await q.click('#clearBtn');
    ok(await q.locator('#grid .card').count() === 10, 'clear filters restores all');
    await q.context().close();
  }

  // 3. Overnight hours: shop open 20:00-02:00 on Sunday is open Monday 01:00
  {
    const night = [{ id: 'u1', name: 'Night Owl Barber', category: 'barber', address: 'x', phone: '0500000000', hours: [['20:00', '02:00'], null, null, null, null, null, null], services: [], photos: [] }];
    const p = await newPage(browser, { lang: 'en', time: IL('2026-11-23T01:00:00'), seed: ['nearby.myShops', JSON.stringify(night)] });
    await p.goto(URL + '#/shop/u1');
    ok(/open/i.test(await p.locator('.shop-title .pill').first().textContent()), 'overnight shop open at 01:00 next day');
    await p.context().close();
  }

  // 4. Near me: sort, distance, radius, toggle off
  {
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL);
    await p.click('#nearBtn');
    await p.waitForSelector('.card .dist');
    const first = (await names(p))[0];
    ok(first === 'Studio Maya', 'nearest first', first);
    ok(await p.locator('#nearBtn').getAttribute('aria-pressed') === 'true', 'near pressed');
    ok(await p.locator('#radius').isVisible(), 'radius visible with location');
    await p.selectOption('#radius', '1');
    const near1 = await names(p);
    ok(near1.length >= 1 && near1.length < 10, 'radius 1km filters', near1);
    ok(!(await p.locator('.card .dist').allTextContents()).some(t => /1000/.test(t)), 'no "1000 m" label');
    await p.click('#nearBtn');
    ok(await p.locator('#nearBtn').getAttribute('aria-pressed') === 'false', 'near toggles off');
    ok(await p.locator('#grid .card').count() === 10, 'all shops back after near off');
    ok(!(await p.locator('#radius').isVisible()), 'radius hidden after near off');
    await p.context().close();
  }

  // 5. Location denied
  {
    const p = await newPage(browser, { lang: 'en', noGeo: true });
    await p.goto(URL);
    await p.click('#nearBtn');
    await p.waitForFunction(() => document.getElementById('locStatus').textContent.length > 0 && !/Finding/.test(document.getElementById('locStatus').textContent), null, { timeout: 15000 });
    ok(/off|allow/i.test(await p.locator('#locStatus').textContent()), 'denied message', await p.locator('#locStatus').textContent());
    ok(await p.locator('#grid .card').count() === 10, 'all cards still shown when denied');
    ok(await p.locator('#demoBtn').isVisible(), 'demo spot offered when location is off');
    await p.click('#demoBtn');
    await p.waitForSelector('.card .dist');
    ok(/demo spot/i.test(await p.locator('#locStatus').textContent()) && await p.locator('#nearBtn').getAttribute('aria-pressed') === 'true', 'demo spot sorts by distance');
    ok(!(await p.locator('#demoBtn').isVisible()), 'demo button hidden once used');
    await p.context().close();
  }

  // 6. Search
  {
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL);
    const search = async q => { await p.fill('#q', q); await p.waitForTimeout(160); return names(p); };
    ok((await search('fade')).length === 2, 'search fade -> 2 (Fade Lab + Yossi skin fade? )', await names(p));
    ok((await search('פדיקור')).join() === 'Pink Nail Bar', 'hebrew service search');
    ok((await search('yossis')).includes("Yossi's Barber Corner"), 'apostrophe-insensitive search', await names(p));
    ok((await search('YOSSI’S')).includes("Yossi's Barber Corner"), 'curly apostrophe search', await names(p));
    ok((await search('dizengoff, tel aviv')).includes('Fade Lab'), 'punctuation in query', await names(p));
    ok((await search('zzzz')).length === 0, 'no results');
    await p.fill('#q', '');
    await p.click('[data-cat="barber"]');
    ok((await names(p)).length === 2, 'category barber');
    ok(await p.locator('[data-cat="barber"]').getAttribute('aria-pressed') === 'true', 'category pressed state');
    await p.click('[data-cat=""]');
    await p.context().close();
  }

  // 7. Corrupted / hostile storage
  for (const [label, value] of [
    ['object', '{"a":1}'], ['junk', '[null, 5, "x", {"id":3}, {"id":"z"}]'], ['not json', '{oops'],
    ['xss', JSON.stringify([{ id: 'x1', name: '<img src=x onerror="window.__pwned=1">', category: 'barber', address: '"><script>window.__pwned=1</script>', phone: '1"onmouseover="window.__pwned=1', email: 'a"onclick="window.__pwned=1"@x.com', photos: ["x') ; background:url('javascript:alert(1)", 'javascript:alert(1)'], hours: 'nope', services: [{ name: '<b>s</b>', price: -5 }] }])]
  ]) {
    const p = await newPage(browser, { lang: 'en', seed: ['nearby.myShops', value] });
    await p.goto(URL);
    ok(await p.locator('#grid .card').count() >= 10, 'renders with ' + label + ' storage');
    if (label === 'xss') {
      await p.goto(URL + '#/shop/x1');
      await p.waitForTimeout(200);
      await p.hover('.shop-title h1').catch(() => {});
      ok(!(await p.evaluate(() => window.__pwned)), 'no script execution from stored data');
      ok(await p.locator('img[src="x"]').count() === 0, 'no injected img');
    }
    ok(p.errors.length === 0, 'no errors with ' + label, p.errors);
    await p.context().close();
  }

  // 8. Owner form full flow
  {
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL + '#/new');
    await p.click('#submitBtn');
    ok(await p.locator('#fName').getAttribute('aria-invalid') === 'true', 'name invalid on empty submit');
    ok(await p.evaluate(() => document.activeElement.id) === 'fName', 'focus moves to first invalid');
    ok(await p.locator('#formError').isVisible(), 'error summary visible');
    await p.fill('#fName', 'Test <b>Barber</b>');
    await p.selectOption('#fCategory', 'barber');
    await p.fill('#fAddress', '1 Test St');
    await p.fill('#fPhone', '12');
    await p.fill('#fEmail', 'nope');
    await p.click('#submitBtn');
    ok(await p.locator('#fPhone').getAttribute('aria-invalid') === 'true', 'short phone rejected');
    ok(await p.locator('#fEmail').getAttribute('aria-invalid') === 'true', 'bad email rejected');
    await p.fill('#fPhone', '050-123-4567');
    await p.fill('#fEmail', 'bob@example.com');
    await p.fill('#svcName0', 'Cut');
    await p.fill('#svcPrice0', '60');
    // bad hours
    await p.locator('.hours-row[data-day="1"] [name="to"]').fill('08:00');
    await p.click('#submitBtn');
    ok(await p.locator('#err-hours-1').isVisible(), 'closing before opening rejected');
    await p.locator('.hours-row[data-day="1"] [name="to"]').fill('19:00');
    // language switch keeps data
    await p.click('#langBtn');
    ok(await p.inputValue('#fName') === 'Test <b>Barber</b>', 'draft survives language switch');
    ok(await p.inputValue('#svcPrice0') === '60', 'services survive language switch');
    await p.click('#langBtn');
    // photos: 5 files, only 4 kept
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC', 'base64');
    await p.setInputFiles('#fPhotos', [1, 2, 3, 4, 5].map(i => ({ name: `p${i}.png`, mimeType: 'image/png', buffer: png })));
    await p.waitForFunction(() => document.querySelectorAll('#thumbs img').length === 4);
    ok(/4/.test(await p.locator('#photoStatus').textContent()), 'photo limit message');
    await p.click('#thumbs [data-photo="0"]');
    ok(await p.locator('#thumbs img').count() === 3, 'remove photo');
    ok(await p.locator('#preview .card').count() === 1, 'live preview present');
    await p.waitForFunction(() => !document.getElementById('submitBtn').disabled);
    console.log('  [dbg] before submit', await p.evaluate(() => [document.querySelectorAll('#thumbs img').length, document.getElementById('submitBtn').textContent, document.getElementById('formError').textContent, Array.from(document.querySelectorAll('[aria-invalid=true]')).map(e => e.id || e.name)]));
    // double submit -> one shop
    await p.evaluate(() => { const f = document.getElementById('shopForm'); f.requestSubmit(); f.requestSubmit(); });
    try { await p.waitForSelector('.shop-title h1', { timeout: 8000 }); }
    catch (e) { console.log('  [dbg] STALLED', await p.evaluate(() => ({ hash: location.hash, h1: (document.querySelector('h1') || {}).textContent, stored: localStorage.getItem('nearby.myShops') ? JSON.parse(localStorage.getItem('nearby.myShops')).length : null, err: (document.getElementById('formError') || {}).textContent, active: document.activeElement && document.activeElement.outerHTML.slice(0, 120) })), p.errors); throw e; }
    const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('nearby.myShops')));
    ok(stored.length === 1, 'double submit stores one shop', stored.length);
    ok(await p.locator('.shop-title h1').textContent() === 'Test <b>Barber</b>', 'name escaped & shown');
    ok(await p.locator('.note').count() === 1, 'published note shown');
    ok(await p.locator('.gallery img.photo').count() === 3, 'photos on shop page');
    ok(await p.evaluate(() => document.activeElement.tagName) === 'H1', 'focus on h1 after publish');
    await p.reload();
    ok(await p.locator('.shop-title h1').textContent() === 'Test <b>Barber</b>', 'persists after reload');
    ok(await p.locator('.note').count() === 0, 'published note only once');
    await p.goto(URL + '#/new');
    ok(await p.inputValue('#fName') === '', 'draft cleared after publish');
    await p.goto(URL + '#/shop/' + stored[0].id);
    await p.click('#removeBtn');
    ok(await p.evaluate(() => document.activeElement.id) === 'cancelRemove', 'delete asks first, focus on Keep');
    await p.click('#cancelRemove');
    ok(await p.evaluate(() => document.activeElement.id) === 'removeBtn' && await p.locator('.shop-title h1').count() === 1, 'Keep my shop cancels the delete');
    await p.click('#removeBtn');
    await p.click('#confirmRemove');
    await p.waitForSelector('#grid');
    ok(await p.locator('#grid .card').count() === 10, 'delete removes shop');
    ok(p.errors.length === 0, 'no errors in form flow', p.errors);
    await p.context().close();
  }

  // 9. Routing edge cases & focus
  {
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL + '#/shop/nope');
    ok(await p.locator('h1').count() === 1, 'unknown shop shows heading');
    await p.goto(URL + '#/shop/%E0%A4%A');
    ok((await p.locator('main').innerText()).length > 0, 'malformed id does not blank the page');
    await p.goto(URL + '#/garbage');
    ok(await p.locator('#grid .card').count() === 10, 'unknown route -> home');
    await p.click('#grid .card >> nth=0');
    await p.waitForSelector('.shop-title h1');
    ok(await p.evaluate(() => document.activeElement.tagName) === 'H1', 'focus moves to h1 on navigation');
    ok(/Nearby/.test(await p.title()) && !/^Nearby — great/.test(await p.title()), 'page title per shop', await p.title());
    await p.goBack();
    await p.waitForSelector('#grid .card');
    ok(await p.locator('#grid .card').count() === 10, 'back returns home');
    ok(p.errors.length === 0, 'no errors routing', p.errors);
    await p.context().close();
  }

  // 10. Keyboard
  {
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL);
    await p.keyboard.press('Tab');
    ok(await p.evaluate(() => document.activeElement.classList.contains('skip-link')), 'first tab = skip link');
    await p.focus('[data-cat="nails"]');
    await p.keyboard.press('Enter');
    ok((await names(p)).join() === 'Pink Nail Bar', 'keyboard category select');
    await p.keyboard.press('Space');
    ok(await p.locator('[data-cat="nails"]').getAttribute('aria-pressed') === 'false' && await p.locator('[data-cat=""]').getAttribute('aria-pressed') === 'true', 'pressing the selected tile again turns it off');
    await p.context().close();
  }

  // 11. Layout: no horizontal overflow, tap targets
  for (const lang of ['he', 'en']) {
    for (const [w, h] of [[320, 640], [360, 740], [414, 896], [768, 1024], [1024, 768], [1440, 900], [812, 375]]) {
      const p = await newPage(browser, { lang, viewport: { width: w, height: h } });
      for (const route of ['#/', '#/shop/s1', '#/new']) {
        await p.goto(URL + route);
        await p.waitForTimeout(80);
        const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        ok(over <= 0, `no overflow ${lang} ${w}x${h} ${route}`, over);
      }
      await p.context().close();
    }
  }
  {
    const p = await newPage(browser, { lang: 'en' });
    for (const route of ['#/', '#/shop/s1', '#/new']) {
      await p.goto(URL + route);
      await p.waitForTimeout(100);
      const small = await p.evaluate(() => Array.from(document.querySelectorAll('a[href], button, select, input:not([type=hidden]):not(.sr-only)'))
        .filter(el => el.offsetParent !== null && !el.closest('.contact-list') && !el.closest('.hero-sub'))
        .map(el => { const r = el.getBoundingClientRect(); return { t: (el.textContent || el.getAttribute('aria-label') || el.id || el.type).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; })
        .filter(r => (r.w < 44 || r.h < 44) && r.t !== 'checkbox'));
      ok(small.length === 0, 'tap targets >= 44px on ' + route, small);
    }
    await p.context().close();
  }


  // 13. Audit follow-ups: search variants, edit flow, back keeps place, copy hours, mobile density, a11y names
  {
    const p = await newPage(browser, { lang: 'he' });
    await p.goto(URL);
    const search = async q => { await p.fill('#q', q); await p.waitForTimeout(160); return names(p); };
    ok((await search('ד"ר לוי')).length === 1, 'ASCII-quote gershayim search', await names(p));
    ok((await search('ג׳ל')).includes('פינק נייל בר'), 'geresh search', await names(p));
    ok((await search('המספרה')).length >= 1, 'ה-prefix search', await names(p));
    await p.fill('#q', '');
    await p.waitForTimeout(160);
    // first card should start in the top half of a phone screen
    const top = await p.evaluate(() => document.querySelector('#grid .card').getBoundingClientRect().top / innerHeight);
    ok(top < 0.62, 'first result high on the phone screen', top.toFixed(2));
    const visible = await p.evaluate(() => Array.from(document.querySelectorAll('#grid .card')).filter(c => c.getBoundingClientRect().bottom <= innerHeight * 1.0001 + 600).length);
    ok(visible >= 4, 'several cards within ~1.7 screens', visible);
    // accessible name of a card is just the shop name
    const label = await p.evaluate(() => { const a = document.querySelector('#grid .card'); return document.getElementById(a.getAttribute('aria-labelledby')).textContent; });
    ok(label === await p.locator('#grid .card h3').first().textContent(), 'card name = shop name');
    // brand and near-me differ in Hebrew
    ok((await p.locator('#nearBtn').innerText()).trim() !== (await p.locator('#brandName').innerText()).trim(), 'near-me label differs from brand');
    // back link keeps list position and focus returns to the card
    await p.evaluate(() => window.scrollTo(0, 900));
    await p.waitForTimeout(100);
    const before = await p.evaluate(() => scrollY);
    const target = p.locator('#grid .card').nth(5);
    const href = await target.getAttribute('href');
    await target.click();
    await p.waitForSelector('.shop-title h1');
    await p.click('.back');
    await p.waitForSelector('#grid .card');
    await p.waitForTimeout(150);
    const after = await p.evaluate(() => scrollY);
    ok(Math.abs(after - before) < 80, 'back link restores list scroll', { before, after });
    ok(await p.evaluate(() => document.activeElement.getAttribute('href')) === href, 'focus returns to the visited card');
    ok(await p.evaluate(() => history.length) <= 3, 'back link did not push history', await p.evaluate(() => history.length));
    await p.context().close();
  }
  {
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL + '#/new');
    await p.fill('#fName', 'Edit Me');
    await p.selectOption('#fCategory', 'nails');
    await p.fill('#fAddress', '2 Edit St');
    await p.fill('#fPhone', '052-123-4567');
    await p.locator('.hours-row[data-day="0"] [name="from"]').fill('08:00');
    await p.locator('.hours-row[data-day="0"] [name="to"]').fill('17:00');
    await p.click('#copyHours');
    ok(await p.locator('.hours-row[data-day="3"] [name="to"]').inputValue() === '17:00', 'copy hours to open days');
    ok(await p.locator('.hours-row[data-day="6"] [name="from"]').isDisabled(), 'closed day stays closed');
    await p.click('#submitBtn');
    await p.waitForSelector('.shop-title h1');
    ok(await p.locator('a[href^="https://wa.me/972521234567"]').count() === 1, 'WhatsApp link for mobile number');
    ok(await p.locator('#grid').count() === 0 && await p.locator('a[href^="#/edit/"]').count() === 1, 'edit link for owner');
    await p.click('a[href^="#/edit/"]');
    await p.waitForSelector('#shopForm');
    ok(await p.inputValue('#fName') === 'Edit Me', 'edit form prefilled');
    ok(/save/i.test(await p.locator('#submitBtn').textContent()), 'edit form says Save');
    await p.fill('#fName', 'Edited Name');
    await p.click('#submitBtn');
    await p.waitForSelector('.shop-title h1');
    ok(await p.locator('.shop-title h1').textContent() === 'Edited Name', 'edit saved');
    ok(/saved/i.test(await p.locator('.note').textContent()), 'saved notice');
    const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('nearby.myShops')));
    ok(stored.length === 1 && stored[0].name === 'Edited Name' && !('mine' in stored[0]), 'edit replaced in place, no runtime fields stored', stored);
    await p.goto(URL + '#/new');
    ok(await p.inputValue('#fName') === '', 'new form is empty after editing');
    await p.goto(URL + '#/');
    ok(await p.locator('.pill.mine').count() === 1, '"Yours" badge on owner card');
    ok(p.errors.length === 0, 'no errors in edit flow', p.errors);
    await p.context().close();
  }
  {
    const p = await newPage(browser, { seed: ['nearby.lang', '"constructor"'] });
    await p.goto(URL);
    ok(await p.locator('#grid .card').count() === 10 && p.errors.length === 0, 'bad stored language falls back', p.errors);
    await p.context().close();
  }


  // 14. Second review: navigation, drafts, search, hours, validation, a11y, layout
  const owner = (id, extra) => Object.assign({ id, name: 'Owner ' + id, category: 'nails', address: '1 Owner St', phone: '0521234567', hours: [['09:00', '19:00'], ['09:00', '19:00'], ['09:00', '19:00'], ['09:00', '19:00'], ['09:00', '19:00'], null, null], services: [{ name: 'Gel', price: 100, minutes: 30 }], photos: [] }, extra || {});
  const shownHash = p => p.evaluate(() => location.hash || '#/');
  {
    // skip link keeps you on the page and focuses its heading
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL + '#/shop/s3');
    await p.waitForSelector('.shop-title h1');
    const len = await p.evaluate(() => history.length);
    await p.keyboard.press('Tab');
    await p.keyboard.press('Enter');
    await p.waitForTimeout(100);
    ok(await shownHash(p) === '#/shop/s3', 'skip link stays on the shop page', await shownHash(p));
    ok(await p.evaluate(() => document.activeElement.closest('.shop-title') !== null && document.activeElement.tagName === 'H1'), 'skip link focuses the heading');
    ok(await p.evaluate(() => history.length) === len, 'skip link adds no history entry');
    await p.goto(URL + '#/new');
    await p.fill('#fName', 'typed');
    await p.focus('#skipLink'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    ok(await shownHash(p) === '#/new' && await p.inputValue('#fName') === 'typed', 'skip link keeps the form');
    await p.context().close();
  }
  {
    // "All places" from a form reached via a shop page goes to the list, not the shop
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL);
    await p.click('#grid .card >> nth=0');
    await p.waitForSelector('.shop-title h1');
    await p.click('#navNew');
    await p.waitForSelector('#shopForm');
    await p.click('.back');
    await p.waitForSelector('#grid .card');
    ok(await shownHash(p) === '#/', 'All places on the form goes home', await shownHash(p));
    // a double click on the back link must not leave the app
    await p.click('#grid .card >> nth=1');
    await p.waitForSelector('.shop-title h1');
    await p.evaluate(() => { const b = document.querySelector('.back'); b.click(); b.click(); });
    await p.waitForTimeout(400);
    ok(/nearby\.test/.test(p.url()) && await p.locator('#grid').count() === 1, 'double click on back stays in the app', p.url());
    await p.context().close();
  }
  {
    // edit: Cancel discards; All places reaches home; Save leaves no duplicate entry
    const p = await newPage(browser, { lang: 'en', seed: ['nearby.myShops', JSON.stringify([owner('u1')])] });
    await p.goto(URL);
    await p.click('#grid a[href="#/shop/u1"]');
    await p.waitForSelector('.owner-bar');
    await p.click('.owner-bar a[href^="#/edit/"]');
    await p.waitForSelector('#shopForm');
    await p.fill('#fName', 'Unsaved change');
    await p.click('.submit-row a');
    await p.waitForSelector('.shop-title h1');
    ok(await shownHash(p) === '#/shop/u1', 'Cancel returns to the shop');
    ok(await p.locator('.shop-title h1').textContent() === 'Owner u1', 'Cancel did not save');
    await p.click('.owner-bar a[href^="#/edit/"]');
    await p.waitForSelector('#shopForm');
    ok(await p.inputValue('#fName') === 'Owner u1', 'Cancel discarded the edits', await p.inputValue('#fName'));
    ok(await p.locator('#draftNote').count() === 0, 'no unsaved-changes note after Cancel');
    await p.click('.submit-row a');
    await p.waitForSelector('.shop-title h1');
    await p.click('.back');
    await p.waitForSelector('#grid .card');
    ok(await shownHash(p) === '#/', 'All places after Cancel goes home', await shownHash(p));
    // save edit: one back step reaches home
    await p.click('#grid a[href="#/shop/u1"]');
    await p.waitForSelector('.owner-bar');
    const len = await p.evaluate(() => history.length);
    await p.click('.owner-bar a[href^="#/edit/"]');
    await p.waitForSelector('#shopForm');
    await p.fill('#fName', 'Saved change');
    await p.click('#submitBtn');
    await p.waitForFunction(() => document.querySelector('.shop-title h1') && document.querySelector('.shop-title h1').textContent === 'Saved change');
    ok(/saved/i.test(await p.locator('#pageNote').textContent()), 'saved note after going back to the shop');
    await p.click('#langBtn');
    ok(await p.locator('#pageNote').count() === 1, 'note survives a language switch');
    await p.click('#langBtn');
    await p.click('.back');
    await p.waitForSelector('#grid .card');
    ok(await shownHash(p) === '#/', 'one click on All places after Save reaches home');
    ok(await p.evaluate(() => history.length) <= len + 1, 'save left no duplicate entry', [len, await p.evaluate(() => history.length)]);
    // delete: back to the list with a note
    await p.evaluate(() => window.scrollTo(0, 500));
    await p.waitForTimeout(80);
    await p.click('#grid a[href="#/shop/u1"]');
    await p.waitForSelector('#removeBtn');
    await p.click('#removeBtn');
    await p.click('#confirmRemove');
    await p.waitForSelector('#grid .card');
    ok(/deleted/i.test(await p.locator('#pageNote').textContent()), 'deleted note on home');
    ok(await p.locator('#grid .card').count() === 10, 'shop gone after delete');
    ok(p.errors.length === 0, 'no errors in edit/history flow', p.errors);
    await p.context().close();
  }
  {
    // separate drafts: editing a shop does not wipe the half-typed new shop
    const p = await newPage(browser, { lang: 'en', seed: ['nearby.myShops', JSON.stringify([owner('u1')])] });
    await p.goto(URL + '#/new');
    await p.fill('#fName', 'Second shop');
    await p.goto(URL + '#/edit/u1');
    await p.waitForSelector('#shopForm');
    ok(await p.inputValue('#fName') === 'Owner u1', 'edit form shows the shop');
    await p.fill('#fAbout', 'edit in progress');
    await p.goto(URL + '#/new');
    ok(await p.inputValue('#fName') === 'Second shop', 'new-shop draft kept after visiting edit');
    ok(await p.locator('#draftNote').count() === 1, 'kept-draft note shown');
    await p.goBack();
    await p.waitForSelector('#fAbout');
    ok(await p.inputValue('#fAbout') === 'edit in progress', 'edit draft kept after visiting new');
    await p.click('#discardBtn');
    ok(await p.inputValue('#fAbout') === '' && await p.locator('#draftNote').count() === 0, 'Discard changes resets the edit form');
    // reload with photos: the owner is told photos must be added again
    await p.goto(URL + '#/new');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC', 'base64');
    await p.setInputFiles('#fPhotos', [{ name: 'a.png', mimeType: 'image/png', buffer: png }, { name: 'b.png', mimeType: 'image/png', buffer: png }]);
    await p.waitForFunction(() => document.querySelectorAll('#thumbs img').length === 2);
    await p.reload();
    await p.waitForSelector('#shopForm');
    ok(/2 photos/.test(await p.locator('#photoStatus').textContent()), 'reload says photos need adding again', await p.locator('#photoStatus').textContent());
    await p.context().close();
  }
  {
    // photos still being prepared when the language changes end up on this form, and Publish recovers
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL + '#/new');
    const big = await p.evaluate(async () => { const c = document.createElement('canvas'); c.width = 2400; c.height = 1800; const x = c.getContext('2d'); x.fillStyle = '#c44'; x.fillRect(0, 0, 2400, 1800); return c.toDataURL('image/png').split(',')[1]; });
    const buf = Buffer.from(big, 'base64');
    await p.setInputFiles('#fPhotos', [1, 2, 3].map(i => ({ name: `big${i}.png`, mimeType: 'image/png', buffer: buf })));
    await p.evaluate(() => document.getElementById('langBtn').click());
    await p.waitForFunction(() => document.querySelectorAll('#thumbs img').length === 3, null, { timeout: 15000 }).catch(() => {});
    ok(await p.locator('#thumbs img').count() === 3, 'photos land on the re-drawn form', await p.locator('#thumbs img').count());
    ok(!(await p.locator('#submitBtn').isDisabled()), 'Publish is enabled again after photos are ready');
    await p.context().close();
  }
  {
    // Hebrew search
    const p = await newPage(browser, { lang: 'he' });
    await p.goto(URL);
    const search = async q => { await p.fill('#q', q); await p.waitForTimeout(160); return names(p); };
    ok((await search('כאבי גב')).join() === 'מוב פיזיותרפיה', 'back pain finds only physio', await names(p));
    ok((await search('ביפו')).join() === 'ידיים שקטות', 'prefix ב finds Jaffa only', await names(p));
    const barbers = await search('מספרה');
    ok(barbers.includes('פייד לאב') && barbers.includes('הפינה של יוסי'), 'מספרה finds both barbers', barbers);
    ok((await search('מרפאה')).includes('מרפאת שיניים ד״ר לוי'), 'מרפאה finds the clinic', await names(p));
    ok((await search('המספרה')).length >= 2, 'ה-prefix still works', await names(p));
    await p.context().close();
  }
  {
    // 24-hour days: form, display, legacy data; 07:00–06:00 rejected
    const legacy = owner('u24', { hours: Array(7).fill(['00:00', '00:00']) });
    const p = await newPage(browser, { lang: 'en', time: IL('2026-11-22T03:00:00'), seed: ['nearby.myShops', JSON.stringify([legacy])] });
    await p.goto(URL + '#/shop/u24');
    ok(/24 hours/i.test(await p.locator('#shopStatus').textContent()) && /open/i.test(await p.locator('#shopStatus .pill').textContent()), 'legacy 24h shop shows open 24 hours', await p.locator('#shopStatus').textContent());
    await p.goto(URL + '#/edit/u24');
    await p.waitForSelector('#shopForm');
    ok(await p.locator('.hours-row[data-day="0"] [name="allDay"]').isChecked(), 'edit form ticks 24 hours');
    await p.goto(URL + '#/new');
    await p.fill('#fName', 'All Day'); await p.selectOption('#fCategory', 'barber'); await p.fill('#fAddress', '3 Late St'); await p.fill('#fPhone', '0501112222');
    await p.locator('.hours-row[data-day="1"] [name="from"]').fill('07:00');
    await p.locator('.hours-row[data-day="1"] [name="to"]').fill('06:00');
    await p.locator('.hours-row[data-day="0"] [name="allDay"]').check();
    ok(await p.locator('.hours-row[data-day="0"] [name="from"]').isDisabled(), '24 hours disables the times');
    await p.click('#submitBtn');
    ok(await p.locator('#err-hours-1').isVisible(), '07:00–06:00 rejected');
    await p.locator('.hours-row[data-day="1"] [name="to"]').fill('02:00');
    await p.click('#submitBtn');
    await p.waitForSelector('.shop-title h1');
    ok(/24 hours/i.test(await p.locator('#shopStatus').textContent()), 'new 24h shop is open 24 hours on Sunday 03:00');
    const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('nearby.myShops'))[0].hours);
    ok(stored[0][0] === '00:00' && stored[0][1] === '00:00' && stored[1][1] === '02:00', '24h stored as 00:00–00:00', stored);
    await p.context().close();
  }
  {
    // service rows are validated
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL + '#/new');
    await p.fill('#fName', 'Svc'); await p.selectOption('#fCategory', 'barber'); await p.fill('#fAddress', '3 St'); await p.fill('#fPhone', '0501112222');
    await p.fill('#svcName0', 'Cut'); await p.fill('#svcPrice0', '-50');
    await p.click('#addService');
    await p.fill('#svcPrice1', '120');
    await p.click('#submitBtn');
    ok(await p.locator('#svcPrice0').getAttribute('aria-invalid') === 'true', 'negative price rejected');
    ok(await p.locator('#svcName1').getAttribute('aria-invalid') === 'true', 'price without a name rejected');
    ok(await p.evaluate(() => document.activeElement.id) === 'svcPrice0', 'focus on the first bad service field');
    ok(await shownHash(p) === '#/new', 'not published with bad services');
    // invalid fields look invalid; errors are red; the focus ring is solid
    await p.focus('#fName'); await p.waitForTimeout(350); // let the border transition finish
    const look = await p.evaluate(() => {
      const f = getComputedStyle(document.getElementById('svcPrice0'));
      const e = getComputedStyle(document.getElementById('err-svc-0'));
      return { border: f.borderTopColor, err: e.color };
    });
    ok(look.border === 'rgb(196, 50, 47)' && look.err === 'rgb(196, 50, 47)', 'invalid field and error text are red', look);
    await p.focus('#fAddress');
    const ring = await p.evaluate(() => { const s = getComputedStyle(document.getElementById('fAddress')); return s.outlineStyle + ' ' + s.outlineColor; });
    ok(ring === 'solid rgb(75, 58, 207)', 'solid focus ring on inputs', ring);
    ok(await p.evaluate(() => Array.from(document.querySelectorAll('#fCategory option')).every(o => !/\p{Extended_Pictographic}/u.test(o.textContent))), 'no emoji in category options');
    await p.context().close();
  }
  {
    // location timeout is not blamed on permissions
    const p = await newPage(browser, { lang: 'en', geoError: 3 });
    await p.goto(URL);
    await p.click('#nearBtn');
    await p.waitForFunction(() => /right now/.test(document.getElementById('locStatus').textContent));
    ok(true, 'timeout message on home');
    await p.goto(URL + '#/new');
    await p.click('#fLocBtn');
    await p.waitForFunction(() => /right now/.test(document.getElementById('fLocStatus').textContent));
    ok(true, 'timeout message on the form');
    await p.context().close();
  }
  {
    // the minute refresh is on time and quiet
    const p = await newPage(browser, { lang: 'en', time: IL('2026-11-22T18:59:30') });
    await p.goto(URL + '#/shop/s3');
    await p.clock.runFor(35000);
    ok(/closed/i.test(await p.locator('#shopStatus .pill').textContent()), 'status flips right at closing time', await p.locator('#shopStatus').textContent());
    await p.goto(URL);
    await p.clock.runFor(1000);
    await p.evaluate(() => { window.__mut = 0; new MutationObserver(m => { window.__mut += m.length; }).observe(document.getElementById('app'), { subtree: true, childList: true, characterData: true }); });
    await p.clock.runFor(150000);
    ok(await p.evaluate(() => window.__mut) === 0, 'no re-render when nothing changed', await p.evaluate(() => window.__mut));
    await p.context().close();
  }
  {
    // owner text with a long URL: no sideways scroll, link is clickable; owner text language
    const longAbout = owner('u9', { about: 'Find my work on Instagram: https://www.instagram.com/nailstudio.dana.telaviv.official/ — תודה', services: [{ name: 'Keratin/Brazilian/Botox/Smoothing', price: 300, minutes: 90 }], name: 'סטודיו דנה' });
    for (const lang of ['en', 'he']) {
      for (const w of [320, 375]) {
        const p = await newPage(browser, { lang, viewport: { width: w, height: 800 }, seed: ['nearby.myShops', JSON.stringify([longAbout])] });
        await p.goto(URL + '#/shop/u9');
        await p.waitForTimeout(80);
        ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `long URL no overflow ${lang} ${w}`);
        if (lang === 'en' && w === 320) {
          ok(await p.locator('.about a[href^="https://www.instagram.com/"]').count() === 1, 'URL in About is a link');
          ok(await p.locator('.shop-title h1 bdi').getAttribute('lang') === 'he', 'Hebrew name marked lang=he in English UI');
          const gaps = await p.evaluate(() => { const els = Array.from(document.querySelectorAll('.shop-main > *, .shop-side > *')); const r = els.map(e => e.getBoundingClientRect()); return r.slice(1).map((b, i) => Math.round(b.top - r[i].bottom)); });
          ok(gaps.every(g => g >= 10), 'panels have gaps on phones', gaps);
          const tile = await p.evaluate(() => { const t = document.querySelector('.shop-title .logo-tile'); const g = document.querySelector('.shop-hero .gallery-wrap'); if (!t || !g) return null; const a = t.getBoundingClientRect(), b = g.getBoundingClientRect(); return { top: a.top, bottom: a.bottom, edge: b.bottom, hidden: t.getAttribute('aria-hidden') }; });
          ok(tile && tile.top < tile.edge && tile.bottom > tile.edge && tile.hidden === 'true', 'shop hero shows the logo tile over the photo edge', tile);
        }
        await p.context().close();
      }
    }
  }
  {
    // fallback fonts: the search bar still fits on phones
    for (const lang of ['he', 'en']) {
      const p = await newPage(browser, { lang, viewport: { width: 320, height: 640 }, noFonts: true });
      await p.goto(URL);
      await p.waitForTimeout(100);
      ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'no overflow without web fonts ' + lang);
      const nb = await p.evaluate(() => { const r = document.getElementById('nearBtn').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; });
      ok(nb, 'Near me button fully on screen without web fonts ' + lang);
      await p.context().close();
    }
  }
  {
    // accessibility details on home
    const p = await newPage(browser, { lang: 'en', viewport: { width: 390, height: 844 }, seed: ['nearby.myShops', JSON.stringify([owner('u1')])] });
    await p.goto(URL);
    const d = await p.evaluate(() => { const a = document.querySelector('#grid a[href="#/shop/u1"]'); return document.getElementById(a.getAttribute('aria-describedby')).textContent; });
    ok(/^Yours/.test(d), '"Yours" is in the card description', d);
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('locStatus')).display !== 'none'), 'status region exists while empty');
    const lb = await p.evaluate(() => { const b = document.getElementById('langBtn'); return [b.textContent, b.getAttribute('aria-label')]; });
    ok(lb[1].startsWith(lb[0]), 'language button name starts with its visible text', lb);
    ok(await p.locator('#street').getAttribute('role') === 'group' && await p.locator('nav.street').count() === 0, 'categories are a group, not a nav');
    await p.fill('#q', 'nail'); await p.press('#q', 'Enter');
    ok(await p.evaluate(() => document.activeElement.id) === 'resultsTitle', 'Enter in search moves focus to the results heading');
    await p.fill('#q', '');
    // tiles: labels not clipped, keyboard focus clears the fade
    const clipped = await p.evaluate(() => Array.from(document.querySelectorAll('.shopfront .name')).filter(n => n.scrollWidth > n.clientWidth + 1 || n.getBoundingClientRect().right > n.closest('.shopfront').getBoundingClientRect().right + 1).map(n => n.textContent));
    ok(clipped.length === 0, 'no clipped tile labels', clipped);
    await p.focus('#q');
    for (let i = 0; i < 5; i++) await p.keyboard.press('Tab');
    const tile = await p.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { cls: document.activeElement.className, l: r.left, r: r.right, w: innerWidth }; });
    ok(/shopfront/.test(tile.cls) && tile.l >= 0 && tile.r <= tile.w - 30, 'focused tile is clear of the faded edge', tile);
    const sw = await p.evaluate(() => [getComputedStyle(document.querySelector('.toggle .sw')).backgroundColor, getComputedStyle(document.querySelector('.toggle')).borderTopColor]);
    ok(sw[0] === 'rgb(133, 131, 170)' && sw[1] === 'rgb(133, 131, 170)', 'Open-now switch has a visible track and matching border', sw);
    await p.context().close();
  }
  {
    // motion: the sign swings once; not at all with reduced motion
    const p = await newPage(browser, { lang: 'en', viewport: { width: 1280, height: 800 } });
    await p.goto(URL);
    const it = await p.evaluate(() => document.querySelector('.store .sign').getAnimations().map(a => a.effect.getComputedTiming().iterations));
    ok(it.length === 1 && it[0] === 1, 'sign swings once', it);
    await p.context().close();
    const q = await newPage(browser, { lang: 'en', viewport: { width: 1280, height: 800 }, reducedMotion: true });
    await q.goto(URL);
    ok(await q.evaluate(() => document.querySelector('.store .sign').getAnimations().length) === 0, 'no sign animation with reduced motion');
    await q.context().close();
  }
  {
    // gallery: buttons and counter; owner bar visible on desktop; edit of a sample shop
    const photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC';
    for (const lang of ['en', 'he']) {
      const p = await newPage(browser, { lang, viewport: { width: 1280, height: 800 }, seed: ['nearby.myShops', JSON.stringify([owner('u1', { photos: [photo, photo, photo] })])] });
      await p.goto(URL + '#/shop/u1');
      await p.waitForSelector('#galleryCount');
      ok(await p.locator('#galleryCount').textContent() === '1 / 3' && await p.locator('.gallery-btn.prev').isDisabled(), 'gallery starts at 1 / 3 ' + lang);
      await p.click('.gallery-btn.next');
      await p.waitForFunction(() => document.getElementById('galleryCount').textContent === '2 / 3', null, { timeout: 3000 }).catch(() => {});
      ok(await p.locator('#galleryCount').textContent() === '2 / 3', 'next photo button works ' + lang, await p.locator('#galleryCount').textContent());
      const bar = await p.evaluate(() => document.querySelector('.owner-bar').getBoundingClientRect().bottom);
      ok(bar < 800, 'owner Edit/Delete visible on the first screen ' + lang, bar);
      await p.context().close();
    }
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL + '#/edit/s1');
    ok(/only the owner/i.test(await p.locator('h1').textContent()) && await p.locator('a[href="#/shop/s1"]').count() === 1, 'sample shop edit says owner only');
    await p.goto(URL + '#/edit/');
    ok(await p.locator('#shopForm').count() === 0, 'empty edit id is not a blank new form');
    await p.context().close();
  }
  {
    // two tabs: a stale edit tab learns the shop was deleted; home keeps search focus on sync
    const ctxP = await newPage(browser, { lang: 'en', seed: ['nearby.myShops', JSON.stringify([owner('u1')])] });
    const ctx = ctxP.context();
    await ctxP.goto(URL + '#/edit/u1');
    await ctxP.waitForSelector('#shopForm');
    const b = await ctx.newPage();
    await b.goto(URL);
    await b.waitForSelector('#grid');
    await b.focus('#q'); await b.keyboard.type('nai');
    await ctxP.evaluate(() => { localStorage.setItem('nearby.myShops', '[]'); });
    await b.waitForTimeout(300);
    ok(await b.evaluate(() => document.activeElement.id) === 'q', 'search keeps focus when another tab changes shops');
    await b.keyboard.type('l');
    ok(await b.inputValue('#q') === 'nail', 'typing continues after sync', await b.inputValue('#q'));
    await b.evaluate(() => localStorage.setItem('nearby.myShops', '[]'));
    await ctxP.evaluate(() => { localStorage.setItem('nearby.myShops', JSON.stringify([])); });
    // tab A: shop is deleted from tab B
    await ctxP.reload();
    await ctxP.waitForSelector('h1');
    ok(await ctxP.locator('#shopForm').count() === 0, 'edit of a deleted shop shows not found');
    await ctx.close();
    const a2 = await newPage(browser, { lang: 'en', seed: ['nearby.myShops', JSON.stringify([owner('u1')])] });
    await a2.goto(URL + '#/edit/u1');
    await a2.waitForSelector('#shopForm');
    const b2 = await a2.context().newPage();
    await b2.goto(URL);
    await b2.evaluate(() => localStorage.setItem('nearby.myShops', '[]'));
    await a2.waitForFunction(() => !document.getElementById('shopForm'));
    ok(/another tab/i.test(await a2.locator('h1').textContent()), 'stale edit tab says the shop was deleted in another tab', await a2.locator('h1').textContent());
    await a2.context().close();
  }
  {
    // share without Web Share / clipboard: a visible toast with the link
    const p = await newPage(browser, { lang: 'en', viewport: { width: 375, height: 812 } });
    await p.goto(URL + '#/shop/s3');
    await p.evaluate(() => { try { delete Navigator.prototype.share; } catch (e) {} navigator.clipboard.writeText = () => Promise.reject(new Error('no')); window.scrollTo(0, 2000); });
    await p.click('.action-bar [data-share]');
    await p.waitForSelector('#toast:not([hidden])');
    await p.waitForTimeout(400); // slide-in animation
    const r = await p.evaluate(() => { const b = document.getElementById('toast').getBoundingClientRect(); const bar = document.querySelector('.action-bar').getBoundingClientRect(); return { top: b.top, bottom: b.bottom, bar: bar.top, h: innerHeight }; });
    ok(r.top >= 0 && r.bottom <= r.bar, 'share toast is on screen above the action bar', r);
    ok((await p.inputValue('#toastUrl')).includes('#/shop/s3'), 'fallback shows the link to copy');
    await p.context().close();
  }
  {
    // layout: landscape phone and 1024x768 show something useful on the first screen
    const p = await newPage(browser, { lang: 'en', viewport: { width: 812, height: 375 } });
    await p.goto(URL);
    ok(await p.evaluate(() => document.getElementById('q').getBoundingClientRect().bottom) < 375, 'landscape: search on the first screen');
    await p.goto(URL + '#/shop/s1');
    await p.waitForTimeout(60);
    ok(await p.evaluate(() => { const a = document.querySelector('.action-bar'); return getComputedStyle(a).position === 'fixed' && a.getBoundingClientRect().bottom <= innerHeight; }), 'landscape: Call bar stays on screen');
    await p.context().close();
    const q = await newPage(browser, { lang: 'en', viewport: { width: 1024, height: 768 } });
    await q.goto(URL);
    await q.waitForTimeout(100);
    ok(await q.evaluate(() => document.querySelector('#grid .card').getBoundingClientRect().top) < 768, '1024x768: first result on the first screen', await q.evaluate(() => document.querySelector('#grid .card').getBoundingClientRect().top));
    await q.context().close();
  }

  // 15. Self-contained: home, a shop page and the form, in Hebrew and English, request nothing outside nearby.test
  {
    const outside = [];
    for (const lang of ['he', 'en']) {
      const p = await newPage(browser, { lang });
      p.context().on('request', r => { const u = r.url(); if (!/^(data|blob):/.test(u) && !u.startsWith('https://nearby.test/')) outside.push(lang + ' ' + u); });
      for (const route of ['', '#/shop/s1', '#/new']) {
        await p.goto(URL + route);
        await p.waitForTimeout(500);
        await p.evaluate(() => document.fonts.ready);
      }
      // a request the CSP stops before it reaches the network fires no request event, only a console error
      outside.push(...p.errors.filter(e => /Content Security Policy/.test(e)).map(e => lang + ' ' + e));
      await p.context().close();
    }
    ok(outside.length === 0, 'no request to any host other than nearby.test (home, shop, form; he and en)', outside);
  }

  // ======== Step 2 · FOUNDATION checks ========
  {
    // the seam is installed before the app starts; the store counts its calls and logs them; failOnce is used up
    const p = await newPage(browser, { lang: 'en', store: { failOnce: { refresh: 'network' }, log: [] } });
    await p.goto(URL);
    const seam = await p.evaluate(() => { const t = globalThis.__nearbyTest || {}; return { log: (t.log || []).join(), left: Object.keys(t.failOnce || {}) }; });
    const n = await calls(p, 'refresh');
    await setStore(p, { log: [] });
    const set = await p.evaluate(() => Array.isArray(globalThis.__nearbyTest.log) && globalThis.__nearbyTest.log.length === 0 && globalThis.__nearbyTest.calls.refresh === 1);
    ok(n === 1 && seam.log === 'refresh:start,refresh:end' && seam.left.length === 0 && set && p.errors.length === 0, 'seam: calls counted, opts.store installed', { n, seam, set, errors: p.errors });
    await p.context().close();
  }
  {
    // the language choice is kept on the device (prefs.js), under the old key
    const p = await newPage(browser);
    await p.goto(URL);
    await p.click('#langBtn');
    const saved = await p.evaluate(() => localStorage.getItem('nearby.lang'));
    await p.reload();
    await p.waitForSelector('#grid .card');
    ok(saved === '"en"' && await p.evaluate(() => document.documentElement.lang) === 'en' && await p.locator('#grid .card').count() === 10 && p.errors.length === 0, 'prefs: language kept under nearby.lang', [saved, p.errors]);
    await p.context().close();
  }
  {
    // the offline banner (the seam makes local mode follow the connection): Hebrew, English, gone again online
    const p = await newPage(browser, { lang: 'he', store: {} });
    await p.goto(URL);
    const banner = () => p.evaluate(() => { const b = document.getElementById('netBanner'); return { shown: !b.hidden && b.getBoundingClientRect().height > 0, text: b.textContent, note: b.matches('.note') || !!b.querySelector('.note'), svg: !!b.querySelector('svg') }; });
    const before = await banner();
    const notes = await p.locator('.note').count();
    await p.context().setOffline(true);
    await p.waitForFunction(() => !document.getElementById('netBanner').hidden);
    const he = await banner();
    await p.waitForFunction(() => document.getElementById('announcer').textContent.length > 0);
    const said = await p.locator('#announcer').textContent();
    await p.click('#langBtn');
    const en = await banner();
    await p.context().setOffline(false);
    await p.waitForFunction(() => document.getElementById('netBanner').hidden);
    await p.waitForFunction(() => /back online/.test(document.getElementById('announcer').textContent));
    const after = await banner();
    ok(!before.shown && he.shown && he.svg && he.text === 'אין חיבור לאינטרנט. מוצג מה שכבר נטען.' && said === he.text &&
      en.shown && en.text === "You're offline. Showing what's already loaded." && !after.shown && !he.note &&
      await p.locator('.note').count() === notes && await p.locator('#grid .card').count() === 10 && p.errors.length === 0,
      'offline banner in both languages, hidden again online', { before, he, said, en, after, errors: p.errors });
    await p.context().close();
  }
  {
    // D1: without the seam, local mode never shows the offline banner
    const p = await newPage(browser, { lang: 'en' });
    await p.goto(URL);
    await p.evaluate(() => { window.__offline = 0; addEventListener('offline', () => { window.__offline++; }); }); // runs after the app's own listener
    await p.context().setOffline(true);
    await p.waitForFunction(() => window.__offline > 0);
    const hidden = await p.evaluate(() => document.getElementById('netBanner').hidden);
    ok(hidden && await p.locator('#grid .card').count() === 10 && p.errors.length === 0, 'no offline banner without the seam', p.errors);
    await p.context().setOffline(false);
    await p.context().close();
  }
  {
    // drafts are kept on the device: closing the tab keeps what was typed
    const p = await newPage(browser, { lang: 'en' });
    const ctx = p.context();
    await p.goto(URL + '#/new');
    await p.fill('#fName', 'Kept draft');
    await p.fill('#fAbout', 'typed before closing');
    const errors = p.errors.slice();
    await p.close();
    const q = await ctx.newPage();
    q.errors = [];
    q.on('pageerror', e => q.errors.push(e.message));
    q.on('console', m => { if (m.type() === 'error') q.errors.push(m.text()); });
    await q.goto(URL + '#/new');
    await q.waitForSelector('#shopForm');
    const got = [await q.inputValue('#fName'), await q.inputValue('#fAbout'), await q.locator('#draftNote').count()];
    ok(got[0] === 'Kept draft' && got[1] === 'typed before closing' && got[2] === 1 && errors.length === 0 && q.errors.length === 0, 'drafts: a typed draft outlives the tab', { got, errors, later: q.errors });
    await ctx.close();
  }
  {
    // drafts that older versions kept in sessionStorage move to localStorage; sessionStorage is not cleared
    const p = await newPage(browser, { lang: 'en', seed: ['nearby.myShops', JSON.stringify([owner('u1')])] });
    await p.context().addInitScript(() => {
      if (sessionStorage.getItem('oldDrafts')) return;
      sessionStorage.setItem('oldDrafts', '1');
      sessionStorage.setItem('nearby.draft.new', JSON.stringify({ name: 'Old draft', dirty: true }));
      sessionStorage.setItem('nearby.draft.edit.u1', JSON.stringify({ name: 'Old edit', dirty: true }));
      sessionStorage.setItem('nearby.notice', JSON.stringify({ hash: '#/', kind: 'new' }));
    });
    await p.goto(URL + '#/new');
    await p.waitForSelector('#shopForm');
    const fresh = [await p.inputValue('#fName'), await p.locator('#draftNote').count()];
    const st = await p.evaluate(() => ({
      session: ['nearby.draft.new', 'nearby.draft.edit.u1', 'nearby.notice'].map(k => sessionStorage.getItem(k)),
      seeded: sessionStorage.getItem('seeded'), mark: sessionStorage.getItem('oldDrafts'),
      local: ['nearby.draft.new', 'nearby.draft.edit.u1'].map(k => JSON.parse(localStorage.getItem(k) || 'null'))
    }));
    await p.goto(URL + '#/edit/u1');
    await p.waitForSelector('#shopForm');
    const edit = [await p.inputValue('#fName'), await p.locator('#draftNote').count()];
    ok(fresh[0] === 'Old draft' && fresh[1] === 1 && edit[0] === 'Old edit' && edit[1] === 1 && st.session.every(v => v === null) &&
      st.seeded === '1' && st.mark === '1' && st.local[0] && st.local[0].name === 'Old draft' && st.local[1] && st.local[1].name === 'Old edit' && p.errors.length === 0,
      'drafts: old sessionStorage drafts move to localStorage', { fresh, edit, st, errors: p.errors });
    await p.context().close();
    // a draft already on the device wins over an old copy; the oldest single draft (nearby.draft) still moves
    const q = await newPage(browser, { lang: 'en', seed: ['nearby.draft.new', JSON.stringify({ name: 'Newer', dirty: true })] });
    await q.context().addInitScript(() => {
      if (sessionStorage.getItem('oldDrafts')) return;
      sessionStorage.setItem('oldDrafts', '1');
      sessionStorage.setItem('nearby.draft.new', JSON.stringify({ name: 'Old draft', dirty: true }));
      sessionStorage.setItem('nearby.draft', JSON.stringify({ name: 'Oldest' }));
    });
    await q.goto(URL + '#/new');
    await q.waitForSelector('#shopForm');
    const kept = [await q.inputValue('#fName'), await q.evaluate(() => [sessionStorage.getItem('nearby.draft.new'), sessionStorage.getItem('nearby.draft')])];
    await q.context().close();
    const r = await newPage(browser, { lang: 'en' });
    await r.context().addInitScript(() => {
      if (sessionStorage.getItem('oldDrafts')) return;
      sessionStorage.setItem('oldDrafts', '1');
      sessionStorage.setItem('nearby.draft', JSON.stringify({ name: 'Oldest' }));
    });
    await r.goto(URL + '#/new');
    await r.waitForSelector('#shopForm');
    const oldest = [await r.inputValue('#fName'), await r.locator('#draftNote').count(), await r.evaluate(() => sessionStorage.getItem('nearby.draft'))];
    ok(kept[0] === 'Newer' && kept[1].every(v => v === null) && oldest[0] === 'Oldest' && oldest[1] === 1 && oldest[2] === null && q.errors.length === 0 && r.errors.length === 0,
      'drafts: a draft on the device wins, and the oldest single draft still moves', { kept, oldest });
    await r.context().close();
  }
  // ======== Step 2 · HOME checks — home agent: add blocks directly below this line ========
  // (end of HOME checks)

  // Seam options: opts.store { delay, fail, failOnce, status, partial, info, log }, opts.idb, opts.watchSkel;
  // helpers setStore(p, patch), calls(p, op), skelSeen(p), photoFiles(n), PNG, storedDraft(p, slot), idbPhotos(p, slot).
  // A shop-page or edit-form loading check uses delay.refresh 10000 so the list never lands mid-check.
  // Every block opens its own pages and closes their contexts.
  // A second page in a seeded context re-runs the seed and rewrites nearby.myShops when it loads.

  // ======== Step 2 · SHOP PAGE checks — shop agent: add blocks directly below this line ========
  // (end of SHOP PAGE checks)

  // Errors arrive as codes (store/contract.js); views never read messages.
  // setOffline(true) fires 'offline' and flips navigator.onLine (checked in Chromium); local mode
  // only notices it when opts.store is set (D1). A check asserts only DOM its own files draw (9.2).
  // A reload re-installs opts.store: failOnce comes back. Use setStore for one-off changes.
  // Keep each block independent of the others' order.

  // ======== Step 2 · FORM checks — form agent: add blocks directly below this line ========
  // (end of FORM checks)

  // 12. Screenshots for review
  for (const [w, h, tag] of [[390, 844, 'm'], [1280, 860, 'd']]) {
    for (const lang of ['he', 'en']) {
      const p = await newPage(browser, { lang, viewport: { width: w, height: h }, time: IL('2026-11-22T11:00:00') });
      await p.goto(URL); await p.waitForTimeout(800);
      await p.screenshot({ path: `${OUT}/home-${lang}-${tag}.png`, fullPage: true });
      await p.goto(URL + '#/shop/s1'); await p.waitForTimeout(600);
      await p.screenshot({ path: `${OUT}/shop-${lang}-${tag}.png`, fullPage: true });
      await p.goto(URL + '#/new'); await p.waitForTimeout(400);
      await p.screenshot({ path: `${OUT}/form-${lang}-${tag}.png`, fullPage: true });
      await p.context().close();
    }
  }

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

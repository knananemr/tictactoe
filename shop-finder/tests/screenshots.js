// Final screenshots for the Indigo re-skin -> theme-final/
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '..'), OUT = path.join(__dirname, 'screenshots-out');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css' };
const IL = iso => new Date(iso + '+02:00');
async function ctxFor(b, lang, phone, extra) {
  const ctx = await b.newContext(Object.assign(phone
    ? { viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 }, { geolocation: { latitude: 32.07, longitude: 34.774 }, permissions: ['geolocation'], timezoneId: 'Asia/Jerusalem' }, extra || {}));
  await ctx.route('https://nearby.test/**', r => { const f = r.request().url().replace('https://nearby.test/', '').split(/[?#]/)[0] || 'index.html'; try { r.fulfill({ status: 200, contentType: TYPES[f.split('.').pop()] || 'application/octet-stream', body: fs.readFileSync(path.join(DIR, f)) }); } catch (e) { r.fulfill({ status: 404, body: '' }); } });
  await ctx.clock.install({ time: IL('2026-11-22T11:00:00') });
  await ctx.addInitScript(l => localStorage.setItem('nearby.lang', JSON.stringify(l)), lang);
  return ctx;
}
async function fillPhotoShop(p, lang) {
  await p.goto('https://nearby.test/index.html#/new'); await p.waitForTimeout(600);
  const mk = (bg, fg) => p.evaluate(([bg, fg]) => { const c = document.createElement('canvas'); c.width = 800; c.height = 600; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 800, 600); g.addColorStop(0, bg); g.addColorStop(1, '#222'); x.fillStyle = g; x.fillRect(0, 0, 800, 600); x.fillStyle = fg; x.fillRect(300, 150, 220, 330); x.beginPath(); x.arc(410, 140, 70, 0, 7); x.fill(); return c.toDataURL('image/jpeg', .85).split(',')[1]; }, [bg, fg]);
  const a = await mk('#a07850', '#3a2a20'), b2 = await mk('#e8eef4', '#ffffff');
  await p.fill('#fName', lang === 'he' ? 'מספרת אלפא' : 'Alpha Barbers');
  await p.selectOption('#fCategory', 'barber').catch(() => {});
  await p.fill('#fAddress', lang === 'he' ? 'דיזנגוף 100, תל אביב' : '100 Dizengoff St, Tel Aviv');
  await p.fill('#fPhone', '0521234567');
  await p.setInputFiles('#fPhotos', [{ name: 'a.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(a, 'base64') }, { name: 'b.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(b2, 'base64') }]);
  await p.waitForFunction(() => document.querySelectorAll('#thumbs img').length === 2);
  await p.fill('#svcName0', lang === 'he' ? 'תספורת' : 'Haircut'); await p.fill('#svcPrice0', '70');
  await p.click('#fLocBtn').catch(() => {}); await p.waitForTimeout(300);
}
const scrollTo = (p, sel, off = 80) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); if (e) window.scrollTo(0, e.getBoundingClientRect().top + scrollY - off); }, [sel, off]);
const which = process.argv.slice(2); const want = n => !which.length || which.includes(n);
(async () => {
  const b = await chromium.launch();
  const shot = (p, n, o) => p.screenshot(Object.assign({ path: path.join(OUT, n + '.png') }, o || {}));
  const box = (p, s) => p.evaluate(s => [...document.querySelectorAll(s)].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(r.top), Math.round(r.height)]; }), s);
  if (want('home')) {
    for (const lang of ['he', 'en']) {
      const ctx = await ctxFor(b, lang, true); const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
      await p.goto('https://nearby.test/index.html#/'); await p.waitForTimeout(900);
      await shot(p, 'home-' + lang);
      console.log(lang, 'navNew', await box(p, '#navNew'), 'brand', await box(p, '.brand'), 'lang', await box(p, '#langBtn'), 'chips', (await box(p, '.shopfront')).slice(0, 4));
      if (lang === 'he') { await scrollTo(p, '#grid', 74); await p.waitForTimeout(300); await shot(p, 'home-he-cards'); }
      await ctx.close();
    }
  }
  if (want('shop')) {
    const ctx = await ctxFor(b, 'he', true); const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto('https://nearby.test/index.html#/shop/s1'); await p.waitForTimeout(900);
    await shot(p, 'shop-he');
    console.log('bar', await box(p, '.action-bar .btn'));
    await scrollTo(p, '.price-list', 140); await p.waitForTimeout(300); await shot(p, 'shop-he-2');
    await ctx.close();
    for (const [lang, w] of [['en', 320], ['he', 320], ['en', 359]]) {
      const c = await ctxFor(b, lang, true, { viewport: { width: w, height: 700 } }); const q = await c.newPage();
      await q.goto('https://nearby.test/index.html#/shop/s1'); await q.waitForTimeout(700);
      console.log('bar', lang, w, await box(q, '.action-bar .btn'), 'sw', await q.evaluate(() => document.documentElement.scrollWidth - innerWidth));
      if (lang === 'en' && w === 320) await shot(q, '_bar-en-320');
      await c.close();
    }
  }
  if (want('photos')) {
    const ctx = await ctxFor(b, 'he', true); const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
    await fillPhotoShop(p, 'he');
    await scrollTo(p, '.preview', 90); await p.waitForTimeout(300); await shot(p, 'form-he-preview');
    await p.click('#submitBtn'); await p.waitForTimeout(900);
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
    await shot(p, 'shop-photos-he');
    await p.focus('#gallery'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(200);
    console.log('focused', await p.evaluate(() => document.activeElement.id));
    await shot(p, '_gallery-focus');
    await p.goto('https://nearby.test/index.html#/'); await p.waitForTimeout(800);
    await scrollTo(p, '#grid', 74); await p.waitForTimeout(300); await shot(p, '_home-cards-photo');
    await ctx.close();
  }
  if (want('form')) {
    const ctx = await ctxFor(b, 'he', true); const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto('https://nearby.test/index.html#/new'); await p.waitForTimeout(800);
    await shot(p, 'form-he');
    await p.fill('#fName', 'מספרת אלפא');
    await scrollTo(p, '#hoursGrid', 140); await p.waitForTimeout(200); await shot(p, 'form-he-hours');
    await p.focus('#fPhotos'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
    await scrollTo(p, '.dropzone', 160); await p.waitForTimeout(200); await shot(p, '_dropzone-focus');
    await ctx.close();
  }
  if (want('desk')) {
    const ctx = await ctxFor(b, 'he', false); const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto('https://nearby.test/index.html#/'); await p.waitForTimeout(3600);
    await shot(p, 'desk-home');
    await p.goto('https://nearby.test/index.html#/shop/s1'); await p.waitForTimeout(900);
    await shot(p, 'desk-shop');
    await fillPhotoShop(p, 'he');
    await p.fill('#fAddress', 'רחוב הרצל המאוד ארוך והמאוד מפורט מספר מאה עשרים ושלוש, קומה שנייה, תל אביב יפו');
    await p.waitForTimeout(300);
    console.log('desk form sw', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), await box(p, '#preview'));
    await p.click('#submitBtn'); await p.waitForTimeout(900); await p.evaluate(() => scrollTo(0, 0));
    await shot(p, '_desk-shop-photo');
    await ctx.close();
  }
  await b.close();
})();

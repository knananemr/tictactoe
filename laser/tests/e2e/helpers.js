// laser/tests/e2e/helpers.js
// Shared by every end-to-end spec (blueprint 2.7): openApp with a fixed clock and seeding,
// the strict guards (page error, console error, outside request), the WhatsApp stub,
// fixtures, and the few moves every spec repeats (add a client, save a file, pick a file).
// The tests drive the real page from disk (file://); the app has no test hook.
'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const base = require('playwright/test');

const expect = base.expect;

const LASER = path.resolve(__dirname, '..', '..');                    // the laser/ folder
const APP_URL = pathToFileURL(path.join(LASER, 'index.html')).href;
const UNIT_URL = pathToFileURL(path.join(LASER, 'tests', 'unit.html')).href;
const FIXTURES = path.join(LASER, 'tests', 'fixtures');

// The fixed "now" of the tests: Wednesday 18 November 2026, 10:00 in Asia/Jerusalem.
const NOW = '2026-11-18T10:00:00+02:00';
const TODAY = '2026-11-18';
const DAY_MS = 86400000;

const LOCAL = /^(file|blob|data):/;
// The one allowed outside address: WhatsApp in a new tab. It is always answered by the stub.
const WHATSAPP = /^https:\/\/(wa\.me|web\.whatsapp\.com)\//;

// ---- strict guards ------------------------------------------------------------------------

// attachGuards(context) -> { problems, requests, whatsapp }
//   problems   every page error, console error, dialog and request to an outside address
//   requests   every address the context asked for
//   whatsapp   the WhatsApp addresses a test opened (answered with an empty page here, so
//              nothing leaves the machine)
// The listeners sit on the context, not the page: a page-level guard does not see a request
// made by a new tab.
async function attachGuards(context) {
  const guards = { problems: [], requests: [], whatsapp: [] };
  context.on('request', (request) => {
    const url = request.url();
    guards.requests.push(url);
    if (!LOCAL.test(url) && !WHATSAPP.test(url)) guards.problems.push('request to an outside address: ' + url);
  });
  context.on('console', (message) => {
    if (message.type() === 'error') guards.problems.push('console error: ' + message.text());
  });
  context.on('weberror', (webError) => {
    const error = webError.error();
    guards.problems.push('page error: ' + ((error && error.message) || String(error)));
  });
  context.on('dialog', (dialog) => {
    guards.problems.push('dialog (' + dialog.type() + '): ' + dialog.message());
    dialog.dismiss().catch(() => {});
  });
  await context.route(WHATSAPP, (route) => {
    const request = route.request();
    if (request.isNavigationRequest()) guards.whatsapp.push(request.url());
    return route.fulfill({
      status: 200, contentType: 'text/html',
      body: '<!doctype html><meta charset="utf-8"><title>WhatsApp (test stub)</title>'
    });
  });
  return guards;
}

function expectClean(guards) {
  expect(guards.problems, 'no page error, no console error, no dialog, no outside request (2.7)').toEqual([]);
}

// `test` with the guards switched on for every test. A test that needs a context of its own
// (another locale, another time zone) asks for it with openContext(options); those contexts
// get the same guards and are checked and closed when the test ends.
const test = base.test.extend({
  guards: [async ({ context }, use) => {
    const guards = await attachGuards(context);
    await use(guards);
    expectClean(guards);
  }, { auto: true }],

  openContext: async ({ browser }, use) => {
    const made = [];
    await use(async (options) => {
      const context = await browser.newContext(options || {});
      const guards = await attachGuards(context);
      made.push({ context, guards });
      return { context, guards };
    });
    for (const one of made) await one.context.close();
    for (const one of made) expectClean(one.guards);
  }
});

// ---- fixtures and seeds -------------------------------------------------------------------

function fixtureNames() {
  return fs.readdirSync(FIXTURES).filter((name) => name.endsWith('.json')).sort();
}

function fixturePath(name) {
  return path.join(FIXTURES, name.endsWith('.json') ? name : name + '.json');
}

function fixtureText(name) {
  return fs.readFileSync(fixturePath(name || 'backup-step1'), 'utf8');
}

// fixtureDoc(name, change) -> the document of a backup fixture as the app would store it
// (without the two fields a backup file adds). change(doc) may edit it.
function fixtureDoc(name, change) {
  const doc = JSON.parse(fixtureText(name));
  delete doc.exportedAt;
  delete doc.appVersion;
  if (typeof change === 'function') change(doc);
  return doc;
}

// A quiet seed for tests that start with clients already typed: the step 1 fixture with no
// change waiting for a backup. change(doc) may edit it.
function seedDoc(change) {
  return fixtureDoc('backup-step1', (doc) => {
    doc.meta.unsavedSince = null;
    doc.meta.changesSinceExport = 0;
    if (typeof change === 'function') change(doc);
  });
}

function toSeed(seed) {
  if (typeof seed === 'string') return toSeed(fixtureDoc(seed));
  if (seed && typeof seed.text === 'string') return { text: seed.text, rev: String(seed.rev) };
  return { text: JSON.stringify(seed), rev: String(seed.rev) };
}

// ---- opening the app ----------------------------------------------------------------------

// openApp(page, { hash, now, seed })
//   hash   '#/clients' and so on (default: none, the Dashboard)
//   now    the fixed clock, installed before the page loads (default NOW; null = the real clock).
//          Time then runs on from there; page.clock.fastForward moves it.
//   seed   a document, a fixture name, or { text, rev }: put in localStorage['laser.doc'] and
//          ['laser.rev'] before the app starts. Only when nothing is stored yet, because the
//          script runs again on every reload. With no seed the test is a first run.
// A new browser context has empty storage, so every test starts clean.
async function openApp(page, options) {
  const o = options || {};
  const now = o.now === undefined ? NOW : o.now;
  if (now !== null) await page.clock.install({ time: new Date(now) });
  if (o.seed) {
    await page.addInitScript((seed) => {
      try {
        if (window.localStorage.getItem('laser.doc') === null) {
          window.localStorage.setItem('laser.doc', seed.text);
          window.localStorage.setItem('laser.rev', seed.rev);
        }
      } catch (e) { /* a page without storage (the stubbed WhatsApp tab) */ }
    }, toSeed(o.seed));
  }
  await page.goto(APP_URL + (o.hash || ''));
  await booted(page);
}

// The app has started: "Laser did not start" is gone and the app is shown.
async function booted(page) {
  await page.locator('#app:not([hidden])').waitFor();
  await expect(page.locator('#boot-fail')).toHaveCount(0);
}

// A first run taken past the Welcome card with its Start button.
async function openStarted(page, options) {
  await openApp(page, options);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.locator('[data-card="welcome"]')).toHaveCount(0);
}

// ---- reading what the app holds -------------------------------------------------------------

// What is on disk, read straight from the browser's storage.
function stored(page) {
  return page.evaluate(() => {
    const text = window.localStorage.getItem('laser.doc');
    return {
      text: text,
      doc: text === null ? null : JSON.parse(text),
      rev: window.localStorage.getItem('laser.rev'),
      keys: Object.keys(window.localStorage).sort()
    };
  });
}

// The live clients on disk, sorted by name.
async function storedClients(page) {
  const s = await stored(page);
  return s.doc.people
    .filter((p) => p.deletedAt === null && p.clientSince !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ---- moving around ------------------------------------------------------------------------

const VIEW_OF = {
  home: 'home', clients: 'clients', settings: 'settings',
  schedule: 'placeholder', leads: 'placeholder', progress: 'placeholder'
};

// goTo(page, 'clients') taps the tab (sidebar on a laptop, bottom bar on a phone; Settings is
// the gear on a phone) and waits until that screen is drawn.
async function goTo(page, name) {
  const tab = name === 'settings'
    ? page.locator('.nav__item[data-nav="settings"]:visible, .topbar__gear:visible').first()
    : page.locator('.nav__item[data-nav="' + name + '"]');
  await tab.click();
  await expect(page.locator('.nav__item[data-nav="' + name + '"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('[data-view="' + VIEW_OF[name] + '"]')).toBeVisible();
}

// The control that opens the New client form: "New" in the top bar on a laptop, the
// floating + on a phone.
function newButton(page) {
  return page.locator('.topbar__new:visible, .fab:visible').first();
}

function sheet(page) { return page.locator('.sheet[data-sheet="client"]'); }
function toast(page) { return page.locator('#toast-root'); }
function row(page, name) { return page.locator('.row').filter({ has: page.locator('.row__title', { hasText: name }) }); }

// fillClient(page, { name, phone, email, since: 'today' | 'earlier', sinceDate }) types into
// the open form. Fields that are left out are not touched.
async function fillClient(page, values) {
  const form = sheet(page);
  if (values.name !== undefined) await form.getByLabel('Full name').fill(values.name);
  if (values.phone !== undefined) await form.getByLabel('Phone').fill(values.phone);
  if (values.email !== undefined) await form.getByLabel('Email').fill(values.email);
  if (values.since === 'earlier') await form.getByText('Earlier (already my client)', { exact: true }).click();
  if (values.since === 'today') await form.getByText('Today', { exact: true }).click();
  if (values.sinceDate !== undefined) await form.getByLabel('Since when?').fill(values.sinceDate);
}

// addClient(page, values) adds one client through the real form and waits until it is saved.
async function addClient(page, values) {
  await newButton(page).click();
  await expect(sheet(page)).toBeVisible();
  await fillClient(page, values);
  await sheet(page).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(sheet(page)).toHaveCount(0);
}

// ---- files --------------------------------------------------------------------------------

// saveFile(page, action) runs the action that starts a download and returns the file.
async function saveFile(page, action) {
  const [download] = await Promise.all([page.waitForEvent('download'), action()]);
  const file = await download.path();
  return { name: download.suggestedFilename(), text: fs.readFileSync(file, 'utf8') };
}

// A file for a file chooser, made from text.
function fileOf(name, text) {
  return { name: name, mimeType: 'application/json', buffer: Buffer.from(text, 'utf8') };
}

// pickFile(page, button, file) taps a button that asks for a file and gives it one
// (a path, or the result of fileOf).
async function pickFile(page, button, file) {
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), button.click()]);
  await chooser.setFiles(file);
}

// ---- a save that fails ---------------------------------------------------------------------

// Blueprint 2.7: a failed save is simulated from the test by replacing the browser's own
// Storage.prototype.setItem with one that throws, as a full or blocked store does. The app
// has no test hook.
function throwingSetItem() {
  if (!window.__realSetItem) window.__realSetItem = window.Storage.prototype.setItem;
  window.Storage.prototype.setItem = function () {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
  };
}

// From now on, in this page, every write to the browser store fails.
function breakSaving(page) { return page.evaluate(throwingSetItem); }

// Writes work again.
function mendSaving(page) {
  return page.evaluate(() => {
    if (window.__realSetItem) window.Storage.prototype.setItem = window.__realSetItem;
  });
}

// Every write fails from the very first moment of every load of this page (call before openApp).
function breakSavingFromStart(page) { return page.addInitScript(throwingSetItem); }

// makeFixture(page, name) writes fixtures/<name>.json from the app's own example builder
// with a fixed date (2.7). The example builder (demo.js) arrives in step 1b; the step 1
// fixture was written by hand. Run once per step from a test tagged @fixture.
async function makeFixture(page, name) {
  const text = await page.evaluate((today) => {
    const L = window.Laser;
    if (!L.core.demo) throw new Error('Laser.core.demo arrives in step 1b');
    return L.core.backup.buildFile(L.core.demo.build(today)).text;
  }, TODAY);
  fs.writeFileSync(fixturePath(name), text + '\n');
  return text;
}

module.exports = {
  test, expect,
  LASER, APP_URL, UNIT_URL, FIXTURES, NOW, TODAY, DAY_MS,
  attachGuards, expectClean,
  fixtureNames, fixturePath, fixtureText, fixtureDoc, seedDoc,
  openApp, booted, openStarted, stored, storedClients,
  goTo, newButton, sheet, toast, row, fillClient, addClient,
  saveFile, fileOf, pickFile, breakSaving, mendSaving, breakSavingFromStart, makeFixture
};

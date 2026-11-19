// laser/tests/e2e/step1.spec.js
// Step 1, "The real look and your contact list": the acceptance checklist of blueprint
// section 10, item by item, driven through the real page opened from disk (file://).
// Every test is named after its item: A01 ... A23. Item 24 is the owner's own check on
// their Mac and cannot be run here. The file ends with the round trip of 2.7.
//
// The words the tests look for are copied from the blueprint, not from the app's code.
'use strict';

const { pathToFileURL } = require('url');
const { chromium } = require('playwright/test');
const {
  test, expect, LASER, APP_URL, UNIT_URL, NOW, TODAY, DAY_MS,
  attachGuards, expectClean, fixtureText, fixtureDoc, seedDoc,
  openApp, booted, openStarted, stored, storedClients,
  goTo, newButton, sheet, toast, row, fillClient, addClient,
  saveFile, fileOf, pickFile, breakSaving, mendSaving, breakSavingFromStart
} = require('./helpers');

// ---- the people and the words of the checklist ---------------------------------------------

const DANA = { name: 'Dana Levi', phone: '054-123 4567', email: 'dana+laser@example.com' };
const HEBREW = 'נועה ברק';
const PAYLOAD = '<img src=x onerror=alert(1)>';

// Blueprint 3.9: the three statements of the Welcome card and their "More" texts.
const STATEMENTS = [
  {
    title: 'Where your data lives',
    line: 'Your clients are saved in this browser on this device only: not on the internet, not in GitHub. Your protection is the backup file.',
    more: "Everything you type stays in this browser on this device. If this browser's history or site data is cleared, the data is deleted. Your protection is the backup file, kept somewhere outside this computer."
  },
  {
    title: 'What "automatic" means here',
    line: 'The app works out by itself who needs a reminder and writes the message. You press Send. It cannot send anything while it is closed.',
    more: 'Every time you open the app it works out by itself who needs a reminder today, who is due for their next session and who to follow up with, and it prepares each message. It cannot send anything while it is closed, and it cannot press Send for you: you tap Send, WhatsApp opens with the text ready, and you press send there. Fully hands-off sending needs a paid messaging service and a server. That is a possible later upgrade.'
  },
  {
    title: 'Phone and computer',
    line: 'Your phone and your computer do not share data. In the next step you try the app on both and choose where your client list lives. Until then, add only two or three clients.',
    more: "An iPhone cannot open the file on your computer. To use the app on a phone, the app's code (never your data) is published at a web address and added to the Home Screen. Moving the client list from one device to the other takes one backup and one import."
  }
];
const ASIDE = 'Used Laser before and see nothing here? You opened it in a different browser or a different place. Your data is still where you used it.';

// Blueprint 7.10: the placeholder pages.
const PLACEHOLDERS = [
  { tab: 'schedule', title: 'Schedule', text: 'Your appointments, past treatments and the 4-week rebooking list.', step: 'Arrives in step 3' },
  { tab: 'leads', title: 'Leads', text: 'People who asked about laser and are not clients yet.', step: 'Arrives in step 6' },
  { tab: 'progress', title: 'Progress', text: 'Your months side by side: people treated, new clients, money received.', step: 'Arrives in step 7' }
];

// Blueprint 6.1: the status tints and solids, as the browser reports them.
const COLOUR = {
  importantTint: 'rgb(255, 244, 204)', importantSolid: 'rgb(255, 203, 61)',
  urgentTint: 'rgb(253, 231, 229)', urgentSolid: 'rgb(194, 48, 42)',
  doneTint: 'rgb(226, 245, 233)', infoTint: 'rgb(228, 240, 251)', neutralTint: 'rgb(237, 241, 245)'
};

// ---- small moves ---------------------------------------------------------------------------

// A copy of the app that is past the Welcome card (currency ILS, country code 972) with no
// client yet and nothing waiting for a backup. change(doc) may edit it.
function emptySeed(change) {
  return seedDoc((doc) => {
    doc.people = [];
    if (typeof change === 'function') change(doc);
  });
}

function isPhone(testInfo) { return testInfo.project.name === 'phone'; }

function saveButton(page) { return sheet(page).getByRole('button', { name: 'Save', exact: true }); }

async function openNew(page) {
  await newButton(page).click();
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page).locator('.sheet__title')).toHaveText('New client');
}

async function openEdit(page, name) {
  // the name opens the client's page; Edit is in the row's menu
  await row(page, name).locator('[aria-haspopup="menu"]').click();
  await row(page, name).getByRole('menuitem', { name: 'Edit' }).click();
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page).locator('.sheet__title')).toHaveText('Edit client');
}

function backupSection(page) { return page.locator('#settings-backup'); }

function loadBackup(page, file) {
  return pickFile(page, backupSection(page).getByRole('button', { name: 'Load a backup' }), file);
}

function banner(page, kind) { return page.locator('#app .banner[data-banner="' + kind + '"]'); }

function background(locator) {
  return locator.evaluate((el) => window.getComputedStyle(el).backgroundColor);
}

// Nothing may scroll sideways: not the page, and not a box inside it.
async function expectNoSidewaysScroll(page, where) {
  const found = await page.evaluate(() => {
    const root = document.documentElement;
    window.scrollTo(200, window.scrollY);
    const moved = window.scrollX;
    window.scrollTo(0, window.scrollY);
    const boxes = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (el.getClientRects().length === 0) return;
      const overflow = window.getComputedStyle(el).overflowX;
      if ((overflow === 'auto' || overflow === 'scroll') && el.scrollWidth > el.clientWidth + 1) {
        boxes.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ').join('.'));
      }
    });
    return {
      page: Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth,
      moved: moved,
      boxes: boxes
    };
  });
  expect(found, 'sideways scrolling on ' + where).toEqual({ page: 0, moved: 0, boxes: [] });
}

// Where an element and its text sit on the screen.
function place(locator) {
  return locator.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const text = range.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height,
      textLeft: text.left, textRight: text.right, direction: style.direction, align: style.textAlign
    };
  });
}

// ============================================================================================

test.describe('A01 the app starts', () => {
  test('A01 the Dashboard is shown in under 2 seconds and "Laser did not start" never appears', async ({ page }) => {
    const before = Date.now();
    await page.goto(APP_URL);
    await expect(page.locator('[data-view="home"]')).toBeVisible();
    const took = Date.now() - before;
    await booted(page);
    expect(took, 'milliseconds from opening the file to the Dashboard').toBeLessThan(2000);
    await expect(page).toHaveTitle('Laser');
    await expect(page.locator('.topbar__title')).toHaveText('Dashboard');
    await expect(page.locator('.nav__item[data-nav="home"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('Laser did not start')).toHaveCount(0);
  });

  test('A01 with clients stored, the Dashboard shows the date line, the Clients figure and the backup line', async ({ page }, testInfo) => {
    await openApp(page, {
      seed: seedDoc((doc) => {
        doc.meta.lastExportAt = '2026-11-15T08:00:00.000Z';
        doc.meta.backupCheckedAt = '2026-11-15T08:01:00.000Z';
      })
    });
    await expect(page.locator('.topbar__title')).toHaveText('Dashboard');
    await expect(page.locator('.date-line')).toHaveText('Wednesday 18 November');
    const figure = page.locator('.summary__item[data-summary="clients"]');
    await expect(figure.locator('.summary__label')).toHaveText('Active clients');
    await expect(figure.locator('.summary__value')).toHaveText('4');
    const line = page.locator('[data-card="backup-line"]');
    await expect(line).toContainText('Last backup: 3 days ago');
    await expect(line.getByRole('button', { name: 'Back up now' })).toBeVisible();
    if (!isPhone(testInfo)) await expect(page.locator('.navbar__status')).toHaveText('Backed up 3 days ago');
    // nothing of a later step is on the Dashboard
    await expect(page.locator('[data-card="welcome"], [data-card="checklist"], [data-card="check-backup"]')).toHaveCount(0);
    await expect(page.getByText('See it with example data')).toHaveCount(0);

    // the figure is a link to the list
    await figure.click();
    await expect(page.locator('[data-view="clients"]')).toBeVisible();
    await expect(page.locator('.row')).toHaveCount(4);

    // an unknown address shows the Dashboard
    await page.goto(APP_URL + '#/nowhere/at/all');
    await expect(page.locator('[data-view="home"]')).toBeVisible();
    await expect(page.locator('.topbar__title')).toHaveText('Dashboard');
  });

  test('A01 if the scripts never run, "Laser did not start" is shown, and only after 2 seconds', async ({ openContext }) => {
    const { context } = await openContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(APP_URL);
    const message = page.locator('#boot-fail');
    await expect(message).toBeHidden();                      // a normal start is over long before
    await expect(message).toBeVisible({ timeout: 4000 });
    await expect(message.locator('h1')).toHaveText('Laser did not start');
    await expect(message).toContainText('your data is not lost: do not clear your browser data, and contact your builder.');
    await expect(page.locator('#app')).toBeHidden();
  });
});

test.describe('A02 nothing leaves the device', () => {
  test('A02 no request other than local files, on every screen and through a backup', async ({ page, guards }) => {
    await openApp(page, { seed: seedDoc() });
    for (const name of ['schedule', 'clients', 'leads', 'progress', 'settings', 'home', 'clients']) await goTo(page, name);
    await openNew(page);
    await sheet(page).getByLabel('Full name').fill('Someone');
    await sheet(page).getByLabel('Phone').fill('054-000 0000');
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);
    await openEdit(page, 'Dana Levi');
    await page.keyboard.press('Escape');
    await goTo(page, 'settings');
    const file = await saveFile(page, () => backupSection(page).getByRole('button', { name: 'Back up now' }).click());
    await pickFile(page, backupSection(page).getByRole('button', { name: 'Check a backup file' }), fileOf(file.name, file.text));
    await expect(toast(page)).toContainText('This backup is good');

    expect(guards.requests.length).toBeGreaterThan(20);
    expect(guards.requests.filter((url) => !/^(file|blob|data):/.test(url)), 'requests that are not local').toEqual([]);
    // and the local files are the app's own: the page, its styles, its scripts, its icon
    const root = pathToFileURL(LASER).href + '/';
    const files = Array.from(new Set(guards.requests.filter((url) => url.startsWith('file:'))))
      .map((url) => url.split('#')[0].split('?')[0]);
    expect(files.filter((url) => !url.startsWith(root)), 'files outside laser/').toEqual([]);
    const names = files.map((url) => url.slice(root.length));
    expect(names.filter((name) => !/^(index\.html|css\/[\w-]+\.css|js\/[\w./-]+\.js|img\/[\w.-]+)$/.test(name))).toEqual([]);
    expect(names.filter((name) => name.endsWith('.js')).length).toBe(34);
    expect(names.filter((name) => name.endsWith('.css')).length).toBe(5);
  });
});

test.describe('A03 the navigation on a laptop and on a phone', () => {
  test('A03 at 1280px there is a sidebar with Home, Schedule, Clients, Leads, Progress and Settings', async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), 'the laptop project is the 1280px screen');
    await openApp(page, { seed: seedDoc() });
    expect(page.viewportSize()).toEqual({ width: 1280, height: 800 });
    const items = page.locator('.navbar .nav__item');
    await expect(items).toHaveText(['Home', 'Schedule', 'Clients', 'Leads', 'Progress', 'Settings']);
    for (let i = 0; i < 6; i++) await expect(items.nth(i)).toBeVisible();

    // a sidebar: a full-height column at the left edge, the items stacked, the page beside it
    const bar = await page.locator('.navbar').boundingBox();
    expect(bar.x).toBe(0);
    expect(bar.y).toBe(0);
    expect(bar.width).toBe(240);
    expect(bar.height).toBe(800);
    const boxes = await items.evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }));
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].y, 'item ' + i + ' is below item ' + (i - 1)).toBeGreaterThanOrEqual(boxes[i - 1].y + boxes[i - 1].h);
      expect(boxes[i].x).toBe(boxes[0].x);
    }
    boxes.forEach((box) => expect(box.h).toBeGreaterThanOrEqual(44));
    expect(boxes[5].y, 'Settings is pinned at the bottom').toBeGreaterThan(700);
    const main = await page.locator('.shell__main').boundingBox();
    expect(main.x).toBe(240);

    // "New" is in the top bar; the phone's gear and floating + are not shown
    await expect(page.locator('.topbar__new')).toBeVisible();
    await expect(page.locator('.topbar__new')).toHaveText('New');
    await expect(page.locator('.fab')).toBeHidden();
    await expect(page.locator('.topbar__gear')).toBeHidden();

    // every item opens its screen, and the title in the top bar is the screen's name
    const titles = { schedule: 'Schedule', clients: 'Clients', leads: 'Leads', progress: 'Progress', settings: 'Settings', home: 'Dashboard' };
    for (const name of Object.keys(titles)) {
      await goTo(page, name);
      await expect(page.locator('.topbar__title')).toHaveText(titles[name]);
      await expect(page.locator('.nav__item[aria-current="page"]')).toHaveCount(1);
    }
  });

  test('A03 at 390px there is a bottom bar with the same five tabs and a floating + button', async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), 'the phone project is the 390px screen');
    await openApp(page, { seed: seedDoc() });
    expect(page.viewportSize()).toEqual({ width: 390, height: 844 });
    const tabs = page.locator('.navbar .nav__item:visible');
    await expect(tabs).toHaveText(['Home', 'Schedule', 'Clients', 'Leads', 'Progress']);

    // a bar across the bottom of the screen: the tabs side by side, each at least 48px
    const boxes = await tabs.evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height, bottom: r.bottom };
    }));
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].y).toBe(boxes[0].y);
      expect(boxes[i].x).toBeGreaterThanOrEqual(boxes[i - 1].x + boxes[i - 1].w);
    }
    boxes.forEach((box) => {
      expect(box.w).toBeGreaterThanOrEqual(48);
      expect(box.h).toBeGreaterThanOrEqual(48);
    });
    const bar = await page.locator('.navbar').boundingBox();
    expect(bar.x).toBe(0);
    expect(bar.width).toBe(390);
    expect(bar.y + bar.height).toBe(844);

    // the floating + button: a 56px circle, 16px from the edge and 16px above the bar
    const fab = page.locator('.fab');
    await expect(fab).toBeVisible();
    const circle = await fab.boundingBox();
    expect(circle.width).toBe(56);
    expect(circle.height).toBe(56);
    expect(390 - (circle.x + circle.width)).toBe(16);
    const gap = bar.y - (circle.y + circle.height);   // 16px above the bar, less its 1px edge
    expect(gap).toBeGreaterThanOrEqual(15);
    expect(gap).toBeLessThanOrEqual(16);
    await expect(page.locator('.topbar__new')).toBeHidden();

    // the bar and the + stay where they are while a long page scrolls
    await page.locator('.topbar__gear').click();
    await expect(page.locator('[data-view="settings"]')).toBeVisible();
    await expect(page.locator('.topbar__title')).toHaveText('Settings');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const after = await page.locator('.navbar').boundingBox();
    expect(after.y + after.height).toBe(844);
    expect((await fab.boundingBox()).y).toBe(circle.y);

    // every tab opens its screen
    const titles = { schedule: 'Schedule', clients: 'Clients', leads: 'Leads', progress: 'Progress', home: 'Dashboard' };
    for (const name of Object.keys(titles)) {
      await goTo(page, name);
      await expect(page.locator('.topbar__title')).toHaveText(titles[name]);
    }
    // and + opens the New client form
    await fab.click();
    await expect(sheet(page).locator('.sheet__title')).toHaveText('New client');
  });

  test('A03 at 320px nothing scrolls sideways, and a Contacts row shows its name, its details and its four icons on separate lines', async ({ page, openContext }) => {
    const size = { width: 320, height: 640 };

    // a first run: the Welcome card with its "More" texts and its two fields open
    const first = await openContext({ viewport: size, locale: 'he-IL' });
    const firstPage = await first.context.newPage();
    await openApp(firstPage);
    await expectNoSidewaysScroll(firstPage, 'the Welcome card');
    for (let i = 0; i < 3; i++) await firstPage.locator('details[data-key="welcome-' + i + '"] summary').click();
    await firstPage.getByRole('button', { name: 'Change' }).click();
    await expectNoSidewaysScroll(firstPage, 'the Welcome card, opened up');
    await firstPage.close();

    // a list with a very long name and address in it
    await page.setViewportSize(size);
    await openApp(page, {
      seed: seedDoc((doc) => {
        const long = JSON.parse(JSON.stringify(doc.people[1]));
        long.id = '11111111-2222-4333-8444-555555555555';
        long.name = 'Maximiliana Alexandrovna Konstantinopolskaya-Wolfeschlegelstein';
        long.phone = '+44 7700 900123';
        long.email = 'a.very.long.email.address.for.testing@subdomain.example.co.uk';
        doc.people.push(long);
        doc.meta.unsavedSince = '2026-10-01T08:00:00.000Z';      // the red backup banner is on too
        doc.meta.changesSinceExport = 3;
      })
    });
    await expect(banner(page, 'backup')).toBeVisible();
    await expectNoSidewaysScroll(page, 'the Dashboard');
    for (const name of ['schedule', 'leads', 'progress', 'settings', 'clients']) {
      await goTo(page, name);
      await expectNoSidewaysScroll(page, name);
    }

    // the row: name, then details, then the four icons, each on a line of its own
    const dana = row(page, 'Dana Levi');
    const lines = await dana.evaluate((el) => {
      const box = (node) => {
        const r = node.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      return {
        row: box(el),
        name: box(el.querySelector('.row__title')),
        details: Array.from(el.querySelectorAll('.row__fact')).map(box),
        icons: Array.from(el.querySelectorAll('[data-contact]')).map((node) =>
          Object.assign(box(node), { kind: node.getAttribute('data-contact'), label: node.getAttribute('aria-label') }))
      };
    });
    expect(lines.details.length).toBe(2);
    expect(lines.icons.map((icon) => icon.kind)).toEqual(['call', 'whatsapp', 'email', 'copy']);
    expect(lines.icons.map((icon) => icon.label)).toEqual(
      ['Call Dana Levi', 'WhatsApp Dana Levi', 'Email Dana Levi', 'Copy number of Dana Levi']);
    const detailsTop = Math.min.apply(null, lines.details.map((d) => d.top));
    const detailsBottom = Math.max.apply(null, lines.details.map((d) => d.bottom));
    const iconsTop = Math.min.apply(null, lines.icons.map((d) => d.top));
    expect(lines.name.bottom, 'the name ends above the details').toBeLessThanOrEqual(detailsTop + 0.5);
    // a detail that is a link has a 44px tap area, which reaches up to 4px into the gap above the icons
    expect(detailsBottom, 'the details end above the icons').toBeLessThanOrEqual(iconsTop + 4);
    lines.icons.forEach((icon, i) => {
      expect(icon.top, 'the four icons share one line').toBe(lines.icons[0].top);
      expect(icon.width).toBeGreaterThanOrEqual(44);
      expect(icon.height).toBeGreaterThanOrEqual(44);
      expect(icon.left).toBeGreaterThanOrEqual(lines.row.left);
      expect(icon.right).toBeLessThanOrEqual(lines.row.right);
      if (i > 0) expect(icon.left - lines.icons[i - 1].right, 'at least 8px between neighbours').toBeGreaterThanOrEqual(8);
    });
    await expect(dana.locator('.row__fact').first()).toHaveText('+972 541234567');

    // the long name is cut with an ellipsis instead of widening the page
    const longTitle = row(page, 'Maximiliana').locator('.row__title');
    const cut = await longTitle.evaluate((el) => ({ wide: el.scrollWidth > el.clientWidth, right: el.getBoundingClientRect().right }));
    expect(cut.wide).toBe(true);
    expect(cut.right).toBeLessThanOrEqual(320);

    // the overflow menu, the forms, a search with no result and a modal
    await dana.getByRole('button', { name: 'More for Dana Levi' }).click();
    await expect(dana.getByRole('menuitem', { name: 'Delete client' })).toBeVisible();
    await expectNoSidewaysScroll(page, 'the open overflow menu');
    const menu = await dana.locator('.menu').boundingBox();
    expect(menu.x).toBeGreaterThanOrEqual(0);
    expect(menu.x + menu.width).toBeLessThanOrEqual(320);
    await page.keyboard.press('Escape');

    await page.locator('#q').fill('zzz-nobody-is-called-this-at-all-zzz');
    await expect(page.locator('.empty__text')).toContainText('No client matches');
    await expectNoSidewaysScroll(page, 'a search with no result');
    await page.getByRole('button', { name: 'Clear search' }).click();

    await openEdit(page, 'Maximiliana');
    await sheet(page).getByLabel('Email').fill('not an address');
    await fillClient(page, { since: 'earlier' });
    await saveButton(page).click();
    await expect(page.locator('#f-email-error')).toBeVisible();
    await expectNoSidewaysScroll(page, 'the client form');
    const form = await sheet(page).boundingBox();
    expect(form.x).toBeGreaterThanOrEqual(0);
    expect(form.x + form.width).toBeLessThanOrEqual(320);
    await sheet(page).getByLabel('Email').fill('');
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);

    await goTo(page, 'settings');
    await loadBackup(page, fileOf('backup.json', fixtureText('backup-step1')));
    await expect(page.locator('.modal[data-modal="import"]')).toBeVisible();
    await expectNoSidewaysScroll(page, 'the import preview');
    const modal = await page.locator('.modal').boundingBox();
    expect(modal.x).toBeGreaterThanOrEqual(0);
    expect(modal.x + modal.width).toBeLessThanOrEqual(320);
  });
});

test.describe('A04 the tabs that are not built yet', () => {
});

test.describe('A05 the first run', () => {
  test('A05 the Welcome card shows the three statements of 3.9 with their "More" texts', async ({ page }) => {
    await openApp(page);
    const card = page.locator('[data-card="welcome"]');
    await expect(card).toBeVisible();
    const items = card.locator('.welcome__item');
    await expect(items).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const item = items.nth(i);
      await expect(item.locator('.welcome__title')).toHaveText(new RegExp('^' + STATEMENTS[i].title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.?$'));
      await expect(item.locator('.welcome__text')).toHaveText(STATEMENTS[i].line);
      const more = item.locator('details');
      await expect(more.locator('summary')).toHaveText('More');
      await expect(more.locator('.more__body')).toBeHidden();
      await more.locator('summary').click();
      await expect(more.locator('.more__body')).toBeVisible();
      await expect(more.locator('.more__body')).toHaveText(STATEMENTS[i].more);
    }
    await expect(card).toContainText(ASIDE);
    await expect(card.getByRole('button')).toHaveText(['Change', 'Start', 'I have a backup file']);
    await expect(page.getByText('See it with example data')).toHaveCount(0);     // step 1b
    // no checklist yet, and no client
    await expect(page.locator('[data-card="checklist"]')).toHaveCount(0);
    await expect(page.locator('.summary__item[data-summary="clients"] .summary__value')).toHaveText('0');
  });

  test('A05 the card suggests the currency and country code of the device\'s region, and saves them only on Start', async ({ openContext }) => {
    const { context } = await openContext({ locale: 'he-IL' });
    const page = await context.newPage();
    await openApp(page);
    const card = page.locator('[data-card="welcome"]');
    await expect(card.locator('.welcome__confirm-text')).toHaveText('Currency: Israeli new shekel (ILS). Country code: +972. Correct?');
    await expect(card.getByRole('button', { name: 'Change' })).toBeVisible();
    // nothing is saved until Start
    let s = await stored(page);
    expect(s.doc.settings.currency).toBeNull();
    expect(s.doc.settings.countryCode).toBe('');
    expect(s.doc.meta.welcomeDone).toBe(false);
    expect(s.doc.meta.startedOn).toBe(TODAY);

    await card.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(card).toHaveCount(0);
    s = await stored(page);
    expect(s.doc.settings.currency).toBe('ILS');
    expect(s.doc.settings.currencyDecimals).toBe(2);
    expect(s.doc.settings.countryCode).toBe('972');
    expect(s.doc.meta.welcomeDone).toBe(true);
    // closing the card is bookkeeping, not a change that needs a backup
    expect(s.doc.meta.unsavedSince).toBeNull();
    expect(s.doc.meta.changesSinceExport).toBe(0);

    // both stay editable in Settings
    await goTo(page, 'settings');
    await expect(page.locator('#s-currency')).toHaveValue('ILS');
    await expect(page.locator('#s-country')).toHaveValue('972');
  });

  test('A05 "Change" lets the owner correct the suggestion before Start', async ({ page }) => {
    await openApp(page);                                     // en-GB
    const card = page.locator('[data-card="welcome"]');
    await expect(card.locator('.welcome__confirm-text')).toHaveText(/^Currency: .+ \(GBP\)\. Country code: \+44\. Correct\?$/);
    await card.getByRole('button', { name: 'Change' }).click();
    await expect(page.locator('#w-currency')).toHaveValue('GBP');
    await expect(page.locator('#w-country')).toHaveValue('44');
    await page.locator('#w-currency').selectOption('ILS');
    await page.locator('#w-country').fill('+972');
    await card.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(card).toHaveCount(0);
    const s = await stored(page);
    expect(s.doc.settings.currency).toBe('ILS');
    expect(s.doc.settings.countryCode).toBe('972');
  });

  test('A05 with an unknown region the card shows two empty fields', async ({ openContext }) => {
    const { context } = await openContext({ locale: 'eo' });
    const page = await context.newPage();
    await openApp(page);
    const card = page.locator('[data-card="welcome"]');
    await expect(card.locator('.welcome__confirm-text')).toHaveCount(0);
    await expect(card.getByLabel('Currency')).toHaveValue('');
    await expect(card.getByLabel('Country code for phone numbers')).toHaveValue('');
    // a country code that is not one is refused under its field, and the card stays
    await card.getByLabel('Country code for phone numbers').fill('abc');
    await card.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.locator('#w-country-error')).toBeVisible();
    await expect(card).toBeVisible();
    expect((await stored(page)).doc.meta.welcomeDone).toBe(false);
    // the owner may also start with both left empty and fill them in Settings later
    await card.getByLabel('Country code for phone numbers').fill('');
    await card.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(card).toHaveCount(0);
    const s = await stored(page);
    expect(s.doc.settings.currency).toBeNull();
    expect(s.doc.settings.countryCode).toBe('');
    expect(s.doc.meta.welcomeDone).toBe(true);
  });

  test('A05 the card is still there after a reload; after Start the two-item checklist takes its place and Settings shows the three texts again', async ({ page, context }) => {
    await openApp(page);
    const card = page.locator('[data-card="welcome"]');
    await expect(card).toBeVisible();

    // still there after a reload, after a walk through the tabs, and in a new tab
    await page.reload();
    await booted(page);
    await expect(card).toBeVisible();
    await goTo(page, 'clients');
    await goTo(page, 'home');
    await expect(card).toBeVisible();
    const other = await context.newPage();
    await openApp(other);
    await expect(other.locator('[data-card="welcome"]')).toBeVisible();
    await other.close();

    await card.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(card).toHaveCount(0);
    const list = page.locator('[data-card="checklist"]');
    await expect(list.locator('.card__title')).toHaveText('Getting started');
    await expect(list.locator('.checklist__text')).toHaveText(['Add your first client.', 'Save your first backup file and check it.']);
    await expect(list.locator('[data-item][data-tone="done"]')).toHaveCount(0);
    await expect(list.locator('.card__meta')).toHaveText('0 of 2');
    await expect(list.getByText('Choose where your client list lives')).toHaveCount(0);     // step 1b

    await page.reload();
    await booted(page);
    await expect(card).toHaveCount(0);
    await expect(list).toBeVisible();

    // Settings > This device > "How this app works": the three full texts
    await goTo(page, 'settings');
    const device = page.locator('#settings-device');
    const how = device.locator('details').filter({ has: page.locator('summary', { hasText: 'How this app works' }) });
    await how.locator('summary').click();
    for (const statement of STATEMENTS) {
      await expect(how.getByText(statement.more, { exact: true })).toBeVisible();
    }
    // the same section says where this copy runs and which version it is
    await expect(device).toContainText('Where this copy runs');
    await expect(device.locator('[data-where]')).toHaveText(/^file:\/\/\/.+\/laser\/index\.html$/);
    await expect(device.locator('[data-version]')).toHaveText('Laser 0.1.0, step 1, data format 1');
  });

  test('A05 "I have a backup file" loads the backup and closes the card', async ({ page }) => {
    await openApp(page);
    const card = page.locator('[data-card="welcome"]');
    await pickFile(page, card.getByRole('button', { name: 'I have a backup file' }), fileOf('laser-backup.json', fixtureText('backup-step1')));
    const preview = page.locator('.modal[data-modal="import"]');
    await expect(preview).toBeVisible();
    await preview.getByRole('button', { name: 'Replace my data' }).click();
    await expect(toast(page)).toContainText('Backup loaded.');
    await expect(card).toHaveCount(0);
    await expect(page.locator('.summary__item[data-summary="clients"] .summary__value')).toHaveText('4');
    const s = await stored(page);
    expect(s.doc.meta.welcomeDone).toBe(true);
    expect(s.doc.settings.currency).toBe('ILS');
    await page.reload();
    await booted(page);
    await expect(card).toHaveCount(0);
  });
});

test.describe('A06 a client is kept', () => {
  test('A06 Dana Levi is shown in Clients, and is still there after closing and reopening the browser', async ({}, testInfo) => {
    // a real browser profile on disk, so that the browser can really be closed and opened again
    const profile = testInfo.outputPath('browser-profile');
    const use = testInfo.project.use;
    const options = {
      viewport: use.viewport, hasTouch: !!use.hasTouch, isMobile: !!use.isMobile,
      locale: 'he-IL', timezoneId: use.timezoneId, acceptDownloads: true
    };

    let context = await chromium.launchPersistentContext(profile, options);
    let guards = await attachGuards(context);
    let page = context.pages()[0] || await context.newPage();
    await openStarted(page);
    await goTo(page, 'clients');
    await expect(page.locator('.empty__text')).toHaveText('No clients yet.');
    await addClient(page, DANA);
    const dana = row(page, 'Dana Levi');
    await expect(dana).toBeVisible();
    await expect(dana.locator('.row__fact')).toHaveText(['+972 541234567', 'dana+laser@example.com']);
    await expect(page.locator('.row')).toHaveCount(1);
    const before = await stored(page);
    expect(before.doc.people.length).toBe(1);
    expect(before.doc.people[0]).toMatchObject({ name: 'Dana Levi', phone: '054-123 4567', email: 'dana+laser@example.com', clientSince: TODAY, deletedAt: null });
    await context.close();
    expectClean(guards);

    // the browser was closed. Open it again.
    context = await chromium.launchPersistentContext(profile, options);
    guards = await attachGuards(context);
    page = context.pages()[0] || await context.newPage();
    await openApp(page);
    await expect(page.locator('[data-card="welcome"]')).toHaveCount(0);
    await expect(page.locator('.summary__item[data-summary="clients"] .summary__value')).toHaveText('1');
    await goTo(page, 'clients');
    await expect(row(page, 'Dana Levi')).toBeVisible();
    await expect(row(page, 'Dana Levi').locator('.row__fact')).toHaveText(['+972 541234567', 'dana+laser@example.com']);
    const after = await stored(page);
    expect(after.text).toBe(before.text);
    expect(after.rev).toBe(before.rev);
    await context.close();
    expectClean(guards);
  });

  test('A06 the client is still there after the tab is closed and the app is opened in a new one', async ({ page, context }) => {
    await openApp(page, { hash: '#/clients', seed: emptySeed() });
    await addClient(page, DANA);
    await expect(toast(page)).toContainText('Saved');
    await expect(row(page, 'Dana Levi')).toBeVisible();
    await page.close();
    const again = await context.newPage();
    await openApp(again, { hash: '#/clients' });
    await expect(row(again, 'Dana Levi')).toBeVisible();
    await expect(again.locator('.row')).toHaveCount(1);
    // and the first item of the checklist is ticked
    await goTo(again, 'home');
    await expect(again.locator('[data-item="client"]')).toHaveAttribute('data-tone', 'done');
    await expect(again.locator('[data-card="checklist"] .card__meta')).toHaveText('1 of 2');
  });
});

test.describe('A07 what may be saved', () => {
  test('A07 an empty name is refused with "Enter a name"; a name alone is enough', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: emptySeed() });
    await openNew(page);
    await expect(page.locator('#f-name')).toBeFocused();
    await saveButton(page).click();
    await expect(page.locator('#f-name-error')).toBeVisible();
    await expect(page.locator('#f-name-error')).toHaveText('Enter a name');
    await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#f-name')).toBeFocused();
    await expect(sheet(page)).toBeVisible();

    // spaces are not a name, and a phone does not make up for it
    await fillClient(page, { name: '   ', phone: '054-123 4567' });
    await page.keyboard.press('Enter');
    await expect(page.locator('#f-name-error')).toHaveText('Enter a name');
    await expect(sheet(page)).toBeVisible();
    expect((await storedClients(page)).length).toBe(0);

    // with only a name it saves
    await fillClient(page, { name: 'Noa', phone: '' });
    await expect(page.locator('#f-name-error')).toBeHidden();
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(toast(page)).toContainText('Saved');
    await expect(row(page, 'Noa')).toBeVisible();
    const clients = await storedClients(page);
    expect(clients.length).toBe(1);
    expect(clients[0]).toMatchObject({ name: 'Noa', phone: '', email: '' });
    // nothing to call, write or copy: the four icons are there, disabled
    const buttons = row(page, 'Noa').locator('[data-contact]');
    await expect(buttons).toHaveCount(4);
    for (let i = 0; i < 4; i++) await expect(buttons.nth(i)).toBeDisabled();
  });

  test('A07 an email with no @ is refused under the field; dana@gmail is accepted by the form, by the save and by a later import', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: emptySeed() });
    await openNew(page);
    await fillClient(page, { name: 'Dana Levi', email: 'dana.gmail.com' });
    await saveButton(page).click();
    const error = page.locator('#f-email-error');
    await expect(error).toBeVisible();
    await expect(error).toHaveText('Enter an email address like name@example.com');
    await expect(page.locator('#f-email')).toHaveAttribute('aria-invalid', 'true');
    // the message is under its field
    const field = await page.locator('#f-email').boundingBox();
    const message = await error.boundingBox();
    expect(message.y).toBeGreaterThanOrEqual(field.y + field.height);
    expect(message.y - (field.y + field.height)).toBeLessThan(24);
    await expect(sheet(page)).toBeVisible();
    expect((await storedClients(page)).length).toBe(0);

    // the form accepts dana@gmail, and so does the save
    await fillClient(page, { email: 'dana@gmail' });
    await expect(error).toBeHidden();
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(row(page, 'Dana Levi').locator('.row__fact')).toHaveText(['dana@gmail']);
    expect((await storedClients(page))[0].email).toBe('dana@gmail');

    // and so does a later import: no error, no fix
    await goTo(page, 'settings');
    const file = await saveFile(page, () => backupSection(page).getByRole('button', { name: 'Back up now' }).click());
    expect(JSON.parse(file.text).people[0].email).toBe('dana@gmail');
    await loadBackup(page, fileOf(file.name, file.text));
    const preview = page.locator('.modal[data-modal="import"]');
    await expect(preview).toBeVisible();
    await expect(preview).not.toContainText(/small fix/);
    await preview.getByRole('button', { name: 'Replace my data' }).click();
    await expect(toast(page)).toContainText('Backup loaded.');
    expect((await storedClients(page))[0].email).toBe('dana@gmail');

    // one rule: what the form refuses, an import does not let in either (it empties it and says so)
    const edited = JSON.parse(file.text);
    edited.people[0].email = 'dana.gmail.com';
    await loadBackup(page, fileOf('edited.json', JSON.stringify(edited)));
    await expect(preview).toBeVisible();
    await expect(preview.locator('.modal__fine')).toHaveText("1 small fix was made: Dana Levi: email 'dana.gmail.com' removed.");
    await preview.getByRole('button', { name: 'Replace my data' }).click();
    await expect(toast(page)).toContainText('Backup loaded.');
    expect((await storedClients(page))[0].email).toBe('');
  });
});

test.describe('A08 search', () => {
  test('A08 "dan", "4567" and part of the email each find Dana; "zzz" shows "No client matches \'zzz\'"', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: seedDoc() });
    await expect(page.locator('.row')).toHaveCount(4);
    const search = page.getByLabel('Search name, phone or email');
    await expect(search).toHaveAttribute('placeholder', 'Search name, phone or email');
    await expect(search).toHaveAttribute('dir', 'auto');

    for (const typed of ['dan', 'DAN', '4567', '123 45', 'na.levi@exam']) {
      await search.fill(typed);
      await expect(page.locator('.row'), 'searching ' + typed).toHaveCount(1);
      await expect(page.locator('.row .row__title')).toHaveText('Dana Levi');
      // typing redraws the list only: the field keeps the focus and what was typed
      await expect(search).toBeFocused();
      await expect(search).toHaveValue(typed);
    }
    // the others are found by their own details
    await search.fill('avra');
    await expect(page.locator('.row .row__title')).toHaveText(['Tom Avraham']);
    await search.fill('ברק');
    await expect(page.locator('.row .row__title')).toHaveText([HEBREW]);
    await search.fill('555');
    await expect(page.locator('.row')).toHaveCount(2);

    await search.fill('zzz');
    await expect(page.locator('.row')).toHaveCount(0);
    await expect(page.locator('.empty__text')).toHaveText("No client matches 'zzz'.");
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page.locator('.row')).toHaveCount(4);
    await expect(page.locator('#q')).toHaveValue('');
    // the list is sorted by name
    const names = await page.locator('.row .row__title').allTextContents();
    expect(names.slice(0, 3)).toEqual(['Dana Levi', 'Maya Cohen', 'Tom Avraham']);
  });
});

test.describe('A09 Call, WhatsApp and Email', () => {
  test('A09 with country code 972 the form reads "WhatsApp will use +972 541234567" and the row links to wa.me and tel:', async ({ page, context, guards }) => {
    await openStarted(page);                                 // en-GB: the Welcome card saved 44
    await goTo(page, 'settings');
    const code = page.getByLabel('Country code for phone numbers');
    await expect(code).toHaveValue('44');
    await code.fill('972');
    await code.press('Enter');
    await expect(toast(page)).toContainText('Saved');
    await expect(page.locator('#settings-messages')).toContainText('054 123 4567 becomes +972 541234567');
    expect((await stored(page)).doc.settings.countryCode).toBe('972');

    await goTo(page, 'clients');
    await openNew(page);
    const line = sheet(page).locator('[data-partial="whatsapp"]');
    await expect(line).toBeHidden();                         // nothing typed yet
    await fillClient(page, DANA);
    await expect(line).toBeVisible();
    await expect(line).toHaveText('WhatsApp will use +972 541234567');
    // the line is under the phone field
    const phoneBox = await page.locator('#f-phone').boundingBox();
    const lineBox = await line.boundingBox();
    expect(lineBox.y).toBeGreaterThanOrEqual(phoneBox.y + phoneBox.height);
    expect(lineBox.y).toBeLessThan((await page.locator('#f-email').boundingBox()).y);
    // a number that cannot be understood says so instead
    await fillClient(page, { phone: '+44 7700 900123' });
    await expect(line).toHaveText('WhatsApp will use +447700900123');
    await fillClient(page, { phone: DANA.phone });
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);

    const dana = row(page, 'Dana Levi');
    const whatsapp = dana.locator('[data-contact="whatsapp"]');
    await expect(whatsapp).toHaveAttribute('href', 'https://wa.me/972541234567');
    await expect(whatsapp).toHaveAttribute('target', '_blank');
    await expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(dana.locator('[data-contact="call"]')).toHaveAttribute('href', 'tel:+972541234567');
    // the email link keeps a literal @ (and the + of the address is encoded)
    const mail = await dana.locator('[data-contact="email"]').getAttribute('href');
    expect(mail).toBe('mailto:dana%2Blaser@example.com');
    expect(mail).not.toContain('%40');
    // the number and the address in the row are links too
    await expect(dana.locator('.row__fact').nth(0)).toHaveText('+972 541234567');
    await expect(dana.locator('.row__fact').nth(0)).toHaveAttribute('href', 'tel:+972541234567');
    await expect(dana.locator('.row__fact').nth(1)).toHaveAttribute('href', 'mailto:dana%2Blaser@example.com');
    await expect(dana.locator('[data-contact="copy"]')).toBeEnabled();

    // tapping WhatsApp opens that address in a new tab (answered by the stub; nothing leaves)
    const [tab] = await Promise.all([context.waitForEvent('page'), whatsapp.click()]);
    await tab.waitForLoadState();
    expect(tab.url()).toBe('https://wa.me/972541234567');
    expect(guards.whatsapp).toEqual(['https://wa.me/972541234567']);
    await tab.close();
    await expect(row(page, 'Dana Levi')).toBeVisible();      // the app stayed where it was
  });

  test('A09 with "WhatsApp on a computer opens" set to "WhatsApp app" the link is whatsapp://send?phone=972541234567', async ({ page, context, guards }, testInfo) => {
    test.skip(isPhone(testInfo), 'the setting is shown only when the app runs on a computer');
    await openApp(page, { hash: '#/settings', seed: seedDoc() });
    const section = page.locator('#settings-messages');
    await expect(section).toContainText('WhatsApp on a computer opens');
    const choices = section.getByRole('radiogroup', { name: 'WhatsApp on a computer opens' });
    await expect(choices.locator('label')).toHaveText(['In the browser', 'WhatsApp app', 'WhatsApp Web']);
    await expect(choices.getByLabel('In the browser')).toBeChecked();

    await choices.getByText('WhatsApp app', { exact: true }).click();
    await expect(toast(page)).toContainText('Saved');
    expect((await stored(page)).doc.settings.whatsappOnComputer).toBe('app');
    await goTo(page, 'clients');
    let link = row(page, 'Dana Levi').locator('[data-contact="whatsapp"]');
    await expect(link).toHaveAttribute('href', 'whatsapp://send?phone=972541234567');
    expect(await link.getAttribute('target')).toBeNull();     // the app opens, not a tab
    await expect(row(page, 'Dana Levi').locator('[data-contact="call"]')).toHaveAttribute('href', 'tel:+972541234567');

    await goTo(page, 'settings');
    await expect(choices.getByLabel('WhatsApp app')).toBeChecked();
    await choices.getByText('WhatsApp Web', { exact: true }).click();
    await expect(toast(page)).toContainText('Saved');
    await goTo(page, 'clients');
    link = row(page, 'Dana Levi').locator('[data-contact="whatsapp"]');
    await expect(link).toHaveAttribute('href', 'https://web.whatsapp.com/send?phone=972541234567');
    const [tab] = await Promise.all([context.waitForEvent('page'), link.click()]);
    await tab.waitForLoadState();
    expect(guards.whatsapp).toEqual(['https://web.whatsapp.com/send?phone=972541234567']);
    await tab.close();

    await goTo(page, 'settings');
    await choices.getByText('In the browser', { exact: true }).click();
    await expect(toast(page)).toContainText('Saved');
    await goTo(page, 'clients');
    await expect(row(page, 'Dana Levi').locator('[data-contact="whatsapp"]')).toHaveAttribute('href', 'https://wa.me/972541234567');
  });

  test('A09 on a phone the WhatsApp link is always wa.me and the computer setting is not shown', async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo), 'the phone project');
    await openApp(page, { hash: '#/clients', seed: seedDoc((doc) => { doc.settings.whatsappOnComputer = 'app'; }) });
    await expect(row(page, 'Dana Levi').locator('[data-contact="whatsapp"]')).toHaveAttribute('href', 'https://wa.me/972541234567');
    await expect(row(page, 'Dana Levi').locator('[data-contact="call"]')).toHaveAttribute('href', 'tel:+972541234567');
    await goTo(page, 'settings');
    await expect(page.locator('#settings-messages')).toContainText('Country code for phone numbers');
    await expect(page.getByText('WhatsApp on a computer opens')).toHaveCount(0);
    expect((await stored(page)).doc.settings.whatsappOnComputer).toBe('app');   // and it is left as it was
  });

  test('A09 with no country code WhatsApp is disabled and a grey hint explains why', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: emptySeed((doc) => { doc.settings.countryCode = ''; }) });
    await openNew(page);
    await fillClient(page, DANA);
    const line = sheet(page).locator('[data-partial="whatsapp"]');
    await expect(line).toHaveText('Add your country code in Settings to message by WhatsApp');
    // grey: the colour of a hint, not of the text the owner typed and not a warning colour
    const colours = await page.evaluate(() => {
      const of = (el) => window.getComputedStyle(el).color;
      return {
        hint: of(document.querySelector('[data-partial="whatsapp"]')),
        typed: of(document.getElementById('f-phone'))
      };
    });
    expect(colours.hint).toBe('rgb(68, 89, 109)');           // --text-2
    expect(colours.typed).toBe('rgb(15, 36, 55)');           // --text
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);

    const dana = row(page, 'Dana Levi');
    const whatsapp = dana.locator('[data-contact="whatsapp"]');
    await expect(whatsapp).toBeDisabled();
    expect(await whatsapp.getAttribute('href')).toBeNull();
    await expect(whatsapp).toHaveAttribute('aria-label', 'WhatsApp Dana Levi');
    // calling still works with the number as typed, and so does email
    await expect(dana.locator('[data-contact="call"]')).toHaveAttribute('href', 'tel:0541234567');
    await expect(dana.locator('[data-contact="email"]')).toHaveAttribute('href', 'mailto:dana%2Blaser@example.com');
    await expect(dana.locator('.row__fact').first()).toHaveText('054-123 4567');
    // the list explains it too
    await expect(page.locator('[data-view="clients"]')).toContainText('Add your country code in Settings to message by WhatsApp');

    // a number typed with + needs no country code
    await addClient(page, { name: 'Maya Cohen', phone: '+972 52 555 0142' });
    await expect(row(page, 'Maya Cohen').locator('[data-contact="whatsapp"]')).toHaveAttribute('href', 'https://wa.me/972525550142');

    // setting the code in Settings switches WhatsApp on for Dana
    await goTo(page, 'settings');
    const code = page.getByLabel('Country code for phone numbers');
    await code.fill('972');
    await code.press('Enter');
    await expect(toast(page)).toContainText('Saved');
    await goTo(page, 'clients');
    await expect(row(page, 'Dana Levi').locator('[data-contact="whatsapp"]')).toHaveAttribute('href', 'https://wa.me/972541234567');
    await expect(page.getByText('Add your country code in Settings')).toHaveCount(0);
  });
});

test.describe('A10 typed text is only ever text', () => {
  test('A10 a client named <img src=x onerror=alert(1)> is shown as that text; no dialog appears', async ({ page, guards }) => {
    await openApp(page, { hash: '#/clients', seed: emptySeed() });
    await addClient(page, { name: PAYLOAD, email: 'x"onmouseover="alert(2)@example.com' });
    await addClient(page, { name: '"Dana" & \'Levi\' </li><script>alert(3)</script>' });
    const noMarkup = async () => {
      const made = await page.evaluate(() => ({
        images: document.querySelectorAll('#app img:not(.navbar__logo), #overlay-root img, #toast-root img').length,
        scripts: document.querySelectorAll('#app script, #overlay-root script, #toast-root script').length,
        handlers: document.querySelectorAll('[onerror], [onmouseover], [onclick]').length
      }));
      expect(made).toEqual({ images: 0, scripts: 0, handlers: 0 });
    };

    const payload = page.locator('.row').filter({ has: page.locator('.row__title', { hasText: '<img' }) });
    await expect(payload.locator('.row__title')).toHaveText(PAYLOAD);
    await expect(payload.locator('[data-contact="call"]')).toHaveAttribute('aria-label', 'Call ' + PAYLOAD);
    await expect(page.locator('.row .row__title').first()).toHaveText('"Dana" & \'Levi\' </li><script>alert(3)</script>');
    await expect(page.locator('.row')).toHaveCount(2);
    await noMarkup();

    // in the search result line, in the form, in the toast
    await page.locator('#q').fill('<b>zzz</b>');
    await expect(page.locator('.empty__text')).toHaveText("No client matches '<b>zzz</b>'.");
    await page.locator('#q').fill('<img');
    await expect(page.locator('.row')).toHaveCount(1);
    await payload.locator('[aria-haspopup="menu"]').click();
    await payload.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(sheet(page).locator('#f-name')).toHaveValue(PAYLOAD);
    await noMarkup();
    await sheet(page).getByRole('button', { name: 'Delete client' }).click();
    await expect(toast(page).locator('.toast__text')).toHaveText(PAYLOAD + ' was deleted.');
    await noMarkup();
    await toast(page).getByRole('button', { name: 'Undo' }).click();
    await expect(payload.locator('.row__title')).toHaveText(PAYLOAD);

    // an address is never drawn as markup either
    await page.goto(APP_URL + '#/clients?sheet=client&id=%3Cimg%20src%3Dx%20onerror%3Dalert(4)%3E');
    await expect(toast(page)).toContainText('That record was not found.');
    await expect(page.locator('[data-view="clients"]')).toBeVisible();
    await noMarkup();

    // no dialog, no error, nothing asked from outside
    expect(guards.problems).toEqual([]);
    expect((await storedClients(page)).map((p) => p.name)).toContain(PAYLOAD);
  });

  test('A10 a client with a Hebrew name is shown right-aligned and readable in the list and in the form', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: emptySeed() });
    await addClient(page, { name: 'Dana Levi', phone: '054-123 4567' });
    await openNew(page);
    const field = page.locator('#f-name');
    await expect(field).toHaveAttribute('dir', 'auto');
    await field.fill(HEBREW);
    // in the form: the field turns right-to-left, so the name starts at its right edge
    const typed = await field.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { direction: style.direction, align: style.textAlign, rtl: el.matches(':dir(rtl)') };
    });
    expect(typed.rtl).toBe(true);
    expect(typed.direction).toBe('rtl');
    expect(['start', 'right']).toContain(typed.align);
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);

    // in the list
    const title = row(page, HEBREW).locator('.row__title');
    await expect(title).toHaveAttribute('dir', 'auto');
    await expect(title).toHaveText(HEBREW);
    const hebrew = await place(title);
    const latin = await place(row(page, 'Dana Levi').locator('.row__title'));
    expect(hebrew.direction).toBe('rtl');
    expect(latin.direction).toBe('ltr');
    // the Latin name starts at the left edge of its column, the Hebrew one ends at the right edge
    expect(Math.abs(latin.textLeft - latin.left)).toBeLessThan(2);
    expect(Math.abs(hebrew.right - hebrew.textRight)).toBeLessThan(2);
    expect(hebrew.textLeft - hebrew.left, 'the Hebrew name is pushed to the right').toBeGreaterThan(40);
    expect(hebrew.textRight).toBeGreaterThan(latin.textRight);
    // readable: the letters are stored and shown in their own order, nothing is reversed by hand
    expect((await storedClients(page)).map((p) => p.name)).toContain(HEBREW);
    await expect(row(page, HEBREW).locator('.row__fact')).toHaveCount(0);

    // and in the form again when the client is opened
    await row(page, HEBREW).locator('[aria-haspopup="menu"]').click();
    await row(page, HEBREW).getByRole('menuitem', { name: 'Edit' }).click();
    await expect(sheet(page).locator('#f-name')).toHaveValue(HEBREW);
    expect(await sheet(page).locator('#f-name').evaluate((el) => el.matches(':dir(rtl)'))).toBe(true);
    // a phone number stays left-to-right
    expect(await sheet(page).locator('#f-phone').evaluate((el) => el.matches(':dir(ltr)'))).toBe(true);
  });
});

test.describe('A11 delete and Undo', () => {
  test('A11 deleting from the row\'s overflow menu shows a toast, and Undo brings the client back', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: seedDoc() });
    const dana = row(page, 'Dana Levi');
    const more = dana.getByRole('button', { name: 'More for Dana Levi' });
    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await expect(dana.getByRole('menuitem')).toHaveText(['Edit', 'Delete client']);
    await dana.getByRole('menuitem', { name: 'Delete client' }).click();

    await expect(dana).toHaveCount(0);
    await expect(page.locator('.row')).toHaveCount(3);
    await expect(toast(page).locator('.toast__text')).toHaveText('Dana Levi was deleted.');
    const undo = toast(page).getByRole('button', { name: 'Undo' });
    await expect(undo).toBeVisible();
    let s = await stored(page);
    expect(s.doc.people.length).toBe(4);                     // kept in the data for Undo, marked deleted
    expect(s.doc.people.find((p) => p.name === 'Dana Levi').deletedAt).not.toBeNull();

    await undo.click();
    await expect(row(page, 'Dana Levi')).toBeVisible();
    await expect(page.locator('.row')).toHaveCount(4);
    await expect(row(page, 'Dana Levi').locator('.row__fact')).toHaveText(['+972 541234567', 'dana.levi@example.com']);
    await expect(toast(page).locator('.toast')).toHaveCount(0);
    s = await stored(page);
    expect(s.doc.people.find((p) => p.name === 'Dana Levi').deletedAt).toBeNull();

    // "Edit" in the same menu opens the form
    await row(page, 'Dana Levi').getByRole('button', { name: 'More for Dana Levi' }).click();
    await row(page, 'Dana Levi').getByRole('menuitem', { name: 'Edit' }).click();
    await expect(sheet(page).locator('.sheet__title')).toHaveText('Edit client');
    await expect(sheet(page).locator('#f-name')).toHaveValue('Dana Levi');
  });

  test('A11 deleting from the edit form shows a toast, and Undo brings the client back', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: seedDoc() });
    await openEdit(page, 'Maya Cohen');
    await sheet(page).getByRole('button', { name: 'Delete client' }).click();
    await expect(sheet(page)).toHaveCount(0);
    await expect(row(page, 'Maya Cohen')).toHaveCount(0);
    await expect(toast(page).locator('.toast__text')).toHaveText('Maya Cohen was deleted.');
    await goTo(page, 'home');                                // the toast follows to another screen
    await expect(page.locator('.summary__item[data-summary="clients"] .summary__value')).toHaveText('3');
    await toast(page).getByRole('button', { name: 'Undo' }).click();
    await expect(page.locator('.summary__item[data-summary="clients"] .summary__value')).toHaveText('4');
    await goTo(page, 'clients');
    await expect(row(page, 'Maya Cohen').locator('.row__fact')).toHaveText(['+972 525550142', 'maya@example']);
    const maya = (await stored(page)).doc.people.find((p) => p.name === 'Maya Cohen');
    expect(maya.deletedAt).toBeNull();
    expect(maya.clientSince).toBe('2025-03-02');
  });

  test('A11 without Undo the client stays deleted, also after a reload', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: seedDoc() });
    await row(page, 'Tom Avraham').getByRole('button', { name: 'More for Tom Avraham' }).click();
    await row(page, 'Tom Avraham').getByRole('menuitem', { name: 'Delete client' }).click();
    await expect(toast(page).getByRole('button', { name: 'Undo' })).toBeVisible();
    await page.clock.fastForward(7000);                      // the toast lasts 6 seconds
    await expect(toast(page).locator('.toast')).toHaveCount(0);
    await page.reload();
    await booted(page);
    await expect(page.locator('.row')).toHaveCount(3);
    await expect(row(page, 'Tom Avraham')).toHaveCount(0);
  });
});

test.describe('A12 "Client since"', () => {
  test('A12 it comes after the contact and hair fields, and a new client defaults to "Today"', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: emptySeed() });
    await openNew(page);
    const labels = await sheet(page).locator('.sheet__body .fields > .field > .field__label, .sheet__body .fields > fieldset > legend').allTextContents();
    const names = labels.map((text) => text.replace(/\s*required\s*$/, '').trim());
    expect(names.slice(0, 3)).toEqual(['Full name', 'Phone', 'Email']);
    expect(names).toContain('Client since');
    expect(names).toContain('Hair colour');

    const today = sheet(page).locator('input[name="since"][value="today"]');
    const earlier = sheet(page).locator('input[name="since"][value="earlier"]');
    await expect(today).toBeChecked();
    await expect(earlier).not.toBeChecked();
    await expect(sheet(page).locator('label').filter({ has: page.locator('input[name="since"]') })).toHaveText(['Today', 'Earlier (already my client)']);
    await expect(page.locator('#f-since')).toBeHidden();
    await expect(sheet(page)).toContainText('Choose Earlier for clients you already had, so they are not counted as new this month.');

    await fillClient(page, { name: 'New Today' });
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);
    expect((await storedClients(page))[0].clientSince).toBe(TODAY);
    // a client stored with today's date opens with "Today"
    await openEdit(page, 'New Today');
    await expect(today).toBeChecked();
    await expect(page.locator('#f-since')).toBeHidden();
  });

  test('A12 "Earlier" can be saved with no date; on reopening the form "Earlier" is selected and the date field is empty', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: emptySeed() });     // the app was first used on 10 Nov
    await openNew(page);
    await fillClient(page, { name: 'Old Friend', since: 'earlier' });
    const date = sheet(page).getByLabel('Since when? Leave empty if you do not remember.');
    await expect(date).toBeVisible();
    await expect(date).toHaveValue('');
    await expect(date).toHaveAttribute('type', 'date');
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);
    // stored as the day before the app was first used (4.3)
    expect((await storedClients(page))[0].clientSince).toBe('2026-11-09');

    await openEdit(page, 'Old Friend');
    await expect(sheet(page).locator('input[name="since"][value="earlier"]')).toBeChecked();
    await expect(page.locator('#f-since')).toBeVisible();
    await expect(page.locator('#f-since')).toHaveValue('');

    // a date may be given, but never one in the future
    await page.locator('#f-since').fill('2026-11-19');
    await saveButton(page).click();
    await expect(page.locator('#f-since-error')).toBeVisible();
    await expect(page.locator('#f-since-error')).toContainText('future');
    await expect(sheet(page)).toBeVisible();
    expect((await storedClients(page))[0].clientSince).toBe('2026-11-09');
    await page.locator('#f-since').fill('2025-03-02');
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);
    expect((await storedClients(page))[0].clientSince).toBe('2025-03-02');

    // the chips show what is stored: Earlier, with the stored date in the field
    await openEdit(page, 'Old Friend');
    await expect(sheet(page).locator('input[name="since"][value="earlier"]')).toBeChecked();
    await expect(page.locator('#f-since')).toHaveValue('2025-03-02');
    // switching back to Today stores today
    await fillClient(page, { since: 'today' });
    await expect(page.locator('#f-since')).toBeHidden();
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);
    expect((await storedClients(page))[0].clientSince).toBe(TODAY);
  });

  test('A12 a client added on an earlier day opens with "Earlier" and that day', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: seedDoc() });
    await openEdit(page, 'Dana Levi');                       // added with "Today" on 12 Nov
    await expect(sheet(page).locator('input[name="since"][value="earlier"]')).toBeChecked();
    await expect(page.locator('#f-since')).toHaveValue('2026-11-12');
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);
    await expect(toast(page).locator('.toast')).toHaveCount(0);        // nothing was typed, nothing to reopen
    await openEdit(page, HEBREW);                            // saved as "Earlier" with no date
    await expect(sheet(page).locator('input[name="since"][value="earlier"]')).toBeChecked();
    await expect(page.locator('#f-since')).toHaveValue('');
    // saving her again without touching the date keeps "no date"
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);
    expect((await stored(page)).doc.people.find((p) => p.name === HEBREW).clientSince).toBe('2026-11-09');
  });

  test('A12 "Save and add another" keeps the choice', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: emptySeed() });
    await openNew(page);
    await expect(sheet(page).getByRole('button', { name: 'Save and add another' })).toBeVisible();
    await fillClient(page, { name: 'First Earlier', phone: '054-111 1111', since: 'earlier' });
    await sheet(page).getByRole('button', { name: 'Save and add another' }).click();

    // the form is open again, empty, with the choice kept
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).locator('.sheet__title')).toHaveText('New client');
    await expect(page.locator('#f-name')).toHaveValue('');
    await expect(page.locator('#f-phone')).toHaveValue('');
    await expect(page.locator('#f-email')).toHaveValue('');
    await expect(page.locator('#f-name')).toBeFocused();
    await expect(sheet(page).locator('input[name="since"][value="earlier"]')).toBeChecked();
    await expect(page.locator('#f-since')).toBeVisible();
    await expect(page.locator('#f-since')).toHaveValue('');
    expect((await storedClients(page)).map((p) => p.name)).toEqual(['First Earlier']);

    await fillClient(page, { name: 'Second Earlier' });
    await sheet(page).getByRole('button', { name: 'Save and add another' }).click();
    await expect(page.locator('#f-name')).toHaveValue('');
    await expect(sheet(page).locator('input[name="since"][value="earlier"]')).toBeChecked();

    // "Today" is kept in the same way
    await fillClient(page, { name: 'Third Today', since: 'today' });
    await sheet(page).getByRole('button', { name: 'Save and add another' }).click();
    await expect(page.locator('#f-name')).toHaveValue('');
    await expect(sheet(page).locator('input[name="since"][value="today"]')).toBeChecked();
    await fillClient(page, { name: 'Fourth Today' });
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);

    await expect(page.locator('.row')).toHaveCount(4);
    const clients = await storedClients(page);
    expect(clients.map((p) => [p.name, p.clientSince])).toEqual([
      ['First Earlier', '2026-11-09'], ['Fourth Today', TODAY], ['Second Earlier', '2026-11-09'], ['Third Today', TODAY]
    ]);
    // an edit form has no "Save and add another"
    await openEdit(page, 'First Earlier');
    await expect(sheet(page).getByRole('button', { name: 'Save and add another' })).toHaveCount(0);
  });
});

test.describe('A13 the backup file', () => {
  test('A13 "Back up now" saves laser-backup-YYYY-MM-DD-HHMM.json; Home reads "Backed up today"; checking the file ticks item 2', async ({ page }, testInfo) => {
    await openApp(page, { seed: emptySeed() });
    const list = page.locator('[data-card="checklist"]');
    await expect(list.locator('.card__meta')).toHaveText('0 of 2');
    await expect(page.locator('[data-card="backup-line"]')).toContainText('No backup yet');
    await expect(page.locator('[data-card="check-backup"]')).toHaveCount(0);
    const before = await stored(page);

    const file = await saveFile(page, () => page.locator('[data-card="backup-line"]').getByRole('button', { name: 'Back up now' }).click());
    expect(file.name).toMatch(/^laser-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
    expect(file.name).toBe('laser-backup-2026-11-18-1000.json');
    expect(file.text).toContain('"app": "laser-practice"');
    expect(file.text).toContain('"schemaVersion": 1');
    expect(file.text).toContain('"currencyDecimals"');
    expect(file.text.startsWith('{\n  "app": "laser-practice",\n')).toBe(true);     // readable: two spaces
    const backup = JSON.parse(file.text);
    expect(backup.exportedAt).toMatch(/^2026-11-18T08:00:\d\d\.\d{3}Z$/);
    expect(backup.appVersion).toBe('0.1.0');
    expect(backup.settings.currencyDecimals).toBe(2);
    expect(Array.isArray(backup.people) && Array.isArray(backup.appointments) && Array.isArray(backup.payments)).toBe(true);
    // the file is the document as it was stored when the button was pressed
    const exported = Object.assign({}, backup);
    delete exported.exportedAt;
    delete exported.appVersion;
    expect(exported).toEqual(before.doc);

    // the toast names a place to move the file to; the Home line reads "Backed up today"
    await expect(toast(page).locator('.toast__text')).toHaveText('Backup saved. Move it off this computer: iCloud Drive, a USB stick, or an email to yourself.');
    await expect(page.locator('[data-card="backup-line"]')).toContainText('Backed up today');
    await expect(page.locator('[data-card="backup-line"] .badge')).toHaveAttribute('data-tone', 'done');
    if (!isPhone(testInfo)) await expect(page.locator('.navbar__status')).toHaveText('Backed up today');
    let s = await stored(page);
    expect(s.doc.meta.lastExportAt).toMatch(/^2026-11-18T08:0\d:/);
    expect(s.doc.meta.changesSinceExport).toBe(0);
    expect(s.doc.meta.unsavedSince).toBeNull();
    expect(s.doc.meta.backupCheckedAt).toBeNull();

    // the first time, the "Check your backup" card appears, and item 2 waits for the check
    const card = page.locator('[data-card="check-backup"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Check your backup');
    await expect(card).toContainText(/choose the file you just saved\./i);
    await expect(list.locator('[data-item="backup"]')).toContainText('Saved, not checked yet');
    await expect(list.locator('[data-item="backup"]')).not.toHaveAttribute('data-tone', 'done');
    await expect(list.locator('.card__meta')).toHaveText('0 of 2');

    // choosing the saved file: "This backup is good" with the counts, and no data changed
    const beforeCheck = await stored(page);
    await pickFile(page, card.getByRole('button', { name: 'Check a backup file' }), fileOf(file.name, file.text));
    await expect(toast(page).locator('.toast__text')).toHaveText('This backup is good: 0 clients, 0 treatments, saved today.');
    s = await stored(page);
    expect(s.doc.meta.backupCheckedAt).not.toBeNull();
    const same = (doc) => {
      const copy = JSON.parse(JSON.stringify(doc));
      delete copy.rev;
      delete copy.meta.backupCheckedAt;
      return copy;
    };
    expect(same(s.doc)).toEqual(same(beforeCheck.doc));
    expect(s.keys).toEqual(beforeCheck.keys);

    // item 2 is ticked and the card is gone
    await expect(list.locator('[data-item="backup"]')).toHaveAttribute('data-tone', 'done');
    await expect(list.locator('[data-item="client"]')).not.toHaveAttribute('data-tone', 'done');
    await expect(list.locator('.card__meta')).toHaveText('1 of 2');
    await expect(list.getByText('Saved, not checked yet')).toHaveCount(0);
    await expect(card).toHaveCount(0);
    await page.reload();
    await booted(page);
    await expect(list.locator('[data-item="backup"]')).toHaveAttribute('data-tone', 'done');
    await expect(page.locator('[data-card="backup-line"]')).toContainText('Backed up today');
  });

  test('A13 in Settings > Backup the same check shows the counts of the clients', async ({ page }) => {
    await openApp(page, {
      hash: '#/settings/backup',
      seed: seedDoc((doc) => { doc.meta.unsavedSince = '2026-11-17T09:00:00.000Z'; doc.meta.changesSinceExport = 4; })
    });
    const section = backupSection(page);
    await expect(section.getByRole('button')).toHaveText(['Back up now', 'Load a backup', 'Check a backup file', 'Undo the last import', 'Erase this device']);
    await expect(section).toContainText("This file contains your clients' names, phone numbers and notes as readable text. Keep it private. Never put it in the GitHub folder.");
    await expect(section.locator('[data-backup-status]')).toHaveText('No backup yet');
    await expect(section.locator('[data-storage-use]')).toHaveText('Using less than 0.1 of about 5 MB');
    await expect(section.locator('[data-check-backup]')).toHaveCount(0);

    const file = await saveFile(page, () => section.getByRole('button', { name: 'Back up now' }).click());
    expect(file.name).toBe('laser-backup-2026-11-18-1000.json');
    expect(JSON.parse(file.text).people.length).toBe(4);
    await expect(toast(page)).toContainText('Backup saved. Move it off this computer');
    await expect(section.locator('[data-backup-status]')).toHaveText('Last backup today, 0 changes since');
    await expect(section.locator('[data-check-backup]')).toHaveText('Check your backup: choose the file you just saved.');

    // a file that is not the backup does not count as a check
    await pickFile(page, section.getByRole('button', { name: 'Check a backup file' }), fileOf('holiday.txt', 'not a backup at all'));
    const refused = page.locator('.modal[data-modal="refused"]');
    await expect(refused).toContainText('This file is not a Laser backup.');
    await refused.getByRole('button', { name: 'Close' }).click();
    expect((await stored(page)).doc.meta.backupCheckedAt).toBeNull();
    await expect(section.locator('[data-check-backup]')).toBeVisible();

    const beforeCheck = await stored(page);
    await pickFile(page, section.getByRole('button', { name: 'Check a backup file' }), fileOf(file.name, file.text));
    await expect(toast(page).locator('.toast__text')).toHaveText('This backup is good: 4 clients, 0 treatments, saved today.');
    await expect(toast(page).locator('.toast')).toHaveAttribute('data-tone', 'done');
    await expect(section.locator('[data-check-backup]')).toHaveCount(0);
    const s = await stored(page);
    expect(s.doc.people).toEqual(beforeCheck.doc.people);
    expect(s.doc.settings).toEqual(beforeCheck.doc.settings);
    expect(s.doc.meta.backupCheckedAt).not.toBeNull();
    // both items are ticked now, so the checklist has left the Dashboard
    await goTo(page, 'home');
    await expect(page.locator('[data-card="checklist"], [data-card="check-backup"]')).toHaveCount(0);
    await expect(page.locator('[data-card="backup-line"]')).toContainText('Backed up today');
  });
});

test.describe('A14 a file that cannot be loaded changes nothing', () => {
  const broken = (change) => {
    const doc = JSON.parse(fixtureText('backup-step1'));
    change(doc);
    return JSON.stringify(doc, null, 2);
  };
  const REFUSED = [
    { what: 'a text file that is not JSON', name: 'notes.txt', text: 'Dana called, wants Thursday at 14:00.\n', says: /not a Laser backup/ },
    { what: 'a JSON file from another app', name: 'export.json', text: JSON.stringify({ app: 'tictactoe', schemaVersion: 1, people: [], appointments: [], payments: [] }), says: /not a Laser backup/ },
    { what: 'a JSON file that is a list', name: 'list.json', text: '[1, 2, 3]', says: /not a Laser backup/ },
    { what: 'a backup in which a phone is a number', name: 'phone.json', text: broken((doc) => { doc.people[0].phone = 541234567; }), says: /cannot be loaded/, fault: /Dana Levi.*phone|phone.*Dana Levi/i },
    { what: 'a backup with two people sharing one id', name: 'twins.json', text: broken((doc) => { doc.people[1].id = doc.people[0].id; }), says: /cannot be loaded/, fault: /\bid\b/i },
    { what: 'a backup with a person who has no name', name: 'noname.json', text: broken((doc) => { doc.people[2].name = ''; }), says: /cannot be loaded/, fault: /name/i },
    { what: 'a backup whose people are not a list', name: 'people.json', text: broken((doc) => { doc.people = { first: doc.people[0] }; }), says: /cannot be loaded|not a Laser backup/ },
    { what: 'a backup from a newer version of the app', name: 'newer.json', text: broken((doc) => { doc.schemaVersion = 2; }), says: /This backup comes from a newer version of the app\./ }
  ];

  for (const one of REFUSED) {
    test('A14 import refuses ' + one.what + ', with a clear message and no change to the data', async ({ page }) => {
      await openApp(page, { hash: '#/settings/backup', seed: seedDoc((doc) => { doc.people.pop(); }) });
      const before = await stored(page);
      await loadBackup(page, { name: one.name, mimeType: one.name.endsWith('.txt') ? 'text/plain' : 'application/json', buffer: Buffer.from(one.text, 'utf8') });

      const refused = page.locator('.modal[data-modal="refused"]');
      await expect(refused).toBeVisible();
      await expect(page.locator('.modal[data-modal="import"]')).toHaveCount(0);
      await expect(refused.locator('.modal__body')).toContainText(one.says);
      if (one.fault) await expect(refused.locator('.modal__fine').first()).toContainText(one.fault);
      // nothing to confirm: the only button closes the message
      await expect(refused.getByRole('button')).toHaveText(['Close']);
      await refused.getByRole('button', { name: 'Close' }).click();
      await expect(page.locator('.modal')).toHaveCount(0);

      const after = await stored(page);
      expect(after.text, 'the stored data is untouched').toBe(before.text);
      expect(after.rev).toBe(before.rev);
      expect(after.keys).toEqual(before.keys);              // and no "before the import" copy was made
      await expect(backupSection(page).getByRole('button', { name: 'Undo the last import' })).toBeDisabled();
      await goTo(page, 'clients');
      await expect(page.locator('.row')).toHaveCount(3);
    });
  }

  test('A14 a backup in which a note is too long loads, and the preview lists the fix', async ({ page }) => {
    await openApp(page, { hash: '#/settings/backup', seed: emptySeed() });
    const text = broken((doc) => { doc.people[0].notes = 'Sensitive skin. '.repeat(200); });      // 3,200 characters
    await loadBackup(page, fileOf('long-note.json', text));
    const preview = page.locator('.modal[data-modal="import"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('4 clients');
    await expect(preview.locator('.modal__fine')).toHaveText('1 small fix was made: Dana Levi: note shortened to 2,000 characters.');
    expect((await storedClients(page)).length).toBe(0);      // nothing has changed yet
    await preview.getByRole('button', { name: 'Replace my data' }).click();
    await expect(toast(page)).toContainText('Backup loaded.');
    const dana = (await storedClients(page)).find((p) => p.name === 'Dana Levi');
    expect(dana.notes.length).toBe(2000);
    expect(dana.notes.startsWith('Sensitive skin. Sensitive skin. ')).toBe(true);
    expect((await storedClients(page)).length).toBe(4);
  });
});

test.describe('A15 loading a backup, and undoing it', () => {
  test('A15 a valid backup shows the preview with counts; "Replace my data" loads it; "Undo the last import" brings the old data back', async ({ page }) => {
    await openApp(page, {
      hash: '#/settings/backup',
      seed: seedDoc((doc) => {
        doc.people = [doc.people[3]];
        doc.people[0].name = 'Old Client';
        doc.rev = 9;
        doc.settings.currency = 'GBP';
        doc.settings.countryCode = '44';
        doc.meta.unsavedSince = '2026-11-17T09:00:00.000Z';
        doc.meta.changesSinceExport = 2;
      })
    });
    const section = backupSection(page);
    const undo = section.getByRole('button', { name: 'Undo the last import' });
    await expect(undo).toBeDisabled();
    const before = await stored(page);
    const file = JSON.parse(fixtureText('backup-step1'));
    file.meta.homeDevice = 'laptop';                         // facts about the other device
    file.meta.reopenedAt = '2026-11-11T07:00:00.000Z';
    const fileText = JSON.stringify(file, null, 2);

    // the preview, with both sets of counts; Cancel changes nothing
    await loadBackup(page, fileOf('laser-backup-2026-11-12-0930.json', fileText));
    const preview = page.locator('.modal[data-modal="import"]');
    await expect(preview).toBeVisible();
    await expect(preview.locator('.modal__body')).toHaveText(
      'This backup: saved Thursday 12 Nov 2026, 4 clients, 0 leads, 0 treatments, 0 payments. ' +
      'It will replace what is in this browser now (1 client, 0 leads, 0 treatments). ' +
      'You can undo this import in Settings > Backup.');
    await expect(preview.getByRole('button')).toHaveText(['Cancel', 'Replace my data']);
    expect(await background(preview.getByRole('button', { name: 'Replace my data' }))).toBe(COLOUR.urgentSolid);
    await preview.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.modal')).toHaveCount(0);
    let s = await stored(page);
    expect(s.text).toBe(before.text);
    expect(s.keys).toEqual(before.keys);
    await expect(undo).toBeDisabled();

    // "Replace my data" loads it
    await loadBackup(page, fileOf('laser-backup-2026-11-12-0930.json', fileText));
    await preview.getByRole('button', { name: 'Replace my data' }).click();
    await expect(toast(page).locator('.toast__text')).toHaveText('Backup loaded.');
    await expect(page.locator('.modal')).toHaveCount(0);
    s = await stored(page);
    expect(s.doc.people.map((p) => p.name).sort()).toEqual(file.people.map((p) => p.name).sort());
    expect(s.doc.people.find((p) => p.name === 'Dana Levi')).toEqual(file.people[0]);
    expect(s.doc.settings).toEqual(file.settings);
    expect(s.doc.rev).toBe(10);                              // max(9, 5) + 1
    expect(s.rev).toBe('10');
    expect(s.doc.meta.unsavedSince).toBeNull();
    expect(s.doc.meta.homeDevice).toBeNull();                // the new device asks for itself
    expect(s.doc.meta.reopenedAt).toBeNull();
    expect(s.doc.meta.persist).toBeNull();
    expect(s.doc.exportedAt).toBeUndefined();
    expect(s.doc.appVersion).toBeUndefined();
    expect(s.keys).toContain('laser.prev');
    await expect(page.locator('#s-currency')).toHaveValue('ILS');
    await expect(page.locator('#s-country')).toHaveValue('972');
    await goTo(page, 'clients');
    await expect(page.locator('.row')).toHaveCount(4);
    await expect(row(page, 'Old Client')).toHaveCount(0);
    await page.reload();
    await booted(page);
    await expect(page.locator('.row')).toHaveCount(4);

    // "Undo the last import" brings the old data back
    await goTo(page, 'settings');
    await expect(undo).toBeEnabled();
    await undo.click();
    const question = page.locator('.modal[data-modal="undo-import"]');
    if (await question.isVisible()) await question.getByRole('button', { name: 'Undo the last import' }).click();
    await expect(page.locator('.modal')).toHaveCount(0);
    await expect(undo).toBeEnabled();   // the undo itself can be taken back with the same button
    s = await stored(page);
    expect(s.doc.people).toEqual(before.doc.people);
    expect(s.doc.settings).toEqual(before.doc.settings);
    expect(s.doc.meta.unsavedSince).toBe('2026-11-17T09:00:00.000Z');
    expect(s.doc.rev).toBeGreaterThan(10);
    expect(s.keys).toContain('laser.prev');   // kept, so the undo can be taken back
    await expect(page.locator('#s-currency')).toHaveValue('GBP');
    await goTo(page, 'clients');
    await expect(page.locator('.row .row__title')).toHaveText(['Old Client']);
  });
});

test.describe('A16 two tabs', () => {
  test('A16 with nothing being typed, a change in one tab appears in the other with no banner', async ({ page, context }) => {
    await openApp(page, { hash: '#/clients', seed: seedDoc() });
    const second = await context.newPage();
    await openApp(second, { hash: '#/clients' });
    await expect(second.locator('.row')).toHaveCount(4);

    await addClient(page, { name: 'Added In First', phone: '054-777 7777' });
    await expect(row(second, 'Added In First')).toBeVisible();
    await expect(second.locator('.row')).toHaveCount(5);
    await expect(second.locator('.banner')).toHaveCount(0);

    // and the other way round: the second tab is not behind, so it may save
    await row(second, 'Tom Avraham').getByRole('button', { name: 'More for Tom Avraham' }).click();
    await row(second, 'Tom Avraham').getByRole('menuitem', { name: 'Delete client' }).click();
    await expect(row(page, 'Tom Avraham')).toHaveCount(0);
    await expect(page.locator('.row')).toHaveCount(4);
    await expect(page.locator('.banner')).toHaveCount(0);
    // on another screen too: the Dashboard's figure follows
    await goTo(second, 'home');
    await addClient(page, { name: 'One More' });
    await expect(second.locator('.summary__item[data-summary="clients"] .summary__value')).toHaveText('5');
    await expect(second.locator('.banner')).toHaveCount(0);
    expect((await storedClients(page)).length).toBe(5);
  });

  test('A16 with a half-typed form in the second tab, a change in the first makes it show "This tab is out of date", refuse the save, and after Reload reopen the form with the typed text', async ({ page, context }) => {
    await openApp(page, { hash: '#/clients', seed: seedDoc() });
    const second = await context.newPage();
    await openApp(second, { hash: '#/clients' });
    await openNew(second);
    await fillClient(second, { name: 'Rina Half', phone: '054-222 33' });

    await addClient(page, { name: 'Added In First' });

    // the second tab says so, in red, and keeps what was typed
    const stale = second.locator('.banner[data-banner="stale"]');
    await expect(stale.first()).toBeAttached();
    await expect(stale.first()).toHaveAttribute('data-tone', 'urgent');
    await expect(stale.first().locator('.banner__text')).toHaveText('This tab is out of date because the app was changed in another tab. What you typed is kept.');
    await expect(stale.first().getByRole('button')).toHaveText(['Reload']);
    await expect(second.locator('#f-name')).toHaveValue('Rina Half');
    await expect(second.locator('#f-phone')).toHaveValue('054-222 33');
    const reload = second.locator('.banner[data-banner="stale"]:visible').getByRole('button', { name: 'Reload' }).last();
    await expect(reload).toBeVisible();

    // the save is refused: the form stays, and nothing of it reaches the disk
    await saveButton(second).click();
    await expect(sheet(second)).toBeVisible();
    await expect(second.locator('#f-name')).toHaveValue('Rina Half');
    let names = (await storedClients(second)).map((p) => p.name);
    expect(names).toContain('Added In First');
    expect(names).not.toContain('Rina Half');
    expect(names.length).toBe(5);

    // Reload: the form comes back with the typed text, on top of the newer data
    await reload.click();
    await booted(second);
    await expect(sheet(second)).toBeVisible();
    await expect(second.locator('#f-name')).toHaveValue('Rina Half');
    await expect(second.locator('#f-phone')).toHaveValue('054-222 33');
    await expect(sheet(second)).toContainText('Restored what you were typing.');
    await expect(second.locator('.banner[data-banner="stale"]')).toHaveCount(0);
    await expect(row(second, 'Added In First')).toBeAttached();
    await saveButton(second).click();
    await expect(sheet(second)).toHaveCount(0);
    names = (await storedClients(second)).map((p) => p.name);
    expect(names).toContain('Added In First');
    expect(names).toContain('Rina Half');
    expect(names.length).toBe(6);
    // and the first tab follows, silently
    await expect(row(page, 'Rina Half')).toBeVisible();
    await expect(page.locator('.banner')).toHaveCount(0);
  });
});

test.describe('A17 a save that fails', () => {
  test('A17 with saving made to fail, a red "Not saved" banner appears and "Back up now" still produces a file', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: seedDoc() });
    const before = await stored(page);
    await breakSaving(page);

    await addClient(page, { name: 'Only On Screen', phone: '054-999 0000' });
    const red = banner(page, 'saveFailed');
    await expect(red).toBeVisible();
    await expect(red).toHaveAttribute('data-tone', 'urgent');
    expect(await background(red)).toBe(COLOUR.urgentTint);
    await expect(red.locator('.banner__text')).toHaveText('Not saved. Your last change is only on this screen.');
    await expect(red.getByRole('button')).toHaveText(['Back up now', 'Try again']);
    // the change is on the screen, and not on the disk
    await expect(row(page, 'Only On Screen')).toBeVisible();
    expect((await stored(page)).text).toBe(before.text);
    // the banner is on every screen
    await goTo(page, 'home');
    await expect(red).toBeVisible();
    await goTo(page, 'clients');

    // "Back up now" still produces a file, and it holds the change that is only on the screen
    const file = await saveFile(page, () => red.getByRole('button', { name: 'Back up now' }).click());
    expect(file.name).toMatch(/^laser-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
    const backup = JSON.parse(file.text);
    expect(backup.app).toBe('laser-practice');
    expect(backup.people.map((p) => p.name)).toContain('Only On Screen');
    expect(backup.people.length).toBe(5);
    await expect(red).toBeVisible();

    // further edits are refused until a save succeeds
    await openNew(page);
    await fillClient(page, { name: 'Refused Edit' });
    await saveButton(page).click();
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).locator('.banner[data-banner="saveFailed"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);
    await expect(row(page, 'Refused Edit')).toHaveCount(0);
    await row(page, 'Dana Levi').getByRole('button', { name: 'More for Dana Levi' }).click();
    await row(page, 'Dana Levi').getByRole('menuitem', { name: 'Delete client' }).click();
    await expect(row(page, 'Dana Levi')).toBeVisible();
    await expect(page.locator('.row')).toHaveCount(5);

    // "Try again" while saving still fails keeps the banner; once saving works it goes away
    await red.getByRole('button', { name: 'Try again' }).click();
    await expect(red).toBeVisible();
    expect((await stored(page)).text).toBe(before.text);
    await mendSaving(page);
    await red.getByRole('button', { name: 'Try again' }).click();
    await expect(red).toHaveCount(0);
    const names = (await storedClients(page)).map((p) => p.name);
    expect(names).toContain('Only On Screen');
    expect(names.length).toBe(5);
    // and saving works again
    await addClient(page, { name: 'After Recovery' });
    expect((await storedClients(page)).map((p) => p.name)).toContain('After Recovery');
  });

  test('A17 with saving failing from the first moment (2.7), the banner is there at once and "Back up now" still produces a file', async ({ page }) => {
    await breakSavingFromStart(page);
    await openApp(page);
    const red = banner(page, 'saveFailed');
    await expect(red).toBeVisible();
    await expect(red.locator('.banner__text')).toHaveText('Not saved. Your last change is only on this screen.');
    expect((await stored(page)).keys.filter((key) => key.startsWith('laser'))).toEqual([]);
    const file = await saveFile(page, () => red.getByRole('button', { name: 'Back up now' }).click());
    expect(file.name).toBe('laser-backup-2026-11-18-1000.json');
    const backup = JSON.parse(file.text);
    expect(backup.app).toBe('laser-practice');
    expect(backup.schemaVersion).toBe(1);
    expect(backup.people).toEqual([]);
    // nothing can be saved, and the app says so instead of pretending
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.locator('[data-card="welcome"]')).toBeVisible();
    await expect(red).toBeVisible();
    await expect(page.locator('[data-card="backup-line"]')).not.toContainText('Backed up today');
  });
});

test.describe('A18 drafts', () => {
  test('A18 typing half a new client and reloading reopens the form with the text and "Restored what you were typing. Discard"', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: seedDoc() });
    await openNew(page);
    await fillClient(page, { name: 'Dana Le', phone: '054-123', since: 'earlier' });
    // the draft is written by itself a moment after the last key (not only when the page goes away)
    await expect.poll(async () => (await stored(page)).keys, { timeout: 3000 }).toContain('laser.ui');
    const draft = await page.evaluate(() => JSON.parse(window.localStorage.getItem('laser.ui')).draft);
    expect(draft.sheet).toBe('client');
    expect(draft.values).toMatchObject({ name: 'Dana Le', phone: '054-123', since: 'earlier' });

    await page.reload();
    await booted(page);
    await expect(sheet(page)).toBeVisible();
    await expect(sheet(page).locator('.sheet__title')).toHaveText('New client');
    await expect(page.locator('#f-name')).toHaveValue('Dana Le');
    await expect(page.locator('#f-phone')).toHaveValue('054-123');
    await expect(sheet(page).locator('input[name="since"][value="earlier"]')).toBeChecked();
    const note = sheet(page).locator('[data-partial="note"]');
    await expect(note).toHaveText('Restored what you were typing. Discard');
    await expect(sheet(page).locator('[data-partial="whatsapp"]')).toHaveText('WhatsApp cannot use this number');
    // a draft is not a client
    expect((await storedClients(page)).length).toBe(4);
    await expect(page.locator('.row')).toHaveCount(4);

    // Discard empties the form and removes the draft
    await note.getByRole('button', { name: 'Discard' }).click();
    await expect(page.locator('#f-name')).toHaveValue('');
    await expect(page.locator('#f-phone')).toHaveValue('');
    await expect(sheet(page).locator('input[name="since"][value="today"]')).toBeChecked();
    await expect(sheet(page).getByText('Restored what you were typing.')).toHaveCount(0);
    expect((await stored(page)).keys).not.toContain('laser.ui');
    await page.reload();
    await booted(page);
    await expect(page.locator('#f-name')).toHaveValue('');
    await expect(sheet(page).getByText('Restored what you were typing.')).toHaveCount(0);
  });

  test('A18 half an edit comes back after a reload too, and Save removes the draft', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: seedDoc() });
    await openEdit(page, 'Maya Cohen');
    await fillClient(page, { email: 'maya.cohen@example.org' });
    await page.reload();
    await booted(page);
    await expect(sheet(page).locator('.sheet__title')).toHaveText('Edit client');
    await expect(page.locator('#f-name')).toHaveValue('Maya Cohen');
    await expect(page.locator('#f-email')).toHaveValue('maya.cohen@example.org');
    await expect(sheet(page).locator('[data-partial="note"]')).toHaveText('Restored what you were typing. Discard');
    expect((await storedClients(page)).find((p) => p.name === 'Maya Cohen').email).toBe('maya@example');
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);
    expect((await storedClients(page)).find((p) => p.name === 'Maya Cohen').email).toBe('maya.cohen@example.org');
    expect((await stored(page)).keys).not.toContain('laser.ui');
    await expect(toast(page)).not.toContainText('Not saved');
  });

  const WAYS = [
    { name: 'Esc', close: (page) => page.keyboard.press('Escape') },
    { name: 'Cancel', close: (page) => sheet(page).getByRole('button', { name: 'Cancel' }).click() },
    { name: 'the close button', close: (page) => sheet(page).getByRole('button', { name: 'Close' }).click() },
    { name: 'a click beside the form', close: (page) => page.locator('.overlay__scrim').click({ position: { x: 5, y: 5 }, force: true }), laptopOnly: true },
    { name: 'the browser\'s Back button', close: (page) => page.goBack() }
  ];
  for (const way of WAYS) {
    test('A18 closing a form with typed text by ' + way.name + ' shows "Not saved. Reopen"', async ({ page }, testInfo) => {
      test.skip(!!way.laptopOnly && isPhone(testInfo), 'on a phone the form covers the whole screen');
      await openApp(page, { hash: '#/clients', seed: seedDoc() });
      await openNew(page);
      await fillClient(page, { name: 'Half Typed', email: 'half@' });
      await way.close(page);
      await expect(sheet(page)).toHaveCount(0);
      await expect(page.locator('[data-view="clients"]')).toBeVisible();
      await expect(toast(page).locator('.toast__text')).toHaveText('Not saved.');
      const reopen = toast(page).getByRole('button', { name: 'Reopen' });
      await expect(reopen).toBeVisible();
      await expect(toast(page).locator('.toast')).toHaveText('Not saved.Reopen');
      expect((await storedClients(page)).length).toBe(4);     // nothing was saved

      await reopen.click();
      await expect(sheet(page)).toBeVisible();
      await expect(page.locator('#f-name')).toHaveValue('Half Typed');
      await expect(page.locator('#f-email')).toHaveValue('half@');
      await expect(sheet(page).locator('[data-partial="note"]')).toHaveText('Restored what you were typing. Discard');
      await expect(toast(page).locator('.toast')).toHaveCount(0);
    });
  }

  test('A18 the draft is still offered when the form is opened again later, and a form with nothing typed closes quietly', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: seedDoc() });
    await openNew(page);
    await page.keyboard.press('Escape');                     // nothing typed
    await expect(sheet(page)).toHaveCount(0);
    await expect(toast(page).locator('.toast')).toHaveCount(0);
    expect((await stored(page)).keys).not.toContain('laser.ui');

    await openNew(page);
    await fillClient(page, { name: 'Came Back' });
    await page.keyboard.press('Escape');
    await expect(toast(page).locator('.toast__text')).toHaveText('Not saved.');
    await page.clock.fastForward(7000);                      // the toast is gone
    await expect(toast(page).locator('.toast')).toHaveCount(0);
    await openNew(page);                                     // the same form, within 24 hours
    await expect(page.locator('#f-name')).toHaveValue('Came Back');
    await expect(sheet(page).locator('[data-partial="note"]')).toHaveText('Restored what you were typing. Discard');
    // another client's form does not get this draft
    await page.keyboard.press('Escape');
    await openEdit(page, 'Dana Levi');
    await expect(page.locator('#f-name')).toHaveValue('Dana Levi');
    await expect(sheet(page).getByText('Restored what you were typing.')).toHaveCount(0);
  });
});

test.describe('A19 data from a newer version', () => {
  test('A19 with a stored schemaVersion of 2 the app shows the "older than your data" page with a working "Save a backup of my data" button, and nothing else', async ({ page }) => {
    const doc = fixtureDoc('backup-step1', (d) => { d.schemaVersion = 2; d.somethingNew = { from: 'a later version' }; });
    const text = JSON.stringify(doc, null, 1);               // not the app's own spacing: it must come back unchanged
    await openApp(page, { hash: '#/clients', seed: { text: text, rev: 5 } });

    const blocked = page.locator('[data-blocked="newer"]');
    await expect(blocked).toBeVisible();
    await expect(blocked.locator('.empty__text')).toHaveText(
      'This copy of the app (version 0.1.0, data format 1) is older than your data (format 2). Reload the page to get the newest app.');
    // one button, and nothing else: no navigation, no list, no form, no way to change anything
    await expect(page.locator('#app button:visible, #app a:visible, #app input:visible')).toHaveCount(1);
    await expect(page.getByRole('button')).toHaveText(['Save a backup of my data']);
    await expect(page.locator('.nav__item, .fab, .topbar, .row, [data-view]')).toHaveCount(0);
    await expect(page.getByText('Dana Levi')).toHaveCount(0);

    const file = await saveFile(page, () => page.getByRole('button', { name: 'Save a backup of my data' }).click());
    expect(file.name).toBe('laser-backup-2026-11-18-1000.json');
    expect(file.text, 'the stored text, unchanged').toBe(text);

    // no address opens the app or a form, and the stored data is left exactly as it was
    for (const hash of ['#/home', '#/settings/backup', '#/clients?sheet=client']) {
      await page.goto(APP_URL + hash);
      await expect(blocked).toBeVisible();
      await expect(page.locator('.sheet, .modal, [data-view]')).toHaveCount(0);
    }
    await page.reload();
    await booted(page);
    await expect(blocked).toBeVisible();
    const after = await stored(page);
    expect(after.text).toBe(text);
    expect(after.rev).toBe('5');
    expect(after.keys).toEqual(['laser.doc', 'laser.rev']);
  });
});

test.describe('A20 the backup nudge', () => {
  test('A20 8 days after an unsaved change the yellow backup banner is on every screen; at 31 days it is red; after "Back up now" it is gone', async ({ page }) => {
    await openApp(page, { hash: '#/clients', seed: emptySeed() });
    await addClient(page, DANA);                             // the change that is not in a backup
    const nudge = banner(page, 'backup');
    await expect(nudge).toHaveCount(0);

    // 6 days: still quiet
    await page.clock.fastForward(6 * DAY_MS);
    await goTo(page, 'home');
    await expect(page.locator('.date-line')).toHaveText('Tuesday 24 November');
    await expect(nudge).toHaveCount(0);

    // 8 days: yellow, on every screen, with its one button
    await page.clock.fastForward(2 * DAY_MS);
    await expect(nudge).toBeVisible();
    await expect(nudge).toHaveAttribute('data-tone', 'important');
    expect(await background(nudge)).toBe(COLOUR.importantTint);
    await expect(nudge.locator('.banner__text')).toHaveText('You have changes from the last 8 days that are not in a backup file.');
    await expect(nudge.getByRole('button')).toHaveText(['Back up now']);
    await expect(nudge.locator('svg')).toBeVisible();
    for (const name of ['schedule', 'clients', 'leads', 'progress', 'settings', 'home']) {
      await goTo(page, name);
      await expect(nudge, 'the banner on ' + name).toBeVisible();
      await expect(page.locator('#app .banner')).toHaveCount(1);
    }
    // it is above the page title
    expect((await nudge.boundingBox()).y).toBeLessThan((await page.locator('.topbar__title').boundingBox()).y);

    // 31 days: red
    await page.clock.fastForward(23 * DAY_MS);
    await expect(nudge).toHaveAttribute('data-tone', 'urgent');
    expect(await background(nudge)).toBe(COLOUR.urgentTint);
    await expect(nudge.locator('.banner__text')).toHaveText("No backup for 31 days. If this browser's data is cleared, those changes are gone.");
    await expect(nudge.getByRole('button')).toHaveText(['Back up now']);
    for (const name of ['schedule', 'clients', 'leads', 'progress', 'settings']) {
      await goTo(page, name);
      await expect(nudge, 'the banner on ' + name).toBeVisible();
    }
    // it is still there after a reload: it cannot be dismissed
    await page.reload();
    await booted(page);
    await expect(nudge).toHaveAttribute('data-tone', 'urgent');

    // "Back up now" on the banner saves a file, and the banner is gone
    const file = await saveFile(page, () => nudge.getByRole('button', { name: 'Back up now' }).click());
    expect(JSON.parse(file.text).people.map((p) => p.name)).toEqual(['Dana Levi']);
    await expect(nudge).toHaveCount(0);
    for (const name of ['home', 'clients', 'settings']) {
      await goTo(page, name);
      await expect(page.locator('#app .banner')).toHaveCount(0);
    }
    await page.reload();
    await booted(page);
    await expect(page.locator('#app .banner')).toHaveCount(0);
  });

  test('A20 with no client typed yet there is nothing to nudge about', async ({ page }) => {
    await openApp(page, { seed: emptySeed((doc) => { doc.meta.unsavedSince = '2026-09-01T08:00:00.000Z'; doc.meta.changesSinceExport = 1; }) });
    await expect(page.locator('#app .banner')).toHaveCount(0);
    await page.clock.fastForward(20 * DAY_MS);   // one jump is limited to about 24 days
    await page.clock.fastForward(20 * DAY_MS);
    await goTo(page, 'settings');
    await expect(page.locator('#app .banner')).toHaveCount(0);
  });
});

test.describe('A21 the colours', () => {
  test('A21 Settings > Colours shows the five badges, each with an icon and a word, and yellow and red in both styles', async ({ page }) => {
    await openApp(page, { hash: '#/settings', seed: seedDoc() });
    const section = page.locator('#settings-colours');
    await expect(section.locator('.card__title')).toHaveText('Colours');
    const tint = section.locator('.badge:not(.badge--solid)');
    const solid = section.locator('.badge.badge--solid');
    await expect(tint).toHaveCount(5);
    await expect(solid).toHaveCount(2);

    // the five tones, each a tint badge with an icon and a word
    const tones = ['urgent', 'important', 'done', 'info', 'neutral'];
    const fills = [COLOUR.urgentTint, COLOUR.importantTint, COLOUR.doneTint, COLOUR.infoTint, COLOUR.neutralTint];
    for (let i = 0; i < 5; i++) {
      const badge = tint.nth(i);
      await expect(badge).toHaveAttribute('data-tone', tones[i]);
      await expect(badge).toBeVisible();
      await expect(badge.locator('svg')).toBeVisible();
      const word = (await badge.textContent()).trim();
      expect(word.length, 'a word on the ' + tones[i] + ' badge').toBeGreaterThan(2);
      expect(word.length).toBeLessThanOrEqual(16);
      expect(await background(badge)).toBe(fills[i]);
    }
    // five different icons, so that no status rests on its colour alone
    const icons = await tint.evaluateAll((els) => els.map((el) => el.querySelector('svg').innerHTML));
    expect(new Set(icons).size).toBe(5);

    // yellow and red also in the solid style, with their icon and word
    await expect(solid.nth(0)).toHaveAttribute('data-tone', 'urgent');
    await expect(solid.nth(1)).toHaveAttribute('data-tone', 'important');
    expect(await background(solid.nth(0))).toBe(COLOUR.urgentSolid);
    expect(await background(solid.nth(1))).toBe(COLOUR.importantSolid);
    for (let i = 0; i < 2; i++) {
      await expect(solid.nth(i).locator('svg')).toBeVisible();
      expect((await solid.nth(i).textContent()).trim().length).toBeGreaterThan(2);
    }
    expect(await solid.nth(0).evaluate((el) => window.getComputedStyle(el).color)).toBe('rgb(255, 255, 255)');
    expect(await solid.nth(1).evaluate((el) => window.getComputedStyle(el).color)).toBe('rgb(58, 40, 0)');

    // one line for each (7.8)
    for (const line of ['Red: late, act now', 'Yellow: important today or this week', 'Green: finished, nothing more to do', 'Blue: planned or waiting', 'Grey: inactive or closed']) {
      await expect(section.getByText(line, { exact: true })).toBeVisible();
    }
    // no badge is cut off or pushed out of its card
    const card = await section.boundingBox();
    const boxes = await section.locator('.badge').evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, cut: el.scrollWidth > el.clientWidth };
    }));
    boxes.forEach((box) => {
      expect(box.cut).toBe(false);
      expect(box.left).toBeGreaterThanOrEqual(card.x);
      expect(box.right).toBeLessThanOrEqual(card.x + card.width);
    });
  });
});

test.describe('A22 the test page is safe', () => {
  test('A22 after opening tests/unit.html in the same browser, Dana is still in Clients and no laser-test.* key is left', async ({ page, context }) => {
    await openApp(page, { hash: '#/clients', seed: emptySeed() });
    await addClient(page, DANA);
    const before = await stored(page);
    expect(before.keys).toEqual(['laser.doc', 'laser.rev']);

    const unit = await context.newPage();
    await unit.goto(UNIT_URL);
    await unit.waitForFunction(() => !!window.__unit, null, { timeout: 20000 });
    const result = await unit.evaluate(() => window.__unit);
    expect(result.failed).toBe(0);
    expect(result.total).toBeGreaterThan(100);
    // the two pages share one store: the test page saw the app's keys, and left them alone
    const seen = await unit.evaluate(() => Object.keys(window.localStorage).sort());
    expect(seen).toEqual(['laser.doc', 'laser.rev']);
    await unit.close();

    const after = await stored(page);
    expect(after.keys.filter((key) => key.startsWith('laser-test'))).toEqual([]);
    expect(after.keys).toEqual(['laser.doc', 'laser.rev']);
    expect(after.text).toBe(before.text);
    expect(after.rev).toBe(before.rev);
    // the app did not notice anything, and Dana is still there after a reload
    await expect(page.locator('.banner')).toHaveCount(0);
    await page.reload();
    await booted(page);
    await expect(row(page, 'Dana Levi')).toBeVisible();
    await expect(page.locator('.row')).toHaveCount(1);
  });
});

test.describe('A23 checking every save stays fast', () => {
  test('A23 schema.validate on 500 clients and 6,000 appointments takes under 30 ms', async ({ page }) => {
    await openApp(page, { now: null, seed: emptySeed() });   // the real clock: this test measures time
    const measured = await page.evaluate(() => {
      const L = window.Laser;
      const schema = L.core.schema;
      const dates = L.core.dates;
      const at = dates.now();
      const doc = schema.emptyDoc(at);
      for (let i = 0; i < 500; i++) {
        const person = schema.newPerson({
          name: 'Client ' + i, phone: '054-123 ' + (1000 + i), email: 'client' + i + '@example.com',
          notes: 'Sensitive skin, prefers mornings', areas: ['underarms', 'fullLegs'], hairColor: 'darkBrown'
        }, { now: at });
        doc.people.push(person);
        for (let k = 0; k < 12; k++) {
          doc.appointments.push(schema.newAppointment({
            personId: person.id, date: dates.addDays('2025-12-01', k * 28 + (i % 20)), time: '14:00',
            status: k < 11 ? 'done' : 'booked', areas: ['underarms', 'fullLegs'], notes: 'ok'
          }, { now: at }));
        }
      }
      const runs = [];
      let faults = 0;
      for (let run = 0; run < 9; run++) {
        const t0 = performance.now();
        faults += schema.validate(doc).length;
        runs.push(performance.now() - t0);
      }
      // the check does look: one broken record among the 6,500 is found
      doc.appointments[4321].personId = 'nobody';
      return {
        people: doc.people.length, appointments: doc.appointments.length, faults: faults,
        best: Math.min.apply(null, runs), chars: JSON.stringify(doc).length,
        brokenFound: schema.validate(doc).length
      };
    });
    expect(measured.people).toBe(500);
    expect(measured.appointments).toBe(6000);
    expect(measured.faults).toBe(0);
    expect(measured.brokenFound).toBeGreaterThan(0);
    expect(measured.best, 'milliseconds for one validate (best of 9)').toBeLessThan(30);
  });
});

test.describe('A24 the owner\'s Mac', () => {
  test.skip('A24 items 1, 6 and 13 in Safari and Chrome on the owner\'s Mac, with the real WhatsApp, Email and Call (done by hand)', () => {});
});

// ============================================================================================

test.describe('the round trip (2.7)', () => {
  test('what the tests typed through the real forms is exported and imported again with no error and no repair', async ({ page }, testInfo) => {
    // a first run, taken through the real screens
    await openStarted(page);
    await goTo(page, 'settings');
    await page.getByLabel('Currency', { exact: true }).selectOption('ILS');
    await expect(toast(page)).toContainText('Saved');
    const code = page.getByLabel('Country code for phone numbers');
    await code.fill('972');
    await code.press('Enter');
    await expect(toast(page)).toContainText('Saved');
    if (!isPhone(testInfo)) {
      await page.locator('#settings-messages').getByText('WhatsApp Web', { exact: true }).click();
      await expect(toast(page)).toContainText('Saved');
    }

    await goTo(page, 'clients');
    await addClient(page, DANA);
    await addClient(page, { name: 'Noa' });                                          // a name and nothing else
    await addClient(page, { name: HEBREW, phone: '053-555 0177', since: 'earlier' });
    await addClient(page, { name: PAYLOAD, email: 'dana@gmail' });
    await addClient(page, { name: 'Maya Cohen', phone: '+44 7700 900123', email: 'maya.cohen@example.org', since: 'earlier', sinceDate: '2025-03-02' });
    await addClient(page, { name: 'Tom "Tommy" O\'Neil & Sons', phone: '(03) 555-0199 ext. 4' });
    await addClient(page, { name: 'Soon Deleted', phone: '054-000 0000' });
    // an edit and a delete, so the file also holds a changed record and a deleted one
    await openEdit(page, 'Noa');
    await fillClient(page, { name: 'Noa Bar', phone: '054 765 4321' });
    await saveButton(page).click();
    await expect(sheet(page)).toHaveCount(0);
    await row(page, 'Soon Deleted').getByRole('button', { name: 'More for Soon Deleted' }).click();
    await row(page, 'Soon Deleted').getByRole('menuitem', { name: 'Delete client' }).click();
    await expect(row(page, 'Soon Deleted')).toHaveCount(0);
    await expect(page.locator('.row')).toHaveCount(6);
    const namesOnScreen = await page.locator('.row .row__title').allTextContents();

    // export
    await goTo(page, 'settings');
    const file = await saveFile(page, () => backupSection(page).getByRole('button', { name: 'Back up now' }).click());
    await expect(toast(page)).toContainText('Backup saved.');
    const built = await stored(page);
    const backup = JSON.parse(file.text);
    expect(backup.people.length).toBe(7);
    expect(backup.people.filter((p) => p.deletedAt === null).length).toBe(6);
    expect(backup.settings).toMatchObject({ currency: 'ILS', currencyDecimals: 2, countryCode: '972' });

    // the app's own rules find nothing wrong with the file, and nothing to repair
    const verdict = await page.evaluate((text) => {
      const L = window.Laser;
      const prepared = L.core.backup.prepareImport(text);
      return { ok: prepared.ok, repairs: prepared.repairs, errors: prepared.errors || [] };
    }, file.text);
    expect(verdict).toEqual({ ok: true, repairs: [], errors: [] });

    // "Check a backup file" agrees
    await pickFile(page, backupSection(page).getByRole('button', { name: 'Check a backup file' }), fileOf(file.name, file.text));
    await expect(toast(page).locator('.toast__text')).toHaveText('This backup is good: 6 clients, 0 treatments, saved today.');

    // import it again through the real screen: the preview, with no fix listed
    await loadBackup(page, fileOf(file.name, file.text));
    await expect(page.locator('.modal[data-modal="refused"]')).toHaveCount(0);
    const preview = page.locator('.modal[data-modal="import"]');
    await expect(preview).toBeVisible();
    await expect(preview.locator('.modal__body')).toHaveText(
      'This backup: saved Wednesday 18 Nov 2026, 6 clients, 0 leads, 0 treatments, 0 payments. ' +
      'It will replace what is in this browser now (6 clients, 0 leads, 0 treatments). ' +
      'You can undo this import in Settings > Backup.');
    await expect(preview.locator('.modal__fine')).toHaveCount(0);
    await preview.getByRole('button', { name: 'Replace my data' }).click();
    await expect(toast(page).locator('.toast__text')).toHaveText('Backup loaded.');

    // what is stored now is what was built, record for record
    const loaded = await stored(page);
    expect(loaded.doc.people).toEqual(built.doc.people);
    expect(loaded.doc.appointments).toEqual(built.doc.appointments);
    expect(loaded.doc.payments).toEqual(built.doc.payments);
    expect(loaded.doc.settings).toEqual(built.doc.settings);
    expect(loaded.doc.createdAt).toBe(built.doc.createdAt);
    expect(loaded.doc.schemaVersion).toBe(1);
    expect(loaded.doc.rev).toBeGreaterThan(built.doc.rev);
    const check = await page.evaluate(() => {
      const L = window.Laser;
      const doc = JSON.parse(window.localStorage.getItem('laser.doc'));
      return { errors: L.core.schema.validate(doc), repairs: L.core.schema.normalize(doc).repairs };
    });
    expect(check).toEqual({ errors: [], repairs: [] });

    // and the screen shows the same clients, also after a reload
    await goTo(page, 'clients');
    await expect(page.locator('.row .row__title')).toHaveText(namesOnScreen);
    await page.reload();
    await booted(page);
    await expect(page.locator('.row .row__title')).toHaveText(namesOnScreen);
    await expect(row(page, 'Dana Levi').locator('[data-contact="call"]')).toHaveAttribute('href', 'tel:+972541234567');
    await openEdit(page, HEBREW);
    await expect(sheet(page).locator('input[name="since"][value="earlier"]')).toBeChecked();
    await expect(page.locator('#f-since')).toHaveValue('');
  });
});

// laser/tests/e2e/app.spec.js
// The practice features, end to end: treatments and money, booking, the 4-week rule,
// reminders, leads and the monthly progress. The clock is fixed at Wednesday 18 November 2026.
'use strict';

const { test, expect, openStarted, goTo, toast } = require('./helpers');

function sheet(page) { return page.locator('#overlay-root .sheet'); }

// Adds clients and history through the app's own functions; returns the ids by name.
async function seed(page, plan) {
  return page.evaluate((steps) => {
    const L = window.Laser, P = L.core.practice, d = L.core.dates, S = L.core.schema, store = L.core.store;
    const today = d.today();
    store.commit('Seed', (draft, ctx) => {
      steps.clients.forEach((name) => draft.people.push(S.newPerson({ name: name, phone: '054 123 4567', clientSince: d.addDays(today, -200) }, { now: ctx.now })));
      draft.settings.usualPriceMinor = 25000;
    });
    const ids = {};
    store.get().people.forEach((p) => { ids[p.name] = p.id; });
    (steps.treatments || []).forEach((t) => P.saveTreatment({ personId: ids[t[0]], date: d.addDays(today, -t[1]), time: '10:00', amountMinor: t[2], notes: '' }));
    (steps.bookings || []).forEach((b) => P.book({ personId: ids[b[0]], date: d.addDays(today, b[1]), time: b[2], notes: '' }));
    if (steps.bookedLongAgo) {
      store.commit('Seed', (draft) => { draft.appointments.forEach((a) => { if (a.status === 'booked') a.scheduledOn = d.addDays(today, -20); }); });
    }
    return ids;
  }, plan);
}

test('a treatment with its payment shows on the client page, in the lists and in the month', async ({ page }) => {
  await openStarted(page);
  const ids = await seed(page, { clients: ['Dana Levi'] });
  await page.goto(page.url().split('#')[0] + '#/clients/' + ids['Dana Levi']);
  await page.locator('[data-view="client"] [data-action="session.add"]').click();
  await expect(sheet(page).locator('.sheet__title')).toHaveText('Add treatment');
  await expect(sheet(page).locator('#s-amount')).toHaveValue('250');          // the usual price
  await sheet(page).locator('#s-amount').fill('300');
  await sheet(page).getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('[data-tile="sessions"] .tile__value')).toHaveText('1');
  await expect(page.locator('[data-tile="paid"] .tile__value')).toContainText('300');
  await expect(page.locator('[data-view="client"] .row .badge')).toHaveText('Done');

  await goTo(page, 'home');
  await expect(page.locator('[data-summary="received"] .summary__value')).toContainText('300');
  await page.goto(page.url().split('#')[0] + '#/clients/summary');
  await expect(page.locator('.row .row__amount')).toContainText('300');
  await page.goto(page.url().split('#')[0] + '#/schedule/done');
  await expect(page.locator('[data-tab="done"] .card__title')).toContainText('1 treatment');
  await page.goto(page.url().split('#')[0] + '#/progress');
  await expect(page.locator('[data-tile="received"] .tile__value')).toContainText('300');
  await expect(page.locator('[data-tile="people"] .tile__value')).toHaveText('1');
});

test('an amount is required, and deleting a treatment takes its money with it until Undo', async ({ page }) => {
  await openStarted(page);
  const ids = await seed(page, { clients: ['Dana Levi'], treatments: [['Dana Levi', 0, 25000]] });
  await page.goto(page.url().split('#')[0] + '#/clients/' + ids['Dana Levi']);
  await page.locator('[data-view="client"] [data-action="session.add"]').click();
  await sheet(page).locator('#s-amount').fill('');
  await sheet(page).getByRole('button', { name: 'Save' }).click();
  await expect(sheet(page).locator('#s-amount-error')).toContainText('Enter what was paid');
  await sheet(page).getByRole('button', { name: 'Cancel' }).click();

  await page.locator('.row [aria-haspopup="menu"]').click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.locator('[data-tile="paid"] .tile__value')).toContainText('0');
  await toast(page).getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('[data-tile="paid"] .tile__value')).toContainText('250');
});

test('booking with a one-tap date, then finishing it with the next session booked', async ({ page }) => {
  await openStarted(page);
  const ids = await seed(page, { clients: ['Dana Levi'], treatments: [['Dana Levi', 28, 25000]] });
  await goTo(page, 'schedule');
  await page.locator('[data-view="schedule"] .toolbar [data-action="session.book"]').click();
  await sheet(page).locator('#s-person').selectOption(ids['Dana Levi']);
  await expect(sheet(page).locator('.pick').first()).toContainText('+4 wk, Wed 18 Nov');   // 4 weeks after the last visit
  await sheet(page).locator('.pick').first().click();
  await expect(sheet(page).locator('#s-date')).toHaveValue('2026-11-18');
  await expect(sheet(page).locator('#s-time')).toHaveValue('10:00');                         // the client's usual time
  await sheet(page).getByRole('button', { name: 'Book' }).click();

  await goTo(page, 'home');
  const today = page.locator('[data-card="today"]');
  await expect(today.locator('.row')).toHaveCount(1);
  await today.getByRole('button', { name: 'Finish' }).click();
  await sheet(page).locator('#s-next').selectOption('4');
  await sheet(page).getByRole('button', { name: 'Save' }).click();
  await expect(today.locator('.badge')).toHaveText('Done');
  await expect(today.locator('.card__meta')).toContainText('1 of 1 done');
  await goTo(page, 'schedule');
  await expect(page.locator('[data-view="schedule"] .card__title').first()).toHaveText('Wednesday 16 December');
});

test('the 4-week rule: who to ask, in red when overdue, and off the list once asked or booked', async ({ page }) => {
  await openStarted(page);
  await seed(page, {
    clients: ['Overdue Olga', 'Soon Sara', 'Fresh Fay', 'Booked Bea'],
    treatments: [['Overdue Olga', 33, 25000], ['Soon Sara', 24, 25000], ['Fresh Fay', 10, 25000], ['Booked Bea', 40, 25000]],
    bookings: [['Booked Bea', 3, '12:00']]
  });
  await page.goto(page.url().split('#')[0] + '#/schedule/rebook');
  const rows = page.locator('[data-tab="rebook"] .row');
  await expect(rows.locator('.row__title')).toHaveText(['Overdue Olga', 'Soon Sara']);
  await expect(rows.nth(0).locator('.badge')).toHaveText('Overdue 5 d');
  await expect(rows.nth(0).locator('.badge')).toHaveAttribute('data-tone', 'urgent');
  await expect(rows.nth(1).locator('.badge')).toHaveText('Due in 4 d');
  await expect(rows.nth(1).locator('.badge')).toHaveAttribute('data-tone', 'important');

  await rows.nth(0).getByRole('button', { name: 'Message' }).click();
  await expect(sheet(page).locator('#m-text')).toHaveValue(/^Hi Overdue, it has been 4 weeks/);
  await sheet(page).getByRole('button', { name: 'Mark as done' }).click();
  await expect(rows.nth(1).locator('.badge')).toHaveText('Asked today');
  await expect(rows.nth(1).locator('.badge')).toHaveAttribute('data-tone', 'info');
  await goTo(page, 'home');
  await expect(page.locator('[data-card="todo"] .row .row__title')).toHaveText(['Soon Sara']);
});

test('reminders: ready two days before and on the day, and gone once sent', async ({ page }) => {
  await openStarted(page);
  await seed(page, {
    clients: ['Dana Levi', 'Maya Cohen', 'Noa Far'],
    bookings: [['Dana Levi', 2, '14:00'], ['Maya Cohen', 0, '16:00'], ['Noa Far', 6, '09:00']],
    bookedLongAgo: true
  });
  await goTo(page, 'home');
  const todo = page.locator('[data-card="todo"]');
  await expect(todo.locator('.row .row__title')).toHaveText(['Maya Cohen', 'Dana Levi']);
  await expect(todo.locator('.row .badge')).toHaveText(['Remind today', 'Reminder ready']);
  await todo.locator('.row').nth(1).getByRole('button', { name: 'Send reminder' }).click();
  await expect(sheet(page).locator('#m-text')).toHaveValue(/Hi Dana, a reminder of your laser session on Friday 20 November at 14:00/);
  await expect(sheet(page).locator('[data-send="to"]')).toContainText('To: +');
  await sheet(page).getByRole('button', { name: 'Mark as done' }).click();
  await expect(todo.locator('.row .row__title')).toHaveText(['Maya Cohen']);
});

test('leads: add, see it on the Dashboard, and turn it into a client', async ({ page }) => {
  await openStarted(page);
  await goTo(page, 'leads');
  await page.locator('[data-view="leads"]').getByRole('button', { name: 'Add a lead' }).click();
  await sheet(page).locator('#l-name').fill('Lior Katz');
  await sheet(page).locator('#l-interest').fill('Legs');
  await sheet(page).getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('[data-view="leads"] .row .badge')).toHaveText('New lead');
  await goTo(page, 'home');
  await expect(page.locator('[data-summary="leads"] .summary__value')).toHaveText('1');
  await expect(page.locator('[data-card="todo"] .row .row__title')).toHaveText(['Lior Katz']);
  await goTo(page, 'leads');
  await page.locator('[data-view="leads"]').getByRole('button', { name: 'Make client' }).click();
  await expect(page.locator('[data-view="client"] .profile__name')).toHaveText('Lior Katz');
  await goTo(page, 'home');
  await expect(page.locator('[data-summary="leads"] .summary__value')).toHaveText('0');
  await expect(page.locator('[data-summary="clients"] .summary__value')).toHaveText('1');
  await expect(page.locator('[data-summary="clients"] .summary__note')).toHaveText('1 new this month');
});

test('the client form saves hair colour, thickness and special notes, shown on the client page', async ({ page }) => {
  await openStarted(page);
  await goTo(page, 'clients');
  await page.locator('[data-action="new.here"]:visible').click();
  await sheet(page).locator('#f-name').fill('Dana Levi');
  await sheet(page).locator('#f-hair').selectOption('darkBrown');
  await sheet(page).locator('#f-thick').selectOption('coarse');
  await sheet(page).locator('#f-notes').fill('Sensitive skin <b>careful</b>');
  await sheet(page).getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('.row .row__title').click();
  await expect(page.locator('.note-box')).toHaveText('Sensitive skin <b>careful</b>');
  await expect(page.locator('.note-box')).toHaveAttribute('data-tone', 'important');
  await expect(page.locator('.facts')).toContainText('Dark brown');
  await expect(page.locator('.facts')).toContainText('Coarse');
});

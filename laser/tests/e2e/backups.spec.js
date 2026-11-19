// laser/tests/e2e/backups.spec.js
// Every backup fixture, one per build step, is loaded through the real Import screen and
// must load with no error and no repair (blueprint 2.7). A new step may never break an
// older step's backup.
'use strict';

const {
  test, expect, openStarted, goTo, pickFile, stored, toast,
  fixtureNames, fixturePath, fixtureText
} = require('./helpers');

function live(list) { return list.filter((record) => record.deletedAt === null); }

test.describe('every fixture still imports (2.7)', () => {
  test('there is a fixture for step 1', () => {
    expect(fixtureNames()).toContain('backup-step1.json');
  });

  for (const name of fixtureNames()) {
    test(name + ' loads through Settings > Backup with no error and no repair', async ({ page }) => {
      const file = JSON.parse(fixtureText(name));
      const clients = live(file.people).filter((p) => p.clientSince !== null);
      const leads = live(file.people).filter((p) => p.clientSince === null);

      await openStarted(page);
      await goTo(page, 'settings');
      await pickFile(page, page.getByRole('button', { name: 'Load a backup' }), fixturePath(name));

      // the preview, not a refusal; and no line about fixes
      await expect(page.locator('.modal[data-modal="refused"]')).toHaveCount(0);
      const preview = page.locator('.modal[data-modal="import"]');
      await expect(preview).toBeVisible();
      await expect(preview).toContainText('This backup: saved ');
      await expect(preview).toContainText(clients.length + (clients.length === 1 ? ' client' : ' clients'));
      await expect(preview).toContainText(leads.length + (leads.length === 1 ? ' lead' : ' leads'));
      await expect(preview).not.toContainText(/small fix/);
      await expect(preview.locator('.modal__fine')).toHaveCount(0);

      await preview.getByRole('button', { name: 'Replace my data' }).click();
      await expect(toast(page)).toContainText('Backup loaded.');
      await expect(page.locator('.modal')).toHaveCount(0);

      // what is on disk now is the file's data, and it passes the app's own rules
      const after = await stored(page);
      const strip = (list) => list.map((record) => JSON.stringify(record)).sort();
      expect(strip(after.doc.people)).toEqual(strip(file.people));
      expect(strip(after.doc.appointments)).toEqual(strip(file.appointments));
      expect(strip(after.doc.payments)).toEqual(strip(file.payments));
      expect(after.doc.settings).toEqual(file.settings);
      expect(after.doc.schemaVersion).toBe(1);
      const check = await page.evaluate(() => {
        const L = window.Laser;
        const doc = JSON.parse(window.localStorage.getItem('laser.doc'));
        return { errors: L.core.schema.validate(doc), repairs: L.core.schema.normalize(doc).repairs };
      });
      expect(check.errors).toEqual([]);
      expect(check.repairs).toEqual([]);

      // and the screen shows it
      await goTo(page, 'clients');
      await expect(page.locator('.row')).toHaveCount(clients.length);
      for (const person of clients) {
        await expect(page.locator('.row__title', { hasText: person.name })).toHaveCount(1);
      }
    });

    test(name + ' is invented data with the fields a backup must carry', () => {
      const file = JSON.parse(fixtureText(name));
      expect(file.app).toBe('laser-practice');
      expect(file.schemaVersion).toBe(1);
      expect(typeof file.exportedAt).toBe('string');
      expect(typeof file.appVersion).toBe('string');
      expect(typeof file.settings.currencyDecimals).toBe('number');
      expect(Array.isArray(file.people) && Array.isArray(file.appointments) && Array.isArray(file.payments)).toBe(true);
      const people = live(file.people);
      expect(people.length).toBeGreaterThanOrEqual(4);
      expect(people.some((p) => /[֐-׿]/.test(p.name)), 'one person has a Hebrew name').toBe(true);
    });
  }
});

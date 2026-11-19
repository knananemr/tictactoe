// laser/tests/e2e/unit.spec.js
// Opens the double-clickable unit test page under five time zones (blueprint 2.7) and
// expects every unit test to pass in each. Date maths that is only right in one zone
// fails here.
'use strict';

const { test, expect, UNIT_URL } = require('./helpers');

const ZONES = ['Asia/Jerusalem', 'America/Los_Angeles', 'Europe/London', 'Pacific/Auckland', 'Asia/Kolkata'];

test.describe('unit tests under five time zones (2.7)', () => {
  for (const zone of ZONES) {
    test('unit.html is all green in ' + zone, async ({ openContext }) => {
      const { context } = await openContext({ timezoneId: zone });
      const page = await context.newPage();
      await page.goto(UNIT_URL);
      await page.waitForFunction(() => !!window.__unit, null, { timeout: 20000 });

      // The browser may report an older name for the same zone (Asia/Calcutta for
      // Asia/Kolkata), so both sides are compared in the browser's own spelling.
      const zones = await page.evaluate((wanted) => ({
        inPage: Intl.DateTimeFormat().resolvedOptions().timeZone,
        wanted: new Intl.DateTimeFormat('en', { timeZone: wanted }).resolvedOptions().timeZone
      }), zone);
      expect(zones.inPage).toBe(zones.wanted);

      const unit = await page.evaluate(() => window.__unit);
      expect(unit.failures, 'failed unit tests in ' + zone).toEqual([]);
      expect(unit.failed).toBe(0);
      expect(unit.total).toBeGreaterThan(100);
      await expect(page.locator('#summary')).toHaveText('All ' + unit.total + ' tests passed');

      // the test page leaves nothing behind, and never used a real key
      const keys = await page.evaluate(() => Object.keys(window.localStorage));
      expect(keys.filter((key) => key.indexOf('laser') === 0)).toEqual([]);
    });
  }
});

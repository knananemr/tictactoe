// laser/tests/playwright.config.js
// End-to-end tests of Laser (blueprint 2.7). Playwright is installed outside the repo.
// Run from the repo root:
//   NODE_PATH="$(npm root -g)" playwright test -c laser/tests/playwright.config.js
const { defineConfig } = require('playwright/test');

module.exports = defineConfig({
  testDir: 'e2e',
  outputDir: './test-results',
  reporter: [['html', { open: 'never', outputFolder: './playwright-report' }]],
  fullyParallel: true,
  forbidOnly: true,
  timeout: 30000,
  expect: { timeout: 5000 },
  use: {
    acceptDownloads: true,
    timezoneId: 'Asia/Jerusalem',
    locale: 'en-GB'
  },
  projects: [
    { name: 'laptop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } }
  ]
});

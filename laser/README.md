# Laser

A private dashboard for a solo laser hair removal practice. It runs in your browser from one
file. There is no server, no account and no internet connection: nothing leaves your device
unless you tap a send button.

What it does: a Dashboard that sums up the day; clients with their hair details and
special notes; treatments and what each client paid; a schedule with one-tap rebooking;
a list of who to ask back after 4 weeks; leads; monthly progress; and reminder messages
written for you, ready to send by WhatsApp, text message or email.

The first plan is in `docs/BLUEPRINT.md`. The app was built simpler than that plan in
places; where they differ, the app is right.

## For the owner

### Open the app

1. Double-click the file `laser/index.html`. It opens in your browser and shows the Dashboard.
2. **Pick one browser and stay with it.** Safari and Chrome on the same Mac keep separate
   data. A client added in one does not appear in the other. Your data is not lost; it is
   in the browser where you typed it.
3. The first time, read the three lines on the Welcome card, check the currency and the
   country code it suggests, and tap **Start**.

If you ever see "Laser did not start", open `laser/index.html` again. Your data is not
lost. Do not clear your browser data; contact your builder.

### Where your data lives

Everything you type is saved in this browser on this device only. It is not on the
internet and not in GitHub. If the browser's history or site data is cleared, the data is
deleted. **Your protection is the backup file.**

### Back up

1. Tap **Back up now** (on the Dashboard, or in Settings > Backup). The browser saves a
   file named like `laser-backup-2026-11-18-1430.json`, usually in Downloads.
2. **Move the file off this computer:** iCloud Drive, a USB stick, or an email to yourself.
3. The first time, the app asks you to check the backup: tap **Check a backup file** and
   choose the file you just saved. "This backup is good" means the file can be read.

The backup file contains your clients' names, phone numbers and notes as readable text.
Keep it private. **Never put it in the GitHub folder.**

If you have changes that are not in a backup file, the app reminds you with a yellow
banner after 7 days and a red one after 30 days.

### Load a backup

Settings > Backup > **Load a backup**, then choose a backup file. The app first shows what
is in the file and what it will replace. Nothing changes until you tap **Replace my data**.
If you chose the wrong file, **Undo the last import** brings the previous data back.

### Move to another device or browser

1. On the old one: **Back up now**, and move the file to the new device.
2. On the new one: open the app, tap **I have a backup file** (or Settings > Backup >
   Load a backup) and choose the file.
3. Back on the old one, when you are sure the new one is right: Settings > Backup >
   **Erase this device**.

### Messages the app can show

- **"This tab is out of date"**: the app is open in two tabs and the other one changed the
  data. Tap **Reload**. What you were typing is kept.
- **"Not saved. Your last change is only on this screen."**: the browser refused to save.
  Tap **Back up now** first, then **Try again**.
- **"This copy of the app is older than your data"**: reload the page. The button on that
  page saves a backup of your data unchanged.

## For the builder

- The plan is `docs/BLUEPRINT.md`. It is the single source of truth: architecture in
  section 2, storage in 3, the data model in 4, screens in 7, the build order in 10.
- Plain HTML, CSS and JavaScript (ES2020). Classic deferred scripts in the order listed in
  `index.html`, one global `Laser`. No build step, no `package.json`, no network requests.
  It must keep working when `index.html` is opened by double-click (`file://`).
- `js/core/` never touches the page; `js/ui/` changes data only through
  `Laser.core.store.commit`; `js/main.js` only boots. Markup is built with the
  `Laser.core.util.html` tag and put on the page by `Laser.ui.mount`, the one place that
  writes markup. Addresses that leave the app are built only in `js/core/links.js`.
- The page has a strict Content-Security-Policy: no inline script, no inline event
  handler, no `style` attribute.

### Tests

**Unit tests.** Double-click `tests/unit.html`. It prints a green or red list. The test
page is safe to open: it uses its own test storage and never touches your clients.

**End-to-end tests.** They use a Playwright that is installed outside this repo (the repo
has no npm). From the repo root:

```
NODE_PATH="$(npm root -g)" playwright test -c laser/tests/playwright.config.js
```

They open `laser/index.html` from disk at a laptop size and a phone size, and fail on any
console error or any request that is not a local file.

### Check on the owner's own Mac (step 1)

In Safari and in Chrome: the Dashboard appears on double-click; a client you add is still
there after the browser was closed; "Back up now" saves a file that "Check a backup file"
accepts. Then add your own number as a client and tap WhatsApp, Email and Call, and set
Settings > Messages > "WhatsApp on a computer opens" to the choice that worked best.

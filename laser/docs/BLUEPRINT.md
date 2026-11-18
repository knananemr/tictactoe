# Laser practice dashboard: final blueprint

Version 1.1, 18 November 2026. This is the single plan to build from. It merges three competing blueprints (A simplicity-first, B workflow-first, C data-first), the verdicts of three judges (requirements, daily use, buildability) and four research reports (domain, product, technical, visual). Version 1.1 applies the notes of two critics (completeness and skeptic); Appendix C lists every note and where it was applied.

**How to read it.** The owner needs sections 1, 7, 8, 10 and 12. The builder needs all of it. A developer who has seen nothing else can build step 1 from sections 2, 3, 4, 5, 6, 7, 9.4 and 10.

**Evidence marks.** **[V]** = run and confirmed in Chromium on `file://` (by the technical research, by the check described in section 2.7, or by the critics' experiments). **[U]** = not verified here, mainly Safari, iPhone and the real WhatsApp, SMS and mail apps. Every [U] item has an acceptance check on the owner's own devices in section 10.

---

## 1. Product summary and principles

### 1.1 What it is

A private dashboard for one person who runs a solo laser hair removal practice. It opens in a browser from `laser/index.html`. Only the owner uses it; clients never log in. The owner records four kinds of facts: people (clients and leads), appointments, money received, and a few settings. From those the app works out everything else: who is coming today, who needs a reminder, who is due for the next session, how the month is going.

There is no server. Data lives in the browser on one chosen device (the "home device") and is protected by backup files. Nothing leaves the device unless the owner taps a send button. The app's code can be published at a web address so that it opens on the owner's phone (step 1b); the client data is never published.

### 1.2 Principles

1. **Three things to learn: People, Appointments, Money received.** A lead is a person who is not a client yet. A treatment is an appointment marked Done. A reminder is never typed in; the app works it out from dates.
2. **Type a fact once; everything else is counted.** Totals, monthly progress, due dates and the To-do list are always calculated from the facts, by one shared module, so two screens can never disagree.
3. **Home answers "what do I do now?"** A one-line summary, today's appointments, then one To-do list, red first, with one primary button per row. (Two kinds of row carry a second button: a rebook row has Book and Message, and a Contacts row has its four contact icons.) Every other screen is a searchable list.
4. **Only a name is required.** In every form the main fields come first and Save is always in view. Extras sit under "More" and never nag.
5. **Close the loop at the chair.** Finishing a session takes the payment and books the next date in one sheet, so the follow-up list holds only the exceptions.
6. **Every list can reach zero.** Each To-do row can be done, sent, snoozed, skipped or closed from the row itself. An empty list says "All caught up" in green.
7. **Honest words.** "Ready to send", never "sent automatically". The app prepares; the owner presses send. A mark the app made ("Reminded", "Asked") can always be taken back.
8. **Safe before useful.** Saving that cannot silently fail, the two-tab guard and a backup file exist before the first client is typed (step 1). Automatic copies, the device check and the choice of home device come straight after (step 1b), before the full client list is entered.
9. **One meaning per colour.** Red = late, act now. Yellow = important today or this week. Green = finished, nothing more to do. Blue and grey = everything else. A colour always comes with an icon and a word.

### 1.3 Decisions (where blueprints or judges disagreed)

The judges split three ways: requirements chose A (7.5), daily use chose B (8), buildability chose C (7.5). Averages are A 7.0, B 6.8, C 6.7. **Base = A** (smallest surface, the owner's own words, least to learn), with **B's chair-side loop** on top and **C's data safety** underneath.

| # | Topic | Disagreement | Decision | Why |
|---|---|---|---|---|
| D1 | Money model | A: one `paid` field. B: price + paid on the appointment. C: separate dated payment records. | **C's dated payment records, behind A's one-field form.** The Finish sheet asks only "Amount paid"; saving writes one payment record in the same save. Price exists but is hidden under "More" and means "same as received" when empty. | The owner sees one number, as asked. Underneath, money is counted in the month it arrived, a late payment never rewrites an old month, and prepaid packages need no fake session. If the owner later says "clients sometimes owe me", it is a switch, not a migration (question Q1). |
| D2 | Reminder state | A: timestamps on the appointment. B: stored slot states. C: an append-only contact log. | **Two slot records on the appointment, each stamped with the date and time it was sent for.** A record counts only while it matches the appointment's current date and time. No log collection. | Keeps C's best property (rescheduling reopens reminders with no reset code) without a list that grows forever inside a 5 MB store. |
| D3 | Lead or client | A and B store `kind`. C stores only `clientSince`. | **C: a person is a client when `clientSince` has a date.** That date is editable. | One field instead of two that can disagree, and existing clients can be entered without counting as "new this month". |
| D4 | Navigation | A: four tabs, leads inside People. B and C: five tabs. | **Five destinations: Home, Schedule, Clients, Leads, Progress**, plus a gear. | R5 asks for a list of leads; the requirements judge marked "buried leads" as a must-fix. Five is still the bottom-bar limit. |
| D5 | Name of the main screen | A and C: Home. B: Today. | **Tab label "Home", page title "Dashboard".** | R1 calls it a dashboard. |
| D6 | Same-day reminder colour | A and C: red all day. B: yellow until the last 2 hours. | **B, tightened after review.** Yellow from the morning (from the evening before for an early appointment), red only in the last 60 minutes before the appointment. The chosen lead time sets the "send by" time shown on the row (9.2). | Red every working morning would wear red out (R13). With the first draft's defaults an appointment before 10:30 was already red before the daily alarm rang. |
| D7 | New client with no session yet | Requirements judge: must appear in a list. Daily-use judge: must not flood To do. | **Shown in Schedule > Ask to rebook in a neutral group "Not booked yet"; never yellow or red; never in Home's To do.** A client whose only appointments were cancelled or missed is treated as due on that date. A client who is overdue by more than twice their interval moves to a grey group "Not seen for a while" and leaves To do (9.6). | Nobody falls out of every list, typing in 40 existing clients does not create 40 alarms, and a client who stopped coming does not stay red for ever. |
| D8 | Settings | Requirements judge: chip weeks and heads-up days must be settings (T6). Daily-use judge: prune settings to one short screen. | **Both.** The main Settings screen keeps to about ten everyday controls. Rarely changed values live in a collapsed "Advanced" group, and each of them arrives in the step that first uses it (4.6). Nothing is hard-coded. | Satisfies T6 without a wall of options, and the owner can reach every value from the step in which it starts to matter. |
| D9 | "Set aside X% to invest" | Requirements judge: add it, off by default (R7). Daily-use judge: drop it. | **Kept, off by default, set on the Progress screen itself**, not in Settings. | It is the owner's stated motivation; it costs one line. |
| D10 | Step 1 size | Buildability judge: split it. Task rule: step 1 must still give something real to do. | **Step 1 = the look, safe saving, backup by file and the contact list (name, phone, email). Step 1b = automatic copies, the device check, Example mode and the phone. Step 2 = full client profiles.** C's large scheduling step is split into steps 3, 4 and 5. Ten steps in total: 1, 1b, 2 to 9. | The split follows the requirement line R8 / R6. After review step 1 was cut again: it builds only what its own screens use, and each later component arrives with its first screen. |
| D11 | Booking request link (R11) | Requirements and daily-use judges liked C's link that opens the booking form prefilled. Buildability judge: unsafe input path, and empty if the data lives at `file://`. | **Outbound only.** The client's request arrives as a WhatsApp message; the owner books by hand. The prefilled link is listed as a later upgrade for a hosted home device. | It is the last, optional step; it must not add risk to the data app. |
| D12 | Health details | Domain research: skin type, safety flags, patch test, consent. All three blueprints: leave most out. | **Hair colour, hair thickness and special notes on the main form (R6). Treated areas and skin type as optional chips under "More". No safety checklist, patch test or consent tracking.** | Not requested, and it would sit unencrypted in the browser and in backup files. Special notes covers it. Question Q5 lets the owner change this. |
| D13 | Extra fields | B and C add payment method, duration per appointment, lead source, preferred channel, week start, business name. | **All left out.** One global "session length" in Advanced feeds the clash warning. | None was requested; each is an additive field later. |
| D14 | Hair colour swatches | Visual research suggests colour swatches. | **Text chips only.** | A red swatch for "Red" hair would break "red means urgent". |
| D15 | Tests and "no npm" (T2) | Research used Playwright. | **The repo gets no `package.json`.** Unit tests run from a double-clickable page; end-to-end tests use a Playwright that is installed outside the repo. | The app, and the repo, stay dependency-free. |
| D16 | Example data (after review) | First draft: example records flagged `demo`, mixed in with real ones. Skeptic: a real client typed into an example record is left out of every backup and deleted by "Clear". | **Example mode.** A separate, invented document shown in memory only and never saved. One tap goes back to the owner's own data. No `demo` field anywhere. | Real and invented records can never mix, the figures are never part invented, and the code loses a filter in export, links and every selector. |
| D17 | What green means (after review) | First draft: "Reminded" and "Asked" were green. Skeptic: green then says "done" about a session that has not happened. | **Green only for things that are finished and need nothing more:** Done, Paid, Became client, All caught up, Backed up. "Reminded" and "Asked" are a small grey tick line under the row; the badge stays blue. | The owner can tell finished sessions from reminded ones at a glance (R13). |
| D18 | Red in the rebook list (after review) | First draft: a client who does not answer came back red every week, and a lapsed client stayed red for ever. | **Red only for "the due date passed and I have not asked".** Asked with no answer is yellow. Lapsed is grey. | Red means "I am late", never "the client is slow". |
| D19 | Entering existing clients (after review) | First draft: every past treatment typed one by one, and "Earlier" needed a date. | **Two optional numbers per client, "Sessions already done" and "Already paid in total", under More. "Earlier" needs no date.** | R4 is right for a long-standing client after one form, and 40 existing clients do not show up as 40 new ones (R7). |
| D20 | When the phone is decided (after review) | First draft: laptop by default, phone "later". Skeptic: the daily loop is a phone loop; decide in step 1. Completeness: no step puts the app on the phone. | **Step 1b.** The code is published only with the owner's yes (question Q2), the owner tries the same build on phone and laptop with example data, then chooses the home device. | Step 1 stays small; the choice is made before the client list is typed; publishing the code remains the owner's decision. |
| D21 | Where Leads sits in the order (after review) | Skeptic: Leads is simpler than booking, move it to step 3. | **Kept at step 6.** | Its Message button, its To-do rows and "Convert and book" need the Send sheet, the To-do list and the Book sheet (steps 4 and 5), so moving it would split one step over three, and it would push recording money (a judges' must-fix) one step later. |
| D22 | Checking what is typed (after review) | First draft: forms used the browser's checks, saving was checked only in tests, import was strict. Skeptic: a value the form accepted could make a later backup refuse to load. | **One set of rules** in `schema.js`, used by every form, by every save and by import. Import rejects only a broken structure and repairs small faults (3.7). | A backup the app wrote always loads again. |

### 1.4 Words used in the app

| Word | Meaning |
|---|---|
| Client | A person with a "client since" date. |
| Lead | A person who asked about laser and is not a client yet. |
| Appointment | A date and time booked for a client. |
| Treatment | An appointment marked Done. Also called a session. |
| Money received | Money a client actually handed over, on the day it was handed over. |
| To do | The list on Home of things that need the owner today. |
| Ask to rebook | The list of clients whose next session is due and not booked (R2). |
| Reminder | A prepared message to a client about a booked appointment (R9). |
| Backup | A file, saved outside the browser, that contains all the data. |
| Example mode | A look at the app filled with invented clients. Nothing typed there is saved; one tap goes back to the owner's own data. |
| Home device | The one device and browser where the real client list lives. |

---

## 2. Architecture

### 2.1 Folder tree

Everything lives in `laser/` inside the existing repo. The repo gets no build tooling.

```
laser/
├── index.html                  app shell (2.3)
├── sw.js                       offline cache for the published copy (2.8)          (step 1b)
├── README.md                   owner guide (open, back up, move device, phone) + builder notes (tests)
├── img/
│   ├── icon.svg                app icon: blue rounded square with a white beam mark
│   └── icon-180.png            same icon, 180x180, for the iPhone Home Screen
├── css/
│   ├── tokens.css              custom properties only (6.1)
│   ├── base.css                reset, body type, links, focus ring, utility classes
│   ├── layout.css              sidebar, top bar, tab bar, floating + button, content grid, breakpoints
│   └── components.css          the components of 6.4; each one is added with the first screen that uses it
├── js/
│   ├── core/                   never touches `document`
│   │   ├── ns.js               creates the global `Laser`
│   │   ├── util.js             uid, escaping, `html` template tag, clone, debounce, platform
│   │   ├── dates.js            the only place date and time maths happens
│   │   ├── money.js            parse and format minor units
│   │   ├── phone.js            phone normalisation
│   │   ├── links.js            the only place an href is built (tel, sms, mailto, WhatsApp)
│   │   ├── schema.js           enums, defaults, record factories, normalize, validate, per-field checks
│   │   ├── migrations.js       ordered migrations
│   │   ├── storage.js          storage adapter and one fallback copy; automatic copies and self-test (step 1b)
│   │   ├── store.js            in-memory state, commit, undo, two-tab guard; Example mode (step 1b)
│   │   ├── selectors.js        every derived value (4.9)
│   │   ├── templates.js        message templates and placeholder filling        (step 5)
│   │   ├── reminders.js        To-do list and its signature (step 4); rebook status (5); leads (6); reminder slots (8)
│   │   ├── backup.js           build export text, validate and prepare import
│   │   ├── demo.js             builds the invented document for Example mode and fixtures (step 1b)
│   │   └── ics.js              calendar file for the daily alarm                  (step 8)
│   ├── ui/
│   │   ├── icons.js            inline SVG icon strings, 1.75px stroke
│   │   ├── components.js       badge, button, card, summary strip, row, tile, chips, segmented, field, banner, empty state
│   │   ├── overlay.js          sheet / side panel, modal, toast with Undo, the "Sent to ...?" strip
│   │   ├── files.js            download, pick a file, copy to clipboard; save picker, share, probes (step 1b)
│   │   ├── actions.js          `data-action` registry and the delegated listeners
│   │   ├── router.js           hash routes
│   │   ├── shell.js            navigation chrome, banners, view mounting, tick
│   │   ├── charts.js           SVG bar chart                                      (step 7)
│   │   ├── forms/
│   │   │   ├── personForm.js   client form (step 1 short, step 2 full, grows in 3 and 4)
│   │   │   ├── sessionForm.js  add treatment (step 3), book and finish (step 4)
│   │   │   ├── paymentForm.js  record payment                                     (step 3)
│   │   │   ├── sendSheet.js    prepared message + channel buttons                 (step 5)
│   │   │   └── leadForm.js     lead form and the "Follow up again?" sheet         (step 6)
│   │   └── views/
│   │       ├── home.js         Dashboard
│   │       ├── clients.js      client list, Summary and Contacts
│   │       ├── client.js       one client's page                                  (step 2)
│   │       ├── schedule.js     Upcoming, Ask to rebook, Done                      (step 3)
│   │       ├── leads.js                                                           (step 6)
│   │       ├── progress.js                                                        (step 7)
│   │       ├── run.js          "Send reminders" run                               (step 8)
│   │       ├── settings.js     settings, backup; device check and Example mode (step 1b)
│   │       └── placeholder.js  "arrives in step N" page for unbuilt tabs
│   └── main.js                 boot
├── request/                    optional client request page                       (step 9)
│   ├── index.html
│   ├── request.css
│   └── request.js
└── tests/                      never loaded by the app
    ├── unit.html               double-clickable unit test page; never touches real data (2.7)
    ├── unit/
    │   ├── harness.js          `test(name, fn)`, `eq(a, b)`, `ok(x)`; sets `window.__unit` and `Laser.STORE_NAME = 'laser-test'`
    │   └── *.test.js           one file per core module
    ├── e2e/
    │   ├── helpers.js          openApp, seed, makeFixture, strict error and network guards
    │   ├── guards.spec.js      static source checks (2.7)
    │   ├── unit.spec.js        opens unit.html under several time zones
    │   ├── backups.spec.js     every fixture still imports
    │   └── step1.spec.js, step1b.spec.js, step2.spec.js ... step9.spec.js
    ├── fixtures/
    │   └── backup-step1.json, backup-step1b.json ... one per step, invented people only
    └── playwright.config.js
```

Repo housekeeping in step 1: add to the root `.gitignore` the lines `laser-backup-*.json`, `laser/tests/test-results/`, `laser/tests/playwright-report/`, `/test-results/` and `/playwright-report/` (the last two because Playwright writes to the folder it is run from when no output folder is set); add `laser/` to the project list in the repo's `CLAUDE.md`.

### 2.2 Layers

| Layer | Folder | May use | Must not |
|---|---|---|---|
| Core | `js/core/` | plain data, `localStorage`, `sessionStorage`, `indexedDB`, `Intl`, `crypto` | touch `document`, build HTML (except `util.html`), read the clock except through `dates.now()` |
| UI | `js/ui/` | core, the DOM | change state except through `store.commit`; build an href except through `links.js` |
| Boot | `js/main.js` | both | hold logic |

Core modules are pure where possible: `selectors` and `reminders` take `(state, now)` and return data. That is what makes them testable from `unit.html`. Everything that needs the page lives in UI: the clipboard (including the hidden-text-area fallback), file download, the save picker, sharing, and every probe of the clipboard or of `Laser.ui.*` objects are in `ui/files.js`. `links.js` builds address strings only.

### 2.3 `index.html` (exact shell)

```html
<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; base-uri 'none'; form-action 'none'">
  <meta name="format-detection" content="telephone=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Laser">
  <meta name="theme-color" content="#F2F7FC">
  <title>Laser</title>
  <link rel="icon" href="img/icon.svg">
  <link rel="apple-touch-icon" href="img/icon-180.png">
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/components.css">
</head>
<body>
  <div id="boot-fail" class="boot-fail">
    <h1>Laser did not start</h1>
    <p>The app's files did not load. Open the file laser/index.html again. If you still see this message,
       your data is not lost: do not clear your browser data, and contact your builder.</p>
  </div>
  <div id="app" hidden></div>
  <div id="overlay-root"></div>
  <div id="toast-root" role="status" aria-live="polite"></div>
  <!-- ordered classic scripts, see 2.4 -->
</body>
</html>
```

- No inline script, no inline style, no external URL. The meta CSP blocks inline handlers, `style=""` attributes and every network request **[V]** (re-checked for this blueprint together with `base-uri` and `form-action`: scripts, stylesheet, `localStorage`, hash routes and a Blob download all worked on `file://` with zero non-file requests).
- `#boot-fail` is plain text. `base.css` hides it for the first 2 seconds (`animation` with a 2s delay), and `main.js` removes it on boot. If scripts or styles fail to load, the owner reads a message instead of a blank page.
- **Contingency [U]:** if Safari on `file://` refuses `'self'`, the page shows `#boot-fail`. The fix is to change the three `'self'` sources to `'self' file:`. This is the first item of the step 1 acceptance check on the owner's Mac.
- The page is `dir="ltr"` because the interface is English. Every element that shows or edits text the owner typed (names, notes, "interested in", message text areas and previews, the search field) carries `dir="auto"`, so a Hebrew or Arabic name or message is aligned and punctuated correctly inside the English page (T6).

### 2.4 Script load order

Classic scripts only. `type="module"`, `import()`, `fetch` and XHR of local files all fail on `file://` **[V]**. Every tag is `<script defer src="...">`; deferred classic scripts run in tag order **[V]**. Order (files marked with a step are added to the list in that step):

```
js/core/ns.js
js/core/util.js
js/core/dates.js
js/core/money.js
js/core/phone.js
js/core/links.js
js/core/schema.js
js/core/migrations.js
js/core/storage.js
js/core/store.js
js/core/selectors.js
js/core/templates.js        (step 5)
js/core/reminders.js        (step 4; extended in 5, 6, 8)
js/core/backup.js
js/core/demo.js             (step 1b)
js/core/ics.js              (step 8)
js/ui/icons.js
js/ui/components.js
js/ui/overlay.js
js/ui/files.js
js/ui/actions.js
js/ui/router.js
js/ui/shell.js
js/ui/charts.js             (step 7)
js/ui/forms/personForm.js
js/ui/forms/sessionForm.js  (step 3)
js/ui/forms/paymentForm.js  (step 3)
js/ui/forms/sendSheet.js    (step 5)
js/ui/forms/leadForm.js     (step 6)
js/ui/views/placeholder.js
js/ui/views/home.js
js/ui/views/clients.js
js/ui/views/client.js       (step 2)
js/ui/views/schedule.js     (step 3)
js/ui/views/leads.js        (step 6)
js/ui/views/progress.js     (step 7)
js/ui/views/run.js          (step 8)
js/ui/views/settings.js
js/main.js
```

### 2.5 Global namespace and module pattern

One global, `window.Laser`. Nothing else is added to `window`.

```js
// js/core/ns.js
(function () {
  'use strict';
  window.Laser = {
    APP_ID: 'laser-practice',
    VERSION: '0.1.0',      // shown in Settings; bumped every step
    STEP: '1',             // which build step this copy is: '1', '1b', '2' ... '9'
    DATA_FORMAT: 1,        // schemaVersion this code reads and writes
    STORE_NAME: 'laser',   // prefix of every storage key and of the IndexedDB name (3.1); tests set 'laser-test'
    core: {}, ui: {}, forms: {}, views: {}
  };
})();

// every other file
(function (L) {
  'use strict';
  function addDays(date, n) { /* ... */ }
  L.core.dates = { addDays: addDays /* ... */ };
})(window.Laser);
```

Language level: ES2020 syntax (const, let, arrow functions, template literals, optional chaining), no modules, no transpiler.

### 2.6 Coding conventions

**Escaping (XSS).** Client names, notes, templates and imported backups are untrusted text.
- Views build markup only with the tagged template `L.core.util.html`. It escapes every interpolated value (`& < > " '`) unless the value is itself the result of `html` (a `SafeHtml` object) or an array of them. There is no "raw" escape hatch for strings.
- `L.ui.mount(element, safeHtml)` (in `ui/components.js`) is the only function that assigns `innerHTML`, and it throws if given a plain string.
- Attribute values in templates are always double-quoted. User text never goes into `id`, `class` or `data-*` attributes; only record ids (generated UUIDs) and fixed words do.
- An href is only ever produced by `links.js`, from a fixed scheme plus `encodeURIComponent`. A stored value is never used as a URL. This closes the `javascript:` hole the research found **[V]**.
- No inline event handlers and no `style=""` attributes (the CSP blocks both). Sizes that depend on data (chart bars) use SVG attributes; `element.style.x = ...` from script is allowed under the CSP **[V]** but is used only in `charts.js`.

**State.** `store.get()` returns the current document; treat it as read-only. The only way to change it is `store.commit(label, mutator)` (3.3). Views never keep their own copy of data.

**Dates and money.** `new Date('YYYY-MM-DD')`, `Date.parse` on stored dates and `toISOString().slice(0, 10)` are banned (they shift the day near midnight **[V]**). All date work goes through `dates.js` (4.1). Money is integer minor units everywhere; a float never holds an amount.

**Event delegation.** `actions.js` attaches one listener each for `click`, `input`, `change`, `submit` and `keydown` on `document`. Interactive elements carry `data-action="noun.verb"` and, where needed, `data-id`. Handlers are registered with `L.ui.actions.on('client.save', function (el, event) { ... })`. Forms are real `<form novalidate>` elements; `submit` is always `preventDefault`-ed. Input types are kept for the right keyboard (`type="tel"`, `type="email"`, `inputmode="decimal"`), but the browser's own validation is switched off, because it accepts values the app's rules refuse.

**One set of rules for what may be saved (D22).** `schema.js` holds one check per field (`schema.check.personName(value)`, `.email`, `.phone`, `.amount` and so on; each returns null or a short message). The same checks are used in three places: by every form on submit (the message appears under the field), by `store.commit` on every save (3.3), and by import (3.7). A form can therefore never save a value that a later backup would refuse.

**Routing.** Hash routes **[V]**. The path picks the view; the query part of the hash opens a sheet, so the browser's Back button closes a sheet **[V]**.

| Hash | View |
|---|---|
| `#/home` | Dashboard (default; unknown routes go here) |
| `#/schedule/upcoming`, `#/schedule/rebook`, `#/schedule/done?month=YYYY-MM` | Schedule segments. `#/schedule` opens Upcoming once it is built (step 4); in step 3 it opens Done, the only built segment. |
| `#/clients`, `#/clients/contacts`, optional `?filter=active` (or paused, finished, owes) and `?sort=name` (or lastVisit, totalPaid, since) | Client list |
| `#/client/<id>` | Client page |
| `#/leads`, optional `?filter=notInterested` (or all) | Leads |
| `#/progress` | Monthly progress |
| `#/settings`, `#/settings/backup`, `#/settings/messages`, `#/settings/device` | Settings sections |
| `#/run` | Send-reminders run (step 8) |
| any of the above + `?sheet=<name>&id=<id>` | Opens a sheet over the view. Names: `new`, `client`, `lead`, `followUp`, `treatment`, `book`, `finish`, `payment`, `send`, `invest`. |

Route ids are looked up in the state; an unknown id shows the list with the toast "That record was not found." Route parameters are never rendered as HTML. "Show all" on the To-do card opens the rest of the list in place; it is not a route.

**Rendering.** A view is `{ title, render(state, route) -> SafeHtml }`. `shell.js` re-renders the chrome and the current view after every commit and every route change (500 rows render in 64 ms **[V]**). Four rules keep typing safe:
1. An open sheet is rendered once and is not re-rendered by store changes. Inside a sheet, small regions marked `data-partial="<name>"` (the "WhatsApp will use ..." line, the "= 1,150.00" line under an amount, the duplicate warning, the clash line) are re-rendered by that sheet's own input handlers and by nothing else.
2. A search box lives in the view header; typing re-renders only the element marked `data-partial="list"`.
3. **Drafts survive.** While a sheet holds unsaved input, its values are written to `laser.ui` (3.1) as `draft: { sheet, id, values, at }`, debounced by 400 ms. Closing without saving (Back, Esc, scrim, Cancel) keeps the draft and shows the toast "Not saved. Reopen". Opening the same sheet and id within 24 hours restores it, with the line "Restored what you were typing. Discard" at the top. Save and Discard remove the draft. This covers the common phone case: the owner opens New client, switches to WhatsApp to copy a number, and the phone discards the page meanwhile.
4. **Focus survives a save.** The element that opened a sheet is remembered as its `data-action` plus `data-id`. After the sheet closes and the view has re-rendered, focus goes to the matching element, or to the view's heading if it no longer exists.

**Recalculation.** Nothing "due" is stored. `shell.js` re-renders on load, on `visibilitychange` to visible, on window `focus`, on a 60-second tick, and when another tab changed the data (3.3). Every one of these automatic re-renders obeys the same three guards: no sheet is open, no form field or search box has focus, and something changed (`reminders.signature(state, now)`, which is today's date plus the ids and tones of all Today and To-do rows, or the document's `rev`). This covers midnight rollover and reminders becoming late while the app sits open, and never wipes text that is being typed. Until step 4 there is no To-do list and the signature is today's date only.

**Accessibility.** Labels above every field; focus trapped inside an open sheet and returned to the opener on close (rule 4); Esc closes; `aria-current="page"` on the active tab; toasts in an `aria-live` region; every status has an icon and a word, and carries `data-tone="urgent|important|done|info|neutral"` so tests can find it; `prefers-reduced-motion` removes transitions; all spacing uses CSS logical properties and owner-typed text uses `dir="auto"` (T6).

### 2.7 Tests

There is no npm in the repo (D15). Two layers:

**Unit tests: `laser/tests/unit.html`.** Double-click to run. It loads the core scripts and `tests/unit/*.test.js` with classic script tags, runs everything, and prints a green or red list. It sets `window.__unit = { total, failed, failures }`.

**The test page never touches real data.** All `file://` pages in one browser share one store **[V]**, so a test page that used the real keys could replace the owner's clients with test people. Three guards:
1. `unit.html` loads `js/core/ns.js`, then `tests/unit/harness.js`, which sets `Laser.STORE_NAME = 'laser-test'`, and only then the other core files. `storage.js` reads the name at call time, so every key becomes `laser-test.*` and the database `laser-test-copies`.
2. Unit tests of `store`, `backup` and `migrations` pass an in-memory adapter to `store.init({ adapter })`. Only the one adapter test writes to browser storage, on the `laser-test.` keys, and removes them when it ends.
3. `guards.spec.js` fails if `unit.html` or any file in `tests/unit/` contains `laser.doc`, `laser.rev`, `laser.prev`, `laser.ui` or `laser-copies`. The README says in one line that the test page is safe to open.

Required coverage by step 1:
- `dates`: `addDays` gives the same answer as `Date.UTC` arithmetic for every start date across two years (the research found 56 wrong days out of 730 with naive maths **[V]**); `today()` at 01:30 local; month keys; `diffDays`; weekday.
- `money`: the parse table in 4.1, row by row (the table is the test); format for a 2-decimal, 0-decimal (JPY) and 3-decimal (KWD) currency; symbol override.
- `phone` and `links`: the normalisation table in 9.4, row by row; the display form; every link form in the 9.4 table, including the three WhatsApp forms and an email address with a `+` in it. From step 1b: no link is returned in Example mode.
- `util.html`: an `<img onerror>` payload in a name renders as text.
- `schema`: `validate` rejects wrong types, unknown enum values, bad dates, non-integer money, broken references; each per-field check gives the same verdict as `validate` does on a document holding that value.
- `migrations.migrate`: runs an injected fake list in order; refuses a newer version.
- `backup`: export then import gives an identical document (apart from the three device fields that import resets, 3.7); a file with a soft fault is repaired and the repair is reported.

**End-to-end tests: Playwright against `file://`.** Playwright is installed outside the repo (globally, or wherever the builder keeps tools). Specs import from `playwright/test`. Command, run from the repo root (checked in this environment: Node 22, global Playwright, bundled Chromium):

```
NODE_PATH="$(npm root -g)" playwright test -c laser/tests/playwright.config.js
```

- `playwright.config.js`: `testDir: 'e2e'`, `outputDir: './test-results'`, `reporter: [['html', { open: 'never', outputFolder: './playwright-report' }]]` (with these two lines both folders land inside `laser/tests/` **[V]**); two projects: **laptop** (1280x800) and **phone** (390x844, `hasTouch`, `isMobile`); `acceptDownloads: true`; default `timezoneId: 'Asia/Jerusalem'`, `locale: 'en-GB'`. If a WebKit build is available, add a third project; it is a help, not a replacement for the manual Safari checks.
- `helpers.openApp(page, { hash, now, seed })`: installs a fixed clock with `page.clock.install({ time })` before load (Playwright 1.45 or newer); seeds `localStorage['laser.doc']` and `['laser.rev']` from a fixture with `page.addInitScript`; opens `pathToFileURL('laser/index.html').href + hash`. A new browser context has empty storage, so every test starts clean **[V]**.
- Strict guards in every test: fail on any `pageerror`, any console error, and any request whose URL does not start with `file:`, `blob:` or `data:`. The request guard is attached with `context.on('request')`, not on the page, because a page-level guard does not see a request made by a new tab **[V]**.
- **The one allowed outside address.** Tapping WhatsApp opens `https://wa.me/...` (or `https://web.whatsapp.com/...`) in a new tab. `helpers.js` stubs both with `context.route` (answered with an empty page, so nothing leaves the machine), records the attempted address, and the test asserts on it. No other outside address is allowed. `tel:`, `sms:`, `mailto:` and `whatsapp:` links are asserted by reading the `href`; tests never click them.
- **A failed save** is simulated from the test by overriding `Storage.prototype.setItem` in `addInitScript` so that it throws. There is no test hook in the app's code.
- **Fixtures.** `helpers.makeFixture(page, name)` runs `Laser.core.backup.buildFile(Laser.core.demo.build(FIXED_DATE))` in the page and writes the text to `fixtures/<name>.json`. The builder runs it once per step (a test tagged `@fixture`, skipped in normal runs). The step 1 fixture is written by hand, because `demo.js` arrives in step 1b: four invented people, one of them with a Hebrew name.
- `unit.spec.js` opens `unit.html` under `Asia/Jerusalem`, `America/Los_Angeles`, `Europe/London`, `Pacific/Auckland` and `Asia/Kolkata` and asserts `window.__unit.failed === 0`.
- `backups.spec.js` imports every file in `fixtures/` through the real Import screen and expects no error and no repair. A new step may never break an older step's backup.
- **Round trip.** Each step's spec ends by exporting the document its tests built through the real forms and importing it again, with no error and no repair (D22).
- `guards.spec.js` reads the source files and fails if it finds: `type="module"`, `import(`, `fetch(` (except in `sw.js`), `XMLHttpRequest`, `localStorage.clear`, `new Date('` or `new Date("`, `toISOString().slice`, `style="` inside `js/`, more than one `innerHTML` assignment, or `http://` / `https://` in `index.html`, `css/` or `js/` outside `links.js`. (`img/icon.svg` needs the SVG namespace address and the README names GitHub; neither is scanned.) It also holds the test-page guard above and, from step 1b, the two `sw.js` checks of 2.8.
- Downloads are tested with `page.waitForEvent('download')`, imports with `setInputFiles` **[V]**.

**Manual device checks.** Each step's acceptance list ends with a short check on the owner's own Mac, and on the owner's phone once step 1b has put the app there. Safari, the iPhone and the real WhatsApp, SMS and mail apps could not be tested by the research or the critics.

### 2.8 The offline copy: `sw.js` (step 1b)

When the app is opened from its web address, a phone needs the network to load the app's files, even though all the data is on the phone. In a treatment room with no signal the Home Screen icon would show the browser's "offline" page. A small service worker fixes that.

- `laser/sw.js` holds a constant `VERSION` and the list of the app's own files (`./`, `index.html`, the four CSS files, every script of 2.4, the two icons). On install it caches them under the name `laser-<VERSION>`; on activate it deletes older `laser-*` caches; on fetch it answers from the cache first and falls back to the network. It handles nothing outside its own folder and never sees the data.
- `main.js` registers it only when `location.protocol === 'https:'`. On `file://` there is no service worker, and none is needed.
- `script-src 'self'` covers the registration. **Contingency [U]:** if Safari refuses it, add `worker-src 'self'` to the policy in 2.3.
- Settings > This device shows "Works offline: yes / no" and, when a newer worker is waiting, "New version ready: Reload".
- `guards.spec.js` checks that `VERSION` in `sw.js` equals `Laser.VERSION`, and that the file list in `sw.js` equals the files `index.html` loads. A forgotten file or version would otherwise leave the phone on an old or broken copy.
- A cached old app that meets newer data is already handled by the "older than your data" page (3.4).

---

## 3. Storage

### 3.1 Where the data lives

| Place | Name | Holds |
|---|---|---|
| `localStorage` | `laser.doc` | The whole document as one JSON string. The source of truth. |
| `localStorage` | `laser.rev` | The document's revision number as a string. Used by the two-tab guard. |
| `localStorage` | `laser.prev` | One fallback copy of the document. In step 1 it holds the data as it was before the last import. From step 1b it is used only when IndexedDB is unavailable. |
| `localStorage` | `laser.ui` | Small screen state that must survive a discarded page: `{ draft, sent }` (the half-typed form of 2.6 and the "Sent to ...?" strip of 9.4). Not business data: never in a backup, never changes `laser.rev`. |
| `localStorage` | `laser.selftest` | Scratch value for the device check's write, read and delete line. Deleted at once. |
| `sessionStorage` | `laser.session` | A flag that lasts as long as the tab. Its absence at boot means "the app was opened afresh", which the device check uses (3.9). |
| IndexedDB | database `laser-copies`, store `copies` | Automatic copies (3.5), from step 1b. |

Rules: every key starts with `Laser.STORE_NAME` (`laser` in the app, `laser-test` on the test page, 2.7), and `storage.js` is the only file that knows the key names; the code never calls `localStorage.clear()` (Chromium shares one store between all local HTML files **[V]**, including the tic-tac-toe game). Measured size: 500 clients plus 6,000 appointments is about 2.0 million characters, saved in 16 ms, against a cap of about 5.2 million **[V]**.

**Three separate stores exist even on one device:** the `file://` copy, the hosted address opened in the browser, and the hosted address added to an iPhone Home Screen. Each starts empty. Two different browsers on one Mac (Safari and Chrome) are separate stores too. The owner picks one as home (3.9). Settings > This device always shows where this copy is running.

**What the double-clicked file cannot protect (stated honestly).** Because all local HTML files share one store **[V]**, any web page saved to this computer and opened from disk in the same browser (for example an `.html` attachment from an email) could read the client list and the automatic copies, and could overwrite them. No code under T2 can prevent this. The copy at the web address does not have this weakness: a web address gets storage of its own that no other site or file can read. The app therefore says so where it matters: the device check line "Where this copy runs" shows a yellow advisory on `file://` ("Do not open web pages saved from email or downloads in this browser. Safer: use the web address"), question Q2 names it, the README repeats it, and Appendix B lists it as a risk.

### 3.2 The document

```json
{
  "app": "laser-practice",
  "schemaVersion": 1,
  "rev": 0,
  "createdAt": "2026-11-18T08:12:44.000Z",
  "meta": { },
  "settings": { },
  "people": [],
  "appointments": [],
  "payments": []
}
```

All three collections exist, empty, from step 1, so a step 1 backup still imports at step 9. Fields are listed in section 4.

### 3.3 Saving: `store.commit`

```
commit(label, mutator, options = { undoable: true, countsAsChange: true })
  0. In Example mode (3.10): apply the mutator to the in-memory example document, notify subscribers,
     and stop. Nothing below runs: no storage write, no copy, no counters.
  1. If flags.stale, flags.blocked or flags.saveFailed: refuse and show the matching banner.
  2. draft = clone(state); mutator(draft). Record helpers stamp updatedAt on what they touch.
  3. errors = schema.validate(draft). If there are any: refuse the save, leave the sheet open and show
     the first message under its field. This runs on every save; there is no separate test build.
  4. draft.rev = state.rev + 1.
     If countsAsChange: meta.changesSinceExport += 1; if meta.unsavedSince is null, set it to now.
  5. Two-tab guard: if storage.readRev() !== lastSavedRev, set flags.stale and stop (nothing written).
  6. (From step 1b.) If meta.lastCopyOn !== today: put the PREVIOUS document into the copies store as
     today's daily copy (not awaited), and set draft.meta.lastCopyOn = today.
  7. storage.save(JSON.stringify(draft), draft.rev): a synchronous localStorage write of laser.doc and
     laser.rev inside try/catch, followed by a read-back length check.
     On failure: set flags.saveFailed, keep the draft on screen, show the red banner.
  8. lastUndo = undoable ? { label, doc: state } : null; state = draft.
     Only if the save succeeded: lastSavedRev = draft.rev.
  9. Notify subscribers (re-render).
```

- **Validation on every save (D22).** Step 3 uses the same per-field checks as the forms and import (2.6), plus the whole-document rules of 4.8. Because a form has already checked its own fields, a refusal here means a bug, and the owner sees a plain message instead of silently stored bad data. Cost: the step 1 spec measures `validate` on 500 clients with 6,000 appointments; if it takes more than 30 ms, `commit` validates only the records the mutator touched plus their references.
- **Undo** restores `lastUndo.doc` as a new commit (rev keeps counting up). Because it restores the whole previous document, a save that touched three records (finish + payment + next appointment) is undone as one. The Undo toast lives in memory for 6 seconds; marks made by a send button have a second, lasting way back (9.4).
- **Two-tab guard.** The owner opens the app by double-click, and every double-click is a new tab, so a second tab is normal, not an error. The app listens for the `storage` event (fires on `file://` **[V]**). When `laser.rev` changes from another tab:
  - if this tab has no sheet open and no draft, it reloads the state from storage and re-renders, silently;
  - if this tab holds unsaved input, it sets `flags.stale` and shows a red banner that cannot be dismissed: "This tab is out of date because the app was changed in another tab. What you typed is kept. Reload." Its only button reloads the page; the draft comes back from `laser.ui` (2.6).
  The check at save time (step 5) is unchanged: a commit attempted on a stale tab is refused, so last-write-wins cannot destroy data.
- **Failed save** (quota or write error): red banner "Not saved. Your last change is only on this screen." with buttons "Back up now" (exports the on-screen document) and "Try again". Further edits are refused until a save succeeds.
- **What counts as a change.** Every commit counts toward the backup nudge except bookkeeping ones: closing the Welcome card, choosing the home device, recording a device-check fact, and recording that a backup was made or checked. Those pass `countsAsChange: false`.
- **Synchronous by design.** `storage.save` returns a resolved promise but writes before returning. Send buttons rely on this: the "sent" mark is on disk before the phone switches to WhatsApp and possibly discards the page.
- **Persistent storage.** On a hosted copy (`https:`), after the first record is saved, call `navigator.storage.persist()` once, store the answer in `meta.persist` (4.7) and show it in Settings > This device. It returned false in tests and is reported always-false on Safari **[U]**; it is a bonus, not a protection.

### 3.4 Schema version and migrations

- `schemaVersion` is an integer. This blueprint defines version **1**, which already contains every field in section 4. Later steps start *using* fields; they do not add versions.
- `schema.normalize(doc)` runs on every load and import: it fills any missing field with its default and keeps unknown fields untouched. Adding an optional field therefore needs no migration.
- A migration is written only when a field is renamed, split, or changes meaning. `migrations.STEPS` is a map `{ 1: toV2, 2: toV3, ... }` of pure functions. `migrate(doc)` applies them in order to a clone until `schemaVersion === Laser.DATA_FORMAT`.
- Before a migration runs, the untouched raw string is stored as a `before-update` copy (3.5).
- **Stored version newer than the code** (for example a stale cached page on a hosted copy): the app does not open the data. It shows a full-page message, "This copy of the app (version X, data format N) is older than your data (format M). Reload the page to get the newest app.", with one button, "Save a backup of my data", which exports the raw string unchanged. No read-only mode.
- On load, records with `deletedAt` older than 30 days are removed for good. This is the only compaction needed, because nothing else grows without bound.

### 3.5 Automatic copies

A second line of defence between backups. They do not survive a browser wipe; only an exported file does.

- **Step 1 has one copy only:** before an import replaces the data, the current document is written to `laser.prev` (when it is under 1.5 million characters), and Settings > Backup shows "Undo the last import". Everything below arrives in step 1b.
- Store: IndexedDB `laser-copies`, object store `copies`, key path `key`. Record: `{ key, kind, at, rev, counts: { clients, leads, appointments, payments }, data }` where `data` is the raw document string.
- Kinds: `daily` (the document as it was before the first change of each day; key `daily:YYYY-MM-DD`), `before-import`, `before-update`, `before-restore` (key `<kind>:<ISO stamp>`).
- Cap: the newest 7 `daily` and the newest 5 of the other kinds; older ones are deleted on every put. Copies live outside `localStorage`, so they cannot exhaust its quota.
- Fallback when IndexedDB is missing or fails (the device check reports it): keep the single copy in `laser.prev` as in step 1. Settings then says "Automatic copies: one copy only on this browser".
- Restore: Settings > Backup > "Earlier copies" lists them ("Tuesday 17 Nov, start of day: 48 clients, 312 treatments"). Restoring first stores the current document as `before-restore`, then replaces it. It asks for confirmation.

### 3.6 Export (backup file)

- File content: the document as stored, plus two root fields: `"exportedAt"` (ISO stamp) and `"appVersion"`. Indented with two spaces so it is readable. (Example mode has no backup: its buttons are disabled, 3.10.)
- File name: `laser-backup-YYYY-MM-DD-HHMM.json`. Type `application/json`.
- Deleted records stay in the file for up to 30 days (3.4), because Undo and a later sync need them.
- **The app must not say "Backup saved" when it cannot know.** The backup nudge is the one protection against a wiped browser, so it is reset only when a file really exists. Four ways out. "Back up now" picks one by device: on a computer, "Save to a place you choose" where the browser has it, otherwise Download; on a phone or tablet, Share where it is available, otherwise Download. The others are separate buttons in Settings > Backup:

  | Way | Step | How | The app knows it worked? | Counts as a backup when |
  |---|---|---|---|---|
  | **Save to a place you choose** | 1b | `showSaveFilePicker`, where the browser has it (Chrome and Edge on a computer, also on `file://` **[V]**) | Yes: it reports success or cancel | the write succeeds. The owner picks the folder once; suggest iCloud Drive or a USB stick. |
  | **Share** | 1b | `navigator.share({ files: [file] })`. The reliable path on iPhone and in Home Screen mode, where Blob downloads are unreliable **[U]** | Yes: the promise resolves or rejects | the promise resolves. A cancelled share changes nothing. |
  | **Download** | 1 | Blob plus `a[download]`. Works on `file://`, also under the CSP **[V]** | No: a download gives no signal | at once, but the **first** download must be checked (below). |
  | **Copy as text** | 1b | copies the JSON to the clipboard; Import accepts pasted text | No: the data is only on the clipboard | the owner ticks "I saved it" under the line "Paste it into a note or an email to yourself, then tick here". |

- When it counts: `meta.lastExportAt = now`, `meta.changesSinceExport = 0`, `meta.unsavedSince = null`, and a toast that names a place: "Backup saved. Move it off this computer: iCloud Drive, a USB stick, or an email to yourself." (A downloaded file lands in Downloads on the same disk, as readable client data.)
- **Check your backup** (`meta.backupCheckedAt`). After the first plain download, a card on Home and in Settings > Backup says "Check your backup: choose the file you just saved." The owner picks the file; the app reads and validates it exactly as Import would (3.7 steps 1 to 3) and compares its counts with the current data, **without changing anything**. "This backup is good: 48 clients, 312 treatments, saved today." sets `meta.backupCheckedAt`. A successful save-picker write, a resolved share, or loading a backup made by this app sets it too. "Check a backup file" also accepts pasted text, which is how a "Copy as text" backup is checked. Until it is set, the getting-started item reads "Saved, not checked yet".
- Under the Export button, always visible: "This file contains your clients' names, phone numbers and notes as readable text. Keep it private. Never put it in the GitHub folder."

### 3.7 Import

All or nothing. Steps:
1. Read the file (`<input type="file" accept="application/json,.json">`) or pasted text. Parse inside try/catch.
2. Reject unless `app === "laser-practice"`. Reject if `schemaVersion` is not an integer from 1 to `DATA_FORMAT` (newer: "This backup comes from a newer version of the app.").
3. Migrate a clone, then `normalize`, then `schema.validate`, with the same checks every form and every save uses (D22). Faults fall into two classes:
   - **Structural faults reject the whole file** and show the first five: a wrong type anywhere (a phone that is a number, a collection that is not a list), a person with no name, money that is not an integer, a date or time in the wrong format, duplicate ids, a broken reference (`appointment.personId`, `payment.personId`, and `payment.appointmentId` when not null must exist), two live payments on one appointment. Nothing has changed at this point.
   - **Soft faults are repaired by `normalize` and listed in the preview**, so one small fault never makes a whole backup unusable: text longer than its limit is clipped; an email that does not match the rule is emptied; an unknown value in an optional list (hair colour, areas, skin type) is emptied; a setting outside its range goes back to its default. After the repair the document passes `validate`. Because every save is validated, a file written by this app has no such faults; the repairs exist for files edited by hand or written by an older version.
4. **Preview** (modal): "This backup: saved Thursday 12 Nov 2026, 48 clients, 6 leads, 312 treatments, 298 payments. It will replace what is in this browser now (51 clients, 6 leads, 320 treatments). A copy of the current data is kept under Earlier copies." (In step 1 the last sentence reads "You can undo this import in Settings > Backup.") If anything was repaired: "2 small fixes were made: Dana Levi: note shortened to 2,000 characters; Maya Cohen: email 'maya@' removed." Buttons: "Replace my data" (danger) and "Cancel".
5. On confirm: store the current document as `before-import` (in step 1: in `laser.prev`); replace the state; `rev = max(current, imported) + 1`; `meta.unsavedSince = null`; save; toast "Backup loaded."

There is no merge in version 1. Things that describe the device and not the practice (`meta.homeDevice`, `meta.reopenedAt`, `meta.persist`) are reset to null on import, so the new device asks and checks for itself.

### 3.8 Backup nudges

`selectors.backupStatus(state, now)`:

| Condition | Result |
|---|---|
| No records yet, or `meta.unsavedSince` is null | Quiet. Home footer shows "Last backup: 3 days ago" or "No backup yet". |
| `unsavedSince` is 7 or more days old | Yellow banner on every screen: "You have changes from the last N days that are not in a backup file. Back up now". |
| `unsavedSince` is 30 or more days old | The banner turns red: "No backup for N days. If this browser's data is cleared, those changes are gone. Back up now". |

The banner has one button, which starts "Back up now" (3.6). It cannot be dismissed while the condition holds, and it goes away only when a backup counts under the rules of 3.6. Example mode never shows it.

### 3.9 First run

`laser.doc` missing means first run in this store. The app creates an empty document (with `meta.startedOn` = today), saves it, and shows the **Welcome** card on Home. Because the document now exists, "first run" can no longer be read from storage, so the card has its own state: it stays, also after a reload, until one of its buttons is tapped (`meta.welcomeDone`). Only then does the Getting-started checklist take its place.

**Welcome card.** Three one-line statements. Each has a "More" link that opens the full paragraph, so the first screen is short and nothing is hidden.

1. **Where your data lives.** "Your clients are saved in this browser on this device only: not on the internet, not in GitHub. Your protection is the backup file."
   More: "Everything you type stays in this browser on this device. If this browser's history or site data is cleared, the data is deleted. Your protection is the backup file, kept somewhere outside this computer."
2. **What "automatic" means here.** "The app works out by itself who needs a reminder and writes the message. You press Send. It cannot send anything while it is closed."
   More: "Every time you open the app it works out by itself who needs a reminder today, who is due for their next session and who to follow up with, and it prepares each message. It cannot send anything while it is closed, and it cannot press Send for you: you tap Send, WhatsApp opens with the text ready, and you press send there. Fully hands-off sending needs a paid messaging service and a server. That is a possible later upgrade."
3. **Phone and computer.** "Your phone and your computer do not share data. In the next step you try the app on both and choose where your client list lives. Until then, add only two or three clients."
   More: "An iPhone cannot open the file on your computer. To use the app on a phone, the app's code (never your data) is published at a web address and added to the Home Screen. Moving the client list from one device to the other takes one backup and one import."
   From step 1b the statement ends differently, because the choice is now on the screen: "Your phone and your computer do not share data. Try the app on both, then choose below where your client list lives."

Under the three: "Used Laser before and see nothing here? You opened it in a different browser or a different place. Your data is still where you used it."

**Currency and country code, for confirmation.** The card suggests both from the device's region (`navigator.language`; for example `he-IL` gives ILS and 972) using a built-in table of about 40 regions in `schema.js`: "Currency: Israeli new shekel (ILS). Country code: +972. Correct?" with a "Change" link. When the region is not in the table the two fields are empty. Nothing is saved until the owner taps Start, and both stay editable in Settings.

Buttons: "Start" (saves the two values as shown), "I have a backup file" (Import) and, from step 1b, "See it with example data". Each sets `meta.welcomeDone`. Settings > This device > "How this app works" reopens the three full texts at any time.

**Getting-started checklist** (card on Home after the Welcome card, until every item is ticked; it has no "hide" button because it is three items long). Items tick themselves from the data:
1. Add your first client. (a person exists)
2. Save your first backup file and check it. (`meta.lastExportAt` and `meta.backupCheckedAt` set, 3.6)
3. From step 1b: Choose where your client list lives. (`meta.homeDevice` set)

**Choosing the home device (step 1b; question Q2).** Item 3 opens a card with one question, "Where will your client list live?", asked after the owner has tried the same build on the computer and, if the code was published, on the phone. Each answer states its consequence:
- "This computer. Opens by double-click. You will send WhatsApp messages from this computer, and finishing a session at the chair means walking to it." On `file://` the advisory of 3.1 is shown here.
- "My phone. Opens from the Home Screen icon, also without signal. You send WhatsApp, SMS and calls straight from the phone. The Home Screen app keeps its own data, separate from Safari, so always open it from the icon."
- Under both: "The two do not share data. You can move later with one backup and one import."

The choice is saved in `meta.homeDevice` and can be changed in Settings > This device. If clients were already typed on the other device, the card offers the move: "Back up there, then Load a backup here."

**Device check (step 1b).** It runs by itself at every start and takes a few milliseconds; it is not a chore for the owner. Settings > This device shows the result, and "Check again" re-runs it. Each line is in one of four states: **pass** (green tick), **warn** (yellow, with one sentence of advice), **pending** (grey: waiting for something that happens later) or **info** (plain text).

| Line | Kind | Pass when |
|---|---|---|
| App files loaded | required | every expected `Laser.core.*` object exists (`storage.selfTest`) and every expected `Laser.ui.*` object exists (`files.probe`) |
| Saving works | required | a value written to `laser.selftest` reads back and is deleted |
| Automatic copies | required | IndexedDB opens, writes and reads; or the one-copy fallback is in use (still a pass, with the note "one copy only on this browser") |
| Ids, money and dates | required | `crypto` gives random ids; the chosen currency formats; "4 weeks from today is Wednesday 16 December" equals the UTC calculation |
| Your data was still here when you opened the app again | follow-up | at a start without the `laser.session` flag, a document already existed. Stored once as `meta.reopenedAt`. Pending until then, with the hint "Close the app and open it again; this line ticks itself." |
| Backup file checked | follow-up | `meta.backupCheckedAt` is set (3.6) |
| Where this copy runs | info | shows `file://` or the web address. On `file://` it is drawn in yellow with the advisory of 3.1 |
| Home Screen app; Works offline; Persistent storage; Copy, Share and Save-to-a-folder available | info | each shown as yes or no |

**`ok` = every required line is a pass.** Follow-up and info lines never change `ok`, so a missing Share button or a not-yet-reopened browser cannot make the check fail. When `ok` is false, a yellow banner on every screen names the first failing line and links to Settings > This device. The result is recalculated at each start and is not stored; only the two follow-up facts are stored, in `meta` (4.7).

### 3.10 Example mode (step 1b)

So the owner can see every screen full, before and while typing real clients, without invented and real records ever mixing (D16).

- **Enter:** "See it with example data" on the Welcome card and in Settings > Example mode. The app builds an invented document with `demo.build(today)` and shows it **in memory only**. The owner's own document stays untouched in storage.
- **While it is on:** a blue banner sits at the top of every screen: "Example mode. None of this is real, and nothing you do here is saved. Back to my data". The owner can tap everything: add, book, finish, delete. `store.commit` changes only the in-memory example (3.3, step 0). Changes from other tabs are ignored until Example mode ends.
- **Leave:** "Back to my data" on the banner or in Settings. A reload or closing the tab leaves too. The app then shows the owner's document from storage again. Nothing needs clearing, because nothing was stored.
- **Safe to tap:** `links.js` returns no link while Example mode is on. Call, WhatsApp, SMS and email buttons show the toast "Example mode: nothing is sent." The Send sheet still shows the prepared message, with Copy only. Back up, Load a backup, Earlier copies and Erase are disabled, with the hint "Go back to your data first".
- **Content:** `demo.build(today)` is deterministic and dated relative to today, so the colours always show. At full build: 14 clients (10 active, 2 paused, 2 finished) with hair profiles and notes, one of them with a Hebrew name; 5 leads (2 new, 1 contacted with a follow-up today, 1 with an overdue follow-up, 1 not interested); about 70 treatments over the last 8 months with payments; 6 upcoming appointments (2 today, 1 tomorrow, 3 later); 1 appointment yesterday with no outcome; 2 clients overdue for rebooking, 2 due soon, 1 asked, 1 asked with no answer, 1 not seen for a while; 1 client who owes; 1 client with prepaid credit; 1 long-standing client with "Sessions already done". In step 1b it produces the 14 clients with their contact details; each later step's `demo.js` adds the parts that step can show.
- **Fixtures** for the tests come from the same builder with a fixed date (2.7), so the examples and the tests cannot drift apart.
- There is no `demo` field on any record, no filter in export, and no "clear" action.

### 3.11 Erase and move

- **Move to another device:** Back up on the old device; open the app on the new one; Import. Then, on the old device, Erase.
- **Erase this device** (Settings > Backup > bottom): removes `laser.doc`, `laser.rev`, `laser.prev`, `laser.ui` and every automatic copy. Requires a backup made in the last 10 minutes or ticking "I understand this cannot be undone", then typing ERASE.

### 3.12 The seam for a later cloud sync

`storage.js` exposes `load()`, `save(text, rev)`, `readRev()` and `usage()`. A cloud version replaces this adapter with one that keeps the same synchronous local write and adds a background push. Every record already has `id`, `updatedAt` and `deletedAt`, which is what record-level merging needs. Nothing else in the app would change.

---

## 4. Data model

### 4.1 Representation rules

| Kind | Stored as | Rules |
|---|---|---|
| Calendar date | string `YYYY-MM-DD` | Never converted through a `Date` in local time. Add days with `Date.UTC(y, m - 1, d + n)` and read back with UTC getters. "N weeks" is exactly N x 7 days. |
| Time of day | string `HH:MM`, 24-hour | Local wall-clock time of the practice. No time zone stored. |
| Today, now | `dates.today()`, `dates.nowTime()` | Built from the device's local getters (`getFullYear`, `getMonth`, `getDate`, `getHours`, `getMinutes`) of `dates.now()`, the one clock seam. |
| Audit stamp | ISO 8601 UTC string (`new Date().toISOString()`) | Only for `createdAt`, `updatedAt`, `deletedAt`, `at`. Never used for business logic about days. |
| Money | integer, minor units (cents, agorot) | The number of decimals is read **once**, when the currency is chosen, from `Intl.NumberFormat(...).resolvedOptions().maximumFractionDigits` (USD 2, JPY 0, KWD 3 **[V]**), and stored as `settings.currencyDecimals`. After that only the stored number is used, and it travels in every backup: two browsers can disagree about a currency's decimals (RSD is 2 in one and 0 in another **[V]**), and a backup read with the wrong scale would be 100 times off. |
| Id | string, UUID v4 | `crypto.randomUUID()`; fallback built from `crypto.getRandomValues`; last resort `Math.random` plus the clock. |
| Deletion | `deletedAt` stamp, or null | Soft delete. A record with `deletedAt` is invisible everywhere and excluded from every calculation. Removed for good after 30 days. |

**Displaying dates.** `dates.format(date, style, locale)` uses `Intl.DateTimeFormat(locale, { timeZone: 'UTC', ... })` on `Date.UTC(y, m - 1, d)`. Styles: `short` "Wed 16 Dec", `long` "Wednesday 16 December", `month` "November 2026", `monthShort` "Nov". The year is added when it is not the current year. The UI uses locale `en-GB`; dates placed into client messages use `settings.messageLocale` (9.3).

**Parsing typed money** (`money.parse(text, decimals)`), with no floating point. `decimals` is `settings.currencyDecimals`. The result is an integer, or `null` for "no amount typed", or an error message.
1. Remove spaces and apostrophes. If nothing is left, the result is `null` (empty is never 0). If any character other than a digit, `.` or `,` is left: error "Use digits only". If there is no digit at all: error "Enter a number".
2. If both `.` and `,` appear: the one that appears last is the decimal mark and must appear only once (otherwise error "Not a number"); remove every occurrence of the other.
3. If only one kind appears:
   - (a) it appears more than once: thousands separators; remove them.
   - (b) a single `,` with at least one digit before it and exactly three digits after it, in a currency that does not have three decimals: a thousands separator; remove it.
   - (c) a single `.` followed by exactly three digits, in a currency that does not have three decimals: error "Too many decimals". A dot is never read as a thousands separator.
   - (d) otherwise it is the decimal mark.
4. Split into whole and fraction. A fraction longer than `decimals` is an error ("Too many decimals"). Pad the fraction with zeros to the right length. An empty whole part counts as 0.
5. A whole part longer than 8 digits is an error ("Too large"). Result = `parseInt(whole + fraction, 10)`.

**This table is the unit test** (all rows were run against the rule as written above):

| Typed | Decimals | Result |
|---|---|---|
| `250` | 2 | 25000 |
| `250.5` | 2 | 25050 |
| `250,5` | 2 | 25050 |
| `1,5` | 2 | 150 |
| `.5` | 2 | 50 |
| `1,150` | 2 | 115000 |
| `12,345` | 2 | 1234500 |
| `1 150` | 2 | 115000 |
| `1,150.50` | 2 | 115050 |
| `1.150,50` | 2 | 115050 |
| `1,150,000` | 2 | 115000000 |
| `1.150` | 2 | error "Too many decimals" |
| `12.345` | 2 | error "Too many decimals" |
| (empty) | 2 | `null` (no amount) |
| `.` | 2 | error "Enter a number" |
| `12a` | 2 | error "Use digits only" |
| `1,150` | 0 (JPY) | 1150 |
| `250.5` | 0 (JPY) | error "Too many decimals" |
| `12.345` | 3 (KWD) | 12345 |
| `1,150` | 3 (KWD) | 1150 (read as 1.150) |

**The owner sees what was understood.** Under every money field a `data-partial` line shows the parsed amount while typing: "= 1,150.00". A misread comma or dot is visible before Save.

**Formatting money** (`money.format(minor, settings)`): the number of decimals is `settings.currencyDecimals`. If `settings.currencySymbol` is set, format the number with `Intl.NumberFormat('en', { minimumFractionDigits, maximumFractionDigits })` and put the symbol in front; else use `Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits, maximumFractionDigits })`. Whole amounts drop the decimals in lists ("250", not "250.00"); totals always align with `tabular-nums`. Until a currency is chosen no amount can be typed: money fields show "Choose your currency first" with a link to Settings (the Welcome card normally settles this on the first screen).

### 4.2 Fixed lists

| List | Values (stored value: label) |
|---|---|
| `hairColor` | `black`: Black; `darkBrown`: Dark brown; `lightBrown`: Light brown; `blonde`: Blonde; `red`: Red; `grey`: Grey / white |
| `hairThickness` | `fine`: Fine; `medium`: Medium; `coarse`: Coarse |
| `AREAS` | `upperLip`: Upper lip; `chin`: Chin; `fullFace`: Full face; `neck`: Neck; `underarms`: Underarms; `arms`: Arms; `chest`: Chest; `abdomen`: Abdomen; `back`: Back; `bikini`: Bikini; `brazilian`: Brazilian; `halfLegs`: Half legs; `fullLegs`: Full legs; `other`: Other |
| `skinType` | 1: I, very fair, always burns; 2: II, fair, usually burns; 3: III, medium, sometimes burns; 4: IV, olive, rarely burns; 5: V, brown, very rarely burns; 6: VI, deeply pigmented, never burns |
| `clientStatus` | `active`: Active; `paused`: Paused; `finished`: Course finished |
| `leadStatus` | `new`: New; `contacted`: Contacted; `notInterested`: Not interested |
| appointment `status` | `booked`: Booked; `done`: Done; `cancelled`: Cancelled; `noShow`: No-show |
| slot `action` | `sent`, `skipped` |
| `channel` | `whatsapp`, `sms`, `email`, `copy` |

### 4.3 Person (`people[]`)

A lead and a client are the same record. **A person is a client when `clientSince` is not null**; otherwise a lead.

| Field | Type | Allowed values | Default | Required |
|---|---|---|---|---|
| `id` | string | UUID | generated | yes |
| `name` | string | 1 to 80 characters after trimming | none | **yes, the only field the owner must fill** |
| `phone` | string | up to 30 characters, stored as typed | `""` | no |
| `email` | string | empty, or matches `^[^@\s]+@[^@\s]+$` (one `@` with text on both sides, no spaces), up to 120. The same check runs in the form, on save and on import. | `""` | no |
| `hairColor` | string or null | `hairColor` list | null | no |
| `hairThickness` | string or null | `hairThickness` list | null | no |
| `notes` | string | up to 2,000 characters | `""` | no |
| `areas` | array of string | values from `AREAS`, no repeats | `[]` | no |
| `skinType` | integer or null | 1 to 6 | null | no |
| `intervalWeeks` | integer or null | 1 to 26; null means "use `settings.rebookWeeks`" | null | no |
| `priorSessions` | integer | 0 to 999: sessions this client had before the app was used ("Sessions already done") | 0 | no |
| `priorPaidMinor` | integer | 0 or more: what this client paid before the app was used ("Already paid in total") | 0 | no |
| `clientSince` | date or null | any valid date (the form does not accept a future date) | created as a client with "Today": today. With "Earlier" and a date: that date. With "Earlier" and no date: the day before `meta.startedOn`. Created as a lead: null | no |
| `clientStatus` | string | `clientStatus` list | `active` | yes (ignored while a lead) |
| `leadSince` | date or null | date | today when created as a lead; null when created as a client | no |
| `leadStatus` | string or null | `leadStatus` list | `new` when created as a lead; null otherwise | no |
| `leadInterest` | string | up to 120 characters ("what they are interested in") | `""` | no |
| `followUpOn` | date or null | date | null | no |
| `rebookAskedOn` | date or null | date | null | no |
| `rebookAsks` | integer | 0 or more: how many times the client was asked in the current cycle | 0 | no |
| `rebookSnoozeUntil` | date or null | date | null | no |
| `rebookFor` | string or null | id of the appointment the three fields above refer to | null | no |
| `createdAt`, `updatedAt` | stamp | | now | yes |
| `deletedAt` | stamp or null | | null | yes |

The two "prior" numbers have no dates. They are added to the client's own totals (4.9 rules 4, 5 and 7) and to nothing else: never to a month, never to a balance.

### 4.4 Appointment (`appointments[]`)

One record is the booking, the treatment and the place the visit's money hangs from.

| Field | Type | Allowed values | Default | Required |
|---|---|---|---|---|
| `id` | string | UUID | generated | yes |
| `personId` | string | id of an existing person who is a client | none | yes |
| `date` | date | any valid date | none | yes |
| `time` | time or null | `HH:MM` | null | **yes when `status` is `booked`**; optional otherwise (old treatments may have no time) |
| `status` | string | appointment `status` list | `booked` | yes |
| `scheduledOn` | date | the day this date and time were set | today on create; set to today again whenever `date` or `time` changes | yes |
| `areas` | array of string | values from `AREAS` | `[]` | no |
| `priceMinor` | integer or null | 0 or more; null means "same as the money received for this visit" | null | no |
| `notes` | string | up to 1,000 characters | `""` | no |
| `reminderBefore` | slot or null | see below | null | no |
| `reminderSameDay` | slot or null | see below | null | no |
| `createdAt`, `updatedAt` | stamp | | now | yes |
| `deletedAt` | stamp or null | | null | yes |

**Slot** = `{ action, channel, at, forDate, forTime }`: `action` is `sent` or `skipped`; `channel` is from the `channel` list, or null when skipped; `at` is a stamp; `forDate` and `forTime` are the appointment's date and time at the moment of the action. **A slot record counts only while `forDate === date` and `forTime === time`.** Rescheduling therefore reopens both reminders with no reset code.

### 4.5 Payment (`payments[]`)

Every amount of money received is one dated record.

| Field | Type | Allowed values | Default | Required |
|---|---|---|---|---|
| `id` | string | UUID | generated | yes |
| `personId` | string | id of an existing person | none | yes |
| `appointmentId` | string or null | id of an existing appointment of the same person; null for a stand-alone payment | null | no |
| `paidOn` | date | any valid date | today, or the appointment's date for a linked payment | yes |
| `amountMinor` | integer | not 0; negative means a refund | none | yes |
| `note` | string | up to 200 characters | `""` | no |
| `createdAt`, `updatedAt` | stamp | | now | yes |
| `deletedAt` | stamp or null | | null | yes |

### 4.6 Settings (`settings`)

Every field exists in the document from step 1 (3.4). The **Step** column says when its control appears on the Settings screen, which is the step that first uses it.

Shown on the main Settings screen:

| Field | Type | Allowed | Default | Screen label | Step |
|---|---|---|---|---|---|
| `currency` | string or null | an ISO 4217 code listed by `Intl.supportedValuesOf('currency')` (a typo such as `ISL` is refused); where that function is missing, only the built-in list of common currencies is offered | null (suggested on the Welcome card) | Currency | 1 |
| `currencyDecimals` | integer | 0 to 4; written by the app when the currency is chosen (4.1); no control | 2 | (not shown) | 1 |
| `countryCode` | string | 1 to 4 digits, or `""` | `""` (suggested on the Welcome card) | Country code for phone numbers | 1 |
| `whatsappOnComputer` | string | `browser`, `app`, `web` (9.4) | `browser` | WhatsApp on a computer opens: in the browser / the WhatsApp app / WhatsApp Web | 1 |
| `usualPriceMinor` | integer or null | 0 or more | null | Usual price of a session | 3 |
| `trackBalances` | boolean | | false | Track what clients owe (part payments, packages) | 3 |
| `rebookWeeks` | integer | 1 to 26 | 4 | Weeks between sessions | 4 |
| `messageLocale` | string | `device`, or one of a short list of language codes: `en-GB`, `he`, `ar`, `ru`, `fr`, `es`, `de` | `en-GB` | Dates in messages are written in | 5 |
| `templates` | object | `{ before, sameDay, rebook, lead }`, each a string up to 1,000 characters | texts in 9.3 | Message texts | 5 (rebook), 6 (lead), 8 (before, same day) |
| `reminderDaysBefore` | integer | 0, 1, 2, 3, 7 (0 = off) | 2 | Remind clients ... days before | 8 |
| `sameDayHoursBefore` | integer | 0, 1, 2, 3 (0 = off) | 2 | Same-day reminder: ... hours before | 8 |

Under "Advanced" (collapsed; the group appears in step 3 with its first field):

| Field | Type | Allowed | Default | Screen label | Step |
|---|---|---|---|---|---|
| `currencySymbol` | string or null | up to 4 characters | null | Show this symbol instead | 3 |
| `quickPickWeeks` | array of integer | 1 to 3 values, each 1 to 26 | `[4, 6, 8]` | Quick date buttons (weeks) | 4 |
| `sessionMinutes` | integer | 5 to 240 | 30 | Usual length of a session (for the double-booking warning and "Mark as done?") | 4 |
| `rebookHeadsUpDays` | integer | 0 to 14 | 7 | Show "ask to rebook" ... days early | 5 |
| `askAgainDays` | integer | 1 to 30 | 7 | After asking, wait ... days before showing the client again | 5 |
| `eveningFrom` | time | `HH:MM` | `18:00` | Offer an early appointment's same-day reminder from this time the evening before | 8 |
| `dailyAlarmTime` | time | `HH:MM` | `08:30` | Time of the daily "open the app" alarm | 8 |
| `dailyAlarmDays` | array of integer | weekdays 1 (Monday) to 7 (Sunday), at least one | all seven | Days of the daily alarm | 8 |
| `ownerWhatsApp` | string | phone, up to 30 characters | `""` | Your own WhatsApp number | 9 |
| `requestPageUrl` | string | `""`, or text that starts with `https://`, up to 200 characters. Only ever placed inside message text; never used as a link by the app | `""`; prefilled with the page's own address when the app runs on `https:` | Address of your request page | 9 |

There is no "early appointment" setting: an appointment counts as early when it starts before `dailyAlarmTime` plus the same-day lead time plus 30 minutes (9.2), so the two values can never contradict each other.

Set on the Progress screen: `investPercent`, integer 0 to 100, default 0 (0 hides the line).

**Changing the currency after money exists.** If any payment or price is stored: a change to a currency with the same `currencyDecimals` is allowed after a confirmation ("This changes only the label. The numbers stay the same."); a change to a currency with a different number of decimals is refused with an explanation. With no money stored, any change is free.

### 4.7 Meta (`meta`)

| Field | Type | Default | Purpose |
|---|---|---|---|
| `startedOn` | date | today at creation | The local day this document was first created. Never changes. Anchors "new clients" (4.9 rule 13) and the stored date of an "Earlier" client with no date (4.3). |
| `welcomeDone` | boolean | false | One of the Welcome card's buttons was tapped (3.9). |
| `lastExportAt` | stamp or null | null | When the last backup that counts was made (3.6). |
| `backupCheckedAt` | stamp or null | null | When a backup file was last confirmed to exist and be readable (3.6). |
| `changesSinceExport` | integer | 0 | Shown in Settings ("14 changes since the last backup"). |
| `unsavedSince` | stamp or null | null | Stamp of the first change after the last backup. Drives the nudges (3.8). |
| `lastCopyOn` | date or null | null | Day of the last automatic daily copy. |
| `homeDevice` | `"laptop"`, `"phone"` or null | null | The owner's choice (3.9). Reset by import. |
| `reopenedAt` | stamp or null | null | First time the app found its data at a fresh start (device check, 3.9). Reset by import. |
| `persist` | `{ askedAt, granted }` or null | null | The browser's answer to `navigator.storage.persist()` (3.3). Reset by import. |

### 4.8 Integrity rules

1. **One linked payment per appointment.** The Finish sheet and the treatment form write or update the single payment whose `appointmentId` is that appointment. Its `personId` and `paidOn` always equal the appointment's `personId` and `date`; if the appointment's date is edited, the linked payment's `paidOn` is updated in the same save.
2. **Amount paid 0 means no payment record.** Setting an existing linked payment's amount to 0 soft-deletes it.
3. **Later money is a stand-alone payment.** "Record payment" on a client always creates a payment with `appointmentId: null` and its own date. It reduces the client's balance as a whole; debts are tracked per client, never per session. Refunds are a stand-alone payment with a negative amount (tick "This is a refund").
4. **A status change never touches payments.** If a Done session is later changed to Cancelled, its money stays as money received (the client then shows a credit). To remove money, the owner sets "Amount paid" to 0 or deletes the payment. The undo toast right after Finish restores everything, payment included.
5. **Money received is money received.** Every live payment counts as revenue in the month of its `paidOn`, whatever the status of the appointment it hangs from.
6. **Deleting an appointment soft-deletes its linked payment** in the same save. The confirmation says so: "This also removes the 250 received for it."
7. **Deleting a person soft-deletes their appointments and payments** in the same save. If they have any, a confirmation modal says: "Deleting Dana removes 6 treatments and 1,500 received from your totals. To keep the history, choose Course finished instead."
8. **An appointment needs a client.** Booking a lead converts them first (one save). Booking a paused or finished client sets them back to `active`.
9. **`time` is required while `status` is `booked`.**
10. **Import rejects** a file in which two live payments point at the same appointment, or any reference is broken.
11. **Duplicate guard.** When saving a new person whose normalised phone (9.4) equals another live person's, the form shows "Dana Levi already has this number. Open Dana / Save anyway". It never blocks.
12. **What the switch "Track what clients owe" does, and all it does.** It puts the Price field on the main part of the Add treatment, Book and Finish forms (instead of under More) and makes "Amount paid" follow it. Nothing else depends on it. A balance is always calculated (4.9 rule 9) and is always shown when it is not 0: the "Owes" and "Credit" badges, the Owes filter, "Owed to you" on Home and the "Use credit" button work the same with the switch off. With the switch off a balance can only arise when the owner typed a price under More or changed a paid session to Cancelled, so most owners never see one.
13. **`meta.startedOn` is written once.** `normalize` fills a missing value from the local day of `createdAt`.

### 4.9 Derived values (never stored)

All of these live in `selectors.js` (or `reminders.js` for 16 to 20 and the signature of 2.6) and take `(state, now)`. "Live" means `deletedAt` is null.

| # | Value | Exact rule |
|---|---|---|
| 1 | is client / is lead | `clientSince !== null` / `clientSince === null` |
| 2 | open lead | lead with `leadStatus` `new` or `contacted` |
| 3 | active client | client with `clientStatus === 'active'` |
| 4 | sessions done (client) | `priorSessions` + count of the client's live appointments with `status === 'done'` |
| 5 | session number of an appointment | `priorSessions` + 1 + count of the client's Done appointments ordered before it by (`date`, `time` or `00:00`, `createdAt`) |
| 6 | paid for an appointment | sum of `amountMinor` of live payments linked to it |
| 7 | total paid (client) | `priorPaidMinor` + sum of `amountMinor` of all the client's live payments |
| 8 | effective price of an appointment | `priceMinor` if not null, else value 6 |
| 9 | balance (client) | sum of value 8 over the client's Done appointments, minus the sum of `amountMinor` of the client's live payments. `priorPaidMinor` is not part of it. Above 0: "Owes". Below 0: "Credit". |
| 10 | last visit | latest `date` among the client's Done appointments, or none |
| 11 | next visit | earliest `date` and `time` among the client's Booked appointments dated today or later, or none |
| 12 | appointment needs an outcome | `status === 'booked'` and (`date` before today, or `date` is today and now is at or past `time` + `sessionMinutes`) |
| 13 | monthly figures for month M | treatments = Done appointments dated in M; people treated = distinct `personId` among them; new clients = live clients with `clientSince` in M **and** on or after `meta.startedOn` (for a month that ended before `startedOn` the figure is shown as a dash, because the app was not in use); money received = sum of live payments with `paidOn` in M. The two "prior" numbers of 4.3 are in none of these. |
| 14 | change vs last month (current month) | like for like: this month from day 1 to today, against the previous month from day 1 to the same day number (capped at that month's length). Percent = round((cur - prev) / prev x 100); when prev is 0 show "new" instead of a percent. **Early in the month a percent is noise** (minus 100% on the 1st until the first payment), so before the 8th, or when either side has fewer than 3 payments, the chip shows the two amounts instead: "750 so far, 500 by this day last month". The same rule applies to the counts (people treated, new clients), with "fewer than 3" counted in sessions or clients. |
| 15 | change vs the month before (finished months) | full month against full month, same percent formula. This is the "Money vs month before" column of the Progress table. |
| 16 | rebook anchor | the client's last Done appointment; if they have none, their latest Cancelled or No-show appointment; else none |
| 17 | rebook due date | anchor Done: anchor date + interval x 7 days, where interval = `intervalWeeks` or `settings.rebookWeeks`. Anchor Cancelled or No-show: the anchor's date. No anchor: none. |
| 18 | rebook state | first match: (1) not an active client: `none`. (2) Has any Booked appointment: `booked`. (3) No anchor: `notBookedYet`. (4) `rebookFor` is the anchor and `rebookSnoozeUntil` is after today: `snoozed`. (5) `rebookFor` is the anchor and `rebookAskedOn` is fewer than `askAgainDays` days ago: `asked`. (6) Today is more than 2 x interval x 7 days after the due date: `lapsed`. (7) `rebookFor` is the anchor and `rebookAsks` is 1 or more: `noAnswer`. (8) Today is after the due date: `overdue`. (9) The due date is within `rebookHeadsUpDays` days: `dueSoon`. (10) Otherwise `notYet`. |
| 19 | reminder slot states | section 9.2 |
| 20 | To-do list | section 5.3 |
| 21 | best month | the month with the highest money received among months with any data; ties go to the earlier month |
| 22 | streak | number of finished months in a row, ending with the latest finished month, each above the month before it; shown when 2 or more |
| 23 | backup status | section 3.8 |
| 24 | search match | case-insensitive substring of `name` or `email`; or, when the query has 3 or more digits, the digits appear in the digits of `phone` |
| 25 | lead who became a client | `leadSince` and `clientSince` are both set |

`rebookAskedOn`, `rebookAsks` and `rebookSnoozeUntil` are ignored whenever `rebookFor` is not the current anchor, so each new session starts a clean cycle with no reset code. Marking a client as asked sets `rebookAskedOn = today` and `rebookFor = anchor`, and sets `rebookAsks` to 1 if `rebookFor` was a different appointment, else adds 1.

Rule 18 in one sentence: red (`overdue`) means the due date has passed **and the owner has not asked yet**. Once asked, a client is blue (`asked`) for `askAgainDays`, then yellow (`noAnswer`), never red again in that cycle; and a client who is more than two intervals past due is grey (`lapsed`) however many times they were asked.

Invest amount (7.7): `Math.round(total x investPercent / 100)` on the total of the period shown, in minor units. The year figure is calculated from the year's total, not by adding the rounded months.

### 4.10 Worked money examples (also acceptance tests in step 3)

The usual price is 250 in all of them.

1. **Pay as you go, tracking off.** Three sessions, 250 paid each. Prices are null. Total paid 750, balance 0, no badge. Prefill (7.9): session 1 opens with 250 "Your usual price"; sessions 2 and 3 open with 250.
2. **Prepaid package, tracking off.** Session 1: amount paid 1,500. Sessions 2 to 6: amount paid 0. Prices are null, so each session's effective price equals what was received for it. Total paid 1,500, balance 0, never an "Owes" badge. All 1,500 counts in the month of session 1. Prefill: session 1 opens with 250 and the owner types 1,500. **Sessions 2 to 6 open with the amount empty**, the caption "Last time: 1,500" and the chips "0 today", "250 usual" and "1,500 last time" (session 2) or "0 today" and "250 usual" (later sessions); the owner taps "0 today". The form never opens prefilled with 1,500.
3. **Prepaid package, tracking on.** Session 1: price 250, paid 1,500: balance -1,250, badge "Credit 1,250" (blue); the client page adds "about 5 sessions" (credit divided by the usual price, rounded down). Session 2: price 250; the Finish sheet shows "Has 1,250 credit" with a button "Use credit", which sets amount paid to 0. After six sessions the balance is 0.
4. **Part payment, tracking on.** Session on 28 February: price 250, paid 130: badge "Owes 120" (yellow). On 5 March the owner taps "Record payment", 120: balance 0. February's money received stays 130; March gains 120.
5. **Cancelled after paying, either setting.** A Done session with 250 received is changed to Cancelled. The 250 still counts as received; the client shows "Credit 250" until the owner refunds it (stand-alone payment of -250) or uses it. (This is one of the two ways a balance can appear with tracking off, 4.8 rule 12.)
6. **A client from before the app, either setting.** "Sessions already done: 6" and "Already paid in total: 1,500" are typed on the client form. The client shows Sessions 6, Total paid 1,500, balance 0, and their next treatment is "Session 7". No monthly figure changes.

---

## 5. Status rules (R13)

### 5.1 The tones

| Tone | Meaning | Tokens | Icon | Always with a word such as |
|---|---|---|---|---|
| **Red, urgent** | Late. A date or time has passed and the owner has not acted. | `--urgent-*` | alert circle | "Overdue 5 d", "Reminder late", "No outcome" |
| **Yellow, important** | Needs attention today or this week. | `--important-*` | filled dot | "Reminder ready", "Due today", "New lead", "Owes 120", "No answer 9 d" |
| **Green, done** | Finished, and nothing more is needed. | `--done-*` | check | "Done", "Paid 250", "Became client", "All caught up", "Backed up today" |
| Blue, info | Planned, upcoming, waiting, a plain fact. | `--info-*` | clock | "Booked", "Asked 3 d ago", "Contacted", "Credit 1,250" |
| Grey, neutral | Inactive or closed. | `--neutral-*` | minus | "Cancelled", "No-show", "Paused", "Snoozed", "Not seen for a while" |

**Green is never used for something that is only half way** (D17). A reminder that was sent, or a client who was asked, is not "done": the session has not happened and the client has not answered. Those facts are shown as a small grey tick line under the row's name ("Reminded Mon 16 Nov", "Asked Tue 10 Nov"), and the row's badge stays blue.

**Badge words are short.** A badge holds at most about 16 characters, so that a name, a badge and the buttons fit a 320px phone (6.4). Longer facts go on the row's second line.

### 5.2 Exact conditions

"Now" and "today" are the device's local time and date. `N` = `settings.reminderDaysBefore`, `H` = `settings.sameDayHoursBefore`. Reminder slots are defined fully in 9.2.

| Item | RED when | YELLOW when | GREEN when | Blue or grey when |
|---|---|---|---|---|
| **Appointment** | Status Booked and its date is before today: "No outcome" | Status Booked, date is today, and now is at or past start time + `sessionMinutes`: "Mark as done?" | Status Done: "Done", plus "Paid 250" when money was received for it | Booked and in the future: blue "Booked". Booked, today, not yet over: blue "Today 14:00". Cancelled or No-show: grey. |
| **Days-before reminder** (R9) | Not sent, its send day (appointment date minus N days) has passed, and the appointment is still on a later day: "Reminder late" | Not sent and today is the send day: "Reminder ready" | Never | Sent: no badge; grey tick line "Reminded Mon 16 Nov". Skipped by the owner: grey line "Reminder skipped". Not due yet: grey line "Reminder on Mon 16 Nov". Not needed (booked inside the window) or expired: nothing shown. |
| **Same-day reminder** (R9) | Not sent and 60 minutes or less remain before the start time: "Reminder late" | Not sent, its window is open and more than 60 minutes remain: "Reminder ready", with "send by 12:00" (start time minus H) on the second line | Never | Sent: grey tick line "Reminded today". Before its window, or after the start time (expired): nothing shown. |
| **Rebooking** (R2) | Rebook state `overdue` (due date passed, not asked yet): "Overdue 5 d" | State `dueSoon`: "Due in 3 days", "Due today". State `noAnswer`: "No answer 9 d" | Never | State `asked`: blue "Asked 3 d ago". State `booked`: blue "Next booked" (client page only). `notBookedYet`: grey "Not booked yet". `lapsed`: grey "Not seen 14 wk". `snoozed`: grey "Snoozed", with "until Wed 25 Nov" on the second line. Paused, Course finished: grey. |
| **Lead** (R5) | Open lead and `followUpOn` is before today: "Follow-up late" | Open lead and `followUpOn` is today: "Follow up today". Otherwise, `leadStatus` is `new`: "New lead" | Became a client: "Became client" (Leads > All, and a toast) | `contacted` with no follow-up due: blue "Contacted", with "next: Thu 3 Dec" on the second line if a date is set. `notInterested`: grey. |
| **Client's money** | Never | Balance above 0: "Owes 120" | On a Done row with money: "Paid 250" | Balance below 0: blue "Credit 1,250". Balance 0: no badge. (The same whether "Track what clients owe" is on or off, 4.8 rule 12.) |
| **Backup** | 30 or more days of changes not in a backup file | 7 or more days | Right after a backup that counts (3.6): green toast; Home footer "Backed up today" | Otherwise plain text "Last backup: 3 days ago". |
| **Monthly numbers** (R7) | Never | Never | Never | Above the comparison month: blue chip, up arrow, "12%". Below: grey chip, down arrow. Equal or no comparison: grey "same" or "new". The best month's "Best" badge is blue with a star. A drop is never red, and growth is not green, because green means "done" (principle 9). |
| **To-do list** | (rows carry their own tone) | | Empty: green "All caught up" | |
| **System** | Save failed. Tab out of date with unsaved input. A form field with an error. | A device-check line that failed. | | Example-mode banner: blue. |

Lead rule order (first match wins): follow-up date passed, follow-up date today, status new, otherwise neutral. A new lead with no follow-up date is yellow until the owner taps Contacted or closes it; it never turns red by itself, because red means a date the owner set has passed.

### 5.3 The To-do list (Home)

`reminders.todo(state, now)` returns rows built from, in this order of type:

1. **One row for all reminders** that are ready or late (from step 8): "9 reminders ready" (or "9 reminders, 2 late"). Button: **Send reminders**, which opens the run (9.7). The row is red when any reminder is late, otherwise yellow. Reminders are never listed one by one here, so they cannot push everything else out of sight.
2. Appointments **from earlier days** that need an outcome (5.2, red) (from step 4). Button: **Finish**. Overflow: No-show, Cancel, Reschedule, so a client who did not come can be closed from Home.
3. Clients whose rebook state is `overdue`, `dueSoon` or `noAnswer` (from step 5). Button: **Book**; second button **Message** (labelled **Ask again** for `noAnswer`). After a second unanswered ask (`rebookAsks` is 2 or more) the main button becomes **Pause client**, with Book and Ask again in the overflow.
4. Open leads that are red or yellow (from step 6). Button: **Contacted** for a new lead, **Message** for a follow-up. Overflow: Followed up, Not interested.

**Nothing appears twice on Home.** Today's appointments live in the Today card, with their own Finish or Send button (7.2); they are not repeated in To do. The single reminder row counts today's reminders too, because the run handles them all, but it is one row.

Sorting: all red rows first, then yellow; inside a tone by the type order above; inside a type by date and time, oldest first. Home shows the first 5 rows on a phone and the first 8 on a laptop, then "Show all (14)", which opens the rest in place. The Home tab carries a small red count pill equal to the number of red rows in Today and To do together; with none, there is no pill. States `asked`, `snoozed`, `notBookedYet` and `lapsed` never appear in To do.

`reminders.signature(state, now)` = today's date plus the id and tone of every Today and To-do row (2.6). In step 4 `todo` returns type 2 only; steps 5, 6 and 8 add types 3, 4 and 1.

### 5.4 Rules of use

- **Never colour alone.** Every status is a badge with an icon and a word, and the element carries `data-tone` (2.6).
- **One status per row.** If several apply, show the most urgent: red, then yellow, then green, then blue, then grey. An Upcoming row therefore shows one badge that combines the appointment and its two reminders. A sent reminder never makes a row green (5.1); it only adds the grey tick line.
- **Where colour sits, and yellow that is really yellow.** A row or tile shows its status as a 4px bar on its inline-start edge plus the badge. The bar uses the **solid** colour (`--important-solid`, `--urgent-solid`, `--done-solid`; `--info-border` and `--neutral-border` for blue and grey). In the two places that ask for action, the **Today** and **To do** cards, yellow and red badges are drawn solid too: dark text on `--important-solid` (9.34:1) and white on `--urgent-solid` (5.60:1). Everywhere else badges use the soft tint. Rows are never filled with colour.
- **With nothing late, there is no red status on screen.** The only other red appears in direct response to the owner's own action (a form error) or when data is at risk (save failed, tab out of date).
- **Words that name a destructive action are outside the colour rule.** "Delete client", "Erase this device" and the confirm button of a delete use `--urgent-text` or the danger button (6.4). They are labels, not statuses, carry no `data-tone`, and are always on screen in Settings and in overflow menus.
- **Yellow has seven triggers and no more:** reminder ready, mark as done, rebook due soon, asked with no answer, new lead or follow-up today, client owes, backup due. (Settings > This device adds two that are about the device, not the practice: a failed device-check line, which a healthy browser never shows, and the advisory shown while the app runs from the double-clicked file, 3.1.) Missing optional details (no phone, no skin type) are never yellow; a missing phone shows a grey hint only where a message cannot be sent.
- **One yellow use that is not a status:** a client's special notes are shown in a yellow-tinted "Note" box on the client page and at the top of the Finish sheet, because they are exactly "important things" (R13). There is no other non-status yellow: the chart's "Best" badge is blue.
- **At most one banner of each kind per screen**, stacked in this order: save failed or tab out of date (red), backup (yellow or red), device check (yellow), Example mode (blue).
- **Navigation stays blue and white.** The only status allowed in it is the red count pill.

---

## 6. Design system (R12, R13)

### 6.1 Tokens: `css/tokens.css`

The colour block is the visual research block, unchanged. All ratios in 6.2 were recomputed for this blueprint with a node script (WCAG 2.x relative luminance) and match the research figures.

```css
:root{
  /* Brand blues + surfaces */
  --bg:#F2F7FC;            /* page tint */
  --surface:#FFFFFF;       /* cards, panels, bars */
  --surface-sunken:#EAF2F9;/* table head, disabled field, chart track */
  --primary:#1570C2;       /* filled buttons, active nav, chart bars */
  --primary-hover:#105FA8;
  --primary-active:#0C4E8C;
  --primary-ink:#1263AE;   /* blue TEXT/links/icons, incl. on blue tints */
  --primary-soft:#DDEDFB;  /* selected nav item, secondary button fill */
  --primary-soft-hover:#CBE3F8;
  --sky:#8CC6F0;           /* decorative only: past-month bars, toast action */
  --border:#D3E1EE;        /* decorative hairlines, card edges */
  --border-strong:#71899F; /* input/checkbox/segmented outlines (3:1) */
  --focus-ring:#1570C2;

  /* Text */
  --text:#0F2437; --text-2:#44596D; --text-3:#566B80;
  --text-disabled:#8FA1B3; --text-on-primary:#FFFFFF;

  /* Status: tint bg / border / dark text / solid */
  --important-bg:#FFF4CC; --important-border:#B07A00; --important-text:#5F4100;
  --important-solid:#FFCB3D; --important-on-solid:#3A2800;
  --done-bg:#E2F5E9; --done-border:#2B8A57; --done-text:#14532D; --done-solid:#1E7A48;
  --urgent-bg:#FDE7E5; --urgent-border:#D13B30; --urgent-text:#8A1C15;
  --urgent-solid:#C2302A; --urgent-solid-hover:#A32620;
  --info-bg:#E4F0FB; --info-border:#4487C4; --info-text:#0D4A80;
  --neutral-bg:#EDF1F5; --neutral-border:#76899B; --neutral-text:#394B5D;
  --toast-bg:#0F2437; --scrim:rgba(15,36,55,.45);

  /* Type */
  --font:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --fs-xs:12px; --fs-sm:14px; --fs-md:16px; --fs-lg:18px; --fs-xl:22px; --fs-kpi:28px;
  --lh-tight:1.2; --lh-body:1.5;
  --fw-regular:400; --fw-medium:500; --fw-semibold:600; --fw-bold:700;

  /* Space (4px base), radii, shadows, sizes */
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:20px; --s-6:24px; --s-8:32px; --s-12:48px;
  --r-sm:6px; --r-md:10px; --r-lg:14px; --r-xl:20px; --r-pill:999px;
  --shadow-1:0 1px 2px rgba(15,36,55,.06),0 1px 3px rgba(15,36,55,.08);
  --shadow-2:0 4px 12px rgba(15,36,55,.10);
  --shadow-3:0 12px 32px rgba(15,36,55,.18);
  --tap:44px; --tap-lg:48px; --sidebar-w:240px; --tabbar-h:56px; --content-max:1200px;

  /* Additions for this blueprint: sizes, layers and motion only. No new colours. */
  --topbar-h:56px; --fab:56px; --panel-w:440px; --modal-w:420px; --row-h:52px; --badge-h:24px; --bar:4px;
  --z-nav:10; --z-fab:20; --z-overlay:30; --z-toast:40;
  --dur-fast:120ms; --dur:200ms; --ease:cubic-bezier(.2,.8,.2,1);
}
```

### 6.2 Verified contrast (needs 4.5 for text, 3.0 for borders and UI parts)

| Pair | Ratio |
|---|---|
| `--text` on surface / bg / sunken / primary-soft | 15.82 / 14.67 / 13.98 / 13.24 |
| `--text-2` on the same four | 7.25 / 6.73 / 6.41 / 6.07 |
| `--text-3` on the same four | 5.51 / 5.11 / 4.87 / 4.61 |
| White on primary / hover / active | 5.09 / 6.51 / 8.45 |
| `--primary-ink` on surface / bg / sunken / soft / soft-hover | 6.14 / 5.69 / 5.43 / 5.14 / 4.64 |
| Important text on its tint / white | 8.50 / 9.36 |
| Done text on its tint / white | 8.01 / 9.11 |
| Urgent text on its tint / white | 7.86 / 9.30 |
| Info text on its tint / white; neutral text on its tint / white | 7.87 / 9.10; 7.91 / 8.98 |
| `--text` on yellow, green, red, blue, grey tints | 14.36 / 13.91 / 13.36 / 13.67 / 13.93 |
| `--text-2` on yellow, green, red, blue, grey tints | 6.58 / 6.38 / 6.13 / 6.27 / 6.39 |
| `--text-3` on yellow, green, red, blue, grey tints (captions inside banners) | 5.00 / 4.85 / 4.66 / 4.76 / 4.86 |
| Segmented control (6.4): selected text `--primary-ink` on `--primary-soft`; selected border `--primary` on the `--surface-sunken` track; track outline `--border-strong` on white | 5.14; 4.50; 3.63 |
| `--important-on-solid` on `--important-solid`; `--text` on `--important-solid` | 9.34; 10.44 |
| White on done-solid / urgent-solid / urgent-solid-hover | 5.34 / 5.60 / 7.35 |
| Status borders on white / own tint / bg: important | 3.73 / 3.39 / 3.46 |
| done | 4.31 / 3.79 / 4.00 |
| urgent | 4.80 / 4.05 / 4.45 |
| info | 3.81 / 3.30 / 3.54 |
| neutral | 3.61 / 3.18 / 3.35 |
| `--border-strong` on white / bg / sunken | 3.63 / 3.37 / 3.21 |
| Toast: white / `--sky` action on `--toast-bg` | 15.82 / 8.62 |

Known failures, handled by rule:
- **Yellow on white:** `--important-solid` on white is 1.51. Yellow is therefore used in two ways only: as a fill behind dark text (the solid badge, 9.34), and as the 4px row bar, which is decoration because the badge beside it always carries the icon and the word. A tint badge carries `--important-border` because its edge matters.
- **White on the sunken track:** 1.13. A white "thumb" cannot show which segment is selected, so the segmented control does not use one (6.4).
- **`--primary` as text on tints:** 4.26 on primary-soft, 4.50 on sunken. Blue text always uses `--primary-ink`; `--primary` is for fills and the focus ring (5.09 on white, 4.72 on bg).
- **Decorative colours:** `--border` (1.33) and `--sky` (1.83) never carry meaning alone. `--text-disabled` (2.65) is for disabled controls only; placeholders use `--text-3`.

Any future colour change must be re-run through the same script before it ships.

### 6.3 Typography

- Base 16px, line-height 1.5. Inputs are never below 16px (this stops iPhone zoom on focus).
- Page title 22/600. Section title 18/600. Big number 28/700 at line-height 1.2. Labels 14/500. Captions 12 in `--text-2`.
- Money, counts, dates and times use `font-variant-numeric: tabular-nums`; number columns align to the end (`text-align: end`).
- No uppercase labels below 12px, no light weights, no centred body text.

### 6.4 Components

**Navigation, laptop (1024px and wider).** Sidebar `--sidebar-w`, white, hairline on its inline-end edge. App name "Laser" at the top (18/600). Five items, 44px tall, icon + label: Home, Schedule, Clients, Leads, Progress. Active item: `--primary-soft` fill, `--primary-ink` text, 3px `--primary` bar on the inline-start edge, `aria-current="page"`. Pinned at the bottom: a one-line backup status ("Backed up 3 days ago") and Settings. The red count pill sits at the inline-end of the Home item.

**Navigation, phone and tablet (below 1024px).** Bottom tab bar, `--tabbar-h` plus `env(safe-area-inset-bottom)`, white with a top hairline. The same five items, each icon above a 12px label, at least 48px wide targets. Active `--primary-ink`, inactive `--text-2`. Red pill on the Home icon's corner.

**Top bar.** `--topbar-h`, white, bottom hairline. Inline-start: page title. Inline-end: on laptop the one primary button "+ New" (Settings is in the sidebar). Below 1024px a gear icon (Settings) sits at the inline-end, and the "+ New" button is replaced by the floating button.

**Floating "+" button (phones).** 56px circle, `--primary` fill, white plus icon, `--shadow-2`, fixed 16px from the inline-end edge and 16px above the tab bar: within thumb reach. It opens the New menu (7.9). Hidden while a sheet is open.

**Cards.** White, `--r-lg`, `--shadow-1`, 1px `--border`, padding 16px (20px on laptop). Card header: section title at the start, at most one ghost button or link at the end.

**Summary strip.** One card across the top of Home with up to four compact figures side by side (2 x 2 below 360px). Each figure is a link: a 12px label over an 18/600 number, with an optional 12px second line ("2 new"). No status colour.

**Number tiles (KPI).** A card with a 14px label, a 28px number, and an optional change chip. Grid: 2 columns on phones, up to 4 on laptops. The whole tile is a link to its filtered list. A tile that needs action gets the `--bar` (4px) solid yellow or red inline-start bar.

**List rows.** Minimum height `--row-h`; 12px vertical padding; hairline divider. The row itself is tappable and opens its detail or edit sheet. Two layouts:
- **Wide (640px and wider):** one line. From the start: `--bar` status bar (only when the row has a tone), main text (16/500) with a secondary line (14, `--text-2`), badge, amount (end-aligned, tabular), the row's button or buttons, overflow button (three dots, 44px).
- **Phone (below 640px): three lines**, because one line does not fit (a rebook row's badge, two buttons and overflow alone need about 400px of a 326px card **[V]**). Line 1: name and, at the end, the badge. Line 2: the secondary text (and the amount, at the end). Line 3: the buttons at full width, sharing the line equally (main, second if any), then the overflow button. A row with no button has two lines.
- Text the owner typed (name, note) truncates with an ellipsis on one line; badges never truncate, which is why their words are short (5.1).
- Row buttons use the **Secondary** style. The Primary style is kept for the one main action of a view or sheet.

**Tables (768px and wider).** Header row on `--surface-sunken`, 14/600; rows 52px; hairline dividers; no zebra stripes; numbers end-aligned; row hover `--bg`. **Below 768px every table becomes a list of cards**: name and badge on line 1, two or three facts on line 2, amount at the end. No horizontal scrolling anywhere.

**Badges.** Pill, `--badge-h`, 12/600, padding 0 8px, 14px icon before the word, at most about 16 characters. Two styles:
- **Tint** (the default, everywhere): tint fill, 1px status border, dark status text.
- **Solid** (yellow and red badges inside the Today and To do cards only): `--important-solid` fill with `--important-on-solid` text, or `--urgent-solid` fill with white text; no border. This is what makes "important" actually yellow and "urgent" actually red where the owner must act (R13).

**Change chips.** Like a tint badge without a border: blue tint with an up arrow, or grey tint with a down arrow. Never green and never red (5.2).

**Buttons.** Height 44px (48px for a phone's primary action), `--r-md`, 16/600, padding 0 16px.
- Primary: `--primary` fill, white text; hover `--primary-hover`; active `--primary-active`. One per view or sheet.
- Secondary: `--primary-soft` fill, `--primary-ink` text; hover `--primary-soft-hover`. Used for row buttons.
- Ghost: transparent, `--primary-ink` text; hover `--bg`.
- Danger: `--urgent-solid` fill, white text; only inside a confirmation. Elsewhere a destructive action is a ghost button with `--urgent-text`.
- Disabled: `--surface-sunken` fill, `--text-disabled` text.
- Focus (all interactive elements): 2px `--focus-ring` outline with 2px offset.

**Chips.** For picking one or several short options (hair colour, areas, date suggestions). Height 44px, `--r-pill`, 1px `--border-strong`, white fill, `--text`. Selected: `--primary-soft` fill, 1px `--primary` border, `--primary-ink` text, check icon. A date chip has two lines: "+4 wk" (14/600) and "Wed 16 Dec" (12, `--text-2`). Chips wrap; they never scroll sideways.

**Segmented control.** For 2 to 5 exclusive options (hair thickness, Summary / Contacts, Schedule segments, reminder timing). Track `--surface-sunken` with a 1px `--border-strong` outline, `--r-md`, 44px. Selected segment: `--primary-soft` fill, 1px `--primary` border, `--primary-ink` text at weight 600, the same look as a selected chip. Others: `--text-2`, weight 500. Full width on phones. (The first draft's white thumb on the sunken track was 1.13:1 and could not be seen.)

**Form fields.** Label above (14/500). Input 44px tall, 1px `--border-strong`, `--r-md`, 16px text, padding 0 12px. Helper text below in `--text-2` (14). Error state: `--urgent-border`, alert icon and one line of `--urgent-text` below ("Enter a name"). Required fields are marked with the word "required" in the label, not an asterisk alone. A collapsed "More" section is a ghost button with a chevron that reveals the optional fields. A money field has a live line under it showing the amount as understood ("= 1,150.00", 4.1). Fields for owner-typed text carry `dir="auto"`.

**Sheet / side panel** (create and edit forms). Laptop: `--panel-w` wide, slides in from the inline-end edge, full height, `--shadow-3`, scrim behind. Phone: full-height sheet. Header: title and a close button. Body scrolls. Sticky footer: Cancel (ghost) and Save (primary), above the safe-area inset. Opening moves focus to the first field; Esc and Back close.

**Modal** (confirmations and short decisions only). Max width `--modal-w`, `--r-xl`, `--shadow-3`, scrim; on phones a bottom sheet. Title, one or two sentences, two buttons.

**Toast.** `--toast-bg`, white text, action ("Undo", "Reopen") in `--sky`, `--r-md`. Bottom centre, above the tab bar and the floating button. One at a time, 6 seconds. Destructive actions are undoable instead of confirmed twice.

**"Sent?" strip.** Same place and colours as a toast, but it does not time out: "Sent to Dana? Yes / No, reopen". It appears when the owner comes back from a messaging app and stays until answered or until the next send replaces it (9.4). Its state lives in `laser.ui`, so it survives a discarded page.

**Banners.** Full content width above the page title. Tint fill, 1px status border, dark status text, icon, one sentence, one button. Kinds: urgent (save failed, tab out of date, backup 30 days), important (backup 7 days, device check), info (Example mode).

**Note box.** `--important-bg` fill, 1px `--important-border`, `--important-text`, "Note" icon and label, the client's special notes as text.

**Empty states.** A 48px line icon in a `--primary-soft` circle, one sentence, one primary button. No illustrations.

**Charts** (inline SVG with a `viewBox`; `charts.js`). Monthly bars: the current month `--primary`; earlier months `--sky` with a 1px `--info-border` stroke. Every bar has its value above it (12px, `--text-2`), a 4px top radius, the month below it, and one baseline hairline; no gridlines, no axis numbers. The best month carries a small "Best" badge (info tint, star icon) above its value. Each chart has a `<title>` and a visually hidden sentence ("Money received by month, last 12 months. Best month: July 2026, 5,400.").

**Icons.** One inline SVG set from `icons.js`, 20px, 1.75px stroke, `currentColor`, `aria-hidden` when next to a word. No emoji anywhere.

### 6.5 Breakpoints and touch

| Width | Layout |
|---|---|
| below 640px | One column, tab bar, floating +, cards instead of tables, three-line action rows (6.4) |
| 640 to 767px | Two-column card grids, tab bar, cards instead of tables |
| 768 to 1023px | Tables appear; tab bar stays |
| 1024px and wider | Sidebar, tables, content capped at `--content-max` and centred |

Touch targets are at least 44 x 44px (48px for tab items and primary phone actions), with at least 8px between neighbours. Only logical properties are used (`margin-inline`, `padding-block`, `border-inline-start`, `inset-inline-end`, `text-align: start / end`), so `dir="rtl"` on `<html>` mirrors the layout later (T6).

### 6.6 What to avoid

1. Saturated blue, pure yellow or pure red as large fills, or coloured text on white. Use tints with dark text. Solid yellow and red are for small things only: a badge in Today or To do, and the 4px bar.
2. Colour everywhere. Status colour should cover under about a tenth of any screen.
3. Radii, shadows or spacing that are not tokens.
4. Sideways scrolling, or tap targets under 44px.
5. Emoji as icons, centred paragraphs, money columns that do not line up, labels that exist only as placeholders.

---

## 7. Screens

Step numbers in brackets say when a part first appears. Until then the part is absent, or the tab shows the placeholder page (7.10).

### 7.1 Global chrome

Top to bottom on every screen: banners (5.4), top bar, the view, and on phones the tab bar and floating + button. Laptop adds the sidebar. The page title in the top bar is the view's name.

### 7.2 Home, titled "Dashboard" (R1)

**Purpose:** what to do now, and how the practice stands.

**Layout, top to bottom (phone order):**
1. **Date line:** "Wednesday 18 November".
2. **Summary strip** [1, grows] (6.4): the whole practice in one line, directly under the date, so the summary R1 asks for is on the first screen even on a phone. Four figures, each a link:
   - "Today" + the number of appointments today (to Schedule > Upcoming) [4];
   - "Received in November" + the amount (to Schedule > Done) [3];
   - "Active clients" + the count (to Clients) [2; in step 1 it reads "Clients"];
   - "Open leads" + the count, with a second line "2 new" (to Leads) [6].
3. **Welcome card** (until one of its buttons is tapped, 3.9), then the **Getting-started checklist** (until every item is ticked), then the "Check your backup" card when it applies (3.6). [1]
4. **Today** card [4]. Header: "Today" and the end-of-day line "2 of 5 done, 500 received today" [7]. One row per appointment today, by time: time, name, "Session 3", a note icon if the client has special notes. The row's main button follows the day: **Send** while a reminder for it is ready or late [8]; otherwise **Finish**; after finishing, a green "Done, paid 250" badge replaces the button. Overflow: No-show, Cancel, Reschedule. Empty: "No appointments today." with "Book appointment".
5. **To do** card [4, grows in 5, 6, 8]. Header: "To do (4)". Rows as defined in 5.3: at most one row for all reminders, then earlier appointments with no outcome, rebook rows, lead rows. Five rows on a phone, eight on a laptop, then "Show all (14)". Empty: green check and "All caught up".
6. **Money** card [7]. "Received this month": the amount (28px) and a change chip "12% vs the same days last month" (or the two amounts early in the month, 4.9 rule 14). When any client's balance is above 0: a second line "Owed to you: 370 from 3 clients", linking to Clients filtered by Owes. (From step 3 the month's amount is already in the summary strip.)
7. **Numbers** row [2, grows]: two tiles, each a link: "New clients this month" (to Clients) [2]; "Treatments this month" (to Schedule > Done) [3].
8. **Next 7 days** card [4]: tomorrow to seven days ahead, grouped by day, each row time and name. Link "Full schedule". Empty: "Nothing booked in the next 7 days."
9. **Backup line** [1]: "Last backup: 3 days ago" and the button "Back up now".

**Laptop (1024px and wider):** the summary strip spans the full width; below it two columns. Left (wider): Today, To do, Next 7 days. Right: Money, Numbers, Getting started, Backup line.

**Actions:** Finish, Send, Send reminders, Book, Message, Ask again, Contacted, No-show, Cancel, Reschedule, Back up now; every figure, tile and row opens its list or record.

**In step 1** Home shows items 1, 3 and 9 and the summary strip with one figure, "Clients 12".

### 7.3 Schedule (R2, R3, R9, R10)

A segmented control with three segments. The route remembers the segment.

**Upcoming** [4]. An agenda grouped by day; no calendar grid.
- Top group, only when it has rows: "Needs an outcome" (red): Booked appointments from earlier days.
- Then "Today, Wed 18 Nov", "Tomorrow, Thu 19 Nov", then one header per later day that has appointments.
- Row: time, name, areas if any, one badge (5.4), one button (**Finish** when the date is today or earlier; **Send** when a reminder is ready or late [8]), overflow: Reschedule, Cancel, No-show, Edit, Delete, and "Not sent, reopen" when a reminder was marked sent or skipped [8]. Under the name, in grey, the reminder line [8]: "Reminder on Mon 16 Nov" while it is planned, a tick and "Reminded Mon 16 Nov" once sent, "Reminder skipped" if skipped. The badge of a reminded appointment stays blue "Booked".
- Cancel and No-show act at once and show a toast with Undo and "Book again".
- Empty: "Nothing booked yet." with "Book appointment".

**Ask to rebook** [5] (R2). Groups, in this order, each with a count; a group with no rows is not shown:
1. "Overdue" (red rows): the due date has passed and the client has not been asked.
2. "Due soon" (yellow rows).
3. "Asked, no answer" (yellow rows): asked more than `askAgainDays` ago, nothing booked.
4. "Asked, waiting for an answer" (blue rows).
5. "Not booked yet" (grey, collapsed by default): active clients with no session and nothing booked.
6. "Not seen for a while" (grey, collapsed): clients more than two intervals past their due date (`lapsed`). The group header has one button, **Pause all**, which pauses every client in the group in one save (with Undo).
7. "Snoozed" (grey, collapsed).
- Row: name; second line "Last session Wed 21 Oct, 4 weeks ago, every 4 weeks", and for an asked client a tick and "Asked Tue 10 Nov"; badge; buttons **Book** and **Message** ("Ask again" in group 3; after a second unanswered ask the main button is **Pause client**); overflow: Mark as asked, Not sent, reopen (when asked), Snooze 1 week, Pause client, Course finished, Open client.
- Empty (groups 1 to 3 empty): green check, "Nobody is waiting to be rebooked."

**Done** [3] (R3). Past treatments and what was paid.
- Month switcher: previous, "November 2026", next. Summary line: "18 treatments, 4,250 received".
- Rows, newest first: date, client, areas, amount ("Paid 250" green badge, or grey "0"). Stand-alone payments dated in the month are listed too ("Payment received, Dana Levi, 120") so the rows add up to the summary.
- Laptop: a table with columns Date, Client, Areas, Paid.
- Button: "Add past treatment" (pick the client first).
- Empty: "No treatments in November 2026."

**Phone:** segments full width; rows use the three-line layout (6.4); the month switcher stays on one line.

### 7.4 Clients (R4, R6, R8)

**Layout:**
1. Search field ("Search name, phone or email") [1].
2. Segmented control **Summary | Contacts** [2; step 1 shows Contacts only].
3. Filter chips: All, Active, Paused, Finished [2]; "Owes" appears when any balance is above 0 [3].
4. The list, sorted by name. Sort menu on laptop: Name, Last visit, Total paid, Client since [3]. The choice is kept in the address (`?sort=`), like the filter.

**Summary** (R4): Name (plus a status badge when not Active, plus "Owes" or "Credit" badge) | Sessions | Total paid | Last visit | Next visit [4]. Sessions and Total paid include the client's "before this app" numbers (4.3). In step 2, before money exists, Summary shows Name | Hair | Client since.

**Contacts** (R8): Name | Phone | Email | four icon buttons: Call, WhatsApp, Email, Copy number. Tapping the phone number calls; tapping the email opens a new mail. A button whose data is missing is disabled and grey. (This row is one of the two exceptions to "one primary button per row", principle 3: its four icons are the point of the list.)

**Actions:** "New client" (top bar or floating +); tap a row to open the client page [2] (in step 1, tap opens the edit form). Every row has an overflow menu: Edit, Delete client [1]. Delete acts at once for a client with no history and shows a toast with Undo; with history it asks first (4.8 rule 7).

**Empty:** "No clients yet." with "Add your first client". **No search result:** "No client matches 'xyz'." with "Clear search".

**Phone:** each row is a card: name and badge on line 1; "6 sessions, last Wed 21 Oct" on line 2; total paid at the end. Contacts cards show phone and email with the four icon buttons below.

### 7.5 Client page [2]

**Layout:**
1. Back link, name (22/600), status badge.
2. Contact buttons: Call, WhatsApp, SMS, Email (disabled when the data is missing).
3. Four tiles: Sessions done | Total paid | Last visit | Next visit [3; next visit from 4]. When the client has "before this app" numbers, a caption under the tiles says so: "Includes 6 sessions and 1,500 from before this app." Below them, when the balance is not 0: "Owes 120" with the button "Record payment", or "Credit 1,250 (about 5 sessions)" (the credit divided by the usual price, shown when a usual price is set).
4. One primary button: "Book appointment" [4] ("Add treatment" in step 3).
5. Rebook line [5]: the client's rebook badge and "every 4 weeks".
6. Note box (yellow) when special notes exist.
7. Profile card: hair colour, hair thickness, treated areas, skin type (only when set), client since ("Earlier" when no date was given). "Edit" button.
8. Timeline, newest first [3]: each appointment (date, time, status badge, areas, amount paid) and each stand-alone payment. Tapping a row opens it for editing.
9. Overflow menu: Edit, Add past treatment [3], Record payment [3], Pause / Make active again, Course finished, Delete client.

**Empty timeline:** "No treatments yet." with the primary button.

**Phone:** one column in this order; tiles 2 x 2.

### 7.6 Leads [6] (R5)

**Layout:**
1. Search field.
2. Filter chips: Open (default), Not interested, All. "All" also lists leads who became clients, with a green "Became client" badge.
3. List sorted by tone (red, yellow, then the rest), then by follow-up date.

**Row:** name; second line "Interested in: legs" and the phone; badge (5.2); follow-up date; one button: **Contacted** for a new lead, **Message** otherwise; overflow: Followed up, Convert to client, Not interested, Call, Edit, Delete.

**Actions:**
- **Contacted** opens a small sheet (`?sheet=followUp`): "Follow up again?" with chips In 3 days, In 1 week, In 2 weeks, Pick date, No follow-up. Saving sets `leadStatus: contacted` and `followUpOn`.
- **Message** opens the Send sheet with the lead text (9.4). Tapping a channel saves, in the same synchronous write as the mark, `leadStatus: contacted` and `followUpOn: null`, so a follow-up row is closed by its own button. Back in the app the "Follow up again?" sheet is shown, so the owner can set the next date or choose No follow-up. For a lead this sheet takes the place of the "Sent?" strip: its last choice is "The message was not sent", which puts the lead back exactly as it was (9.4).
- **Followed up** (overflow) opens the same "Follow up again?" sheet without sending anything, for a follow-up done by phone or in person.
- **Convert to client:** one save sets `clientSince` to today and status Active, clears the follow-up, and opens the Book sheet for that person. Toast: "Dana is now a client. Undo".
- **Not interested** closes the lead (Undo in the toast).

**Empty:** "No leads yet. When someone asks about laser, add them here so you remember to follow up." with "Add lead".

**Phone:** cards; the one button sits at the end of line 2.

### 7.7 Progress [7] (R7)

**Layout:**
1. Title line: "November 2026 so far".
2. Three tiles, each with a change chip (4.9 rule 14): **People treated**, **New clients**, **Money received**. Under the first: "22 treatments". The chip is blue with an up arrow or grey with a down arrow; before the 8th of the month, or with fewer than 3 payments on either side, it shows the two amounts instead of a percent.
3. Invest line. When `investPercent` is 0: a quiet link "Add an invest goal". When set: "Set aside 20% to invest: 850 this month, 6,300 this year" with an edit icon. Tapping opens a small sheet (`?sheet=invest`) with one number field (percent). Rounding: 4.9.
4. Motivation line, only when true: "Best month so far: July 2026, 5,400." and "3 months in a row above the month before."
5. Chart: money received, last 12 months (6.4).
6. Table, newest month first, 12 rows, "Show earlier months" below: Month | Treatments | People treated | New clients | Money received | Money vs month before. The last column is the jump in revenue R7 asks for: full month against full month (4.9 rule 15), as a blue or grey chip. The current month's row is labelled "so far" and its chip follows rule 14. New clients shows a dash for months before the app was in use (rule 13).

**Empty:** "Your progress appears here after your first treatment."

**Phone:** tiles in one row of three compact tiles (or 2 + 1 below 360px); the table becomes one card per month with the four figures on two lines and the chip beside the month's name.

### 7.8 Settings (gear icon)

One scrolling page with section headers; each control saves at once and shows a short "Saved" toast.

1. **Money** [1]: Currency (searchable list of common currencies plus "Other code", checked against the browser's own list, 4.6); Usual price of a session [3]; Track what clients owe (switch) [3].
2. **Messages**: Country code for phone numbers [1] (with the example "054 123 4567 becomes +972 541234567"); WhatsApp on a computer opens (segmented: In the browser / WhatsApp app / WhatsApp Web; shown only when the app runs on a computer, 9.4) [1]; Dates in messages are written in (a short list, 9.3) [5]; Message texts (9.3): the Rebook editor [5], the Lead editor [6], the Before and Same-day editors [8]; Remind clients (segmented: Off, 1, 2, 3, 7 days before) [8]; Same-day reminder (segmented: Off, 1 h, 2 h, 3 h before) [8]; "Add a daily alarm to my calendar" [8].
3. **Scheduling** [4]: Weeks between sessions.
4. **Backup** [1]: "Back up now"; "Load a backup" (a file; pasted text from step 1b); "Check a backup file" (3.6); status ("Last backup 3 days ago, 14 changes since"); storage meter ("Using 0.4 of about 5 MB"); "Undo the last import" (step 1 only; replaced by Earlier copies); "Erase this device". Added in step 1b: "Share backup" (when sharing is available); "Copy backup as text" with its "I saved it" tick; the "Earlier copies" list with Restore.
5. **This device** [1]: where this copy runs; version line "Laser 0.1.0, step 1, data format 1"; "How this app works" (the three Welcome texts). Added in step 1b: the device check lines and "Check again" (3.9); Home device (This computer / My phone); "Works offline: yes / no"; "New version ready: Reload" when there is one.
6. **Colours** [1]: a key showing the five badges with one line each ("Red: late, act now"; "Yellow: important today or this week"; "Green: finished, nothing more to do"; "Blue: planned or waiting"; "Grey: inactive or closed"). Yellow and red are shown in both styles, tint and solid.
7. **Example mode** [1b]: "See the app with example data" / "Back to my data" (3.10).
8. **Advanced** (collapsed) [from 3]: the fields listed in 4.6, each from the step given there.

**Phone:** the same page; segmented controls go full width.

### 7.9 Sheets

**New menu** (`?sheet=new`): three large buttons: Appointment [4], Client [1], Lead [6]. While only one exists, + opens that form directly.

**Client form** (`?sheet=client`). Title "New client" or "Edit client".
1. Full name: text, required, focused on open. [1]
2. Phone: `type="tel"`. Below it, once typed, a `data-partial` line: "WhatsApp will use +972 541234567", or in grey "Add your country code in Settings to message by WhatsApp". This line is the owner's check that the number was understood (9.4). [1]
3. Email: `type="email"`; checked with the rule of 4.3. [1]
4. Hair colour: six chips, one choice, tap again to clear. [2]
5. Hair thickness: segmented Fine / Medium / Coarse. [2]
6. Special notes: textarea, 3 rows, grows. Caption: "Stored on this device and in your backup files as plain text." [2]
7. Client since [1]: chips "Today" (the default for a new client) and "Earlier (already my client)". "Earlier" reveals an optional date field: "Since when? Leave empty if you do not remember." Caption: "Choose Earlier for clients you already had, so they are not counted as new this month." With "Earlier" and no date, the stored date is the day before the app was first used (4.3), and the client page shows "Earlier". **When editing**, the chips show what is stored: "Today" only when the stored date is today; otherwise "Earlier", with the stored date in the field (empty when none was given). The date is never required and cannot be in the future. It is in the step 1 form, as its last field, because it is what makes clients typed in step 1 count correctly from step 2 on.
8. More (collapsed) [2]: Treated areas (multi-choice chips); Skin type (six chips, caption "Optional"); Status (segmented; edit only). Added in step 3, shown when "Earlier" is chosen, under the heading "Before this app": Sessions already done (number) and Already paid in total (money), with the caption "So this client's totals are right without typing every past treatment." Added in step 4: Weeks between sessions (number; placeholder "4, your usual").
Footer: Cancel, Save. On a new client also "Save and add another", which reopens the form keeping the "Client since" choice. When editing, the form body ends with "Delete client" (a ghost button in `--urgent-text`) [1].

The main fields come first, More is closed, and the footer with Save stays in view while the form scrolls (principle 4).

**Lead form** (`?sheet=lead`) [6]. Name (required); Phone; Interested in (text, placeholder "for example legs, underarms"); Note (2 rows, stored in `notes`); Follow up (chips: None, Tomorrow, In 3 days, Next week, Pick date). Edit mode adds Status (New / Contacted / Not interested).

**Add treatment** (`?sheet=treatment`) [3]. Title "Add treatment for Dana". Date (chips Today, Yesterday, Pick date; default today); Time (optional); Amount paid (prefill rule below); More: Areas (prefilled from the client), Price ("only if different from the amount paid"), Note. Saving creates a Done appointment and, when the amount is above 0, its linked payment. "Save and add another" for entering history. If the date is before the client's "client since", that date moves back to match.

**Book** (`?sheet=book`) [4].
1. Client: search field with results; first result line is "New client" (inline: name and phone, saved together with the booking). From step 6, open leads are listed too, marked "Lead"; booking one makes them a client in the same save. Hidden when opened from a client.
2. Date: chips Today, Tomorrow, then the week chips of 9.5 ("+4 wk" over "Wed 16 Dec"): the client's own interval first, marked "usual", then the quick date buttons that differ from it. Then Pick date.
3. Time: `type="time"`, prefilled with the client's most recent appointment time; required.
4. Clash line, when it applies (9.5): "Heads up: Maya Cohen is booked at 14:00 that day." It never blocks.
5. More: Areas, Price, Note. (With "Track what clients owe" on, Price is on the main form, 4.8 rule 12.)
Footer: Cancel, Book. In edit mode the title is "Reschedule" and the chips are +1 day, +1 week, Pick date.

**Finish** (`?sheet=finish`) [4; part 3 from step 5]. Title "Finish session 3, Dana Levi, Wed 18 Nov 14:00".
1. Note box, when the client has special notes.
2. **Amount paid:** decimal field, prefilled by the rule below, with a caption saying where the number came from ("Your usual price", "Same as last time", "Price set at booking") and the live "= 250.00" line. When tracking is on, a Price field sits above it and Amount paid follows it. A previous balance is never added or used silently: the sheet shows "Owes 120 from before" with the button "Add to today", or "Has 1,250 credit" with the button "Use credit" (which lowers Amount paid by the credit, down to 0).
3. **Next session** [5]: the week chips of 9.5 with the resulting dates (the client's own interval first, marked "usual"), then Pick date, Not now and Course finished. Time defaults to this session's time ("at 14:00", editable). Clash line as in Book. A choice is required; nothing is preselected, so a booking is never made by accident. "Course finished" sets the client's status to Course finished in the same save, so a client who has completed the course does not come back as "due" four weeks later.
4. More: Areas, Price (when tracking is off), Note.
Footer: Cancel, Save. One save marks the appointment Done, writes the payment, and creates the next appointment (or closes the course). Toast: "Done. Paid 250. Next: Wed 16 Dec 14:00. Undo".

**Prefill rules** (Add treatment and Finish). The aim: three taps for the usual case, and never a prefilled amount that was not paid.

*Amount paid, with "Track what clients owe" off.* First that applies:
1. A price was typed on this appointment at booking: that price ("Price set at booking").
2. The client has no Done session yet: `usualPriceMinor` if set ("Your usual price"); otherwise empty.
3. The client has Done sessions. Let `last` be the amount received at the most recent one and `before` the amount at the one before it, if any. If `last` is above 0 and equals `usualPriceMinor` or equals `before`: `last` ("Same as last time"). Otherwise the field is **empty**, with the caption "Last time: 1,500" (or "Last time: 0").

When the field starts empty, a value is required before Save (0 is allowed), and one-tap chips sit under it, each shown once, in this order: "0 today"; "250 usual" (when a usual price is set); "1,500 last time" (when `last` is above 0 and differs from the usual price). A package client's later sessions are therefore one tap ("0 today"), and the 1,500 of session 1 is never offered as a prefill (4.10 example 2).

*With tracking on.* Price, first that exists: the price typed at booking; the client's most recent non-null `priceMinor`; `usualPriceMinor`; otherwise empty. Amount paid starts equal to Price and follows it until the owner edits it; credit and old debt are offered by their buttons, never applied silently.

**Record payment** (`?sheet=payment`) [3]. Amount (prefilled with what the client owes, when the balance is above 0); Date (today); "This is a refund" (checkbox); Note. Shows "Balance now: owes 120. After this: 0."

**Send** (`?sheet=send`) [5]. Described in 9.4.

**Confirmations** (modal): delete a client who has history; load a backup; restore an earlier copy; erase this device; change currency label.

### 7.10 Placeholder pages

An unbuilt tab is visible from step 1 and opens a page with the empty-state layout: an icon, the title, one sentence about what it will do, and "Arrives in step N". Texts:
- Schedule (until step 3): "Your appointments, past treatments and the 4-week rebooking list. Arrives in step 3."
- Leads (until step 6): "People who asked about laser and are not clients yet. Arrives in step 6."
- Progress (until step 7): "Your months side by side: people treated, new clients, money received. Arrives in step 7."
Inside Schedule, the Upcoming segment says "Arrives in step 4" and Ask to rebook says "Arrives in step 5" until they are built.

---

## 8. Core flows with tap counts

Counts exclude typing and the send tap inside another app. They are counted on a phone, where a send link opens the messaging app directly; the paragraph under the table gives the difference on a laptop.

| # | Flow | Steps | Taps |
|---|---|---|---|
| 1 | **Finish a session, take payment, book the next one** | Home > Today row **Finish** (1); amount is prefilled; tap "+4 wk, Wed 16 Dec" (2); **Save** (3). When the amount is not prefilled (a package client, 7.9), one more tap on a chip such as "0 today". | 3 (4 for a package session) |
| 2 | **Send today's reminders** | Home, To-do row **Send reminders** (1); **WhatsApp** (2); press send in WhatsApp; return to the app, the next reminder is already showing, with "Previous: Dana. Did not send? Reopen" above it; **WhatsApp** again. | 1 + 1 per client |
| 3 | **Send one reminder** | Today row (or Schedule row) **Send** (1); **WhatsApp** (2). | 2 |
| 4 | **Add a client** | **+** (1); **Client** (2); type name and phone; **Save** (3). | 3 |
| 5 | **Book an existing client** | From the client page: **Book appointment** (1); date chip (2); **Book** (3). From anywhere: **+** (1); **Appointment** (2); type two letters and tap the client (3); date chip (4); **Book** (5). | 3 or 5 |
| 6 | **Ask a client to rebook** | Schedule > Ask to rebook (or Home's To do), row **Message** (1); **WhatsApp** (2). The row moves to "Asked, waiting for an answer" (blue). | 2 |
| 7 | **Add a lead** | **+** (1); **Lead** (2); type; **Save** (3). | 3 |
| 8 | **Turn a lead into a client and book** | Lead row overflow (1); **Convert to client** (2); the Book sheet opens: date chip (3); **Book** (4). | 4 |
| 9 | **Find a phone number and call** | **Clients** (1); **Contacts** (2); type part of the name; tap the number (3). | 3 |
| 10 | **Enter an old treatment** | Client page overflow (1); **Add past treatment** (2); **Pick date** and choose (3); type amount; **Save** (4). | 4 |
| 11 | **Settle a debt** | Client page **Record payment** (1); amount is prefilled with what is owed; **Save** (2). | 2 |
| 12 | **Back up** | Home **Back up now** (1). On iPhone: choose "Save to Files" (2). In Chrome on a computer: confirm the folder (2). The very first time, also "Check your backup": choose the saved file (3.6). | 1 or 2 |
| 13 | **Cancel or mark a no-show** | Row overflow on Home (Today or To do) or in Schedule (1); **Cancel** or **No-show** (2). | 2 |
| 14 | **Follow up a lead** | Home To-do row **Message** (1); **WhatsApp** (2); back in the app, "Follow up again?": **No follow-up** or a date chip (3). The row leaves To do. | 3 |
| 15 | **Take back a mark** (the message was not sent after all) | **No, reopen** on the "Sent to Dana?" strip (1). Later: row overflow (1); **Not sent, reopen** (2). | 1 or 2 |

**On a laptop, sending costs more, and the app says so.** The counts above assume a phone. On a computer, "WhatsApp on a computer opens" (Settings > Messages, 9.4) decides what a tap does:
- **In the browser** (the default): a new tab opens at WhatsApp's own page and needs two or three more clicks (continue, open the app or WhatsApp Web, send), and it leaves one tab behind per message. About 4 to 5 clicks per message **[U]** (known behaviour; it could not be tested here).
- **WhatsApp app:** the desktop app opens on the right chat with the text ready. 2 clicks plus send, and no tab.
- **WhatsApp Web:** one tab with the chat and the text ready.

With two reminders per appointment this difference is felt every day. That is why step 1 has the owner try the links on their own number and set this choice, and why step 1b asks where the client list should live (D20).

---

## 9. Reminders (R2, R9, R10)

### 9.1 The honest limit

The app has no server, so **nothing can happen while it is closed, and it can never press Send by itself.** What "automatic" means here:

| The app does by itself | The owner does |
|---|---|
| Works out, every time it is opened or looked at, which reminders are due, late or done | Opens the app (a daily phone alarm helps, 9.8) |
| Prepares each message with the client's name, date and time | Taps Send and picks WhatsApp, SMS, Email or Copy |
| Opens the messaging app with the number and text filled in | Presses send inside that app |
| Notes "Reminded" under the appointment, and on return asks "Sent to Dana? Yes / No, reopen" | Answers, or ignores it (the note stays) |

The app cannot know whether a message was delivered or read, and says so. Buttons and labels say "Ready to send" and "Reminded"; the words "sent automatically" appear nowhere. A "Reminded" or "Asked" note can always be taken back with "Not sent, reopen" (9.4). Truly unattended sending is a later, optional upgrade (9.9).

### 9.2 Client reminders before an appointment (R9)

Every **Booked** appointment has two reminder slots. Their state is calculated, never stored; only the owner's action (sent or skipped) is stored on the appointment (4.4).

Let `D` and `T` be the appointment's date and time, `N = reminderDaysBefore`, `H = sameDayHoursBefore`.

**Days-before slot.** `sendDay = D - N days`. First match wins:

| # | Condition | State | Shown as |
|---|---|---|---|
| 1 | `N` is 0 | off | nothing |
| 2 | `reminderBefore` exists and matches `D` and `T` | sent / skipped | no badge; grey tick line "Reminded Mon 16 Nov" / grey line "Reminder skipped" |
| 3 | `scheduledOn` is on or after `sendDay` (the client was given this date inside the window) | not needed | nothing |
| 4 | today is before `sendDay` | waiting | grey text "Reminder on Mon 16 Nov" |
| 5 | today is `sendDay` | **ready** | yellow "Reminder ready" |
| 6 | today is after `sendDay` and before `D` | **late** | red "Reminder late" |
| 7 | today is `D` or later | expired | nothing (the same-day slot takes over) |

Rule 3 is what prevents the "every last-minute booking is instantly red" bug: `scheduledOn` is reset whenever the date or time changes.

**Same-day slot** ("at the meeting time", made practical). The owner chooses how long before the appointment the client should have the message: `H` hours. `H` sets the "send by" time shown to the owner (`T` minus `H`); the slot turns red only in the last 60 minutes.

Two definitions first:
- An appointment is **early** when `T` is before `dailyAlarmTime` + `H` hours + 30 minutes (with the defaults: before 11:00). Such an appointment cannot be reminded "this morning" in good time, so its reminder is offered the evening before. Because "early" is derived from the alarm time and `H`, the settings cannot contradict each other (the first draft's separate defaults made a 10:15 appointment red before the alarm rang).
- **The window opens** at 00:00 on `D`; for an early appointment, at `eveningFrom` (default 18:00) on the day before `D`, with the label "Send this evening for tomorrow 09:00".

First match wins:

| # | Condition | State | Shown as |
|---|---|---|---|
| 1 | `H` is 0 | off | nothing |
| 2 | `reminderSameDay` exists and matches `D` and `T` | sent / skipped | no badge; grey tick line "Reminded today" / grey line "Reminder skipped" |
| 3 | `scheduledOn` is `D`, or the appointment is early and `scheduledOn` is the day before `D` (the client was given this time within the last day) | not needed | nothing |
| 4 | `N` is 1 and the appointment is early (the client already gets the day-before message that same evening) | not needed | nothing |
| 5 | now is before the window opens | waiting | nothing |
| 6 | the window is open and more than 60 minutes remain before `T` | **ready** | yellow "Reminder ready", second line "send by 12:00" |
| 7 | 60 minutes or less remain before `T` | **late** | red "Reminder late" |
| 8 | now is at or after `T` | expired | nothing |

Worked cases with the defaults (alarm 08:30, `H` = 2, `N` = 2, evening 18:00), all in the step 8 tests:

| Appointment | Early? | Yellow | Red | Note |
|---|---|---|---|---|
| 14:00 | no | 00:00 to 13:00, "send by 12:00" | 13:00 to 14:00 | the 08:30 alarm leaves hours to send |
| 11:00 | no | 00:00 to 10:00, "send by 09:00" | 10:00 to 11:00 | 90 minutes after the alarm |
| 10:15 | yes | from 18:00 the evening before to 09:15 | 09:15 to 10:15 | still yellow when the alarm rings |
| 09:00 | yes | from 18:00 the evening before to 08:00 | 08:00 to 09:00 | sent the evening before; the optional evening alarm prompts it (9.8) |
| 09:00 with `N` = 1 | yes | never | never | the day-before reminder covers it |

Other rules:
- Rescheduling reopens both slots automatically, because the stored record no longer matches the date and time.
- Cancelled, No-show and Done appointments have no reminders.
- An expired reminder is dropped silently; the app never nags about a reminder that can no longer help.
- An Upcoming row shows one badge: the most urgent of the appointment state and the two slots. A sent reminder adds its grey tick line and leaves the badge blue (5.1).

### 9.3 Message texts and placeholders

Four editable texts in Settings > Messages. **Each editor arrives in the same step as the first message that uses its text**, so the owner is never sending a text they cannot change: the Rebook editor in step 5, the Lead editor in step 6, the Before and Same-day editors in step 8.

- From step 5 an editor has: the text area (`dir="auto"`), a warning for anything in braces that is not a known placeholder ("{nmae} is not a placeholder"), and "Reset to the original text".
- Step 8 adds to all four: "Insert" chips for the placeholders and a live preview using a sample client.
- Above the editors, from step 5: **"Dates in messages are written in"** (`settings.messageLocale`): English (the default), "My device's language", Hebrew, Arabic, Russian, French, Spanish, German. A date inside a message is written in this language, not in the device's, so an English text never gets a Hebrew date in the middle and a Hebrew text never gets "Wednesday 16 December" **[V]** (the mix was reproduced with `Intl`).

| Placeholder | Becomes | Available in |
|---|---|---|
| `{name}` | the first word of the client's name | all |
| `{date}` | the appointment date in words, in the language of `messageLocale`: "Thursday 3 December" | before, same day |
| `{time}` | the appointment time as 24-hour "14:00" | before, same day |
| `{weeks}` | whole weeks since the client's last session (at least 1) | rebook |

Default texts (the owner can rewrite them in any language; question Q6 is asked before step 5):

- **Before** (`templates.before`): "Hi {name}, a reminder of your laser session on {date} at {time}. Please shave the area the day before, avoid sun and self-tan, and come with clean skin (no lotion or deodorant on the area). If you have started any new medication, tell me before we begin. Reply to confirm, or let me know if you need another time."
- **Same day** (`templates.sameDay`): "Hi {name}, see you today at {time}. Shaved, clean skin please."
- **Rebook** (`templates.rebook`): "Hi {name}, it has been {weeks} weeks since your last session, which is the ideal time for the next one. Which day suits you?"
- **Lead** (`templates.lead`): "Hi {name}, thank you for your interest in laser hair removal. Would you like to book a first session? I am happy to answer any questions."

Messages never contain health details. The preparation advice in the first text is general; the owner should edit it to match their own device and instructions.

### 9.4 The Send sheet, links and phone numbers

**Send sheet** (`?sheet=send&kind=before|sameDay|rebook|lead&id=...`), top to bottom:
1. Title: "Reminder for Dana Levi, Thu 3 Dec 14:00" (or "Ask Dana to rebook", "Message to Dana").
2. One grey line: "The app prepares the message. You press send in the other app. It cannot see whether the message arrived."
3. "To: +972 541234567". If the number cannot be made international: "This number needs a country code. Add it in Settings." If there is no phone: "No phone number" with the button "Add phone".
4. The message in a text area (`dir="auto"`), filled from the template. Edits apply to this send only; the text itself is changed in Settings > Messages.
5. Buttons: **WhatsApp** (primary), **SMS**, **Email** (when the client has an email), **Copy**. For reminders also **Skip**.

**Tapping a channel does two things in this order:** it saves the mark with a synchronous write, and only then lets the link open. The mark is: slot `sent` for a reminder; `rebookAskedOn` and `rebookAsks` for a rebook; `leadStatus: contacted` and `followUpOn: null` for a lead (7.6). In the same step it writes `sent: { kind, id, name, at }` to `laser.ui` (for a lead also `prev: { leadStatus, followUpOn }`, the two values it is about to change). The phone may discard the page while WhatsApp is in front; both are already on disk.

**Taking a mark back.** The mark is written before anything has been sent, and things go wrong in the other app (the number is not on WhatsApp, the owner backs out, the wrong chat opens). An in-memory Undo toast is gone as soon as the page is discarded, which is exactly the case the early save exists for. So there are two ways back that need no memory:
1. **On return** (`visibilitychange` to visible, or the next load), while `laser.ui.sent` exists, the "Sent?" strip (6.4) shows: "Sent to Dana? **Yes** / **No, reopen**". It does not time out. Yes removes the strip. "No, reopen" removes the mark, and the item is ready again. A new send replaces the strip; in the run (9.7) it is shown above the next reminder as "Previous: Dana. Did not send? Reopen".
2. **At any later time**, every row that shows "Reminded", "Reminder skipped" or "Asked" has the overflow item **Not sent, reopen**. For a reminder it clears that slot. For a rebook it sets `rebookAskedOn` to null and lowers `rebookAsks` by 1.

For a **lead** the question on return is part of the "Follow up again?" sheet (7.6) instead of the strip: its last choice, "The message was not sent", restores `leadStatus` and `followUpOn` from `laser.ui.sent.prev`. Later, a lead is corrected by editing it (status and follow-up date are fields of the lead form).

**Links** (built only in `links.js`; `enc` = `encodeURIComponent`). Before encoding, the text is passed through `toWellFormed()` where it exists; if encoding still throws (half of an emoji left by a length limit), the button shows "Could not prepare the link. Use Copy." For email, line breaks are normalised to `\r\n` before encoding.

| Channel | Link | Notes |
|---|---|---|
| WhatsApp, on a phone or tablet | `https://wa.me/<international digits>?text=<enc(text)>` | Opened with `target="_blank" rel="noopener noreferrer"`. Needs an international number. |
| WhatsApp, on a computer | by `settings.whatsappOnComputer`: `browser`: the `wa.me` link above. `app`: `whatsapp://send?phone=<digits>&text=<enc(text)>` (opens WhatsApp Desktop, no tab). `web`: `https://web.whatsapp.com/send?phone=<digits>&text=<enc(text)>` | `util.platform()` tells a computer from a phone or tablet. The owner sets the choice after trying the link in step 1 **[U]**. |
| SMS | `sms:+<international digits>?&body=<enc(text)>` on every platform; with the typed digits when no international form exists | The `?&body=` form is the one commonly reported to work on both iPhone and Android **[U]**; it is confirmed on the owner's own devices in the step 1b link check. Copy is always offered as the safe fallback. |
| Email | `mailto:` + `enc(local part)` + `@` + `enc(domain)` + `?subject=<enc(subject)>&body=<enc(text)>` | The `@` must stay literal: `enc` of the whole address turns it into `%40`, and a strict mail app then sees no address **[V]**. Subjects: "Your appointment", "Your next session", "Laser hair removal". |
| Call | `tel:+<international digits>`, or the typed digits when no international form exists | |
| Copy | `ui/files.js`: `navigator.clipboard.writeText`, falling back to a hidden text area and `document.execCommand('copy')` | Works on `file://` **[V]**. It lives in UI, not in `links.js`, because it touches the page (2.2). |

No link is built while Example mode is on (3.10).

**Phone normalisation** (`phone.toInternational(raw, countryCode)`), returns digits or null:
1. Note whether the trimmed text starts with `+`. Keep only the digits.
2. If it started with `+`: the digits are already international.
3. Else if the digits start with `00`: drop the `00`.
4. Else if no country code is set: null.
5. Else if the digits start with `0`: country code + the digits without that one leading 0.
6. Else if the digits start with the country code and are at least 8 digits longer than it: keep as they are.
7. Else: country code + the digits.
8. Valid only if the result has 8 to 15 digits **and**, when it came from rule 5, 6 or 7, at least 7 digits follow the country code; otherwise null.

**This table is the unit test** (all rows were run against the rules as written above):

| Typed | Country code | Result |
|---|---|---|
| `054-123 4567` | 972 | `972541234567` |
| `+972 54 123 4567` | 972 | `972541234567` |
| `00972541234567` | 972 | `972541234567` |
| `972541234567` | 972 | `972541234567` |
| `541234567` | 972 | `972541234567` |
| `+44 7700 900123` | 972 | `447700900123` (left alone) |
| `1234567` | 972 | `9721234567` (7 digits after the code: the shortest that is accepted) |
| `12345` | 972 | null (too short) |
| `054-1234` | 972 | null (6 digits after the code) |
| `(415) 555-0123` | 1 | `14155550123` |
| `1 415 555 0123` | 1 | `14155550123` |
| `054-123 4567` | none | null: WhatsApp is disabled with the hint to set the country code |

(972 and 1 are used here only as illustrations.)

**Known limit.** Rule 5 assumes that a leading 0 is dropped when the country code is added. That is true for most countries and wrong for a few (Italian landlines keep the 0). The app does not try to know every country: the line "WhatsApp will use +..." under the phone field shows the result for every number, and a number typed with `+` is always left exactly as typed. Question Q3 mentions this.

**Showing a number** (`phone.display(digits, countryCode)`): `+`, the country code, a space, then the rest with no further grouping: "+972 541234567". When the digits do not start with the country code set in Settings (a foreign number typed with `+`), the form is `+` and all the digits: "+447700900123". Every example in this document uses this form.

### 9.5 Choosing dates (R10)

**R10(a): a fast way to pick the next date.** Wherever a date is chosen, one-tap chips do the arithmetic.
- **Week chips:** first the client's own interval (`intervalWeeks`, else `settings.rebookWeeks`), marked "usual"; then each value of `quickPickWeeks` (default 4, 6, 8) that is different from it. A client on 5 weeks therefore sees "+5 wk usual", "+4 wk", "+6 wk", "+8 wk"; a client on the default sees "+4 wk usual", "+6 wk", "+8 wk". The usual interval is always there, so the common case never needs the date picker.
- In the Book sheet also Today and Tomorrow. Always "Pick date"; in the Finish sheet also "Not now" and "Course finished".
- **Starting point:** in the Finish sheet, the date of the session being finished. In the Book sheet, the client's last Done session, or today if there is none.
- **Result:** `dates.suggest(base, weeks, today)` = base + weeks x 7 days, which keeps the client's weekday. If that would be before today, it becomes the first day on or after today that falls on the same weekday, and the chip's top line reads "Usual day" instead of "+4 wk". Chips that land on the same date are shown once. A suggested date is never in the past.
- Every chip shows the real date ("Wed 16 Dec"). The time defaults to the client's usual time.
- Nothing is preselected.
- **Double-booking warning:** after a date and time are chosen, if another Booked appointment on that date starts less than `sessionMinutes` (default 30) before or after, the sheet shows "Heads up: Maya Cohen is booked at 14:00 that day." It warns and never blocks.
- Marking a session Done offers the same chips, so most clients leave with the next date booked.

**R10(b): choosing how long before the meeting the reminder goes out.** Settings > Messages: "Remind clients: Off, 1, 2, 3 or 7 days before" and "Same-day reminder: Off, 1, 2 or 3 hours before". Because nothing is precomputed, a change applies to every appointment at once.

### 9.6 The 4-week rule: Ask to rebook (R2)

The state is calculated from 4.9 rules 16 to 18. In words:
- For every **active** client with **no Booked appointment**: the next session is due on the date of the last Done session plus the client's weeks (their own number, else the global default of 4) x 7 days.
- Cancelled and No-show appointments never count as the last session. A client who has only cancelled or missed appointments is due on that appointment's date. A client with no appointments at all is listed as "Not booked yet" in grey and is never chased automatically.
- The client appears 7 days before the due date (yellow, "Due in 3 days") and turns red the day after it ("Overdue 1 d").
- The row disappears as soon as an appointment is booked, and while the client is Paused or Course finished.

**Red is for "I am late", never for "the client is slow"** (D18). Two things keep red from becoming permanent:
- **Once asked, never red again in that cycle.** After the owner asks, the client is blue "Asked 3 d ago" for `askAgainDays` (7), then comes back **yellow** as "No answer 7 d" with the button "Ask again". After a second unanswered ask the row's main button becomes "Pause client" (Book and Ask again stay in the overflow), because the useful next step is to stop chasing.
- **Lapsed clients go grey.** A client who is more than two intervals past the due date (with the default: last session more than 12 weeks ago) moves to the grey, collapsed group "Not seen for a while", is not in To do, and does not count in the red pill. From there the owner can still Message or Book one, mark the course finished, or tap "Pause all". Without this, the day step 5 arrives every client entered with old treatments and nothing booked would be red.

Actions on a row, so the list can always reach zero:

| Action | What it stores | Effect |
|---|---|---|
| **Book** | a new appointment | The row disappears. |
| **Message** or **Ask again** (Send sheet with the rebook text), or **Mark as asked** (asked in person) | `rebookAskedOn = today`, `rebookAsks` + 1, `rebookFor = anchor id` | Blue "Asked" for `askAgainDays` (7); a grey tick line shows the date. It leaves To do. If nothing is booked by then, it returns in yellow as "No answer 7 d". |
| **Not sent, reopen** | `rebookAskedOn = null`, `rebookAsks` - 1 | The client goes back to where they were before the ask (9.4). |
| **Snooze 1 week** | `rebookSnoozeUntil = today + 7`, `rebookFor = anchor id` | Hidden for a week (listed under Snoozed), then returns. |
| **Pause client** | `clientStatus = paused` | Hidden until made active again. |
| **Pause all** (group "Not seen for a while") | `clientStatus = paused` for every client in the group, in one save | The group empties. Undo restores all of them. |
| **Course finished** | `clientStatus = finished` | Hidden for good. Also offered as a choice in the Finish sheet (7.9). |

A new Done session changes the anchor, so old "asked" and "snooze" marks stop counting by themselves.

### 9.7 "Send reminders" run (step 8)

For a day with six or eight clients, sending one by one from a list is too slow. Home's To-do list shows one row, "N reminders ready", with the button **Send reminders**, whenever N reminders are ready or late (5.3).
- It opens the route `#/run`: a full-screen sheet showing the count **"3 left"**, the client, the appointment, the filled message and the same channel buttons as the Send sheet, plus **Skip** and **Stop**.
- Tapping a channel saves the mark and opens the messaging app. When the owner comes back (the page becomes visible again, or is reloaded: the run is a route, so it survives the page being discarded), the next due reminder is already showing and the count reads "2 left". Above it sits the line "Previous: Dana. Did not send? **Reopen**" (9.4), which puts Dana's reminder back in the list.
- The list is recalculated each time, in order of appointment time, and the count is simply the length of that list. Nothing about the run is stored, so a reload cannot show a wrong number. When none are left: green check, "All reminders are done", and a button back to Home.

### 9.8 A nudge while the app is closed: the daily alarm (step 8)

The only honest substitute for a server is a phone alarm that tells **the owner** to open the app.
- Settings > Messages > "Add a daily alarm to my calendar": choose a time (`settings.dailyAlarmTime`, default 08:30) and the days of the week (`settings.dailyAlarmDays`, default every day), then download `laser-daily-reminder.ics`. Both values are stored because the time also decides which appointments count as early (9.2).
- A tick box, on by default, adds a **second event at `eveningFrom`** (default 18:00): "Open Laser: send tomorrow morning's reminders". Early appointments are reminded the evening before, and without this the only prompt would be the next morning's alarm. The tick itself is not stored; it only shapes the file.
- The file holds the repeating events with an alert each and **no client data**. The morning event:

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Laser//Daily reminder//EN
BEGIN:VEVENT
UID:laser-daily-reminder
DTSTAMP:20261118T080000Z
DTSTART:20261119T083000
DURATION:PT5M
RRULE:FREQ=DAILY
SUMMARY:Open Laser: send today's reminders
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Open Laser: send today's reminders
TRIGGER:PT0S
END:VALARM
END:VEVENT
END:VCALENDAR
```

  (`DTSTART` is a floating local time; lines end with CRLF; chosen weekdays become `RRULE:FREQ=WEEKLY;BYDAY=...`. The evening event is a second `VEVENT` with `UID:laser-evening-reminder`, its own `DTSTART` and summary, and the same rule.)
- Whether an iPhone accepts this file from a download or a Home Screen app is unverified **[U]**. If it does not, the same screen shows three lines of instructions for creating a repeating phone alarm by hand ("Clock > Alarm > 08:30 > Repeat every day > Label: Open Laser"). Either way the step is complete.

### 9.9 Later upgrade: sending without the owner

Needs all of: a small server with a scheduler; a paid provider (WhatsApp Business API, SMS or email service); the data in a cloud database with a login; and each client's consent to automated messages. The storage seam (3.12) and the record shapes are ready for it. It is not part of this plan.

---

## 10. Build order

Ten steps, from basic to hard (P1): 1, 1b, 2, 3, 4, 5, 6, 7, 8 and the optional 9. Each step ends with something the owner can open, see and use (P3), and is small enough to understand before the next one starts (P2). Step 1b is a short step straight after step 1; it carries the letter because it finishes what step 1 starts (safety and "where does it live") before the client list is typed.

| Step | In one line | Requirements |
|---|---|---|
| 1 | The real look and your contact list, with safe saving and a backup file | R8, R12, R13 |
| 1b | The safety net, Example mode and your phone; choose the home device | T3, T5, R12 |
| 2 | Client profiles: hair colour, hair thickness, special notes | R6 |
| 3 | Treatments and money received | R3, R4 |
| 4 | Booking ahead and running the day | R10(a), R1 |
| 5 | The 4-week rule: finish, rebook, and ask | R2 |
| 6 | Leads | R5 |
| 7 | The complete dashboard and monthly progress | R1, R7 |
| 8 | Client reminders, ready to send | R9, R10(b) |
| 9 | Optional, last: a link clients can use to ask for a date | R11 |

**Definition of done for every step**
- `tests/unit.html` is all green under the five time zones; the end-to-end specs for this step and every earlier step pass on the laptop and phone projects; the guards spec passes; no console error, and no request other than local files and the one stubbed WhatsApp address (2.7).
- Every earlier fixture in `fixtures/` still imports with no error and no repair; a new fixture is generated with `helpers.makeFixture` (2.7) and committed. The step's spec ends with the round trip of 2.7: what its tests typed through the real forms is exported and imported again cleanly.
- `Laser.VERSION` and `Laser.STEP` are raised (from step 1b also `VERSION` in `sw.js`) and Settings shows them.
- The manual check on the owner's Mac is done, in the browser the owner really uses, opened by double-click. If step 1b put the app on the owner's phone, the step's phone items are checked there, from the Home Screen icon. If it did not, they are checked at phone width on the laptop, and repeated on the phone if the app is published later.
- The work is committed with a short message and pushed to GitHub (repo rule).
- The owner receives the step's three-item "Try this" list.

### Step 1. The real look and your contact list

**Goal:** the owner opens the real app, in its final theme and navigation, keeps clients' names, phones and emails in it, and can save a backup file and load it again.

**Requirements:** R8, R12, R13; groundwork for T1 to T6 (T1, T2 and the storage layer of T3 are complete here).

**Kept small on purpose (D10).** Step 1 builds only what its own screens use. Automatic copies, the device check, Example mode, the share and copy ways of backing up, and the phone are step 1b. Tables, tiles, charts and change chips are styled in the step whose screen first shows them.

**Built**
- Files: `index.html`; `css/tokens.css` in full, `base.css`, `layout.css`, and `components.css` with only the components step 1 shows (navigation, top bar, floating +, card, summary strip, list row in both layouts, badge in both styles, button, chip, segmented control, form field, sheet, modal, toast, banner, empty state); `js/core/` ns, util, dates, money, phone, links, schema (the full version 1 schema of section 4, with the per-field checks), migrations, storage (adapter, `laser.prev`, `laser.ui`), store (commit with validation, undo, two-tab guard, failed-save handling, drafts), selectors (people, search, counts, backup status), backup; `js/ui/` icons, components, overlay, files (download, pick, copy), actions, router, shell; `forms/personForm.js` with four fields (name, phone, email, client since); views home, clients (Contacts list), settings, placeholder; `main.js`; `img/` icons; `README.md`; `tests/` harness, the unit tests listed in 2.7, `helpers.js`, `guards.spec.js`, `unit.spec.js`, `backups.spec.js`, `step1.spec.js`, the hand-written `fixtures/backup-step1.json`; `.gitignore` and `CLAUDE.md` lines.
- Screens: the shell (sidebar on laptop, tab bar and floating + on phone); Dashboard with the date line, the summary strip ("Clients 12"), the Welcome card, the Getting-started checklist (two items) and the backup line; Clients as a contact list (name, phone, email, Call / WhatsApp / Email / Copy, search, add, edit, delete with Undo); Settings with Money (currency), Messages (country code, "WhatsApp on a computer opens"), Backup (Back up now by download, Load a backup, Check a backup file, Undo the last import, Erase), This device (where this copy runs, version, "How this app works") and Colours; placeholder pages for Schedule, Leads and Progress.
- Key functions: `util.html`, `util.uid`, `util.platform`, `dates.today / addDays / diffDays / format`, `money.parse / format`, `phone.toInternational / display`, `links.tel / whatsapp / sms / mailto`, `schema.emptyDoc / newPerson / normalize / validate / check.*`, `migrations.migrate`, `storage.load / save / readRev / usage / savePrev / loadPrev / ui.get / ui.set`, `store.init / get / commit / undo / subscribe`, `selectors.clients / search / counts / backupStatus`, `backup.buildFile / prepareImport / applyImport / checkFile`, `router.start / go`, `actions.on`, `overlay.sheet / modal / toast`, `files.download / pick / copy`.

**The owner can now:** open the app by double-click; see the real colours and navigation on laptop and at phone width; read in three plain lines where the data lives and what "automatic" will mean; confirm the currency and country code; add, edit, search and delete contacts, marking the ones they already had as "Earlier"; tap to call, WhatsApp or email a client; save a backup file, check it, and load it again.

**Acceptance checklist**
1. Double-clicking `laser/index.html` shows the Dashboard in under 2 seconds in Chrome and in Safari on macOS; "Laser did not start" never appears.
2. The browser's network panel shows no request other than local files.
3. At 1280px wide there is a sidebar with Home, Schedule, Clients, Leads, Progress and Settings. At 390px there is a bottom bar with the same five tabs and a floating + button. At 320px nothing scrolls sideways, and a Contacts row shows its name, its details and its four icons on separate lines.
4. Schedule, Leads and Progress open a placeholder page that names the step in which they arrive.
5. On first run the Welcome card shows the three statements of 3.9 with their "More" texts and suggests a currency and country code from the device's region (two empty fields when the region is unknown). **The card is still there after a reload until one of its buttons is tapped.** After "Start" the two-item checklist takes its place, and Settings > This device > "How this app works" shows the three texts again.
6. Adding "Dana Levi", phone `054-123 4567`, with an email, shows the client in Clients, still there after closing and reopening the browser.
7. Saving with an empty name is refused with "Enter a name". Saving with only a name works. An email with no `@` is refused with a message under the field, and `dana@gmail` is accepted by the form, by the save and by a later import alike (one rule, D22).
8. Searching `dan`, `4567` and part of the email each find that client; `zzz` shows "No client matches 'zzz'".
9. With country code 972, the line under the phone field reads "WhatsApp will use +972 541234567", that client's WhatsApp button links to `https://wa.me/972541234567` and Call to `tel:+972541234567`. With "WhatsApp on a computer opens" set to "WhatsApp app" the link is `whatsapp://send?phone=972541234567`. The email link keeps a literal `@`. With no country code, WhatsApp is disabled and a grey hint explains why.
10. A client named `<img src=x onerror=alert(1)>` is shown as that text; no dialog appears. A client with a Hebrew name is shown right-aligned and readable in the list and in the form (`dir="auto"`).
11. Deleting a client, from the edit form or from the row's overflow menu, shows a toast; Undo brings the client back.
12. "Client since" is the fourth field: a new client defaults to "Today"; "Earlier" can be saved with no date; on reopening the form "Earlier" is selected and the date field is empty; "Save and add another" keeps the choice.
13. "Back up now" saves `laser-backup-YYYY-MM-DD-HHMM.json` containing `"app": "laser-practice"`, `"schemaVersion": 1` and `"currencyDecimals"`; the Home line then reads "Backed up today" and the toast names a place to move the file to. The first time, the "Check your backup" card appears; choosing the saved file shows "This backup is good" with the counts, changes no data, and ticks checklist item 2.
14. Import refuses, with a clear message and no change to the data: a text file that is not JSON; a JSON file from another app; a backup in which a phone is a number instead of text; a backup with two people sharing one id. A backup in which a note is too long loads, and the preview lists the fix.
15. Importing a valid backup shows the preview with counts; "Replace my data" loads it; "Undo the last import" in Settings > Backup brings the old data back.
16. **Two tabs.** With the app open in two tabs and nothing being typed, a change in one appears in the other with no banner. With a half-typed client form open in the second tab, a change in the first makes the second show "This tab is out of date", refuse the save, and after Reload reopen the form with the typed text.
17. With saving made to fail by the test (`Storage.prototype.setItem` overridden, 2.7), a red "Not saved" banner appears and "Back up now" still produces a file.
18. **Drafts.** Typing half a new client, then reloading the page, reopens the form with the text and the line "Restored what you were typing. Discard". Closing a form with typed text shows "Not saved. Reopen".
19. With a stored `schemaVersion` of 2, the app shows the "older than your data" page with a working "Save a backup of my data" button, and nothing else.
20. With the clock moved 8 days past an unsaved change, the yellow backup banner appears on every screen; at 31 days it is red; after "Back up now" it is gone.
21. Settings > Colours shows the five badges, each with an icon and a word, and shows yellow and red in both styles (tint and solid).
22. **The test page is safe.** After opening `tests/unit.html` in the same browser, Dana is still in Clients, and no `laser-test.*` key is left in storage.
23. `schema.validate` on a document with 500 clients and 6,000 appointments takes under 30 ms (otherwise the fallback of 3.3 is built).
24. **Owner's Mac:** items 1, 6 and 13 pass in Safari and in Chrome on the owner's Mac. The owner adds their own number as a client and taps WhatsApp, Email and Call; "WhatsApp on a computer opens" is set to whichever choice worked best. With the window narrowed to phone width, every badge in Settings > Colours is easy to read. (The same reading test is repeated on the real phone in step 1b.)

**Try this:** (1) Add two or three clients, one of them yourself, and tap WhatsApp or Call from the list. (2) Save a backup, delete a client, load the backup, and see the client return. (3) Make the browser window narrow and see how the app will look on your phone.

**A note for the owner's check:** Safari and Chrome on one Mac keep separate data. A client added in one does not appear in the other; that is expected, and the Welcome card says so. Pick one browser for the app.

### Step 1b. The safety net, Example mode and your phone

**Goal:** the data has a second line of defence, the owner can see the app full of example clients, the app opens on the owner's phone, and the owner chooses where the real client list will live, before typing it.

**Requirements:** completes T3 (automatic copies, every backup path) and T5 (phone); R12; prepares R9 by checking the send links on the owner's real devices. **Question Q2 is asked at the start of this step.** It is the one question the build waits for, because its answer decides where real clients are typed.

**Built**
- Files: `core/storage.js` gains the IndexedDB copies (daily, before-import, before-update, before-restore) and `selfTest`; `core/store.js` gains Example mode (`enterExample`, `leaveExample`, commit step 0); `core/demo.js` (people only); `ui/files.js` gains the save picker, share, copy-as-text and `probe`; `sw.js` and its registration in `main.js`; `views/settings.js` gains Earlier copies with Restore, Share backup, Copy backup as text, the device check lines, Home device, Works offline, New version ready, Example mode; `views/home.js` gains checklist item 3 with the home-device card, and "See it with example data" on the Welcome card; `README.md` gains "Put it on your phone" and the note about saved web pages (3.1); `step1b.spec.js`; `fixtures/backup-step1b.json`; the two `sw.js` guards.
- **Publishing, only with the owner's yes to Q2:** GitHub Pages is switched on for the repo (branch `main`, root folder). The app's address is then `https://<GitHub user name>.github.io/tictactoe/laser/`. What becomes public is the code and the invented test people; the client data stays in the owner's browser and is never published. The README lists the three phone steps: open the address in Safari (or Chrome on Android), Share > Add to Home Screen, open the app from its icon from then on. If the owner says no, this part is skipped; everything else in this step still ships, and publishing can be done at any later step.
- Key functions: `storage.copies.put / list / restore`, `storage.selfTest`, `files.probe / savePicker / share / copyText`, `demo.build(today)`, `store.enterExample / leaveExample`.

**The owner can now:** see every built screen full of example clients and return to their own data with one tap; restore an earlier copy; back up through the share sheet or straight into a folder; see the result of the device check; open the app on the phone from a Home Screen icon, also without signal; try WhatsApp, SMS, email and a call on their own number from the phone; choose the device where the client list lives.

**Acceptance checklist**
1. "See it with example data" shows 14 invented clients under the blue banner "Example mode ... Back to my data" on every screen. Adding and deleting there leaves `laser.doc` and `laser.rev` unchanged. WhatsApp on an example client shows "Example mode: nothing is sent." Back up, Load a backup and Erase are disabled. "Back to my data", and also a reload, shows Dana again and no example client.
2. The first change of a day stores a daily copy. Settings > Backup > Earlier copies lists it with its counts. Restore asks first, keeps a "before restore" copy and replaces the data.
3. Importing a backup stores a "before import" copy, and Restore brings the old data back.
4. With IndexedDB switched off by the test, Settings says "Automatic copies: one copy only on this browser", the device check still passes, and "before import" still works through the fallback.
5. **Device check, automated:** starting from a first run in Chromium on `file://`, every required line is a pass and `ok` is true; the two follow-up lines read "pending"; the result is shown again after a reload. Opening the app in a second tab of the same browser session turns "Your data was still here when you opened the app again" into a pass. With storage writes made to fail, a yellow banner names the failing line.
6. **Device check, on the owner's Mac:** after quitting the browser and opening the app again, the "still here" line is a pass; after "Check a backup file", the "Backup file checked" line is a pass. On `file://` the line "Where this copy runs" shows the yellow advisory about saved web pages.
7. **A backup counts only when it exists.** With `navigator.share` stubbed to resolve, "Share backup" ends in "Backed up today"; stubbed to reject (the owner cancelled), nothing is marked and the nudge stays. "Copy backup as text" does not reset the nudge until "I saved it" is ticked. A cancelled save picker marks nothing.
8. The home-device card states the consequence of each choice; choosing one ticks checklist item 3; Settings > This device shows it and can change it.
9. `VERSION` in `sw.js` equals `Laser.VERSION`, and its file list equals the files `index.html` loads (guards spec).
10. `backup-step1.json` still imports.

    **On the owner's phone (only if the app was published):**
11. The address opens on the phone. After "Add to Home Screen", the app opened from its icon shows "Home Screen app: yes" and "Works offline: yes" in Settings > This device.
12. In airplane mode, opening the app from the Home Screen shows the Dashboard.
13. A test client added in the Home Screen app is still there after the phone was locked overnight.
14. "Share backup" saves a file to Files, and "Load a backup" reads it back on the phone.
15. After a new version is pushed, Settings shows "New version ready: Reload", and after the reload the version line shows the new version.
16. **Link check on the phone,** on the owner's own number: WhatsApp opens the right chat with the text filled in; SMS opens with the text; Email opens a draft to the address; Call dials. If SMS arrives without its text on this phone, the README records it and Copy is the way to send by SMS.
17. On the phone at arm's length in the clinic, every badge in Settings > Colours is easy to read (if not, the tokens are adjusted and re-checked for contrast).

**Try this:** (1) Tap "See it with example data", look around, then "Back to my data". (2) Open the app on your phone from the Home Screen icon and send yourself a WhatsApp from it. (3) Choose where your client list will live, and save a backup on that device.

### Step 2. Client profiles

**Goal:** setting up a client with hair details and special notes takes one short form, and each client has a page of their own.

**Requirements:** R6; completes R8; starts R4 and R1.

**Built**
- Files: `forms/personForm.js` extended with hair colour, hair thickness, special notes and More (treated areas, skin type, status); `views/client.js`; `views/clients.js` gains the Summary | Contacts switch (Summary shows Name, Hair, Client since for now) and the status filters; `components.css` gains the table and the tile; `selectors` gains active clients and new clients in a month; `views/home.js`: the summary strip's figure becomes "Active clients", and the tile "New clients this month" appears; `demo.js` adds profiles; `step2.spec.js`; `fixtures/backup-step2.json`.
- Screens: the client form (name, phone, email, hair colour chips, hair thickness, special notes, client since, and More: treated areas, skin type, status); the client page (contact buttons, yellow Note box, profile card, empty timeline, overflow: Edit, Pause, Course finished, Delete); Clients with the two views and filters.
- Key functions: `selectors.activeClients`, `selectors.newClientsIn(month)`, `store` helpers `savePerson`, `setClientStatus`, `deletePerson`; the duplicate-phone guard; "Save and add another".

**The owner can now:** set up each client with hair colour, hair thickness and special notes in a few taps; see that clients marked "Earlier" are not counted as new; open a client's page and see the special note highlighted in yellow; pause a client or mark a course finished; switch the list between Summary and Contacts.

**Acceptance checklist**
1. The New client form shows the fields in the order of 7.9, with More closed. Only the name is required. At 390 x 844 the footer with Save stays in view while the form scrolls, and the main fields (name to client since) come before More.
2. Hair colour is a single choice (tapping the chosen chip clears it); hair thickness is Fine / Medium / Coarse, and the selected segment is clearly different from the others (blue fill and border, 6.4); both appear on the client page after saving.
3. Special notes appear in a yellow Note box on the client page; a note containing `<script>` is shown as text; a note in Hebrew reads right to left.
4. A client saved with "Today" is counted in "New clients this month". A client saved with "Earlier", with the date 1 March 2025 or with no date, is not. Clients typed in step 1 as "Earlier" are not counted either, with no repair needed.
5. Under More: several treated areas can be chosen; skin type is optional and nothing on any screen complains when it is empty.
6. The Clients list switches between Summary and Contacts, and the choice survives a reload (it is in the address). The filters Active, Paused and Finished show the right people.
7. Pause shows a grey "Paused" badge; Course finished shows a grey badge; "Make active again" restores the client.
8. Saving a new client with another client's phone number shows the duplicate warning with "Open" and "Save anyway".
9. "Save and add another" reopens an empty form that keeps the "Client since" choice.
10. Home shows "Active clients" in the summary strip and the tile "New clients this month", with the correct numbers; each opens the client list.
11. `backup-step1.json` and `backup-step1b.json` still import; their people open with empty profiles.
12. On the phone layout the form is a full-height sheet; Back closes it; closing with typed text shows "Not saved. Reopen" and Reopen restores the text; reloading the page with a half-filled form restores it too. After Save, focus returns to the row or button that opened the form.

**Try this:** (1) Open one client and add hair colour, thickness and a note. (2) Add a client you already had with "Client since: Earlier". (3) Pause one client and find them again with the Paused filter.

### Step 3. Treatments and money received

**Goal:** the owner records each treatment and what was paid, and sees per client and per month what was done and earned.

**Requirements:** R3, R4; part of R1. Questions Q1 (packages and part payments) and Q7 (how much history) should be answered before this step; the defaults apply otherwise. A yes to Q1 turns "Track what clients owe" on.

**Built**
- Files: `forms/sessionForm.js` (Add treatment mode, with the prefill rules of 7.9 and the live "= 250.00" line); `forms/paymentForm.js`; `views/schedule.js` with the Done segment (`#/schedule` opens it); `views/client.js` gains the four tiles, balance line and timeline; `views/clients.js` Summary gains Sessions, Total paid, Last visit, the sort menu and the Owes filter; `forms/personForm.js` gains the group "Before this app" under More (Sessions already done, Already paid in total); `views/home.js` gains the figure "Received in (month)" in the summary strip and the tile "Treatments this month"; `views/settings.js` gains Usual price, Track what clients owe, and the Advanced group with "Show this symbol instead"; `selectors` gains rules 4 to 10 and 13 of 4.9; `demo.js` adds treatments and payments; `step3.spec.js`; `fixtures/backup-step3.json`.
- Key functions: store helpers `saveTreatment(personId, values)` (appointment + linked payment in one commit), `recordPayment`, `deleteAppointment` (cascade), `deletePerson` (cascade with the confirmation of 4.8); `selectors.sessionsDone`, `totalPaid`, `balance`, `lastVisit`, `month(monthKey)`, `doneList(monthKey)`.

**The owner can now:** add a treatment for a client with the amount paid, for today or for any past date; see each client's number of sessions, total paid and last visit; open Schedule > Done to see, month by month, who was treated when and what they paid; see what was received this month on the Dashboard; give a long-standing client their earlier sessions and payments as two numbers, or enter past treatments one by one.

**Acceptance checklist**
1. Adding a treatment today with 250 shows, with no reload: a timeline row "Done, Paid 250"; client tiles Sessions 1, Total paid 250, Last visit today; the same numbers in Clients > Summary; "Received in November 250" in Home's summary strip; and one row in Schedule > Done under "1 treatment, 250 received".
2. A treatment dated last month counts in last month in Schedule > Done and not in this month's figure. If its date is before the client's "client since", that date moves back to it.
3. The amount field follows the table of 4.1: it accepts `250`, `250.5`, `250,5` and `1,150`, shows "= 1,150.00" under the field while typing, and refuses `12.345` and `1.150` with "Too many decimals". An empty amount is not saved as 0: the field asks for a value.
4. Amount 0 saves the treatment with a grey "0" and creates no payment record.
5. Editing a treatment's amount updates every total; setting it to 0 removes the payment.
6. Moving a treatment to another month moves its money to that month.
7. Deleting a treatment warns that the money goes too; Undo restores both.
8. Deleting a client with history shows the modal with that client's counts; after confirming, the totals drop; Undo restores everything.
9. The six worked examples of 4.10 give exactly the stated totals, badges, month figures and prefills. In example 2 the Add treatment sheet for session 2 opens with the amount **empty**, the caption "Last time: 1,500" and the chips "0 today", "250 usual" and "1,500 last time"; it never opens prefilled with 1,500.
10. The switch does what 4.8 rule 12 says and no more. With tracking off the Price field is under More and examples 1 and 2 show no badge; example 5 still shows "Credit 250". With tracking on the Price field is on the main form, example 4 shows a yellow "Owes 120", and "Record payment" opens prefilled with 120.
11. A refund of 100 lowers the client's total paid and that month's money received by 100.
12. With "Show this symbol instead" set under Advanced, every amount shows that symbol. With money stored, changing to a currency with the same decimals asks for confirmation and changes only the label; changing to one with different decimals is refused. A currency code the browser does not know (`ISL`) is refused.
13. The rows of Schedule > Done for any month, including stand-alone payments, add up to its summary line.
14. Below 768px the tables are cards and nothing scrolls sideways.
15. A client given "Sessions already done: 6" and "Already paid in total: 1,500" shows Sessions 6 and Total paid 1,500 on the client page and in Clients > Summary, with no balance; their next treatment is "Session 7"; no monthly figure and no Schedule > Done row changes (4.10 example 6).
16. Tapping the Schedule tab opens Done; Upcoming and Ask to rebook still say when they arrive.
17. With no currency chosen, the amount field is replaced by "Choose your currency first" with a link to Settings.
18. Fixtures from steps 1, 1b and 2 still import.

**Try this:** (1) Add today's treatments with what each client paid. (2) Pick one long-standing client, open Edit > More, and fill in "Before this app"; for another, enter a past treatment with "Add past treatment". (3) Open Schedule > Done and step back through the months.

### Step 4. Booking ahead and running the day

**Goal:** the owner books future appointments in a few taps and runs the day from the Dashboard.

**Requirements:** R10(a); more of R1 and R3.

**Built**
- Files: `forms/sessionForm.js` gains Book, Reschedule and Finish modes (Finish without the "Next session" part yet); `views/schedule.js` gains Upcoming; `core/reminders.js` is created here with `todo` (appointment rows only, type 2 of 5.3) and `signature`, because Home's To do, the red pill and the tick all need them in this step; `views/home.js` gains the figure "Today" in the summary strip, the Today card, To do (earlier appointments needing an outcome) and Next 7 days; `views/client.js` gains "Book appointment" and Next visit; `views/clients.js` Summary gains the Next visit column; `forms/personForm.js` gains "Weeks between sessions" under More; `views/settings.js` gains Scheduling > Weeks between sessions and, under Advanced, "Quick date buttons" and "Usual length of a session"; the New menu; `shell.js` gains the 60-second tick; `selectors` gains rules 5, 11, 12, `agenda`, `clashes`; `dates.suggest`; `demo.js` adds bookings; `step4.spec.js`; `fixtures/backup-step4.json`.
- Key functions: `reminders.todo(state, now)`, `reminders.signature(state, now)`; store helpers `bookAppointment` (with optional inline new client), `reschedule` (resets `scheduledOn`), `setStatus(id, 'cancelled' or 'noShow')`, `finishAppointment(id, { amountMinor, priceMinor, areas, notes })`.

**The owner can now:** book a client with a one-tap date (the client's usual interval first, then +4, +6, +8 weeks, each showing the real date); give one client their own number of weeks; see every upcoming appointment grouped by day; see today's appointments on the Dashboard and finish each with the amount paid; reschedule, cancel or mark a no-show; be warned before double-booking; see in red any past appointment that was never closed.

**Acceptance checklist**
1. From a client's page, "Book appointment" shows the chips with their dates. "+4 wk" for a client last treated on a Wednesday gives the Wednesday 28 days later. After saving, the appointment is in Schedule > Upcoming under the right day and as "Next visit" on the client page and in the list.
2. For a client last treated 5 weeks ago, the first chip reads "Usual day" with the next matching weekday on or after today. No chip ever offers a past date, and no two chips show the same date.
3. **The usual interval is always offered.** A client whose "Weeks between sessions" is 5 gets a first chip "+5 wk, usual", followed by +4, +6 and +8. With the global setting changed to 5, every client without their own number gets it. Changing "Quick date buttons" to 3 and 5 changes the other chips. The per-client field accepts 1 to 26 and refuses 0 and 27.
4. The time is required, and is prefilled with the client's last appointment time.
5. Booking within 30 minutes of another appointment shows "Heads up: ... is booked at ..." and still lets the owner save. Changing "Usual length of a session" to 60 widens the warning to 60 minutes.
6. + > Appointment finds a client by two typed letters. "New client" inside the sheet creates the client and the booking in one save; Undo removes both.
7. The Today card lists today's appointments by time with "Session N" (a client with 6 sessions "before this app" shows "Session 7"). Finish opens the sheet with the amount prefilled by the rules of 7.9; Save turns the row into a green "Done, paid 250" and updates the month's figure in the summary strip.
8. In worked example 2 of 4.10 the Finish sheet for session 2 does not open prefilled with 1,500: the amount is empty with the chips "0 today", "250 usual" and "1,500 last time", and Save is refused until a value is chosen.
9. Finish is offered only for appointments dated today or earlier.
10. An appointment from yesterday still marked Booked appears in To do and under "Needs an outcome" in red ("No outcome"), drawn with the solid red badge, and the Home tab shows a red pill "1". It can be closed from Home in two ways: Finish, or the row's overflow > No-show. After either, no element with `data-tone="urgent"` remains anywhere in the app.
11. Today's appointments appear in the Today card and are not repeated in To do.
12. With the clock 30 minutes past the start of a Booked appointment today, its Today row turns yellow "Mark as done?" within 60 seconds without a reload.
13. With the app left open across midnight, "Today" changes to the new day within 60 seconds. No automatic redraw (tick, return to the tab, window focus) happens while a sheet is open or while a field or the search box has focus: text typed in the Clients search box is still there after switching to another app and back.
14. Reschedule moves the appointment and Undo moves it back.
15. Cancel and No-show turn the row grey, change no money, and the toast offers Undo and "Book again".
16. Next 7 days lists the right appointments and shows its empty text when there are none.
17. Booking a Paused client makes that client Active.
18. On the phone layout the floating + opens the New menu, and every button is at least 44px tall. At 320px wide no To-do, Today or Upcoming row overflows sideways: name and badge on line 1, details on line 2, buttons on line 3.
19. Fixtures from steps 1 to 3 still import.

**Try this:** (1) Book next week's real appointments with the date chips. (2) Tomorrow, finish each appointment from the Dashboard as the client leaves. (3) Try to book two clients at the same time and read the warning.

### Step 5. The 4-week rule: finish, rebook, and ask

**Goal:** no client is forgotten: finishing a session books the next one, and those who left without a date appear on a list until they are booked, asked or closed.

**Requirements:** R2; completes R10(a). Question Q6 (the language of the messages) should be answered before this step.

**Built**
- Files: `core/reminders.js` gains `rebookState` and the rebook rows in `todo`; `core/templates.js` (default texts, `fill`, `unknownPlaceholders`); `forms/sendSheet.js` with the "Sent?" strip and "Not sent, reopen" (9.4); the Finish sheet gains "Next session"; `views/schedule.js` gains Ask to rebook; `views/home.js` To do gains rebook rows; `views/client.js` gains the rebook line; `views/settings.js` gains, under Messages, "Dates in messages are written in" and the **Rebook message editor** (text area, unknown-placeholder warning, Reset), and under Advanced "Show ask to rebook ... days early" and "After asking, wait ... days"; `demo.js` adds rebook cases; `step5.spec.js`; `fixtures/backup-step5.json`.
- Key functions: `reminders.rebookState(person, state, today)`, `templates.fill(text, vars, locale)`, `templates.unknownPlaceholders(text)`, store helpers `finishAppointment` extended with `next: { date, time }`, `null` or `'finished'`, `markAsked`, `unmarkAsked`, `snoozeRebook`, `pauseAll(ids)`.

**The owner can now:** finish a session and book the next one in three taps, or close the course in the same sheet; open "Ask to rebook" to see who is overdue (red), due soon or not answering (yellow) and already asked (blue); message a client with a prepared text through WhatsApp, SMS, email or copy, and rewrite that text in their own words and language; take a mark back if the message was not sent; snooze, pause or close a client so the list empties.

**Acceptance checklist**
1. Finishing with "+4 wk" makes, in one save, the appointment Done, the payment, and a new appointment 28 days later at the same time. Undo reverts all three.
2. The Finish sheet cannot be saved until a "Next session" choice is made; nothing is preselected. With "Not now", no appointment is created. With "Course finished", no appointment is created, the client's status becomes Course finished in the same save, the client never appears in Ask to rebook, and Undo reverts it. A client on 5 weeks sees "+5 wk, usual" as the first chip.
3. For a client on 4 weeks with nothing booked and never asked: last session 20 days ago, not listed; 22 days ago, yellow "Due in 6 days"; 28 days ago, yellow "Due today"; 29 days ago, red "Overdue 1 d"; 84 days ago, still red "Overdue 56 d"; 85 days ago, grey under "Not seen for a while", not in Home's To do and not in the red pill.
4. A client with a Booked appointment is not listed. A Paused or Course-finished client is not listed.
5. A new client with no sessions appears only under "Not booked yet" in grey, and never on Home.
6. A client whose only appointment was cancelled is due on that appointment's date.
7. Giving one client 6 weeks moves only that client's due date. Changing "Weeks between sessions" to 5 moves everyone else's at once. Changing "Show ask to rebook ... days early" to 3 removes the "22 days ago" client of check 3 from the list.
8. **Asking.** Message opens the Send sheet with the rebook text containing the client's first name and the number of weeks, and "To:" with the international number. Choosing WhatsApp moves the client to "Asked, waiting for an answer" with a **blue** badge "Asked today" and a grey tick line, and off Home. Seven days later with nothing booked the client is back in **yellow**, "No answer 7 d", with the button "Ask again"; it is never red. After a second unanswered ask the row's main button is "Pause client".
9. **Taking it back.** A reload right after choosing WhatsApp shows the client as Asked (the mark was saved before the link opened) and the strip "Sent to Dana? Yes / No, reopen", which stays until answered. "No, reopen" puts the client back in the group they came from. Later, the row's overflow > "Not sent, reopen" does the same.
10. "Mark as asked" has the same effect as Message without sending. Snooze hides the client for 7 days. Course finished removes the client for good. "Pause all" in "Not seen for a while" pauses every client in that group in one save, and Undo restores them.
11. A new Done session for the same client starts a fresh cycle: the old "asked" mark no longer shows.
12. Home's To do lists rebook rows, red before yellow; with none, it shows a green "All caught up".
13. **The text can be changed now.** Changing the rebook text in Settings > Messages changes the text in the next Send sheet; `{nmae}` is flagged as not a placeholder; "Reset to the original text" restores the default.
14. In Example mode the Send sheet offers Copy only. For a client without a phone it shows "No phone number" and offers Copy (and Email if there is an address).
15. At 320px wide no Ask to rebook row and no rebook row in To do overflows sideways; "Overdue 5 d" and "No answer 9 d" fit beside the name.
16. Fixtures from steps 1 to 4 still import.

**Try this:** (1) Finish a client and book the next session with one chip. (2) Open Ask to rebook and message the first red client. (3) Snooze one client and mark another "Course finished".

### Step 6. Leads

**Goal:** everyone who asks about laser is written down once and followed up until they become a client or are closed.

**Requirements:** R5; adds leads to R1.

**Built**
- Files: `forms/leadForm.js` (the lead form and the "Follow up again?" sheet); `views/leads.js`; the New menu gains Lead; `views/home.js` gains the figure "Open leads" with its "N new" line in the summary strip, and lead rows in To do; `reminders.todo` gains leads; `forms/sendSheet.js` gains the lead kind; `views/settings.js` gains the **Lead message editor**; `demo.js` adds leads; `step6.spec.js`; `fixtures/backup-step6.json`.
- Key functions: `selectors.leads(filter)`, `selectors.leadTone(person, today)`, store helpers `saveLead`, `markContacted(id, followUpOn)`, `convertToClient(id)`, `closeLead(id)`.

**The owner can now:** add a lead in three taps; see new leads in yellow, on the Leads tab and in the Dashboard's summary; mark a lead contacted and choose when to follow up; message a lead with a prepared text that can be rewritten; close a follow-up from its own row; turn a lead into a client in one tap and book the first session straight away; close a lead who is not interested.

**Acceptance checklist**
1. A lead saved with only a name appears in Leads with a yellow "New lead" badge, in Home's To do, and in the summary strip, where "Open leads" goes up by one and its second line reads "1 new".
2. The lead form has exactly: Name, Phone, Interested in, Note, Follow up.
3. "Contacted" then "In 3 days" shows blue "Contacted" with "next: (date)" on the second line. Three days later it is yellow "Follow up today"; four days later red "Follow-up late".
4. Message opens the Send sheet with the lead text; choosing a channel marks a new lead as Contacted; changing the lead text in Settings > Messages changes the next Send sheet.
5. **A follow-up row can be closed from the row.** For a lead whose follow-up is overdue, Message > WhatsApp clears the follow-up date in the same save; back in the app "Follow up again?" is shown; after "No follow-up" the lead is blue "Contacted" and gone from To do. Choosing "The message was not sent" instead puts the lead back as it was, overdue follow-up included, also after a reload. The overflow item "Followed up" opens the same choices without sending.
6. "Convert to client" sets client since to today, moves the person to Clients, counts them in "New clients this month", and opens the Book sheet. Leads > All shows them with a green "Became client" badge. Undo reverses it.
7. "Not interested" turns the lead grey and moves it under that filter; editing the lead can open it again.
8. Leads never appear in the Clients lists or in "Active clients"; clients never appear under Leads > Open.
9. Search finds a lead by name or phone. Deleting a lead offers Undo.
10. Fixtures from steps 1 to 5 still import.

**Try this:** (1) Add the last three people who asked you about laser. (2) Mark one as contacted with a follow-up next week. (3) Convert one to a client and book a first session.

### Step 7. The complete dashboard and monthly progress

**Goal:** one screen summarises the whole practice, and one screen shows month by month how it is growing.

**Requirements:** completes R1; R7.

**Built**
- Files: `ui/charts.js`; `views/progress.js` (with the invest sheet); `views/home.js` gains the end-of-day line, the Money card with its change chip and "Owed to you" line, and the two-column laptop layout; `components.css` gains the chart and the change chip; `selectors` gains rules 14, 15, 21, 22 and `monthsTable(count)`; `demo.js` completes eight months of history; `step7.spec.js`; `fixtures/backup-step7.json`.
- Key functions: `selectors.monthToDate(today)`, `selectors.change(cur, prev)`, `selectors.monthsTable`, `selectors.bestMonth`, `selectors.streak`, `charts.bars(series, options)`.
- A colour audit of every screen against section 5.

**The owner can now:** see on the Dashboard, at a glance, today's appointments, what needs attention, money this month against last month, client and lead counts and the week ahead; open Progress to see people treated, new clients and money received for every month, a 12-month chart with the best month marked, and (optionally) how much to set aside to invest.

**Acceptance checklist**
1. The three Progress tiles equal hand-calculated values from the fixture; "People treated" counts each client once even with two sessions in the month, and "22 treatments" is shown beneath it.
2. On 18 November the change chips compare 1 to 18 November with 1 to 18 October. On 3 November, and in a month with only two payments so far, the chip shows the two amounts ("750 so far, 500 by this day last month") and no percent.
3. The chart shows 12 bars with the value above each; the current month is the darker blue; the highest bar carries a blue "Best" badge with a star; a text summary exists for screen readers.
4. The table has one row per month with Treatments, People treated, New clients, Money received and "Money vs month before" (full month against full month); the current month is labelled "so far"; months before the app was in use show a dash under New clients; "Show earlier months" reveals the rest.
5. A month above the one before shows a blue chip with an up arrow; a month below shows a grey chip with a down arrow. Nothing on Progress is red or green.
6. Setting an invest goal of 20% shows "Set aside 20% to invest" with the month and year amounts; the year amount equals 20% of the year's total, rounded once; setting 0 hides it again.
7. Home shows "N of M done, X received today" in the Today header; with a client who owes (whether tracking is on or off), "Owed to you: ..." links to the Owes filter.
8. Every figure in the summary strip and every tile on Home opens the matching list. At 390px the strip, with its four figures, is on the first screen directly under the date.
9. At 1024px and wider Home has the strip across the top and two columns below it in the order of 7.2; below that width, one column.
10. In Example mode every Home section is filled. With an empty document every section shows its empty text.
11. With a fixture in which nothing is late, no element with `data-tone="urgent"` exists on any screen, except the red sample in the key of Settings > Colours. ("Delete client" and "Erase this device" carry no `data-tone`, 5.4.)
12. Clients marked "Earlier", "before this app" numbers and treatments entered for past months do not change this month's figures.
13. No badge anywhere is green except Done, Paid, Became client, All caught up and Backed up (the colour audit of section 5).
14. Fixtures from steps 1 to 6 still import.

**Try this:** (1) Open the Dashboard first thing in the morning and work the To-do list down to "All caught up". (2) Open Progress and find your best month. (3) Set an invest goal and see the amount for this month.

### Step 8. Client reminders, ready to send

**Goal:** the app works out which clients need a reminder before their appointment and on the day, prepares each message, and lets the owner send them one after another.

**Requirements:** R9, R10(b); completes the messaging part of R2. This is the hardest core step: time rules, other apps and device differences.

**Built**
- Files: `core/reminders.js` gains `slots(appointment, settings, now)` and reminder rows in `todo`; `forms/sendSheet.js` gains the reminder kinds, Skip and slot marking; `views/run.js`; `core/ics.js`; `views/schedule.js` Upcoming gains the combined badge and the grey reminder line ("Reminder on ...", "Reminded ...", "Reminder skipped"); `views/home.js` gains the Send button on Today rows and the single To-do row "N reminders ready" with "Send reminders"; `views/settings.js` gains Remind days before, Same-day reminder, the **Before and Same-day message editors**, the Insert chips and live preview on all four editors, the daily alarm (time, days, the evening event), and under Advanced the evening time; `step8.spec.js`; `fixtures/backup-step8.json`.
- Key functions: `reminders.slots`, `reminders.isEarly(appointment, settings)`, `reminders.dueReminders(state, now)`, store helpers `markReminder(appointmentId, slot, action, channel)`, `unmarkReminder(appointmentId, slot)`, `ics.dailyAlarm(time, weekdays, eveningTime or null)`.

**The owner can now:** see each morning which reminders are ready; send them all in one run through WhatsApp, SMS or email with the text already written; take a mark back when a message did not go out; choose how many days before and how many hours before clients are reminded; rewrite the two reminder texts; add a daily alarm to the phone as a prompt to open the app.

**Acceptance checklist** (with the test clock)
1. With "2 days before": an appointment 5 days away, booked 10 days ago, shows the grey line "Reminder on (date)". Two days before, it is yellow "Reminder ready" in Upcoming and is counted in To do's single row "1 reminder ready". One day before, unsent, it is red "Reminder late".
2. Send opens the sheet with the client's first name, the date in words (in the language chosen under "Dates in messages are written in") and the time in the text, and "To:" with the client's international number. Choosing WhatsApp marks the reminder before the link opens: a reload immediately afterwards shows the grey tick line "Reminded (date)" under the appointment, whose badge is still blue "Booked", and the strip "Sent to Dana? Yes / No, reopen", which stays until answered. "No, reopen" makes the reminder ready again. Later, the row's overflow > "Not sent, reopen" does the same.
3. An appointment booked 1 day ahead never shows a days-before reminder and never turns red for it.
4. **The five worked cases of 9.2**, with the default settings: 14:00 is yellow from the start of the day with "send by 12:00", red from 13:00, gone at 14:00. 11:00 is yellow until 10:00. 10:15 is offered from 18:00 the evening before and is still yellow at 08:30. 09:00 is offered from 18:00 the evening before, labelled for tomorrow, and red only from 08:00. With "1 day before", the 09:00 appointment has no same-day reminder at all.
5. With the default settings and appointments at 09:00, 10:15 and 14:00, nothing on Home is red at 08:30 if the evening reminders were sent.
6. Rescheduling an appointment whose reminder was sent makes both reminders available again for the new date.
7. Skip adds the grey line "Reminder skipped", removes the reminder from To do's count, and can be reversed with "Not sent, reopen".
8. Changing "days before" from 2 to 3 changes every appointment's reminder day at once; "Off" removes them all.
9. In each of the four message editors: an edit shows in the live preview; the Insert chips add a placeholder; `{nmae}` is flagged as not a placeholder; "Reset to the original text" restores the default.
10. **The run.** With 3 reminders ready, To do shows one row, "3 reminders ready", not three. "Send reminders" opens the run at "3 left"; after choosing WhatsApp and returning it shows "2 left" with "Previous: Dana. Did not send? Reopen" above the next reminder; Reopen makes it "3 left" again; reloading on the run screen shows the same reminder and the same count; Stop returns to Home; after the last one it shows "All reminders are done".
11. "Add a daily alarm to my calendar" downloads a file containing `RRULE`, `VALARM` and no client name or number; with the evening box ticked the file holds a second event at 18:00; the chosen time and days are still shown after a reload.
12. The SMS link is `sms:+<digits>?&body=<text>` and the email link keeps a literal `@`; a message ending in half an emoji shows "Could not prepare the link. Use Copy." instead of an error; Copy places the text on the clipboard.
13. The words "sent automatically" appear nowhere in the app; the Send sheet carries the honest line of 9.4.
14. No reminder ever makes a row or badge green (5.1).
15. **Owner's home device** (the phone if step 1b put the app there; otherwise the Mac, and repeated on the phone if the app is published later): a real reminder to the owner's own number opens WhatsApp on the right chat with the text filled in; the daily alarm file is accepted by the calendar and gives an alert, or the owner sets the phone alarm from the written instructions.
16. Fixtures from steps 1 to 7 still import.

**Try this:** (1) Tomorrow morning tap "Send reminders" and go through the run. (2) Change one message text to your own words. (3) Set the daily alarm on your phone.

### Step 9 (optional, last). A link clients can use to ask for a date

**Goal:** a client can open a small page, choose days that suit them, and send the request to the owner as a ready-written WhatsApp message.

**Requirements:** R11. The owner said this is not necessary; skip it unless the owner asks for it after step 8 (question Q9). It needs the app's files published at a web address (step 1b, question Q2), because a client cannot open a file on the owner's computer.

**Built**
- Files: `laser/request/index.html`, `request.css`, `request.js`: a separate static page with its own strict CSP, the same tokens, no storage, no tracking, no link back into the app. `views/settings.js` gains (Advanced) "Your own WhatsApp number", "Address of your request page" and "Copy my request link"; `forms/sendSheet.js` gains a tick box "Add my booking request link" on rebook and lead messages; `step9.spec.js`.
- **The app must know the page's address.** When the owner's data lives in the double-clicked file, the app cannot work out the published address by itself. `settings.requestPageUrl` (4.6) holds it: prefilled from the app's own address when the app runs on `https:`, typed or pasted once otherwise. It must start with `https://` (the check lives in `links.js`, the one file under `js/` that may name an outside address, 2.7). The app only ever places it inside message text; it is never used as a link in the app (2.6).
- The page: Name; up to three preferred days (date fields, earliest today); time of day (chips Morning, Afternoon, Evening); a short note (up to 200 characters). Button "Send by WhatsApp" builds `https://wa.me/<to>?text=...` with the message "Hi, this is {name}. I would like to book my next laser session. Days that suit me: {days}. Time of day: {time}. {note}". Button "Copy message" is always there.
- The owner's number is not written in any file in the repo. It travels in the link the owner sends, after the `#` (`.../laser/request/#to=972541234567`), which is never sent to a server. The page accepts it only if it is 8 to 15 digits.
- Nothing is booked automatically: the request arrives as a message, and the owner books it in the app in three taps.

**The owner can now:** send a client a link with the rebook message; receive the client's preferred days as a tidy WhatsApp message; book the chosen day by hand.

**Acceptance checklist**
1. The page opens from the published address, makes no request other than its own three files, and stores nothing (its browser storage is empty after use).
2. Without `#to=...`, only "Copy message" is offered. A `to` value containing anything but 8 to 15 digits is ignored.
3. The message lists the chosen days in words and the time of day, and "Send by WhatsApp" opens a chat with the owner's number.
4. A name containing HTML is shown and sent as plain text.
5. Searching the repo for the owner's phone number finds nothing.
6. In the app, ticking "Add my booking request link" appends the link to the rebook message.
7. On `file://` with "Address of your request page" filled in, "Copy my request link" gives that `https://` address followed by `#to=` and the owner's digits. With the address empty, the button is disabled with the hint "Add the address of your request page first". An address that does not start with `https://` is refused.
8. The page is usable at 320px wide and with a right-to-left `dir`.

**Try this:** (1) Send the link to yourself and fill it in. (2) Read the message that arrives. (3) Book that date in the app.

---

## 11. Requirement traceability

| ID | Requirement (short) | Where it is satisfied | Step |
|---|---|---|---|
| R1 | Main dashboard: people, dates, money, new leads | Home / Dashboard (7.2): the summary strip directly under the date gives all four at a glance (appointments today, received this month, active clients, open leads with "N new"); then Today and Next 7 days (dates), the Money card (paid, compared with last month), the Numbers tiles (people), and lead rows in To do | Starts 1 (clients); grows 2 (active and new clients), 3 (money), 4 (today, dates), 5, 6 (leads); complete in 7 |
| R2 | Every 4 weeks, a reminder to ask a client for another session | Schedule > Ask to rebook (7.3), rebook rows in Home's To do, rules in 4.9 (16 to 18) and 9.6; default 4 weeks (a setting from step 4), per-client override; the client's own interval is always the first date chip | 5 (the rebook message can be rewritten from 5 as well) |
| R3 | For each client, when they were treated and how much they paid | Schedule > Done (7.3) by month; client page timeline (7.5) | 3 |
| R4 | List of patients with number of appointments and total paid | Clients > Summary (7.4): Sessions, Total paid, Last visit, Next visit. For a client from before the app, "Sessions already done" and "Already paid in total" make both figures right without typing every past treatment (D19) | 3 (list exists from 1; Next visit from 4) |
| R5 | List of new leads | Leads tab (7.6); "Open leads" with "N new" in Home's summary strip; lead rows in To do; a follow-up row can be closed from the row | 6 |
| R6 | Easy manual client setup: hair thickness, hair colour, special notes | Client form (7.9): chips, only the name required, main fields first with Save always in view; client page profile and Note box | 2 (name, phone, email and "client since" from 1) |
| R7 | Monthly progress: people done, clients added, revenue jumps, motivation to invest | Progress tab (7.7): three tiles with change chips, 12-month chart with best month, month table with the column "Money vs month before" (the jumps), optional invest line. Existing clients marked "Earlier" are never counted as added | 7 |
| R8 | List with clients' emails and phone numbers | Clients > Contacts (7.4) with tap to call, WhatsApp, email, copy | 1 |
| R9 | Automatic message days before and on the day | Reminder slots (9.2), Send sheet (9.4), run (9.7), daily alarm (9.8); honest limit (9.1, 3.9); every mark can be taken back (9.4) | 8 (limit explained in 1; send links checked on the owner's devices in 1 and 1b; Send sheet from 5) |
| R10a | A fast way to choose the next date | Date chips with real dates: the client's usual interval first, then +4 / +6 / +8 weeks, and the clash warning (9.5), in Book and Finish | 4 (Book), 5 (Finish) |
| R10b | Choose how long before the meeting the reminder goes | Settings > Messages: days before, hours before (9.5, 9.2) | 8 |
| R11 | Link a client fills in to request a date (last, optional) | `laser/request/` page; the app keeps the page's address in a setting so the link also works when the data lives in the double-clicked file | 9, optional |
| R12 | Professional, easy to reach and understand | Design system (6), five-tab navigation, one primary button per row, a three-line row layout that fits a 320px phone, empty states, tap counts for phone and laptop (8), plain words (1.4) | 1, checked every step |
| R13 | Light blue and white; yellow important, green done, red urgent | Tokens (6.1), status rules (5), Settings > Colours key. Yellow and red are drawn solid where the owner must act; green only for finished things (D17); red only when the owner is late (D18) | 1 (palette and key), applied as each item appears, audited in 7 |
| P1 | Basic first, hard last | Build order (10): contacts; safety and phone; profiles; money facts; future dates; date rules; leads; summaries; messaging; optional link | all |
| P2 | Step by step, understandable | Each step has one goal, an "owner can now" list and a "Try this" list; unbuilt tabs say when they arrive; Example mode shows each new screen full | all |
| P3 | Every step ends with something usable | "The owner can now" in each step | all |
| T1 | Lives in `laser/` inside the existing repo | 2.1 | 1 |
| T2 | Plain HTML, CSS and JavaScript; no build, framework, npm or outside request; works by double-click and as a static site | 2.3 to 2.7; the offline worker is plain JavaScript and runs only on the published copy (2.8) | 1 (double-click); 1b (static site) |
| T3 | No backend; data in the browser behind a storage layer; JSON backup | 3.1 to 3.8, 3.12 | 1 (storage layer, backup file, import); 1b (automatic copies, share, copy, save to a folder) |
| T4 | Honest about "automatic" | Welcome card (3.9), 9.1, the Send sheet's grey line, "Ready to send" wording | 1 (explained); 5 (first send); 8 (reminders) |
| T5 | Works well on a phone and on a laptop | 6.4 and 6.5 (layouts), 2.8 (offline), 3.9 (home device), tap counts for both (8) | 1 (layouts at phone width); **1b (on the owner's phone)**; phone items in every later step |
| T6 | Currency symbol and reminder timing are settings; English UI; ready for right-to-left | 4.6 (every field with its step), logical properties (6.5), `dir="auto"` and `messageLocale` (2.3, 9.3) | 1 (currency, logical properties, `dir="auto"`); 3 (symbol); 5 (message language); 8 (reminder timing) |

---

## 12. Open questions for the owner

Only decisions that are really the owner's. Each has a default, so building does not wait, **with one exception: Q2**, which is asked at the start of step 1b because its answer decides where the real client list is typed.

| # | Question | Why it matters | Our default if no answer |
|---|---|---|---|
| Q1 | Do clients ever pay late, pay part of the price, or pay in advance for a package of sessions? | Decides whether the app shows a Price next to "Amount paid". Packages are common in laser courses. | **No.** One field, "Amount paid"; a package client's later sessions are one tap, "0 today". If you say yes, "Track what clients owe" is switched on for you, and a package shows as "Credit 1,000 (about 4 sessions)". The switch can be turned on any day with no loss of data. (Needed before step 3.) |
| Q2 | Two parts. (a) May the app's code be published at a web address, so that it opens on your phone? Publishing uses GitHub Pages; the code folder becomes public. Your client data is never published. (b) After trying the app on the computer and on the phone with example clients: where should your client list live? | The daily loop (finish a session at the chair, send a WhatsApp in one tap) is a phone loop; on a computer each WhatsApp message takes more clicks (section 8). Phone and computer do not share data, and an iPhone cannot open the file directly. Also: the double-clicked file shares its browser storage with any web page saved to that computer and opened in the same browser (3.1); the web address does not. | **No default: you are asked at the start of step 1b.** If you prefer not to publish, the app stays on the computer by double-click, phone checks are done at phone width, and you can change your mind at any later step. Moving the list later takes one backup and one import. |
| Q3 | Which currency and which country code for phone numbers? | Money display and WhatsApp links. | Suggested on the Welcome card from your device's region, for you to confirm or change; nothing is saved before you tap Start. One thing to know: a number typed with a leading 0 has that 0 dropped when the country code is added, which is right in most countries and wrong in a few. The line "WhatsApp will use +..." under each phone number shows what the app understood. |
| Q4 | Are the reminder defaults right: 2 days before, and 2 hours before on the day? Do most of your clients use WhatsApp? If you will send from a computer: do you have WhatsApp Desktop on it? | Sets the starting values in step 8, which send button is first, and what a WhatsApp tap does on a computer (tried on your own number in step 1). | **2 days, 2 hours, WhatsApp first.** All changeable in Settings. |
| Q5 | Beyond hair colour, hair thickness and notes, do you want optional "treated areas" and "skin type" on the client card? Do you want any medical checklist (medication, pregnancy, patch test, consent)? | Health details would sit unencrypted in the browser and in backup files; the privacy rules of your country apply to you, and we cannot judge them. | **Areas and skin type as optional chips under "More"; no medical checklist.** Use special notes for anything else. |
| Q6 | In which language do you write to clients? | The default message texts are in English, and so are the dates inside them, until you choose another language under "Dates in messages are written in". | **English texts and English dates, both changeable.** Each text can be rewritten in any language from the step that first sends it: the rebook message in step 5, the lead message in step 6, the two reminders in step 8. (Needed before step 5.) |
| Q7 | Roughly how many existing clients and how much history do you want to enter? Do you have them in a list (Excel, phone contacts)? | Above about 50 clients a one-time import from a list is worth building in step 2. | **Typed by hand** with "Save and add another" and "Client since: Earlier". For history, two numbers per client ("Sessions already done", "Already paid in total") instead of every past treatment; single past treatments only where you want the dates. (Needed before step 3.) |
| Q8 | Do you want the "set aside X% to invest" line on Progress? | Your stated motivation (R7). | **Off.** One tap on Progress turns it on. |
| Q9 | After step 8, do you still want the request link (R11)? | It is optional and needs publishing (Q2). | **Skip it.** |

---

## Appendix A. Judges' must-fix items and where each is fixed

| Judge | Must-fix | Fixed in |
|---|---|---|
| Requirements | Define the actual palette with dark text on yellow; check on a phone | 6.1, 6.2, 5.4 (solid yellow where the owner must act); step 1 check 24 and step 1b check 17 |
| Requirements | Same-day reminder red all day; missed days-before reminder never red | 5.2, 9.2 |
| Requirements | "Asked" contradiction; what happens after 7 days | 4.9 rule 18, 9.6 |
| Requirements | Clients with no session fall out of every list | D7, 7.3 "Not booked yet", 9.6 |
| Requirements | No prompt while closed; explain "automatic" at step 1 | 9.8 (step 8), 3.9 Welcome text (step 1) |
| Requirements | "At the meeting time" not delivered; lead time must be a setting | `sameDayHoursBefore`, 9.2 |
| Requirements | Date chips need a clash warning and must come with the first booking step | 9.5; step 4 |
| Requirements | Monthly list: one row per month with people, new clients, money | 7.7 table |
| Requirements | Editable client-since date | 4.3, 7.9, step 1 check 12, step 2 check 4 |
| Requirements | Leads buried; need their own place and a short form | D4, 7.6, 7.9 Lead form |
| Requirements | Plain-language home-device decision in step 1 | 3.9, Q2; explained in step 1, decided in step 1b after trying both devices (D20) |
| Requirements | Ask the owner the money question before money is built | Q1; D1 makes either answer safe |
| Daily use | Slim the Finish sheet; never fold old debt in silently | 7.9 Finish |
| Daily use | Reminder throughput | 9.7 run |
| Daily use | Early appointments | 9.2 evening-before window |
| Daily use | Week chips must never give a past date | 9.5 |
| Daily use | Where the clash warning's length comes from | `sessionMinutes` (4.6), 9.5 |
| Daily use | Too much yellow | 5.4 (seven triggers) |
| Daily use | "Due now" flood for new or imported clients | D7 |
| Daily use | Data-safety basics in step 1 | 3.3, 3.6; step 1 (safe saving, backup file, one copy before import); 3.5; step 1b (automatic copies, device check) |
| Daily use | Calendar alarm ships with reminders | Step 8 |
| Daily use | Prune settings | 4.6 main list, Advanced group |
| Daily use | Do not make the owner wait to record money | Step 3 comes before booking |
| Daily use | End-of-day line | 7.2 Today header |
| Daily use | Prepaid package case explicit | 4.10 examples 2 and 3; step 3 check 9 |
| Daily use | Thumb-friendly phone layout; one reminder state per row | 6.4 floating +, 5.4 |
| Daily use | Concrete home-device choice incl. iPhone Home Screen | 3.9; step 1b |
| Buildability | `file://` script loading | 2.4, step 1 check 1; step 1b check 5 |
| Buildability | XSS rule; all-or-nothing import validation | 2.6, 3.7 (a broken structure rejects the whole file; small faults are repaired and listed, D22); step 1 checks 10 and 14 |
| Buildability | Step 1 overloaded; split the scheduling step | D10; steps 1 to 5 |
| Buildability | Three separate stores; namespaced keys; never `clear()` | 3.1, guards spec |
| Buildability | Failed saves | 3.3; step 1 check 17 |
| Buildability | Two-tab overwrite | 3.3; step 1 check 16 |
| Buildability | Date arithmetic; double-clickable tests | 2.6, 2.7, 4.1 |
| Buildability | Id generation fallback | 4.1 |
| Buildability | Payment integrity rules | 4.8 |
| Buildability | Late-booking reminder bug | `scheduledOn`, 9.2 rule 3 |
| Buildability | Money edge cases (decimals, currency change, parsing, symbol) | 4.1, 4.6 |
| Buildability | Send links needed from step 1; phone normalisation; save before navigating | 9.4; step 1 check 9; 3.3 |
| Buildability | Unbounded growth | D2 (no log), 3.5 caps, 3.4 purge, storage meter (7.8) |
| Buildability | Unsafe inbound prefill link; owner's number in a public page | D11, step 9 |
| Buildability | Export on iPhone | 3.6 share and copy paths; device check (3.9); step 1b check 14 |
| Buildability | Read-only mode replaced by a blocking message; version stamp | 3.4, 7.8 |

## Appendix B. Risks, and what is left out on purpose

**Risks, most severe first**
1. **The browser erases the data** (cleared history, Safari's 7-day rule on hosted pages, a new browser). Only an exported file is safe. Mitigation: backup from step 1; a backup counts only when a file really exists, and the first one is checked (3.6); nudges at 7 and 30 days; automatic copies; Home Screen install on iPhone.
2. **Phone and laptop hold separate data.** Mitigation: one home device, chosen in step 1b after trying both; export and import to move.
3. **Privacy.** Client data is readable text in the browser and in backup files, and this repo is pushed to GitHub. Mitigation: backup file names are git-ignored, tests and fixtures use invented people, the owner's number is never in the repo, and the app says plainly what is stored.
4. **The double-clicked file shares its storage with every local web page** (3.1). A web page saved from an email or a download and opened in the same browser could read or overwrite the client list. This cannot be fixed in code under T2. Mitigation: it is stated in the device check, in question Q2 and in the README; the copy at the web address does not have this weakness and is the recommended home when the owner agrees to publish.
5. **Safari, the iPhone and the real messaging apps are unverified.** Mitigation: the boot-failure message, the device check, the link check on the owner's own number in steps 1 and 1b, and an owner's-device check in every step.
6. **"Automatic" expectations.** Mitigation: plain words at first run and in every send screen; the daily alarm.
7. **A wrong "sent" mark.** The app marks a message before the other app has sent it. Mitigation: the "Sent to ...?" strip on return and "Not sent, reopen" on every marked row (9.4).

**Left out on purpose** (each can be added later without a redesign): login, cloud sync, unattended sending; calendar grid, per-appointment duration, week-start setting; packages as objects, invoices, tax, payment methods; medical checklist, patch test, consent tracking, device settings per session, photos, ID numbers, card details; lead sources and pipeline boards; hair-colour swatches; dark mode; a second interface language (the layout is already right-to-left ready, and owner-typed text is already shown in its own direction); CSV import (see Q7); the inbound prefilled booking link (see D11).

## Appendix C. Review notes and where each was applied

Two critics reviewed version 1.0: **completeness** (C) and **skeptic** (S). Every blocker and major note was applied; S's suggestion to publish inside step 1 was applied as step 1b, to keep step 1 small. One minor note was not applied.

| # | Critic, severity | Note | Where applied |
|---|---|---|---|
| 1 | S blocker; C major | The money-parse rule contradicted its own examples (`12.345` read as 12,345.00) | 4.1: new rule and a 20-row table that is the unit test; live "= 1,150.00" line; step 3 check 3 |
| 2 | S blocker | The double-clickable test page shared the real data store | 2.5 `STORE_NAME`; 2.7 three guards; step 1 check 22 |
| 3 | S blocker | A value a form accepted could make a later backup refuse to load | D22; 2.6 one set of rules; 3.3 validation on every save; 3.7 structural and soft faults; email rule in 4.3; round-trip test in 2.7 |
| 4 | C major; S major | The phone rule contradicted its table (`12345` accepted) | 9.4 rule 8, a 12-row table that is the unit test, the known limit, the display form |
| 5 | C major | Step 4 needed a module created in step 5 | `reminders.js` is created in step 4 with `todo` and `signature` (2.1, 2.4, 5.3, steps 4 and 5) |
| 6 | C major; S major | No step put the app on the phone; the home device was allowed to default | D20; step 1b; 3.9; Q2; section 11 rows T1 to T6 |
| 7 | C major; S major | Messages were sent two steps before they could be edited; dates could mix two languages | 9.3: each editor ships with its first message (steps 5, 6, 8); `messageLocale`; Q6 |
| 8 | C major | The Advanced settings had no step | 4.6 Step column; each step's Built list and checks |
| 9 | C major | The date chips could leave out the client's own interval | 9.5; 7.9; step 4 check 3; step 5 check 2 |
| 10 | C major; S major | The amount prefill could record money that was not paid (package of 1,500) | 7.9 prefill rules; 4.10 examples 1 to 3; step 3 check 9; step 4 check 8; Q1 |
| 11 | C major | A lead follow-up row could not be closed by its own button | 7.6; 9.4; 5.3; step 6 check 5 |
| 12 | C major; S major | Clients typed in step 1 were counted as new; R4 needed every past treatment typed | D19; "Client since" in the step 1 form; `priorSessions`, `priorPaidMinor`; `meta.startedOn`; 4.9 rules 4, 5, 7, 13; 4.10 example 6 |
| 13 | C major | The Welcome card had no state | `meta.welcomeDone`; 3.9; step 1 check 5 |
| 14 | C major | The device check could not be tested and `ok` was undefined | 3.9: four line states, required lines, `ok`; `laser.session`; step 1b checks 5 and 6 |
| 15 | S major | Any local web page can read the data of the double-clicked file | 3.1; device check advisory; Q2; Appendix B risk 4; README |
| 16 | S major | "Backup saved" was shown without knowing a file existed | 3.6: four ways out and when each counts; "Check your backup"; step 1 check 13; step 1b check 7 |
| 17 | S major | A "sent" mark had no lasting way back | 9.4 "Sent?" strip and "Not sent, reopen"; `laser.ui`; step 5 check 9; step 8 check 2 |
| 18 | S major | Tap counts described a phone; WhatsApp on a laptop is slower | `whatsappOnComputer` (4.6, 9.4); section 8 laptop paragraph; link checks in steps 1 and 1b |
| 19 | S major | The timing defaults made early appointments red before the alarm | 9.2: "early" is derived, red only in the last 60 minutes, five worked cases; 9.8 evening event; D6; step 8 checks 4 and 5 |
| 20 | S major | Lapsed and non-answering clients were red for ever | D18; 4.9 rule 18 (`lapsed`, `noAnswer`, `rebookAsks`); 9.6; 7.3; step 5 checks 3 and 8 |
| 21 | S major | On a phone the summary came after a screen and a half; Today and To do repeated each other | 7.2 summary strip; 5.3 (one reminder row, nothing twice, five rows on a phone) |
| 22 | S major | Action rows did not fit a phone | 6.4 three-line row; badge words of at most about 16 characters (5.1); 320px checks in steps 1, 4 and 5 |
| 23 | S major | Green was used for "Reminded" and "Asked" | D17; 5.1; 5.2; 9.2; 9.6; step 7 check 13; step 8 check 14 |
| 24 | S major | Nothing drawn was actually yellow | 5.4 and 6.4: solid bars and solid badges in Today and To do; 6.2 |
| 25 | S major | Example records were mixed with real ones | D16; 3.10 Example mode; no `demo` field (4.3 to 4.5) |
| 26 | S major | Step 1 was still the largest step; the first screen was three paragraphs and five chores | D10; step 1 and step 1b; 3.9 (three one-line statements, three-item checklist, device check runs by itself) |
| 27 | S major | Half-typed forms were lost when the phone discarded the page; returning to the app wiped a search | 2.6 rendering rule 3 and Recalculation; step 1 check 18; step 2 check 12; step 4 check 13 |
| 28 | S major | The published copy needed the network every time | 2.8 `sw.js`; step 1b checks 9, 11, 12 and 15 |
| 29 | C minor | The request link could not be built from the double-clicked file | `requestPageUrl` (4.6); step 9 check 7 |
| 30 | C minor; S minor | Test guards conflicted with the tests; Playwright output landed in the repo root | 2.7 (stubbed WhatsApp address, scoped guards, config lines); 2.1 `.gitignore` |
| 31 | C minor | Step 7's "no red" check failed by design | `data-tone` (2.6, 5.4); step 7 check 11 |
| 32 | C minor | The run counter could not survive a reload | 9.7 "N left"; step 8 check 10 |
| 33 | C minor | Three test instructions could not be followed | 2.7: `makeFixture`, validation on every save, failed save simulated from the test |
| 34 | C minor; S minor | "Best" badge was yellow and growth was green | 5.2, 5.4, 6.4: both blue; early-month amounts instead of a percent (4.9 rule 14) |
| 35 | C minor | What "Track what clients owe" does was never stated in one place | 4.8 rule 12; 5.2; step 3 check 10; step 7 check 7; 4.10 example 5 |
| 36 | C minor | Step 1 gaps: no place for Delete, live lines in a sheet, phone display form, reading guide, Copy in core | 7.4 and 7.9 (Delete); 2.6 rule 1; 9.4 display; "How to read it"; 2.2 |
| 37 | C minor | State used on screens but missing from the model or routes | `dailyAlarmDays`, `meta.persist`, sheets `followUp` and `invest`, "Show all" in place, `?sort=` (4.6, 4.7, 2.6) |
| 38 | C minor | "One obvious button per row" was contradicted; a no-show could not be closed from Home | Principle 3; overflow on Today and To-do rows (5.3, 7.2); flow 13 |
| 39 | C minor | "New leads" not shown as a number; the "Change" column was unclear | Summary strip "Open leads" with "N new"; column "Money vs month before" (7.7) |
| 40 | C minor | A check that tested nothing; "each form fits one phone screen" was not true | Principle 4 reworded; step 2 check 1 |
| 41 | C minor; S minor | Owner-typed text in another language and direction | `dir="auto"` (2.3, 2.6, 6.4); a Hebrew name in the fixtures; step 1 check 10 |
| 42 | C minor | Sequencing slips in steps 2 to 4 | Next visit column in step 4; `#/schedule` opens Done in step 3; per-client weeks moved to step 4 |
| 43 | S minor | The selected segment of a segmented control was invisible (1.13:1) | 6.4 Segmented control; 6.2 |
| 44 | S minor | Currency decimals could differ between browsers; unknown codes were accepted; no rounding rule for the invest line | `currencyDecimals` (4.1, 4.6); `Intl.supportedValuesOf`; 4.9 invest rounding |
| 45 | S minor | Email, SMS and emoji link details | 9.4 links table; step 1 check 9; step 8 check 12 |
| 46 | S minor | Every double-click made the older tab show a red banner | 3.3 two-tab guard (silent reload unless something is being typed); step 1 check 16 |
| 47 | S minor | A client finishing the course had to be found again later | "Course finished" in the Finish sheet (7.9, 9.5); step 5 check 2 |
| 48 | S minor | Focus was lost after Save | 2.6 rendering rule 4; step 2 check 12 |
| 49 | S minor | Move Leads to step 3 | **Not applied.** See D21: Leads' Message button, To-do rows and "Convert and book" need steps 4 and 5, so the move would split one step over three and delay recording money, which the judges asked to have early. Leads stays at step 6. |

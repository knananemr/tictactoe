# Nearby — iPhone app blueprint

How to take the Nearby web app in this folder to a published iPhone app, one step at a time.
Written for a Claude Opus 5.5 session running with ultracode (the builder) and for the owner.

**Builder: read sections 1–4 once, then do the first unticked step in section 5. Tick it when its "Done when" list is true.
Do one step per session unless the step is small. Stop at every "Owner gate" and ask the owner plainly for what is needed.**

## Progress

- [ ] Step 0 — Owner setup (accounts, name, Mac)
- [ ] Step 1 — Make the project buildable and split into modules
- [ ] Step 2 — Put all data behind one async store (still local)
- [ ] Step 3 — Build the backend (Supabase)
- [ ] Step 4 — Connect the app: sign-in, owner flows, reports, account deletion
- [ ] Step 5 — App screens from the mock-ups: tab bar, favourites, More
- [ ] Step 6 — Native iPhone shell (Capacitor)
- [ ] Step 7 — TestFlight and testing on a real iPhone
- [ ] Step 8 — Store listing and compliance pack
- [ ] Step 9 — Submit to App Review and release
- [ ] Step 10 — After launch (Android, payments, booking)

## 1. Decisions already made

| Topic | Decision | Why |
| --- | --- | --- |
| How the app is built | Keep the existing web app as the one UI codebase and wrap it with **Capacitor** into a real iOS app. No rewrite. | The UI is already phone-first, right-to-left, themed and covered by 231 checks. The same code later becomes the Android app. |
| Backend | **Supabase**: Postgres database, sign-in, photo storage, row-level security, Edge Functions. | Today shops live only in one browser. A published app needs shared data, owner accounts and moderation. |
| Version 1 scope | Customers: browse, search, near me, shop page, call, WhatsApp, directions, share, favourites. Owners: sign in, add / edit / delete their shop with photos. Everyone: report a shop. | This is what the web app does today, plus what Apple requires for an app with accounts and user content. |
| Not in version 1 | Booking, payments, reviews, push notifications, coupons, Arabic, iPad layout. | Each is a project of its own. See Step 10. |
| Customers | No account. Favourites are stored on the phone. | Less friction, less personal data. |
| Owner sign-in | **Sign in with Apple** and **email + password**. No phone-number SMS codes in version 1. | Free, and App Review can use a normal demo account. SMS costs money per message. |
| New shops | A new shop is **pending** until the owner of Nearby approves it; then it is public. | Apple requires a way to filter user content. It also keeps fake shops out. |
| Location | The phone's location **never leaves the phone**. The app downloads the shop list and sorts by distance on the device. | Simple privacy answer for Apple and for users. |
| Money | The iPhone app is **free and contains no payment or pricing screens**. The monthly plan for shops is handled later, outside the app. | Selling a digital subscription inside an iOS app must use Apple's in-app purchase. Avoid the whole topic in version 1. |
| Devices | iPhone only, portrait, light mode. | Matches the mock-ups; iPad screenshots and layouts are then not needed. |
| Languages | Hebrew (main) and English. | As today. |

## 2. What only the owner can do

The builder cannot do these. Step 0 collects them.

1. **Apple Developer Program**: enrol at developer.apple.com (about US$99 a year). Enrolling as an individual is fastest; the seller name shown in the App Store is then your legal name. An organisation needs a registered company and a D-U-N-S number.
2. **App name and bundle ID**: the store name must be unique in the App Store and "Nearby" alone is almost certainly taken. Pick a name of at most 30 characters (for example "Nearby – קרוב אליי"). Pick a bundle ID once and never change it (for example `com.<yourname>.nearby`).
3. **A Mac with the current Xcode** and an iPhone for testing. Steps 6–9 should run in Claude Code **on that Mac**, not in a cloud session, because only a Mac can build and sign an iOS app.
4. **Supabase account and two projects** (`nearby-dev`, `nearby-prod`). Note: free projects are paused after about a week without use, so production should be on the paid plan before launch.
5. **A domain and an email address** for the public site, the privacy policy, the support page and outgoing email (password reset).
6. **Legal texts**: the builder drafts the privacy policy, terms of use and accessibility statement in Hebrew and English. A lawyer who knows Israeli privacy, consumer and accessibility law should read them before launch.
7. **Real shops**: App Review, and real users, must see real content. Aim for at least 15 real shops approved before submitting.
8. **App Store Connect forms**: agreements, the privacy questionnaire, age rating, and pressing Submit. The builder prepares every answer.

## 3. Rules for the builder

- Work on the branch your session gives you. Short commit messages. Push after every meaningful change. Never commit `.env`, keys or `.p8` files.
- The web app must keep working at every commit: `node tests/suite.js` stays green (231 checks today; add checks as you add features, never weaken one).
- The look is fixed by `THEME-BLUEPRINT.md` and `design/mockups/`. New screens use the same tokens and components.
- Hebrew right-to-left first, English must also work. Every new text string goes into the `TEXT` tables in both languages.
- Do not add booking, payments or pricing screens to the app.
- Do not load the app's code from a remote server in production (no `server.url`, no live-update service). The whole UI ships inside the app.
- Versions move fast. Before installing Capacitor, Supabase tools or Xcode-related tools, read their current documentation and use the latest stable version. Do not trust version numbers from memory.
- Use ultracode workflows for each step: map the work first, build in small pieces that touch different files, then have independent reviewers try to break it, then fix. Give every agent this file and the "Done when" list for its step.

## 4. Target shape

### 4.1 Folder layout (after Step 1)

```
shop-finder/
  index.html            entry page (Vite)
  src/
    main.js             start-up, router
    text.js             TEXT tables (he / en)
    util.js             escaping, formatting, hours, distance, search helpers
    icons.js            ICON map
    store/              data access: index.js (interface), local.js, supabase.js
    views/              home.js, shop.js, form.js, favourites.js, more.js, auth.js
    native.js           everything that talks to Capacitor (no other file does)
    styles.css
  public/fonts/         Heebo and Rubik font files (served locally)
  data.js → src/demo-data.js   demo shops, used only in local mode and tests
  tests/                suite.js, screenshots.js
  supabase/             migrations/, functions/, seed.sql
  ios/                  Xcode project made by Capacitor (committed)
  store/                App Store texts, screenshots, review notes
  site/                 privacy, terms, support, accessibility pages
  capacitor.config.ts, package.json, vite.config.js, .env.example
```

### 4.2 Two modes

- **Local mode** (`VITE_BACKEND=local`): demo shops plus shops saved in the browser, exactly like today. Used by the test suite and the demo page.
- **Supabase mode** (`VITE_BACKEND=supabase`): the real app.

### 4.3 Data model (Supabase)

| Table | Main columns | Who may do what (row-level security) |
| --- | --- | --- |
| `shops` | `id`, `owner_id`, `category`, `name_he`, `name_en`, `about_he`, `about_en`, `address_he`, `address_en`, `phone`, `email`, `lat`, `lng`, `hours` (json, 7 days, same shape as today), `tz`, `status` (`pending`, `published`, `rejected`, `hidden`), `created_at`, `updated_at`, `reviewed_at` | Anyone reads `published`. An owner reads and writes only their own rows and cannot set `status` themselves. |
| `services` | `id`, `shop_id`, `name_he`, `name_en`, `price`, `minutes`, `position` | Follows the shop. |
| `shop_photos` | `id`, `shop_id`, `path`, `position` | Follows the shop. At most 4 per shop. |
| `reports` | `id`, `shop_id`, `reason`, `details`, `created_at`, `handled_at` | Anyone may insert (rate-limited through an Edge Function). Nobody reads from the app. |
| `profiles` | `user_id`, `accepted_terms_at`, `created_at` | A user reads and writes only their own row. |

- Storage bucket `shop-photos`: public read; only the shop's owner writes under `<shop_id>/`; images only; size limit about 1 MB (the app already shrinks photos before upload).
- Edge Functions: `report-shop` (stores a report, emails the Nearby owner), `delete-account` (deletes the user, their shops and photos, and revokes their Sign in with Apple token), `notify-new-shop` (emails the Nearby owner when a shop is pending).
- Moderation in version 1 is done in the Supabase dashboard: change `status`. A shop edited after approval stays public but gets `reviewed_at = null` so it shows up for a second look.

## 5. The steps

### Step 0 — Owner setup

**Goal:** everything in section 2 that later steps need exists.
**Work:** the builder asks the owner for each item below, records the answers (never secrets) in `store/setup.md`, and checks what it can.

- Apple Developer Program: enrolled, team ID known.
- App name (checked as free in App Store Connect when the app record is created), bundle ID, support email, domain.
- Supabase: both projects created; URL and anon key for each put in `.env` files on the machine doing the work; database password and service keys given only through the session's secure secret entry, never pasted into chat.
- Mac: Xcode installed and opened once, Node.js installed, Claude Code installed.

**Done when:** `store/setup.md` lists every item as done or names what is still missing. Steps 1–5 need only Supabase; Steps 6–9 need the rest.

### Step 1 — Make the project buildable and split into modules

**Goal:** same app, same look, but organised so many agents can work on it and Capacitor can package it.
**Work:**
- Add `package.json` and Vite. `npm run dev`, `npm run build` (output `dist/`), `npm test` (builds in local mode, then runs `tests/suite.js dist`).
- Split `app.js` (about 1,650 lines, one closure) into the modules in 4.1. This is a mechanical move: no behaviour change, no renamed ids or classes.
- Serve Heebo and Rubik from `public/fonts/` (Hebrew and Latin subsets, `font-display: swap`) and remove the Google Fonts link. Tighten the Content-Security-Policy accordingly.
- Keep the published demo page working from the built files.

**Done when:** `npm test` passes all checks against `dist/`; the page makes no request to any other host; `screenshots.js` output looks identical to before.
**Ultracode recipe:** one agent maps every function and shared variable in `app.js` and proposes the module boundaries; one agent does the split (single writer, because it is one file); three reviewers compare old and new behaviour (tests, screenshots, a read of the diff for anything dropped); one agent fixes.

### Step 2 — Put all data behind one async store (still local)

**Goal:** the screens stop reading `localStorage` and the demo list directly. They ask a store, and the answer may arrive later or fail.
**Work:**
- `store/index.js` defines the interface: `listShops()`, `getShop(id)`, `myShops()`, `saveShop(draft)`, `deleteShop(id)`, `uploadPhoto(file)`, `reportShop(id, reason, details)`, `session()`, `signIn…()`, `signOut()`, `deleteAccount()`, `onChange(fn)`. All return promises.
- `store/local.js` implements it with today's behaviour (demo shops plus `nearby.myShops`).
- Home, shop page and form use the store. Add the missing states in the Indigo style: loading skeletons, "could not load, try again", offline banner, saving and uploading progress, and a pending-review badge (unused in local mode).
- Search, filters, hours, distance and drafts are unchanged and stay on the device.

**Done when:** all checks pass (update them only to wait for async results); new checks cover the loading, error and retry states by making the store slow or failing; no file outside `store/` touches `localStorage` shop data.
**Ultracode recipe:** map every data read and write; convert one screen per agent (home, shop, form are separate files after Step 1, so they can run side by side in separate worktrees); reviewers hunt for races (double submit, leaving a page mid-load, stale results after a language switch).

### Step 3 — Build the backend

**Goal:** a Supabase project that can be recreated from the repo.
**Work:**
- SQL migrations in `supabase/migrations/` for the tables, constraints, indexes, security policies and storage rules in 4.3. Validate on the server what the form validates today (lengths, phone and email shape, at most 4 photos, hours shape, coordinates in range).
- The three Edge Functions. Email goes through a normal email service set up by the owner.
- Sign-in settings: email + password with email confirmation, Sign in with Apple, password rules, redirect addresses for the app and the site.
- `seed.sql` puts the ten demo shops into the **dev** project only.
- A security test script that signs in as: nobody, owner A, owner B, and proves each rule (for example: B cannot edit A's shop; nobody can read `reports`; a pending shop is invisible to others; an owner cannot publish their own shop; a fifth photo is refused).

**Done when:** a fresh project built from the migrations passes the security test script; the dev project is seeded; nothing secret is in the repo.
**Owner gate:** project keys and the email service account.
**Ultracode recipe:** one agent writes the schema; separate agents write the policies, the functions and the test script from the 4.3 table alone; three adversarial reviewers each try to read or change data they should not, and to bypass the photo and report limits.

### Step 4 — Connect the app

**Goal:** in Supabase mode the app shows real shops and an owner can run their shop from the phone.
**Work:**
- `store/supabase.js` implements the Step 2 interface. Download published shops once per session (page through them), keep the last good list on the device for offline use, compute distance on the device.
- Sign-in screen (Indigo style): Sign in with Apple button built to Apple's design rules, email + password, create account with the terms checkbox, forgot password.
- "My shop": the owner's shop with its status (pending, public, rejected with the reason), edit, delete.
- The form saves to Supabase: photos upload with progress and can be retried; a failed save keeps the draft.
- "Report this shop" on the shop page: a short form with reasons.
- "Delete my account" inside the app, with a clear confirmation. It must fully delete, not just sign out.
- Update the Content-Security-Policy for the Supabase address. Friendly messages for no network, expired session and server errors.

**Done when:** new checks pass against a mocked Supabase (Playwright intercepts the network) for every flow above; a manual run against `nearby-dev` works end to end; local mode still passes the old checks.
**Ultracode recipe:** one agent per flow in its own file (auth, my shop, report, account deletion); reviewers: security (what the client can send that the server must refuse), failure handling (kill the network at every step), and wording in Hebrew and English.

### Step 5 — App screens from the mock-ups

**Goal:** it feels like the app in `design/mockups/03-home.jpg`, with every control doing something real.
**Work:**
- **Bottom tab bar** on phones: Home, Favourites, My shop, More. The current tab is the indigo pill from the mock-up. It respects the bottom safe area and hides while the keyboard is open.
- **Favourites**: a heart on each card and on the shop page (the mock-up position), a Favourites screen, stored on the phone.
- **More**: language, about, privacy policy, terms, accessibility statement, contact support, sign out, delete account, app version.
- The header loses the add-shop and language buttons on phones (they now live in the tabs and in More).
- Page changes slide gently; long lists keep their scroll position when you come back.

**Done when:** checks cover the tabs, favourites and More in both languages; no screen scrolls sideways from 320px to 430px wide; VoiceOver labels exist for every new control.
**Ultracode recipe:** one agent per screen; a look reviewer compares with the mock-ups; an accessibility reviewer measures contrast, focus order and touch sizes.

### Step 6 — Native iPhone shell

**Goal:** an Xcode project that builds the app and runs it in the iPhone simulator.
**Where:** Claude Code on the owner's Mac.
**Work:**
- Install Capacitor (latest stable) with `webDir: dist`, the chosen bundle ID and app name, then add the iOS platform. Commit the `ios/` folder.
- `src/native.js` is the only place that calls Capacitor, and every function has a web fallback:
  location (ask only when the user taps "near me"; if refused, explain how to turn it on in Settings), share sheet, opening phone / WhatsApp / Waze / Maps / email outside the app, light haptics on key taps, status bar style, keyboard behaviour, refresh when the app returns to the front, swipe-back gesture.
- **Share links must be public web addresses** (`https://<domain>/#/shop/<id>`), never the app's internal address.
- Xcode settings: iPhone only; portrait; light mode only; deployment target as Capacitor recommends; display name; Hebrew and English listed as languages; version 1.0.0, build 1.
- Permission texts in Hebrew and English: location when in use ("to show shops near you"), camera ("to take a photo of your shop"). The photo picker in the form offers "Take photo", so the camera text is required or the app will crash.
- Sign in with Apple capability. Privacy manifest file. The "uses no special encryption" setting.
- App icon (the indigo pin on white, 1024px, no transparency) and a launch screen (pale lavender with the logo).
- Text follows the iPhone's text-size setting without breaking layouts up to at least 130%.

**Done when:** `npm run build && npx cap sync ios` is clean; the app builds for the simulator from the command line; simulator screenshots of home, shop, form, favourites and More match the web screenshots; every `native.js` function has been tried in the simulator (calls and the camera need a real phone: Step 7).
**Ultracode recipe:** one agent sets up the project; then separate agents own `native.js`, the Xcode settings and assets; a reviewer checks every item above against Apple's current documentation; a second reviewer runs the simulator and looks at the screens.

### Step 7 — TestFlight and a real iPhone

**Goal:** the owner uses the real app on their own iPhone and nothing is broken.
**Work:**
- Signing with the owner's Apple team (automatic signing). Create the app record in App Store Connect. Archive and upload a build. Add the owner as an internal tester.
- A written test plan in `store/test-plan.md`, run on a small and a large iPhone: Hebrew and English; location allowed, refused, and turned off; airplane mode and slow network; photo from camera and from library; keyboard over every field; notch and home-bar areas; swipe back; call, WhatsApp, Waze, Maps and share; sign in with Apple; create, edit and delete a shop; report; delete account; larger text size; VoiceOver through the main flows.
- Fix what the test finds and upload a new build each time (raise the build number).

**Done when:** the owner has gone through the whole test plan on their phone and every line is marked passed.
**Owner gate:** the owner installs TestFlight and does the testing.

### Step 8 — Store listing and compliance pack

**Goal:** everything App Store Connect asks for is ready in `store/` and on the public site.
**Work:**
- Public site in `site/`, published on the owner's domain: privacy policy, terms of use (including zero tolerance for abusive content), support and contact page, accessibility statement, each in Hebrew and English. The web app is published there too so share links work.
- Store texts in Hebrew (main) and English: name, subtitle, description, keywords, promotional text, what's new.
- Screenshots in the sizes Apple currently requires for iPhone, made from the simulator with real-looking content, Hebrew and English.
- Prepared answers: privacy "nutrition label" (owner email and account id; shop content and photos; no location; no tracking; no ads), age rating, category (Lifestyle), content rights, export compliance.
- Review notes: what the app is, that it serves Israel, a demo owner account (email and password) with an approved shop, and how reports and removals work.

**Done when:** every App Store Connect field has a prepared answer in `store/listing.md`; the site pages are live; screenshots are in `store/screenshots/`.
**Owner gate:** a lawyer's review of the legal pages.

### Step 9 — Submit and release

**Goal:** the app is on the App Store.
**Work:** fill the listing from `store/listing.md`, attach the tested build, set price to free, choose where it is available (Israel only at first), submit. If Apple rejects, read the exact rule they cite, fix that, reply politely in the Resolution Centre and resubmit.
**Done when:** status is "Ready for Distribution" and the owner has installed it from the App Store.
**Owner gate:** the owner presses Submit and answers any message from Apple.

### Step 10 — After launch

In rough order: Android from the same code (Capacitor, Google Play account), links that open the app directly, the paid monthly plan for shops (billed outside the app; check Apple's current rules before showing any price or link inside the app), booking, push notifications, reviews, Arabic.

## 6. Why Apple might reject it, and the answer already built in

| Rule (App Review Guidelines) | Risk | Built-in answer |
| --- | --- | --- |
| 4.2 Minimum functionality | "This is just a website in a wrapper" | UI ships inside the app; tab bar, favourites, native location, share, camera, haptics, offline list. |
| 1.2 User-generated content | Shops are posted by users | Approval before publishing, Report on every shop, removal within 24 hours, terms accepted at sign-up, contact details in the app. |
| 5.1.1(v) Account deletion | Accounts can be created | "Delete my account" inside the app, full deletion. |
| 4.8 Login services | Third-party sign-in | Sign in with Apple is offered. |
| 5.1.1 / 5.1.2 Privacy | Data use unclear | Privacy policy in the app and the listing; location stays on the phone; no tracking. |
| 3.1.1 In-app purchase | Selling digital plans outside Apple's system | No prices or payments in the app. |
| 2.1 App completeness | Crashes, empty app, no demo account | Step 7 test plan; real shops; demo account in review notes. |
| 2.3 Accurate metadata | Screenshots show features that do not exist | Screenshots are taken from the real build. |

## 7. Secrets

| Secret | Where it lives | Never |
| --- | --- | --- |
| Supabase URL and anon key | `.env` (not committed); safe to ship inside the app | — |
| Supabase service key, database password | Edge Function secrets, the owner's password manager | in the repo, in the app, in chat |
| Sign in with Apple key, App Store Connect API key (`.p8`) | Supabase dashboard / the Mac's keychain | in the repo |
| Email service key | Edge Function secrets | in the repo |

`.env.example` lists the names with empty values.

## 8. Costs to expect

Apple Developer Program about US$99 a year · Supabase paid plan for production about US$25 a month · domain about US$10–20 a year · email service free tier at this size · everything else free.

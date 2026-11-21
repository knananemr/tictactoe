# Nearby — iPhone app blueprint

How to take the Nearby web app in this folder to a published iPhone app, one step at a time.
Written for a Claude Opus 5.5 session running with ultracode (the builder) and for the owner.
Facts about Apple, Capacitor and Supabase were checked on 21 November 2026. Section 9 lists what could not be confirmed.

**Builder: read sections 1–4 once, then do the first unticked step in section 5. Tick it when its "Done when" list is true.
Do one step per session unless the step is small. Stop at every "Owner gate" and ask the owner plainly for what is needed.**

## Progress

- [ ] Step 0 — Owner setup
- [x] Step 1 — Make the project buildable and split it into modules (repo move still waiting for the owner's new repo; do it first in the next session that has it)
- [ ] Step 2 — Put all data behind one store (still local)
- [ ] Step 3 — Build the backend (Supabase) and email
- [ ] Step 4 — Connect the app: sign-in, owner flows, report, hide, delete account, admin
- [ ] Step 5 — Publish the web app and the public site
- [ ] Step 6 — App screens from the mock-ups: tab bar, favourites, More
- [ ] Step 7 — Native iPhone shell (Capacitor)
- [ ] Step 8 — TestFlight and testing on real iPhones
- [ ] Step 9 — Store listing and compliance pack
- [ ] Step 10 — Submit to App Review and release
- [ ] Step 11 — After launch

## 1. Decisions already made

| Topic | Decision | Why |
| --- | --- | --- |
| How the app is built | Keep the existing web app as the one UI codebase and wrap it with **Capacitor** into a real iOS app. No rewrite. | The UI is already phone-first, right-to-left, themed and covered by 231 checks. The same code later becomes the Android app. |
| Backend | **Supabase**: Postgres database, sign-in, photo storage, row-level security, Edge Functions. | Today shops live only in one browser. A published app needs shared data, owner accounts and moderation. |
| Version 1 scope | Customers: browse, search, near me, shop page, call, WhatsApp, directions, share, favourites, hide a business, report a business. Owners: account, add / edit / delete their shops with photos, delete their account. Nearby's owner: a small admin screen to approve, reject, hide and ban. | What the web app does today, plus what Apple requires of an app with accounts and user content. |
| Not in version 1 | Booking, payments, reviews, push notifications, coupons, Arabic, iPad layout, Sign in with Apple or Google, links that open the app directly. | Each is a project of its own. See Step 11. |
| Customers | No account. Favourites and hidden businesses are stored on the phone. | Less friction, less personal data. |
| Owner sign-in | **Email + password only**, with email confirmation and password reset. | Apple's rule 4.8 demands Sign in with Apple only when a third-party login (Google, Facebook) is offered. Leaving both out removes a plugin, token revocation and relay-email set-up, and gives App Review a normal demo account. |
| Shops per owner | Up to 5 per account. | The code already keeps a list; the limit stops abuse. |
| New shops | A new shop is **pending** until Nearby's owner approves it. Edits to an approved shop go live at once, and the admin is emailed to take a second look. | Apple requires a way to filter user content. It also keeps fake shops out. |
| Location | A **customer's** location never leaves the phone: the app downloads the shop list and sorts by distance on the device. An **owner** may tap "use my current location" in the form to place their shop; that one point is saved as the shop's public position. | Honest privacy answer: location is collected for owners only. |
| Money | The iPhone app is free. It shows **no price, no "subscribe" or "upgrade" button, no link to a pricing page, and no text about paid plans**, and neither do its store page or the pages it links to. | In every storefront except the US, Apple forbids steering users to payment outside in-app purchase (rules 3.1.1, 3.1.3). Listing a shop stays free in version 1. |
| Devices | iPhone only, portrait, light mode. | Matches the mock-ups; no iPad layouts or screenshots needed. |
| Languages | Hebrew (main) and English. First launch: Hebrew if the phone is in Hebrew, otherwise English; the choice is then remembered. | As today. |
| Tool versions | Capacitor 8.x for the whole of version 1 (needs Xcode 26+, Node 22+, iOS 15+; uses Swift Package Manager, so no CocoaPods). Do not move to a new major version mid-project. | Checked Nov 2026. Capacitor 9 is in preview and needs Xcode 27. |

## 2. What only the owner can do

The builder cannot do these. Step 0 collects them.

1. **Apple Developer Program**: US$99 a year. A sole trader (עוסק פטור / מורשה) enrols as an Individual, and your legal name becomes the seller name in the App Store. An Organisation needs a registered company, a D-U-N-S number and a company website.
2. **App name and bundle ID**: the store name must be unique and at most 30 characters; "Nearby" alone is almost certainly taken (for example "Nearby – קרוב אליי"). The bundle ID is chosen once and never changes (for example `com.<yourname>.nearby`).
3. **A Mac that can run Xcode 26 or newer**, and an iPhone. Apple accepts uploads only from Xcode 26+ (rule since April 2026), and the current Xcode needs a recent macOS (Tahoe 26). Check this before paying for anything. Steps 7–10 run in Claude Code **on that Mac**.
4. **A new private GitHub repository** called `nearby-app` (recommended). Today the app lives in a sub-folder of the `tictactoe` repo; an app with a backend, hosting and an Xcode project deserves its own.
5. **Supabase**: two organisations, each with one project: "Nearby" on the Pro plan holding `nearby-prod`, and "Nearby dev" on the free plan holding `nearby-dev` (a free project pauses after a week without use; un-pause it in the dashboard). Production can stay on the free plan until real shops are being added.
6. **A domain, a Cloudflare account and an email-sending service** (Resend or Brevo): the domain's DNS is managed at Cloudflare, which also hosts the public site for free.
7. **Legal texts**: the builder drafts the privacy policy, terms of use and accessibility statement in Hebrew and English. A lawyer who knows Israeli privacy, consumer and accessibility law should read them before launch.
8. **Real shops**: App Review and real users must see real content. From Step 5 onwards, shop owners can sign up on the web app. Aim for at least 15 approved shops before submitting.
9. **App Store Connect**: agreements, the forms, and pressing Submit. The builder prepares every answer.

## 3. Rules for the builder

- Work on the branch your session gives you. Short commit messages. Push after every meaningful change. Never commit `.env` files, keys or `.p8` files.
- The web app must keep working at every commit: `npm test` stays green (231 checks today; add checks as you add features, never weaken one).
- The look is fixed by `THEME-BLUEPRINT.md` and `design/mockups/`. New screens use the same tokens and components.
- Hebrew right-to-left first; English must also work. Every new text goes into the text tables in both languages.
- No booking, payments, prices or plan mentions anywhere in the app (see "Money" in section 1).
- The whole UI ships inside the app. No `server.url`, no live-update service, no code loaded from a server in production.
- Secrets never go into chat or the repo. Ask for them through the session's secure secret prompt.
- Before installing or configuring Capacitor, Supabase, Cloudflare or Xcode tooling, read their current documentation. Section 9 lists facts to re-check.
- Use ultracode workflows for each step: map the work first, build in pieces that touch different files, have independent reviewers try to break it, then fix. Give every agent this file and the "Done when" list of its step.

### 3.1 Where each step runs

| Steps | Where | Needs |
| --- | --- | --- |
| 1, 2, 6 | Anywhere, including a cloud session | Only npm packages and Playwright. |
| 3, 4, 5 | Easiest on the Mac. In a cloud session the network must first allow: `<dev-ref>.supabase.co`, `<prod-ref>.supabase.co`, `api.supabase.com`, `api.cloudflare.com`, the email provider's API host, `github.com` and `objects.githubusercontent.com` (Supabase CLI download). | Secrets through the secure prompt: Supabase access token, database passwords, the dev secret key (for the security test), Cloudflare API token, email API key. |
| 7–10 | The owner's Mac | Xcode, signed in to the owner's Apple team. |

Without Docker (cloud sessions): link with `npx supabase link --project-ref <ref>`, apply migrations with `npx supabase db push`, deploy functions with `npx supabase functions deploy <name> --use-api`. `supabase functions serve` needs Docker, so test functions by unit-testing their logic with Deno and by calling the deployed function on `nearby-dev`. If `db push` cannot connect from the cloud session, run that one command on the Mac.

## 4. Target shape

### 4.1 Folder layout (after Step 1, in the new repo's root)

```
index.html              one <script type="module" src="/src/main.js">
src/
  main.js               start-up order, router; passes { navigate, render } to views
  state.js              the one shared state object (lang, filter, userPos, drafts, notices …)
  text.js               text tables (he / en)
  categories.js         CATEGORIES, APP_NAME, CURRENCY (used in every mode; matches the categories table)
  demo-data.js          the ten sample shops (loaded only in local mode)
  util.js, icons.js     helpers; ICON map
  prefs.js              small things kept on the device: language, favourites, hidden shops
  store/                index.js (interface), local.js, supabase.js
  views/                home.js, shop.js, form.js, auth.js, my-shops.js, favourites.js, more.js, admin.js
  native.js             the only file that talks to Capacitor; every function has a web fallback
  styles.css
public/fonts/           Heebo and Rubik (from the @fontsource npm packages), served locally
tests/                  suite.js, screenshots.js, security test for the backend
supabase/               migrations/, functions/, seed.sql
ios/                    Xcode project made by Capacitor (committed)
site/                   privacy, terms, support, accessibility, auth pages
store/                  setup.md, listing.md, test-plan.md, screenshots/, review-notes.md
capacitor.config.ts, vite.config.js, wrangler.jsonc, package.json, .env.example
```

### 4.2 Modes and commands

- **Local mode** (`VITE_BACKEND=local`): sample shops plus shops saved in the browser, exactly like today. Used by the test suite and the demo page.
- **Supabase mode** (`VITE_BACKEND=supabase`): the real app.
- `npm run dev` · `npm test` (builds in local mode, runs `tests/suite.js dist`) · `npm run build:web` (production, Supabase mode) · `npm run build:ios` (= production build, then `npx cap sync ios`).
- A production build **fails** if `VITE_BACKEND` is not `supabase` or the Supabase URL or key is empty, so a demo build can never be uploaded to Apple.
- `.env.example`: `VITE_BACKEND=`, `VITE_SUPABASE_URL=`, `VITE_SUPABASE_PUBLISHABLE_KEY=`, `VITE_PUBLIC_WEB_URL=`.

### 4.3 Data model (Supabase)

| Table | Columns | Rules |
| --- | --- | --- |
| `categories` | `id`, `name` (json `{he, en}`), `keywords` (json), `color`, `position` | Public read. Seeded in both projects; must match `src/categories.js`. |
| `shops` | `id`, `owner_id`, `category`, `name`, `about`, `address` (each json `{he?, en?}`, the shape the code already reads), `phone`, `email`, `lat`, `lng`, `hours` (json array of 7, Sunday first, each `null` or `["HH:MM","HH:MM"]`; `["00:00","00:00"]` = open all day), `tz` (default `Asia/Jerusalem`), `status` (`pending` default, `published`, `rejected`, `hidden`), `rejection_reason`, `created_at`, `updated_at`, `last_edited_at`, `reviewed_at` | Anyone reads `published` rows, without `owner_id` or `rejection_reason`. An owner reads their own rows in any status and may change **content columns only**. At most 5 shops per owner. |
| `services` | `id`, `shop_id`, `name` (json), `price` (whole shekels, ≥ 0), `minutes` (≥ 0), `position` | Follows the shop. |
| `shop_photos` | `id`, `shop_id`, `path`, `position` (0–3), unique (`shop_id`, `position`) | Follows the shop. The unique rule is what limits a shop to 4 photos. |
| `profiles` | `user_id`, `accepted_terms_at`, `banned_at`, `created_at` | A user reads their own row. Only an admin sets `banned_at`. |
| `admins` | `user_id` | No access from the app except "am I an admin?". |
| `reports` | `id`, `shop_id`, `reason` (from a fixed list), `details` (≤ 500), `created_at`, `handled_at` | Row-level security on, **no policies**: only the `report-shop` function writes; only admins read. |
| `report_limits` | `shop_id`, `ip_hash`, `day`, unique together | Written by the function only. No raw IP address is stored. |
| `app_config` | `min_build`, `message` (json) | Public read. |

How the rules are enforced (row-level security filters rows, not columns, so it is not enough on its own):

- **Content columns only**: grant `insert` and `update` on `shops` to signed-in users for the content columns alone. `owner_id` defaults to the caller. A trigger sets `updated_at` and `last_edited_at`, refuses any change to `owner_id`, `status` or `rejection_reason` by a non-admin, and moves a `rejected` shop back to `pending` when its owner edits it.
- **Server-side validation** mirrors the form: name 1–60 characters, about ≤ 400, address 1–100, phone ≤ 20, email ≤ 80 and email-shaped, service name ≤ 50, `lat` and `lng` both set or both empty and in range, `hours` shape.
- **Admin actions** are database functions that check the `admins` table: set status (with a reason when rejecting), mark reviewed, ban an owner (sets `banned_at`, hides all their shops, and bans the login).
- **Banned owners** cannot insert or update anything.
- **Photos**: bucket `shop-photos`, public read; a signed-in user may upload only under a folder named after a shop they own, only `<shop-id>/<uuid>.jpg` or `.webp`; 1 MB limit; images only. The shop row is saved first, then the photos. A daily clean-up removes files that no `shop_photos` row points to.

Edge Functions (they send email through the provider's HTTPS API; SMTP ports are blocked there):

| Function | Does |
| --- | --- |
| `report-shop` | Stores a report. Limits by a salted hash of the caller's IP: 5 an hour, 1 per shop per day. |
| `notify-moderator` | Emails Nearby's owner on a new pending shop, on any edit of a published shop, and on every report, with a direct link to the admin card. |
| `delete-account` | Deletes the caller's photos, shops, services, profile and login. Full deletion, at once. |
| `log-error` | Stores app errors (message, screen, build number; rate-limited) so crashes are visible. |

## 5. The steps

### Step 0 — Owner setup

**Goal:** everything later steps need from the owner exists. The builder asks for each item, checks what it can, and records the result (never a secret) in `store/setup.md`.

| Needed before | Item |
| --- | --- |
| Step 1 | New private GitHub repo `nearby-app`, and a session that has both repos attached. |
| Step 3 | Supabase: the two organisations and projects from section 2; project refs, URLs and publishable keys noted; secrets entered through the secure prompt. |
| Step 3 | Domain bought and its DNS managed at Cloudflare; email-service account; support email address. |
| Step 7 | Apple Developer Program enrolled; team ID noted. |
| Step 7 | App name and bundle ID chosen. In developer.apple.com → Identifiers, register the App ID. In App Store Connect → Apps → New App: iOS, the name, **primary language Hebrew**, that bundle ID, SKU `nearby-ios-1`. This reserves the name. |
| Step 7 | Mac check: Xcode 26 or newer installed from the App Store, opened once, an iOS simulator installed; `xcodebuild -version` recorded; Node 22 or newer; Claude Code. No CocoaPods or Homebrew needed. |
| Step 8 | App Store Connect API key (Users and Access → Integrations, role App Manager): the `.p8` file saved once in `~/.appstoreconnect/private_keys/` on the Mac; Key ID and Issuer ID noted. |

**Done when:** `store/setup.md` shows each item as done or names what is missing, and nothing a coming step needs is missing.

### Step 1 — Make the project buildable and split it into modules

**Goal:** same app, same look, organised so many agents can work on it and Capacitor can package it.
**Work, in this order:**
1. **Move to the new repo**: `git subtree split --prefix=shop-finder` keeps the history; push it as `main` of `nearby-app`. Add a `CLAUDE.md` there with the rules of section 3 and a `.gitignore` (`.env`, `.env.*`, `!.env.example`, `*.p8`, `dist/`, `node_modules/`).
2. **Baseline**: save the current test log and `screenshots.js` output.
3. **1a — build without changing code**: add `package.json` and Vite. Move `app.js` unchanged into `src/legacy.js` as one module; `data.js` becomes an imported module. `index.html` loads one module script. `vite.config.js` sets `base: './'` so the build works from a sub-folder and inside the app. Get `npm test` green against `dist/`.
4. **Fonts**: serve Heebo and Rubik from `public/fonts/` (npm packages `@fontsource/heebo`, `@fontsource/rubik`; Hebrew and Latin subsets) and remove the Google Fonts link. The Content-Security-Policy tag is written at build time (dev allows the Vite dev server; production allows only what the mode needs).
5. **Tests follow**: teach `tests/suite.js` the new file types (woff2, svg, json, png), make its "fonts blocked" option block `/fonts/`, and add a check that the page makes **no request to any other host**.
6. **1b — split**: create `src/state.js` exporting one object that holds every shared variable (`lang`, `myShops`, `userPos`, `locState`, `filter`, `pageNotice`, `draft`, `drafts`, `formUi`, `firstRender`, `lastRoute`, `lastShopId`, `homeScrollY`, `homeSig` …) and rewrite every read and write as `state.x`. Then cut `legacy.js` into the modules of 4.1. Views never import the router. Start-up side effects run from `main.js` in today's order. Rename the existing `localStorage` wrapper so it is not confused with `src/store/`.

**Done when:** `npm test` passes all checks against `dist/`; screenshots match the baseline; the page requests nothing outside itself; the demo page still works from the built files.
**Ultracode recipe:** one agent lists every function and shared variable of `app.js` and proposes the module boundaries; **one** agent does 1a and 1b (single writer: it is one file); three reviewers compare old and new (tests, screenshots, a read of the diff for anything dropped or reordered); one agent fixes.

### Step 2 — Put all data behind one store (still local)

**Goal:** screens stop reading `localStorage` and the sample list directly. They ask a store, whose answer may be late or fail.
**Work:**
- `store/index.js` defines the interface. Synchronous: `snapshot()` (the last loaded list; used by search, filters, open-now and the once-a-minute tick, which must never wait). Promises: `refresh()`, `getShop(id)`, `myShops()`, `saveShop(draft)`, `deleteShop(id)`, `uploadPhoto(shopId, file)`, `reportShop(id, reason, details)`, `session()`, `signUp()`, `signIn()`, `signOut()`, `resetPassword()`, `deleteAccount()`. Events: `onChange(fn)`.
- `store/local.js` implements it with today's behaviour.
- Home, shop page and form use the store. New states in the Indigo style: loading skeletons, "could not load — try again", offline banner, saving and uploading progress, pending-review badge.
- Drafts survive the app being closed: draft text in `localStorage`, picked photos as Blobs in IndexedDB, until the save succeeds or the draft is discarded.
- Search, filters, hours and distance logic are unchanged and stay on the device.

**Done when:** all checks pass (changed only to wait for results); new checks cover loading, error, retry and offline by making the store slow or failing; a draft with two photos survives a page reload; no file outside `store/` and `prefs.js` touches stored data.
**Ultracode recipe:** map every data read and write; then one agent per screen (separate files now, so they can work side by side in separate worktrees); reviewers hunt for races: double submit, leaving a page mid-load, stale results after a language switch.

### Step 3 — Build the backend and email

**Goal:** a Supabase project that can be rebuilt from the repo, and email that reaches real people.
**Work:**
- SQL migrations for everything in 4.3: tables, checks, column grants, triggers, policies, admin functions, storage rules, the photo clean-up job.
- The four Edge Functions.
- Sign-in settings: email + password, email confirmation on, sensible password rules. Site URL and allowed redirects point **only** to `https://<domain>/auth/confirmed` and `https://<domain>/auth/reset` (the pages are built in Step 5).
- **Email**: Supabase's built-in sender only delivers to the project's own team, so real owners would never get a confirmation. Set custom SMTP in both projects with the owner's email service; the builder gives the owner the exact DNS records (SPF, DKIM, DMARC) for `mail.<domain>`; raise the auth email rate limit; replace the confirm, reset and change-email templates with Hebrew-first bilingual texts.
- `seed.sql`: categories in both projects; the ten sample shops in **dev only**. Add the owner's account to `admins` in both.
- `tests/security.js` signs in as nobody, owner A, owner B, a banned owner and an admin, and proves each rule: B cannot edit A's shop; a pending shop is invisible to others; an owner cannot publish their own shop or change `owner_id`; a fifth photo and a sixth shop are refused; nobody but an admin reads reports; a banned owner cannot write; uploads outside one's own shop folder are refused.

**Done when:** `supabase db reset --linked` on `nearby-dev` (rebuilds from the migrations and seed) followed by `tests/security.js` passes; the same migrations are pushed to `nearby-prod` without the sample shops; a password-reset email reaches an outside Gmail address within a minute and not in spam; nothing secret is in the repo.
**Owner gate:** Supabase secrets, the DNS records, the email-service key.
**Ultracode recipe:** one agent writes the schema; separate agents write policies and triggers, the functions, and the security test, each from 4.3 alone; three adversarial reviewers try to read or change data they should not and to get round the photo, shop and report limits.

### Step 4 — Connect the app

**Goal:** in Supabase mode the app shows real shops, and an owner can run their shops from the phone.
**Work:**
- `store/supabase.js` implements the Step 2 interface. On start, on returning to the app, and at most every 15 minutes, download the slim list of published shops (what cards and search need) and replace the cached copy, so a hidden or deleted shop disappears. The shop page loads full details by id. Keep the cache in IndexedDB for offline use. Distance is computed on the phone.
- Photos: the store keeps storage paths and builds the public addresses; the code's photo check also accepts addresses of this project's `shop-photos` bucket; photos upload as JPEG blobs with progress and retry.
- **Sign-in screens**: sign in, create account (with the terms checkbox, saved as `accepted_terms_at`), "check your email", forgot password.
- **My shops**: each shop with its status (pending, public, rejected with the reason), edit, delete. After saving, the owner lands on their shop with "Sent for review — usually within a day"; "published" wording appears only when it is true. `getShop` returns the owner's own shops in any status.
- **Report this business** on the shop page: reasons list plus a short text.
- **Hide this business** on the shop page: stored on the phone, never shown again, with a list and Undo in More (Step 6). This and banning are Apple's required "block".
- **Delete my account**, inside the app: says exactly what will be deleted (account, shops, photos), happens at once, ends on a "Your account was deleted" screen.
- **Admin screen** at `#/admin` (web only, never in the tab bar, visible only to admins and enforced by the database): three lists — Pending, Edited since approval, Open reports. Each card shows the shop as the public sees it, with Approve / Reject (reason) / Hide / Ban owner.
- **Update gate**: on start read `app_config`; if this build is older than `min_build`, show a full-screen "Please update" message.
- Errors go to `log-error`. Friendly messages for no network, expired session and server errors.
- The Content-Security-Policy allows the project's Supabase address for data and images.

**Done when:** new checks pass against a mocked Supabase (Playwright intercepts the network) for every flow above, in both languages; a manual run against `nearby-dev` works end to end, including an admin approving a shop from the emailed link; local mode still passes the old checks.
**Ultracode recipe:** one agent per flow, each in its own file (auth, my shops, report and hide, account deletion, admin); reviewers: security (what the client can send that the server must refuse), failure handling (cut the network at every step), wording in Hebrew and English.

### Step 5 — Publish the web app and the public site

**Goal:** a live HTTPS home for the web app, the legal pages and the email links. From here real shop owners can sign up.
**Work:**
- Host on Cloudflare as a static site (Workers static assets; check their current docs — Cloudflare Pages is being wound down for new projects). `wrangler.jsonc` serves `dist/`. Deploy with `npm run build:web && npx wrangler deploy`.
- Addresses: `app.<domain>` is the web app in Supabase mode (production). `<domain>` has the pages from `site/`: `/privacy`, `/terms`, `/support`, `/accessibility`, each in Hebrew and English, with **no pricing or sign-up-for-a-plan links**. Optional: `dev.<domain>` pointing at `nearby-dev`.
- `/auth/confirmed`: "Your email is confirmed. Go back to the app and sign in." `/auth/reset`: reads the recovery link, asks for the new password twice, saves it, then says the same. Both are covered by checks.
- Draft the legal texts and the support page now (the lawyer's edits come in Step 9).
- Set `VITE_PUBLIC_WEB_URL` so every share link is `https://app.<domain>/#/shop/<id>`.

**Done when:** a share link opens the shop in a phone browser; the four pages answer in both languages; sign-up, email confirmation and password reset work for an outside email address on the live site; the owner has approved a first real shop from the admin screen.
**Owner gate:** Cloudflare API token; then the owner starts inviting real shop owners to `https://app.<domain>`.

### Step 6 — App screens from the mock-ups

**Goal:** it feels like the app in `design/mockups/03-home.jpg`, and every control does something real.
**Work:**
- **Bottom tab bar** on phones: Home, Favourites, My shops, More. The current tab is the indigo pill from the mock-up. It respects the bottom safe area and hides while the keyboard is open.
- **Favourites**: a heart on each card and on the shop page (where the mock-up has it), a Favourites screen, stored on the phone through `prefs.js`.
- **More**: language, hidden businesses (with Undo), privacy policy, terms, accessibility statement, contact support (opens an email with the app version and build filled in), sign out, delete account, app version.
- On phones the header loses the add-shop and language buttons (they now live in the tabs and in More).
- Page changes slide gently; lists keep their scroll position when you come back.
- Form fields and selects use at least 16px text (smaller text makes the iPhone zoom in on focus). Full-height areas use `100dvh`.

**Done when:** checks cover the tabs, favourites, hidden list and More in both languages; no screen scrolls sideways from 320px to 430px wide; every More link opens a live page; every new control has a spoken label.
**Ultracode recipe:** one agent per screen; a look reviewer compares with the mock-ups; an accessibility reviewer measures contrast, focus order and touch sizes.

### Step 7 — Native iPhone shell

**Goal:** an Xcode project that builds the app and runs it in the iPhone simulator.
**Where:** Claude Code on the owner's Mac. (Creating the project files can be prepared anywhere; building needs the Mac.)
**Work:**
- `npm i @capacitor/core @capacitor/ios`, `npm i -D @capacitor/cli`, `npx cap init` with the bundle ID and name, `webDir: dist`, then `npx cap add ios`. Commit `ios/`.
- Plugins (official, same major version): Geolocation, Share, App, Haptics, Status Bar, Keyboard, Splash Screen, Preferences, Network.
- `src/native.js`, each function with a web fallback:
  - Location for both places that use it ("near me" and the owner form's "use my current location"). Ask only when the user taps. If refused, explain how to turn it on in Settings.
  - Share sheet with the public web link.
  - Phone, email, WhatsApp, Waze and Maps open **outside** the app through normal `tel:`, `mailto:` and `https://` links (Capacitor hands these to iOS). Directions on iPhone open Apple Maps. The "opens in a new tab" note becomes "opens in another app".
  - On return to the app: refresh open/closed states and the shop list, and resume the login session. The login session and `prefs.js` use the Preferences plugin on iOS.
  - Light haptics on key taps; status bar with dark icons; keyboard: add a class while it is open so the tab bar and the bottom action bar hide.
- Swipe back from the screen edge: a small `MainViewController` subclass that turns on `allowsBackForwardNavigationGestures`; test it in Hebrew with the app's own back logic.
- Text size: the page follows the iPhone's text-size setting, with layouts intact up to at least 130%.
- `Info.plist`: iPhone only; portrait; `UIUserInterfaceStyle` Light; `CFBundleDevelopmentRegion` `he`; `CFBundleLocalizations` he and en; `NSLocationWhenInUseUsageDescription` ("to show businesses near you and, for business owners, to place your business on the map"); `NSCameraUsageDescription` ("to take a photo of your business" — the photo field offers "Take Photo", and without this text the app crashes); `ITSAppUsesNonExemptEncryption` = NO. Never the "Always" location key, never a tracking key. Translate the texts and the display name in `he.lproj` and `en.lproj`.
- Deployment target iOS 15.0. Version 1.0.0, build 1 (raise the build with `agvtool next-version -all` before every upload).
- Privacy manifest `ios/App/App/PrivacyInfo.xcprivacy`: tracking off, no tracking domains, collected data types exactly as in the Step 9 privacy answers, and a reason for every "required-reason API" the app target uses. After archiving, read Xcode's privacy report for the archive.
- App icon: the indigo pin on white, 1024px, no transparency. Launch screen: pale lavender with the logo.

**Done when:** `npm run build:ios` is clean; `xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -destination 'platform=iOS Simulator,name=<an installed iPhone>' build` succeeds; simulator screenshots (`xcrun simctl io booted screenshot`) of home, shop, form, favourites and More match the web screenshots; each `native.js` function was exercised in the simulator (calls and the camera need a real phone: Step 8); the app also opens without broken layout on an iPad simulator.
**Ultracode recipe:** one agent sets up the project; then separate agents own `native.js`, the Xcode settings, and the assets; one reviewer checks every bullet above against Apple's and Capacitor's current documentation; a second runs the simulator and looks at each screen.

### Step 8 — TestFlight and real iPhones

**Goal:** the owner and a few real shop owners use the real app on their iPhones and nothing is broken.
**Work:**
- Upload from the command line with the API key from Step 0: `xcodebuild … archive -allowProvisioningUpdates` with the three `-authenticationKey…` options, then `xcodebuild -exportArchive` with an `ExportOptions.plist` whose `method` is `app-store-connect` and `destination` is `upload`. Fallback: Xcode's Organizer window, or the Transporter app.
- The owner is an internal tester (no review needed). For shop owners, create an external group with a public link and fill in Test Information (description, feedback email, privacy policy address, demo account). The first build of a version waits for Beta App Review, usually about a day. Builds expire after 90 days.
- `store/test-plan.md`, run on a small and a large iPhone: Hebrew and English; location allowed, refused, and switched off; airplane mode and slow network; photo from camera and from library; start a draft with two photos, force-quit, reopen; keyboard over every field; notch and home-bar areas; swipe back; call, WhatsApp, Waze, Maps and share; create account, confirm email, reset password; add, edit and delete a shop; report; hide; delete account; larger text; VoiceOver through the main flows.
- Fix what the tests find; upload a new build each time.

**Done when:** every line of the test plan is marked passed by the owner on their phone, and at least 15 real shops are approved in production.
**Owner gate:** the owner installs TestFlight, tests, and invites shop owners.

### Step 9 — Store listing and compliance pack

**Goal:** every App Store Connect field has a prepared answer in `store/listing.md`.
**Work:**
- **Texts**, Hebrew (primary) and English (U.K.) (the default language of Israel's store): name ≤ 30 characters, subtitle ≤ 30, promotional text ≤ 170, description ≤ 4,000, keywords ≤ 100 bytes (a Hebrew letter counts as about 2). No prices, no plan mentions, no other apps' names.
- **Screenshots** from the simulator with real-looking content, in Hebrew and in English, 3–6 each: capture both 1320×2868 (iPhone 17 Pro Max) and 1206×2622 (iPhone 17), PNG, no transparency, and upload what the screenshot page asks for. Set a clean status bar first (`xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100`). Show only features that exist.
- **Privacy answers** (all "linked to you", purpose "app functionality", no tracking, no ads): email address (owner sign-in, shop email); phone number (shop phone); user ID; photos; other user content (shop texts and services; report texts as "not linked"); **precise location — owners only**, the point they choose for their shop. Customers: nothing. Write down how long Supabase keeps IP addresses in its logs and treat them as security data. The privacy manifest must list the same types.
- **Age rating**: answer the live questionnaire and record each answer. Expected: user-generated content yes (moderated before publishing); no messaging, no social feed, no ads; no unrestricted web access (outside links open in other apps).
- Category Lifestyle. Content rights. Price free. Availability Israel only at first.
- **EU trader status** (App Store Connect → Business): must be declared even for an Israel-only app; record the choice.
- Optional accessibility labels: declare only what passed in Step 8 (VoiceOver, larger text, contrast).
- **Review notes**: what the app is and that it serves Israel; a demo owner account (email and password, never expires) with one approved and one pending shop; that "near me" sorts by real distance, so a reviewer abroad should set the simulated location to Tel Aviv (32.0853, 34.7818); where the language switch is; how rule 1.2 is met — approval before publishing, Report on every business with action inside 24 hours, Hide on the phone plus banning of abusive owners, and the support address in the More tab; where "Delete my account" is.
- The lawyer's edits go into the live legal pages.

**Done when:** `store/listing.md`, `store/review-notes.md` and `store/screenshots/` are complete; the legal pages are final and live.
**Owner gate:** the lawyer's review; the owner's choice of trader status.

### Step 10 — Submit and release

**Work:** check Apple's "upcoming requirements" page once more. In App Store Connect: agreements accepted (a free app needs no banking), fill the listing from `store/listing.md`, attach the tested build, submit. If Apple rejects, read the exact rule they cite, fix that, answer politely in the Resolution Centre, and resubmit. Keep the production backend and the demo account working throughout review.
**Done when:** the status is "Ready for Distribution" and the owner has installed the app from the App Store.
**Owner gate:** the owner presses Submit and answers Apple's messages.

### Step 11 — After launch

In rough order: Android from the same code (Capacitor; Google Play account); links that open the app directly; Sign in with Apple together with Google sign-in (adding Google makes Apple's obligatory; it needs token revocation on account deletion and the email domain registered with Apple); the paid monthly plan for shops (decide first whether it is sold as an in-app purchase, and re-read Apple's rules before any price or link appears in the app); booking; push notifications; reviews; Arabic.

## 6. Why Apple might reject it, and the answer already built in

| Rule (App Review Guidelines) | Risk | Built-in answer |
| --- | --- | --- |
| 4.2 Minimum functionality | "A website in a wrapper" | UI ships inside the app; tab bar, favourites, native location, share, camera, haptics, offline list. |
| 1.2 User-generated content | Shops are posted by users | Filter: approval before publishing. Report: on every business, handled within 24 hours. Block: Hide on the phone, banning of abusive owners. Contact: support address in More and in the listing. Terms accepted at sign-up. |
| 5.1.1(v) Account deletion | Accounts can be created | "Delete my account" inside the app; full deletion at once. |
| 4.8 Login services | Third-party sign-in | Not triggered: own email + password accounts only. |
| 5.1.1 / 5.1.2 Privacy | Data use unclear | Privacy policy in the app and the listing; customers' location stays on the phone; owners' shop position declared; no tracking. |
| 3.1.1 / 3.1.3 Payments | Steering to payment outside Apple | No prices, plan mentions, purchase links or calls to action in the app, its store page, or the pages it links to. |
| 2.1 App completeness | Crashes, empty app, no demo account | Step 8 test plan; real shops; a demo account and a backend that stay up during review. |
| 2.3 Accurate metadata | Screenshots show features that do not exist | Screenshots are taken from the real build; the privacy answers match the app. |

## 7. Secrets

| Secret | Where it lives | Never |
| --- | --- | --- |
| Supabase URL and publishable key | `.env` files (not committed); they ship inside the app by design | — |
| Supabase secret key, database passwords, access token | Edge Function secrets; the owner's password manager; the session's secure prompt | in the repo, in the app, in chat |
| Email-service key | Edge Function secrets | in the repo |
| Cloudflare API token | the session's secure prompt | in the repo |
| App Store Connect API key (`.p8`) | `~/.appstoreconnect/private_keys/` on the Mac | in the repo |

## 8. Costs to expect

Apple Developer Program US$99 a year · Supabase Pro about US$25 a month for production (dev stays free) · domain about US$10–20 a year · Cloudflare hosting free · email service free at this size · a lawyer's review of the legal pages.

## 9. Check before relying on it

These could not be confirmed on 21 November 2026, or change often. The builder checks each when its step comes up:

- Which macOS the owner's Mac needs for the current Xcode, and when Apple will start requiring Xcode 27.
- Supabase: current prices, the free plan's limit of projects per organisation, the names of the keys (publishable / secret), the default page size of list requests, log retention.
- Whether `supabase db push` works through a cloud session's network proxy.
- Cloudflare's currently recommended product for a static site with a custom domain.
- The exact screenshot sizes App Store Connect asks for, and the current age-rating questions.
- Whether the photo field's "Photo Library" choice needs its own permission text on the iOS version in use (test on a real phone).
- How the web view reports the phone's language when the user picks a per-app language in iOS Settings.
- Free-tier limits of the chosen email service.

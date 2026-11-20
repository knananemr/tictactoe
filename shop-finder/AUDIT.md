# Nearby — audit & redesign notes

Six independent reviewers checked the first prototype: logic, hands-on testing, accessibility (WCAG 2.1 AA), UX and visual design, RTL and mobile layout, and security. They found 124 problems, which merged into 70 distinct ones. A separate skeptic then tried to disprove each one; **69 were confirmed** and 1 was rejected.

Status: ✅ fixed · ◐ partly fixed (needs a backend or a map service) · the fix is described in each row.

## High

| # | Problem | Status |
|---|---|---|
| F01 | Opening-hours rows were wider than every phone screen, so the owner form scrolled sideways | ✅ Rows stack on two lines on phones; no sideways scroll at 320–1440px |
| F02 | Switching language on "Open your shop" erased everything the owner typed | ✅ The form keeps a draft (also kept across reloads in this tab) |
| F03 | Shops open past midnight, closing at 00:00, or open 24h always showed "Closed" | ✅ Times compared in minutes; yesterday's late slot is checked |

## Medium

| # | Problem | Status |
|---|---|---|
| F04 | Publishing while photos were still resizing lost the photos | ✅ Publish waits and says "Preparing photos…" |
| F05 | CSS injection through photo/colour values in `style` attributes | ✅ Photos are `<img>`; colours and photo URLs are validated |
| F06 | Double-clicking Publish created two shops | ✅ Guarded |
| F08 | Picking photos replaced earlier ones and silently dropped extras | ✅ Photos add up to 4, can be removed, and skipped files are reported |
| F12 | "Near me" rebuilt the page, losing search focus | ✅ Only the results update |
| F13 | "Near me" couldn't be turned off and showed no busy state | ✅ Toggles on and off; shows a busy state |
| F14 | Location error message was untrue | ✅ New wording |
| F15 | Empty price showed "₪0"; negative prices allowed; prices not formatted | ✅ Empty prices show "—"; negatives blocked; prices use Israeli currency formatting |
| F16 | Transparent PNG logos turned black | ✅ Painted on white |
| F17 | Search failed on ״/׳, curly quotes, punctuation, and ה- prefix | ✅ Normalised search; Hebrew one-letter prefixes are handled |
| F18 | Long shop names broke the layout | ✅ Long names wrap |
| F19 | Back link added history entries and jumped to the top | ✅ Goes back and keeps your place in the list; publish and delete leave no dead history entries |
| F20 | Category row hid "Tattoo" on desktop with no cue | ✅ Grid on desktop; fade edge on scrolling rows |
| F21 | Form errors were vague, didn't move focus, never cleared | ✅ Per-field messages, focus moves to the first error, errors clear while typing |
| F22 | Hours controls mislabelled; "Closed" didn't disable times | ✅ Fixed |
| F23 | Page changes not announced; same title everywhere | ✅ Focus moves to the heading; every page has its own title |
| F24 | Focus ring too faint (1.9:1) | ✅ Solid ring, 5.8:1 |
| F25 | Input borders nearly invisible (1.25:1) | ✅ 3.9:1 |
| F26 | Result count changes not announced | ✅ Announced to screen readers |
| F27 | Placeholder-only labels; orphan "Location" label | ✅ Real labels |
| F28 | Remove-service button named "✕" and lost focus | ✅ Named, keeps focus |
| F31 | Owner text in the other language rendered with wrong direction | ✅ Owner text gets its own text direction (`dir="auto"`, `<bdi>`) |
| F33 | Header wrapped onto two lines at 320–360px | ✅ Stays on one line; all buttons ≥ 44px |
| F34 | Empty state blamed the wrong filter, no reset | ✅ Covers every filter; "Clear filters" button |
| F35 | Only "Open/Closed", no times | ✅ "Closes 19:00" / "Opens tomorrow 09:00" |
| F36 | On phones only one result fit on the first screen | ✅ Compact list rows on phones; shorter hero |
| F42 | No confirmation after publishing, no way to edit | ✅ "Your shop is live" note, an **Edit my shop** screen, and a "Yours" badge on your card |
| F43 | Location only from the owner's GPS; no map | ◐ Button and hint are clearer; typing an address and confirming it on a map needs a map service |

## Low

| # | Problem | Status |
|---|---|---|
| F07 | Phone and email not validated | ✅ |
| F09 | Corrupted saved data crashed the app | ✅ Saved data is cleaned or dropped |
| F10 | Two tabs overwrote each other's shops | ✅ Re-reads before saving; syncs between tabs |
| F11 | Photos fill browser storage after ~8 shops | ◐ Photos ~3× smaller (800px WebP) with accurate errors; real fix is server storage |
| F29 | Distance select and categories unnamed | ✅ |
| F30 | Touch targets under 44px | ✅ |
| F32 | Service minutes attached to the wrong words | ✅ |
| F37 | Generic template look | ✅ New "storefront" design (see below) |
| F38 | Flat emoji tiles, grey owner shops, no trust signals | ◐ Category colours and storefront cards; reviews and verified badges need a backend |
| F39 | No sticky Call/Directions on phones | ✅ Sticky action bar |
| F40 | No map view, Waze, WhatsApp or Share | ◐ Waze, WhatsApp (Israeli mobile numbers) and Share added; map view still to do |
| F41 | One long ungrouped form | ✅ 5 numbered steps, "same hours every day" button, live preview |
| F44 | Malformed link crashed routing | ✅ |
| F45 | Stored language "constructor" broke the UI | ✅ |
| F46 | Wrong location error text on the form | ✅ |
| F47 | Failed delete reported as success | ✅ |
| F48 | "1000 m" instead of "1 km" | ✅ |
| F49 | Open/Closed never refreshed | ✅ Every minute and when you return to the tab |
| F50 | "Open now" used the device time zone | ✅ Uses the shop's (Asia/Jerusalem) |
| F51 | About text lost line breaks | ✅ |
| F52 | Grey text just under AA contrast | ✅ 5.5:1 |
| F53 | Header not aligned with content; no active state | ✅ |
| F54 | Filter row mixed styles | ✅ |
| F55 | No hover/pressed feedback; motion ignored reduced-motion | ✅ |
| F56 | Desktop shop page stretched across the width | ✅ Two columns |
| F57 | Gallery cropped photos, no snapping | ✅ |
| F58 | Same alt text on every photo; gallery not reachable by keyboard | ✅ |
| F59 | Emoji read aloud | ✅ Hidden from screen readers |
| F60 | Card links had run-on names | ✅ Name = shop name, details as description |
| F61 | Heading levels skipped | ✅ |
| F62 | "Today" shown only by bold | ✅ "Today" tag |
| F63 | New-tab links not announced | ✅ |
| F64 | Language button read with the wrong voice | ✅ |
| F65 | Brand and "Near me" had the same Hebrew label | ✅ Button is now "סביבי" |
| F66 | Native file input in the browser's language | ✅ Custom photo picker |
| F67 | Phone/email cramped at 320px | ✅ |
| F68 | Search rebuilt everything on each keystroke | ◐ Search waits for a pause in typing and uses pre-built search text; the list is still re-drawn |
| F70 | No Content-Security-Policy | ✅ CSP added; every inserted value is escaped |

Rejected by the verifier: F69 (photo decoding memory): measurements did not support it.

## The redesign

- **Idea:** every shop gets a storefront. Cards and category tiles wear a striped awning in their category colour over a tinted "shop window". The app's purpose is to give small shops a place to be seen, and the storefront makes that visible.
- **Type:** Suez One (sign-painter serif, has Hebrew) for headings and shop names; Assistant for text.
- **Colour:** warm paper background, dark ink, tomato accent; every text colour passes WCAG AA.
- **Home:** short headline, one search bar with "Near me" inside it, category "street", then results. Desktop shows an animated storefront with a swinging OPEN sign (still for people who turn off motion).
- **Shop page:** awning hero, status with times, prices, today's hours highlighted, contact with Waze/WhatsApp/Share, sticky Call/Directions on phones, two columns on desktop.
- **Owner form:** 5 steps, live preview of your card, edit after publishing.

## Still open (needs the next step: a backend)

- Shops are saved only in the browser on one device. Customers can't see them until there is a server and database.
- Map: confirm the shop's location by typing the address and dragging a pin.
- Trust: reviews or ratings, "verified owner".
- Accounts so an owner can log in and edit from any device.

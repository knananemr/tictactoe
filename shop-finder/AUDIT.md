# Nearby — audit & redesign notes

Six independent reviewers checked the first prototype: logic, hands-on testing, accessibility (WCAG 2.1 AA), UX and visual design, RTL and mobile layout, and security. They found 124 problems, which merged into 70 distinct ones. A separate skeptic then tried to disprove each one; **69 were confirmed** and 1 was rejected.

Status: ✅ fixed · ◐ partly fixed (needs a backend or a map service) · the fix is described in each row.

A **second, independent review** of the redesigned app (four reviewers plus a skeptic for every finding) confirmed 63 more findings, which merge into 47 distinct problems. All 47 are fixed; see [Second review](#second-review) below. Some of them showed that first-round fixes were incomplete (F03, F14/F46, F19, F24, F55, F57, F59); those rows are updated.

## High

| # | Problem | Status |
|---|---|---|
| F01 | Opening-hours rows were wider than every phone screen, so the owner form scrolled sideways | ✅ Rows stack on two lines on phones; no sideways scroll at 320–1440px |
| F02 | Switching language on "Open your shop" erased everything the owner typed | ✅ The form keeps a draft (also kept across reloads in this tab) |
| F03 | Shops open past midnight, closing at 00:00, or open 24h always showed "Closed" | ✅ Times compared in minutes; yesterday's late slot is checked; a "24 hours" option per day (see R10) |

## Medium

| # | Problem | Status |
|---|---|---|
| F04 | Publishing while photos were still resizing lost the photos | ✅ Publish waits and says "Preparing photos…" |
| F05 | CSS injection through photo/colour values in `style` attributes | ✅ Photos are `<img>`; colours and photo URLs are validated |
| F06 | Double-clicking Publish created two shops | ✅ Guarded |
| F08 | Picking photos replaced earlier ones and silently dropped extras | ✅ Photos add up to 4, can be removed, and skipped files are reported |
| F12 | "Near me" rebuilt the page, losing search focus | ✅ Only the results update |
| F13 | "Near me" couldn't be turned off and showed no busy state | ✅ Toggles on and off; shows a busy state |
| F14 | Location error message was untrue | ✅ New wording; a timeout or missing fix no longer blames the permission (R23) |
| F15 | Empty price showed "₪0"; negative prices allowed; prices not formatted | ✅ Empty prices show "—"; negatives blocked; prices use Israeli currency formatting |
| F16 | Transparent PNG logos turned black | ✅ Painted on white |
| F17 | Search failed on ״/׳, curly quotes, punctuation, and ה- prefix | ✅ Normalised search; Hebrew one-letter prefixes are handled |
| F18 | Long shop names broke the layout | ✅ Long names wrap |
| F19 | Back link added history entries and jumped to the top | ✅ Goes back only when the previous page really is the list, so it keeps your place; publish, save and delete leave no duplicate entries (R02, R05) |
| F20 | Category row hid "Tattoo" on desktop with no cue | ✅ Grid on desktop; fade edge on scrolling rows |
| F21 | Form errors were vague, didn't move focus, never cleared | ✅ Per-field messages, focus moves to the first error, errors clear while typing |
| F22 | Hours controls mislabelled; "Closed" didn't disable times | ✅ Fixed |
| F23 | Page changes not announced; same title everywhere | ✅ Focus moves to the heading; every page has its own title |
| F24 | Focus ring too faint (1.9:1) | ✅ Solid ring, 5.8:1, now also on form fields and on dark areas (R16, R17) |
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
| F46 | Wrong location error text on the form | ✅ (and R23) |
| F47 | Failed delete reported as success | ✅ |
| F48 | "1000 m" instead of "1 km" | ✅ |
| F49 | Open/Closed never refreshed | ✅ Every minute and when you return to the tab |
| F50 | "Open now" used the device time zone | ✅ Uses the shop's (Asia/Jerusalem) |
| F51 | About text lost line breaks | ✅ |
| F52 | Grey text just under AA contrast | ✅ 5.5:1 |
| F53 | Header not aligned with content; no active state | ✅ |
| F54 | Filter row mixed styles | ✅ |
| F55 | No hover/pressed feedback; motion ignored reduced-motion | ✅ The OPEN sign now really stops with reduced motion (R14) |
| F56 | Desktop shop page stretched across the width | ✅ Two columns |
| F57 | Gallery cropped photos, no snapping | ✅ Whole photo shown over a blurred copy; previous/next buttons and a "2 / 4" counter (R13) |
| F58 | Same alt text on every photo; gallery not reachable by keyboard | ✅ |
| F59 | Emoji read aloud | ✅ Hidden from screen readers, including the category list and notes (R34) |
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

## Second review

Four fresh reviewers (logic, hands-on testing, accessibility + RTL, visual) checked the redesigned app; each finding was then re-tested by a skeptic. 63 findings were confirmed, none rejected; duplicates merged into the 47 problems below. Every fix has an automated check in the test suite (226 checks).

### High

| # | Problem | Fix |
|---|---|---|
| R01 | "Skip to content" on a shop page or the form jumped to the home page | It moves focus to the page heading and never changes the page |
| R02 | "All places" could reopen the edit form or a previous shop; a double click left the site | Every history entry remembers the page before it; the link goes back only when that page is its target, and ignores a second click |
| R03 | Cancel on "Edit your shop" kept the edits, and the next Save published them | Cancel (and the shop-name link on the edit page) throws the edits away |
| R04 | A web address in "About" or a long service name made the phone shop page scroll sideways and cut off prices | Owner text wraps; addresses in About become links; layout columns can shrink |

### Medium

| # | Problem | Fix |
|---|---|---|
| R05 | Saving an edit or deleting left a duplicate history entry, so Back did nothing | Save and Delete go back to the page you came from instead of adding one |
| R06 | One shared draft: opening Edit wiped a half-typed new shop, and the reverse | One draft per form; a note says "We kept what you typed earlier" with **Start over** / **Discard changes** |
| R07 | Switching language while photos were being prepared left Publish stuck, or put the photos on another shop | Photos always go to the draft that picked them; the live form updates when they are ready |
| R08 | Hebrew prefix search found unrelated shops ("כאבי גב" matched barbers) | A word without its prefix letter must match a whole word (or the start of a long one) |
| R09 | "מספרה" missed half the barbers; "מרפאה" found nothing | Each category has hidden search keywords (both languages) |
| R10 | No way to enter "open 24 hours"; old 24-hour data showed "Closed"; 07:00–06:00 was accepted | "24 hours" checkbox per day; status "Open 24 hours"; overnight days are limited to 20 hours |
| R11 | Negative, huge or fractional prices and minutes were silently changed or dropped | Each service row is checked, with a message next to the row |
| R12 | Without the web font (slow network, blocked fonts) the search bar ran off phone screens | The search field shrinks to fit |
| R13 | Desktop gallery could not be browsed with a mouse; portrait photos lost half the picture | Previous/next buttons, a counter, and the whole photo is shown |
| R14 | The swinging OPEN sign kept moving forever, and jittered with reduced motion on | It swings once (again on hover) and not at all with reduced motion |
| R15 | Invalid fields were not highlighted and error text looked like help text | Red border and text plus a warning icon (shape, not only colour) |
| R16 | Focus ring on form fields was a faint 1.8:1 halo | Solid 3px ring |
| R17 | Focus ring on the dark "Open your shop" band was 2.6:1 | Light ring on dark areas |
| R18 | Category names were clipped ("Physiothera") with larger text spacing; counts didn't line up | Tiles grow with their name; counts sit at the bottom |
| R19 | Landscape phones showed nothing to tap on the first screen | Compact hero, shorter gallery, Call bar stays on screen |
| R20 | "Open now" switch was hard to see when off (1.8:1) and its border didn't match | Darker track and matching border |

### Low

| # | Problem | Fix |
|---|---|---|
| R21 | A change in another tab rebuilt the page and lost focus mid-typing | The list updates in place; focus is kept |
| R22 | Saving in a stale tab brought back a shop deleted in another tab | Refused with a message; the edit page says the shop was deleted |
| R23 | Location errors always blamed the browser permission | Timeout / no fix gets "try again in a moment" |
| R24 | Open/Closed updated up to a minute late, missed midnight and re-announced the list every minute | Updates on the minute, moves the "Today" row at midnight, redraws only when something changed |
| R25 | Photos silently disappeared when the form page reloaded | The owner is told to add them again (keeping them needs server storage) |
| R26 | "Your shop is live" vanished on language switch; no confirmation after delete | The note stays until you leave the page; "Your shop was deleted" on the list |
| R27 | Switching language could jump the page | Position is kept |
| R28 | "Link copied" appeared off-screen on phones and never cleared | A short message above the action bar; if copying is blocked, the link is shown ready to copy |
| R29 | A keyboard-focused category tile could sit under the faded edge | It scrolls fully into view |
| R30 | Editing a sample shop said "may have been removed"; an empty edit link opened a blank form | "Only the owner can edit this shop" with a link; empty link shows "not found" |
| R31 | On desktop, Edit/Delete were hidden at the bottom of the sidebar | An owner bar at the top of your shop's page |
| R32 | Screen readers could miss "Your shop is live" | Announced through a permanent live region |
| R33 | The "Yours" badge was invisible to screen readers | Included in the card's description |
| R34 | Emoji still read aloud in the category list and notes | Removed or hidden |
| R35 | Empty status messages were hidden, so the first message might not be announced | They stay in place while empty |
| R36 | Category tiles were "toggle buttons" that couldn't be turned off, inside a navigation landmark | Pressing again turns the filter off; they are a labelled group |
| R37 | The language button's spoken name didn't contain its visible "EN" / "עב" | Name now starts with the visible text |
| R38 | Pressing Enter in search dropped focus to the page body | Focus moves to the results heading |
| R39 | Owner text in the other language had no language tag | Hebrew/English owner text is tagged for the right voice |
| R40 | Shop-page panels touched each other on phones | Even gaps |
| R41 | The shop page's awning lost its scalloped edge | Restored |
| R42 | Text inside a card spread apart when a neighbour card was taller | Extra space goes above the footer |
| R43 | Awning stripes ended in a thin sliver | Stripes always end whole |
| R44 | At 1024×768 the category grid filled the first screen | One scrolling row until all nine fit |
| R45 | The OPEN sign was wider than the door | Shorter sign |
| R46 | The form preview at 600–899px showed a card far wider than real cards | Limited to real card width |
| R47 | The "·" separator could start a wrapped line | It is hidden at line starts |

## The redesign

- **Idea:** every shop gets a storefront. Cards and category tiles wear a striped awning in their category colour over a tinted "shop window". The app's purpose is to give small shops a place to be seen, and the storefront makes that visible.
- **Type:** Suez One (sign-painter serif, has Hebrew) for headings and shop names; Assistant for text.
- **Colour:** warm paper background, dark ink, tomato accent; every text colour passes WCAG AA.
- **Home:** short headline, one search bar with "Near me" inside it, category "street", then results. Desktop shows an animated storefront with a swinging OPEN sign (still for people who turn off motion).
- **Shop page:** awning hero, photo gallery with buttons, status with times, prices, today's hours highlighted, contact with Waze/WhatsApp/Share, sticky Call/Directions on phones, two columns on desktop, and an owner bar (Edit / Delete) on your own shop.
- **Owner form:** 5 steps, live preview of your card, "24 hours" days, per-row price checks, a kept draft per form, edit after publishing.

## Still open (needs the next step: a backend)

- Shops are saved only in the browser on one device. Customers can't see them until there is a server and database.
- Map: confirm the shop's location by typing the address and dragging a pin.
- Trust: reviews or ratings, "verified owner".
- Accounts so an owner can log in and edit from any device.

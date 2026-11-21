# QR Menu — test findings and fix list

> **Status:** every item below (F1–F14, A1–A7, U1–U9, B1) is fixed in `core/`.
> Independent browser testers then re-checked each fix. The issues they found
> (drawer links not scrolling, a single text `tags` blanking the page, the name
> running under the language button, long About values, keyboard scrolling of
> the dish sheet, the hero focus ring, and about 15 smaller ones) are fixed and
> re-tested too. The **Owner decisions** at the end are still open: nothing there
> has been built.

Audit of the default template in `qr-menu/` (commit `783dcd8`). Nothing in the
template was changed by this audit. This file is the work order for whoever
fixes it.

## How it was tested

Headless Chromium (Playwright) at 320×640, 390×844, 844×390 (landscape),
768×1024, 1280×800 and 1920×1080, in Hebrew and English, plus an axe-core
accessibility scan (WCAG 2 A/AA + best practice) on Home, Menu, the item sheet
and About. A second copy of the template was loaded with awkward content: a very
long restaurant name and address, a missing photo, an item with one or no
stats, a decimal price, a duplicated item id and an empty category.

Not tested: real iPhone Safari, Samsung Internet, screen readers, slow networks.
Items marked **(unverified)** come from reading the code or from known browser
behaviour, not from a reproduced failure.

## Rules for the fixes

- Keep the look: black and white default, rounded corners, two cards per row on phones.
- Keep it view-only. No cart, ordering or payment.
- Keep `config.js` backward compatible. Every new field must be optional.
- All layout must keep working in both `dir="rtl"` and `dir="ltr"`. Use logical properties (`inset-inline-start`, `padding-inline`, `text-align: start`).
- After the fixes, re-run the checks listed under each item, and confirm no horizontal scrolling at 320 px and no console errors.

## What passed

- No horizontal scrolling at 320, 360 and 390 px, in either language.
- No console errors, no failed requests on load. Total page weight is 39 KB.
- Drawer, category strip, item sheet, search and language switch all work on the happy path.
- Background does not scroll behind an open sheet (Chromium), and no layout shift when it opens on desktop.
- All text from `config.js` is HTML-escaped before it reaches the page.

---

## Priority 1 — broken behaviour

### F1. The phone Back button leaves the site
**Seen:** Home → Menu → open a dish → Back went straight to the previous site
(`about:blank`). Home → Menu → About → Back did the same. Views and overlays
are never added to browser history: `show()` uses `history.replaceState`
(`app.js:172`), and `openDrawer()` / `openItem()` do not touch history.

**Fix (`app.js`):**
1. Add `navigate(v, catId)`: if `v !== view`, call `history.pushState({ view: v }, "", "#" + v)`, then `show(v, catId)`. Use it from the click handler instead of calling `show()` directly.
2. `show()` must stop writing history, except one `replaceState` on first load.
3. In `openDrawer()` and `openItem()`, call `history.pushState({ overlay: true }, "")` (same URL).
4. Close button, backdrop and Escape: if `history.state && history.state.overlay`, call `history.back()`; otherwise call `closeAll()`.
5. Replace the `hashchange` listener with `popstate`: first `closeAll()` if anything is open, then `show(location.hash.slice(1) || "home")`.
6. When a link inside the drawer is tapped, do not stack a second entry: `history.replaceState({ view: v }, "", "#" + v)` to turn the overlay entry into the destination, then `closeAll()` and `show(v, catId)`.

**Check:** Home → Menu → open dish → Back closes the sheet and stays on Menu → Back shows Home → Back leaves. Drawer open → Back closes the drawer only.

### F2. An active search blocks category links, and breaks on language switch
**Seen:** Searched "choc", opened the drawer, tapped Drinks: still only Desserts
on screen, search box still says "choc". Then switched to Hebrew: "nothing
found", because search only looks at the current language. In Hebrew mode
"NOODLES" finds nothing; "צילי" (no apostrophe) does not find "צ'ילי".

**Fix (`app.js`):**
1. In the document click handler, before `show("menu", cat)` and before any `data-view` navigation: if `$("search").value` is not empty, set it to `""` and call `renderMenu()`.
2. In `renderMenu()` build the haystack from every language in `cfg.languages`, not only `lang`: all `name[l]`, `desc[l]` and `ingredients[l]`.
3. Add `norm(s)`: `s.toLowerCase().replace(/[֑-ׇ]/g, "").replace(/['"׳״\-]/g, "")`. Apply it to both the query and the haystack.

**Check:** search "choc" → drawer → Drinks shows Drinks and the box is empty. In Hebrew, "choc", "NOODLES" and "צילי" each return one dish.

### F3. Switching language throws the customer back to the top
**Seen:** Scrolled to 900 px on the menu, tapped the language button, landed at 0.
The handler at `app.js:271` calls `show(view)`, which always scrolls to top.

**Fix:** In the handler, before `renderAll()`, save `var keep = view === "menu" ? activeCat : null; var y = window.scrollY;`. After `renderAll()`, do not call `show(view)`. Instead: if `keep` and `$("cat-" + keep)` exist, `scrollIntoView({ block: "start", behavior: "instant" })`; else `window.scrollTo({ top: y, behavior: "instant" })`. Then call `spy()`.

**Check:** scroll to Desserts, switch language, still at Desserts with the Desserts chip active.

### F4. Item sheet is unusable in landscape and oversized on tablets
**Seen:** At 844×390 the photo box is 512 px tall inside a 351 px sheet; the dish
name sits at y=579, below the screen, so the sheet shows only the picture. At
768×1024 the photo is 465 px tall and the sheet is full width.

**Fix (`styles.css`):**
```css
.sheet .thumb { aspect-ratio: 16 / 10; max-height: min(38vh, 320px); }
@media (min-width: 600px) and (max-width: 899px) {
  .sheet { left: 50%; right: auto; width: min(560px, 100%); transform: translate(-50%, 105%); }
  .sheet.open { transform: translate(-50%, 0); }
}
```
**Check:** at 844×390 and 768×1024 the name and price are visible without scrolling the sheet.

### F5. The close button scrolls away on long dishes
**Seen:** With a long description and 30 ingredients, after scrolling the sheet
the ✕ is 210 px above the screen. `.sheet` is the scroll container and the
button is `position: absolute` inside it.

**Fix:** In `styles.css`, make `.sheet` a non-scrolling flex column (`display: flex; flex-direction: column; overflow: hidden;`) and move scrolling to `.sheet-body` (`flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain;`). In `openItem()`, reset `$("sheetBody").scrollTop = 0` instead of `$("sheet").scrollTop`.

**Check:** scroll a long dish to the bottom; ✕ stays in the corner.

### F6. A long restaurant name breaks the top bar
**Seen:** At 320 px a long name wraps to three lines, spills out of the 56 px bar
and squeezes the hamburger button to 25 px wide.

**Fix:** In `renderChrome()` wrap the text name in `<span class="brand-text">`. In `styles.css`:
```css
.topbar .icon-btn, .lang-btn { flex: none; }
.brand { flex: 1; min-width: 0; justify-content: center; padding-inline: 8px; }
.brand-text, .drawer-brand { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```
**Check:** with a 45-character name at 320 px the bar stays one line and the hamburger is 44×44.

### F7. A long address runs off the card
**Seen:** At 320 px the address row overflows its card by 373 px (English) and
212 px (Hebrew). Cause: `white-space: nowrap` at `styles.css:254`.

**Fix:** In `renderAbout()` give each value the class `info-val` and each label `info-key`. Replace line 254 with:
```css
.info-key { flex: none; }
.info-val { font-weight: 600; text-align: end; min-width: 0; overflow-wrap: anywhere; }
.info-val[dir="ltr"], .info-row [dir="ltr"] .info-val { white-space: nowrap; }
```
**Check:** `scrollWidth === clientWidth` for every `.info-row` at 320 px with an 80-character address.

### F8. A missing photo shows a broken-image icon
**Seen:** An item with `image: "images/missing.jpg"` shows the browser's broken
image box instead of falling back to the emoji.

**Fix:** In `thumb()` always output the emoji, and the photo on top of it when set:
`<span class="thumb"><span aria-hidden="true">EMOJI</span><img …></span>`. Add once in `app.js`:
```js
document.addEventListener("error", function (e) {
  if (e.target.tagName === "IMG" && e.target.closest(".thumb")) e.target.remove();
}, true);
```
**Check:** a wrong image path shows the emoji tile.

### F9. Two dishes with the same `id` open the wrong dish
**Seen:** With two items both called `hummus`, the later one silently replaces
the earlier one in `itemsById` (`app.js:33`), so tapping the first card opens
the second dish. No warning.

**Fix:** Key items by category: `var key = c.id + "/" + (it.id || index)`. Store it on the item (`it._key = key`), use it for `itemsById` and for `data-item`. `console.warn` when two categories share an id.

**Check:** two items with the same id in different categories each open their own sheet.

### F10. An empty category shows a dead link
**Seen:** A category with `items: []` appears as a Home tile ("0 items") and in
the drawer; tapping it does nothing because no section is rendered.

**Fix:** After loading the config, build `var cats = cfg.categories.filter(function (c) { return c.items && c.items.length; });` and use `cats` everywhere `cfg.categories` is used now.

### F11. A mistake in `config.js` gives a blank page
**Seen:** With a syntax error in `config.js` the page shows only a stray "✕".
With JavaScript off the page is empty.

**Fix:** At the top of `app.js`: if `!cfg || !Array.isArray(cfg.categories)`, set `document.body.innerHTML` to a centred bilingual message ("התפריט אינו זמין כרגע · The menu is unavailable right now") and `return`. Add the same text in a `<noscript>` block in `index.html`.

### F12. One stat leaves a hole; no stats leaves an empty gap
**Seen:** A dish with only a prep time shows one box and an empty half row. A
dish with neither still renders an empty `.stats` block with its margin.

**Fix:** In `openItem()` collect the stat boxes in an array and output `.stats` only when the array is not empty. In `styles.css:240` change `.stats` to `display: flex; gap: 10px;` and add `.stat { flex: 1; }`.

### F13. Decimal prices drop the trailing zero
**Seen:** `price: 32.5` shows "₪32.5".

**Fix:** In `price()` (`app.js:54`): if `typeof p === "number"`, use `Number.isInteger(p) ? String(p) : p.toFixed(2)`; if it is a string, show it unchanged.

### F14. A text given in only one language shows blank in the other (unverified)
`t()` (`app.js:44`) falls back only to `en`. A dish written only in Hebrew shows
an empty name in English. Fix: fall back to `v[cfg.defaultLang]`, then to the
first non-empty value. Apply the same fallback to `ingredients`.

---

## Priority 2 — accessibility

### A1. Grey text is too faint
**Seen (axe, serious):** `--muted #7a7a7a` on white is 4.29:1 (needs 4.5:1) —
card tags, tile subtitles, descriptions. Category counts are 2.41:1 because
`.count` also has `opacity: .7` (`styles.css:106`).

**Fix:** Change the default `--muted` to `#666666` in `styles.css:6` and in `config.js` `theme.muted`. Remove `opacity: .7` from `.count`; add `.side-cats button:not(.active) .count { color: var(--muted); }`. Add `.search::placeholder { color: var(--muted); opacity: 1; }`.

**Check:** axe reports no `color-contrast` violations on Home, Menu, sheet, About.

### A2. Keyboard focus escapes the open sheet and drawer
**Seen:** With the sheet open, six Tab presses all landed on dish cards behind it.

**Fix:** In `syncOverlay()` (`app.js:211`) set `$("main").inert = anyOpen();` and `document.querySelector(".topbar").inert = anyOpen();`. `closeAll()` already calls `syncOverlay()` before restoring focus; keep that order.

**Check:** with the sheet open, Tab never leaves the sheet.

### A3. The drawer is not announced as a dialog
**Fix (`index.html`):** change `<nav class="drawer" …>` to `<div class="drawer" id="drawer" role="dialog" aria-modal="true" …>` and wrap `#drawerLinks` in `<nav>`. In `renderChrome()` set `aria-label` on the drawer to the `menu` label. Add `aria-current="page"` to the active `.drawer-link` and `aria-current="true"` to the active chip and sidebar button.

### A4. The language button has no name, and "עב" is not a real abbreviation
**Fix:** Show the full target language: `switchTo: "עברית"` in the English strings, `switchTo: "English"` in the Hebrew strings. In `renderChrome()` also set `lang` on the button to the target language code.

### A5. Menu and About have no main heading
**Seen (axe, moderate):** `page-has-heading-one` on Menu.

**Fix:** Add a visually hidden `<h1>` at the top of the Menu and About views with the view name, and add:
```css
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
```

### A6. Some tap targets are smaller than the 44 px guideline
**Seen:** language button 44×34, chips 36 high, sheet ✕ 38×38, drawer category
rows 42 high. All pass the WCAG 2.2 AA minimum (24 px); they miss the 44 px
recommended for phones.

**Fix (`styles.css`):** `.lang-btn { height: 40px; }`, `.chip { height: 40px; }`, `.sheet-close { width: 44px; height: 44px; }`, `.drawer-sub button { padding: 12px 16px; }`.

### A7. Decorative emoji are read aloud (unverified)
Add `aria-hidden="true"` to the emoji span in `.cat-tile` (the thumb emoji is covered by F8).

---

## Priority 3 — polish

### U1. The category chip flickers through every category when tapped
**Seen:** After tapping Desserts the active chip went Appetizers → Mains → Drinks → Desserts while the page scrolled.

**Fix:** Split the highlighting out of `spy()` into `setActive(id)`. In `show()` with a `catId`: call `setActive(catId)`, set `spyLock = true`, and clear it on the window `scrollend` event with a 900 ms `setTimeout` fallback. `spy()` returns early while `spyLock` is true.

### U2. The search box is gone once you scroll
**Seen:** After scrolling 900 px the search field is off screen; only the chips stay.

**Fix:** Add a 40×40 search icon button as the first child of `.chips` (shown below 900 px only). On tap: `window.scrollTo({ top: 0 })` then `$("search").focus({ preventScroll: true })`. Add `enterkeyhint="search"` to the input, and blur it on Enter so the phone keyboard closes.

### U3. The top bar is not aligned with the content on wide screens
**Seen:** At 1920 px the hamburger sits at x=8 while the content starts at x=360.

**Fix:** `.topbar { padding-inline: max(8px, calc((100% - 1200px) / 2)); }`.

### U4. `?lang=` in the link beats the customer's own choice forever
**Seen:** Opened with `?lang=en`, switched to Hebrew, reloaded: English again.

**Fix:** In the language button handler, after saving the choice, remove the `lang` query parameter with `history.replaceState` (keep the hash).

### U5. Search rebuilds every card on each keystroke (unverified impact)
With real photos this will make images flash while typing. Render the sections
once per language; on input, toggle `hidden` on cards and on sections with no
visible card, using a precomputed normalised haystack per card.

### U6. No swipe-down to close the sheet
Add a small drag handle bar at the top of the sheet. On `touchstart` / `touchmove`
/ `touchend` when `sheetBody.scrollTop === 0`: follow the finger with
`translateY`, close when dragged more than 100 px, snap back otherwise. Skip the
transition under `prefers-reduced-motion`.

### U7. Background scroll on iPhone (unverified)
`body.locked { overflow: hidden }` held in Chromium. It was not tested on iOS
Safari, where it has a history of not stopping touch scrolling. Add
`.backdrop { touch-action: none; }` and `overscroll-behavior: contain` on
`.drawer-links`, then test on a real iPhone.

### U8. Forced dark mode (unverified)
Some Android browsers recolour pages that do not declare a scheme. Add
`<meta name="color-scheme" content="only light">` to `index.html` and
`color-scheme: only light;` to `:root`. Set the `theme-color` meta from
`cfg.theme.card` in `applyTheme()` instead of the hard-coded `#ffffff`.

### U9. Link previews and browser tab are bare
**Seen:** No meta description, no Open Graph tags, no favicon. A menu link
shared on WhatsApp will show no title, text or picture.

**Fix:** Add to `index.html` (filled in per client, since previews do not run JavaScript): `<meta name="description">`, `og:title`, `og:description`, `og:image`, `<link rel="icon">`. Add them to the README checklist.

---

## Structure — needed before the second client

### B1. Copying the whole folder per client multiplies every bug fix
Today each restaurant gets a full copy of `app.js` and `styles.css`. Every fix in
this file would then have to be repeated in every copy.

**Fix:** Split shared code from client content:
```
qr-menu/
  core/app.js
  core/styles.css
  clients/_default/index.html   ← the black-and-white default
  clients/_default/config.js
  clients/<restaurant>/index.html, config.js, images/
```
Each client `index.html` loads `../../core/styles.css`, its own `config.js`, then `../../core/app.js`, and carries its own title, description and Open Graph tags (U9). Update `README.md`: a new client is a copy of `clients/_default` only.

---

## Owner decisions — do not build until confirmed

1. **Open straight on the menu?** A customer who scans the code lands on Home and must tap once more to see food. Option: `startView: "menu"` in `config.js`, default `"home"`.
2. **Fields restaurants usually ask for**, all optional per item: `allergens: { en: [], he: [] }`, `variants: [{ label: { en, he }, price }]` for sizes, `soldOut: true`, and extra tags (`glutenFree`, `kosher`). Per restaurant: map link, WhatsApp and Instagram links in `info`.
3. **Accessibility statement.** Clients in Israel may be required to publish one (הצהרת נגישות) and meet WCAG AA. Confirm what applies, then add an optional `info.accessibility` text shown on the About page.
4. **Photo rules for clients.** No size guidance exists. Suggested: 4:3, 800 px wide, JPEG or WebP under 150 KB each.
5. **Hosting.** The template is not deployed anywhere, and the repository is still named `tictactoe`.

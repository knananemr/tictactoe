# Nearby — theme blueprint ("Indigo")

This is the spec for re-skinning the existing Nearby app so it looks like the owner's mock-ups.
The mock-ups are in `design/mockups/` (01 … 07). Open them before you start; they are the target.

## 1. The job, and its limits

**Change how the app looks. Do not change what it does.**

- The app keeps every feature, route, text string, id, `data-*` hook, ARIA attribute and behaviour it has today.
- Work happens mainly in `src/styles.css`. Small, purely presentational edits to the HTML templates in `src/views/*.js`
  (and the small templates in `src/hours.js`, `src/notices.js`, `src/icons.js`)
  and to `index.html` are allowed where the new look needs them (icons, logo, wrappers, moving an element
  inside the same card). Keep every class, id and attribute that JS or the tests use.
- No logic changes: search, filters, hours, storage, drafts, routing, validation and language switching stay as they are.
- The mock-ups are AI-drawn. Copy the **theme** (colour, type, shape, shadow, icon style, component anatomy).
  Do not copy their exact pixel ratios, their sample photos, or their small errors (mirrored text, odd dates).
- Hebrew (right to left) is the main language. Everything must also work in English (left to right).
  Use logical properties (`inline-start`, `margin-inline`, …) as the current CSS already does.

### In the mock-ups but not in the app — do not build these

Booking ("הזמן תור" buttons, service radio buttons, date and time picker, confirmation, "my bookings"),
favourites (hearts), notifications bell, hamburger menu, bottom tab bar, reviews tab, coupons, owner dashboard menu.
Never add a control that does nothing. Use these screens only as **style references** for parts we do have:

| Mock-up element | Use its style for |
| --- | --- |
| Primary pill "הזמן עכשיו" | `.btn-accent` (Call, Save, Directions when there is no phone) |
| Outline pill "הוסף את העסק שלך" | default `.btn`, `#navNew`, card call-to-action |
| Numbered stepper circles | `.step-num` in the owner form |
| Service rows with price | `.price-list li` on the shop page, `.service-row` in the form |
| Selected radio row (lavender fill, indigo border) | any selected / current row (today in the hours list) |
| Date and time chips | time inputs, `.toggle`, `.select` |
| Segmented control | `.toggle` (Open now) pressed state |
| White round floating buttons on the photo | `.back`, `.gallery-btn`, `.btn-icon` |
| Dashboard menu rows (icon + label) | `.contact-list li`, `.owner-bar` |
| Red outline "ביטול" | `.btn-danger` |
| Green tick circle on the confirmation screen | success notice |
| Indigo banner with the little shop (02) | `.owner-cta` |

## 2. Design tokens

Keep the existing custom-property **names** (so the rest of the stylesheet keeps working) and give them new values.
Add the new ones listed below.

```css
:root {
  /* surfaces */
  --paper: #F8F8FE;        /* page background (very pale lavender-white) */
  --paper-2: #F1F0FC;      /* swatch 4: quiet fills, segmented track, placeholders */
  --card: #FFFFFF;
  --tint: #E6E5FA;         /* swatch 3: selected rows, icon wells, chips */

  /* text */
  --ink: #16162E;          /* swatch 5: text, logo tile, toast */
  --ink-2: #33334D;
  --muted: #64647F;        /* secondary text (5.7:1 on white) */
  --placeholder: #6F6E8A;  /* 4.9:1 on white */

  /* lines */
  --line: #E7E6F5;         /* hairlines, card borders */
  --line-strong: #D3D2EA;
  --field: #8583AA;        /* borders of inputs and other controls (3.6:1 on white) */

  /* brand */
  --accent: #4B3ACF;       /* swatch 1: buttons, selected state, icons, links (white on it = 7.5:1) */
  --accent-strong: #3B2BB0;/* hover / pressed */
  --accent-2: #8187F2;     /* swatch 2: periwinkle, decoration only (white text on it fails) */
  --accent-text: #4B3ACF;
  --accent-soft: #E6E5FA;

  /* status */
  --open: #18783A;   --open-dot: #2FB24C;   --open-soft: #E8F7EC;
  --closed: #C4322F; --closed-soft: #FDECEB;
  --focus: #4B3ACF;        /* white on dark or indigo surfaces */

  /* type */
  --display: "Rubik", "Heebo", "Segoe UI", Arial, sans-serif;
  --body: "Heebo", "Rubik", "Segoe UI", Arial, sans-serif;

  /* shape */
  --r-sm: 12px;  --r: 16px;  --r-lg: 22px;  --r-xl: 28px;  --pill: 999px;

  /* depth: soft, wide, slightly indigo. No hard offset shadows. */
  --shadow-sm: 0 1px 2px rgb(22 22 46 / .04), 0 4px 14px rgb(75 58 207 / .07);
  --shadow:    0 2px 4px rgb(22 22 46 / .04), 0 12px 30px rgb(75 58 207 / .11);
  --shadow-btn: 0 6px 16px rgb(75 58 207 / .28);
}
```

Rules that follow from the palette:

- White text only on `--accent`, `--accent-strong`, `--ink`, or a photo with the dark overlay. Never on `--accent-2`.
- Status never relies on colour alone: keep the dot and the word.
- Input and control borders use `--field` (1px). This is a little stronger than the mock-up on purpose, so the
  fields stay visible to people with low vision. Card borders and dividers use `--line`.

### Type

- Fonts: **Heebo** (body, 400/500/700) and **Rubik** (headings, names, prices, logo, 600/700/800).
  Google Fonts link for `index.html`:
  `https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&family=Rubik:wght@500;600;700;800&display=swap`
- Headings are bold sans, not serif. No italics: the `<em>` in the home `h1` becomes indigo, upright.
- Phone sizes: h1 28px/1.15 (800) · h2 20px/1.2 (700) · card name 17px (700) · body 16–17px · small 14px · smallest 12.5px.
  Desktop h1 up to about 48px. Prices and times use `font-variant-numeric: tabular-nums`.

### Page background

Flat `--paper` with one soft lavender glow at the top
(`radial-gradient(1100px 480px at 50% -8%, #ECEBFC 0, transparent 70%)`). Remove the paper grain.
`<meta name="theme-color">` becomes `#F8F8FE`.

### Icons

Mock-up icons are thin line icons with round ends. Emoji must go.

- Add to the `ICON` map in `src/icons.js` (same style as the existing entries: 24×24 viewBox, `fill="none"`,
  `stroke="currentColor"`, `stroke-width="1.75"`, round caps and joins, `aria-hidden="true"`):
  `grid` (four rounded squares, for "All"), `clock`, `pin`, `chevron`, `store`, `check`, `info`, `alert`, `arrow`,
  and one per category.
- Category icons, by category id: `barber` scissors · `hair` hair-dryer · `nails` nail-polish bottle ·
  `beauty` lotus flower · `dental` tooth · `physio` dumbbell · `massage` hand with drops or spa stones ·
  `tattoo` pen nib · other/unknown: `store`.
- Replace every `<span class="emoji">…</span>` and inline emoji in the templates (category tiles, card window,
  shop hero, shop meta, hero art, "★" on the All tile) with the matching icon. Keep `aria-hidden`.
  The category `<select>` in the form keeps plain text options (a test checks there is no emoji there).
- Icon colour: indigo on white, white on indigo, navy inside the white badge on photos.
- `src/categories.js`: the `emoji` field may stay as unused data. Change the category `color` values to this cooler set,
  used only for the no-photo placeholder (section 3.5):
  barber `#4B3ACF` · hair `#7A3FD0` · nails `#C0398F` · beauty `#9A4CCB` · dental `#2F6FD6` ·
  physio `#1F8A8A` · massage `#5961DD` · tattoo `#23233F` · other `#5B5B7A`.

### Motion

Short and calm: 160–220ms ease-out. Cards lift 2px on hover, buttons scale to .98 when pressed, `.fade-in`
rises 8px while fading in (keep the `--i` stagger). Keep every `prefers-reduced-motion` rule.

## 3. Components (old → new)

### 3.1 Header — `.topbar` (mock-up 03, top)

- Sticky, 64px, background `rgb(248 248 254 / .88)` with `backdrop-filter: blur(14px)`, 1px `--line` bottom border.
  Keep the safe-area rules at the end of the stylesheet.
- **Logo** (mock-up 01): an indigo map pin with a white round hole, then two stacked lines:
  "Nearby" (Rubik 800, about 22px, `--ink`, `lang="en" dir="ltr"`) and "קרוב אליי" (Rubik 700, about 15px, `--ink`,
  `lang="he"`). The logo shows both names in both languages.
  - Replace the pin path in `index.html` (header and favicon) with: pin shape filled `#4B3ACF` plus a white circle.
  - `renderChrome()` currently writes the current-language name into `#brandName`. Change that one line so the
    lockup keeps both names; keep an accessible name for the link in the current language.
- Phones (< 600px): logo centred; `#navNew` at the inline start, `#langBtn` at the inline end
  (the mock-up has an icon each side of the logo). From 600px: logo at the start, both actions at the end.
- `#langBtn`: 44px white circle, soft shadow, navy bold "EN" / "עב".
- `#navNew`: compact outline pill (white, 1.5px indigo border, indigo text, plus icon). It must not overflow at 320px:
  below 380px show the short label, and if it still does not fit, the icon alone (keep the accessible name).

### 3.2 Buttons — `.btn`

Pill shape everywhere. Height 48px (`.btn-sm` 40px). Heebo 700, 16px. Icon 20px, 8px gap.

| Class | Look |
| --- | --- |
| `.btn` (default) | white, 1.5px `--accent` border, `--accent` text (mock-up 01, second button) |
| `.btn-accent` | `--accent` fill, white text, `--shadow-btn`; hover `--accent-strong` (mock-up 01, first button) |
| `.btn-ghost` | white, 1px `--line-strong` border, `--ink` text, `--shadow-sm` |
| `.btn-danger` | white, 1.5px `--closed` border, `--closed` text |
| `.btn-confirm-danger` | `--closed` fill, white text |
| `.btn-icon` | 44–48px circle |

Focus: `outline: 3px solid var(--focus); outline-offset: 2px`. On indigo, navy or photo surfaces the ring is white.

### 3.3 Home top — `.hero` (mock-up 03)

- Phones: text centred. `#eyebrow` is a small pill (`--tint` fill, indigo text, 13px 600, green dot).
- `h1`: Rubik 800, `--ink`; its `<em>` is `--accent`.
- `.hero-sub`: `--muted`.
- `.searchbar`: white pill, 56px, 1px `--field` border, `--shadow-sm`, indigo search icon at the inline start,
  placeholder `--placeholder`. When focused inside: indigo border plus the solid focus ring.
- `#nearBtn` (inside the bar, inline end): pill. Off: `--tint` fill, indigo text and icon. On (`aria-pressed="true"`):
  indigo fill, white text.
- `.hero-art` (desktop only): redraw the little shop in the mock-up 02 style: periwinkle and lavender flat shapes,
  white and lavender striped awning, line icons instead of emoji. Keep `.store .sign` and its one-time swing.

### 3.4 Category row — `.street` and `.shopfront` (mock-up 03, chips)

- Each tile is a rounded square chip: white, radius 18px, 1px `--line` border, `--shadow-sm`,
  indigo line icon (24px) on top, name under it (13px 600 `--ink`), count `.n` in 11.5px `--muted`.
  Phone: about 78px wide, one scrolling row (keep the scroll snapping and the edge fade, recoloured to `--paper`).
  From 1100px: the nine-column grid stays.
- Hide `.shopfront .awning`.
- Selected (`aria-pressed="true"`): `--accent` fill, white icon, white name, count at 85% white,
  shadow `0 6px 14px rgb(75 58 207 / .30)`, no border.
- Hover: border `--accent-2`, lift 1px. "All" uses the `grid` icon.

### 3.5 Results toolbar and shop cards — `.toolbar`, `.grid`, `.card` (mock-up 03, cards)

Toolbar:

- `#resultsTitle`: Rubik 700, 20px. `#count` and `#locStatus`: `--muted`, 14px.
- `.toggle` (Open now): 44px white pill, 1px `--field` border, with its small switch `.sw`
  (track `--field`, white knob). Pressed: `--tint` fill, indigo border and text, indigo track.
- `.select`: 44px white pill, 1px `--field` border, chevron at the inline end.
- `.demo-btn`: default outline pill.

Card anatomy, top to bottom (the whole card stays one link; nothing inside it is a button):

1. **Photo area** `.window`: full card width, 4:3 on phones, top corners follow the card (22px),
   bottom corners 16px. Photo fills it (`object-fit: cover`). Remove the old inset, sill and awning.
   A dark fade sits over the bottom:
   `linear-gradient(to top, rgb(22 22 46 / .80) 0%, rgb(22 22 46 / .38) 40%, transparent 68%)`.
2. **On the photo, bottom, inline start**: a white badge (34px, radius 10px) holding the navy category icon;
   under it the shop name (`h3`, Rubik 700, 17px, white, at most two lines) and the category name
   (13px, white at 85%).
3. **On the photo, top, inline end**: the "Yours" pill `.pill.mine` (white fill, indigo text, 12px 700).
   This is where the mock-up has the heart.
4. **Under the photo**, one row: status at the inline start (green dot + "פתוח" in `--open`, or red dot + "סגור"
   in `--closed`; in cards the status has **no** pill background), a 1px `--line` vertical divider,
   and distance `.dist` with a small `pin` icon at the inline end (13px `--ink-2`).
5. Second row: `.hint-small` (for example "closes at 20:00") in `--muted` 12.5px.
6. Third row: "from ₪60" (`.from`, number in bold `--ink`) and the address `.card-addr`
   (`--muted`, 13px, one line with ellipsis).
7. **Call-to-action look**: a full-width outline pill (40px, indigo border and text, chevron pointing to the
   inline end) with the existing `viewShop` text. It is a decorative `<span class="card-cta" aria-hidden="true">`
   inside the link. On card hover or focus it fills indigo with white text. Show it in the form preview card too.

You may restructure the template in `cardHtml()` to get this (for example a caption block inside the photo area),
as long as `h3#…-n`, `.card-top`, `.dist`, `.card-meta`, `.meta-in`, `.from`, `.card-addr`, `.card-foot`,
`.foot-status`, `.pill`, `.hint-small` and the `sr-only` summary still exist and the link's
`aria-labelledby` / `aria-describedby` still work.

Card box: white, radius 22px, 1px `--line` border, `--shadow-sm`; hover `--shadow` and a 2px lift.

Grid: **two columns on phones** (as in the mock-up) from 350px wide, one column below that;
three columns from about 900px, four from about 1200px. Gap 12px on phones, 18px on desktop.

**No photo** (all ten demo shops): the photo area shows a gradient made from the category colour `--c`:
`linear-gradient(155deg, color-mix(in srgb, var(--c) 72%, white) 0%, var(--c) 52%, color-mix(in srgb, var(--c) 62%, #16162E) 100%)`
with the category icon drawn large (about 96px), white at 16% opacity, tilted about −8°, near the top inline end.
The same dark fade, badge and white text sit on top. Check the white name still reads at 4.5:1 or better.

Empty result state: white card, radius 22px, icon in a `--tint` circle, text centred.

### 3.6 Owner banner — `.owner-cta` (mock-up 02)

- Radius 22px, padding 22px, white text, `--shadow`.
- Background: indigo gradient that is darkest under the text and lighter under the picture:
  from `#4B3ACF` (text side, inline start) to `#6B5FE0` (picture side, inline end). Mirror it by direction.
- Hide its `.awning`. Add a small flat illustration of a shop with a white and lavender striped awning
  (inline SVG or CSS, `aria-hidden`, periwinkle and lavender tones) at the inline end. Hide it under 360px if it crowds the text.
- `h2`: Rubik 800, white. `p`: white at 90%.
- The button is a white pill with `--accent` text and an arrow pointing to the inline end. Its focus ring is white.

### 3.7 Shop page — `.shop-page` (mock-ups 04 and 05)

- `.back`: 44px-high white pill with a chevron and its text, `--shadow-sm`.
- `.owner-bar`: white card, radius 16px. `.owner-tag` is an indigo pill. Edit = outline pill, Remove = red outline pill.
  `.confirm-box`: `--closed-soft` fill, radius 16px. `.owner-error`: `--closed` text with an alert icon.
- `.shop-hero`: one white card, radius 28px, `--shadow`, clipped. Hide its `.awning`.
  - `.gallery-wrap`: the photo, full width, about `clamp(220px, 60vw, 340px)` high on phones.
    Keep the current behaviour that shows the whole photo over a blurred copy of itself (portrait photos must not be cropped).
    Remove the sill. No photo: the same category gradient and large icon as the cards.
  - `.gallery-btn`: 44px white circles with navy chevrons and `--shadow-sm`. `#galleryCount`: dark see-through pill, white text.
  - `.shop-title` is the "sheet": white, pulled up 28px over the photo, top radius 28px, padding 20px.
    Add a **logo tile** at its top inline start: 64px, radius 18px, `--ink` fill, 4px white border, white category icon,
    sitting half over the photo edge (mock-up 04). It is decorative (`aria-hidden`).
    Then `h1` (Rubik 800, 26px), the category and distance line in `--muted` (pin icon before the distance),
    and `#shopStatus`: here the status **is** a pill (`--open-soft` fill, green dot, `--open` text; closed uses
    `--closed-soft` and `--closed`), followed by the detail text in `--muted`.
  - `.actions.desktop-only`: Call = primary pill; Directions and Share = outline pills.
- `.panel`: white card, radius 22px, 1px `--line`, `--shadow-sm`, padding 18–20px. `h2`: Rubik 700, 19px.
- `.price-list li` (mock-up 05 rows): each service is its own row card: white, 1px `--line`, radius 16px,
  min-height 56px, 10px apart. At the inline start a 40px `--tint` square (radius 12px) with the indigo category icon;
  then the service name (16px 700) with the duration under or beside it (`--muted` 13px, small clock icon);
  the price at the inline end in Rubik 700, 17px. No dotted leaders.
- `.hours-list`: rows 44px high with `--line` hairlines between them. Today's row (`li.today`): `--tint` fill,
  radius 12px, bold, `.today-tag` as a small indigo pill. Closed days in `--muted`.
- `.contact-list li` (mock-up 07, dashboard rows): icon inside a 40px `--tint` rounded square (indigo icon),
  then the link text (`--ink`, 600). Hairline between rows. Links underline on hover and focus.
- `.about`: 16px, `--ink-2`; links inside it are indigo and underlined.
- `.action-bar` (phones, fixed at the bottom; mock-ups 04–06 bottom button): see-through white bar with blur,
  1px `--line` on top, safe-area padding. The primary button is a full-width indigo pill (52px);
  the second is an outline pill; Share is a 48px outline circle.
- Not-found page: centred white card with an icon in a `--tint` circle.

### 3.8 Owner form — `#/new`, `#/edit/<id>` (mock-ups 06 and 07)

- `.page-head h1`: Rubik 800, 26px.
- `.panel.step`: white card, radius 22px. `.step-num`: 32px indigo circle, white Rubik 700 number (the stepper circles).
- `.field`: label 14.5px 600 `--ink`; `.help` 13.5px `--muted`; `.req` in `--accent`.
  Inputs, select, textarea: white, 1px `--field`, radius 14px, height 50px (keep at least 48px), 14px side padding,
  placeholder `--placeholder`. Focus: indigo border and the solid 3px ring.
  Invalid (`aria-invalid="true"`): border and message both `--closed`, with the alert icon.
- Checkboxes (`.switch input`): 24px, radius 8px, 1px `--field`; checked = `--accent` fill with a white tick.
- `.hours-grid` / `.hours-row`: **keep the layout from the iPhone pass exactly** (grid, container query, time inputs).
  Only recolour: `--line` dashed dividers become solid hairlines, time inputs get radius 12px, day name 600.
- `.service-row`: `--paper-2` card, radius 16px, white inputs inside; remove button is a round ghost button.
- `.dropzone`: `--paper-2` fill, 1.5px dashed `--field`, radius 18px, indigo camera icon; dragging over: `--tint` fill, indigo border.
- `.thumb`: radius 14px; its remove button is a 28px white circle with a shadow.
- `.loc-box`: `--paper-2` card, radius 16px.
- `.note`: `--paper-2` fill, 1px `--line`, radius 16px, indigo info icon. Success notice: `--open-soft` with `--open` text.
  `.form-error`: `--closed-soft` fill, `--closed` border and text.
- `.submit-row`: Save = primary pill, 52px, full width on phones. Cancel = ghost.
- `.preview`: shows the card exactly as section 3.5 draws it.

### 3.9 Toast — `.toast`

`--ink` fill, white text, radius 16px, `--shadow`, bottom centre above the safe area (and above `.action-bar` on the shop page).
Buttons and the read-only link field inside it stay readable (white outline style).

## 4. Desktop

Content width about 1160px. Hero text at the inline start with `.hero-art` at the inline end.
Cards in three or four columns. Shop page keeps its two columns (`.shop-main`, `.shop-side`), the form keeps the
sticky preview. The look is the same as on phones, just with more room.

## 5. Checks

The test suite is `tests/suite.js`.
Run it with `cd /home/user/tictactoe/shop-finder && npm test` (builds dist/, then tests it). It has 232 checks and all pass today.

Checks that pin the old theme may be updated to the new values. Nothing else in the suite may be changed:

| About line | Old expectation | New expectation |
| --- | --- | --- |
| 566 | invalid border and error text `rgb(168, 54, 30)` | `rgb(196, 50, 47)` (`--closed`) |
| 569 | input focus ring `solid rgb(29, 78, 216)` | `solid rgb(75, 58, 207)` (`--focus`) |
| 613 | shop hero awning keeps its scallops | replace with: shop hero shows the logo tile over the photo edge |
| 652 | Open-now switch track and border `rgb(139, 127, 111)` | `rgb(133, 131, 170)` (`--field`) |
| 657–665 | sign swings once / not with reduced motion | keep as is (the sign stays) |

Also check by eye, with screenshots at 393×852 (Hebrew and English) and 1280×900:
home, home scrolled to the cards, a shop page (top and scrolled), the form (top, hours, photos, preview),
and one shop **with** photos (add one through the form with generated images, as `ios-shots.js` in the same folder does).

Look for: no horizontal scroll at 320, 360, 393, 768 and 1280px; text contrast 4.5:1 (3:1 for large text and control borders);
touch targets 44px or more; nothing left of the old theme (cream, terracotta, serif, awnings, emoji, paper grain);
`grep` for the old hex values to be sure.

## 6. Other rules

- The page must still pass its Content-Security-Policy: no new external files except the Google Fonts stylesheet.
  Icons and illustrations are inline SVG or CSS.
- `styles.css` should end up clean: delete rules that the new look no longer uses rather than overriding them.
- Do not touch `qr-menu/` or the tic-tac-toe files.

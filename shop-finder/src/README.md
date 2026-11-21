# src/ — the app's modules

**Run it** (from `shop-finder/`, after `npm install`): `npm run dev` (dev server), `npm test` (builds `dist/`, then runs `tests/suite.js dist`), `npm run shots` (builds, then screenshots), `npm run build && npm run preview` (the build at http://localhost:4173).
`index.html` and `dist/` must be served over http(s). Opening `index.html` or `dist/index.html` straight from disk (file://) shows a blank page, because browsers block module scripts there. Any static server works for `dist/`.

`index.html` loads one module, `main.js`; Vite bundles the rest. Each file, in import order (a file only imports files above it):

- `util.js` — helpers with no imports: limits (`MAX_PHOTOS`, `DEFAULT_TZ`), `esc`, patterns, phone / time / text-language helpers, `normalizeText`, `distanceKm`, `setText`, `normHash`, and the `#app` element.
- `icons.js` — the SVG icons (`ICON`), the icon of each category (`catIcon`) and the awning drawing.
- `storage.js` — the device-storage keys (`nearby.myShops`, `nearby.lang`, `nearby.draft.*`) and the `storage` wrapper around localStorage / sessionStorage (not the future `store/`).
- `state.js` — the one shared, mutable `state` object (language, the owner's shops, filters, location, notices, drafts, the form on screen, router memory). Read and write `state.x`; never copy a field into a local for later.
- `nav.js` — `nav.navigate` / `nav.render`, filled in by `main.js` before the first render, so views can navigate.
- `categories.js` — `APP_NAME`, `CURRENCY`, `CATEGORIES` and `category(id)`.
- `demo-data.js` — `SAMPLE_SHOPS`, the ten sample shops (local mode).
- `text.js` — the he / en text tables, `L()`, `tx()`, `langAttr`, `linkify`, and money / day / distance formatting.
- `hours.js` — the time in a shop's time zone, `openState`, the status pill and the hours list.
- `shops.js` — the shop data model for now: `cleanShop`, `toStored`, `sampleShops`, `loadMyShops`, `allShops`, `shopDistance` (Step 2 replaces it with `store/`).
- `notices.js` — the page notice, the screen-reader announcer and the toast.
- `drafts.js` — one draft per form, kept for the page load and in session storage across a reload; `migrateOldKeys`.
- `views/card.js` — the shop card (home list and form preview).
- `views/home.js` — home: search, categories, filters, "near me" and the list.
- `views/shop.js` — the shop page, the owner's delete, `renderNotFound` and `backLink`.
- `views/form.js` — the "open / edit your shop" form (may import `views/shop.js` and `views/card.js`).
- `main.js` — the entry point: the router (routes, render, focus, history) and `init()`, which runs every start-up side effect (storage reads, history, listeners, the minute tick, the first render) in a fixed order. Importing any other module has no side effects beyond building constants (and `util.js` looking up `#app`).
- `fonts.css`, `styles.css` — imported by `main.js`.

**Rule: views never import `main.js`.** They call `nav.navigate(...)` and share data through `state`. Keep the import graph free of cycles.

# src/ — the app's modules

**Run it** (from `shop-finder/`, after `npm install`): `npm run dev` (dev server), `npm test` (builds `dist/`, then runs `tests/suite.js dist` and `tests/boundaries.js`), `npm run shots` (builds, then screenshots), `npm run build && npm run preview` (the build at http://localhost:4173).
`index.html` and `dist/` must be served over http(s). Opening `index.html` or `dist/index.html` straight from disk (file://) shows a blank page, because browsers block module scripts there. Any static server works for `dist/`.

`index.html` loads one module, `main.js`; Vite bundles the rest. Each file, in import order (a file only imports files above it):

- `util.js` — helpers with no imports: limits (`MAX_PHOTOS`, `DEFAULT_TZ`), `esc`, patterns, phone / time / text-language helpers, `normalizeText`, `distanceKm`, `setText`, `normHash`, and the `#app` element.
- `icons.js` — the SVG icons (`ICON`), the icon of each category (`catIcon`) and the awning drawing.
- `store/device.js` — the device-storage keys (`nearby.myShops`, `nearby.lang`, `nearby.draft.*`) and the `device` wrapper around localStorage / sessionStorage. Only `store/` files and `prefs.js` use it.
- `state.js` — the one shared, mutable `state` object (language, the route token, filters, location, notices, drafts, the form on screen, router memory). Read and write `state.x`; never copy a field into a local for later. Shops are not here: they are in the store.
- `nav.js` — `nav.navigate` / `nav.render`, filled in by `main.js` before the first render, so views can navigate.
- `categories.js` — `APP_NAME`, `CURRENCY`, `CATEGORIES` and `category(id)`.
- `demo-data.js` — `SAMPLE_SHOPS`, the ten sample shops (local mode). Only `store/local.js` imports it.
- `text.js` — the he / en text tables, `L()`, `tx()`, `langAttr`, `linkify`, and money / day / distance formatting.
- `hours.js` — the time in a shop's time zone, `openState`, the status pill and the hours list.
- `shops.js` — pure shop helpers: `cleanShop` (with `status` and `rejectionReason`), `toStored`, `shopSig` / `sameShop` (change detection) and `shopDistance`.
- `store/contract.js` — the store's error codes (`ERROR_CODES`, `storeError`, `errorCode`), `SHOP_STATUSES` and `REPORT_REASONS`. No imports.
- `store/draft-storage.js` — `draftStore`: form drafts on the device (text in localStorage, one key per form) and the move of drafts older versions kept in sessionStorage (`migrate`).
- `store/local.js` — `createLocalStore()`: the shops of local mode (the owner's shops on this device, then the samples), the write queue, change events and the test seam (`globalThis.__nearbyTest`).
- `store/index.js` — **the only door to shop data**: `store` (snapshot, events, promises), `draftStore` and the contract. Code outside `store/` imports only this store file.
- `prefs.js` — `savedLang()` / `saveLang()`: the language choice on the device (`nearby.lang`).
- `notices.js` — the page notice, the screen-reader announcer and the toast.
- `drafts.js` — one draft per form, kept for the page load and on the device (`draftStore`) until it is published or discarded; `startDrafts`.
- `views/states.js` — shared pieces for loading, error, progress and status states (`errorBoxHtml`, `skelLine`, `progressHtml`, `statusBadgeHtml`, `saveErrorText`, `deleteErrorText`), the route token check (`isCurrent`) and the focus helpers (`keepFocus`, `swapPage`).
- `views/card.js` — the shop card (home list and form preview).
- `views/home.js` — home: search, categories, filters, "near me" and the list; `homeTick`, `homeStoreChanged`.
- `views/shop.js` — the shop page, the owner's delete, `renderNotFound` and `backLink`; `shopTick`, `shopStoreChanged`.
- `views/form.js` — the "open / edit your shop" form (may import `views/shop.js` and `views/card.js`); `formStoreChanged`.
- `main.js` — the entry point: the router (routes, render, focus, history), the offline banner, and `init()`, which runs every start-up side effect (the saved language, `store.start()`, `startDrafts()`, history, listeners, the minute tick, the first render) in a fixed order. Store changes reach the screen on display through `homeStoreChanged` / `shopStoreChanged` / `formStoreChanged`. Importing any other module has no side effects beyond building constants (`util.js` looking up `#app`, `store/index.js` creating the store without starting it).
- `fonts.css`, `styles.css` — imported by `main.js`.

**Rule: data goes through the store.** Screens read `store.snapshot()` synchronously (search, filters, open now and the minute tick never wait) and call the store's promises for anything else; no file outside `store/` and `prefs.js` touches device storage, IndexedDB or the sample shops (`tests/boundaries.js` fails the tests if one does). Every store promise a caller does not return gets a `.catch`.

**Rule: views never import `main.js`.** They call `nav.navigate(...)` and share data through `state`. Keep the import graph free of cycles.

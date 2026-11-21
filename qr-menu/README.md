# QR Menu

A view-only digital menu that opens when a customer scans a QR code.
Phone first, Hebrew + English (right-to-left and left-to-right), no ordering.

## Layout

```
qr-menu/
  core/app.js            shared logic: builds the whole page
  core/styles.css        shared look
  clients/_default/      the black-and-white default; copy this for each new client
    index.html           page title, link-preview tags, icon (no menu content)
    config.js            name, colors, hours, categories, dishes
  clients/<restaurant>/  one folder per client, same files plus images/
```

Fix a bug or improve the design **once**, in `core/`, and every client gets it.
Never copy `core/` into a client folder.

## New client checklist

1. Copy `clients/_default` to `clients/<restaurant-name>` (lowercase, dashes, no spaces).
2. In `config.js`: set `brand`, `theme` colors, `info`, then the `categories` and dishes in the order the client wants.
   - Every text is `{ he: "...", en: "..." }`. If one language is missing, the other is shown.
   - Each dish needs its own `id`. Empty categories are hidden automatically.
   - `price` can be a number (`32` or `32.5`) or free text (`"Market price"`).
3. In `index.html`: set `<title>`, `description`, `og:title`, `og:description` and the icon. Once hosted, add `og:image` with the full web address of a cover photo. These control what WhatsApp shows when the link is shared.
4. Put photos in `clients/<restaurant-name>/images/` and set `image: "images/name.jpg"` on each dish. Use 4:3 photos, about 800 px wide, JPEG or WebP under 150 KB each. A missing photo falls back to the dish's emoji.
5. Open `clients/<restaurant-name>/index.html` and check every category on a phone.
6. Host the whole `qr-menu` folder (any static hosting) and make the QR code point at `https://YOUR-DOMAIN/clients/<restaurant-name>/`.

Add `?lang=en` or `?lang=he` to the link to choose the starting language. Once a customer switches language themselves, their choice is remembered.

If `config.js` has a mistake, the page shows "The menu is unavailable right now" instead of going blank. Open the browser console to see what went wrong.

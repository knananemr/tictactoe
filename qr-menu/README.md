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
2. In `config.js`: set `brand`, `theme` colors, `languages`, `defaultLang`, `currency`, the home page `headline` and `subtitle`, `info`, then the `categories` and dishes in the order the client wants.
   - Every text is `{ he: "...", en: "..." }`. If one language is missing, the other is shown.
   - Each dish needs its own `id`. Empty categories are hidden automatically.
   - If `info` has no about text, hours, address or phone, the About page is left out of the menu.
   - `price` can be a number (`32` or `32.5`) or free text (`{ he: "מחיר שוק", en: "Market price" }`).
   - `phone` can hold several numbers separated by commas (or as a list). Star numbers (`*6060`) and numbers with letters (`1-800-FLOWERS`) work, and an extension (`ext. 5`, `(ext. 5)`, `שלוחה 5`) is shown but not dialled. Words and notes around a number (`Delivery 24/7: 050-123-4567`, `03-555-1234 (9:00–17:00)`) are shown too; only the number is dialled.
   - `hours` is a list of `{ days, time }` rows. A row can also be one text (`"Sun–Thu 12:00–23:00"`), and the list can be written per language (`{ he: [...], en: [...] }`).
   - `tags` can also hold the client's own tags, as text or per language (`{ he: "ללא גלוטן", en: "Gluten free" }`).
3. In `index.html`: set `<title>`, `description`, `og:title`, `og:description` and the icon. Once hosted, add `og:image` with the full web address of a cover photo. These control what WhatsApp shows when the link is shared.
4. Put photos in `clients/<restaurant-name>/images/` and set `image: "images/name.jpg"` on each dish. Use 4:3 photos, about 800 px wide, JPEG or WebP under 150 KB each. On a phone held sideways the menu shows them a little wider (16:9), so keep the dish near the middle of the photo. A missing photo falls back to the dish's emoji.
5. Open `clients/<restaurant-name>/index.html` and check every category on a phone.
6. Host the whole `qr-menu` folder (any static hosting) and make the QR code point at `https://YOUR-DOMAIN/clients/<restaurant-name>/`. On GitHub Pages, add an empty `.nojekyll` file at the site root, or the `_default` folder is not published.

Add `?lang=en` or `?lang=he` to the link to choose the starting language for customers who have not picked one yet. Once a customer switches language themselves, their choice is remembered and wins over the link.

If `config.js` has a mistake, the page shows "The menu is unavailable right now" instead of going blank. Open the browser console to see what went wrong.

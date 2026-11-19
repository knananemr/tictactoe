# QR Menu — core template

A view-only digital menu that opens when a customer scans a QR code.
Phone first, Hebrew + English (right-to-left and left-to-right), no ordering.

## Files
- `config.js` — **the only file to change per client**: name, logo, colors, hours, categories, items.
- `index.html`, `styles.css`, `app.js` — the shared template. Do not edit per client.

## New client checklist
1. Copy the `qr-menu` folder and rename it for the client.
2. In `config.js`: set `brand`, `theme` colors, `info`, then the `categories` and items in the order the client wants.
3. Put photos in an `images/` folder and set `image: "images/name.jpg"` on each item (4:3 photos fit best).
4. Host the folder (any static hosting) and generate a QR code pointing at its URL.

Add `?lang=en` or `?lang=he` to the URL to force a starting language.

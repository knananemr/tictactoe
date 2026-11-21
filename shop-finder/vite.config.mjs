// Vite config. The package stays CommonJS (tests/*.js use require), so this file is .mjs.
import { defineConfig } from "vite";

// Content-Security-Policy, one per mode. Builds allow only the page's own files
// (plus data:/blob: images for photos); the dev server also lets Vite's client
// open its websocket and fetch from the dev server.
const CSP = {
  build: [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob:",
    "connect-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'"
  ],
  serve: [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob:",
    "connect-src 'self' ws: wss:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'"
  ]
};
const CSP_MARKER = /<!-- Content-Security-Policy:[^>]*-->/;

// Writes the CSP meta tag where index.html has the marker comment. Fails the
// build if the marker is missing, so a page is never shipped without a policy.
function csp() {
  let command = "build";
  return {
    name: "nearby-csp",
    configResolved(config) { command = config.command; },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        if (!CSP_MARKER.test(html)) throw new Error("index.html: Content-Security-Policy marker comment not found");
        const policy = CSP[command === "serve" ? "serve" : "build"].join("; ");
        return html.replace(CSP_MARKER, () => `<meta http-equiv="Content-Security-Policy" content="${policy}">`);
      }
    }
  };
}

export default defineConfig({
  // Relative URLs: dist/ works from any folder (https://host/, https://host/a/b/) and inside the app.
  base: "./",
  plugins: [csp()],
  build: {
    // Vite 8 minifies CSS with Lightning CSS, which rewrites colours (alpha gets rounded)
    // and drops -webkit-appearance; that changes the look. Ship styles.css as written.
    cssMinify: false,
    // The polyfill would fetch() modules in old WebViews, which connect-src 'none' blocks.
    // There is one chunk anyway.
    modulePreload: { polyfill: false },
    // Never turn fonts into data: URLs (font-src has no data:). Fonts live in public/
    // and are copied as files; this guards any font imported later.
    assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/i.test(file) ? false : undefined)
  }
});

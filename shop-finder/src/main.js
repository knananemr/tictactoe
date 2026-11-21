// Entry point (Step 1a): the old classic scripts, loaded as modules in their old order.
// Import order is evaluation order: data.js sets window.APP_NAME, CATEGORIES and
// SAMPLE_SHOPS, which legacy.js (the old app.js, unchanged) reads when it starts.
// The CSS comes before the app so the dev server injects it first; in a build
// Vite writes it as a <link rel="stylesheet"> instead.
import "./data.js";
import "./fonts.css";
import "./styles.css";
import "./legacy.js";

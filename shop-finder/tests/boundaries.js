// Boundary check (blueprint Step 2): no file outside src/store/ and src/prefs.js touches
// stored data, and code outside src/store/ reaches the store only through store/index.js.
// Usage: node tests/boundaries.js (no browser; npm test runs it after the suite).
// Comments are not stripped: the words are forbidden anywhere in those files.
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src');

// files outside src/store/ (and src/prefs.js)
const OUTSIDE = [
  [/\blocalStorage\b/, 'localStorage'],
  [/\bsessionStorage\b/, 'sessionStorage'],
  [/\bindexedDB\b/, 'indexedDB'],
  [/\bIDB[A-Z]\w*/, 'IndexedDB API (IDB…)'],
  [/\bcaches\b/, 'caches (Cache Storage)'],
  [/\bcookieStore\b/, 'cookieStore'],
  [/document\.cookie/, 'document.cookie'],
  [/navigator\.storage/, 'navigator.storage'],
  [/\bopenDatabase\b/, 'openDatabase'],
  [/demo-data/, 'demo-data (only store/ may import the sample shops)'],
  [/store\/(?!index\.js\b)/, 'a store/ file other than store/index.js']
];
// files inside src/store/
const INSIDE = [
  [/(["'`])[^"'`\n]*(?:\bviews\/|\bmain\.js\b|\bnav\.js\b)[^"'`\n]*\1/, 'store/ must not import views/, main.js or nav.js']
];
const INDEX = [[/(["'`])[^"'`\n]*\bdevice(?:\.js)?\1/, 'store/index.js must not import or re-export device.js']];

function problems(text, rules) {
  const out = [];
  text.split('\n').forEach((line, i) => rules.forEach(([re, what]) => { if (re.test(line)) out.push({ line: i + 1, what }); }));
  return out;
}
function rulesFor(rel) {
  if (rel === 'prefs.js') return [];
  if (rel === 'store/index.js') return INSIDE.concat(INDEX);
  if (rel.startsWith('store/')) return INSIDE;
  return OUTSIDE;
}

// Self-test: the matcher must flag each planted text (and leave the allowed import alone).
const planted = [
  ['views/x.js', 'localStorage.getItem("x")', true],
  ['views/x.js', 'import { device } from "./store/device.js"', true],
  ['views/x.js', 'const m = await import("../store/local.js")', true],
  ['views/x.js', '"image/*"; localStorage.x; /* y */', true],
  ['views/x.js', 'new IDBKeyRange()', true],
  ['views/x.js', 'const c = await caches.open("v1")', true],
  ['views/x.js', 'import { SAMPLE_SHOPS } from "../demo-data.js"', true],
  ['views/x.js', 'export { store } from "./store/local.js"', true],
  ['store/index.js', 'export { device } from "./device.js"', true],
  ['store/local.js', 'import { nav } from "../nav.js"', true],
  ['store/local.js', 'import { renderHome } from "../views/home.js"', true],
  ['views/x.js', 'import { store } from "../store/index.js"', false],
  ['drafts.js', 'import { draftStore } from "./store/index.js"', false],
  ['store/local.js', 'import { device, STORE_KEY } from "./device.js"', false],
  ['prefs.js', 'import { device } from "./store/device.js"; localStorage', false]
];
const selfFail = planted.filter(([rel, text, bad]) => (problems(text, rulesFor(rel)).length > 0) !== bad);
if (selfFail.length) {
  selfFail.forEach(([rel, text, bad]) => console.log(`boundaries self-test: ${rel}: ${JSON.stringify(text)} should ${bad ? '' : 'not '}be flagged`));
  process.exit(1);
}

const files = [];
(function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.isFile() && e.name.endsWith('.js')) files.push(full);
  });
})(SRC);

const found = [];
files.forEach(f => {
  const rel = path.relative(SRC, f).split(path.sep).join('/');
  problems(fs.readFileSync(f, 'utf8'), rulesFor(rel)).forEach(p => found.push(`src/${rel}:${p.line}: ${p.what}`));
});
found.forEach(p => console.log('boundaries: ' + p));
console.log(`boundaries: ${files.length} files checked, ${found.length} problem${found.length === 1 ? '' : 's'} (self-test: ${planted.length} planted texts ok)`);
process.exit(found.length ? 1 : 0);

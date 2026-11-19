// laser/tests/e2e/guards.spec.js
// Static source checks (blueprint 2.7). They read the app's files from disk and need no
// browser. Each one guards a rule that keeps the app working from a double-clicked file,
// keeps typed text from becoming markup, or keeps the test page away from real data.
'use strict';

const fs = require('fs');
const path = require('path');
const { test, expect } = require('playwright/test');

const LASER = path.resolve(__dirname, '..', '..');
const REPO = path.resolve(LASER, '..');

function read(file) { return fs.readFileSync(path.join(LASER, file), 'utf8'); }

// every file under a folder of laser/, as paths relative to laser/ with forward slashes
function walk(folder) {
  const out = [];
  const start = path.join(LASER, folder);
  if (!fs.existsSync(start)) return out;
  (function visit(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else out.push(path.relative(LASER, full).split(path.sep).join('/'));
    });
  })(start);
  return out.sort();
}

const JS = walk('js').filter((file) => file.endsWith('.js'));
const CSS = walk('css').filter((file) => file.endsWith('.css'));
const SW = fs.existsSync(path.join(LASER, 'sw.js')) ? ['sw.js'] : [];     // arrives in step 1b
const SOURCES = ['index.html'].concat(CSS, JS, SW);

// where(files, pattern) -> ['js/ui/x.js:12: the line', ...] for every line that matches
function where(files, pattern) {
  const hits = [];
  files.forEach((file) => {
    read(file).split('\n').forEach((line, index) => {
      if (pattern.test(line)) hits.push(file + ':' + (index + 1) + ': ' + line.trim().slice(0, 120));
    });
  });
  return hits;
}

// The code of a script without its comments (rough, but enough to tell code from prose).
function code(file) {
  return read(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((line) => line.replace(/(^|\s)\/\/.*$/, '$1')).join('\n');
}

// The order in which index.html loads the scripts: each file after the ones it uses.
const ORDER = [
  'js/core/ns.js', 'js/core/util.js', 'js/core/dates.js',
  'js/core/money.js', 'js/core/phone.js', 'js/core/links.js',
  'js/core/schema.js', 'js/core/migrations.js', 'js/core/storage.js',
  'js/core/store.js', 'js/core/selectors.js', 'js/core/backup.js',
  'js/core/practice.js', 'js/ui/icons.js', 'js/ui/components.js',
  'js/ui/overlay.js', 'js/ui/files.js', 'js/ui/actions.js',
  'js/ui/router.js', 'js/ui/shell.js', 'js/ui/parts.js',
  'js/ui/forms/personForm.js', 'js/ui/forms/sessionForm.js', 'js/ui/forms/sendSheet.js',
  'js/ui/forms/leadForm.js', 'js/ui/views/home.js', 'js/ui/views/client.js',
  'js/ui/views/clients.js', 'js/ui/views/schedule.js', 'js/ui/views/leads.js',
  'js/ui/views/progress.js', 'js/ui/views/practiceSettings.js', 'js/ui/views/settings.js',
  'js/main.js'
];

test.describe('guards: static source checks (2.7)', () => {
  test('the source files are found', () => {
    expect(JS.length).toBeGreaterThan(20);
    expect(CSS).toEqual(['css/app.css', 'css/base.css', 'css/components.css', 'css/layout.css', 'css/tokens.css']);
  });

  test('no module scripts, no dynamic import, no fetch, no XMLHttpRequest (they fail on file://)', () => {
    expect(where(SOURCES, /type="module"/)).toEqual([]);
    expect(where(SOURCES, /import\(/)).toEqual([]);
    expect(where(SOURCES.filter((file) => file !== 'sw.js'), /fetch\(/)).toEqual([]);
    expect(where(SOURCES, /XMLHttpRequest/)).toEqual([]);
  });

  test('the whole browser store is never cleared (other local pages share it)', () => {
    expect(where(SOURCES, /localStorage\.clear/)).toEqual([]);
  });

  test('no date is parsed or cut in a way that shifts the day', () => {
    expect(where(SOURCES, /new Date\(['"]/)).toEqual([]);
    expect(where(SOURCES, /toISOString\(\)\.slice/)).toEqual([]);
  });

  test('no style attribute is written from js/ (the CSP blocks it)', () => {
    expect(where(JS, /style="/)).toEqual([]);
  });

  test('markup is written in one place only: a single innerHTML assignment, in ui/components.js', () => {
    const assignments = where(JS, /\.innerHTML\s*\+?=(?!=)/);
    expect(assignments.length, assignments.join('\n')).toBe(1);
    expect(assignments[0]).toContain('js/ui/components.js');
    // the other ways of turning a string into markup are not used at all
    expect(where(JS, /insertAdjacentHTML|\.outerHTML\s*=(?!=)|document\.write|srcdoc/)).toEqual([]);
  });

  test('no outside address in index.html, css/ or js/ (links.js is the one exception)', () => {
    const files = SOURCES.filter((file) => file !== 'js/core/links.js');
    expect(where(files, /https?:\/\//)).toEqual([]);
  });

  test('core never touches the page, and only storage.js knows the browser store (2.2, 3.1)', () => {
    const core = JS.filter((file) => file.startsWith('js/core/'));
    const touchesPage = core.filter((file) => /(^|[^.\w$])document\s*[.[]/.test(code(file)));
    expect(touchesPage).toEqual([]);
    const usesStore = JS.filter((file) => file !== 'js/core/storage.js')
      .filter((file) => /\b(localStorage|sessionStorage|indexedDB)\b/.test(code(file)));
    expect(usesStore).toEqual([]);
  });

  test('one global: only ns.js assigns to window', () => {
    const assigns = [];
    JS.forEach((file) => {
      const found = code(file).match(/\bwindow\.[A-Za-z_$][\w$]*\s*=(?!=)/g) || [];
      found.forEach((text) => assigns.push(file + ': ' + text.replace(/\s*=$/, '')));
    });
    expect(assigns).toEqual(['js/core/ns.js: window.Laser']);
  });
});

test.describe('guards: index.html (2.3, 2.4)', () => {
  const page = read('index.html');
  const scriptTags = page.match(/<script\b[^>]*>/g) || [];
  const loaded = scriptTags.map((tag) => (/\ssrc="([^"]+)"/.exec(tag) || [])[1]);

  test('the Content-Security-Policy is the strict one of 2.3', () => {
    const meta = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/.exec(page);
    expect(meta, 'the CSP meta tag').not.toBeNull();
    expect(meta[1]).toBe("default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; base-uri 'none'; form-action 'none'");
  });

  test('every script is a classic deferred file: no inline script, no handler, no style', () => {
    expect(scriptTags.length).toBeGreaterThan(0);
    scriptTags.forEach((tag) => expect(tag).toMatch(/^<script defer src="js\/[\w./-]+\.js">$/));
    expect(page.match(/<script\b[^>]*>\s*<\/script>/g).length, 'no script has a body').toBe(scriptTags.length);
    expect(page).not.toMatch(/<style\b/);
    expect(page).not.toMatch(/\sstyle\s*=/);
    expect(page).not.toMatch(/\son[a-z]+\s*=/i);
  });

  test('the scripts are loaded in the order of 2.4, and every file under js/ is loaded', () => {
    const unknown = loaded.filter((file) => ORDER.indexOf(file) === -1);
    expect(unknown, 'scripts that 2.4 does not list').toEqual([]);
    const positions = loaded.map((file) => ORDER.indexOf(file));
    expect(positions, 'order of the script tags').toEqual(positions.slice().sort((a, b) => a - b));
    expect(new Set(loaded).size, 'no script twice').toBe(loaded.length);
    expect(loaded.slice().sort()).toEqual(JS);
    expect(loaded[0]).toBe('js/core/ns.js');
    expect(loaded[loaded.length - 1]).toBe('js/main.js');
  });

  test('the shell holds the "Laser did not start" message and the three roots', () => {
    expect(page).toContain('<div id="boot-fail" class="boot-fail">');
    expect(page).toContain('<h1>Laser did not start</h1>');
    expect(page).toContain('<div id="app" hidden></div>');
    expect(page).toContain('<div id="overlay-root"></div>');
    expect(page).toContain('<div id="toast-root" role="status" aria-live="polite"></div>');
    expect(page).toContain('<html lang="en" dir="ltr">');
  });
});

test.describe('guards: the test page never touches real data (2.7)', () => {
  const unitFiles = ['tests/unit.html'].concat(walk('tests/unit'));

  test('unit.html and tests/unit/ never name a real storage key', () => {
    expect(unitFiles.length).toBeGreaterThan(5);
    expect(where(unitFiles, /laser\.doc|laser\.rev|laser\.prev|laser\.ui|laser-copies/)).toEqual([]);
  });

  test('unit.html loads ns.js, then the harness, and only then the other core files', () => {
    const html = read('tests/unit.html');
    const scripts = (html.match(/<script\b[^>]*\ssrc="[^"]+"/g) || []).map((tag) => /src="([^"]+)"/.exec(tag)[1]);
    expect(scripts[0]).toBe('../js/core/ns.js');
    expect(scripts[1]).toBe('unit/harness.js');
    expect(scripts.indexOf('../js/core/storage.js')).toBeGreaterThan(1);
    expect(read('tests/unit/harness.js')).toMatch(/STORE_NAME\s*=\s*'laser-test'/);
    // storage.js reads the name at call time, so the harness's change reaches every key
    expect(code('js/core/storage.js')).toMatch(/L\.STORE_NAME\s*\+/);
    // every unit test file on disk is on the page
    const onDisk = walk('tests/unit').filter((file) => file.endsWith('.test.js')).map((file) => file.replace('tests/', ''));
    expect(scripts.filter((file) => file.endsWith('.test.js')).sort()).toEqual(onDisk);
  });

  test('the README says the test page is safe to open', () => {
    expect(read('README.md').replace(/\s+/g, ' ')).toMatch(/test page is safe to open/i);
  });
});

test.describe('guards: repo housekeeping (2.1)', () => {
  test('.gitignore keeps backup files and test output out of the repo', () => {
    const lines = fs.readFileSync(path.join(REPO, '.gitignore'), 'utf8').split('\n').map((line) => line.trim());
    ['laser-backup-*.json', 'laser/tests/test-results/', 'laser/tests/playwright-report/', '/test-results/', '/playwright-report/']
      .forEach((line) => expect(lines, line).toContain(line));
  });

  test('the repo CLAUDE.md lists laser/', () => {
    expect(fs.readFileSync(path.join(REPO, 'CLAUDE.md'), 'utf8')).toContain('laser/');
  });

  test('no backup file and no temporary file is left in the repo', () => {
    const stray = [];
    (function visit(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'test-results' ||
            entry.name === 'playwright-report') return;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) visit(full);
        else if (/^laser-backup-.*\.json$/.test(entry.name)) stray.push(path.relative(REPO, full));
      });
    })(REPO);
    expect(stray).toEqual([]);
  });
});

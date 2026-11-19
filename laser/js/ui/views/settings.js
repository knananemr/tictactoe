// js/ui/views/settings.js
// Settings (7.8): one scrolling page of sections; each control saves at once and shows a
// short "Saved" toast. Step 1: Money, Messages, Backup, This device, Colours.
// The backup flows live here too (3.6, 3.7, 3.11); Home and the banners use the same actions.
(function (L) {
  'use strict';

  const util = L.core.util;
  const html = util.html;
  const dates = L.core.dates;
  const phone = L.core.phone;
  const schema = L.core.schema;
  const storage = L.core.storage;
  const store = L.core.store;
  const selectors = L.core.selectors;
  const backup = L.core.backup;
  const c = L.ui.components;
  const icons = L.ui.icons;
  const overlay = L.ui.overlay;
  const files = L.ui.files;
  const router = L.ui.router;
  const actions = L.ui.actions;

  const SECTIONS = { backup: 'settings-backup', messages: 'settings-messages', device: 'settings-device' };
  const OTHER = 'other';
  const EXAMPLE_NUMBER = '054 123 4567';
  const EXAMPLE_CODE = '972';
  const ERASE_WORD = 'ERASE';
  const RECENT_BACKUP_MINUTES = 10;

  let otherOpen = false;   // "Other code" was chosen and no code has been saved yet

  function isCommon(code) {
    return schema.currencies.some(function (item) { return item.code === code; });
  }

  // ---- saving one setting ----------------------------------------------------------------

  function saveSetting(label, mutator) {
    const result = store.commit(label, mutator);
    if (L.ui.shell.explain(result) && result.saved) overlay.toast('Saved');
    return result;
  }

  // ---- Money -----------------------------------------------------------------------------

  function moneyCard(state) {
    const currency = state.settings.currency;
    const other = otherOpen || (currency !== null && !isCommon(currency));
    const selected = other ? OTHER : (currency || '');
    const options = [];
    if (currency === null) {
      options.push(html`<option value=""${selected === '' ? html` selected` : ''}></option>`);
    }
    schema.currencies.forEach(function (item) {
      options.push(html`<option value="${item.code}"${item.code === selected ? html` selected` : ''}>${item.name} (${item.code})</option>`);
    });
    options.push(html`<option value="${OTHER}"${selected === OTHER ? html` selected` : ''}>Other code</option>`);
    const typedCode = (currency !== null && !isCommon(currency) && !otherOpen) ? currency : '';
    return c.card({
      id: 'settings-money', title: 'Money',
      body: html`<div class="fields">
        ${c.field({
          id: 's-currency', label: 'Currency',
          control: html`<select class="input" id="s-currency" name="currency" data-action="settings.currency">${options}</select>`
        })}
        ${other ? c.field({
          id: 's-currency-code', label: 'Currency code', extra: 'field--short',
          hint: 'Three letters, for example THB',
          control: html`<input class="input" id="s-currency-code" name="currencyCode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="3" value="${typedCode}" data-action="settings.currencyCode">`
        }) : ''}
      </div>`
    });
  }

  actions.on('change:settings.currency', function (el) {
    const value = el.value;
    if (value === '') return;
    if (value === OTHER) {
      otherOpen = true;
      L.ui.shell.render();
      const code = document.getElementById('s-currency-code');
      if (code) code.focus();
      return;
    }
    const message = schema.check.currency(value);
    c.setError(el, message);
    if (message) return;
    const hadCodeField = !!document.getElementById('s-currency-code');
    otherOpen = false;
    saveSetting('Currency changed', function (draft) { schema.setCurrency(draft.settings, value); });
    if (hadCodeField) L.ui.shell.render();     // the "Currency code" field goes away at once
  });

  actions.on('change:settings.currencyCode', function (el) {
    const code = el.value.trim().toUpperCase();
    const message = code === '' ? 'Choose a currency from the list' : schema.check.currency(code);
    c.setError(el, message);
    if (message) return;
    el.value = code;
    if (code === store.get().settings.currency) { otherOpen = false; return; }
    otherOpen = false;
    saveSetting('Currency changed', function (draft) { schema.setCurrency(draft.settings, code); });
  });

  // ---- Messages --------------------------------------------------------------------------

  // "054 123 4567 becomes +972 541234567", with the owner's own code once there is one.
  function countryExample(code) {
    const use = code === '' ? EXAMPLE_CODE : code;
    const international = phone.toInternational(EXAMPLE_NUMBER, use);
    if (!international) return '';
    const line = EXAMPLE_NUMBER + ' becomes ' + phone.display(international, use);
    return code === '' ? 'With ' + EXAMPLE_CODE + ', ' + line : line;
  }

  function messagesCard(state) {
    const settings = state.settings;
    const onComputer = util.platform() === 'computer';
    return c.card({
      id: 'settings-messages', title: 'Messages',
      body: html`<div class="fields">
        ${c.field({
          id: 's-country', label: 'Country code for phone numbers', extra: 'field--short',
          hintName: 'country-example', hint: countryExample(settings.countryCode),
          control: html`<input class="input num" id="s-country" name="countryCode" type="text" inputmode="numeric" autocomplete="off" value="${settings.countryCode}" data-action="settings.countryCode">`
        })}
        ${onComputer ? html`<div class="field">
          <span class="field__label" id="s-whatsapp-label">WhatsApp on a computer opens</span>
          ${c.segmented({
            name: 'whatsappOnComputer', labelId: 's-whatsapp-label', value: settings.whatsappOnComputer,
            action: 'settings.whatsapp', options: schema.lists.whatsappOnComputer
          })}
        </div>` : ''}
      </div>`
    });
  }

  actions.on('change:settings.countryCode', function (el) {
    const code = el.value.replace(/[\s+]/g, '');
    const message = schema.check.countryCode(code);
    c.setError(el, message);
    if (message) return;
    if (code === store.get().settings.countryCode) return;
    const result = saveSetting('Country code changed', function (draft) { draft.settings.countryCode = code; });
    // the view is not drawn again while this field has the focus: its own line follows now
    if (result.ok) c.setText(document.querySelector('[data-partial="country-example"]'), countryExample(code));
  });

  actions.on('change:settings.whatsapp', function (el) {
    const value = el.value;
    if (schema.check.whatsappOnComputer(value) || value === store.get().settings.whatsappOnComputer) return;
    saveSetting('WhatsApp choice changed', function (draft) { draft.settings.whatsappOnComputer = value; });
  });

  // ---- Backup ----------------------------------------------------------------------------

  function usageWords() {
    return selectors.storageUse(storage.usage());
  }

  function backupCard(state) {
    const status = selectors.backupStatus(state);
    const started = selectors.gettingStarted(state);
    const usage = usageWords();
    return c.card({
      id: 'settings-backup', title: 'Backup',
      body: html`<div class="stack">
        ${started.showCheckBackup ? html`<p data-check-backup>Check your backup: choose the file you just saved.</p>` : ''}
        <div class="actions">
          <button class="btn btn--primary" type="button" data-action="backup.now">${icons.icon('download')}Back up now</button>
          <button class="btn btn--secondary" type="button" data-action="backup.load">Load a backup</button>
          <button class="btn btn--secondary" type="button" data-action="backup.check">Check a backup file</button>
        </div>
        <p class="small muted">This file contains your clients' names, phone numbers and notes as readable text. Keep it private. Never put it in the GitHub folder.</p>
        <div class="stack stack--sm">
          <p data-backup-status>${status.settingsLine}</p>
          <progress class="meter" value="${usage.fraction}" max="1">${usage.text}</progress>
          <p class="small muted num" data-storage-use>${usage.text}</p>
        </div>
        <div class="actions">
          <button class="btn btn--secondary" type="button" data-action="backup.undoImport"${backup.canUndoImport() ? '' : html` disabled`}>Undo the last import</button>
          <button class="btn btn--ghost-danger" type="button" data-action="backup.erase">Erase this device</button>
        </div>
      </div>`
    });
  }

  // "Back up now" (3.6). In step 1 the way out is a download. A download counts at once,
  // and the first one must be checked: the "Check your backup" card then appears.
  function backUpNow() {
    const state = store.get();
    if (!state) return;
    files.download(backup.buildFile(state));
    const result = backup.markSaved();
    if (result.ok && result.saved) {
      overlay.toast('Backup saved. Move it off this computer: iCloud Drive, a USB stick, or an email to yourself.', { tone: 'done' });
    }
  }

  function countsLine(counts, withPayments) {
    const parts = [
      c.plural(counts.clients, 'client'), c.plural(counts.leads, 'lead'),
      c.plural(counts.treatments, 'treatment')
    ];
    if (withPayments) parts.push(c.plural(counts.payments, 'payment'));
    return parts.join(', ');
  }

  // A file that cannot be used: the reason and, for a broken backup, its first five faults.
  function refusalModal(title, refused) {
    overlay.modal({
      name: 'refused', title: title, cancelLabel: 'Close',
      body: html`<p>${refused.message}</p>${refused.errors.map(function (line) {
        return html`<p class="modal__fine" dir="auto">${line}</p>`;
      })}`
    });
  }

  function repairsLine(repairs) {
    if (!repairs.length) return '';
    const start = repairs.length === 1 ? '1 small fix was made: ' : repairs.length + ' small fixes were made: ';
    return html`<p class="modal__fine" dir="auto">${start + repairs.join('; ') + '.'}</p>`;
  }

  // The preview of 3.7 step 4, then the load itself.
  function previewImport(prepared, options) {
    const current = store.get();
    const keepsOld = JSON.stringify(current).length < storage.prevMax;
    const saved = prepared.savedOn ? 'saved ' + dates.format(prepared.savedOn, 'full') + ', ' : '';
    const text = 'This backup: ' + saved + countsLine(prepared.counts, true) +
      '. It will replace what is in this browser now (' + countsLine(prepared.currentCounts, false) + ').' +
      (keepsOld ? ' You can undo this import in Settings > Backup.'
        : ' Your current data is too large to keep a copy, so this import cannot be undone. Back up first.');
    overlay.modal({
      name: 'import', title: 'Load a backup', danger: true, confirmLabel: 'Replace my data',
      body: html`<p>${text}</p>${repairsLine(prepared.repairs)}`,
      onConfirm: function () {
        const result = backup.applyImport(prepared);
        if (result.reason === 'prevFailed') {
          overlay.toast('Nothing was loaded: this browser\'s storage is full, so a copy of your current data could not be kept.');
          return;
        }
        if (!result.ok) return;
        if (options && options.closeWelcome && !store.get().meta.welcomeDone) {
          store.commit('Welcome', function (draft) { draft.meta.welcomeDone = true; },
            { undoable: false, countsAsChange: false });
        }
        if (result.saved) overlay.toast('Backup loaded.');
      }
    });
  }

  // "Load a backup" (3.7): all or nothing. options.closeWelcome: the Welcome card's button.
  function loadBackup(options) {
    return files.pick().then(function (file) {
      if (!file || !store.get()) return;
      const prepared = backup.prepareImport(file.text);
      if (!prepared.ok) refusalModal('Load a backup', prepared);
      else previewImport(prepared, options);
    });
  }

  function savedWords(daysAgo) {
    if (daysAgo === null) return '';
    if (daysAgo === 0) return ', saved today';
    return daysAgo === 1 ? ', saved 1 day ago' : ', saved ' + daysAgo + ' days ago';
  }

  // "Check a backup file" (3.6): reads the file exactly as a load would and changes nothing
  // but the fact that a backup was checked.
  function checkBackup() {
    return files.pick().then(function (file) {
      if (!file || !store.get()) return;
      const result = backup.checkFile(file.text);
      if (!result.ok) {
        refusalModal('Check a backup file', result);
        return;
      }
      backup.markChecked();
      const good = 'This backup is good: ' + c.plural(result.counts.clients, 'client') + ', ' +
        c.plural(result.counts.treatments, 'treatment') + savedWords(result.savedDaysAgo) + '.';
      if (result.sameCounts) {
        overlay.toast(good, { tone: 'done' });
        return;
      }
      overlay.modal({
        name: 'checked', title: 'Check a backup file', cancelLabel: 'Close',
        body: html`<p>${good}</p><p>It is different from what is in this browser now (${countsLine(result.currentCounts, false)}).</p>`
      });
    });
  }

  function undoImport() {
    if (!backup.canUndoImport()) {
      L.ui.shell.render();
      return;
    }
    const info = backup.undoInfo();
    const what = info
      ? 'This brings back ' + countsLine(info.kept, false) + ' from before the last import. It replaces what is in this browser now (' +
        (info.current ? countsLine(info.current, false) : 'nothing') + ') and everything changed since. You can take this back with the same button.'
      : 'This brings back the data from before the last import. It replaces what is in this browser now.';
    overlay.modal({
      name: 'undo-import', title: 'Undo the last import', danger: true, confirmLabel: 'Undo the last import',
      body: html`<p>${what}</p>`,
      onConfirm: function () {
        const result = backup.undoImport();
        if (result.ok && result.saved) overlay.toast('Import undone.');
        // the kept copy now holds the data that was replaced: draw the button again
        L.ui.shell.render();
      }
    });
  }

  // "Erase this device" (3.11): needs a backup made in the last 10 minutes or the tick,
  // then the word ERASE.
  function eraseReady() {
    const root = document.getElementById('overlay-root');
    const tick = root.querySelector('input[name="understood"]');
    const word = root.querySelector('input[name="eraseWord"]');
    return (!tick || tick.checked) && !!word && word.value.trim() === ERASE_WORD;
  }

  function eraseDevice() {
    const state = store.get();
    if (!state) return;
    const minutes = selectors.backupStatus(state).minutesSinceBackup;
    const recent = minutes !== null && minutes < RECENT_BACKUP_MINUTES;
    overlay.modal({
      name: 'erase', title: 'Erase this device', danger: true, confirmLabel: 'Erase this device', confirmOff: true,
      body: html`<p>This removes everything Laser has saved in this browser: clients, appointments, payments and settings.</p>
        ${recent
          ? html`<p class="modal__fine">You saved a backup in the last 10 minutes.</p>`
          : html`<label class="check"><input class="check__input" type="checkbox" name="understood" data-action="erase.field"><span>I understand this cannot be undone</span></label>`}
        <div class="field">
          <label class="field__label" for="erase-word">Type ERASE</label>
          <input class="input" id="erase-word" name="eraseWord" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" data-action="erase.field">
        </div>`,
      onConfirm: function () {
        if (!eraseReady()) return false;
        if (!store.erase().ok) return false;
        window.location.replace(router.href('/home'));
        window.location.reload();
        return false;
      }
    });
  }

  function eraseFieldChanged() { overlay.setConfirmEnabled(eraseReady()); }

  actions.on('backup.now', backUpNow);
  actions.on('backup.load', function () { loadBackup(null); });
  actions.on('backup.check', checkBackup);
  actions.on('backup.undoImport', undoImport);
  actions.on('backup.erase', eraseDevice);
  actions.on('input:erase.field', eraseFieldChanged);
  actions.on('change:erase.field', eraseFieldChanged);

  // ---- This device -----------------------------------------------------------------------

  function whereThisRuns() {
    const address = window.location.href.split('#')[0];
    try { return decodeURI(address); } catch (e) { return address; }
  }

  function deviceCard() {
    return c.card({
      id: 'settings-device', title: 'This device',
      body: html`<div class="stack">
        <div>
          <p class="caption">Where this copy runs</p>
          <p dir="ltr" data-where>${whereThisRuns()}</p>
        </div>
        <p class="muted num" data-version>Laser ${L.VERSION}, step ${L.STEP}, data format ${L.DATA_FORMAT}</p>
        <details class="more" data-key="how-this-app-works">
          <summary class="more__toggle">How this app works${icons.icon('chevron')}</summary>
          ${L.views.home.howItWorks()}
        </details>
      </div>`
    });
  }

  // ---- Colours ---------------------------------------------------------------------------

  const COLOURS = [
    { tone: 'urgent', word: 'Overdue 5 d', solid: true, text: 'Red: late, act now' },
    { tone: 'important', word: 'Due today', solid: true, text: 'Yellow: important today or this week' },
    { tone: 'done', word: 'Done', solid: false, text: 'Green: finished, nothing more to do' },
    { tone: 'info', word: 'Booked', solid: false, text: 'Blue: planned or waiting' },
    { tone: 'neutral', word: 'Paused', solid: false, text: 'Grey: inactive or closed' }
  ];

  function coloursCard() {
    return c.card({
      id: 'settings-colours', title: 'Colours',
      body: html`<dl class="colour-key">${COLOURS.map(function (row) {
        return html`<div class="colour-key__row">
          <dt class="colour-key__badges">${c.badge(row.tone, row.word)}${row.solid ? c.badge(row.tone, row.word, { solid: true }) : ''}</dt>
          <dd class="colour-key__text">${row.text}</dd>
        </div>`;
      })}</dl>`
    });
  }

  // ---- the view --------------------------------------------------------------------------

  function render(state) {
    return html`<div class="page page--narrow" data-view="settings">
      ${moneyCard(state)}
      ${L.views.practiceSettings.pricesCard(state)}
      ${messagesCard(state)}
      ${L.views.practiceSettings.textsCard(state)}
      ${backupCard(state)}
      ${deviceCard()}
      ${coloursCard()}
    </div>`;
  }

  // #/settings/backup, /messages and /device open the page at that section.
  function arrive(route) {
    const id = route.sub ? SECTIONS[route.sub] : null;
    const section = id ? document.getElementById(id) : null;
    if (section) section.scrollIntoView();
  }

  L.views.settings = {
    title: 'Settings',
    render: render,
    arrive: arrive,
    leave: function () { otherOpen = false; },
    loadBackup: loadBackup,
    checkBackup: checkBackup,
    backUpNow: backUpNow
  };
})(window.Laser);

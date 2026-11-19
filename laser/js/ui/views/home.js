// js/ui/views/home.js
// Home, titled "Dashboard" (7.2). Step 1 shows the date line, the summary strip with one
// figure, the Welcome card or the Getting-started checklist, the "Check your backup" card
// when it applies, and the backup line.
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const dates = L.core.dates;
  const schema = L.core.schema;
  const store = L.core.store;
  const selectors = L.core.selectors;
  const c = L.ui.components;
  const icons = L.ui.icons;
  const router = L.ui.router;
  const actions = L.ui.actions;
  const practice = L.core.practice;
  const parts = L.ui.parts;

  // The three statements of 3.9: title, the one line, the full paragraph behind "More".
  const STATEMENTS = [
    {
      title: 'Where your data lives',
      line: 'Your clients are saved in this browser on this device only: not on the internet, not in GitHub. Your protection is the backup file.',
      more: "Everything you type stays in this browser on this device. If this browser's history or site data is cleared, the data is deleted. Your protection is the backup file, kept somewhere outside this computer."
    },
    {
      title: 'What "automatic" means here',
      line: 'The app works out by itself who needs a reminder and writes the message. You press Send. It cannot send anything while it is closed.',
      more: 'Every time you open the app it works out by itself who needs a reminder today, who is due for their next session and who to follow up with, and it prepares each message. It cannot send anything while it is closed, and it cannot press Send for you: you tap Send, WhatsApp opens with the text ready, and you press send there. Fully hands-off sending needs a paid messaging service and a server. That is a possible later upgrade.'
    },
    {
      title: 'Phone and computer',
      line: 'Your phone and your computer do not share data. In the next step you try the app on both and choose where your client list lives. Until then, add only two or three clients.',
      more: "An iPhone cannot open the file on your computer. To use the app on a phone, the app's code (never your data) is published at a web address and added to the Home Screen. Moving the client list from one device to the other takes one backup and one import."
    }
  ];

  // What the owner has typed or chosen on the Welcome card, kept while the card is shown.
  let welcome = null;   // { fields, currency, countryCode }

  function welcomeState() {
    if (!welcome) {
      const suggestion = schema.suggestRegion(navigator.language);
      welcome = {
        suggested: suggestion.currency !== null,
        fields: suggestion.currency === null,
        currency: suggestion.currency || '',
        currencyName: suggestion.currencyName,
        countryCode: suggestion.countryCode || ''
      };
    }
    return welcome;
  }

  // ---- Welcome card ----------------------------------------------------------------------

  function currencyOptions(selected) {
    const options = [selected === ''
      ? html`<option value="" selected></option>`
      : html`<option value=""></option>`];
    schema.currencies.forEach(function (item) {
      options.push(html`<option value="${item.code}"${item.code === selected ? html` selected` : ''}>${item.name} (${item.code})</option>`);
    });
    return options;
  }

  function confirmHtml() {
    const w = welcomeState();
    if (!w.fields) {
      return html`<p class="welcome__confirm-text">Currency: ${w.currencyName} (${w.currency}). Country code: +${w.countryCode}. Correct?</p>
        <button class="link" type="button" data-action="welcome.change">Change</button>`;
    }
    return html`<div class="fields fields--2">
      ${c.field({
        id: 'w-currency', label: 'Currency',
        control: html`<select class="input" id="w-currency" name="currency" data-action="welcome.field">${currencyOptions(w.currency)}</select>`
      })}
      ${c.field({
        id: 'w-country', label: 'Country code for phone numbers',
        control: html`<input class="input num" id="w-country" name="countryCode" type="text" inputmode="numeric" autocomplete="off" value="${w.countryCode}" data-action="welcome.field">`
      })}
    </div>`;
  }

  function welcomeCard() {
    return html`<section class="card welcome" data-card="welcome">
      <h2 class="card__title">Welcome</h2>
      <ol class="welcome__list">${STATEMENTS.map(function (s, i) {
        return html`<li class="welcome__item">
          <h3 class="welcome__title">${s.title}</h3>
          <p class="welcome__text">${s.line}</p>
          <details class="more" data-key="${'welcome-' + i}">
            <summary class="more__toggle">More${icons.icon('chevron')}</summary>
            <p class="more__body">${s.more}</p>
          </details>
        </li>`;
      })}</ol>
      <p class="welcome__aside">Used Laser before and see nothing here? You opened it in a different browser or a different place. Your data is still where you used it.</p>
      <div class="welcome__confirm" data-partial="welcome-confirm">${confirmHtml()}</div>
      <div class="actions">
        <button class="btn btn--primary" type="button" data-action="welcome.start">Start</button>
        <button class="btn btn--secondary" type="button" data-action="welcome.import">I have a backup file</button>
      </div>
    </section>`;
  }

  // The same three statements with their full texts: Settings > This device shows them.
  function howItWorks() {
    return html`<ol class="welcome__list">${STATEMENTS.map(function (s) {
      return html`<li class="welcome__item">
        <h3 class="welcome__title">${s.title}</h3>
        <p class="welcome__text">${s.more}</p>
      </li>`;
    })}</ol>`;
  }

  // ---- checklist, check your backup, backup line -----------------------------------------

  function checklistCard(started) {
    const done = started.items.filter(function (item) { return item.done; }).length;
    const rows = started.items.map(function (item) {
      let action = '';
      if (!item.done && item.key === 'client') {
        action = html`<button class="btn btn--secondary checklist__action" type="button" data-action="client.new">New client</button>`;
      } else if (!item.done && item.key === 'backup' && !item.note) {
        action = html`<button class="btn btn--secondary checklist__action" type="button" data-action="backup.now">Back up now</button>`;
      }
      return html`<li class="checklist__item" data-item="${item.key}"${item.done ? html` data-tone="done"` : ''}>
        <span class="checklist__mark">${icons.icon('check')}</span>
        <div class="checklist__body">
          <span class="checklist__text">${item.done ? html`<span class="sr-only">Done: </span>` : ''}${item.label}</span>
          ${item.note ? html`<span class="checklist__note">${item.note}</span>` : ''}
        </div>
        ${action}
      </li>`;
    });
    return html`<section class="card" data-card="checklist">
      <header class="card__head">
        <h2 class="card__title">Getting started</h2>
        <span class="card__meta">${done} of ${started.items.length}</span>
      </header>
      <ul class="checklist">${rows}</ul>
    </section>`;
  }

  function checkBackupCard() {
    return html`<section class="card" data-card="check-backup">
      <header class="card__head"><h2 class="card__title">Check your backup</h2></header>
      <div class="stack">
        <p>Choose the file you just saved.</p>
        <div class="actions"><button class="btn btn--secondary" type="button" data-action="backup.check">Check a backup file</button></div>
      </div>
    </section>`;
  }

  function backupLine(status) {
    return html`<section class="card backup-line" data-card="backup-line">
      <p class="backup-line__text">${status.backedUpToday ? c.badge('done', status.homeLine) : status.homeLine}</p>
      <button class="btn btn--secondary" type="button" data-action="backup.now">Back up now</button>
    </section>`;
  }

  // ---- To do, Today, Next 7 days ---------------------------------------------------------

  function reminderRow(r, today) {
    const a = r.appointment;
    const p = r.person;
    return html`<li class="row" data-row="${'remind-' + a.id}"${r.tone === 'urgent' ? html` data-tone="urgent"` : ''}>
      <a class="row__title" href="${parts.clientHref(p.id)}" dir="auto">${p.name}</a>
      <div class="row__sub"><span class="row__fact">Appointment ${parts.dayWords(a.date, today).toLowerCase()} at ${a.time}</span></div>
      ${c.badge(r.tone, r.word)}
      <div class="row__actions">
        <button class="btn btn--primary" type="button" data-action="send.open" data-kind="${r.kind}" data-person="${p.id}" data-id="${a.id}">Send reminder</button>
      </div>
    </li>`;
  }

  function rebookRow(r) {
    const p = r.person;
    return html`<li class="row" data-row="${'rebook-' + p.id}"${r.tone === 'urgent' ? html` data-tone="urgent"` : ''}>
      <a class="row__title" href="${parts.clientHref(p.id)}" dir="auto">${p.name}</a>
      <div class="row__sub"><span class="row__fact">Ask for the next session. Last visit ${dates.format(r.lastVisit, 'short')}</span></div>
      ${c.badge(r.tone, r.word)}
      <div class="row__actions">
        <button class="btn btn--secondary" type="button" data-action="send.open" data-kind="rebook" data-person="${p.id}">${r.asked ? 'Ask again' : 'Message'}</button>
        <button class="btn btn--secondary" type="button" data-action="session.book" data-person="${p.id}">Book</button>
      </div>
    </li>`;
  }

  function leadRow(p, tone) {
    return html`<li class="row" data-row="${'lead-' + p.id}"${tone.tone === 'urgent' ? html` data-tone="urgent"` : ''}>
      <a class="row__title" href="${router.href('/leads')}" dir="auto">${p.name}</a>
      <div class="row__sub"><span class="row__fact" dir="auto">${p.leadInterest || 'Lead'}</span></div>
      ${c.badge(tone.tone, tone.word)}
      <div class="row__actions">
        <button class="btn btn--secondary" type="button" data-action="send.open" data-kind="lead" data-person="${p.id}">Message</button>
      </div>
    </li>`;
  }

  // Everything that needs the owner today, most urgent first.
  function todoCard(state, today) {
    const rows = [];
    practice.needsOutcome(state, today).forEach(function (row) { rows.push(parts.appointmentRow(row, state, today)); });
    practice.reminders(state).forEach(function (r) { rows.push(reminderRow(r, today)); });
    practice.rebook(state, today).forEach(function (r) {
      if (r.tone === 'urgent' || r.tone === 'important') rows.push(rebookRow(r));
    });
    practice.leads(state).forEach(function (p) {
      const tone = practice.leadTone(p, today);
      if (tone.tone === 'urgent' || tone.tone === 'important') rows.push(leadRow(p, tone));
    });
    return html`<section class="card card--flush" data-card="todo">
      <header class="card__head"><h2 class="card__title">To do</h2>${rows.length ? html`<span class="card__meta">${rows.length}</span>` : ''}</header>
      ${rows.length ? html`<ul class="rows">${rows}</ul>` : html`<p class="quiet">${c.badge('done', 'All caught up')}</p>`}
    </section>`;
  }

  function todayCard(state, today) {
    const rows = practice.onDay(state, today);
    const done = rows.filter(function (r) { return r.appointment.status === 'done'; }).length;
    const meta = rows.length ? done + ' of ' + rows.length + ' done, ' + parts.cash(practice.receivedOn(state, today), state) + ' received' : '';
    return html`<section class="card card--flush" data-card="today">
      <header class="card__head"><h2 class="card__title">Today</h2>${meta ? html`<span class="card__meta">${meta}</span>` : ''}</header>
      ${parts.list(rows.map(function (row) { return parts.appointmentRow(row, state, today, { showDay: false }); }), 'No appointments today.')}
    </section>`;
  }

  function weekCard(state, today) {
    const rows = practice.upcoming(state, dates.addDays(today, 1), dates.addDays(today, 7));
    return html`<section class="card card--flush" data-card="week">
      <header class="card__head"><h2 class="card__title">Next 7 days</h2><a class="card__meta link" href="${router.href('/schedule')}">All appointments</a></header>
      ${parts.list(rows.map(function (row) { return parts.appointmentRow(row, state, today); }), 'Nothing booked for the next 7 days.')}
    </section>`;
  }

  function quickCard() {
    return html`<section class="card" data-card="quick">
      <header class="card__head"><h2 class="card__title">Add</h2></header>
      <div class="quick">
        <button class="btn btn--primary" type="button" data-action="session.add">Treatment</button>
        <button class="btn btn--primary" type="button" data-action="session.book">Appointment</button>
        <button class="btn btn--secondary" type="button" data-action="client.new">Client</button>
        <button class="btn btn--secondary" type="button" data-action="lead.new">Lead</button>
      </div>
    </section>`;
  }

  // ---- the view --------------------------------------------------------------------------

  function render(state) {
    const started = selectors.gettingStarted(state);
    const status = selectors.backupStatus(state);
    const today = dates.today();
    const month = practice.month(state, dates.monthKey(today));
    const leads = practice.leads(state).filter(function (p) { return practice.leadTone(p, today).open; });
    const fresh = leads.filter(function (p) { return p.leadStatus === 'new'; }).length;
    const main = [];
    const side = [];
    if (started.showWelcome) {
      main.push(welcomeCard());
      side.push(backupLine(status));
    } else {
      if (started.showChecklist) main.push(checklistCard(started));
      if (started.showCheckBackup) main.push(checkBackupCard());
      main.push(todoCard(state, today), todayCard(state, today), weekCard(state, today));
      side.push(quickCard(), backupLine(status));
    }
    return html`<div class="page" data-view="home">
      <p class="date-line">${dates.format(today, 'long')}</p>
      ${c.summary([
        { key: 'today', label: 'Today', value: practice.onDay(state, today).length.toLocaleString('en'), note: 'appointments', href: router.href('/schedule') },
        { key: 'received', label: 'Received in ' + dates.format(today, 'month').split(' ')[0], value: parts.cash(month.receivedMinor, state), note: c.plural(month.treatments, 'treatment'), href: router.href('/schedule/done') },
        { key: 'clients', label: 'Active clients', value: practice.activeClients(state).length.toLocaleString('en'), note: month.newClients + ' new this month', href: router.href('/clients/summary') },
        { key: 'leads', label: 'Open leads', value: leads.length.toLocaleString('en'), note: fresh + ' new', href: router.href('/leads') }
      ])}
      <div class="dash">
        <div class="dash__main">${main}</div>
        <div class="dash__side">${side}</div>
      </div>
    </div>`;
  }

  // ---- Welcome card actions --------------------------------------------------------------

  function redrawConfirm() {
    L.ui.shell.mountPartial('welcome-confirm', confirmHtml());
  }

  function cleanCountryCode(typed) {
    return String(typed).replace(/[\s+]/g, '');
  }

  actions.on('welcome.change', function () {
    welcomeState().fields = true;
    redrawConfirm();
    const first = document.getElementById('w-currency');
    if (first) first.focus();
  });

  function keepField(el) {
    const w = welcomeState();
    if (el.name === 'currency') w.currency = el.value;
    if (el.name === 'countryCode') w.countryCode = el.value;
    if (el.getAttribute('aria-invalid') === 'true') c.setError(el, null);
  }
  actions.on('input:welcome.field', keepField);
  actions.on('change:welcome.field', keepField);

  // Start saves the two values as shown and closes the card for good (3.9).
  actions.on('welcome.start', function () {
    const w = welcomeState();
    const currency = w.currency === '' ? null : w.currency;
    const countryCode = cleanCountryCode(w.countryCode);
    const currencyError = schema.check.currency(currency);
    const countryError = schema.check.countryCode(countryCode);
    if (currencyError || countryError) {
      if (!w.fields) { w.fields = true; redrawConfirm(); }
      c.setError(document.getElementById('w-currency'), currencyError);
      c.setError(document.getElementById('w-country'), countryError);
      const bad = document.getElementById(currencyError ? 'w-currency' : 'w-country');
      if (bad) bad.focus();
      return;
    }
    const result = store.commit('Welcome', function (draft) {
      schema.setCurrency(draft.settings, currency);
      draft.settings.countryCode = countryCode;
      draft.meta.welcomeDone = true;
    }, { undoable: false, countsAsChange: false });
    if (L.ui.shell.explain(result)) welcome = null;
  });

  // "I have a backup file": the card closes once a backup has been loaded.
  actions.on('welcome.import', function () {
    L.views.settings.loadBackup({ closeWelcome: true });
  });

  L.views.home = {
    title: 'Dashboard',
    render: render,
    howItWorks: howItWorks
  };
})(window.Laser);

// js/ui/views/clients.js
// Clients (7.4). Step 1 shows the Contacts list only: name, phone, email and the four
// contact buttons (Call, WhatsApp, Email, Copy number), with search, add, edit and delete.
// A row is one of the two places where more than one button per row is the point (R8).
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const phone = L.core.phone;
  const links = L.core.links;
  const store = L.core.store;
  const selectors = L.core.selectors;
  const c = L.ui.components;
  const icons = L.ui.icons;
  const overlay = L.ui.overlay;
  const router = L.ui.router;
  const actions = L.ui.actions;

  let query = '';   // what is typed in the search field

  // ---- one row ---------------------------------------------------------------------------

  // A contact button: a link when there is something to open, else a disabled button.
  function contactButton(kind, href, label, iconName) {
    if (!href) {
      return html`<button class="btn btn--secondary btn--icon" type="button" disabled aria-label="${label}" data-contact="${kind}">${icons.icon(iconName)}</button>`;
    }
    return links.opensNewTab(href)
      ? html`<a class="btn btn--secondary btn--icon" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${label}" data-contact="${kind}">${icons.icon(iconName)}</a>`
      : html`<a class="btn btn--secondary btn--icon" href="${href}" aria-label="${label}" data-contact="${kind}">${icons.icon(iconName)}</a>`;
  }

  function row(person, settings) {
    const name = person.name;
    const international = phone.toInternational(person.phone, settings.countryCode);
    const shownPhone = international ? phone.display(international, settings.countryCode) : person.phone;
    const tel = links.tel(person.phone, settings);
    const whatsapp = links.whatsapp(person.phone, '', settings);
    const mail = links.mailto(person.email);

    const facts = [];
    if (tel) facts.push(html`<a class="row__fact num" href="${tel}" dir="ltr">${shownPhone}</a>`);
    else if (person.phone) facts.push(html`<span class="row__fact num" dir="ltr">${person.phone}</span>`);
    if (mail) facts.push(html`<a class="row__fact" href="${mail}" dir="auto">${person.email}</a>`);

    const copy = phone.digits(person.phone) !== ''
      ? html`<button class="btn btn--secondary btn--icon" type="button" aria-label="${'Copy number of ' + name}" data-contact="copy" data-action="client.copy" data-id="${person.id}">${icons.icon('copy')}</button>`
      : html`<button class="btn btn--secondary btn--icon" type="button" disabled aria-label="${'Copy number of ' + name}" data-contact="copy">${icons.icon('copy')}</button>`;

    return html`<li class="row" data-row="${person.id}">
      <a class="row__title" href="${router.sheetHref('client', person.id)}" dir="auto" data-action="client.open" data-id="${person.id}">${name}</a>
      ${facts.length ? html`<div class="row__sub">${facts}</div>` : ''}
      <div class="row__actions">
        ${contactButton('call', tel, 'Call ' + name, 'phone')}
        ${contactButton('whatsapp', whatsapp, 'WhatsApp ' + name, 'chat')}
        ${contactButton('email', mail, 'Email ' + name, 'mail')}
        ${copy}
        ${c.menu({
          label: 'More for ' + name, id: person.id,
          items: [
            { label: 'Edit', action: 'client.edit' },
            { label: 'Delete client', action: 'client.delete', danger: true }
          ]
        })}
      </div>
    </li>`;
  }

  // ---- the list --------------------------------------------------------------------------

  function listHtml(state) {
    const all = selectors.clients(state);
    if (!all.length) {
      return c.card({
        extra: 'card--empty',
        body: c.empty({
          icon: 'users', text: 'No clients yet.',
          actions: html`<button class="btn btn--primary" type="button" data-action="client.new">Add your first client</button>`
        })
      });
    }
    const found = selectors.search(all, query);
    if (!found.length) {
      return c.card({
        extra: 'card--empty',
        body: c.empty({
          icon: 'search', text: html`No client matches '<bdi>${query.trim()}</bdi>'.`,
          actions: html`<button class="btn btn--secondary" type="button" data-action="clients.clearSearch">Clear search</button>`
        })
      });
    }
    return html`<ul class="rows rows--cards">${found.map(function (person) {
      return row(person, state.settings);
    })}</ul>`;
  }

  // The grey line that says why WhatsApp is switched off (acceptance item 9): shown while
  // no country code is set and a client's number cannot be used without one.
  function countryHint(state) {
    if (state.settings.countryCode !== '') return '';
    const stuck = selectors.clients(state).some(function (person) {
      return phone.digits(person.phone) !== '' && !phone.toInternational(person.phone, '');
    });
    if (!stuck) return '';
    return html`<p class="small muted" data-hint="country-code">Add your country code in <a class="link" href="${router.href('/settings/messages')}">Settings</a> to message by WhatsApp</p>`;
  }

  function render(state) {
    return html`<div class="page" data-view="clients">
      <div class="toolbar">
        <div class="search">
          <label class="sr-only" for="q">Search name, phone or email</label>
          ${icons.icon('search', 'search__icon')}
          <input class="input search__input" id="q" type="search" dir="auto" autocomplete="off" placeholder="Search name, phone or email" value="${query}" data-action="clients.search">
        </div>
      </div>
      ${countryHint(state)}
      <div data-partial="list">${listHtml(state)}</div>
    </div>`;
  }

  // ---- actions ---------------------------------------------------------------------------

  // Typing in the search field draws only the list again (2.6 rendering rule 2).
  actions.on('input:clients.search', function (el) {
    query = el.value;
    L.ui.shell.mountPartial('list', listHtml(store.get()));
  });

  actions.on('clients.clearSearch', function () {
    query = '';
    L.ui.shell.render();
    const field = document.getElementById('q');
    if (field) field.focus();
  });

  actions.on('client.copy', function (el) {
    const person = selectors.person(store.get(), el.getAttribute('data-id'));
    if (!person) {
      overlay.toast('That record was not found.');
      return;
    }
    const international = phone.toInternational(person.phone, store.get().settings.countryCode);
    const text = international ? '+' + international : person.phone.trim();
    L.ui.files.copy(text).then(function (ok) {
      if (ok) overlay.toast('Number copied');
    });
  });

  L.views.clients = {
    title: 'Clients',
    render: render,
    leave: function () { query = ''; }
  };
})(window.Laser);

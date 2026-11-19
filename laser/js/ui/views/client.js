// js/ui/views/client.js
// One client's page (#/clients/<id>): contact buttons, the special note in yellow, the
// figures (sessions, total paid, last and next visit), the profile and the history.
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const dates = L.core.dates;
  const phone = L.core.phone;
  const links = L.core.links;
  const schema = L.core.schema;
  const selectors = L.core.selectors;
  const practice = L.core.practice;
  const c = L.ui.components;
  const icons = L.ui.icons;
  const parts = L.ui.parts;
  const router = L.ui.router;

  function contact(href, label, icon) {
    if (!href) return html`<button class="btn btn--secondary" type="button" disabled>${icons.icon(icon)}${label}</button>`;
    return links.opensNewTab(href)
      ? html`<a class="btn btn--secondary" href="${href}" target="_blank" rel="noopener noreferrer">${icons.icon(icon)}${label}</a>`
      : html`<a class="btn btn--secondary" href="${href}">${icons.icon(icon)}${label}</a>`;
  }

  function fact(label, value) {
    return html`<div class="facts__item"><dt>${label}</dt><dd dir="auto">${value || html`<span class="muted">Not set</span>`}</dd></div>`;
  }

  function render(state, id) {
    const p = selectors.person(state, id);
    if (!p || !selectors.isClient(p)) {
      return html`<div class="page page--narrow" data-view="client">${c.card({
        body: c.empty({
          icon: 'users', text: 'This client was not found.',
          actions: html`<a class="btn btn--secondary" href="${router.href('/clients')}">Back to clients</a>`
        })
      })}</div>`;
    }
    const today = dates.today();
    const s = state.settings;
    const st = practice.stats(state, id, today);
    const history = practice.history(state, id);
    const intl = phone.toInternational(p.phone, s.countryCode);
    const statusItems = p.clientStatus === 'active'
      ? [{ label: 'Pause this client', action: 'client.pause' }, { label: 'Course finished', action: 'client.finish' }]
      : [{ label: 'Make active again', action: 'client.activate' }];
    const since = p.clientSince === schema.clientSince.earlierDate(state)
      ? 'Before using Laser' : dates.format(p.clientSince, 'short');

    return html`<div class="page" data-view="client" data-id="${p.id}">
      <a class="back" href="${router.href('/clients')}">${icons.icon('chevron', 'back__icon')}All clients</a>
      <section class="card">
        <div class="profile">
          <div class="profile__head">
            <h2 class="profile__name" dir="auto">${p.name}</h2>
            ${p.clientStatus !== 'active' ? c.badge('neutral', schema.label('clientStatus', p.clientStatus)) : ''}
          </div>
          <div class="actions">
            <button class="btn btn--primary" type="button" data-action="session.add" data-person="${p.id}">Add treatment</button>
            <button class="btn btn--primary" type="button" data-action="session.book" data-person="${p.id}">Book appointment</button>
            <button class="btn btn--secondary" type="button" data-action="client.edit" data-id="${p.id}">Edit</button>
            ${c.menu({
              label: 'More for ' + p.name, id: p.id,
              items: statusItems.concat([{ label: 'Delete client', action: 'client.delete', danger: true }])
            })}
          </div>
          <div class="actions">
            ${contact(links.tel(p.phone, s), 'Call', 'phone')}
            ${contact(links.whatsapp(p.phone, '', s), 'WhatsApp', 'chat')}
            ${contact(links.mailto(p.email), 'Email', 'mail')}
          </div>
        </div>
      </section>
      ${p.notes ? html`<section class="note-box" data-tone="important" aria-label="Special notes">${icons.toneIcon('important')}<p dir="auto">${p.notes}</p></section>` : ''}
      ${parts.tiles([
        { key: 'sessions', label: 'Sessions', value: st.sessions },
        { key: 'paid', label: 'Total paid', value: parts.cash(st.paidMinor, state) },
        { key: 'last', label: 'Last visit', value: st.lastVisit ? dates.format(st.lastVisit, 'short') : 'None yet' },
        { key: 'next', label: 'Next visit', value: st.next ? dates.format(st.next.date, 'short') : 'Not booked', note: st.next ? st.next.time : '' }
      ])}
      ${c.card({
        title: 'Profile',
        body: html`<dl class="facts">
          ${fact('Phone', intl ? phone.display(intl, s.countryCode) : p.phone)}
          ${fact('Email', p.email)}
          ${fact('Hair colour', schema.label('hairColor', p.hairColor))}
          ${fact('Hair thickness', schema.label('hairThickness', p.hairThickness))}
          ${fact('Weeks between sessions', practice.weeksFor(p, s) + (p.intervalWeeks ? '' : ' (the usual)'))}
          ${fact('Client since', since)}
        </dl>`
      })}
      ${c.card({
        extra: 'card--flush', title: 'History',
        meta: p.priorSessions ? c.plural(p.priorSessions, 'session') + ' before using Laser' : '',
        body: parts.list(history.map(function (a) {
          return parts.appointmentRow({ appointment: a, person: p }, state, today, { showName: false });
        }), 'No treatments or appointments yet.')
      })}
    </div>`;
  }

  L.views.clientPage = { render: render };
})(window.Laser);

// js/ui/views/leads.js
// Leads: people who asked about laser and are not clients yet.
//   #/leads        the open leads          #/leads/all    every lead, closed ones too
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const dates = L.core.dates;
  const phone = L.core.phone;
  const practice = L.core.practice;
  const c = L.ui.components;
  const parts = L.ui.parts;
  const router = L.ui.router;
  const actions = L.ui.actions;

  function row(p, state, today) {
    const t = practice.leadTone(p, today);
    const facts = [];
    const intl = phone.toInternational(p.phone, state.settings.countryCode);
    if (p.phone) facts.push(html`<span class="row__fact num" dir="ltr">${intl ? phone.display(intl, state.settings.countryCode) : p.phone}</span>`);
    if (p.leadInterest) facts.push(html`<span class="row__fact" dir="auto">${p.leadInterest}</span>`);
    if (p.followUpOn && t.open) facts.push(html`<span class="row__fact">Follow up ${parts.dayInSentence(p.followUpOn, today)}</span>`);
    if (!facts.length) facts.push(html`<span class="row__fact">Added ${dates.format(p.leadSince || today, 'short')}</span>`);
    const items = [];
    if (t.open) {
      items.push({ label: 'Contacted, follow up in 3 days', action: 'lead.contacted3' });
      items.push({ label: 'Contacted, no follow-up', action: 'lead.contacted' });
      items.push({ label: 'Not interested', action: 'lead.close' });
    }
    items.push({ label: 'Edit', action: 'lead.edit' });
    items.push({ label: 'Delete lead', action: 'lead.delete', danger: true });
    return html`<li class="row" data-row="${p.id}"${t.tone === 'urgent' ? html` data-tone="urgent"` : ''}>
      <button class="row__title" type="button" dir="auto" data-action="lead.edit" data-id="${p.id}">${p.name}</button>
      <div class="row__sub">${facts}</div>
      ${c.badge(t.tone, t.word)}
      <div class="row__actions">
        ${t.open ? html`<button class="btn btn--secondary" type="button" data-action="send.open" data-kind="lead" data-person="${p.id}">Message</button>
        <button class="btn btn--primary" type="button" data-action="lead.convert" data-id="${p.id}">Make client</button>` : ''}
        ${c.menu({ label: 'More for ' + p.name, id: p.id, items: items })}
      </div>
    </li>`;
  }

  function render(state, route) {
    const today = dates.today();
    const all = practice.leads(state);
    const open = all.filter(function (p) { return practice.leadTone(p, today).open; });
    const showAll = route.sub === 'all';
    const shown = showAll ? all : open;
    let body;
    if (!all.length) {
      body = c.card({
        extra: 'card--empty',
        body: c.empty({
          icon: 'leads', text: 'No leads yet.',
          note: 'Write down everyone who asks about laser, so nobody is forgotten.',
          actions: html`<button class="btn btn--primary" type="button" data-action="lead.new">Add a lead</button>`
        })
      });
    } else {
      body = c.card({
        extra: 'card--flush',
        body: parts.list(shown.map(function (p) { return row(p, state, today); }), 'No open leads.')
      });
    }
    return html`<div class="page" data-view="leads">
      <div class="toolbar toolbar--split">
        ${parts.tabs({
          label: 'Leads', current: showAll ? 'all' : 'open',
          items: [
            { key: 'open', label: 'Open', href: router.href('/leads'), count: open.length },
            { key: 'all', label: 'All', href: router.href('/leads/all') }
          ]
        })}
        <div class="actions"><button class="btn btn--primary" type="button" data-action="lead.new">New lead</button></div>
      </div>
      ${body}
    </div>`;
  }

  actions.on('lead.contacted3', function (b) {
    parts.undoable(practice.markContacted(b.getAttribute('data-id'), dates.addDays(dates.today(), 3)),
      'Marked as contacted. Follow-up in 3 days.', 'Marked as contacted');
  });
  actions.on('lead.contacted', function (b) {
    parts.undoable(practice.markContacted(b.getAttribute('data-id'), null), 'Marked as contacted.', 'Marked as contacted');
  });
  actions.on('lead.close', function (b) {
    parts.undoable(practice.closeLead(b.getAttribute('data-id')), 'Marked as not interested.', 'Lead closed');
  });
  actions.on('lead.convert', function (b) {
    const id = b.getAttribute('data-id');
    if (parts.undoable(practice.convertLead(id), 'Now a client.', 'Became a client')) router.go(parts.clientHref(id));
  });

  L.views.leads = { title: 'Leads', render: render };
})(window.Laser);

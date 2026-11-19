// js/ui/views/schedule.js
// Schedule: what is coming (Upcoming), what was done and paid month by month (Done), and
// who should be asked for their next session (Ask to rebook, the 4-week rule).
//   #/schedule            Upcoming
//   #/schedule/done       Done, this month;  ?m=2026-10 another month
//   #/schedule/rebook     Ask to rebook
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const dates = L.core.dates;
  const practice = L.core.practice;
  const c = L.ui.components;
  const parts = L.ui.parts;
  const router = L.ui.router;
  const actions = L.ui.actions;

  function head(state, current, today) {
    const due = practice.rebook(state, today).filter(function (r) { return r.tone === 'urgent' || r.tone === 'important'; }).length;
    return html`<div class="toolbar toolbar--split">
      ${parts.tabs({
        label: 'Schedule', current: current,
        items: [
          { key: 'upcoming', label: 'Upcoming', href: router.href('/schedule') },
          { key: 'done', label: 'Done', href: router.href('/schedule/done') },
          { key: 'rebook', label: 'Ask to rebook', href: router.href('/schedule/rebook'), count: due }
        ]
      })}
      <div class="actions">
        <button class="btn btn--secondary" type="button" data-action="session.add">Add treatment</button>
        <button class="btn btn--primary" type="button" data-action="session.book">Book appointment</button>
      </div>
    </div>`;
  }

  // ---- Upcoming --------------------------------------------------------------------------

  function upcoming(state, today) {
    const cards = [];
    const late = practice.needsOutcome(state, today);
    if (late.length) {
      cards.push(c.card({
        extra: 'card--flush', title: 'Needs an outcome', meta: 'Finish, or mark as no-show',
        body: html`<ul class="rows">${late.map(function (row) { return parts.appointmentRow(row, state, today); })}</ul>`
      }));
    }
    const rows = practice.upcoming(state, today, null);
    if (!rows.length && !late.length) {
      cards.push(c.card({
        extra: 'card--empty',
        body: c.empty({
          icon: 'calendar', text: 'Nothing is booked.',
          actions: html`<button class="btn btn--primary" type="button" data-action="session.book">Book appointment</button>`
        })
      }));
    }
    const days = [];
    rows.forEach(function (row) {
      const last = days[days.length - 1];
      if (last && last.date === row.appointment.date) last.rows.push(row);
      else days.push({ date: row.appointment.date, rows: [row] });
    });
    days.forEach(function (day) {
      const words = parts.dayWords(day.date, today);
      const full = dates.format(day.date, 'long');
      const near = words === 'Today' || words === 'Tomorrow';
      cards.push(c.card({
        extra: 'card--flush', title: near ? words : full, meta: near ? full : '',
        body: html`<ul class="rows">${day.rows.map(function (row) {
          return parts.appointmentRow(row, state, today, { showDay: false });
        })}</ul>`
      }));
    });
    return html`${cards}`;
  }

  // ---- Done ------------------------------------------------------------------------------

  function done(state, today, route) {
    const thisMonth = dates.monthKey(today);
    const key = dates.isMonthKey(route.query.m) && route.query.m <= thisMonth ? route.query.m : thisMonth;
    const m = practice.month(state, key);
    const rows = practice.doneIn(state, key);
    const before = dates.addMonths(key, -1);
    const after = dates.addMonths(key, 1);
    return html`<div class="month-nav">
        <a class="btn btn--secondary" href="${router.href('/schedule/done', { m: before })}">Earlier</a>
        <h2 class="month-nav__title">${dates.format(key, 'month')}</h2>
        ${key < thisMonth
          ? html`<a class="btn btn--secondary" href="${router.href('/schedule/done', { m: after === thisMonth ? '' : after })}">Later</a>`
          : html`<span class="btn btn--secondary" aria-disabled="true">Later</span>`}
      </div>
      ${c.card({
        extra: 'card--flush',
        title: c.plural(m.treatments, 'treatment') + ', ' + parts.cash(m.receivedMinor, state) + ' received',
        body: parts.list(rows.map(function (row) { return parts.appointmentRow(row, state, today); }),
          'No treatments in this month.')
      })}`;
  }

  // ---- Ask to rebook ---------------------------------------------------------------------

  function rebookRow(r, state) {
    const p = r.person;
    const weeks = practice.weeksFor(p, state.settings);
    return html`<li class="row" data-row="${p.id}"${r.tone === 'urgent' ? html` data-tone="urgent"` : ''}>
      <a class="row__title" href="${parts.clientHref(p.id)}" dir="auto">${p.name}</a>
      <div class="row__sub"><span class="row__fact">Last session ${dates.format(r.lastVisit, 'short')}, every ${weeks} weeks</span></div>
      ${c.badge(r.tone, r.word)}
      <div class="row__actions">
        <button class="btn btn--secondary" type="button" data-action="send.open" data-kind="rebook" data-person="${p.id}">${r.asked ? 'Ask again' : 'Message'}</button>
        <button class="btn btn--secondary" type="button" data-action="session.book" data-person="${p.id}">Book</button>
        ${c.menu({
          label: 'More for ' + p.name, id: p.id,
          items: [
            { label: 'Remind me in a week', action: 'rebook.snooze' },
            { label: 'Pause this client', action: 'client.pause' },
            { label: 'Course finished', action: 'client.finish' }
          ]
        })}
      </div>
    </li>`;
  }

  function rebook(state, today) {
    const all = practice.rebook(state, today);
    if (!all.length) {
      return c.card({
        extra: 'card--empty',
        body: c.empty({
          icon: 'check', text: 'Nobody needs asking right now.',
          note: 'A client appears here a week before their next session is due, when nothing is booked for them.'
        })
      });
    }
    return c.card({
      extra: 'card--flush', title: 'Ask for the next session',
      body: html`<ul class="rows">${all.map(function (r) { return rebookRow(r, state); })}</ul>`
    });
  }

  function render(state, route) {
    const today = dates.today();
    const tab = route.sub === 'done' || route.sub === 'rebook' ? route.sub : 'upcoming';
    const body = tab === 'done' ? done(state, today, route) : tab === 'rebook' ? rebook(state, today) : upcoming(state, today);
    return html`<div class="page" data-view="schedule" data-tab="${tab}">${head(state, tab, today)}${body}</div>`;
  }

  actions.on('rebook.snooze', function (b) {
    parts.undoable(practice.snooze(b.getAttribute('data-id'), 7), 'Hidden for a week.', 'Snoozed');
  });
  actions.on('client.pause', function (b) {
    parts.undoable(practice.setClientStatus(b.getAttribute('data-id'), 'paused'), 'Client paused.', 'Status changed');
  });
  actions.on('client.finish', function (b) {
    parts.undoable(practice.setClientStatus(b.getAttribute('data-id'), 'finished'), 'Marked as course finished.', 'Status changed');
  });
  actions.on('client.activate', function (b) {
    parts.undoable(practice.setClientStatus(b.getAttribute('data-id'), 'active'), 'Client is active again.', 'Status changed');
  });

  L.views.schedule = { title: 'Schedule', render: render };
})(window.Laser);

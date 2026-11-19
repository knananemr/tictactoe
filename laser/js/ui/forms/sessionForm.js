// js/ui/forms/sessionForm.js
// One form for everything about a session:
//   treatment  a treatment that was done, with what was paid (today or a past day)
//   finish     a booked appointment is done: what was paid, and the next session
//   edit       correct a treatment
//   book       a new appointment          move   another day or time for a booked one
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const dates = L.core.dates;
  const money = L.core.money;
  const store = L.core.store;
  const selectors = L.core.selectors;
  const practice = L.core.practice;
  const c = L.ui.components;
  const parts = L.ui.parts;
  const overlay = L.ui.overlay;
  const actions = L.ui.actions;

  const TITLES = {
    treatment: 'Add treatment', finish: 'Finish appointment', edit: 'Edit treatment',
    book: 'Book appointment', move: 'Move appointment'
  };

  let open = null;   // { mode, id, personId, warned }

  function el(id) { return document.getElementById(id); }
  function isDoneMode(mode) { return mode === 'treatment' || mode === 'finish' || mode === 'edit'; }

  function weekChoices(person, settings) {
    const first = person ? practice.weeksFor(person, settings) : settings.rebookWeeks;
    const out = [first];
    settings.quickPickWeeks.forEach(function (w) { if (out.indexOf(w) === -1) out.push(w); });
    return out;
  }

  // The one-tap dates of the Book form: counted from the last treatment when that still
  // gives a day from today on, otherwise from today.
  function quickDates(personId) {
    const state = store.get();
    const today = dates.today();
    const person = personId ? selectors.person(state, personId) : null;
    const last = person ? practice.stats(state, personId, today).lastVisit : null;
    const picks = [];
    weekChoices(person, state.settings).forEach(function (w) {
      let date = last ? dates.addDays(last, w * 7) : null;
      if (!date || date < today) date = dates.addDays(today, w * 7);
      if (picks.some(function (p) { return p.date === date; })) return;
      picks.push({ date: date, label: '+' + w + ' wk, ' + dates.format(date, 'short') });
    });
    return html`${picks.map(function (p) {
      return html`<button class="pick" type="button" data-action="session.pick" data-date="${p.date}">${p.label}</button>`;
    })}`;
  }

  function clientField(state, person) {
    if (person) {
      return html`<div class="field"><span class="field__label">Client</span><p class="field__static" dir="auto">${person.name}</p></div>`;
    }
    const options = selectors.clients(state).map(function (p) {
      return html`<option value="${p.id}">${p.name}</option>`;
    });
    return c.field({
      id: 's-person', label: 'Client', required: true,
      control: html`<select class="input" id="s-person" name="person" data-action="session.person"><option value=""></option>${options}</select>`
    });
  }

  function show(o) {
    const state = store.get();
    const today = dates.today();
    const a = o.id ? practice.appointment(state, o.id) : null;
    if (o.id && !a) { overlay.toast('That record was not found.'); return; }
    if (!selectors.clients(state).length) {
      overlay.toast('Add a client first.');
      L.ui.router.openSheet('client', null);
      return;
    }
    const mode = o.mode;
    const personId = a ? a.personId : (o.personId || '');
    const person = personId ? selectors.person(state, personId) : null;
    const st = person ? practice.stats(state, personId, today) : null;
    const doneMode = isDoneMode(mode);
    const s = state.settings;

    let date = a ? a.date : (mode === 'treatment' ? today : '');
    if (mode === 'finish' && date > today) date = today;
    const time = a && a.time ? a.time : (mode === 'book' && st && st.lastTime ? st.lastTime : '');
    let amount = '';
    if (mode === 'edit') amount = money.formatNumber(practice.paidFor(state, a.id), s.currencyDecimals, { short: true });
    else if (doneMode && s.usualPriceMinor !== null) amount = money.formatNumber(s.usualPriceMinor, s.currencyDecimals, { short: true });

    const body = [clientField(state, person)];
    body.push(html`<div class="fields fields--2">
      ${c.field({
        id: 's-date', label: 'Date', required: true,
        control: doneMode
          ? html`<input class="input" id="s-date" name="date" type="date" max="${today}" value="${date}">`
          : html`<input class="input" id="s-date" name="date" type="date" min="${today}" value="${date}">`
      })}
      ${c.field({
        id: 's-time', label: 'Time', required: !doneMode,
        control: html`<input class="input" id="s-time" name="time" type="time" value="${time}">`
      })}
    </div>`);
    if (!doneMode) {
      body.push(html`<div class="picks" data-partial="picks">${quickDates(personId)}</div>`);
    }
    if (doneMode) {
      body.push(c.field({
        id: 's-amount', label: 'Paid' + (s.currency ? ' (' + s.currency + ')' : ''), required: true,
        hint: 'Type 0 if nothing was paid.',
        control: html`<input class="input num" id="s-amount" name="amount" type="text" inputmode="decimal" autocomplete="off" value="${amount}">`
      }));
    }
    if (mode === 'treatment' || mode === 'finish') {
      const weeks = weekChoices(person, s);
      body.push(c.field({
        id: 's-next', label: 'Next session',
        hint: 'Books the next appointment at the same time of day.',
        control: html`<select class="input" id="s-next" name="next"><option value="">Do not book now</option>${weeks.map(function (w) {
          return html`<option value="${w}">In ${w} weeks</option>`;
        })}</select>`
      }));
    }
    body.push(c.field({
      id: 's-notes', label: 'Note',
      control: html`<textarea class="input input--area" id="s-notes" name="notes" dir="auto" rows="2">${a ? a.notes : ''}</textarea>`
    }));

    open = { mode: mode, id: a ? a.id : null, personId: personId, warned: false };
    parts.sheet({
      name: 'session', title: TITLES[mode], action: 'session.save', body: html`${body}`,
      saveLabel: mode === 'book' ? 'Book' : 'Save',
      focus: person ? (doneMode ? '#s-amount' : '#s-date') : '#s-person'
    });
  }

  function save() {
    if (!open) return;
    const state = store.get();
    const today = dates.today();
    const mode = open.mode;
    const doneMode = isDoneMode(mode);
    const personId = open.personId || (el('s-person') ? el('s-person').value : '');
    const date = el('s-date').value;
    const time = el('s-time').value;
    let bad = null;
    function fail(input, message) {
      c.setError(input, message);
      if (message && !bad) bad = input;
    }
    parts.formError(null);
    if (el('s-person')) fail(el('s-person'), personId ? null : 'Choose a client');
    let dateError = dates.isDate(date) ? null : 'Enter a date';
    if (!dateError && doneMode && date > today) dateError = 'A treatment cannot be in the future. Book an appointment instead.';
    if (!dateError && !doneMode && date < today) dateError = 'Choose today or a later day';
    fail(el('s-date'), dateError);
    fail(el('s-time'), (time === '' && doneMode) || dates.isTime(time) ? null : 'Enter a time, for example 14:00');

    let amountMinor = 0;
    let next = null;
    if (doneMode) {
      const parsed = money.parse(el('s-amount').value, state.settings.currencyDecimals);
      fail(el('s-amount'), parsed.error || (parsed.minor === null ? 'Enter what was paid. Type 0 if nothing.' : null));
      amountMinor = parsed.minor || 0;
      const weeks = el('s-next') ? +el('s-next').value : 0;
      if (weeks && !bad) {
        if (!time) fail(el('s-time'), 'Enter a time, so the next session can be booked at the same time');
        else next = { date: dates.addDays(date, weeks * 7), time: time };
      }
    }
    if (bad) { bad.focus(); return; }

    if (!doneMode || next) {
      const hit = practice.clash(state, next ? next.date : date, next ? next.time : time, open.id);
      if (hit && !open.warned) {
        open.warned = true;
        parts.formError('Heads up: ' + hit.person.name + ' is booked at ' + hit.appointment.time + ' on ' +
          dates.format(hit.appointment.date, 'short') + '. Press save again to keep this time anyway.');
        return;
      }
    }
    const notes = el('s-notes').value.trim();
    const result = doneMode
      ? practice.saveTreatment({ id: mode === 'treatment' ? null : open.id, personId: personId, date: date, time: time, amountMinor: amountMinor, notes: notes, next: next })
      : practice.book({ id: mode === 'move' ? open.id : null, personId: personId, date: date, time: time, notes: notes });
    if (parts.done(result, doneMode ? (next ? 'Saved. Next session booked for ' + dates.format(next.date, 'short') + '.' : 'Saved') : 'Booked for ' + dates.format(date, 'short') + ' at ' + time)) {
      open = null;
    }
  }

  function fromButton(mode) {
    return function (button) {
      show({ mode: mode, id: button.getAttribute('data-id'), personId: button.getAttribute('data-person') });
    };
  }

  actions.on('session.save', save);
  actions.on('session.add', function (b) { show({ mode: 'treatment', personId: b.getAttribute('data-person') }); });
  actions.on('session.book', function (b) { show({ mode: 'book', personId: b.getAttribute('data-person') }); });
  actions.on('session.finish', fromButton('finish'));
  actions.on('session.edit', fromButton('edit'));
  actions.on('session.move', fromButton('move'));
  actions.on('session.pick', function (button) {
    el('s-date').value = button.getAttribute('data-date');
    c.setError(el('s-date'), null);
    (el('s-time').value ? document.querySelector('#overlay-root button[type="submit"]') : el('s-time')).focus();
  });
  actions.on('change:session.person', function (select) {
    const slot = document.querySelector('#overlay-root [data-partial="picks"]');
    if (slot) c.mount(slot, quickDates(select.value));
    const st = select.value ? practice.stats(store.get(), select.value) : null;
    if (st && st.lastTime && el('s-time').value === '') el('s-time').value = st.lastTime;
  });
  actions.on('session.noShow', function (b) {
    parts.undoable(practice.setStatus(b.getAttribute('data-id'), 'noShow'), 'Marked as no-show.', 'Marked as no-show');
  });
  actions.on('session.cancel', function (b) {
    parts.undoable(practice.setStatus(b.getAttribute('data-id'), 'cancelled'), 'Appointment cancelled.', 'Appointment cancelled');
  });
  actions.on('session.delete', function (b) {
    parts.undoable(practice.deleteAppointment(b.getAttribute('data-id')), 'Deleted, with its payment.', 'Deleted');
  });

  L.forms.sessionForm = { open: show };
})(window.Laser);

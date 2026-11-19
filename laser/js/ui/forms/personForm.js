// js/ui/forms/personForm.js
// The client form (7.9), step 1: Full name, Phone, Email, Client since.
// It opens over any view from the address (?sheet=client, with &id=... to edit) and is
// drawn once; while the owner types, only its small lines change (2.6 rendering rule 1).
// What is typed is kept as a draft, so a closed or discarded page loses nothing (rule 3).
(function (L) {
  'use strict';

  const util = L.core.util;
  const html = util.html;
  const dates = L.core.dates;
  const phone = L.core.phone;
  const schema = L.core.schema;
  const store = L.core.store;
  const selectors = L.core.selectors;
  const c = L.ui.components;
  const icons = L.ui.icons;
  const overlay = L.ui.overlay;
  const router = L.ui.router;
  const actions = L.ui.actions;

  const SHEET = 'client';
  const DELETED = 'Client deleted';     // the commit label the Undo toast belongs to
  const INPUTS = {
    name: 'f-name', phone: 'f-phone', email: 'f-email', sinceDate: 'f-since',
    hairColor: 'f-hair', hairThickness: 'f-thick', notes: 'f-notes',
    intervalWeeks: 'f-weeks', priorSessions: 'f-prior', priorPaid: 'f-priorpaid'
  };
  const ORDER = ['name', 'phone', 'email', 'notes', 'sinceDate', 'intervalWeeks', 'priorSessions', 'priorPaid'];
  // the profile fields: kept as text while the form is open
  const PROFILE = ['hairColor', 'hairThickness', 'notes', 'intervalWeeks', 'priorSessions', 'priorPaid'];
  const money = L.core.money;

  let open = null;   // { id, base, saved } while the form is on screen

  function key(id) { return SHEET + ':' + (id || ''); }

  function formEl() { return document.querySelector('#overlay-root form[data-action="client.save"]'); }
  function input(name) { return document.getElementById(INPUTS[name]); }

  // ---- values ----------------------------------------------------------------------------

  function text(value) { return typeof value === 'string' ? value : ''; }

  // What the form shows when nothing was typed: the stored record, or an empty new client.
  function baseValues(person, state, since) {
    if (!person) {
      return {
        name: '', phone: '', email: '', since: since === 'earlier' ? 'earlier' : 'today', sinceDate: '',
        hairColor: '', hairThickness: '', notes: '', intervalWeeks: '', priorSessions: '', priorPaid: ''
      };
    }
    const choice = schema.clientSince.toChoice(person.clientSince, state);
    return {
      name: person.name, phone: person.phone, email: person.email,
      since: choice.choice, sinceDate: choice.date,
      hairColor: person.hairColor || '', hairThickness: person.hairThickness || '', notes: person.notes,
      intervalWeeks: person.intervalWeeks === null ? '' : String(person.intervalWeeks),
      priorSessions: person.priorSessions ? String(person.priorSessions) : '',
      priorPaid: person.priorPaidMinor
        ? money.formatNumber(person.priorPaidMinor, state.settings.currencyDecimals, { short: true }) : ''
    };
  }

  // A stored draft is only screen state, but it is still checked before it is shown.
  function draftValues(values, base) {
    const since = values.since === 'today' || values.since === 'earlier' ? values.since : base.since;
    const out = {
      name: text(values.name), phone: text(values.phone), email: text(values.email),
      since: since, sinceDate: dates.isDate(values.sinceDate) ? values.sinceDate : ''
    };
    PROFILE.forEach(function (name) {
      out[name] = typeof values[name] === 'string' ? values[name] : base[name];
    });
    return out;
  }

  function read() {
    const form = formEl();
    const since = form.querySelector('input[name="since"]:checked');
    const out = {
      name: input('name').value,
      phone: input('phone').value,
      email: input('email').value,
      since: since ? since.value : 'today',
      sinceDate: input('sinceDate').value
    };
    PROFILE.forEach(function (name) { out[name] = input(name).value; });
    return out;
  }

  function differs(values, base) {
    if (values.name !== base.name || values.phone !== base.phone || values.email !== base.email) return true;
    if (values.since !== base.since) return true;
    if (PROFILE.some(function (name) { return values[name] !== base[name]; })) return true;
    return values.since === 'earlier' && values.sinceDate !== base.sinceDate;
  }

  // true while the form holds typing that is not saved
  function holdsInput() {
    return !!open && !open.saved && !!formEl() && differs(read(), open.base);
  }

  // ---- drafts ----------------------------------------------------------------------------

  function persistDraft() {
    if (!open || open.saved || !formEl()) return;
    const values = read();
    if (differs(values, open.base)) store.drafts.save(SHEET, open.id, values);
    else if (store.drafts.find(SHEET, open.id)) store.drafts.discard();
  }

  const saveDraftSoon = util.debounce(persistDraft, 400);

  // flush() writes a waiting draft now. Called before the page goes away.
  function flush() {
    saveDraftSoon.cancel();
    persistDraft();
  }

  // ---- markup ----------------------------------------------------------------------------

  function whatsappLine(typed, settings) {
    if (phone.digits(typed) === '') return '';
    const intl = phone.toInternational(typed, settings.countryCode);
    if (intl) return 'WhatsApp will use ' + phone.display(intl, settings.countryCode);
    if (settings.countryCode === '') return 'Add your country code in Settings to message by WhatsApp';
    return 'WhatsApp cannot use this number';
  }

  function noteHtml(o) {
    if (o.restored) {
      return html`<p class="sheet__note" data-partial="note">Restored what you were typing. <button class="link" type="button" data-action="client.discardDraft">Discard</button></p>`;
    }
    if (o.savedName) {
      return html`<p class="sheet__note" data-partial="note">Saved: <bdi>${o.savedName}</bdi></p>`;
    }
    return '';
  }

  function sinceHtml(values, today) {
    return html`<fieldset class="field">
      <legend class="field__label">Client since</legend>
      ${c.chipOptions({
        name: 'since', value: values.since,
        options: [{ value: 'today', label: 'Today' }, { value: 'earlier', label: 'Earlier (already my client)' }]
      })}
      <div class="field" data-partial="since-date"${values.since === 'earlier' ? '' : html` hidden`}>
        <label class="field__label" for="f-since">Since when? Leave empty if you do not remember.</label>
        <input class="input" id="f-since" name="sinceDate" type="date" max="${today}" value="${values.sinceDate}">
        <p class="field__error" id="f-since-error" hidden>${icons.icon('alert')}<span data-error-text></span></p>
      </div>
      <p class="field__hint">Choose Earlier for clients you already had, so they are not counted as new this month.</p>
    </fieldset>`;
  }

  function options(list, selected) {
    return html`<option value="">Not set</option>${list.map(function (item) {
      return item.value === selected
        ? html`<option value="${item.value}" selected>${item.label}</option>`
        : html`<option value="${item.value}">${item.label}</option>`;
    })}`;
  }

  function wholeNumber(text) { return /^\d+$/.test(text.trim()) ? +text.trim() : NaN; }

  function sheetHtml(o) {
    const v = o.values;
    const editing = !!o.id;
    return html`<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-sheet="client">
      <form class="sheet__form" novalidate autocomplete="off" data-action="client.save">
        <header class="sheet__head">
          <h2 class="sheet__title" id="sheet-title">${editing ? 'Edit client' : 'New client'}</h2>
          <button class="btn btn--icon" type="button" aria-label="Close" data-action="overlay.close">${icons.icon('x')}</button>
        </header>
        <div class="sheet__body">
          <div class="sheet__notice" data-partial="notice" hidden></div>
          ${noteHtml(o)}
          <p class="field__error" data-partial="form-error" role="alert" hidden>${icons.icon('alert')}<span data-error-text></span></p>
          <div class="fields">
            ${c.field({
              id: 'f-name', label: 'Full name', required: true,
              control: html`<input class="input" id="f-name" name="name" type="text" dir="auto" autocomplete="off" autocapitalize="words" value="${v.name}">`
            })}
            ${c.field({
              id: 'f-phone', label: 'Phone', hintName: 'whatsapp', hint: whatsappLine(v.phone, o.settings),
              control: html`<input class="input" id="f-phone" name="phone" type="tel" autocomplete="off" value="${v.phone}">`
            })}
            ${c.field({
              id: 'f-email', label: 'Email',
              control: html`<input class="input" id="f-email" name="email" type="email" dir="auto" autocomplete="off" autocapitalize="none" spellcheck="false" value="${v.email}">`
            })}
            <div class="fields fields--2">
              ${c.field({
                id: 'f-hair', label: 'Hair colour',
                control: html`<select class="input" id="f-hair" name="hairColor">${options(schema.lists.hairColor, v.hairColor)}</select>`
              })}
              ${c.field({
                id: 'f-thick', label: 'Hair thickness',
                control: html`<select class="input" id="f-thick" name="hairThickness">${options(schema.lists.hairThickness, v.hairThickness)}</select>`
              })}
            </div>
            ${c.field({
              id: 'f-notes', label: 'Special notes', hint: 'Shown in yellow on the client page.',
              control: html`<textarea class="input input--area" id="f-notes" name="notes" dir="auto" rows="3">${v.notes}</textarea>`
            })}
            ${sinceHtml(v, o.today)}
            <details class="more" data-key="client-more"${(v.intervalWeeks || v.priorSessions || v.priorPaid) ? html` open` : ''}>
              <summary class="more__toggle">More${icons.icon('chevron')}</summary>
              <div class="fields more__fields">
                ${c.field({
                  id: 'f-weeks', label: 'Weeks between sessions', extra: 'field--short',
                  hint: 'Leave empty for the usual ' + o.settings.rebookWeeks + ' weeks.',
                  control: html`<input class="input num" id="f-weeks" name="intervalWeeks" type="text" inputmode="numeric" autocomplete="off" value="${v.intervalWeeks}">`
                })}
                ${c.field({
                  id: 'f-prior', label: 'Sessions done before using Laser', extra: 'field--short',
                  control: html`<input class="input num" id="f-prior" name="priorSessions" type="text" inputmode="numeric" autocomplete="off" value="${v.priorSessions}">`
                })}
                ${c.field({
                  id: 'f-priorpaid', label: 'Paid in total before using Laser', extra: 'field--short',
                  control: html`<input class="input num" id="f-priorpaid" name="priorPaid" type="text" inputmode="decimal" autocomplete="off" value="${v.priorPaid}">`
                })}
              </div>
            </details>
          </div>
          ${editing ? html`<div class="sheet__end">
            <button class="btn btn--ghost-danger" type="button" data-action="client.delete" data-id="${o.id}">Delete client</button>
          </div>` : ''}
        </div>
        <footer class="sheet__foot">
          <button class="btn btn--ghost" type="button" data-action="overlay.close">Cancel</button>
          ${editing ? '' : html`<button class="btn btn--secondary sheet__alt" type="button" data-action="client.saveAgain">Save and add another</button>`}
          <button class="btn btn--primary" type="submit">Save</button>
        </footer>
      </form>
    </section>`;
  }

  // ---- opening and closing ---------------------------------------------------------------

  // show(id, options) draws the form. -> false when the id names no client.
  //   options.fresh      do not look for a draft
  //   options.since      the "Client since" choice a new form starts with
  //   options.savedName  the client that was just saved ("Save and add another")
  //   options.again      the form replaces itself, so the focus still returns to its opener
  function show(id, options) {
    const o = options || {};
    const state = store.get();
    let person = null;
    if (id) {
      person = selectors.person(state, id);
      if (!person || !selectors.isClient(person)) return false;
    }
    const base = baseValues(person, state, o.since);
    const draft = o.fresh ? null : store.drafts.find(SHEET, id);
    const values = draft ? draftValues(draft.values, base) : base;
    open = { id: id || null, base: base, saved: false };
    overlay.sheet(sheetHtml({
      id: id || null,
      values: values,
      restored: !!draft && differs(values, base),
      savedName: o.savedName || null,
      settings: state.settings,
      today: dates.today()
    }), {
      key: key(id),
      onRequestClose: router.closeSheet,
      holdsInput: holdsInput,
      focus: '#f-name',
      keepOpener: !!o.again
    });
    return true;
  }

  // dismiss() takes the form off the screen. Unsaved typing is kept as a draft and the
  // toast offers to reopen it. The shell calls this when the address no longer names the sheet.
  function dismiss() {
    const was = open;
    let kept = false;
    if (was && !was.saved && formEl()) {
      saveDraftSoon.cancel();
      const values = read();
      if (differs(values, was.base)) {
        store.drafts.save(SHEET, was.id, values);
        kept = true;
      } else if (store.drafts.find(SHEET, was.id)) {
        store.drafts.discard();
      }
    }
    open = null;
    overlay.remove();
    if (kept) {
      overlay.toast('Not saved.', {
        action: { label: 'Reopen', run: function () { router.openSheet(SHEET, was.id); } }
      });
    }
  }

  // refresh() is called when another tab changed the data. A form in which nothing was
  // typed is drawn again from the record as it is now, so a later save cannot put old
  // values back; a form whose client is gone closes. A form with typing is left alone
  // (that tab is out of date, and says so).
  function refresh() {
    if (!open || open.saved || !formEl() || holdsInput()) return;
    const state = store.get();
    if (!open.id) return;
    const person = selectors.person(state, open.id);
    if (!person) {
      finish();
      overlay.toast('That record was not found.');
    } else if (differs(baseValues(person, state), open.base)) {
      show(open.id, { fresh: true, again: true });
    }
  }

  // The form is done with (saved or deleted): no draft, no "Not saved" toast.
  function finish() {
    saveDraftSoon.cancel();
    store.drafts.discard();
    if (open) open.saved = true;
    router.closeSheet();
  }

  // ---- checks ----------------------------------------------------------------------------

  function checkField(name, values, today) {
    if (name === 'name') return schema.check.personName(values.name.trim());
    if (name === 'phone') return schema.check.phone(values.phone.trim());
    if (name === 'email') return schema.check.email(values.email.trim());
    if (name === 'notes') return schema.check.notes(values.notes.trim());
    if (name === 'intervalWeeks') {
      if (values.intervalWeeks.trim() === '') return null;
      return schema.check.intervalWeeks(wholeNumber(values.intervalWeeks)) ? 'Use a number from 1 to 26' : null;
    }
    if (name === 'priorSessions') {
      if (values.priorSessions.trim() === '') return null;
      return schema.check.priorSessions(wholeNumber(values.priorSessions)) ? 'Use a number from 0 to 999' : null;
    }
    if (name === 'priorPaid') {
      return money.parse(values.priorPaid, store.get().settings.currencyDecimals).error;
    }
    if (values.since !== 'earlier') return null;
    const el = input('sinceDate');
    if (el && el.validity && el.validity.badInput) return 'Enter a valid date';
    return values.sinceDate ? schema.check.clientSince(values.sinceDate, today) : null;
  }

  function formError(message) {
    const line = formEl().querySelector('[data-partial="form-error"]');
    line.querySelector('[data-error-text]').textContent = message || '';
    line.hidden = !message;
  }

  // Shows what the save itself refused (3.3): under its field when it is about this
  // client, otherwise as one line at the top of the form.
  function showRefusal(errors, personId) {
    const first = errors[0];
    if (!first) return;
    const field = first.field === 'clientSince' ? 'sinceDate' : first.field;
    if (first.collection === 'people' && first.id === personId && INPUTS[field]) {
      c.setError(input(field), first.message);
      input(field).focus();
    } else {
      formError(first.text);
    }
  }

  // ---- save ------------------------------------------------------------------------------

  function save(again) {
    if (!open || !formEl()) return;
    const state = store.get();
    const id = open.id;
    if (id && !selectors.person(state, id)) {
      finish();
      overlay.toast('That record was not found.');
      return;
    }
    const values = read();
    const today = dates.today();
    formError(null);
    let firstBad = null;
    ORDER.forEach(function (name) {
      const message = checkField(name, values, today);
      c.setError(input(name), message);
      if (message && !firstBad) firstBad = name;
    });
    if (firstBad) {
      const hidden = input(firstBad).closest('details');
      if (hidden) hidden.open = true;
      input(firstBad).focus();
      return;
    }
    const record = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      clientSince: schema.clientSince.fromChoice(
        values.since, values.since === 'earlier' ? values.sinceDate : '', state, today),
      hairColor: values.hairColor || null,
      hairThickness: values.hairThickness || null,
      notes: values.notes.trim(),
      intervalWeeks: values.intervalWeeks.trim() === '' ? null : wholeNumber(values.intervalWeeks),
      priorSessions: values.priorSessions.trim() === '' ? 0 : wholeNumber(values.priorSessions),
      priorPaidMinor: money.parse(values.priorPaid, state.settings.currencyDecimals).minor || 0
    };
    let savedId = id;
    const result = store.commit(id ? 'Client changed' : 'Client added', function (draft, ctx) {
      if (id) {
        const person = draft.people.find(function (p) { return p.id === id; });
        if (!person) return;
        Object.assign(person, record);
        ctx.touch(person);
      } else {
        const person = schema.newPerson(record, { now: ctx.now });
        savedId = person.id;
        draft.people.push(person);
      }
    });
    if (!result.ok) {
      // out of date, or an earlier save failed: the red banner at the top of the form says so
      if (result.reason === 'invalid') showRefusal(result.errors, savedId);
      else formEl().querySelector('.sheet__body').scrollTop = 0;
      return;
    }
    if (again && !id && result.saved) {
      saveDraftSoon.cancel();
      store.drafts.discard();
      show(null, { fresh: true, since: values.since, savedName: record.name, again: true });
      return;
    }
    finish();
    if (result.saved) overlay.toast('Saved');
  }

  // ---- delete ----------------------------------------------------------------------------

  // Deletes at once and offers Undo (7.4). A client's appointments and payments go with
  // them in the same save (4.8 rule 7), so the data always stays whole.
  function deleteClient(id) {
    const person = id ? selectors.person(store.get(), id) : null;
    if (!person) {
      overlay.toast('That record was not found.');
      return;
    }
    const name = person.name;
    const result = store.commit(DELETED, function (draft, ctx) {
      const found = draft.people.find(function (p) { return p.id === id; });
      if (!found) return;
      schema.markDeleted(found, ctx.now);
      draft.appointments.concat(draft.payments).forEach(function (record) {
        if (record.personId === id && record.deletedAt === null) schema.markDeleted(record, ctx.now);
      });
    });
    if (!L.ui.shell.explain(result)) return;      // out of date or not saved: the banner says so
    if (open && open.id === id) finish();
    const route = router.current();
    if (route.name === 'clients' && route.sub === id) router.go(router.href('/clients'), { replace: true });
    overlay.toast(html`<bdi>${name}</bdi> was deleted.`, {
      undoOf: DELETED,
      action: { label: 'Undo', run: function () { store.undo(); } }
    });
  }

  // ---- while typing ----------------------------------------------------------------------

  function onInput(form, event) {
    const target = event.target;
    if (!open || !target || !target.name) return;
    if (target.name === 'phone') {
      c.setText(form.querySelector('[data-partial="whatsapp"]'),
        whatsappLine(target.value, store.get().settings));
    }
    // a field that shows a message is checked again as it is corrected
    const name = target.name === 'since' ? 'sinceDate' : target.name;
    if (INPUTS[name] && input(name).getAttribute('aria-invalid') === 'true') {
      c.setError(input(name), checkField(name, read(), dates.today()));
    }
    saveDraftSoon();
  }

  function onChange(form, event) {
    const target = event.target;
    if (!open || !target) return;
    if (target.name === 'since') {
      form.querySelector('[data-partial="since-date"]').hidden = target.value !== 'earlier';
      if (target.value !== 'earlier') c.setError(input('sinceDate'), null);
    }
    saveDraftSoon();
  }

  function discardDraft() {
    if (!open) return;
    saveDraftSoon.cancel();
    store.drafts.discard();
    show(open.id, { fresh: true, again: true });
  }

  actions.on('client.save', function () { save(false); });
  actions.on('client.saveAgain', function () { save(true); });
  actions.on('input:client.save', onInput);
  actions.on('change:client.save', onChange);
  actions.on('client.discardDraft', discardDraft);
  actions.on('client.edit', function (el) { router.openSheet(SHEET, el.getAttribute('data-id')); });
  actions.on('client.delete', function (el) { deleteClient(el.getAttribute('data-id')); });

  L.forms.personForm = {
    key: key,
    open: show,
    dismiss: dismiss,
    flush: flush,
    refresh: refresh,
    isOpen: function () { return open !== null; },
    holdsInput: holdsInput,
    whatsappLine: whatsappLine
  };
})(window.Laser);

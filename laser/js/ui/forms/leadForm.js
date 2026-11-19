// js/ui/forms/leadForm.js
// The lead form: someone who asked about laser and is not a client yet.
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const dates = L.core.dates;
  const schema = L.core.schema;
  const store = L.core.store;
  const selectors = L.core.selectors;
  const practice = L.core.practice;
  const c = L.ui.components;
  const parts = L.ui.parts;
  const overlay = L.ui.overlay;
  const actions = L.ui.actions;

  let openId = null;
  let isOpen = false;

  function el(id) { return document.getElementById(id); }

  function show(id) {
    const state = store.get();
    const lead = id ? selectors.person(state, id) : null;
    if (id && (!lead || !selectors.isLead(lead))) { overlay.toast('That record was not found.'); return; }
    const v = lead || { name: '', phone: '', leadInterest: '', notes: '', followUpOn: null };
    openId = lead ? lead.id : null;
    isOpen = true;
    parts.sheet({
      name: 'lead', title: lead ? 'Edit lead' : 'New lead', action: 'lead.save', focus: '#l-name',
      body: html`
        ${c.field({ id: 'l-name', label: 'Name', required: true,
          control: html`<input class="input" id="l-name" type="text" dir="auto" autocomplete="off" autocapitalize="words" value="${v.name}">` })}
        ${c.field({ id: 'l-phone', label: 'Phone',
          control: html`<input class="input" id="l-phone" type="tel" autocomplete="off" value="${v.phone}">` })}
        ${c.field({ id: 'l-interest', label: 'Interested in', hint: 'For example: legs and underarms.',
          control: html`<input class="input" id="l-interest" type="text" dir="auto" autocomplete="off" value="${v.leadInterest}">` })}
        ${c.field({ id: 'l-follow', label: 'Follow up on', hint: 'Leave empty for no follow-up date.',
          control: html`<input class="input" id="l-follow" type="date" value="${v.followUpOn || ''}">` })}
        ${c.field({ id: 'l-notes', label: 'Note',
          control: html`<textarea class="input input--area" id="l-notes" dir="auto" rows="3">${v.notes}</textarea>` })}`,
      end: lead ? html`<button class="btn btn--ghost-danger" type="button" data-action="lead.delete" data-id="${lead.id}">Delete lead</button>` : ''
    });
  }

  function save() {
    if (!isOpen) return;
    const name = el('l-name').value;
    const phone = el('l-phone').value;
    const interest = el('l-interest').value;
    const follow = el('l-follow').value;
    const checks = [
      [el('l-name'), schema.check.personName(name.trim())],
      [el('l-phone'), schema.check.phone(phone.trim())],
      [el('l-interest'), schema.check.leadInterest(interest.trim())],
      [el('l-follow'), follow === '' || dates.isDate(follow) ? null : 'Enter a valid date'],
      [el('l-notes'), schema.check.notes(el('l-notes').value.trim())]
    ];
    let bad = null;
    checks.forEach(function (pair) {
      c.setError(pair[0], pair[1]);
      if (pair[1] && !bad) bad = pair[0];
    });
    if (bad) { bad.focus(); return; }
    const result = practice.saveLead({
      id: openId, name: name, phone: phone, leadInterest: interest, notes: el('l-notes').value, followUpOn: follow
    });
    if (parts.done(result, 'Saved')) isOpen = false;
  }

  function remove(id) {
    const lead = selectors.person(store.get(), id);
    if (!lead) return;
    const name = lead.name;
    if (!parts.undoable(practice.deletePerson(id), html`<bdi>${name}</bdi> was deleted.`, 'Deleted')) return;
    if (isOpen) { isOpen = false; overlay.remove(); }
  }

  actions.on('lead.save', save);
  actions.on('lead.new', function () { show(null); });
  actions.on('lead.edit', function (b) { show(b.getAttribute('data-id')); });
  actions.on('lead.delete', function (b) { remove(b.getAttribute('data-id')); });

  L.forms.leadForm = { open: show };
})(window.Laser);

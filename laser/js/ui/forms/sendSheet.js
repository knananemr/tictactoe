// js/ui/forms/sendSheet.js
// The message sheet: the prepared text (it can be changed before sending) and the ways to
// send it. Laser writes the message and opens WhatsApp, SMS or email with it; the owner
// presses send there. Choosing a way also notes in the app that the message went out.
//   kind 'before' | 'sameDay'  a reminder for an appointment
//   kind 'rebook'              asking a client for their next session (the 4-week rule)
//   kind 'lead'                a first message to a lead
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const links = L.core.links;
  const phone = L.core.phone;
  const store = L.core.store;
  const selectors = L.core.selectors;
  const practice = L.core.practice;
  const icons = L.ui.icons;
  const overlay = L.ui.overlay;
  const actions = L.ui.actions;

  const TITLES = {
    before: 'Appointment reminder', sameDay: 'Reminder for today',
    rebook: 'Ask to book the next session', lead: 'Message to a lead'
  };

  let open = null;   // { kind, personId, appointmentId }

  function show(o) {
    const state = store.get();
    const person = selectors.person(state, o.personId);
    const a = o.appointmentId ? practice.appointment(state, o.appointmentId) : null;
    if (!person || (o.appointmentId && !a)) { overlay.toast('That record was not found.'); return; }
    const settings = state.settings;
    const text = practice.message(state, o.kind, person, a);
    const intl = phone.toInternational(person.phone, settings.countryCode);
    const hasPhone = phone.digits(person.phone) !== '';
    let to = 'No phone number saved for this person.';
    if (intl) to = 'To: ' + phone.display(intl, settings.countryCode);
    else if (hasPhone) to = 'To: ' + person.phone + (settings.countryCode === '' ? ' (add your country code in Settings to use WhatsApp)' : '');

    function way(key, label, icon, enabled) {
      return enabled
        ? html`<button class="btn btn--secondary btn--block" type="button" data-action="send.go" data-way="${key}">${icons.icon(icon)}${label}</button>`
        : html`<button class="btn btn--secondary btn--block" type="button" disabled>${icons.icon(icon)}${label}</button>`;
    }

    open = { kind: o.kind, personId: person.id, appointmentId: a ? a.id : null };
    overlay.sheet(html`<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-sheet="send">
      <form class="sheet__form" novalidate data-action="send.form">
      <header class="sheet__head">
        <h2 class="sheet__title" id="sheet-title">${TITLES[o.kind]}</h2>
        <button class="btn btn--icon" type="button" aria-label="Close" data-action="overlay.close">${icons.icon('x')}</button>
      </header>
      <div class="sheet__body">
        <div class="sheet__notice" data-partial="notice" hidden></div>
        <div class="fields">
          <div class="field">
            <label class="field__label" for="m-text">Message to <bdi>${person.name}</bdi></label>
            <textarea class="input input--area" id="m-text" dir="auto" rows="7">${text}</textarea>
            <p class="field__hint" data-send="to">${to}</p>
          </div>
          <div class="send-ways">
            ${way('whatsapp', 'WhatsApp', 'chat', !!intl)}
            ${way('sms', 'Text message', 'phone', hasPhone)}
            ${way('email', 'Email', 'mail', !!links.mailto(person.email))}
            ${way('copy', 'Copy the text', 'copy', true)}
          </div>
          <p class="field__hint">Laser prepares the message and opens the app you choose. You press send there.</p>
        </div>
      </div>
      <footer class="sheet__foot">
        <button class="btn btn--ghost" type="button" data-action="overlay.close">Cancel</button>
        <button class="btn btn--secondary" type="button" data-action="send.go" data-way="none">Mark as done</button>
      </footer>
      </form>
    </section>`, { key: 'send', focus: '#m-text' });
  }

  function mark(way) {
    const channel = way === 'none' ? null : way;
    if (open.kind === 'rebook') return practice.markAsked(open.personId);
    if (open.kind === 'lead') {
      const person = selectors.person(store.get(), open.personId);
      return practice.markContacted(open.personId, person ? person.followUpOn : null);
    }
    return practice.markReminder(open.appointmentId, open.kind, channel);
  }

  actions.on('send.go', function (button) {
    if (!open) return;
    const way = button.getAttribute('data-way');
    const state = store.get();
    const person = selectors.person(state, open.personId);
    const text = document.getElementById('m-text').value;
    if (!person) { overlay.remove(); return; }
    let href = null;
    if (way === 'whatsapp') href = links.whatsapp(person.phone, text, state.settings);
    if (way === 'sms') href = links.sms(person.phone, text, state.settings);
    if (way === 'email') href = links.mailto(person.email, '', text);
    if (way !== 'copy' && way !== 'none' && !href) {
      overlay.toast('Could not prepare the link. Use Copy the text.');
      return;
    }
    if (!L.ui.shell.explain(mark(way))) return;
    open = null;
    overlay.remove();
    if (way === 'copy') {
      L.ui.files.copy(text).then(function (ok) { overlay.toast(ok ? 'Text copied. Marked as done.' : 'Marked as done.'); });
    } else if (way === 'none') {
      overlay.toast('Marked as done.', { tone: 'done' });
    } else if (links.opensNewTab(href)) {
      window.open(href, '_blank', 'noopener');
    } else {
      window.location.href = href;
    }
  });

  actions.on('send.open', function (button) {
    show({
      kind: button.getAttribute('data-kind'),
      personId: button.getAttribute('data-person'),
      appointmentId: button.getAttribute('data-id')
    });
  });

  L.forms.sendSheet = { open: show };
})(window.Laser);

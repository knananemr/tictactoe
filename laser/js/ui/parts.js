// js/ui/parts.js
// Pieces shared by the screens: money and date words, tabs, tiles, the standard form sheet,
// and the one row used for an appointment wherever it is listed.
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const dates = L.core.dates;
  const money = L.core.money;
  const practice = L.core.practice;
  const store = L.core.store;
  const c = L.ui.components;
  const icons = L.ui.icons;
  const overlay = L.ui.overlay;
  const router = L.ui.router;

  function cash(minor, state) { return money.format(minor, state.settings, { short: true }); }

  // dayWords('2026-11-19', today) -> "Today", "Tomorrow", "Yesterday" or "Thu 19 Nov"
  function dayWords(date, today) {
    const diff = dates.diffDays(today, date);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return dates.format(date, 'short');
  }

  // the same inside a sentence: "today", "tomorrow", "Thu 19 Nov"
  function dayInSentence(date, today) {
    const words = dayWords(date, today);
    return /^(Today|Tomorrow|Yesterday)$/.test(words) ? words.toLowerCase() : words;
  }

  function clientHref(id) { return router.href('/clients/' + id); }

  // tabs({ label, current, items: [{ key, label, href, count }] })
  function tabs(o) {
    return html`<nav class="tabs" aria-label="${o.label}">${o.items.map(function (item) {
      const inner = html`${item.label}${item.count ? html`<span class="tabs__count">${item.count}</span>` : ''}`;
      return item.key === o.current
        ? html`<a class="tabs__item" href="${item.href}" aria-current="page" data-tab="${item.key}">${inner}</a>`
        : html`<a class="tabs__item" href="${item.href}" data-tab="${item.key}">${inner}</a>`;
    })}</nav>`;
  }

  // tiles([{ label, value, note, key }])
  function tiles(items) {
    return html`<div class="tiles">${items.map(function (t) {
      return html`<div class="tile" data-tile="${t.key || ''}">
        <span class="tile__label">${t.label}</span>
        <span class="tile__value">${t.value}</span>
        ${t.note ? html`<span class="tile__note">${t.note}</span>` : ''}
      </div>`;
    })}</div>`;
  }

  // list(rows, emptyText) -> a flush card body: the rows, or one quiet line
  function list(rows, emptyText) {
    return rows.length ? html`<ul class="rows">${rows}</ul>` : html`<p class="quiet">${emptyText}</p>`;
  }

  // ---- the standard form sheet -----------------------------------------------------------

  // sheet({ name, title, action, body, end, saveLabel, alt, focus })
  //   body   SafeHtml of the fields      end   SafeHtml under the fields (a Delete button)
  //   alt    SafeHtml of one more footer button
  function sheet(o) {
    overlay.sheet(html`<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-sheet="${o.name}">
      <form class="sheet__form" novalidate autocomplete="off" data-action="${o.action}">
        <header class="sheet__head">
          <h2 class="sheet__title" id="sheet-title">${o.title}</h2>
          <button class="btn btn--icon" type="button" aria-label="Close" data-action="overlay.close">${icons.icon('x')}</button>
        </header>
        <div class="sheet__body">
          <div class="sheet__notice" data-partial="notice" hidden></div>
          <p class="field__error" data-partial="form-error" role="alert" hidden>${icons.icon('alert')}<span data-error-text></span></p>
          <div class="fields">${o.body}</div>
          ${o.end ? html`<div class="sheet__end">${o.end}</div>` : ''}
        </div>
        <footer class="sheet__foot">
          <button class="btn btn--ghost" type="button" data-action="overlay.close">Cancel</button>
          ${o.alt || ''}
          <button class="btn btn--primary" type="submit">${o.saveLabel || 'Save'}</button>
        </footer>
      </form>
    </section>`, { key: o.name, focus: o.focus });
  }

  function sheetForm() { return document.querySelector('#overlay-root form'); }

  // formError('...') shows one line at the top of the open sheet; null hides it
  function formError(message) {
    const form = sheetForm();
    const line = form ? form.querySelector('[data-partial="form-error"]') : null;
    if (!line) return;
    line.querySelector('[data-error-text]').textContent = message || '';
    line.hidden = !message;
  }

  // done(result, words) closes the sheet after a save that went through and says so.
  // -> true when it did. A refused save shows why at the top of the form.
  function done(result, words) {
    if (!result.ok) {
      if (result.reason === 'invalid' && result.errors.length) formError(result.errors[0].text);
      const body = document.querySelector('#overlay-root .sheet__body');
      if (body) body.scrollTop = 0;
      return false;
    }
    overlay.remove();
    if (result.saved && words) overlay.toast(words, { tone: 'done' });
    return true;
  }

  // undoable(result, words, label) -> a toast with Undo for a change made outside a form
  function undoable(result, words, label) {
    if (!L.ui.shell.explain(result)) return false;
    overlay.toast(words, { undoOf: label, action: { label: 'Undo', run: function () { store.undo(); } } });
    return true;
  }

  // ---- the appointment row ---------------------------------------------------------------

  const STATUS = {
    booked: { tone: 'info', word: 'Booked' },
    done: { tone: 'done', word: 'Done' },
    cancelled: { tone: 'neutral', word: 'Cancelled' },
    noShow: { tone: 'neutral', word: 'No-show' }
  };

  // appointmentRow({ appointment, person }, state, today, { showName, showDay })
  function appointmentRow(row, state, today, options) {
    const o = options || {};
    const a = row.appointment;
    const person = row.person;
    const late = a.status === 'booked' && a.date < today;
    const status = late ? { tone: 'urgent', word: 'No outcome' } : STATUS[a.status];
    const paid = a.status === 'done' ? practice.paidFor(state, a.id) : null;
    const when = [];
    if (o.showDay !== false) when.push(dayWords(a.date, today));
    if (a.time) when.push(a.time);
    const title = o.showName === false ? when.join(', ') : person.name;
    const sub = o.showName === false ? (a.notes || '') : when.join(', ');
    const items = [];
    if (a.status === 'booked') {
      items.push({ label: 'Move to another day', action: 'session.move' });
      if (a.date <= today) items.push({ label: 'No-show', action: 'session.noShow' });
      items.push({ label: 'Cancel appointment', action: 'session.cancel' });
    } else if (a.status === 'done') {
      items.push({ label: 'Edit', action: 'session.edit' });
    }
    items.push({ label: 'Delete', action: 'session.delete', danger: true });
    return html`<li class="row" data-row="${a.id}"${late ? html` data-tone="urgent"` : ''}>
      <a class="row__title" href="${clientHref(person.id)}" dir="auto">${title}</a>
      ${sub ? html`<div class="row__sub"><span class="row__fact" dir="auto">${sub}</span></div>` : ''}
      ${c.badge(status.tone, status.word, { solid: late })}
      ${paid !== null ? html`<span class="row__amount">${cash(paid, state)}</span>` : ''}
      <div class="row__actions">
        ${a.status === 'booked' && a.date <= today
          ? html`<button class="btn btn--primary" type="button" data-action="session.finish" data-id="${a.id}">Finish</button>` : ''}
        ${c.menu({ label: 'More for this appointment', id: a.id, items: items })}
      </div>
    </li>`;
  }

  L.ui.parts = {
    cash: cash,
    dayWords: dayWords,
    dayInSentence: dayInSentence,
    clientHref: clientHref,
    tabs: tabs,
    tiles: tiles,
    list: list,
    sheet: sheet,
    sheetForm: sheetForm,
    formError: formError,
    done: done,
    undoable: undoable,
    appointmentRow: appointmentRow
  };
})(window.Laser);

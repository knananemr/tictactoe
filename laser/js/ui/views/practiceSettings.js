// js/ui/views/practiceSettings.js
// Two cards of Settings: "Sessions and reminders" (usual price, weeks between sessions,
// when clients are reminded) and "Message texts" (the four prepared messages).
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const money = L.core.money;
  const schema = L.core.schema;
  const store = L.core.store;
  const c = L.ui.components;
  const overlay = L.ui.overlay;
  const actions = L.ui.actions;

  const TEXTS = [
    { key: 'before', label: 'Reminder before an appointment', hint: 'You can use {name}, {date} and {time}.' },
    { key: 'sameDay', label: 'Reminder on the day', hint: 'You can use {name} and {time}.' },
    { key: 'rebook', label: 'Asking for the next session', hint: 'You can use {name} and {weeks}.' },
    { key: 'lead', label: 'First message to a lead', hint: 'You can use {name}.' }
  ];

  function save(label, mutator) {
    const result = store.commit(label, mutator);
    if (L.ui.shell.explain(result) && result.saved) overlay.toast('Saved');
    return result;
  }

  function choices(list, selected) {
    return list.map(function (item) {
      return item[0] === selected
        ? html`<option value="${item[0]}" selected>${item[1]}</option>`
        : html`<option value="${item[0]}">${item[1]}</option>`;
    });
  }

  function pricesCard(state) {
    const s = state.settings;
    const price = s.usualPriceMinor === null ? '' : money.formatNumber(s.usualPriceMinor, s.currencyDecimals, { short: true });
    return c.card({
      id: 'settings-sessions', title: 'Sessions and reminders',
      body: html`<div class="fields">
        ${c.field({
          id: 's-price', label: 'Usual price of a session', extra: 'field--short',
          hint: 'Filled in for you when you add a treatment. Leave empty for none.',
          control: html`<input class="input num" id="s-price" type="text" inputmode="decimal" autocomplete="off" value="${price}" data-action="settings.price">`
        })}
        ${c.field({
          id: 's-weeks', label: 'Weeks between sessions', extra: 'field--short',
          hint: 'After this many weeks a client is listed under Ask to rebook.',
          control: html`<input class="input num" id="s-weeks" type="text" inputmode="numeric" autocomplete="off" value="${s.rebookWeeks}" data-action="settings.weeks">`
        })}
        ${c.field({
          id: 's-remind', label: 'Remind clients before an appointment',
          control: html`<select class="input" id="s-remind" data-action="settings.remind">${choices(
            [[0, 'Off'], [1, '1 day before'], [2, '2 days before'], [3, '3 days before'], [7, '1 week before']], s.reminderDaysBefore)}</select>`
        })}
        ${c.field({
          id: 's-sameday', label: 'Remind clients on the day itself',
          control: html`<select class="input" id="s-sameday" data-action="settings.sameDay">${choices(
            [[0, 'Off'], [2, 'On']], s.sameDayHoursBefore > 0 ? 2 : 0)}</select>`
        })}
      </div>`
    });
  }

  function textsCard(state) {
    const t = state.settings.templates;
    return c.card({
      id: 'settings-texts', title: 'Message texts',
      body: html`<div class="fields">${TEXTS.map(function (item) {
        return html`<div class="field">
          <label class="field__label" for="${'t-' + item.key}">${item.label}</label>
          <textarea class="input input--area" id="${'t-' + item.key}" dir="auto" rows="4" data-action="settings.text" data-key="${item.key}">${t[item.key]}</textarea>
          <p class="field__error" id="${'t-' + item.key + '-error'}" hidden><span data-error-text></span></p>
          <p class="field__hint">${item.hint} <button class="link" type="button" data-action="settings.textReset" data-key="${item.key}">Reset to the original text</button></p>
        </div>`;
      })}</div>`
    });
  }

  actions.on('change:settings.price', function (input) {
    const parsed = money.parse(input.value, store.get().settings.currencyDecimals);
    c.setError(input, parsed.error);
    if (parsed.error || parsed.minor === store.get().settings.usualPriceMinor) return;
    save('Usual price changed', function (draft) { draft.settings.usualPriceMinor = parsed.minor; });
  });

  actions.on('change:settings.weeks', function (input) {
    const value = /^\d+$/.test(input.value.trim()) ? +input.value.trim() : NaN;
    const message = schema.check.rebookWeeks(value) ? 'Use a number from 1 to 26' : null;
    c.setError(input, message);
    if (message || value === store.get().settings.rebookWeeks) return;
    save('Weeks between sessions changed', function (draft) { draft.settings.rebookWeeks = value; });
  });

  actions.on('change:settings.remind', function (select) {
    const value = +select.value;
    if (schema.check.reminderDaysBefore(value) || value === store.get().settings.reminderDaysBefore) return;
    save('Reminder days changed', function (draft) { draft.settings.reminderDaysBefore = value; });
  });

  actions.on('change:settings.sameDay', function (select) {
    const value = +select.value;
    if (schema.check.sameDayHoursBefore(value)) return;
    save('Same-day reminder changed', function (draft) { draft.settings.sameDayHoursBefore = value; });
  });

  actions.on('change:settings.text', function (area) {
    const key = area.getAttribute('data-key');
    const text = area.value.trim();
    const message = text === '' ? 'Write a message, or reset to the original text' : schema.check.template(text);
    c.setError(area, message);
    if (message || text === store.get().settings.templates[key]) return;
    save('Message text changed', function (draft) { draft.settings.templates[key] = text; });
  });

  actions.on('settings.textReset', function (button) {
    const key = button.getAttribute('data-key');
    const result = save('Message text reset', function (draft) { draft.settings.templates[key] = schema.defaultTemplates[key]; });
    const area = document.getElementById('t-' + key);
    if (result.ok && area) { area.value = schema.defaultTemplates[key]; c.setError(area, null); }
  });

  L.views.practiceSettings = { pricesCard: pricesCard, textsCard: textsCard };
})(window.Laser);

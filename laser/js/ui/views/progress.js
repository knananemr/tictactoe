// js/ui/views/progress.js
// Progress: this month in four figures, twelve months of money received as a chart, the
// same months as a table, and (optionally) how much to set aside to invest.
(function (L) {
  'use strict';

  const html = L.core.util.html;
  const dates = L.core.dates;
  const schema = L.core.schema;
  const store = L.core.store;
  const practice = L.core.practice;
  const c = L.ui.components;
  const parts = L.ui.parts;
  const actions = L.ui.actions;

  const W = 720, H = 220, TOP = 28, BOTTOM = 26;

  // The bars are drawn as SVG with plain attributes (the page allows no inline styles).
  function chart(months, state, thisMonth) {
    const max = Math.max.apply(null, months.map(function (m) { return m.receivedMinor; }).concat([1]));
    const best = months.reduce(function (a, m) { return m.receivedMinor > a.receivedMinor ? m : a; }, months[0]);
    const slot = W / months.length;
    const barW = Math.round(slot * 0.6);
    const bars = months.map(function (m, i) {
      const h = Math.round(Math.max(0, m.receivedMinor) / max * (H - TOP - BOTTOM));
      const x = Math.round(i * slot + (slot - barW) / 2);
      const y = H - BOTTOM - h;
      const cls = m.key === thisMonth ? 'chart__bar chart__bar--now' : 'chart__bar';
      const mid = Math.round(i * slot + slot / 2);
      return html`<g>
        <rect class="${cls}" x="${x}" y="${y}" width="${barW}" height="${Math.max(h, 2)}" rx="4"></rect>
        ${m.receivedMinor > 0 ? html`<text class="chart__value" x="${mid}" y="${y - 8}" text-anchor="middle">${parts.cash(m.receivedMinor, state)}${m === best ? ' ★' : ''}</text>` : ''}
        <text class="chart__label" x="${mid}" y="${H - 6}" text-anchor="middle">${dates.format(m.key, 'monthShort')}</text>
      </g>`;
    });
    const summary = 'Money received in the last 12 months. Best month: ' + dates.format(best.key, 'month') +
      ', ' + parts.cash(best.receivedMinor, state) + '.';
    return html`<svg class="chart" viewBox="${'0 0 ' + W + ' ' + H}" role="img" aria-label="${summary}">${bars}</svg>`;
  }

  function change(now, before, state) {
    if (before <= 0) return '';
    const diff = now - before;
    if (diff === 0) return 'Same as the month before';
    return (diff > 0 ? 'Up ' : 'Down ') + parts.cash(Math.abs(diff), state) + ' on the month before';
  }

  function render(state) {
    const today = dates.today();
    const thisMonth = dates.monthKey(today);
    const months = practice.months(state, 12, today);
    const now = months[months.length - 1];
    const before = months[months.length - 2];
    const year = today.slice(0, 4);
    const yearTotal = months.filter(function (m) { return m.key.slice(0, 4) === year; })
      .reduce(function (sum, m) { return sum + m.receivedMinor; }, 0);
    const percent = state.settings.investPercent;
    const share = function (minor) { return Math.round(Math.max(0, minor) * percent / 100); };

    const rows = months.slice().reverse().map(function (m) {
      return html`<tr>
        <th scope="row">${dates.format(m.key, 'month')}${m.key === thisMonth ? html` <span class="muted">so far</span>` : ''}</th>
        <td class="num">${m.treatments}</td>
        <td class="num">${m.people}</td>
        <td class="num">${m.key < dates.monthKey(state.meta.startedOn) ? '–' : m.newClients}</td>
        <td class="num">${parts.cash(m.receivedMinor, state)}</td>
      </tr>`;
    });

    return html`<div class="page" data-view="progress">
      <h2 class="section-title">${dates.format(thisMonth, 'month')} so far</h2>
      ${parts.tiles([
        { key: 'received', label: 'Money received', value: parts.cash(now.receivedMinor, state), note: change(now.receivedMinor, before.receivedMinor, state) },
        { key: 'people', label: 'People treated', value: now.people, note: c.plural(now.treatments, 'treatment') },
        { key: 'new', label: 'New clients', value: now.newClients },
        { key: 'year', label: 'Received in ' + year, value: parts.cash(yearTotal, state) }
      ])}
      ${c.card({ title: 'Money received, month by month', body: chart(months, state, thisMonth) })}
      ${c.card({
        title: 'Set aside to invest',
        body: html`<div class="invest">
          ${c.field({
            id: 'p-invest', label: 'Percent of what you receive', extra: 'field--short',
            control: html`<input class="input num" id="p-invest" type="text" inputmode="numeric" autocomplete="off" value="${percent}" data-action="progress.invest">`
          })}
          ${percent > 0
            ? html`<p class="invest__line" data-invest="line">This month: <strong>${parts.cash(share(now.receivedMinor), state)}</strong>. This year: <strong>${parts.cash(share(yearTotal), state)}</strong>.</p>`
            : html`<p class="muted" data-invest="line">Type a percent, for example 20, to see how much to put aside each month.</p>`}
        </div>`
      })}
      ${c.card({
        title: 'Every month',
        body: html`<div class="table-wrap"><table class="table">
          <thead><tr><th scope="col">Month</th><th scope="col" class="num">Treatments</th><th scope="col" class="num">People treated</th><th scope="col" class="num">New clients</th><th scope="col" class="num">Money received</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`
      })}
    </div>`;
  }

  actions.on('change:progress.invest', function (input) {
    const value = input.value.trim() === '' ? 0 : Number(input.value.trim().replace('%', ''));
    const message = schema.check.investPercent(value) ? 'Use a whole number from 0 to 100' : null;
    c.setError(input, message);
    if (message || value === store.get().settings.investPercent) return;
    L.ui.shell.explain(store.commit('Invest percent changed', function (draft) { draft.settings.investPercent = value; }));
  });

  L.views.progress = { title: 'Progress', render: render };
})(window.Laser);

// js/ui/icons.js
// One inline SVG icon set (6.4). Each icon is only its paths; the size, the 1.75px line and
// the colour come from the class "icon" in base.css. No emoji anywhere.
(function (L) {
  'use strict';

  const html = L.core.util.html;

  const PATHS = {
    home: html`<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>`,
    calendar: html`<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>`,
    users: html`<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.1.8 3.5 2.8 3.5 5.7"/>`,
    leads: html`<circle cx="10" cy="8" r="3.5"/><path d="M3 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/><path d="M19 7v6M16 10h6"/>`,
    progress: html`<path d="M5 20v-8M12 20V5M19 20v-11"/><path d="M3 20h18"/>`,
    settings: html`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
    plus: html`<path d="M12 5v14M5 12h14"/>`,
    search: html`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`,
    phone: html`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`,
    chat: html`<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>`,
    mail: html`<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 7 9 6 9-6"/>`,
    copy: html`<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`,
    more: html`<circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/>`,
    x: html`<path d="M6 6l12 12M18 6 6 18"/>`,
    alert: html`<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.2v.3"/>`,
    dot: html`<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>`,
    check: html`<path d="m5 12.5 4.5 4.5L19 7.5"/>`,
    clock: html`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
    minus: html`<path d="M6 12h12"/>`,
    chevron: html`<path d="m6 9 6 6 6-6"/>`,
    download: html`<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>`
  };

  // The icon that goes with each status tone (5.1).
  const TONE = { urgent: 'alert', important: 'dot', done: 'check', info: 'clock', neutral: 'minus' };

  // icon('phone') -> SafeHtml of one <svg>. `extra` is a fixed class name such as
  // 'banner__icon'; it is never text the owner typed.
  const made = {};   // 'phone|' -> the SafeHtml made before (a list draws each icon many times)

  function icon(name, extra) {
    if (!PATHS[name]) throw new Error('Unknown icon: ' + name);
    const id = name + '|' + (extra || '');
    if (!made[id]) {
      const cls = extra ? 'icon ' + extra : 'icon';
      made[id] = html`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${PATHS[name]}</svg>`;
    }
    return made[id];
  }

  // toneIcon('urgent') -> the alert circle, and so on.
  function toneIcon(tone, extra) {
    return icon(TONE[tone] || 'minus', extra);
  }

  L.ui.icons = { icon: icon, toneIcon: toneIcon, names: Object.keys(PATHS) };
})(window.Laser);

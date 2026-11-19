// js/ui/components.js
// The small building blocks every view uses (6.4), each returning SafeHtml made with the
// html tag, and L.ui.mount: the only place in the app that writes markup into the page (2.6).
// The markup of each block is the one written at the top of its section in css/components.css.
(function (L) {
  'use strict';

  const util = L.core.util;
  const html = util.html;
  const icons = L.ui.icons;

  // mount(element, safeHtml) puts markup on the page. It refuses a plain string, so text
  // the owner typed can only arrive here after the html tag has escaped it.
  function mount(element, safeHtml) {
    if (!element) throw new Error('mount: there is no element to fill');
    if (!util.isSafeHtml(safeHtml)) throw new Error('mount needs the result of the html tag');
    element.innerHTML = safeHtml.toString();
  }

  // ---- badge -----------------------------------------------------------------------------

  // badge('done', 'Backed up today') ; badge('urgent', 'Overdue 5 d', { solid: true })
  function badge(tone, word, options) {
    const cls = options && options.solid ? 'badge badge--solid' : 'badge';
    return html`<span class="${cls}" data-tone="${tone}">${icons.toneIcon(tone)}${word}</span>`;
  }

  // ---- card ------------------------------------------------------------------------------

  // card({ title, meta, body, id, extra }) ; body is SafeHtml. extra: a fixed class name.
  function card(o) {
    const cls = o.extra ? 'card ' + o.extra : 'card';
    const head = o.title
      ? html`<header class="card__head"><h2 class="card__title">${o.title}</h2>${
        o.meta ? html`<span class="card__meta">${o.meta}</span>` : ''}</header>`
      : '';
    return o.id
      ? html`<section class="${cls}" id="${o.id}">${head}${o.body}</section>`
      : html`<section class="${cls}">${head}${o.body}</section>`;
  }

  // ---- summary strip (Home) --------------------------------------------------------------

  // summary([{ label, value, note, href, key }]) ; href comes from router.href.
  function summary(items) {
    return html`<nav class="summary" aria-label="Summary">${items.map(function (item) {
      return html`<a class="summary__item" href="${item.href}" data-summary="${item.key}">
        <span class="summary__label">${item.label}</span>
        <span class="summary__value">${item.value}</span>${
        item.note ? html`<span class="summary__note">${item.note}</span>` : ''}
      </a>`;
    })}</nav>`;
  }

  // ---- banner ----------------------------------------------------------------------------

  // banner({ tone, kind, text, buttons: [{ label, action }] })
  // tone: 'urgent' | 'important' | 'info'. kind: a fixed word tests can look for.
  function banner(o) {
    const role = o.tone === 'urgent' ? 'alert' : 'status';
    return html`<div class="banner" data-tone="${o.tone}" data-banner="${o.kind}" role="${role}">
      ${icons.toneIcon(o.tone, 'banner__icon')}
      <p class="banner__text">${o.text}</p>
      <div class="banner__actions">${o.buttons.map(function (b) {
        return html`<button class="btn" type="button" data-action="${b.action}">${b.label}</button>`;
      })}</div>
    </div>`;
  }

  // ---- empty state and placeholder page --------------------------------------------------

  // empty({ icon, title, text, note, actions }) ; text may be SafeHtml; actions is SafeHtml
  // of one or more buttons. Put the result inside a card.
  function empty(o) {
    return html`<div class="empty">
      <div class="empty__icon">${icons.icon(o.icon)}</div>
      <div class="empty__body">${
        o.title ? html`<h2 class="empty__title">${o.title}</h2>` : ''}
        <p class="empty__text">${o.text}</p>${
        o.note ? html`<p class="empty__note">${o.note}</p>` : ''}${
        o.actions ? html`<div class="actions">${o.actions}</div>` : ''}
      </div>
    </div>`;
  }

  // ---- form field ------------------------------------------------------------------------

  // field({ id, label, required, control, hint, hintName, extra })
  //   control   SafeHtml of the input or select; it must carry id="<id>"
  //   hint      text or SafeHtml under the control; hintName marks the line as
  //             data-partial="<hintName>" so the form can rewrite it while the owner types
  // The error line is always in the markup, hidden; setError shows it.
  function field(o) {
    const cls = o.extra ? 'field ' + o.extra : 'field';
    const errorId = o.id + '-error';
    const hasHint = o.hint !== undefined && o.hint !== null && o.hint !== '';
    let hint = '';
    if (o.hintName) {
      hint = hasHint
        ? html`<p class="field__hint" data-partial="${o.hintName}">${o.hint}</p>`
        : html`<p class="field__hint" data-partial="${o.hintName}" hidden></p>`;
    } else if (hasHint) {
      hint = html`<p class="field__hint">${o.hint}</p>`;
    }
    return html`<div class="${cls}">
      <label class="field__label" for="${o.id}">${o.label}${
        o.required ? html` <span class="field__req">required</span>` : ''}</label>
      ${o.control}
      <p class="field__error" id="${errorId}" hidden>${icons.icon('alert')}<span data-error-text></span></p>
      ${hint}
    </div>`;
  }

  // setError(input, 'Enter a name') shows the message under the field; setError(input, null)
  // clears it. Works on any control rendered through field().
  function setError(input, message) {
    if (!input) return;
    const line = input.id ? input.ownerDocument.getElementById(input.id + '-error') : null;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (line) {
        input.setAttribute('aria-describedby', line.id);
        line.querySelector('[data-error-text]').textContent = message;
        line.hidden = false;
      }
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      if (line) {
        line.hidden = true;
        line.querySelector('[data-error-text]').textContent = '';
      }
    }
  }

  // setText(element, 'WhatsApp will use ...') rewrites a small line in place and hides it
  // when there is nothing to say.
  function setText(element, text) {
    if (!element) return;
    element.textContent = text || '';
    element.hidden = !text;
  }

  // ---- chips (one choice) ----------------------------------------------------------------

  // chipOptions({ name, value, options: [{ value, label }] }) -> the labels inside .chips
  function chipOptions(o) {
    return html`<div class="chips">${o.options.map(function (opt) {
      const input = opt.value === o.value
        ? html`<input class="chip-option__input" type="radio" name="${o.name}" value="${opt.value}" checked>`
        : html`<input class="chip-option__input" type="radio" name="${o.name}" value="${opt.value}">`;
      return html`<label class="chip-option">${input}<span class="chip">${
        icons.icon('check', 'chip__check')}${opt.label}</span></label>`;
    })}</div>`;
  }

  // ---- segmented control (a setting) -----------------------------------------------------

  // segmented({ name, labelId, value, action, options: [{ value, label }] })
  function segmented(o) {
    return html`<div class="segmented" role="radiogroup" aria-labelledby="${o.labelId}">${
      o.options.map(function (opt) {
        const input = opt.value === o.value
          ? html`<input class="segmented__input" type="radio" name="${o.name}" value="${opt.value}" data-action="${o.action}" checked>`
          : html`<input class="segmented__input" type="radio" name="${o.name}" value="${opt.value}" data-action="${o.action}">`;
        return html`<label class="segmented__option">${input}<span class="segmented__item">${opt.label}</span></label>`;
      })}</div>`;
  }

  // ---- overflow menu (three dots) --------------------------------------------------------

  // menu({ label, id, items: [{ label, action, danger }] })
  // The menu is in the markup, hidden; menus.toggle opens it. No script places it.
  function menu(o) {
    return html`<div class="menu-wrap">
      <button class="btn btn--icon" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="${o.label}" data-action="menu.toggle" data-id="${o.id}">${icons.icon('more')}</button>
      <div class="menu" role="menu" hidden>${o.items.map(function (item) {
        const cls = item.danger ? 'menu__item menu__item--danger' : 'menu__item';
        return html`<button class="${cls}" type="button" role="menuitem" data-action="${item.action}" data-id="${o.id}">${item.label}</button>`;
      })}</div>
    </div>`;
  }

  const menus = {
    openWrap: function () {
      return document.querySelector('.menu-wrap > .menu:not([hidden])');
    },
    // Closes the open menu, if any. With refocus, focus goes back to its three-dots button.
    closeAll: function (refocus) {
      const open = menus.openWrap();
      if (!open) return false;
      const button = open.parentNode.querySelector('[aria-haspopup="menu"]');
      open.hidden = true;
      if (button) {
        button.setAttribute('aria-expanded', 'false');
        if (refocus) button.focus();
      }
      return true;
    },
    // The click handler of the three-dots button.
    toggle: function (button) {
      const panel = button.parentNode.querySelector('.menu');
      if (!panel) return;
      const wasOpen = !panel.hidden;
      menus.closeAll(false);
      if (wasOpen) return;
      panel.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      const first = panel.querySelector('[role="menuitem"]');
      if (first) first.focus();
    },
    // A click anywhere outside an open menu closes it.
    handleClick: function (event) {
      const open = menus.openWrap();
      if (open && !open.parentNode.contains(event.target)) menus.closeAll(false);
    },
    // Esc closes; the arrow keys move between the items. Returns true when the key was used.
    handleKey: function (event) {
      const open = menus.openWrap();
      if (!open) return false;
      if (event.key === 'Escape') {
        menus.closeAll(true);
        return true;
      }
      if (event.key === 'Tab') {
        menus.closeAll(false);
        return false;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const items = Array.prototype.slice.call(open.querySelectorAll('[role="menuitem"]'));
        if (!items.length) return false;
        let index = items.indexOf(document.activeElement);
        index = event.key === 'ArrowDown' ? index + 1 : index - 1;
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;
        items[index].focus();
        return true;
      }
      return false;
    }
  };

  // ---- small helpers ---------------------------------------------------------------------

  // plural(2, 'client') -> '2 clients' ; plural(1, 'client') -> '1 client'
  function plural(n, word) {
    return n.toLocaleString('en') + ' ' + word + (n === 1 ? '' : 's');
  }

  // true when the element is drawn (not inside something hidden)
  function isShown(element) {
    return !!element && element.getClientRects().length > 0;
  }

  L.ui.mount = mount;
  L.ui.components = {
    mount: mount,
    badge: badge,
    card: card,
    summary: summary,
    banner: banner,
    empty: empty,
    field: field,
    setError: setError,
    setText: setText,
    chipOptions: chipOptions,
    segmented: segmented,
    menu: menu,
    menus: menus,
    plural: plural,
    isShown: isShown
  };
})(window.Laser);

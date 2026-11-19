// js/ui/shell.js
// The chrome around every view (7.1): navigation, banners, top bar, the place the view is
// drawn, and the rules for drawing again (2.6 "Rendering" and "Recalculation").
//
// A view is { title, render(state, route) -> SafeHtml } and may add
//   arrive(route)  called after it was drawn because the owner came to it
//   leave()        called when the owner goes to another view
// Views register themselves as Laser.views.<route name>.
(function (L) {
  'use strict';

  const util = L.core.util;
  const html = util.html;
  const dates = L.core.dates;
  const store = L.core.store;
  const selectors = L.core.selectors;
  const c = L.ui.components;
  const icons = L.ui.icons;
  const overlay = L.ui.overlay;
  const router = L.ui.router;
  const actions = L.ui.actions;

  const NAV = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'schedule', label: 'Schedule', icon: 'calendar' },
    { key: 'clients', label: 'Clients', icon: 'users' },
    { key: 'leads', label: 'Leads', icon: 'leads' },
    { key: 'progress', label: 'Progress', icon: 'progress' }
  ];
  const SETTINGS = { key: 'settings', label: 'Settings', icon: 'settings' };
  const TICK_MS = 60000;
  const PRESS_MAX_MS = 5000;

  const drawn = {};            // region name -> the markup last put there
  let hasSkeleton = false;
  let renderedSignature = null;
  let pressAt = null;          // when a mouse or finger press began, or null
  let renderWaiting = false;   // a draw is waiting for the press to end

  function app() { return document.getElementById('app'); }
  function region(name) { return app().querySelector('[data-region="' + name + '"]'); }

  function viewFor(route) { return L.views[route.name] || L.views.home; }

  // ---- pieces of chrome ------------------------------------------------------------------

  function navItem(item, active) {
    const href = router.href('/' + item.key);
    const inner = html`<span class="nav__icon">${icons.icon(item.icon)}</span><span class="nav__label">${item.label}</span>`;
    return active
      ? html`<a class="nav__item" href="${href}" data-nav="${item.key}" aria-current="page">${inner}</a>`
      : html`<a class="nav__item" href="${href}" data-nav="${item.key}">${inner}</a>`;
  }

  function navHtml(state, route) {
    const status = selectors.backupStatus(state).sidebarLine;
    return html`<div class="navbar__brand">
        <img class="navbar__logo" src="img/icon.svg" alt="" width="28" height="28">
        <span class="navbar__name">Laser</span>
      </div>
      <nav class="nav" aria-label="Main">${NAV.map(function (item) {
        return navItem(item, route.name === item.key);
      })}</nav>
      <div class="navbar__foot">
        <p class="navbar__status">${status}</p>
        ${navItem(SETTINGS, route.name === 'settings')}
      </div>`;
  }

  function skeletonHtml() {
    return html`<div class="shell">
      <button class="skip-link" type="button" data-action="nav.skip">Skip to content</button>
      <div class="navbar" data-region="nav"></div>
      <div class="shell__main">
        <div class="banners" data-region="banners"></div>
        <header class="topbar">
          <h1 class="topbar__title" tabindex="-1" data-region="title"></h1>
          <div class="topbar__actions">
            <button class="btn btn--primary topbar__new" type="button" data-action="client.new">${icons.icon('plus')}New</button>
            <a class="btn btn--icon topbar__gear" href="${router.href('/settings')}" aria-label="Settings">${icons.icon('settings')}</a>
          </div>
        </header>
        <main class="view" id="view" tabindex="-1" data-region="view"></main>
      </div>
      <button class="fab" type="button" aria-label="New client" data-action="client.new">${icons.icon('plus')}</button>
    </div>`;
  }

  // The banners of 5.4, in their fixed order: save failed or tab out of date (red), then
  // backup (yellow or red). `red` is the first kind alone; an open sheet repeats it.
  function banners(state, flags) {
    const list = [];
    let red = null;
    if (flags.stale) {
      red = c.banner({
        tone: 'urgent', kind: 'stale',
        text: 'This tab is out of date because the app was changed in another tab. What you typed is kept.',
        buttons: [{ label: 'Reload', action: 'tab.reload' }]
      });
    } else if (flags.saveFailed) {
      red = c.banner({
        tone: 'urgent', kind: 'saveFailed',
        text: 'Not saved. Your last change is only on this screen.',
        buttons: [{ label: 'Back up now', action: 'backup.now' }, { label: 'Try again', action: 'save.retry' }]
      });
    }
    if (red) list.push(red);
    const status = selectors.backupStatus(state);
    if (status.banner) {
      list.push(c.banner({
        tone: status.tone, kind: 'backup', text: status.banner,
        buttons: [{ label: 'Back up now', action: 'backup.now' }]
      }));
    }
    return { all: html`${list}`, red: red };
  }

  // The page shown instead of the app when the stored data cannot be opened (3.4).
  function blockedHtml(blocked) {
    const text = blocked.reason === 'newer'
      ? 'This copy of the app (version ' + blocked.appVersion + ', data format ' + blocked.dataFormat +
        ') is older than your data (format ' + blocked.storedFormat + '). Reload the page to get the newest app.'
      : 'Laser could not read the data saved in this browser. Your data is not lost: do not clear ' +
        'your browser data, and contact your builder.';
    return html`<div class="solo" data-blocked="${blocked.reason}"><section class="card">${c.empty({
      icon: 'alert', title: 'Laser', text: text,
      actions: html`<button class="btn btn--primary" type="button" data-action="blocked.backup">Save a backup of my data</button>`
    })}</section></div>`;
  }

  // ---- drawing ---------------------------------------------------------------------------

  // Puts markup in a region only when it differs from what is there, so a draw that
  // changes nothing leaves the focus, an open "More" and the scroll position alone.
  function put(name, element, safeHtml) {
    const text = safeHtml.toString();
    if (drawn[name] === text) return false;
    c.mount(element, safeHtml);
    drawn[name] = text;
    return true;
  }

  // mountPartial('list', safeHtml) draws one small region of the current view again (the
  // element marked data-partial="list") and nothing else: this is what typing in a search
  // box does (2.6 rendering rule 2). The next full draw then starts from scratch.
  function mountPartial(name, safeHtml) {
    const view = hasSkeleton ? region('view') : null;
    const slot = view ? view.querySelector('[data-partial="' + name + '"]') : null;
    if (!slot) return null;
    c.mount(slot, safeHtml);
    delete drawn.view;
    return slot;
  }

  // What has the focus inside a container, described so that it can be found again after
  // the container was drawn afresh.
  function describeFocus(container) {
    const el = document.activeElement;
    if (!el || el === document.body || !container.contains(el)) return null;
    const d = {
      id: el.id || null,
      action: el.getAttribute('data-action'),
      dataId: el.getAttribute('data-id'),
      name: el.getAttribute('name'),
      value: el.type === 'radio' ? el.value : null,
      start: null,
      end: null
    };
    try {
      if (typeof el.selectionStart === 'number') { d.start = el.selectionStart; d.end = el.selectionEnd; }
    } catch (e) { /* this kind of field has no caret to remember */ }
    return d;
  }

  function findAgain(d, container) {
    if (d.id) {
      const byId = document.getElementById(d.id);
      if (byId && container.contains(byId)) return byId;
    }
    if (d.name && d.value !== null) {
      const radios = container.querySelectorAll('input[type="radio"]');
      for (let i = 0; i < radios.length; i++) {
        if (radios[i].name === d.name && radios[i].value === d.value) return radios[i];
      }
    }
    if (d.action) {
      const all = container.querySelectorAll('[data-action]');
      for (let i = 0; i < all.length; i++) {
        if (all[i].getAttribute('data-action') === d.action &&
            all[i].getAttribute('data-id') === d.dataId) return all[i];
      }
    }
    return null;
  }

  function restoreFocus(d, container) {
    if (!d) return;
    const el = findAgain(d, container);
    if (!el || !c.isShown(el)) return;
    el.focus({ preventScroll: true });
    if (d.start !== null) {
      try { el.setSelectionRange(d.start, d.end); } catch (e) { /* not a text field */ }
    }
  }

  function openDetails(container) {
    const keys = [];
    const all = container.querySelectorAll('details[open][data-key]');
    for (let i = 0; i < all.length; i++) keys.push(all[i].getAttribute('data-key'));
    return keys;
  }

  function reopenDetails(keys, container) {
    if (!keys.length) return;
    const all = container.querySelectorAll('details[data-key]');
    for (let i = 0; i < all.length; i++) {
      if (keys.indexOf(all[i].getAttribute('data-key')) !== -1) all[i].open = true;
    }
  }

  function signature() {
    const state = store.get();
    return dates.today() + '|' + (state ? state.rev : '');
  }

  function renderBlocked(blocked) {
    hasSkeleton = false;
    Object.keys(drawn).forEach(function (name) { delete drawn[name]; });
    overlay.remove();
    overlay.hideToast();
    put('blocked', app(), blockedHtml(blocked));
  }

  function renderChrome(state, flags, route) {
    if (!hasSkeleton) {
      Object.keys(drawn).forEach(function (name) { delete drawn[name]; });
      c.mount(app(), skeletonHtml());
      hasSkeleton = true;
    }
    put('nav', region('nav'), navHtml(state, route));
    const b = banners(state, flags);
    put('banners', region('banners'), b.all);
    overlay.setNotice(b.red);
    const title = region('title');
    const view = viewFor(route);
    if (title.textContent !== view.title) title.textContent = view.title;
  }

  function renderView(state, route) {
    const container = region('view');
    const safe = viewFor(route).render(state, route);
    if (drawn.view === safe.toString()) return;
    const focus = describeFocus(container);
    const details = openDetails(container);
    put('view', container, safe);
    reopenDetails(details, container);
    restoreFocus(focus, container);
  }

  // render() draws the chrome and the current view from the current state.
  function render() {
    renderWaiting = false;
    const flags = store.flags();
    if (flags.blocked) {
      if (flags.blocked.reason !== 'erased') renderBlocked(flags.blocked);   // erased: the page reloads
      return;
    }
    const state = store.get();
    const route = router.current();
    renderChrome(state, flags, route);
    renderView(state, route);
    renderedSignature = signature();
  }

  // ---- when to draw again ----------------------------------------------------------------

  function pressing() {
    return pressAt !== null && (performance.now() - pressAt) < PRESS_MAX_MS;
  }

  // true while a field the owner types in has the focus
  function typingText() {
    const el = document.activeElement;
    if (!el || !app().contains(el)) return false;
    if (el.tagName === 'TEXTAREA') return true;
    return el.tagName === 'INPUT' && el.type !== 'radio' && el.type !== 'checkbox';
  }

  // true while any form field or the search box has the focus (2.6 "Recalculation")
  function typing() {
    const el = document.activeElement;
    return typingText() || (!!el && el.tagName === 'SELECT' && app().contains(el));
  }

  // Draws what is waiting, unless a press is still going on. While a field the owner types
  // in has the focus only the chrome is drawn; the view follows when the focus leaves the
  // field, so a field is never replaced under the owner's fingers.
  function renderIfWaiting() {
    if (!renderWaiting || pressing()) return;
    if (!typingText()) { render(); return; }
    const flags = store.flags();
    if (!flags.blocked) renderChrome(store.get(), flags, router.current());
  }

  // A field saves itself when the focus leaves it, that is, in the middle of the click or
  // the Tab that took the focus away, or when Enter is pressed in it. Drawing the view at
  // that moment would replace the button under the pointer (the click would be swallowed),
  // the control the focus is moving to (the focus would be lost) or the field itself. So a
  // change saved from a "change" event, or while a press is going on, is drawn a moment
  // later: once the press is over and the focus has arrived somewhere that is not a field.
  function requestRender() {
    if (pressing() || actions.running() === 'change') {
      renderWaiting = true;
      setTimeout(renderIfWaiting, 0);
      return;
    }
    render();
  }

  function pressStart() { pressAt = performance.now(); }

  function pressEnd() {
    if (pressAt === null) return;
    pressAt = null;
    if (renderWaiting) setTimeout(renderIfWaiting, 0);
  }

  // The automatic draws (2.6 "Recalculation"): on becoming visible, on focus, every minute,
  // and when another tab changed the data. Each obeys three guards: no sheet or modal is
  // open, no field has the focus, and something changed (the date or the data's revision).
  function automatic() {
    const flags = store.flags();
    if (flags.blocked) return;
    renderChrome(store.get(), flags, router.current());
    if (overlay.isOpen() || typing() || pressing()) return;
    if (signature() === renderedSignature) return;
    render();
  }

  function wake() {
    if (document.visibilityState === 'hidden') return;
    store.checkOtherTabs();      // a change made elsewhere arrives through onStore
    automatic();
  }

  function onStore(state, info) {
    overlay.expireUndo(store.flags().canUndo);
    if (info.type === 'external') {
      L.forms.personForm.refresh();   // an untouched form shows the record as it is now
      automatic();
      return;
    }
    requestRender();
  }

  // explain(result) says why a save outside a form changed nothing. A tab that is out of
  // date or a failed save already has its red banner; a refusal by the rules of 3.3 (which
  // means a fault in the stored data) is shown as it is. -> true when the save went through.
  function explain(result) {
    if (result.ok) return true;
    if (result.reason === 'invalid' && result.errors.length) overlay.toast(result.errors[0].text);
    return false;
  }

  // ---- routes ----------------------------------------------------------------------------

  // Opens or closes the sheet the address names. Runs on route changes only.
  function syncSheet(route) {
    if (!store.get() || store.flags().blocked) return;
    const form = L.forms.personForm;
    const want = route.query.sheet === 'client' ? form.key(route.query.id || null) : null;
    const have = overlay.kind() === 'sheet' ? overlay.key() : null;
    if (want === have) return;
    if (have) form.dismiss();
    if (!want) return;
    if (overlay.isOpen()) overlay.remove();     // a modal gives way to the sheet
    if (!form.open(route.query.id || null)) {
      overlay.toast('That record was not found.');
      router.closeSheet();
    }
  }

  function onRoute(route, previous) {
    c.menus.closeAll(false);
    if (overlay.kind() === 'modal') overlay.requestClose();   // a question does not follow the owner to another page
    const moved = !previous || previous.path !== route.path;
    if (previous && viewFor(previous) !== viewFor(route)) {
      const old = viewFor(previous);
      if (typeof old.leave === 'function') old.leave();
    }
    syncSheet(route);
    render();
    if (!moved || store.flags().blocked) return;
    const now = router.current();
    if (now.path !== route.path) return;        // the route moved on while this one was handled
    window.scrollTo(0, 0);
    const view = viewFor(now);
    if (typeof view.arrive === 'function') view.arrive(now);
    if (!overlay.isOpen()) {
      const title = region('title');
      if (title) title.focus({ preventScroll: true });
    }
  }

  // ---- start -----------------------------------------------------------------------------

  function registerActions() {
    actions.onClick(c.menus.handleClick);
    actions.onKey(c.menus.handleKey);
    actions.on('menu.toggle', function (el) { c.menus.toggle(el); });
    actions.on('nav.skip', function () {
      const view = region('view');
      if (view) view.focus();
    });
    actions.on('client.new', function () { router.openSheet('client', null); });
    // a row's name is a link that opens the edit form by itself; the name is registered so
    // that the focus can return to the row and tests can find it
    actions.on('client.open', function () {});
    actions.on('tab.reload', function () {
      L.forms.personForm.flush();
      window.location.reload();
    });
    actions.on('save.retry', function () {
      const result = store.retrySave();
      overlay.toast(result.saved ? 'Saved' : 'Not saved.');
    });
    actions.on('blocked.backup', function () {
      const text = store.rawText();
      if (text !== null) L.ui.files.download(L.core.backup.rawFile(text));
    });
  }

  // start() draws the app for the first time and begins listening. Called once at boot,
  // after store.init.
  function start() {
    registerActions();
    store.subscribe(onStore);
    const route = router.start(onRoute);
    render();
    if (!store.flags().blocked) {
      syncSheet(route);
      const view = viewFor(router.current());
      if (typeof view.arrive === 'function') view.arrive(router.current());
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') L.forms.personForm.flush();
      else wake();
    });
    window.addEventListener('focus', wake);
    window.addEventListener('pagehide', function () { L.forms.personForm.flush(); });
    window.addEventListener('blur', pressEnd);
    document.addEventListener('focusout', function () {
      if (renderWaiting) setTimeout(renderIfWaiting, 0);
    });
    ['pointerdown', 'mousedown'].forEach(function (type) {
      document.addEventListener(type, pressStart, true);
    });
    ['pointerup', 'pointercancel', 'mouseup'].forEach(function (type) {
      document.addEventListener(type, pressEnd, true);
    });
    setInterval(wake, TICK_MS);
  }

  L.ui.shell = {
    start: start,
    render: render,
    requestRender: requestRender,
    mountPartial: mountPartial,
    explain: explain
  };
})(window.Laser);

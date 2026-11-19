// js/ui/router.js
// Hash routes (2.6). The path picks the view; the query part of the hash opens a sheet,
// so the browser's Back button closes a sheet.
//
//   #/home                              Dashboard (default; unknown routes go here)
//   #/schedule, #/leads, #/progress     placeholder pages until their step
//   #/clients, #/clients/contacts       the client list
//   #/settings, #/settings/backup, #/settings/messages, #/settings/device
//   any of them + ?sheet=client          the New client form
//   any of them + ?sheet=client&id=ID    the Edit client form
//
// In-app addresses are built here and only here (href); addresses that leave the app
// (tel, WhatsApp, mail) are built only in core/links.js. A route is plain data:
//   { name, sub, parts, path, query, hash }
(function (L) {
  'use strict';

  // first part of the path -> the view that shows it (shell.js maps the name to a view)
  const NAMES = { home: true, schedule: true, clients: true, leads: true, progress: true, settings: true };
  // sheets that exist in this step. "new" is the New menu: while only one form exists,
  // it opens that form directly (7.9).
  const SHEETS = { client: 'client', new: 'client' };

  let current = null;
  let listener = null;
  let sheetPushed = false;   // the open sheet has the page under it as the previous history entry

  function decode(text) {
    try { return decodeURIComponent(text); } catch (e) { return text; }
  }

  // href('/clients', { sheet: 'client', id }) -> '#/clients?sheet=client&id=...'
  function href(path, query) {
    const parts = String(path || '/home').split('/').filter(Boolean).map(encodeURIComponent);
    let out = '#/' + parts.join('/');
    const pairs = [];
    Object.keys(query || {}).forEach(function (key) {
      const value = query[key];
      if (value === null || value === undefined || value === '') return;
      pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    });
    if (pairs.length) out += '?' + pairs.join('&');
    return out;
  }

  // parse('#/clients/contacts?sheet=client&id=abc') -> route
  function parse(hash) {
    let text = String(hash || '');
    if (text.charAt(0) === '#') text = text.slice(1);
    const mark = text.indexOf('?');
    const pathText = mark === -1 ? text : text.slice(0, mark);
    const queryText = mark === -1 ? '' : text.slice(mark + 1);
    let parts = pathText.split('/').filter(Boolean).map(decode);
    const query = {};
    if (parts.length && NAMES[parts[0]] === true) {
      queryText.split('&').forEach(function (pair) {
        if (!pair) return;
        const eq = pair.indexOf('=');
        const key = decode(eq === -1 ? pair : pair.slice(0, eq));
        const value = decode(eq === -1 ? '' : pair.slice(eq + 1).replace(/\+/g, ' '));
        if (key && value !== '') query[key] = value;
      });
    } else {
      parts = ['home'];
    }
    if (query.sheet !== undefined) {
      if (Object.prototype.hasOwnProperty.call(SHEETS, query.sheet)) {
        query.sheet = SHEETS[query.sheet];
      } else {
        delete query.sheet;
        delete query.id;
      }
    }
    const path = '/' + parts.join('/');
    return {
      name: parts[0],
      sub: parts.length > 1 ? parts[1] : null,
      parts: parts,
      path: path,
      query: query,
      hash: href(path, query)
    };
  }

  function set(next) {
    const previous = current;
    current = next;
    if (listener) listener(current, previous);
  }

  // true when `next` is a sheet opened over the view the owner is on: the entry before it
  // in the history is then that same view, and closing the sheet is one step back.
  function opensOver(next) {
    return !!next.query.sheet && !!current && !current.query.sheet && current.path === next.path;
  }

  function onHashChange() {
    const next = parse(window.location.hash);
    if (current && next.hash === current.hash) return;
    sheetPushed = opensOver(next);
    set(next);
  }

  // start(fn) reads the address, begins listening and returns the first route.
  // fn(route, previousRoute) runs on every later change.
  function start(fn) {
    listener = fn;
    current = parse(window.location.hash);
    sheetPushed = false;
    window.addEventListener('hashchange', onHashChange);
    return current;
  }

  // go('#/clients') moves to a route. { replace: true } does not add a history entry.
  // The listener runs before go returns.
  function go(target, options) {
    const next = parse(target);
    if (current && next.hash === current.hash) return;
    const replace = !!(options && options.replace);
    if (replace) {
      window.location.replace(next.hash);
      if (!next.query.sheet) sheetPushed = false;
    } else {
      sheetPushed = opensOver(next);
      window.location.hash = next.hash;
    }
    set(next);
  }

  // The address of a sheet over the current view.
  function sheetHref(name, id) {
    const query = Object.assign({}, current ? current.query : {});
    delete query.sheet;
    delete query.id;
    query.sheet = name;
    if (id) query.id = id;
    return href(current ? current.path : '/home', query);
  }

  function openSheet(name, id) { go(sheetHref(name, id)); }

  // closeSheet() takes the sheet out of the address. When the sheet was opened from a page
  // of the app this is one step back in the history, so Back never lands on a closed form.
  function closeSheet() {
    if (!current || !current.query.sheet) return;
    const query = Object.assign({}, current.query);
    delete query.sheet;
    delete query.id;
    const next = parse(href(current.path, query));
    if (sheetPushed) {
      sheetPushed = false;
      set(next);
      window.history.back();
      // If there was no entry to go back to, the address still names the sheet: correct it.
      window.setTimeout(function () {
        if (current === next && parse(window.location.hash).hash !== next.hash) {
          window.location.replace(next.hash);
        }
      }, 400);
    } else {
      window.location.replace(next.hash);
      set(next);
    }
  }

  L.ui.router = {
    start: start,
    go: go,
    href: href,
    parse: parse,
    current: function () { return current; },
    sheetHref: sheetHref,
    openSheet: openSheet,
    closeSheet: closeSheet
  };
})(window.Laser);

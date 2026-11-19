// js/ui/actions.js
// The data-action registry and the delegated listeners (2.6). One listener each for click,
// input, change, submit and keydown sits on the page; no element has a handler of its own.
//
//   <button data-action="client.delete" data-id="...">   actions.on('client.delete', fn)
//   <form data-action="client.save">                     actions.on('client.save', fn)   (submit)
//   <input data-action="clients.search">                 actions.on('input:clients.search', fn)
//   <select data-action="settings.currency">             actions.on('change:settings.currency', fn)
//
// A handler is called as fn(element, event), where element is the one carrying data-action.
// A name with no prefix answers a click (or, on a form, its submit). "input:" and "change:"
// answer those events, also when they come from a field inside a form that carries the name.
(function (L) {
  'use strict';

  const handlers = {};      // 'click:client.delete' -> fn
  const clickHooks = [];    // called for every click, before the action
  const keyHooks = [];      // called for every keydown until one returns true
  let lastTrigger = null;   // { action, id } of the last element whose action ran on a click
  let running = null;       // the kind of event whose handler is running now, or null
  let started = false;

  function run(type, fn, el, event) {
    const before = running;
    running = type;
    try { fn(el, event); } finally { running = before; }
  }

  function on(name, handler) {
    if (typeof handler !== 'function') throw new Error('actions.on needs a function');
    const colon = name.indexOf(':');
    const type = colon === -1 ? 'click' : name.slice(0, colon);
    const action = colon === -1 ? name : name.slice(colon + 1);
    if (type !== 'click' && type !== 'input' && type !== 'change') {
      throw new Error('Unknown event in action name: ' + name);
    }
    handlers[type + ':' + action] = handler;
  }

  function onClick(hook) { clickHooks.push(hook); }
  function onKey(hook) { keyHooks.push(hook); }

  function holder(event) {
    const target = event.target;
    return (target && typeof target.closest === 'function') ? target.closest('[data-action]') : null;
  }

  function isOff(el) {
    return el.disabled === true || el.getAttribute('aria-disabled') === 'true';
  }

  // A text field saves itself when the focus leaves it. Some browsers leave the focus in
  // the field when a button is tapped (an iPhone does), and the tap would then act on the
  // value from before the edit. So a press anywhere else first takes the focus out of the
  // field. Where the browser already did that, this changes nothing.
  function settleField(event) {
    if (!(event.detail > 0)) return;                 // a real press, not a key
    const field = document.activeElement;
    const target = event.target;
    if (!field || field === target || typeof field.blur !== 'function') return;
    const text = field.tagName === 'TEXTAREA' || (field.tagName === 'INPUT' &&
      ['radio', 'checkbox', 'button', 'submit', 'file'].indexOf(field.type) === -1);
    if (!text) return;
    const label = (target && typeof target.closest === 'function') ? target.closest('label') : null;
    if (label && label.control === field) return;
    field.blur();
  }

  function handleClick(event) {
    settleField(event);
    for (let i = 0; i < clickHooks.length; i++) clickHooks[i](event);
    const el = holder(event);
    if (!el || el.tagName === 'FORM' || isOff(el)) return;
    const name = el.getAttribute('data-action');
    lastTrigger = { action: name, id: el.getAttribute('data-id') };
    const fn = handlers['click:' + name];
    if (fn) run('click', fn, el, event);
  }

  function handleSubmit(event) {
    // every form in the app is saved by script; the browser never sends one anywhere
    event.preventDefault();
    const form = event.target;
    if (!form || typeof form.getAttribute !== 'function') return;
    const fn = handlers['click:' + form.getAttribute('data-action')];
    if (fn) run('submit', fn, form, event);
  }

  function handleField(type) {
    return function (event) {
      const el = holder(event);
      if (!el) return;
      const fn = handlers[type + ':' + el.getAttribute('data-action')];
      if (fn) run(type, fn, el, event);
    };
  }

  function handleKey(event) {
    for (let i = 0; i < keyHooks.length; i++) {
      if (keyHooks[i](event) === true) {
        event.preventDefault();
        return;
      }
    }
  }

  // start() attaches the five listeners. Called once at boot.
  function start() {
    if (started) return;
    started = true;
    document.addEventListener('click', handleClick);
    document.addEventListener('input', handleField('input'));
    document.addEventListener('change', handleField('change'));
    document.addEventListener('submit', handleSubmit);
    document.addEventListener('keydown', handleKey);
  }

  L.ui.actions = {
    on: on,
    onClick: onClick,
    onKey: onKey,
    start: start,
    // { action, id } of the element the owner last clicked: the sheet it opened gives the
    // focus back to it when it closes (2.6 rendering rule 4)
    lastTrigger: function () { return lastTrigger; },
    // 'click', 'submit', 'input' or 'change' while a handler of that event runs, else null
    running: function () { return running; }
  };
})(window.Laser);

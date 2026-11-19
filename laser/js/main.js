// js/main.js
// Boot. It holds no logic: it loads the data, starts the listeners and draws the app.
// The message "Laser did not start" is removed only after all of that worked; if any file
// failed to load, the owner reads the message instead of a blank page (2.3).
(function (L) {
  'use strict';

  L.core.store.init({ holdsInput: L.ui.overlay.holdsInput });
  L.ui.actions.start();
  L.ui.overlay.start();
  L.ui.shell.start();

  const message = document.getElementById('boot-fail');
  if (message && message.parentNode) message.parentNode.removeChild(message);
  document.getElementById('app').hidden = false;
})(window.Laser);

// js/ui/files.js
// Everything that hands a file or text to the device, or takes one from it (2.2):
// download, pick a file, copy to the clipboard. Step 1b adds the save picker, sharing
// and the probes.
(function (L) {
  'use strict';

  // download({ name, text, type }) saves a file through the browser's own download.
  // A download gives no signal, so the app cannot know whether the file was kept (3.6).
  function download(file) {
    const blob = new Blob([file.text], { type: file.type || 'application/json' });
    const address = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = address;
    link.download = file.name;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(address); }, 10000);
  }

  function readText(file) {
    if (typeof file.text === 'function') return file.text();
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result)); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsText(file);
    });
  }

  // pick() lets the owner choose one backup file.
  // -> Promise of { name, text }, or of null when the choice was cancelled or the file
  //    could not be read. Nothing is changed by picking.
  function pick() {
    return new Promise(function (resolve) {
      const old = document.querySelector('input[data-file-input]');
      if (old && old.parentNode) old.parentNode.removeChild(old);
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.hidden = true;
      input.setAttribute('data-file-input', '');
      input.setAttribute('aria-hidden', 'true');
      input.tabIndex = -1;
      let settled = false;
      function finish(value) {
        if (settled) return;
        settled = true;
        if (input.parentNode) input.parentNode.removeChild(input);
        resolve(value);
      }
      input.addEventListener('change', function () {
        const file = input.files && input.files[0];
        if (!file) { finish(null); return; }
        readText(file).then(
          function (text) { finish({ name: file.name, text: text }); },
          function () { finish(null); }
        );
      });
      input.addEventListener('cancel', function () { finish(null); });
      document.body.appendChild(input);
      input.click();
    });
  }

  // The fallback for a browser without the clipboard interface: a text area that is on the
  // page only for the moment of the copy.
  function copyByTextArea(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.className = 'sr-only';
    area.setAttribute('readonly', '');
    area.setAttribute('aria-hidden', 'true');
    document.body.appendChild(area);
    const active = document.activeElement;
    let ok = false;
    try {
      area.select();
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(area);
    if (active && typeof active.focus === 'function') active.focus();
    return ok;
  }

  // copy(text) -> Promise of true when the text is on the clipboard.
  function copy(text) {
    const value = String(text);
    const clip = navigator.clipboard;
    if (clip && typeof clip.writeText === 'function') {
      return clip.writeText(value).then(
        function () { return true; },
        function () { return copyByTextArea(value); }
      );
    }
    return Promise.resolve(copyByTextArea(value));
  }

  L.ui.files = { download: download, pick: pick, copy: copy };
})(window.Laser);

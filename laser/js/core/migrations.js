// js/core/migrations.js
// Ordered migrations (3.4). Version 1 is the first data format, so the list is empty.
// A migration is written only when a field is renamed, split or changes meaning:
// STEPS[1] turns a version 1 doc into version 2, and so on.
(function (L) {
  'use strict';

  const STEPS = {};

  function fail(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  // migrate(doc, options) -> a migrated copy; `doc` itself is never changed.
  // options.steps (default STEPS) and options.target (default Laser.DATA_FORMAT) exist so the
  // tests can inject a fake list.
  // Throws an Error with .code:
  //   'invalid'  schemaVersion is not a whole number of 1 or more
  //   'newer'    the doc is newer than this code
  //   'missing'  there is no step for one of the versions on the way
  function migrate(doc, options) {
    const steps = (options && options.steps) || STEPS;
    const target = (options && typeof options.target === 'number') ? options.target : L.DATA_FORMAT;
    let out = L.core.util.clone(doc);
    if (!out || typeof out !== 'object' || !Number.isInteger(out.schemaVersion) || out.schemaVersion < 1) {
      throw fail('invalid', 'The data has no usable format number.');
    }
    if (out.schemaVersion > target) {
      throw fail('newer', 'The data is newer than this copy of the app.');
    }
    while (out.schemaVersion < target) {
      const from = out.schemaVersion;
      const step = steps[from];
      if (typeof step !== 'function') {
        throw fail('missing', 'There is no update from data format ' + from + '.');
      }
      out = step(out) || out;
      out.schemaVersion = from + 1;
    }
    return out;
  }

  L.core.migrations = {
    STEPS: STEPS,
    migrate: migrate
  };
})(window.Laser);

// js/core/ns.js
// Creates the one global of the app. Every other file hangs its module on it.
(function () {
  'use strict';
  window.Laser = {
    APP_ID: 'laser-practice',
    VERSION: '0.1.0',      // shown in Settings; bumped every step
    STEP: '1',             // which build step this copy is: '1', '1b', '2' ... '9'
    DATA_FORMAT: 1,        // schemaVersion this code reads and writes
    STORE_NAME: 'laser',   // prefix of every storage key (3.1); the test page sets 'laser-test'
    core: {}, ui: {}, forms: {}, views: {}
  };
})();

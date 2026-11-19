// js/core/backup.js
// The backup file (3.6) and import (3.7): build the export text, read and check a file,
// load it, undo the load. Nothing here touches the page; downloading and picking a file
// are the UI's job.
(function (L) {
  'use strict';

  const util = L.core.util;
  const dates = L.core.dates;
  const schema = L.core.schema;
  const selectors = L.core.selectors;
  const store = L.core.store;

  const FILE_TYPE = 'application/json';
  const COUNT_KEYS = ['clients', 'leads', 'appointments', 'treatments', 'payments'];

  function clock(now) { return now instanceof Date ? now : dates.now(); }

  // fileName(now) -> 'laser-backup-YYYY-MM-DD-HHMM.json', in local time
  function fileName(now) {
    const at = clock(now);
    return 'laser-backup-' + dates.today(at) + '-' + dates.nowTime(at).replace(':', '') + '.json';
  }

  // buildFile(doc, now) -> { name, text, type }
  // text is the doc as stored plus the root fields exportedAt and appVersion, indented
  // with two spaces. Changes nothing. When the file really exists, call markSaved().
  function buildFile(doc, now) {
    const at = clock(now);
    const out = Object.assign({}, doc, { exportedAt: dates.stamp(at), appVersion: L.VERSION });
    return { name: fileName(at), text: JSON.stringify(out, null, 2), type: FILE_TYPE };
  }

  // rawFile(text, now) -> { name, text, type } with the stored text unchanged. For the
  // "Save a backup of my data" button of the "older than your data" page (3.4).
  function rawFile(text, now) {
    return { name: fileName(now), text: String(text), type: FILE_TYPE };
  }

  function rejected(code, message, errors, errorCount) {
    return {
      ok: false, code: code, message: message,
      errors: errors || [], errorCount: errorCount || 0
    };
  }

  // prepareImport(text) reads a backup file's text (3.7 steps 1 to 3). It changes nothing.
  //
  // A file that cannot be loaded:
  //   { ok: false, code, message, errors, errorCount }
  //   code     'notJson' | 'otherApp' | 'badVersion' | 'newer' | 'invalid'
  //   message  one sentence for the owner
  //   errors   for 'invalid': the first five faults, one sentence each; errorCount: how many
  //
  // A file that can be loaded:
  //   { ok: true, doc, repairs, exportedAt, savedOn, appVersion, counts, currentCounts }
  //   doc            the doc that applyImport would load
  //   repairs        small fixes that were made, one sentence each ([] for a clean file)
  //   exportedAt     the file's stamp, or null
  //   savedOn        the local day the file was saved ('YYYY-MM-DD'), or null
  //   counts         { people, clients, leads, appointments, treatments, payments } of the file
  //   currentCounts  the same for what is in this browser now (null when nothing is open)
  function prepareImport(text) {
    let parsed;
    try {
      parsed = JSON.parse(String(text).replace(/^﻿/, ''));
    } catch (e) {
      return rejected('notJson', 'This file is not a Laser backup. Nothing was changed.');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.app !== L.APP_ID) {
      return rejected('otherApp', 'This file is not a Laser backup. Nothing was changed.');
    }
    const version = parsed.schemaVersion;
    if (!Number.isInteger(version) || version < 1) {
      return rejected('badVersion', 'This backup has no data format number. Nothing was changed.');
    }
    if (version > L.DATA_FORMAT) {
      return rejected('newer', 'This backup comes from a newer version of the app.');
    }
    const exportedAt = dates.isStamp(parsed.exportedAt) ? parsed.exportedAt : null;
    const appVersion = typeof parsed.appVersion === 'string' ? parsed.appVersion : null;

    let doc;
    try {
      doc = L.core.migrations.migrate(parsed);
    } catch (e) {
      return rejected('badVersion', 'This backup could not be updated to the current data format. Nothing was changed.');
    }
    delete doc.exportedAt;     // the two fields of the file, not of the doc
    delete doc.appVersion;
    const repairs = schema.normalize(doc).repairs;
    const errors = schema.validate(doc);
    if (errors.length) {
      return rejected(
        'invalid',
        'This backup cannot be loaded. Nothing was changed.',
        errors.slice(0, 5).map(function (e) { return e.text; }),
        errors.length
      );
    }
    // things that describe the device, not the practice (3.7)
    doc.meta.homeDevice = null;
    doc.meta.reopenedAt = null;
    doc.meta.persist = null;

    const current = store.get();
    return {
      ok: true,
      doc: doc,
      repairs: repairs,
      exportedAt: exportedAt,
      savedOn: exportedAt ? dates.localDay(exportedAt) : null,
      appVersion: appVersion,
      counts: selectors.counts(doc),
      currentCounts: current ? selectors.counts(current) : null
    };
  }

  // applyImport(prepared) loads what prepareImport returned (3.7 step 5): keeps the current
  // doc as the one fallback copy, replaces the state, saves.
  // -> { ok, saved, reason, errors, rev, prevKept }
  //   the fields of store.commit's result, plus
  //   prevKept  true when the old data was kept and "Undo the last import" will work
  //             (false when the old data was too large for the fallback copy)
  function applyImport(prepared) {
    if (!prepared || prepared.ok !== true || !prepared.doc) {
      return { ok: false, saved: false, reason: 'invalid', errors: [], rev: null, prevKept: false };
    }
    const reason = store.refusal();
    if (reason) {
      const current = store.get();
      return { ok: false, saved: false, reason: reason, errors: [], rev: current ? current.rev : null, prevKept: false };
    }
    const kept = store.adapter().savePrev(JSON.stringify(store.get()));
    const doc = util.clone(prepared.doc);
    doc.meta.unsavedSince = null;
    doc.meta.backupCheckedAt = dates.stamp();   // loading a backup made by this app proves it reads
    const result = store.replace(doc, { label: 'Backup loaded' });
    if (!result.ok) store.adapter().clearPrev();   // nothing was loaded, so there is nothing to undo
    result.prevKept = result.ok && !!(kept && kept.ok);
    return result;
  }

  // canUndoImport() -> true while the data from before the last import is kept
  function canUndoImport() {
    return store.adapter().loadPrev() !== null;
  }

  // undoImport() brings back the data as it was before the last import and removes the kept
  // copy. Same result shape as store.commit; reason 'nothingToUndo' when no copy is kept,
  // 'invalid' when the copy cannot be read.
  function undoImport() {
    const current = store.get();
    const rev = current ? current.rev : null;
    const text = store.adapter().loadPrev();
    if (text === null || text === undefined) {
      return { ok: false, saved: false, reason: 'nothingToUndo', errors: [], rev: rev };
    }
    let doc;
    try {
      doc = L.core.migrations.migrate(JSON.parse(text));
    } catch (e) {
      return { ok: false, saved: false, reason: 'invalid', errors: [], rev: rev };
    }
    schema.normalize(doc);
    const result = store.replace(doc, { label: 'Import undone' });
    if (result.ok && result.saved) store.adapter().clearPrev();
    return result;
  }

  // checkFile(text) reads and validates a backup exactly as import would and compares its
  // counts with the current data, without changing anything (3.6 "Check your backup").
  //   not usable:  the same { ok: false, code, message, errors, errorCount } as prepareImport
  //   good:        { ok: true, counts, currentCounts, sameCounts, exportedAt, savedOn,
  //                  savedDaysAgo, repairs }
  //   sameCounts    the file holds as many clients, leads, appointments, treatments and
  //                 payments as this browser does now
  //   savedDaysAgo  calendar days since the file was saved (0 = today), or null
  // After a good check, call markChecked().
  function checkFile(text, now) {
    const prepared = prepareImport(text);
    if (!prepared.ok) return prepared;
    const current = prepared.currentCounts;
    const same = !!current && COUNT_KEYS.every(function (key) {
      return prepared.counts[key] === current[key];
    });
    return {
      ok: true,
      counts: prepared.counts,
      currentCounts: current,
      sameCounts: same,
      exportedAt: prepared.exportedAt,
      savedOn: prepared.savedOn,
      savedDaysAgo: prepared.savedOn ? Math.max(0, dates.diffDays(prepared.savedOn, dates.today(clock(now)))) : null,
      repairs: prepared.repairs
    };
  }

  // markSaved() records that a backup that counts was made (3.6): lastExportAt = now,
  // changesSinceExport = 0, unsavedSince = null. A bookkeeping commit. -> commit's result
  function markSaved() {
    return store.commit('Backup saved', function (draft, ctx) {
      draft.meta.lastExportAt = ctx.stamp;
      draft.meta.changesSinceExport = 0;
      draft.meta.unsavedSince = null;
    }, { undoable: false, countsAsChange: false });
  }

  // markChecked() records that a backup file was confirmed to exist and be readable.
  // A bookkeeping commit. -> commit's result
  function markChecked() {
    return store.commit('Backup checked', function (draft, ctx) {
      draft.meta.backupCheckedAt = ctx.stamp;
    }, { undoable: false, countsAsChange: false });
  }

  L.core.backup = {
    fileName: fileName,
    buildFile: buildFile,
    rawFile: rawFile,
    prepareImport: prepareImport,
    applyImport: applyImport,
    canUndoImport: canUndoImport,
    undoImport: undoImport,
    checkFile: checkFile,
    markSaved: markSaved,
    markChecked: markChecked
  };
})(window.Laser);

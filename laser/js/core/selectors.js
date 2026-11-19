// js/core/selectors.js
// Every derived value (4.9). Nothing here is stored; everything is worked out from the
// doc, so two screens can never disagree. Step 1: people, search, counts, backup status.
(function (L) {
  'use strict';

  const dates = L.core.dates;
  const DAY_MS = 86400000;

  let collator = null;

  function byName(a, b) {
    if (!collator) collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
    return collator.compare(a.name, b.name) || (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0);
  }

  function isLive(record) { return record.deletedAt === null; }

  // 4.9 rule 1
  function isClient(person) { return person.clientSince !== null; }
  function isLead(person) { return person.clientSince === null; }

  // clients(state) -> the live clients, sorted by name. A new array; the records are the
  // state's own, so treat them as read-only.
  function clients(state) {
    return state.people.filter(function (p) { return isLive(p) && isClient(p); }).sort(byName);
  }

  // person(state, id) -> the live person with that id, or null
  function person(state, id) {
    for (let i = 0; i < state.people.length; i++) {
      if (state.people[i].id === id) return isLive(state.people[i]) ? state.people[i] : null;
    }
    return null;
  }

  // search(people, query) -> the people that match (4.9 rule 24), in the order given.
  // A match is a case-insensitive part of the name or of the email; or, when the query holds
  // 3 or more digits, those digits appear in the digits of the phone. An empty query matches all.
  function search(people, query) {
    const q = String(query === null || query === undefined ? '' : query).trim().toLowerCase();
    if (q === '') return people.slice();
    const digits = q.replace(/\D/g, '');
    return people.filter(function (p) {
      if (p.name.toLowerCase().indexOf(q) !== -1) return true;
      if (p.email && p.email.toLowerCase().indexOf(q) !== -1) return true;
      return digits.length >= 3 && p.phone.replace(/\D/g, '').indexOf(digits) !== -1;
    });
  }

  // counts(doc) -> { people, clients, leads, appointments, treatments, payments }
  // Live records only. treatments = appointments marked Done.
  function counts(doc) {
    const out = { people: 0, clients: 0, leads: 0, appointments: 0, treatments: 0, payments: 0 };
    for (let i = 0; i < doc.people.length; i++) {
      const p = doc.people[i];
      if (!isLive(p)) continue;
      out.people++;
      if (isClient(p)) out.clients++; else out.leads++;
    }
    for (let i = 0; i < doc.appointments.length; i++) {
      const a = doc.appointments[i];
      if (!isLive(a)) continue;
      out.appointments++;
      if (a.status === 'done') out.treatments++;
    }
    for (let i = 0; i < doc.payments.length; i++) {
      if (isLive(doc.payments[i])) out.payments++;
    }
    return out;
  }

  function daysAgoWords(n) { return n === 1 ? '1 day ago' : n + ' days ago'; }

  // backupStatus(state, now) -> the backup nudge of 3.8 and the backup lines.
  //   level           'quiet' | 'important' | 'urgent'
  //   tone            null | 'important' | 'urgent'   (the banner's data-tone)
  //   days            whole days since the first change that is not in a backup (0 when none)
  //   banner          null, or the banner's sentence (its one button reads "Back up now")
  //   lastExportAt    stamp or null
  //   lastBackupDays  calendar days since the last backup, or null when there is none
  //   backedUpToday   true when the last backup was made today (green "Backed up today")
  //   minutesSinceBackup  whole minutes since the last backup, or null
  //   changes         meta.changesSinceExport
  //   checked         a backup file was checked (meta.backupCheckedAt is set)
  //   homeLine        "Backed up today" | "Last backup: 3 days ago" | "No backup yet"
  //   sidebarLine     "Backed up today" | "Backed up 3 days ago" | "No backup yet"
  //   settingsLine    "Last backup 3 days ago, 14 changes since" | "No backup yet"
  function backupStatus(state, now) {
    const at = now instanceof Date ? now : dates.now();
    const meta = state.meta;
    const today = dates.today(at);
    const hasRecords = state.people.length + state.appointments.length + state.payments.length > 0;

    let level = 'quiet';
    let days = 0;
    let banner = null;
    const since = dates.stampMs(meta.unsavedSince);
    if (hasRecords && !isNaN(since)) {
      days = Math.max(0, Math.floor((at.getTime() - since) / DAY_MS));
      if (days >= 30) {
        level = 'urgent';
        banner = 'No backup for ' + days + " days. If this browser's data is cleared, those changes are gone.";
      } else if (days >= 7) {
        level = 'important';
        banner = 'You have changes from the last ' + days + ' days that are not in a backup file.';
      }
    }

    const exported = dates.stampMs(meta.lastExportAt);
    let lastBackupDays = null;
    let minutesSinceBackup = null;
    if (!isNaN(exported)) {
      lastBackupDays = Math.max(0, dates.diffDays(dates.localDay(meta.lastExportAt), today));
      minutesSinceBackup = Math.max(0, Math.floor((at.getTime() - exported) / 60000));
    }
    const changes = meta.changesSinceExport;
    let homeLine = 'No backup yet';
    let sidebarLine = 'No backup yet';
    let settingsLine = 'No backup yet';
    if (lastBackupDays === 0) {
      homeLine = 'Backed up today';
      sidebarLine = 'Backed up today';
      settingsLine = 'Last backup today';
    } else if (lastBackupDays !== null) {
      homeLine = 'Last backup: ' + daysAgoWords(lastBackupDays);
      sidebarLine = 'Backed up ' + daysAgoWords(lastBackupDays);
      settingsLine = 'Last backup ' + daysAgoWords(lastBackupDays);
    }
    if (lastBackupDays !== null) {
      settingsLine += ', ' + changes + (changes === 1 ? ' change since' : ' changes since');
    }

    return {
      level: level,
      tone: level === 'quiet' ? null : level,
      days: days,
      banner: banner,
      lastExportAt: meta.lastExportAt,
      lastBackupDays: lastBackupDays,
      backedUpToday: lastBackupDays === 0,
      minutesSinceBackup: minutesSinceBackup,
      changes: changes,
      checked: meta.backupCheckedAt !== null,
      homeLine: homeLine,
      sidebarLine: sidebarLine,
      settingsLine: settingsLine
    };
  }

  // gettingStarted(state) -> what Home shows above the lists (3.9).
  //   showWelcome      the Welcome card is still due (none of its buttons was tapped)
  //   items            the checklist: [{ key: 'client' | 'backup', label, done, note }]
  //                    note is "Saved, not checked yet" while a backup exists but was not checked
  //   allDone          every item is ticked
  //   showChecklist    the Welcome card is gone and something is still open
  //   showCheckBackup  the "Check your backup" card applies (a backup was saved, none checked)
  function gettingStarted(state) {
    const meta = state.meta;
    let hasPerson = false;
    for (let i = 0; i < state.people.length; i++) {
      if (isLive(state.people[i])) { hasPerson = true; break; }
    }
    const saved = meta.lastExportAt !== null;
    const checked = meta.backupCheckedAt !== null;
    const items = [
      { key: 'client', label: 'Add your first client.', done: hasPerson, note: null },
      {
        key: 'backup', label: 'Save your first backup file and check it.', done: saved && checked,
        note: (saved && !checked) ? 'Saved, not checked yet' : null
      }
    ];
    const allDone = items.every(function (item) { return item.done; });
    return {
      showWelcome: !meta.welcomeDone,
      items: items,
      allDone: allDone,
      showChecklist: meta.welcomeDone && !allDone,
      showCheckBackup: saved && !checked
    };
  }

  L.core.selectors = {
    isLive: isLive,
    isClient: isClient,
    isLead: isLead,
    clients: clients,
    person: person,
    search: search,
    counts: counts,
    backupStatus: backupStatus,
    gettingStarted: gettingStarted
  };
})(window.Laser);

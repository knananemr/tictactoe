// js/core/practice.js
// The practice itself: treatments, money, bookings, the 4-week rule, leads and reminders.
// The first half works values out from the doc (nothing is stored twice); the second half
// holds the changes, each one a single store.commit so that Undo takes it back whole.
(function (L) {
  'use strict';

  const dates = L.core.dates;
  const schema = L.core.schema;
  const store = L.core.store;
  const sel = L.core.selectors;

  const LONG_GONE_DAYS = 84;   // overdue for longer than this: no longer on the To-do list

  function live(list) { return list.filter(sel.isLive); }

  function byWhen(a, b) {
    const x = a.date + ' ' + (a.time || '');
    const y = b.date + ' ' + (b.time || '');
    return x < y ? -1 : x > y ? 1 : 0;
  }

  // ---- index: everything worked out once per version of the doc --------------------------

  const cache = new WeakMap();

  function index(state) {
    const hit = cache.get(state);
    if (hit && hit.rev === state.rev) return hit;
    const people = new Map();
    const stats = new Map();
    live(state.people).forEach(function (p) {
      people.set(p.id, p);
      stats.set(p.id, {
        sessions: p.priorSessions, paidMinor: p.priorPaidMinor,
        lastVisit: null, lastTime: null, booked: []
      });
    });
    const paidFor = new Map();   // appointment id -> its payment
    live(state.payments).forEach(function (pay) {
      const s = stats.get(pay.personId);
      if (s) s.paidMinor += pay.amountMinor;
      if (pay.appointmentId) paidFor.set(pay.appointmentId, pay);
    });
    const appointments = live(state.appointments).filter(function (a) { return people.has(a.personId); });
    appointments.sort(byWhen);
    appointments.forEach(function (a) {
      const s = stats.get(a.personId);
      if (a.status === 'done') {
        s.sessions++;
        if (s.lastVisit === null || a.date >= s.lastVisit) s.lastVisit = a.date;
      } else if (a.status === 'booked') {
        s.booked.push(a);
      }
      if (a.time && (a.status === 'done' || a.status === 'booked')) s.lastTime = a.time;
    });
    const out = { rev: state.rev, people: people, stats: stats, paidFor: paidFor, appointments: appointments };
    cache.set(state, out);
    return out;
  }

  // ---- people ----------------------------------------------------------------------------

  function firstName(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }

  function weeksFor(person, settings) { return person.intervalWeeks || settings.rebookWeeks; }

  // stats(state, id) -> { sessions, paidMinor, lastVisit, lastTime, next }
  // next is the first booked appointment from today on, or null.
  function stats(state, id, today) {
    const s = index(state).stats.get(id);
    if (!s) return { sessions: 0, paidMinor: 0, lastVisit: null, lastTime: null, next: null };
    const day = today || dates.today();
    const next = s.booked.filter(function (a) { return a.date >= day; })[0] || null;
    return { sessions: s.sessions, paidMinor: s.paidMinor, lastVisit: s.lastVisit, lastTime: s.lastTime, next: next };
  }

  function paidFor(state, appointmentId) {
    const pay = index(state).paidFor.get(appointmentId);
    return pay ? pay.amountMinor : 0;
  }

  function appointment(state, id) {
    return index(state).appointments.find(function (a) { return a.id === id; }) || null;
  }

  // history(state, personId) -> that person's appointments, newest first
  function history(state, personId) {
    return index(state).appointments.filter(function (a) { return a.personId === personId; }).reverse();
  }

  function leads(state) {
    return live(state.people).filter(sel.isLead).sort(function (a, b) {
      return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
    });
  }

  // leadTone(person, today) -> { tone, word, open }
  function leadTone(person, today) {
    const day = today || dates.today();
    if (person.leadStatus === 'notInterested') return { tone: 'neutral', word: 'Not interested', open: false };
    if (person.leadStatus === 'contacted') {
      if (person.followUpOn && person.followUpOn < day) return { tone: 'urgent', word: 'Follow-up late', open: true };
      if (person.followUpOn === day) return { tone: 'important', word: 'Follow up today', open: true };
      return { tone: 'info', word: 'Contacted', open: true };
    }
    return { tone: 'important', word: 'New lead', open: true };
  }

  // ---- the schedule ----------------------------------------------------------------------

  function withPerson(state, list) {
    const people = index(state).people;
    return list.map(function (a) { return { appointment: a, person: people.get(a.personId) }; });
  }

  // onDay(state, day) -> every appointment of that day that still counts (not cancelled)
  function onDay(state, day) {
    return withPerson(state, index(state).appointments.filter(function (a) {
      return a.date === day && (a.status === 'booked' || a.status === 'done');
    }));
  }

  // upcoming(state, from, to) -> booked appointments from `from` up to and including `to`
  function upcoming(state, from, to) {
    return withPerson(state, index(state).appointments.filter(function (a) {
      return a.status === 'booked' && a.date >= from && (!to || a.date <= to);
    }));
  }

  // needsOutcome(state, today) -> booked appointments whose day has passed
  function needsOutcome(state, today) {
    return withPerson(state, index(state).appointments.filter(function (a) {
      return a.status === 'booked' && a.date < today;
    }));
  }

  // doneIn(state, monthKey) -> the treatments of that month, newest first, each with its money
  function doneIn(state, monthKey) {
    const ix = index(state);
    return withPerson(state, ix.appointments.filter(function (a) {
      return a.status === 'done' && dates.monthKey(a.date) === monthKey;
    }).reverse()).map(function (row) {
      row.paidMinor = paidFor(state, row.appointment.id);
      return row;
    });
  }

  // clash(state, date, time, exceptId) -> the first booked appointment within the usual
  // session length of that time, or null
  function clash(state, date, time, exceptId) {
    if (!date || !time) return null;
    const mins = function (t) { return (+t.slice(0, 2)) * 60 + (+t.slice(3, 5)); };
    const span = state.settings.sessionMinutes;
    const found = index(state).appointments.find(function (a) {
      return a.status === 'booked' && a.date === date && a.time && a.id !== exceptId &&
        Math.abs(mins(a.time) - mins(time)) < span;
    });
    return found ? withPerson(state, [found])[0] : null;
  }

  // ---- the 4-week rule -------------------------------------------------------------------

  // rebook(state, today) -> clients who should be asked for their next session:
  //   { person, lastVisit, dueOn, days, tone, word, asked, longGone }
  // Active clients with at least one treatment and nothing booked. Listed from a week
  // before the due day; red once the due day has passed; blue while an ask is waiting for
  // an answer; yellow again when the answer does not come.
  function rebook(state, today) {
    const day = today || dates.today();
    const ix = index(state);
    const s = state.settings;
    const out = [];
    ix.people.forEach(function (p) {
      if (!sel.isClient(p) || p.clientStatus !== 'active') return;
      const st = ix.stats.get(p.id);
      if (!st.lastVisit || st.booked.length) return;
      if (p.rebookSnoozeUntil && p.rebookSnoozeUntil > day) return;
      const dueOn = dates.addDays(st.lastVisit, weeksFor(p, s) * 7);
      const days = dates.diffDays(dueOn, day);            // > 0: overdue by that many days
      if (days < -s.rebookHeadsUpDays) return;
      const asked = (p.rebookAskedOn && p.rebookAskedOn >= st.lastVisit) ? p.rebookAskedOn : null;
      let tone = days > 0 ? 'urgent' : 'important';
      let word = days > 0 ? 'Overdue ' + days + ' d' : days === 0 ? 'Due today' : 'Due in ' + (-days) + ' d';
      if (asked) {
        const waited = dates.diffDays(asked, day);
        if (waited < s.askAgainDays) { tone = 'info'; word = waited === 0 ? 'Asked today' : 'Asked ' + waited + ' d ago'; }
        else { tone = 'important'; word = 'No answer ' + waited + ' d'; }
      }
      const longGone = days > LONG_GONE_DAYS;
      if (longGone) { tone = 'neutral'; word = 'Not seen for a while'; }
      out.push({ person: p, lastVisit: st.lastVisit, dueOn: dueOn, days: days, tone: tone, word: word, asked: asked, longGone: longGone });
    });
    const rank = { urgent: 0, important: 1, info: 2, neutral: 3 };
    return out.sort(function (a, b) { return rank[a.tone] - rank[b.tone] || b.days - a.days; });
  }

  // ---- client reminders ------------------------------------------------------------------

  function slotDone(slot, a) {
    return !!slot && slot.forDate === a.date && slot.forTime === a.time;
  }

  // reminders(state, now) -> the reminders that are ready to send:
  //   { appointment, person, kind: 'before' | 'sameDay', tone, word }
  // "before": from the chosen number of days before the appointment until the day before.
  // "sameDay": on the day itself, until the appointment starts.
  // An appointment booked inside the window gets no reminder for it.
  function reminders(state, now) {
    const at = now instanceof Date ? now : dates.now();
    const day = dates.today(at);
    const time = dates.nowTime(at);
    const s = state.settings;
    const out = [];
    upcoming(state, day, dates.addDays(day, 7)).forEach(function (row) {
      const a = row.appointment;
      if (!a.time) return;
      if (a.date === day) {
        if (s.sameDayHoursBefore > 0 && a.time > time && a.scheduledOn < a.date && !slotDone(a.reminderSameDay, a)) {
          out.push({ appointment: a, person: row.person, kind: 'sameDay', tone: 'important', word: 'Remind today' });
        }
        return;
      }
      const n = s.reminderDaysBefore;
      if (n > 0 && dates.addDays(a.date, -n) <= day && a.scheduledOn < dates.addDays(a.date, -n) &&
          !slotDone(a.reminderBefore, a)) {
        const late = dates.addDays(a.date, -1) === day && n > 1;
        out.push({ appointment: a, person: row.person, kind: 'before', tone: late ? 'urgent' : 'important', word: late ? 'Reminder late' : 'Reminder ready' });
      }
    });
    return out;
  }

  // fill('Hi {name}', { name: 'Dana' }) -> 'Hi Dana'. Unknown placeholders stay as typed.
  function fill(text, vars) {
    return String(text || '').replace(/\{(\w+)\}/g, function (whole, key) {
      return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : whole;
    });
  }

  // message(state, kind, person, appointment) -> the prepared text for
  // kind 'before' | 'sameDay' | 'rebook' | 'lead'
  function message(state, kind, person, a) {
    const s = state.settings;
    return fill(s.templates[kind], {
      name: firstName(person.name),
      date: a ? dates.format(a.date, 'long', s.messageLocale) : '',
      time: a && a.time ? a.time : '',
      weeks: weeksFor(person, s)
    });
  }

  // ---- months ----------------------------------------------------------------------------

  // month(state, 'YYYY-MM') -> { key, treatments, people, newClients, receivedMinor }
  function month(state, key) {
    const ix = index(state);
    const seen = new Set();
    let treatments = 0;
    ix.appointments.forEach(function (a) {
      if (a.status === 'done' && dates.monthKey(a.date) === key) { treatments++; seen.add(a.personId); }
    });
    let received = 0;
    live(state.payments).forEach(function (pay) {
      if (ix.people.has(pay.personId) && dates.monthKey(pay.paidOn) === key) received += pay.amountMinor;
    });
    let fresh = 0;
    ix.people.forEach(function (p) {
      if (sel.isClient(p) && p.clientSince >= state.meta.startedOn && dates.monthKey(p.clientSince) === key) fresh++;
    });
    return { key: key, treatments: treatments, people: seen.size, newClients: fresh, receivedMinor: received };
  }

  // months(state, count, today) -> the last `count` months, oldest first
  function months(state, count, today) {
    const thisMonth = dates.monthKey(today || dates.today());
    const out = [];
    for (let i = count - 1; i >= 0; i--) out.push(month(state, dates.addMonths(thisMonth, -i)));
    return out;
  }

  // receivedOn(state, day) -> money received that day
  function receivedOn(state, day) {
    let sum = 0;
    live(state.payments).forEach(function (pay) { if (pay.paidOn === day) sum += pay.amountMinor; });
    return sum;
  }

  function activeClients(state) {
    return sel.clients(state).filter(function (p) { return p.clientStatus === 'active'; });
  }

  // ---- changes ---------------------------------------------------------------------------

  function find(list, id) { return list.find(function (r) { return r.id === id && r.deletedAt === null; }) || null; }

  function clearRebook(person) {
    person.rebookAskedOn = null;
    person.rebookAsks = 0;
    person.rebookSnoozeUntil = null;
  }

  // Keeps the payment of an appointment in step with the amount typed for it.
  function syncPayment(draft, ctx, a, amountMinor) {
    const pay = draft.payments.find(function (p) { return p.appointmentId === a.id && p.deletedAt === null; });
    if (!amountMinor) {
      if (pay) schema.markDeleted(pay, ctx.now);
      return;
    }
    if (pay) {
      pay.amountMinor = amountMinor;
      pay.paidOn = a.date;
      ctx.touch(pay);
    } else {
      draft.payments.push(schema.newPayment(
        { personId: a.personId, appointmentId: a.id, paidOn: a.date, amountMinor: amountMinor }, { now: ctx.now }));
    }
  }

  // saveTreatment({ id, personId, date, time, amountMinor, notes, next })
  // A treatment that was done, with what was paid. id: an existing appointment (editing it,
  // or finishing a booked one). next: { date, time } books the following session in the same save.
  function saveTreatment(v) {
    return store.commit(v.id ? 'Treatment saved' : 'Treatment added', function (draft, ctx) {
      const person = find(draft.people, v.personId);
      if (!person) return;
      let a = v.id ? find(draft.appointments, v.id) : null;
      if (a) {
        a.date = v.date; a.time = v.time || null; a.status = 'done'; a.notes = v.notes || '';
        ctx.touch(a);
      } else {
        a = schema.newAppointment({ personId: v.personId, date: v.date, time: v.time || null, status: 'done', notes: v.notes || '' }, { now: ctx.now });
        draft.appointments.push(a);
      }
      syncPayment(draft, ctx, a, v.amountMinor);
      if (person.clientSince && v.date < person.clientSince) person.clientSince = v.date;
      clearRebook(person);
      if (v.next) {
        draft.appointments.push(schema.newAppointment(
          { personId: v.personId, date: v.next.date, time: v.next.time, status: 'booked' }, { now: ctx.now }));
        if (person.clientStatus !== 'active') person.clientStatus = 'active';
      }
      ctx.touch(person);
    });
  }

  // book({ id, personId, date, time, notes }) books a new appointment or moves one.
  function book(v) {
    return store.commit(v.id ? 'Appointment moved' : 'Appointment booked', function (draft, ctx) {
      const person = find(draft.people, v.personId);
      if (!person) return;
      const a = v.id ? find(draft.appointments, v.id) : null;
      if (a) {
        if (a.date !== v.date || a.time !== v.time) a.scheduledOn = ctx.today;
        a.date = v.date; a.time = v.time; a.status = 'booked'; a.notes = v.notes || '';
        syncPayment(draft, ctx, a, 0);
        ctx.touch(a);
      } else {
        draft.appointments.push(schema.newAppointment(
          { personId: v.personId, date: v.date, time: v.time, status: 'booked', notes: v.notes || '' }, { now: ctx.now }));
      }
      clearRebook(person);
      if (person.clientStatus !== 'active') person.clientStatus = 'active';
      ctx.touch(person);
    });
  }

  // setStatus(id, 'cancelled' | 'noShow')
  function setStatus(id, status) {
    return store.commit(status === 'noShow' ? 'Marked as no-show' : 'Appointment cancelled', function (draft, ctx) {
      const a = find(draft.appointments, id);
      if (!a) return;
      a.status = status;
      syncPayment(draft, ctx, a, 0);
      ctx.touch(a);
    });
  }

  function deleteAppointment(id) {
    return store.commit('Deleted', function (draft, ctx) {
      const a = find(draft.appointments, id);
      if (!a) return;
      syncPayment(draft, ctx, a, 0);
      schema.markDeleted(a, ctx.now);
    });
  }

  // markReminder(appointmentId, 'before' | 'sameDay', channel) notes that a reminder went out
  function markReminder(id, kind, channel) {
    return store.commit('Reminder sent', function (draft, ctx) {
      const a = find(draft.appointments, id);
      if (!a || !a.time) return;
      const slot = { action: 'sent', channel: channel || null, at: ctx.stamp, forDate: a.date, forTime: a.time };
      if (kind === 'sameDay') a.reminderSameDay = slot; else a.reminderBefore = slot;
      ctx.touch(a);
    });
  }

  function changePerson(label, id, change) {
    return store.commit(label, function (draft, ctx) {
      const person = find(draft.people, id);
      if (!person) return;
      change(person, ctx, draft);
      ctx.touch(person);
    });
  }

  function markAsked(id) {
    return changePerson('Marked as asked', id, function (p, ctx) {
      p.rebookAskedOn = ctx.today;
      p.rebookAsks += 1;
      p.rebookSnoozeUntil = null;
    });
  }

  function snooze(id, days) {
    return changePerson('Snoozed', id, function (p, ctx) { p.rebookSnoozeUntil = dates.addDays(ctx.today, days); });
  }

  function setClientStatus(id, status) {
    return changePerson('Status changed', id, function (p) { p.clientStatus = status; });
  }

  // saveLead({ id, name, phone, leadInterest, notes, followUpOn })
  function saveLead(v) {
    return store.commit(v.id ? 'Lead changed' : 'Lead added', function (draft, ctx) {
      const values = {
        name: v.name.trim(), phone: v.phone.trim(), leadInterest: v.leadInterest.trim(),
        notes: v.notes.trim(), followUpOn: v.followUpOn || null
      };
      const lead = v.id ? find(draft.people, v.id) : null;
      if (lead) {
        Object.assign(lead, values);
        if (lead.leadStatus === 'notInterested') lead.leadStatus = 'contacted';
        ctx.touch(lead);
      } else if (!v.id) {
        draft.people.push(schema.newPerson(values, { now: ctx.now, lead: true }));
      }
    });
  }

  function markContacted(id, followUpOn) {
    return changePerson('Marked as contacted', id, function (p) {
      p.leadStatus = 'contacted';
      p.followUpOn = followUpOn || null;
    });
  }

  function closeLead(id) {
    return changePerson('Lead closed', id, function (p) { p.leadStatus = 'notInterested'; p.followUpOn = null; });
  }

  function convertLead(id) {
    return changePerson('Became a client', id, function (p, ctx) {
      p.clientSince = ctx.today;
      p.clientStatus = 'active';
      p.followUpOn = null;
    });
  }

  // deletePerson(id) deletes a client or a lead with everything recorded for them
  function deletePerson(id) {
    return store.commit('Deleted', function (draft, ctx) {
      const person = find(draft.people, id);
      if (!person) return;
      schema.markDeleted(person, ctx.now);
      draft.appointments.concat(draft.payments).forEach(function (record) {
        if (record.personId === id && record.deletedAt === null) schema.markDeleted(record, ctx.now);
      });
    });
  }

  L.core.practice = {
    firstName: firstName,
    weeksFor: weeksFor,
    stats: stats,
    paidFor: paidFor,
    appointment: appointment,
    history: history,
    leads: leads,
    leadTone: leadTone,
    onDay: onDay,
    upcoming: upcoming,
    needsOutcome: needsOutcome,
    doneIn: doneIn,
    clash: clash,
    rebook: rebook,
    reminders: reminders,
    fill: fill,
    message: message,
    month: month,
    months: months,
    receivedOn: receivedOn,
    activeClients: activeClients,
    saveTreatment: saveTreatment,
    book: book,
    setStatus: setStatus,
    deleteAppointment: deleteAppointment,
    markReminder: markReminder,
    markAsked: markAsked,
    snooze: snooze,
    setClientStatus: setClientStatus,
    saveLead: saveLead,
    markContacted: markContacted,
    closeLead: closeLead,
    convertLead: convertLead,
    deletePerson: deletePerson
  };
})(window.Laser);

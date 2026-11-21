// Opening hours: the time in the shop's time zone, open / closed now, and the hours list.
import { toMin, isAllDay, esc } from "./util.js";
import { L, dayName } from "./text.js";

// Day and minute-of-day in the shop's own time zone (shops keep local hours).
function nowIn(tz) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  } catch (e) {
    const d = new Date();
    return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
  }
  const get = t => (parts.find(p => p.type === t) || {}).value;
  return {
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")),
    min: (Number(get("hour")) % 24) * 60 + Number(get("minute"))
  };
}

// A closing time earlier than the opening time means "after midnight".
function openState(shop) {
  const { day, min } = nowIn(shop.tz);
  const today = shop.hours[day];
  const yesterday = shop.hours[(day + 6) % 7];
  if (yesterday && toMin(yesterday[1]) < toMin(yesterday[0]) && min < toMin(yesterday[1])) {
    return { open: true, closes: yesterday[1] };
  }
  if (isAllDay(today)) return { open: true, allDay: true };
  if (today) {
    const o = toMin(today[0]), c = toMin(today[1]);
    if (c > o ? (min >= o && min < c) : min >= o) return { open: true, closes: today[1] };
    if (min < o) return { open: false, opens: { inDays: 0, time: today[0] } };
  }
  for (let i = 1; i <= 7; i++) {
    const s = shop.hours[(day + i) % 7];
    if (s) return { open: false, opens: { inDays: i, day: (day + i) % 7, time: s[0] } };
  }
  return { open: false };
}
function stateDetail(st) {
  const t = L();
  if (st.open) return st.allDay ? t.allDay : t.closesAt(st.closes);
  if (!st.opens) return t.noHours;
  if (st.opens.inDays === 0) return t.opensAt(st.opens.time);
  if (st.opens.inDays === 1) return t.opensTomorrow(st.opens.time);
  return t.opensOn(dayName(st.opens.day), st.opens.time);
}
function statusPill(st) {
  const t = L();
  return `<span class="pill ${st.open ? "open" : "closed"}"><span class="dot" aria-hidden="true"></span>${esc(st.open ? t.open : t.closed)}</span>`;
}

function hoursListHtml(shop) {
  const t = L();
  const today = nowIn(shop.tz).day;
  return `<ul class="hours-list" id="hoursList" data-day="${today}">
      ${shop.hours.map((h, i) => `<li class="${i === today ? "today" : ""}"${i === today ? ' aria-current="date"' : ""}><span>${esc(dayName(i))}${i === today ? ` <span class="today-tag">${esc(t.today)}</span>` : ""}</span>${
        !h ? `<span class="off">${esc(t.closed)}</span>` : isAllDay(h) ? `<span>${esc(t.allDayShort)}</span>` : `<span class="t">${esc(h[0])}–${esc(h[1])}</span>`}</li>`).join("")}
    </ul>`;
}

export { nowIn, openState, stateDetail, statusPill, hoursListHtml };

// The SVG icons (ICON), the icon of each category, and the striped awning drawing.
const svg = (d, cls) => `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', "search-icon"),
  locate: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>'),
  phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
  map: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  nav: svg('<path d="m3 11 18-8-8 18-2-8z"/>'),
  chat: svg('<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.4A8.4 8.4 0 1 1 21 11.5z"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  share: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'),
  back: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>', "flip"),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  camera: svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  trash: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>'),
  copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  grid: svg('<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  pin: svg('<path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  chevron: svg('<path d="m9.5 6 6 6-6 6"/>', "flip"),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>', "flip"),
  store: svg('<path d="M4.5 10.5v9h15v-9"/><path d="M3.5 6 5 3.5h14L20.5 6v1.2a2.6 2.6 0 0 1-4.3 2 2.6 2.6 0 0 1-4.2 0 2.6 2.6 0 0 1-4.2 0 2.6 2.6 0 0 1-4.3-2z"/><path d="M10 19.5V15h4v4.5"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.7v.1"/>'),
  alert: svg('<path d="M12 3.8 2.8 20h18.4z"/><path d="M12 10v4.5M12 17.3v.1"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  leaf: svg('<path d="M12 21v-9"/><path d="M12 13c-4.5 0-7-2.6-7-7 4.5 0 7 2.6 7 7zM12 15.5c0-4.5 2.6-7.5 7-7.5 0 4.5-2.6 7.5-7 7.5z"/>'),
  offline: svg('<path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0M12 19.5v.1M3 3l18 18"/>'),
  retry: svg('<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>'),
  // categories
  scissors: svg('<circle cx="6.5" cy="6.5" r="2.8"/><circle cx="6.5" cy="17.5" r="2.8"/><path d="M8.7 8.3 20 18M8.7 15.7 20 6"/>'),
  dryer: svg('<path d="M10 4a5 5 0 0 0 0 10h3.5l6.5 2.2V5.8L13.5 4z"/><circle cx="10" cy="9" r="1.8"/><path d="M9.5 14 11 20.5h2.6L13 14"/>'),
  polish: svg('<path d="M10 3h4v5h-4z"/><rect x="6.5" y="8" width="11" height="13" rx="3"/><path d="M10 12.5v4.5"/>'),
  lotus: svg('<path d="M12 19c-2.8-1.8-4.3-4.5-4.3-7.6 0-2.6 1.8-5 4.3-6.6 2.5 1.6 4.3 4 4.3 6.6 0 3.1-1.5 5.8-4.3 7.6z"/><path d="M12 19c-4.3 0-7.8-2.4-8.8-6.6 1.5-.5 3.1-.4 4.5.1M12 19c4.3 0 7.8-2.4 8.8-6.6-1.5-.5-3.1-.4-4.5.1"/>'),
  tooth: svg('<path d="M12 5.6C10.5 4.3 8.8 3.7 7 4.1 4.6 4.6 3.6 7.1 4.2 9.6c.5 2 1.4 3.4 1.8 5.5.4 2.2.8 4.9 2.3 4.9 1.6 0 1.7-3.2 2.2-4.7.3-.9.8-1.3 1.5-1.3s1.2.4 1.5 1.3c.5 1.5.6 4.7 2.2 4.7 1.5 0 1.9-2.7 2.3-4.9.4-2.1 1.3-3.5 1.8-5.5.6-2.5-.4-5-2.8-5.5-1.8-.4-3.5.2-5 1.5z"/>'),
  dumbbell: svg('<rect x="5" y="6.5" width="3.2" height="11" rx="1.3"/><rect x="15.8" y="6.5" width="3.2" height="11" rx="1.3"/><path d="M2.8 9.8v4.4M21.2 9.8v4.4M8.2 12h7.6"/>'),
  stones: svg('<ellipse cx="12" cy="18" rx="8" ry="2.7"/><ellipse cx="12" cy="12.6" rx="5.8" ry="2.3"/><ellipse cx="12" cy="7.9" rx="3.8" ry="1.9"/><path d="M12 6c0-1.6.9-2.6 2.6-3"/>'),
  nib: svg('<path d="M12 21 7.2 13.2 9.3 6h5.4l2.1 7.2z"/><path d="M12 21v-7.2"/><circle cx="12" cy="12.4" r="1.4"/><path d="M9 6V3.2h6V6"/>')
};
const CAT_ICON = { barber: "scissors", hair: "dryer", nails: "polish", beauty: "lotus", dental: "tooth", physio: "dumbbell", massage: "stones", tattoo: "nib" };
const catIcon = cat => ICON[CAT_ICON[cat && cat.id]] || ICON.store;
// the striped awning in the small shop illustrations (white and lavender stripes, scalloped edge)
function awningSvg(cls) {
  const n = 6, top = [16, 104], bot = [6, 114], y0 = 12, y1 = 40;
  let d = '<rect x="12" y="5" width="96" height="9" rx="4.5" fill="#C9CBFA"/>';
  for (let i = 0; i < n; i++) {
    const tl = top[0] + (top[1] - top[0]) * i / n, tr = top[0] + (top[1] - top[0]) * (i + 1) / n;
    const bl = bot[0] + (bot[1] - bot[0]) * i / n, br = bot[0] + (bot[1] - bot[0]) * (i + 1) / n;
    const fill = i % 2 ? "#C9CBFA" : "#FFFFFF";
    d += `<path d="M${tl.toFixed(2)} ${y0}H${tr.toFixed(2)}L${br} ${y1}A${(br - bl) / 2} ${(br - bl) / 2} 0 0 1 ${bl} ${y1}z" fill="${fill}"/>`;
  }
  return `<svg class="${cls}" viewBox="0 0 120 52" aria-hidden="true" focusable="false">${d}</svg>`;
}

export { ICON, catIcon, awningSvg };

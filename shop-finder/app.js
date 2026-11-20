/* Nearby — local shop & clinic finder (front-end prototype, no server yet). */
(function () {
  "use strict";

  const STORE_KEY = "nearby.myShops";
  const LANG_KEY = "nearby.lang";
  const DRAFT_KEY = "nearby.draft";
  const NOTICE_KEY = "nearby.notice";
  const MAX_PHOTOS = 4;
  const DEFAULT_TZ = "Asia/Jerusalem";

  /* ------------------------------------------------------------ texts */
  const TEXT = {
    en: {
      skip: "Skip to content",
      ownerBtn: "Open your shop", ownerBtnShort: "Add shop",
      langBtn: "עב", langLabel: "החלפה לעברית",
      eyebrow: n => n + " local spots listed",
      openSign: "Open · come in",
      heroA: "Great work,", heroEm: "around the corner.",
      heroSub: "Barbers, salons and clinics near you — including the small ones you'd walk right past.",
      searchPh: "Barber, nails, street…", searchLabel: "Search shops, services or streets",
      nearMe: "Near me", allCats: "All", catsLabel: "Categories",
      places: n => n === 1 ? "1 place" : n + " places",
      locating: "Finding your location…", locOn: "Sorted by distance from you",
      locDenied: "Location is off — allow it in your browser to see what's closest.",
      locUnsupported: "Your browser can't share location.",
      anyDistance: "Any distance", within: r => "Within " + r + " km", distanceLabel: "Distance",
      openNow: "Open now",
      allShops: "All places", nearYou: "Closest to you",
      results: n => n === 1 ? "1 result" : n + " results",
      emptyTitle: "No matches",
      empty: "Nothing fits these filters. Try another search, category or distance, or turn off “Open now”.",
      clearFilters: "Clear filters",
      open: "Open", closed: "Closed", yours: "Yours",
      closesAt: t => "Closes " + t, opensAt: t => "Opens " + t, opensTomorrow: t => "Opens tomorrow " + t,
      opensOn: (d, t) => "Opens " + d + " " + t, noHours: "Hours not listed",
      from: "from ",
      ctaTitle: "Own a small shop or clinic?",
      ctaText: "Get seen by people around the corner. Add your prices, hours and photos in a few minutes.",
      ctaBtn: "Open your shop",
      back: "All places", about: "About", services: "Services & prices", hours: "Opening hours",
      contact: "Contact & location", call: "Call", email: "Email", directions: "Directions",
      waze: "Navigate with Waze", whatsapp: "WhatsApp", share: "Share", copied: "Link copied",
      newTab: "(opens in a new tab)", photos: "Photos",
      today: "Today", min: m => m + " min", km: "km", m: "m",
      notFound: "We couldn't find this place.", notFoundSub: "It may have been removed.",
      edit: "Edit my shop", remove: "Delete my shop", removeConfirm: "Delete this shop? This can't be undone.",
      published: "Your shop is live! This is how customers see it.", saved: "Changes saved.",
      photoAlt: (name, i) => name + " — photo " + i,
      formTitle: "Open your shop", editTitle: "Edit your shop",
      formSub: "Tell customers what you do, when you're open and what it costs. Your page goes live right away.",
      editSub: "Update anything — customers see the changes right away.",
      demoNote: "Prototype: shops you add are saved only on this device for now.",
      step1: "The basics", step2: "Contact & location", step3: "Opening hours", step4: "Services & prices", step5: "Photos",
      fName: "Shop name", fCategory: "Category", fCategoryPh: "Choose a category", fAbout: "About the shop",
      fAboutHelp: "A sentence or two: what you're great at.",
      fAddress: "Address", fPhone: "Phone", fEmail: "Email", optional: "optional",
      fLocation: "Map location", useLocation: "I'm at the shop — use this spot", locSet: "Location saved ✓",
      locNone: "Not set — customers won't see how far you are, and you won't appear in distance filters.",
      locFailed: "Couldn't get the location. Check the browser permission.",
      dayClosed: "Closed", hoursFrom: d => d + " — opening time", hoursTo: d => d + " — closing time",
      copyHours: "Same hours every open day", copyHoursHelp: "Copies the first open day's hours to the others.",
      svcName: "Service", svcPrice: "Price (₪)", svcMin: "Minutes", addService: "Add a service",
      removeService: n => "Remove service " + n,
      photosHelp: "Up to " + MAX_PHOTOS + " photos. The first one is your cover.",
      choosePhotos: "Choose photos", photosDrop: "JPG or PNG from your phone or computer",
      removePhoto: n => "Remove photo " + n, photosProcessing: "Preparing photos…",
      photosLimit: "Only " + MAX_PHOTOS + " photos fit — the extra ones were skipped.",
      photosBad: "Some files couldn't be read as images and were skipped.",
      previewLabel: "Customers will see:", previewName: "Your shop name", previewAddr: "Your address",
      publish: "Publish my shop", saveChanges: "Save changes", cancel: "Cancel",
      errSummary: "Please fix the highlighted fields.",
      errName: "Enter your shop's name.", errCategory: "Choose a category.", errAddress: "Enter an address.",
      errPhone: "Enter a valid phone number (9–15 digits).", errEmail: "Enter a valid email or leave it empty.",
      errHours: "Closing time must be after opening time (up to 06:00 counts as after midnight).",
      errStorageFull: "This device's storage is full. Delete an older shop or use fewer photos, then try again.",
      errStorageBlocked: "This browser is blocking saved data (private mode?), so the shop can't be saved.",
      titleHome: "Nearby — great local shops & clinics", titleNew: "Open your shop — Nearby", titleEdit: "Edit your shop — Nearby"
    },
    he: {
      skip: "דילוג לתוכן",
      ownerBtn: "פתיחת עסק", ownerBtnShort: "פתיחת עסק",
      langBtn: "EN", langLabel: "Switch to English",
      eyebrow: n => n + " עסקים מקומיים באפליקציה",
      openSign: "פתוח · היכנסו",
      heroA: "עבודה מעולה,", heroEm: "ממש מעבר לפינה.",
      heroSub: "מספרות, סלונים וקליניקות קרוב אליך — כולל הקטנים שעוברים לידם בלי לשים לב.",
      searchPh: "מספרה, ציפורניים, רחוב…", searchLabel: "חיפוש עסקים, שירותים או רחובות",
      nearMe: "סביבי", allCats: "הכול", catsLabel: "קטגוריות",
      places: n => n === 1 ? "מקום אחד" : n + " מקומות",
      locating: "מאתרים את המיקום שלך…", locOn: "ממוין לפי מרחק ממך",
      locDenied: "המיקום כבוי — אפשרו אותו בדפדפן כדי לראות מה הכי קרוב.",
      locUnsupported: "הדפדפן לא יכול לשתף מיקום.",
      anyDistance: "כל מרחק", within: r => "עד " + r + " ק״מ", distanceLabel: "מרחק",
      openNow: "פתוח עכשיו",
      allShops: "כל המקומות", nearYou: "הכי קרובים אליך",
      results: n => n === 1 ? "תוצאה אחת" : n + " תוצאות",
      emptyTitle: "אין התאמות",
      empty: "שום מקום לא מתאים לסינון. נסו חיפוש, קטגוריה או מרחק אחרים, או כבו את „פתוח עכשיו”.",
      clearFilters: "ניקוי סינון",
      open: "פתוח", closed: "סגור", yours: "שלך",
      closesAt: t => "נסגר ב־" + t, opensAt: t => "נפתח ב־" + t, opensTomorrow: t => "נפתח מחר ב־" + t,
      opensOn: (d, t) => "נפתח ב" + d + " ב־" + t, noHours: "שעות לא צוינו",
      from: "החל מ־",
      ctaTitle: "יש לך עסק קטן או קליניקה?",
      ctaText: "תנו לאנשים מהשכונה לגלות אתכם. מוסיפים מחירים, שעות ותמונות תוך כמה דקות.",
      ctaBtn: "פתיחת עסק",
      back: "כל המקומות", about: "אודות", services: "שירותים ומחירים", hours: "שעות פתיחה",
      contact: "יצירת קשר ומיקום", call: "חיוג", email: "מייל", directions: "ניווט",
      waze: "ניווט עם Waze", whatsapp: "וואטסאפ", share: "שיתוף", copied: "הקישור הועתק",
      newTab: "(נפתח בכרטיסייה חדשה)", photos: "תמונות",
      today: "היום", min: m => m + " דק׳", km: "ק״מ", m: "מ׳",
      notFound: "לא מצאנו את המקום הזה.", notFoundSub: "ייתכן שהוא הוסר.",
      edit: "עריכת העסק", remove: "מחיקת העסק שלי", removeConfirm: "למחוק את העסק? אי אפשר לבטל את זה.",
      published: "העסק שלך באוויר! כך הלקוחות רואים אותו.", saved: "השינויים נשמרו.",
      photoAlt: (name, i) => name + " — תמונה " + i,
      formTitle: "פתיחת עסק", editTitle: "עריכת העסק",
      formSub: "ספרו ללקוחות מה אתם עושים, מתי אתם פתוחים וכמה זה עולה. הדף עולה לאוויר מיד.",
      editSub: "אפשר לעדכן הכול — הלקוחות רואים את השינויים מיד.",
      demoNote: "אב-טיפוס: עסקים שתוסיפו נשמרים בינתיים רק במכשיר הזה.",
      step1: "הבסיס", step2: "יצירת קשר ומיקום", step3: "שעות פתיחה", step4: "שירותים ומחירים", step5: "תמונות",
      fName: "שם העסק", fCategory: "קטגוריה", fCategoryPh: "בחרו קטגוריה", fAbout: "על העסק",
      fAboutHelp: "משפט או שניים: במה אתם הכי טובים.",
      fAddress: "כתובת", fPhone: "טלפון", fEmail: "מייל", optional: "לא חובה",
      fLocation: "מיקום במפה", useLocation: "אני בעסק — להשתמש במיקום הזה", locSet: "המיקום נשמר ✓",
      locNone: "לא הוגדר — לקוחות לא יראו כמה אתם רחוקים, והעסק לא יופיע בסינון לפי מרחק.",
      locFailed: "לא הצלחנו לקבל מיקום. בדקו את הרשאת הדפדפן.",
      dayClosed: "סגור", hoursFrom: d => d + " — שעת פתיחה", hoursTo: d => d + " — שעת סגירה",
      copyHours: "אותן שעות לכל הימים הפתוחים", copyHoursHelp: "מעתיק את השעות של היום הפתוח הראשון לשאר הימים.",
      svcName: "שירות", svcPrice: "מחיר (₪)", svcMin: "דקות", addService: "הוספת שירות",
      removeService: n => "הסרת שירות " + n,
      photosHelp: "עד " + MAX_PHOTOS + " תמונות. הראשונה תהיה תמונת השער.",
      choosePhotos: "בחירת תמונות", photosDrop: "JPG או PNG מהטלפון או מהמחשב",
      removePhoto: n => "הסרת תמונה " + n, photosProcessing: "מכינים את התמונות…",
      photosLimit: "נכנסות רק " + MAX_PHOTOS + " תמונות — השאר לא נוספו.",
      photosBad: "חלק מהקבצים אינם תמונות תקינות ולא נוספו.",
      previewLabel: "כך הלקוחות יראו אתכם:", previewName: "שם העסק שלך", previewAddr: "הכתובת שלך",
      publish: "פרסום העסק", saveChanges: "שמירת השינויים", cancel: "ביטול",
      errSummary: "יש לתקן את השדות המסומנים.",
      errName: "הזינו את שם העסק.", errCategory: "בחרו קטגוריה.", errAddress: "הזינו כתובת.",
      errPhone: "הזינו מספר טלפון תקין (9–15 ספרות).", errEmail: "הזינו מייל תקין או השאירו ריק.",
      errHours: "שעת הסגירה חייבת להיות אחרי שעת הפתיחה (עד 06:00 נחשב אחרי חצות).",
      errStorageFull: "האחסון במכשיר מלא. מחקו עסק ישן או השתמשו בפחות תמונות, ונסו שוב.",
      errStorageBlocked: "הדפדפן חוסם שמירת נתונים (גלישה פרטית?), ולכן אי אפשר לשמור את העסק.",
      titleHome: "קרוב אליי — עסקים וקליניקות מעולים בשכונה", titleNew: "פתיחת עסק — קרוב אליי", titleEdit: "עריכת העסק — קרוב אליי"
    }
  };

  /* ------------------------------------------------------------ icons */
  const svg = (d, cls) => `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
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
    copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>')
  };

  /* ------------------------------------------------------------ storage */
  const store = {
    get(area, key, fallback) {
      try { const v = window[area].getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    // returns "" on success, otherwise "full" or "blocked"
    save(area, key, value) {
      try { window[area].setItem(key, JSON.stringify(value)); return ""; } catch (e) {
        return e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22 || e.code === 1014) ? "full" : "blocked";
      }
    },
    del(area, key) { try { window[area].removeItem(key); } catch (e) { /* ignore */ } }
  };

  /* ------------------------------------------------------------ helpers */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  const EMAIL_RE = /^[^\s@<>"'()]+@[^\s@<>"'()]+\.[^\s@<>"'()]{2,}$/;
  const HEX_RE = /^#[0-9a-f]{3,8}$/i;
  const PHOTO_RE = /^(data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+|(?![a-z][a-z0-9+.-]*:)(?!\/\/)[\w\-./]+\.(jpe?g|png|webp|gif|avif))$/i;
  const HE_PREFIX = /^[הובלמשכ]/;

  const phoneDigits = p => String(p || "").replace(/[^\d+]/g, "");
  function validPhone(p) {
    if (!/^[\d\s+\-().]+$/.test(String(p || ""))) return false;
    const n = String(p).replace(/\D/g, "").length;
    return n >= 9 && n <= 15;
  }
  // Israeli mobile numbers (05x / +9725x) get a WhatsApp link.
  function whatsappNumber(p) {
    const d = String(p || "").replace(/\D/g, "");
    if (/^05\d{8}$/.test(d)) return "972" + d.slice(1);
    if (/^9725\d{8}$/.test(d)) return d;
    return "";
  }
  const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

  function normalizeText(s) {
    const finals = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
    return String(s || "").toLowerCase()
      .normalize("NFKD").replace(/[̀-֑ͯ-ׇ]/g, "")
      .replace(/[ךםןףץ]/g, c => finals[c])
      .replace(/["'`’‘“”׳״]/g, "")
      .replace(/[^\p{L}\p{N}\s]+/gu, " ");
  }

  /* ------------------------------------------------------------ state */
  let lang = store.get("localStorage", LANG_KEY, "he");
  if (lang !== "he" && lang !== "en") lang = "he";
  const L = () => TEXT[lang];
  function tx(v) { return (v && typeof v === "object") ? (v[lang] || v.en || v.he || "") : (typeof v === "string" ? v : ""); }

  const CATEGORIES = (window.CATEGORIES || []).map(c => Object.assign({}, c, { color: HEX_RE.test(c.color) ? c.color : "#5b5348" }));
  const OTHER = { id: "", emoji: "🏪", color: "#5b5348", name: { en: "Other", he: "אחר" } };
  const category = id => CATEGORIES.find(c => c.id === id) || OTHER;

  // Coerce any stored shop into a safe, complete shape (or drop it).
  function cleanShop(s, mine) {
    if (!s || typeof s !== "object" || typeof s.id !== "string" || !s.id) return null;
    const text = v => typeof v === "string" ? v
      : (v && typeof v === "object") ? { en: typeof v.en === "string" ? v.en : "", he: typeof v.he === "string" ? v.he : "" } : "";
    const shop = {
      id: s.id,
      name: text(s.name), about: text(s.about), address: text(s.address),
      category: typeof s.category === "string" ? s.category : "",
      phone: typeof s.phone === "string" ? s.phone : "",
      email: typeof s.email === "string" && EMAIL_RE.test(s.email) ? s.email : "",
      tz: typeof s.tz === "string" ? s.tz : DEFAULT_TZ,
      hours: Array.from({ length: 7 }, (_, i) => {
        const h = Array.isArray(s.hours) ? s.hours[i] : null;
        return Array.isArray(h) && TIME_RE.test(h[0]) && TIME_RE.test(h[1]) && h[0] !== h[1] ? [h[0], h[1]] : null;
      }),
      services: (Array.isArray(s.services) ? s.services : [])
        .filter(x => x && typeof x === "object")
        .map(x => ({ name: text(x.name), price: Math.max(0, Number(x.price) || 0), minutes: Math.max(0, Math.round(Number(x.minutes) || 0)) }))
        .filter(x => tx(x.name)),
      photos: (Array.isArray(s.photos) ? s.photos : []).filter(p => typeof p === "string" && PHOTO_RE.test(p)).slice(0, MAX_PHOTOS),
      mine: !!mine
    };
    if (Number.isFinite(s.lat) && Number.isFinite(s.lng) && Math.abs(s.lat) <= 90 && Math.abs(s.lng) <= 180) { shop.lat = s.lat; shop.lng = s.lng; }
    return tx(shop.name) ? shop : null;
  }
  // Stored form drops the runtime-only fields.
  const toStored = s => { const o = Object.assign({}, s); delete o.mine; delete o._hay; return o; };

  const sampleShops = (window.SAMPLE_SHOPS || []).map(s => cleanShop(s, false)).filter(Boolean);
  function loadMyShops() {
    const raw = store.get("localStorage", STORE_KEY, []);
    return (Array.isArray(raw) ? raw : []).map(s => cleanShop(s, true)).filter(Boolean);
  }
  let myShops = loadMyShops();
  const allShops = () => myShops.concat(sampleShops);

  let userPos = null;      // { lat, lng } once the customer shares location
  let locState = "";       // "", "locating", "on", "denied", "unsupported"
  let locToken = 0;
  const filter = { q: "", category: "", radius: 0, openNow: false };
  let firstRender = true;
  let lastRoute = null;
  let lastShopId = null;
  let homeScrollY = 0;

  const app = document.getElementById("app");

  /* ------------------------------------------------------------ formatting */
  const locale = () => lang === "he" ? "he-IL" : "en-IL";
  const money = n => new Intl.NumberFormat(locale(), { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);
  const dayName = i => new Intl.DateTimeFormat(locale(), { weekday: "long" }).format(new Date(2024, 0, 7 + i));
  function formatDistance(km) {
    const metres = Math.max(10, Math.round(km * 100) * 10);
    if (metres < 1000) return metres + " " + L().m;
    return new Intl.NumberFormat(locale(), { maximumFractionDigits: km < 10 ? 1 : 0 }).format(km) + " " + L().km;
  }

  function distanceKm(a, b) {
    const rad = x => x * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  }
  const shopDistance = shop => (userPos && shop.lat !== undefined) ? distanceKm(userPos, shop) : null;

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
    if (st.open) return t.closesAt(st.closes);
    if (!st.opens) return t.noHours;
    if (st.opens.inDays === 0) return t.opensAt(st.opens.time);
    if (st.opens.inDays === 1) return t.opensTomorrow(st.opens.time);
    return t.opensOn(dayName(st.opens.day), st.opens.time);
  }
  function statusPill(st) {
    const t = L();
    return `<span class="pill ${st.open ? "open" : "closed"}"><span class="dot" aria-hidden="true"></span>${esc(st.open ? t.open : t.closed)}</span>`;
  }

  function minPrice(shop) {
    const prices = shop.services.map(s => s.price).filter(p => p > 0);
    return prices.length ? Math.min(...prices) : null;
  }
  function searchText(shop) {
    if (shop._hay) return shop._hay;
    const both = v => (v && typeof v === "object") ? v.en + " " + v.he : (v || "");
    const cat = category(shop.category);
    shop._hay = normalizeText([both(shop.name), both(shop.about), both(shop.address), both(cat.name),
      shop.services.map(s => both(s.name)).join(" ")].join(" "));
    return shop._hay;
  }
  // A Hebrew word may carry a one-letter prefix (ה, ו, ב, ל, מ, ש, כ): "המספרה" should find "מספרה".
  const wordMatches = (hay, w) => hay.includes(w) || (w.length > 3 && HE_PREFIX.test(w) && hay.includes(w.slice(1)));

  const newTabNote = () => `<span class="sr-only"> ${esc(L().newTab)}</span>`;

  function cardHtml(shop, dist, i, opts) {
    const t = L();
    const preview = !!(opts && opts.preview);
    const cat = category(shop.category);
    const st = openState(shop);
    const price = minPrice(shop);
    const photo = shop.photos[0];
    const uid = preview ? "pv" : "c" + i;
    const name = tx(shop.name) || (preview ? t.previewName : "");
    const addr = tx(shop.address) || (preview ? t.previewAddr : "");
    const tag = preview ? "div" : "a";
    const linkAttrs = preview ? "" : ` href="#/shop/${encodeURIComponent(shop.id)}" aria-labelledby="${uid}-n" aria-describedby="${uid}-d"`;
    const hasDist = dist !== null && dist !== undefined;
    const summary = [tx(cat.name), (st.open ? t.open : t.closed) + ", " + stateDetail(st), hasDist ? formatDistance(dist) : "", price !== null ? t.from + money(price) : ""].filter(Boolean).join(" · ");
    return `
      <${tag} class="card"${linkAttrs} style="--c:${cat.color};--i:${Math.min(i, 12)}">
        <div class="awning" aria-hidden="true"></div>
        <div class="window" aria-hidden="true">
          ${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" decoding="async">` : `<span class="emoji">${esc(cat.emoji)}</span>`}
          ${shop.mine && !preview ? `<span class="pill mine">${esc(t.yours)}</span>` : ""}
        </div>
        <div class="card-body">
          <h3 id="${uid}-n"><bdi>${esc(name)}</bdi></h3>
          <p class="card-meta"><span>${esc(tx(cat.name))}</span>${price !== null ? `<span class="from">${esc(t.from)}<b>${esc(money(price))}</b></span>` : ""}</p>
          <p class="card-addr"><bdi>${esc(addr)}</bdi></p>
          <div class="card-foot">
            <span class="foot-status">${statusPill(st)}<span class="hint-small">${esc(stateDetail(st))}</span></span>
            ${hasDist ? `<span class="dist">${esc(formatDistance(dist))}</span>` : ""}
          </div>
          ${preview ? "" : `<span class="sr-only" id="${uid}-d">${esc(summary)}</span>`}
        </div>
      </${tag}>`;
  }

  /* ------------------------------------------------------------ home */
  function renderHome() {
    const t = L();
    document.title = t.titleHome;
    const shops = allShops();
    const counts = {};
    shops.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    const catTile = (c, label, n, extraClass, emoji) => `
      <button class="shopfront ${extraClass || ""}" type="button" data-cat="${esc(c ? c.id : "")}" aria-pressed="${filter.category === (c ? c.id : "")}" style="--c:${c ? c.color : "#1d1a16"}">
        <span class="awning" aria-hidden="true"></span>
        <span class="emoji" aria-hidden="true">${esc(emoji)}</span>
        <span class="name">${esc(label)}</span>
        <span class="n">${esc(t.places(n))}</span>
      </button>`;

    app.innerHTML = `
      <section class="hero">
        <p class="eyebrow fade-in"><span class="dot" aria-hidden="true"></span>${esc(t.eyebrow(shops.length))}</p>
        <h1 class="fade-in" tabindex="-1">${esc(t.heroA)} <em>${esc(t.heroEm)}</em></h1>
        <p class="hero-sub fade-in">${esc(t.heroSub)}</p>
        <form class="searchbar fade-in" role="search" id="searchForm">
          ${ICON.search}
          <label class="sr-only" for="q">${esc(t.searchLabel)}</label>
          <input id="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="${esc(t.searchPh)}" value="${esc(filter.q)}">
          <button class="btn btn-sm near-btn" type="button" id="nearBtn" aria-pressed="${!!userPos}">${ICON.locate}<span class="label-long">${esc(t.nearMe)}</span></button>
        </form>
        <div class="hero-art" aria-hidden="true">
          <div class="store">
            <div class="awning"></div>
            <div class="facade">
              <div class="pane" style="--c:${category("barber").color}">💈</div>
              <div class="door"><span class="sign">${esc(t.openSign)}</span></div>
              <div class="pane" style="--c:${category("nails").color}">💅</div>
            </div>
            <div class="step"></div>
            <span class="plant">🪴</span>
          </div>
        </div>
      </section>
      <nav class="street" id="street" aria-label="${esc(t.catsLabel)}">
        ${catTile(null, t.allCats, shops.length, "all", "★")}
        ${CATEGORIES.map(c => catTile(c, tx(c.name), counts[c.id] || 0, "", c.emoji)).join("")}
      </nav>
      <section aria-labelledby="resultsTitle">
        <div class="toolbar">
          <div>
            <h2 id="resultsTitle"></h2>
            <p class="count" id="count" aria-live="polite"></p>
          </div>
          <div class="toolbar-filters">
            <button class="toggle" type="button" id="openBtn" aria-pressed="${filter.openNow}"><span class="sw" aria-hidden="true"></span>${esc(t.openNow)}</button>
            <label class="sr-only" for="radius">${esc(t.distanceLabel)}</label>
            <select class="select" id="radius">
              <option value="0">${esc(t.anyDistance)}</option>
              ${[1, 3, 5, 10].map(r => `<option value="${r}" ${filter.radius === r ? "selected" : ""}>${esc(t.within(r))}</option>`).join("")}
            </select>
          </div>
          <p class="status-line" id="locStatus" role="status"></p>
        </div>
        <div class="grid" id="grid"></div>
      </section>
      <section class="owner-cta">
        <div class="awning" aria-hidden="true"></div>
        <div>
          <h2>${esc(t.ctaTitle)}</h2>
          <p>${esc(t.ctaText)}</p>
        </div>
        <a class="btn" href="#/new">${ICON.plus}${esc(t.ctaBtn)}</a>
      </section>`;

    const q = document.getElementById("q");
    let qTimer = 0;
    q.addEventListener("input", () => {
      filter.q = q.value;
      clearTimeout(qTimer);
      qTimer = setTimeout(() => updateResults(false), 90);
    });
    document.getElementById("searchForm").addEventListener("submit", e => {
      e.preventDefault();
      clearTimeout(qTimer);
      updateResults(false);
      q.blur();
      document.getElementById("resultsTitle").scrollIntoView({ block: "start" });
    });
    document.getElementById("street").addEventListener("click", e => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      filter.category = b.dataset.cat;
      updateResults(true);
    });
    document.getElementById("radius").addEventListener("change", e => { filter.radius = Number(e.target.value) || 0; updateResults(true); });
    document.getElementById("openBtn").addEventListener("click", () => { filter.openNow = !filter.openNow; updateResults(true); });
    document.getElementById("nearBtn").addEventListener("click", toggleNearMe);
    updateResults(firstRender);
  }

  function filteredShops() {
    const words = normalizeText(filter.q).split(/\s+/).filter(Boolean);
    const list = allShops().map(shop => ({ shop, dist: shopDistance(shop) })).filter(({ shop, dist }) => {
      if (filter.category && shop.category !== filter.category) return false;
      if (filter.openNow && !openState(shop).open) return false;
      if (userPos && filter.radius && (dist === null || dist > filter.radius)) return false;
      if (words.length) { const hay = searchText(shop); if (!words.every(w => wordMatches(hay, w))) return false; }
      return true;
    });
    if (userPos) list.sort((a, b) => (a.dist === null ? Infinity : a.dist) - (b.dist === null ? Infinity : b.dist));
    return list;
  }

  function updateResults(animate) {
    const t = L();
    const grid = document.getElementById("grid");
    if (!grid) return;
    const list = filteredShops();

    document.querySelectorAll("#street [data-cat]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.cat === filter.category)));
    document.getElementById("openBtn").setAttribute("aria-pressed", String(filter.openNow));
    const near = document.getElementById("nearBtn");
    near.setAttribute("aria-pressed", String(!!userPos));
    near.setAttribute("aria-busy", String(locState === "locating"));
    const radius = document.getElementById("radius");
    radius.hidden = !userPos;
    radius.value = String(filter.radius);

    const cat = filter.category ? category(filter.category) : null;
    document.getElementById("resultsTitle").textContent = cat ? tx(cat.name) : (userPos ? t.nearYou : t.allShops);
    document.getElementById("count").textContent = t.results(list.length);
    const status = document.getElementById("locStatus");
    status.textContent = { locating: t.locating, on: t.locOn, denied: t.locDenied, unsupported: t.locUnsupported }[locState] || "";
    status.classList.toggle("warn", locState === "denied" || locState === "unsupported");

    grid.classList.toggle("calm", !animate);
    grid.innerHTML = list.length
      ? list.map(({ shop, dist }, i) => cardHtml(shop, dist, i)).join("")
      : `<div class="empty"><span class="big" aria-hidden="true">🔍</span><h3>${esc(t.emptyTitle)}</h3><p>${esc(t.empty)}</p>
           <button class="btn btn-ghost btn-sm" type="button" id="clearBtn">${esc(t.clearFilters)}</button></div>`;
    const clear = document.getElementById("clearBtn");
    if (clear) clear.addEventListener("click", () => {
      Object.assign(filter, { q: "", category: "", radius: 0, openNow: false });
      document.getElementById("q").value = "";
      updateResults(true);
      document.getElementById("q").focus();
    });
  }

  function toggleNearMe() {
    if (locState === "locating") return;
    if (userPos) {
      userPos = null; locState = ""; filter.radius = 0;
      updateResults(true);
      return;
    }
    if (!navigator.geolocation) { locState = "unsupported"; updateResults(false); return; }
    const token = ++locToken;
    locState = "locating"; updateResults(false);
    navigator.geolocation.getCurrentPosition(pos => {
      if (token !== locToken) return;
      userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      locState = "on";
      updateResults(true);
    }, () => {
      if (token !== locToken) return;
      locState = "denied";
      updateResults(false);
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  /* ------------------------------------------------------------ shop page */
  const backLink = () => `<a class="back" href="#/" data-back>${ICON.back}${esc(L().back)}</a>`;

  function renderNotFound() {
    const t = L();
    document.title = t.notFound + " — " + tx(window.APP_NAME);
    app.innerHTML = `${backLink()}
      <div class="empty"><span class="big" aria-hidden="true">🏚️</span><h1 tabindex="-1">${esc(t.notFound)}</h1><p>${esc(t.notFoundSub)}</p>
        <a class="btn" href="#/">${esc(t.back)}</a></div>`;
  }

  function renderShop(id) {
    const t = L();
    const shop = allShops().find(s => s.id === id);
    if (!shop) { renderNotFound(); return; }
    lastShopId = shop.id;
    const name = tx(shop.name);
    document.title = name + " — " + tx(window.APP_NAME);
    const cat = category(shop.category);
    const st = openState(shop);
    const dist = shopDistance(shop);
    const today = nowIn(shop.tz).day;
    const hasPos = shop.lat !== undefined;
    const mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(hasPos ? shop.lat + "," + shop.lng : tx(shop.address));
    const wazeUrl = hasPos ? "https://waze.com/ul?ll=" + encodeURIComponent(shop.lat + "," + shop.lng) + "&navigate=yes" : "";
    const tel = phoneDigits(shop.phone);
    const wa = whatsappNumber(shop.phone);
    const notice = store.get("sessionStorage", NOTICE_KEY, null);
    const showNotice = !!(notice && notice.id === shop.id);
    if (showNotice) store.del("sessionStorage", NOTICE_KEY);

    const callBtn = cls => tel ? `<a class="btn ${cls}" href="tel:${esc(tel)}">${ICON.phone}${esc(t.call)}</a>` : "";
    const dirBtn = cls => `<a class="btn ${cls}" href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer">${ICON.map}${esc(t.directions)}${newTabNote()}</a>`;
    const shareBtn = (cls, iconOnly) => `<button class="btn ${cls}" type="button" data-share${iconOnly ? ` aria-label="${esc(t.share)}"` : ""}>${ICON.share}${iconOnly ? "" : esc(t.share)}</button>`;
    const multi = shop.photos.length > 1;

    app.innerHTML = `
      <div class="shop-page">
        ${backLink()}
        ${showNotice ? `<p class="note fade-in" role="status">🎉 ${esc(notice.kind === "edit" ? t.saved : t.published)}</p>` : ""}
        <div class="shop-layout">
          <div class="shop-main">
            <article class="shop-hero fade-in" style="--c:${cat.color}">
              <div class="awning" aria-hidden="true"></div>
              <div class="gallery ${multi ? "multi" : ""}"${multi ? ` tabindex="0" role="region" aria-label="${esc(t.photos)}"` : ""}>
                ${shop.photos.length
                  ? shop.photos.map((p, i) => `<div class="window"><img src="${esc(p)}" alt="${esc(t.photoAlt(name, i + 1))}" decoding="async"></div>`).join("")
                  : `<div class="window" aria-hidden="true"><span class="emoji">${esc(cat.emoji)}</span></div>`}
              </div>
              <div class="shop-title">
                <p class="card-meta"><span aria-hidden="true">${esc(cat.emoji)}</span><span>${esc(tx(cat.name))}</span>${dist !== null ? `<span aria-hidden="true">·</span><span>${esc(formatDistance(dist))}</span>` : ""}</p>
                <h1 tabindex="-1"><bdi>${esc(name)}</bdi></h1>
                <p class="card-meta" id="shopStatus" data-id="${esc(shop.id)}">${statusPill(st)} <span>${esc(stateDetail(st))}</span></p>
                <div class="actions desktop-only">
                  ${callBtn("btn-accent")}
                  ${dirBtn("btn-ghost")}
                  ${shareBtn("btn-ghost")}
                </div>
                <p class="help share-status" role="status"></p>
              </div>
            </article>
            ${tx(shop.about) ? `<section class="panel fade-in"><h2>${esc(t.about)}</h2><p class="about" dir="auto">${esc(tx(shop.about))}</p></section>` : ""}
            ${shop.services.length ? `<section class="panel fade-in"><h2>${esc(t.services)}</h2><ul class="price-list">
              ${shop.services.map(s => `<li><span class="svc"><bdi>${esc(tx(s.name))}</bdi></span>${s.minutes ? `<span class="dur">${esc(t.min(s.minutes))}</span>` : ""}<span class="price">${s.price ? esc(money(s.price)) : "—"}</span></li>`).join("")}
            </ul></section>` : ""}
          </div>
          <aside class="shop-side">
            <section class="panel fade-in"><h2>${esc(t.hours)}</h2><ul class="hours-list">
              ${shop.hours.map((h, i) => `<li class="${i === today ? "today" : ""}"${i === today ? ' aria-current="date"' : ""}><span>${esc(dayName(i))}${i === today ? ` <span class="today-tag">${esc(t.today)}</span>` : ""}</span>${h ? `<span class="t">${esc(h[0])}–${esc(h[1])}</span>` : `<span class="off">${esc(t.closed)}</span>`}</li>`).join("")}
            </ul></section>
            <section class="panel fade-in"><h2>${esc(t.contact)}</h2><ul class="contact-list">
              <li>${ICON.map}<a href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer"><bdi>${esc(tx(shop.address))}</bdi>${newTabNote()}</a></li>
              ${wazeUrl ? `<li>${ICON.nav}<a href="${esc(wazeUrl)}" target="_blank" rel="noopener noreferrer">${esc(t.waze)}${newTabNote()}</a></li>` : ""}
              ${tel ? `<li>${ICON.phone}<a href="tel:${esc(tel)}"><bdi dir="ltr">${esc(shop.phone)}</bdi></a></li>` : ""}
              ${wa ? `<li>${ICON.chat}<a href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener noreferrer">${esc(t.whatsapp)}${newTabNote()}</a></li>` : ""}
              ${shop.email ? `<li>${ICON.mail}<a href="mailto:${esc(shop.email)}"><bdi dir="ltr">${esc(shop.email)}</bdi></a></li>` : ""}
            </ul></section>
            ${shop.mine ? `<div class="owner-zone">
                <a class="btn btn-sm" href="#/edit/${encodeURIComponent(shop.id)}">${ICON.edit}${esc(t.edit)}</a>
                <button class="btn btn-danger btn-sm" type="button" id="removeBtn">${ICON.trash}${esc(t.remove)}</button>
              </div>` : ""}
          </aside>
        </div>
        <div class="action-bar">${callBtn("btn-accent")}${dirBtn(tel ? "btn-ghost" : "btn-accent")}${shareBtn("btn-ghost btn-icon", true)}</div>
      </div>`;

    app.querySelectorAll("[data-share]").forEach(b => b.addEventListener("click", async () => {
      const url = location.href;
      const status = app.querySelector(".share-status");
      if (navigator.share) {
        try { await navigator.share({ title: name, url }); } catch (e) { /* cancelled */ }
        return;
      }
      try { await navigator.clipboard.writeText(url); status.textContent = t.copied; } catch (e) { status.textContent = url; }
    }));

    const removeBtn = document.getElementById("removeBtn");
    if (removeBtn) removeBtn.addEventListener("click", () => {
      if (!confirm(t.removeConfirm)) return;
      const next = loadMyShops().filter(s => s.id !== shop.id).map(toStored);
      const err = store.save("localStorage", STORE_KEY, next);
      if (err) { alert(err === "full" ? t.errStorageFull : t.errStorageBlocked); return; }
      myShops = loadMyShops();
      location.replace("#/");
    });
  }

  /* ------------------------------------------------------------ "open your shop" form */
  function emptyDraft() {
    return {
      editId: "", photosLoaded: true,
      name: "", category: "", about: "", address: "", phone: "", email: "", pos: null,
      hours: Array.from({ length: 7 }, (_, i) => ({ from: "09:00", to: i === 5 ? "14:00" : "19:00", closed: i === 6 })),
      services: [{ name: "", price: "", minutes: "" }],
      photos: []
    };
  }
  function shopToDraft(shop) {
    const plain = v => typeof v === "string" ? v : tx(v);
    return {
      editId: shop.id, photosLoaded: true,
      name: plain(shop.name), category: shop.category, about: plain(shop.about), address: plain(shop.address),
      phone: shop.phone, email: shop.email, pos: shop.lat !== undefined ? { lat: shop.lat, lng: shop.lng } : null,
      hours: shop.hours.map(h => h ? { from: h[0], to: h[1], closed: false } : { from: "09:00", to: "19:00", closed: true }),
      services: shop.services.length
        ? shop.services.map(s => ({ name: plain(s.name), price: s.price ? String(s.price) : "", minutes: s.minutes ? String(s.minutes) : "" }))
        : [{ name: "", price: "", minutes: "" }],
      photos: shop.photos.slice()
    };
  }
  function loadDraft() {
    const d = Object.assign(emptyDraft(), store.get("sessionStorage", DRAFT_KEY, {}) || {});
    ["name", "category", "about", "address", "phone", "email", "editId"].forEach(k => { if (typeof d[k] !== "string") d[k] = ""; });
    if (!Array.isArray(d.hours) || d.hours.length !== 7 || !d.hours.every(h => h && typeof h === "object")) d.hours = emptyDraft().hours;
    d.hours = d.hours.map(h => ({ from: TIME_RE.test(h.from) ? h.from : "09:00", to: TIME_RE.test(h.to) ? h.to : "19:00", closed: !!h.closed }));
    if (!Array.isArray(d.services) || !d.services.length || !d.services.every(s => s && typeof s === "object")) d.services = emptyDraft().services;
    d.services = d.services.map(s => ({ name: String(s.name || ""), price: String(s.price || ""), minutes: String(s.minutes || "") }));
    if (!(d.pos && Number.isFinite(d.pos.lat) && Number.isFinite(d.pos.lng))) d.pos = null;
    d.photos = [];
    d.photosLoaded = false; // photos are not kept across reloads (too big for session storage)
    return d;
  }
  let draft = loadDraft();
  let pendingPhotos = 0;
  let showErrors = false;

  function saveDraft() {
    store.save("sessionStorage", DRAFT_KEY, Object.assign({}, draft, { photos: [], photosLoaded: false }));
  }

  function renderForm(editId) {
    const t = L();
    let editing = null;
    if (editId) {
      editing = myShops.find(s => s.id === editId);
      if (!editing) { renderNotFound(); return; }
      if (draft.editId !== editing.id) { draft = shopToDraft(editing); showErrors = false; }
      if (!draft.photosLoaded) { draft.photos = editing.photos.slice(); draft.photosLoaded = true; }
    } else if (draft.editId) {
      draft = emptyDraft(); showErrors = false;
    }
    document.title = editing ? t.titleEdit : t.titleNew;
    const opt = `<span class="help">(${esc(t.optional)})</span>`;
    const req = `<span class="req" aria-hidden="true">*</span>`;

    app.innerHTML = `
      ${editing ? `<a class="back" href="#/shop/${encodeURIComponent(editing.id)}">${ICON.back}<bdi>${esc(tx(editing.name))}</bdi></a>` : backLink()}
      <header class="page-head">
        <h1 tabindex="-1">${esc(editing ? t.editTitle : t.formTitle)}</h1>
        <p>${esc(editing ? t.editSub : t.formSub)}</p>
      </header>
      <form id="shopForm" class="form-layout" novalidate>
        <p class="note">ℹ️ ${esc(t.demoNote)}</p>

        <section class="panel step" aria-labelledby="s1">
          <div class="step-head"><span class="step-num" aria-hidden="true">1</span><h2 id="s1">${esc(t.step1)}</h2></div>
          <div class="field"><label for="fName">${esc(t.fName)} ${req}</label>
            <input id="fName" name="name" maxlength="60" required aria-required="true" aria-describedby="err-fName" autocomplete="organization" dir="auto">
            <p class="field-error" id="err-fName" hidden></p></div>
          <div class="field"><label for="fCategory">${esc(t.fCategory)} ${req}</label>
            <select id="fCategory" name="category" required aria-required="true" aria-describedby="err-fCategory">
              <option value="">${esc(t.fCategoryPh)}</option>
              ${CATEGORIES.map(c => `<option value="${esc(c.id)}">${esc(c.emoji)} ${esc(tx(c.name))}</option>`).join("")}
            </select>
            <p class="field-error" id="err-fCategory" hidden></p></div>
          <div class="field"><label for="fAbout">${esc(t.fAbout)} ${opt}</label>
            <textarea id="fAbout" name="about" maxlength="400" aria-describedby="help-fAbout" dir="auto"></textarea>
            <p class="help" id="help-fAbout">${esc(t.fAboutHelp)}</p></div>
        </section>

        <section class="panel step" aria-labelledby="s2">
          <div class="step-head"><span class="step-num" aria-hidden="true">2</span><h2 id="s2">${esc(t.step2)}</h2></div>
          <div class="field"><label for="fAddress">${esc(t.fAddress)} ${req}</label>
            <input id="fAddress" name="address" maxlength="100" autocomplete="street-address" required aria-required="true" aria-describedby="err-fAddress" dir="auto">
            <p class="field-error" id="err-fAddress" hidden></p></div>
          <div class="two">
            <div class="field"><label for="fPhone">${esc(t.fPhone)} ${req}</label>
              <input id="fPhone" name="phone" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" dir="ltr" required aria-required="true" aria-describedby="err-fPhone">
              <p class="field-error" id="err-fPhone" hidden></p></div>
            <div class="field"><label for="fEmail">${esc(t.fEmail)} ${opt}</label>
              <input id="fEmail" name="email" type="email" inputmode="email" maxlength="80" autocomplete="email" dir="ltr" aria-describedby="err-fEmail">
              <p class="field-error" id="err-fEmail" hidden></p></div>
          </div>
          <div class="field" role="group" aria-labelledby="locLabel"><span class="label" id="locLabel">${esc(t.fLocation)} ${opt}</span>
            <div class="loc-box">
              <button class="btn btn-ghost btn-sm" type="button" id="fLocBtn" aria-describedby="fLocStatus">${ICON.locate}${esc(t.useLocation)}</button>
              <p class="help" id="fLocStatus" role="status">${esc(draft.pos ? t.locSet : t.locNone)}</p>
            </div></div>
        </section>

        <section class="panel step" aria-labelledby="s3">
          <div class="step-head"><span class="step-num" aria-hidden="true">3</span><h2 id="s3">${esc(t.step3)}</h2></div>
          <div class="hours-grid" id="hoursGrid">
            ${draft.hours.map((h, i) => `
              <div class="hours-row ${h.closed ? "is-closed" : ""}" data-day="${i}" role="group" aria-label="${esc(dayName(i))}">
                <span class="day" aria-hidden="true">${esc(dayName(i))}</span>
                <label class="switch"><input type="checkbox" name="closed" ${h.closed ? "checked" : ""}>${esc(t.dayClosed)}</label>
                <span class="times">
                  <input type="time" name="from" value="${esc(h.from)}" aria-label="${esc(t.hoursFrom(dayName(i)))}" ${h.closed ? "disabled" : ""}>
                  <span class="sep" aria-hidden="true">–</span>
                  <input type="time" name="to" value="${esc(h.to)}" aria-label="${esc(t.hoursTo(dayName(i)))}" ${h.closed ? "disabled" : ""}>
                </span>
                <p class="field-error row-error" id="err-hours-${i}" hidden></p>
              </div>`).join("")}
          </div>
          <div class="copy-hours">
            <button class="btn btn-ghost btn-sm" type="button" id="copyHours" aria-describedby="copyHoursHelp">${ICON.copy}${esc(t.copyHours)}</button>
            <p class="help" id="copyHoursHelp">${esc(t.copyHoursHelp)}</p>
          </div>
        </section>

        <section class="panel step" aria-labelledby="s4">
          <div class="step-head"><span class="step-num" aria-hidden="true">4</span><h2 id="s4">${esc(t.step4)}</h2></div>
          <div class="service-list" id="services"></div>
          <div><button class="btn btn-ghost btn-sm" type="button" id="addService">${ICON.plus}${esc(t.addService)}</button></div>
        </section>

        <section class="panel step" aria-labelledby="s5">
          <div class="step-head"><span class="step-num" aria-hidden="true">5</span><h2 id="s5">${esc(t.step5)}</h2></div>
          <p class="help" id="photosHelp">${esc(t.photosHelp)}</p>
          <label class="dropzone" for="fPhotos">
            ${ICON.camera}
            <strong>${esc(t.choosePhotos)}</strong>
            <span class="help">${esc(t.photosDrop)}</span>
          </label>
          <input id="fPhotos" class="sr-only" type="file" accept="image/*" multiple aria-describedby="photosHelp photoStatus">
          <p class="help" id="photoStatus" role="status"></p>
          <div class="thumbs" id="thumbs"></div>
        </section>

        <aside class="preview" aria-label="${esc(t.previewLabel)}">
          <p class="label" aria-hidden="true">${esc(t.previewLabel)}</p>
          <div id="preview"></div>
        </aside>

        <div class="submit-row">
          <p class="form-error" id="formError" role="alert" hidden></p>
          <button class="btn btn-accent" type="submit" id="submitBtn">${esc(editing ? t.saveChanges : t.publish)}</button>
          ${editing ? `<a class="btn btn-ghost" href="#/shop/${encodeURIComponent(editing.id)}">${esc(t.cancel)}</a>` : ""}
        </div>
      </form>`;

    const form = document.getElementById("shopForm");
    const $ = id => document.getElementById(id);
    $("fName").value = draft.name; $("fCategory").value = draft.category; $("fAbout").value = draft.about;
    $("fAddress").value = draft.address; $("fPhone").value = draft.phone; $("fEmail").value = draft.email;
    renderServices();
    renderThumbs();
    renderPreview();
    updateSubmit();
    if (showErrors) showValidation(validate(), false);

    function renderServices() {
      $("services").innerHTML = draft.services.map((s, i) => `
        <div class="service-row" data-i="${i}">
          <div class="field svc-name"><label for="svcName${i}">${esc(t.svcName)}</label><input id="svcName${i}" name="svcName" maxlength="50" dir="auto" value="${esc(s.name)}"></div>
          <div class="field"><label for="svcPrice${i}">${esc(t.svcPrice)}</label><input id="svcPrice${i}" name="svcPrice" type="number" min="0" max="100000" step="1" inputmode="numeric" value="${esc(s.price)}"></div>
          <div class="field"><label for="svcMin${i}">${esc(t.svcMin)}</label><input id="svcMin${i}" name="svcMin" type="number" min="0" max="1440" step="5" inputmode="numeric" value="${esc(s.minutes)}"></div>
          <button class="btn btn-ghost btn-icon" type="button" data-remove="${i}" aria-label="${esc(t.removeService(i + 1))}" ${draft.services.length === 1 ? "hidden" : ""}>${ICON.x}</button>
        </div>`).join("");
    }
    function renderThumbs() {
      $("thumbs").innerHTML = draft.photos.map((p, i) => `
        <div class="thumb"><img src="${esc(p)}" alt="">
          <button type="button" data-photo="${i}" aria-label="${esc(t.removePhoto(i + 1))}">${ICON.x}</button></div>`).join("");
    }
    function renderPreview() {
      $("preview").innerHTML = cardHtml(draftToShop(), null, 0, { preview: true });
    }
    function updateSubmit() {
      const btn = $("submitBtn");
      btn.disabled = pendingPhotos > 0;
      btn.textContent = pendingPhotos > 0 ? t.photosProcessing : (editing ? t.saveChanges : t.publish);
    }

    function collect() {
      draft.name = $("fName").value; draft.category = $("fCategory").value; draft.about = $("fAbout").value;
      draft.address = $("fAddress").value; draft.phone = $("fPhone").value; draft.email = $("fEmail").value;
      draft.hours = Array.from(form.querySelectorAll(".hours-row")).map(row => ({
        from: row.querySelector('[name="from"]').value,
        to: row.querySelector('[name="to"]').value,
        closed: row.querySelector('[name="closed"]').checked
      }));
      draft.services = Array.from($("services").children).map(row => ({
        name: row.querySelector('[name="svcName"]').value,
        price: row.querySelector('[name="svcPrice"]').value,
        minutes: row.querySelector('[name="svcMin"]').value
      }));
      saveDraft();
    }
    form._collect = collect; // used by the language switch

    function onChange(e) {
      if (e && e.target && e.target.name === "closed") {
        const row = e.target.closest(".hours-row");
        row.classList.toggle("is-closed", e.target.checked);
        row.querySelectorAll('input[type="time"]').forEach(inp => { inp.disabled = e.target.checked; });
      }
      if (e && e.target && e.target.id === "fPhotos") return;
      collect();
      if (showErrors) showValidation(validate(), false);
      renderPreview();
    }
    form.addEventListener("input", onChange);
    form.addEventListener("change", e => { if (e.target.name === "closed") onChange(e); });

    $("copyHours").addEventListener("click", () => {
      collect();
      const src = draft.hours.find(h => !h.closed);
      if (!src) return;
      form.querySelectorAll(".hours-row").forEach(row => {
        if (row.querySelector('[name="closed"]').checked) return;
        row.querySelector('[name="from"]').value = src.from;
        row.querySelector('[name="to"]').value = src.to;
      });
      onChange();
    });

    $("addService").addEventListener("click", () => {
      collect();
      draft.services.push({ name: "", price: "", minutes: "" });
      renderServices();
      $("svcName" + (draft.services.length - 1)).focus();
    });
    $("services").addEventListener("click", e => {
      const b = e.target.closest("[data-remove]");
      if (!b) return;
      collect();
      const i = Number(b.dataset.remove);
      draft.services.splice(i, 1);
      renderServices();
      saveDraft();
      renderPreview();
      const next = $("svcName" + Math.min(i, draft.services.length - 1));
      if (next) next.focus();
    });

    $("fLocBtn").addEventListener("click", () => {
      const status = $("fLocStatus");
      if (!navigator.geolocation) { status.textContent = t.locUnsupported; return; }
      status.textContent = t.locating;
      navigator.geolocation.getCurrentPosition(p => {
        draft.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        saveDraft();
        if (document.body.contains(status)) { status.textContent = L().locSet; renderPreview(); }
      }, () => {
        if (document.body.contains(status)) status.textContent = draft.pos ? L().locSet : L().locFailed;
      }, { timeout: 10000 });
    });

    $("fPhotos").addEventListener("change", async e => {
      const input = e.target;
      const all = Array.from(input.files || []);
      const files = all.filter(f => /^image\//.test(f.type));
      input.value = "";
      const room = MAX_PHOTOS - draft.photos.length - pendingPhotos;
      const take = files.slice(0, Math.max(0, room));
      const notes = [];
      if (files.length > take.length) notes.push(t.photosLimit);
      let bad = all.length - files.length;
      if (!take.length) {
        if (bad) notes.push(t.photosBad);
        $("photoStatus").textContent = notes.join(" ");
        return;
      }
      pendingPhotos += take.length;
      updateSubmit();
      for (const f of take) {
        const data = await shrinkImage(f);
        pendingPhotos--;
        if (data && draft.photos.length < MAX_PHOTOS) draft.photos.push(data); else if (!data) bad++;
      }
      if (bad) notes.push(t.photosBad);
      if (!document.body.contains(form)) return;
      $("photoStatus").textContent = notes.join(" ");
      updateSubmit();
      renderThumbs();
      renderPreview();
    });
    $("thumbs").addEventListener("click", e => {
      const b = e.target.closest("[data-photo]");
      if (!b) return;
      draft.photos.splice(Number(b.dataset.photo), 1);
      renderThumbs();
      renderPreview();
      $("fPhotos").focus();
    });

    function validate() {
      const errors = {};
      if (!draft.name.trim()) errors.fName = t.errName;
      if (!CATEGORIES.some(c => c.id === draft.category)) errors.fCategory = t.errCategory;
      if (!draft.address.trim()) errors.fAddress = t.errAddress;
      if (!validPhone(draft.phone)) errors.fPhone = t.errPhone;
      if (draft.email.trim() && !EMAIL_RE.test(draft.email.trim())) errors.fEmail = t.errEmail;
      draft.hours.forEach((h, i) => {
        if (h.closed) return;
        // closing up to 06:00 counts as "after midnight"
        const ok = TIME_RE.test(h.from) && TIME_RE.test(h.to) && h.from !== h.to && (h.to > h.from || h.to <= "06:00");
        if (!ok) errors["hours-" + i] = t.errHours;
      });
      return errors;
    }
    function showValidation(errors, focusFirst) {
      ["fName", "fCategory", "fAddress", "fPhone", "fEmail"].forEach(id => {
        const el = $(id), msg = $("err-" + id);
        el.setAttribute("aria-invalid", errors[id] ? "true" : "false");
        msg.hidden = !errors[id];
        msg.textContent = errors[id] || "";
      });
      draft.hours.forEach((h, i) => {
        const msg = $("err-hours-" + i);
        const row = msg.closest(".hours-row");
        const e = errors["hours-" + i];
        msg.hidden = !e;
        msg.textContent = e || "";
        row.querySelectorAll('input[type="time"]').forEach(inp => {
          inp.setAttribute("aria-invalid", e ? "true" : "false");
          if (e) inp.setAttribute("aria-describedby", "err-hours-" + i); else inp.removeAttribute("aria-describedby");
        });
      });
      const keys = Object.keys(errors);
      const box = $("formError");
      box.hidden = !keys.length;
      box.textContent = keys.length ? t.errSummary : "";
      if (focusFirst && keys.length) {
        const first = keys[0].startsWith("hours-")
          ? form.querySelector(`.hours-row[data-day="${keys[0].slice(6)}"] input[type="time"]`)
          : $(keys[0]);
        if (first) first.focus();
      }
    }

    let submitting = false;
    form.addEventListener("submit", e => {
      e.preventDefault();
      if (pendingPhotos > 0 || submitting) return;
      collect();
      const errors = validate();
      showErrors = true;
      showValidation(errors, true);
      if (Object.keys(errors).length) return;

      const shop = draftToShop();
      shop.id = editing ? editing.id : "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const saved = cleanShop(shop, true);
      const current = loadMyShops(); // re-read: another tab may have changed it
      const next = (editing && current.some(s => s.id === saved.id)
        ? current.map(s => s.id === saved.id ? saved : s)
        : [saved].concat(current)).map(toStored);
      submitting = true;
      const err = store.save("localStorage", STORE_KEY, next);
      if (err) {
        submitting = false;
        const box = $("formError");
        box.textContent = err === "full" ? t.errStorageFull : t.errStorageBlocked;
        box.hidden = false;
        return;
      }
      myShops = loadMyShops();
      draft = emptyDraft();
      showErrors = false;
      store.del("sessionStorage", DRAFT_KEY);
      store.save("sessionStorage", NOTICE_KEY, { id: saved.id, kind: editing ? "edit" : "new" });
      location.replace("#/shop/" + encodeURIComponent(saved.id));
    });
  }

  function draftToShop() {
    const shop = {
      id: "preview",
      name: draft.name.trim(), category: draft.category, about: draft.about.trim(),
      address: draft.address.trim(), phone: draft.phone.trim(), email: draft.email.trim(),
      tz: DEFAULT_TZ,
      hours: draft.hours.map(h => h.closed || !TIME_RE.test(h.from) || !TIME_RE.test(h.to) || h.from === h.to ? null : [h.from, h.to]),
      services: draft.services.map(s => ({ name: s.name.trim(), price: Math.max(0, Number(s.price) || 0), minutes: Math.max(0, Math.round(Number(s.minutes) || 0)) })).filter(s => s.name),
      photos: draft.photos.slice()
    };
    if (draft.pos) { shop.lat = draft.pos.lat; shop.lng = draft.pos.lng; }
    return shop;
  }

  // Resize a picked photo so it fits in local storage (~800px, WebP when the browser can).
  function shrinkImage(file) {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, 800 / Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#fff"; // transparent logos stay white, not black
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          let out = canvas.toDataURL("image/webp", 0.72);
          if (!out.startsWith("data:image/webp")) out = canvas.toDataURL("image/jpeg", 0.72);
          resolve(out);
        } catch (e) { resolve(null); }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  /* ------------------------------------------------------------ routing & chrome */
  function currentRoute() {
    const h = location.hash;
    if (h.startsWith("#/shop/")) return "shop";
    if (h.startsWith("#/edit/")) return "edit";
    if (h === "#/new") return "new";
    return "home";
  }
  function routeId(prefix) {
    try { return decodeURIComponent(location.hash.slice(prefix.length)); } catch (e) { return ""; }
  }

  function renderChrome() {
    const t = L();
    const route = currentRoute();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.getElementById("skipLink").textContent = t.skip;
    document.getElementById("brandName").textContent = tx(window.APP_NAME);
    const nav = document.getElementById("navNew");
    nav.innerHTML = `${ICON.plus}<span class="label-long">${esc(t.ownerBtn)}</span><span class="label-short">${esc(t.ownerBtnShort)}</span>`;
    if (route === "new") nav.setAttribute("aria-current", "page"); else nav.removeAttribute("aria-current");
    const lb = document.getElementById("langBtn");
    lb.textContent = t.langBtn;
    lb.setAttribute("aria-label", t.langLabel);
    lb.lang = lang === "he" ? "en" : "he";
  }

  function render(opts) {
    renderChrome();
    const route = currentRoute();
    if (route === "shop") renderShop(routeId("#/shop/"));
    else if (route === "edit") renderForm(routeId("#/edit/"));
    else if (route === "new") renderForm("");
    else renderHome();

    if (opts && opts.focus) {
      let target = null;
      if (route === "home" && opts.fromShop && lastShopId) {
        target = Array.from(app.querySelectorAll(".card")).find(a => a.getAttribute("href") === "#/shop/" + encodeURIComponent(lastShopId)) || null;
      }
      (target || app.querySelector("h1") || app).focus({ preventScroll: true });
    }
    firstRender = false;
    lastRoute = route;
  }

  // "All places" goes *back* when we came from the list, so the list keeps its place.
  let cameFromHome = false;
  document.addEventListener("click", e => {
    const back = e.target.closest("[data-back]");
    if (back && cameFromHome && currentRoute() !== "home") {
      e.preventDefault();
      history.back();
    }
  });
  window.addEventListener("scroll", () => {
    if (currentRoute() === "home" && lastRoute === "home") homeScrollY = window.scrollY;
  }, { passive: true });

  document.getElementById("langBtn").addEventListener("click", () => {
    const form = document.getElementById("shopForm");
    if (form && form._collect) form._collect(); // keep what the owner typed
    lang = lang === "he" ? "en" : "he";
    store.save("localStorage", LANG_KEY, lang);
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    document.getElementById("langBtn").focus();
  });

  window.addEventListener("hashchange", () => {
    const from = lastRoute;
    const to = currentRoute();
    if (to === "home") cameFromHome = false;
    else if (from === "home") cameFromHome = true;
    render({ focus: true, fromShop: from === "shop" });
    if (to === "home" && from && from !== "home") window.scrollTo(0, homeScrollY);
    else window.scrollTo(0, 0);
  });

  // Keep "Open / Closed" honest while the page stays open.
  function refreshOpenState() {
    const route = currentRoute();
    const grid = document.getElementById("grid");
    if (route === "home" && grid && !grid.contains(document.activeElement)) updateResults(false);
    const st = document.getElementById("shopStatus");
    if (route === "shop" && st) {
      const shop = allShops().find(s => s.id === st.dataset.id);
      if (shop) { const os = openState(shop); st.innerHTML = statusPill(os) + " <span>" + esc(stateDetail(os)) + "</span>"; }
    }
  }
  setInterval(refreshOpenState, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshOpenState(); });
  window.addEventListener("storage", e => {
    if (e.key === STORE_KEY) { myShops = loadMyShops(); if (currentRoute() === "home" || currentRoute() === "shop") render(); }
  });

  render();
})();

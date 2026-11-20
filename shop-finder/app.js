/* Nearby — local shop & clinic finder (front-end prototype, no server yet). */
(function () {
  "use strict";

  const STORE_KEY = "nearby.myShops";
  const LANG_KEY = "nearby.lang";
  const DRAFT_PREFIX = "nearby.draft."; // + "new" or "edit.<id>": one draft per form
  const OLD_KEYS = ["nearby.draft", "nearby.notice"];
  const MAX_PHOTOS = 4;
  const DEFAULT_TZ = "Asia/Jerusalem";
  const DEMO_POS = { lat: 32.0753, lng: 34.7749 }; // Dizengoff Center, for trying "near me" without location access

  /* ------------------------------------------------------------ texts */
  const TEXT = {
    en: {
      skip: "Skip to content",
      ownerBtn: "Open your shop", ownerBtnShort: "Add shop",
      langBtn: "עב", langLabel: "עב — החלפה לעברית",
      eyebrow: n => n + " local spots listed",
      openSign: "Open",
      heroA: "Great work,", heroEm: "around the corner.",
      heroSub: "Barbers, salons and clinics near you — including the small ones you'd walk right past.",
      searchPh: "Barber, nails, street…", searchLabel: "Search shops, services or streets",
      nearMe: "Near me", allCats: "All", catsLabel: "Categories",
      places: n => n === 1 ? "1 place" : n + " places",
      locating: "Finding your location…", locOn: "Sorted by distance from you",
      locDenied: "Location is off — allow it in your browser to see what's closest.",
      locUnavailable: "Couldn't find your location right now — try again in a moment.",
      locUnsupported: "Your browser can't share location.",
      demoSpot: "Try a demo spot in Tel Aviv", locDemo: "Sorted by distance from a demo spot in Tel Aviv",
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
      allDay: "Open 24 hours", allDayShort: "24 hours",
      from: "from ",
      ctaTitle: "Own a small shop or clinic?",
      ctaText: "Get seen by people around the corner. Add your prices, hours and photos in a few minutes.",
      ctaBtn: "Open your shop",
      back: "All places", about: "About", services: "Services & prices", hours: "Opening hours",
      contact: "Contact & location", call: "Call", email: "Email", directions: "Directions",
      waze: "Navigate with Waze", whatsapp: "WhatsApp", share: "Share", copied: "Link copied",
      copyThis: "Copy this link:", close: "Close",
      newTab: "(opens in a new tab)", photos: "Photos",
      prevPhoto: "Previous photo", nextPhoto: "Next photo",
      today: "Today", min: m => m + " min", km: "km", m: "m",
      notFound: "We couldn't find this place.", notFoundSub: "It may have been removed.",
      deletedTab: "This shop was deleted in another tab.",
      ownerOnly: "Only the owner can edit this shop.", ownerOnlySub: "A shop can be edited on the device it was created on.", viewShop: "View the shop",
      yourShop: "This is your shop",
      edit: "Edit my shop", remove: "Delete my shop", removeConfirm: "Delete this shop? This can't be undone.",
      removeYes: "Yes, delete it", removeNo: "Keep my shop",
      published: "Your shop is live! This is how customers see it.", saved: "Changes saved.", removed: "Your shop was deleted.",
      photoAlt: (name, i) => name + " — photo " + i,
      formTitle: "Open your shop", editTitle: "Edit your shop",
      formSub: "Tell customers what you do, when you're open and what it costs. Your page goes live right away.",
      editSub: "Update anything — customers see the changes right away.",
      demoNote: "Prototype: shops you add are saved only on this device for now.",
      step1: "The basics", step2: "Contact & location", step3: "Opening hours", step4: "Services & prices", step5: "Photos",
      fName: "Shop name", fCategory: "Category", fCategoryPh: "Choose a category", fAbout: "About the shop",
      fAboutHelp: "A sentence or two: what you're great at.",
      fAddress: "Address", fPhone: "Phone", fEmail: "Email", optional: "optional",
      fLocation: "Map location", useLocation: "I'm at the shop — use this spot", locSet: "Location saved",
      locNone: "Not set — customers won't see how far you are, and you won't appear in distance filters.",
      locFailed: "Couldn't get the location. Check the browser permission.",
      dayClosed: "Closed", day24: "24 hours", hoursFrom: d => d + " — opening time", hoursTo: d => d + " — closing time",
      copyHours: "Same hours every open day", copyHoursHelp: "Copies the first open day's hours to the others.",
      svcName: "Service", svcPrice: "Price (₪)", svcMin: "Minutes", addService: "Add a service",
      removeService: n => "Remove service " + n,
      photosHelp: "Up to " + MAX_PHOTOS + " photos. The first one is your cover.",
      choosePhotos: "Choose photos", photosDrop: "JPG or PNG from your phone or computer",
      removePhoto: n => "Remove photo " + n, photosProcessing: "Preparing photos…",
      photosLimit: "Only " + MAX_PHOTOS + " photos fit — the extra ones were skipped.",
      photosBad: "Some files couldn't be read as images and were skipped.",
      photosNotKept: n => (n === 1 ? "1 photo wasn't" : n + " photos weren't") + " kept when the page reloaded — please add again.",
      photosReset: "Photo changes weren't kept when the page reloaded — these are your saved photos.",
      draftKept: "We kept what you typed earlier.", startOver: "Start over",
      draftEdits: "You have unsaved changes from earlier.", discard: "Discard changes",
      previewLabel: "Customers will see:", previewName: "Your shop name", previewAddr: "Your address",
      publish: "Publish my shop", saveChanges: "Save changes", cancel: "Cancel",
      errSummary: "Please fix the highlighted fields.",
      errName: "Enter your shop's name.", errCategory: "Choose a category.", errAddress: "Enter an address.",
      errPhone: "Enter a valid phone number (9–15 digits).", errEmail: "Enter a valid email or leave it empty.",
      errHours: "Closing time must be after opening time (closing up to 06:00 counts as after midnight). Open around the clock? Tick “24 hours”.",
      errSvcName: "Give this service a name, or clear its price and minutes.",
      errSvcPrice: "Price must be a whole number from 0 to 100,000.",
      errSvcMin: "Minutes must be a whole number from 1 to 1,440.",
      errDeleted: "This shop was deleted in another tab, so the changes weren't saved.",
      errStorageFull: "This device's storage is full. Delete an older shop or use fewer photos, then try again.",
      errStorageBlocked: "This browser is blocking saved data (private mode?), so the shop can't be saved.",
      titleHome: "Nearby — great local shops & clinics", titleNew: "Open your shop — Nearby", titleEdit: "Edit your shop — Nearby"
    },
    he: {
      skip: "דילוג לתוכן",
      ownerBtn: "פתיחת עסק", ownerBtnShort: "פתיחת עסק",
      langBtn: "EN", langLabel: "EN — Switch to English",
      eyebrow: n => n + " עסקים מקומיים באפליקציה",
      openSign: "פתוח",
      heroA: "עבודה מעולה,", heroEm: "ממש מעבר לפינה.",
      heroSub: "מספרות, סלונים וקליניקות קרוב אליך — כולל הקטנים שעוברים לידם בלי לשים לב.",
      searchPh: "מספרה, ציפורניים, רחוב…", searchLabel: "חיפוש עסקים, שירותים או רחובות",
      nearMe: "סביבי", allCats: "הכול", catsLabel: "קטגוריות",
      places: n => n === 1 ? "מקום אחד" : n + " מקומות",
      locating: "מאתרים את המיקום שלך…", locOn: "ממוין לפי מרחק ממך",
      locDenied: "המיקום כבוי — אפשרו אותו בדפדפן כדי לראות מה הכי קרוב.",
      locUnavailable: "לא הצלחנו למצוא את המיקום כרגע — נסו שוב בעוד רגע.",
      locUnsupported: "הדפדפן לא יכול לשתף מיקום.",
      demoSpot: "לנסות עם נקודת דמו בתל אביב", locDemo: "ממוין לפי מרחק מנקודת דמו בתל אביב",
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
      allDay: "פתוח 24 שעות", allDayShort: "24 שעות",
      from: "החל מ־",
      ctaTitle: "יש לך עסק קטן או קליניקה?",
      ctaText: "תנו לאנשים מהשכונה לגלות אתכם. מוסיפים מחירים, שעות ותמונות תוך כמה דקות.",
      ctaBtn: "פתיחת עסק",
      back: "כל המקומות", about: "אודות", services: "שירותים ומחירים", hours: "שעות פתיחה",
      contact: "יצירת קשר ומיקום", call: "חיוג", email: "מייל", directions: "ניווט",
      waze: "ניווט עם Waze", whatsapp: "וואטסאפ", share: "שיתוף", copied: "הקישור הועתק",
      copyThis: "העתיקו את הקישור:", close: "סגירה",
      newTab: "(נפתח בכרטיסייה חדשה)", photos: "תמונות",
      prevPhoto: "התמונה הקודמת", nextPhoto: "התמונה הבאה",
      today: "היום", min: m => m + " דק׳", km: "ק״מ", m: "מ׳",
      notFound: "לא מצאנו את המקום הזה.", notFoundSub: "ייתכן שהוא הוסר.",
      deletedTab: "העסק נמחק בכרטיסייה אחרת.",
      ownerOnly: "רק הבעלים יכולים לערוך את העסק הזה.", ownerOnlySub: "אפשר לערוך עסק במכשיר שבו הוא נוצר.", viewShop: "לדף העסק",
      yourShop: "זה העסק שלך",
      edit: "עריכת העסק", remove: "מחיקת העסק שלי", removeConfirm: "למחוק את העסק? אי אפשר לבטל את זה.",
      removeYes: "כן, למחוק", removeNo: "להשאיר את העסק",
      published: "העסק שלך באוויר! כך הלקוחות רואים אותו.", saved: "השינויים נשמרו.", removed: "העסק שלך נמחק.",
      photoAlt: (name, i) => name + " — תמונה " + i,
      formTitle: "פתיחת עסק", editTitle: "עריכת העסק",
      formSub: "ספרו ללקוחות מה אתם עושים, מתי אתם פתוחים וכמה זה עולה. הדף עולה לאוויר מיד.",
      editSub: "אפשר לעדכן הכול — הלקוחות רואים את השינויים מיד.",
      demoNote: "אב-טיפוס: עסקים שתוסיפו נשמרים בינתיים רק במכשיר הזה.",
      step1: "הבסיס", step2: "יצירת קשר ומיקום", step3: "שעות פתיחה", step4: "שירותים ומחירים", step5: "תמונות",
      fName: "שם העסק", fCategory: "קטגוריה", fCategoryPh: "בחרו קטגוריה", fAbout: "על העסק",
      fAboutHelp: "משפט או שניים: במה אתם הכי טובים.",
      fAddress: "כתובת", fPhone: "טלפון", fEmail: "מייל", optional: "לא חובה",
      fLocation: "מיקום במפה", useLocation: "אני בעסק — להשתמש במיקום הזה", locSet: "המיקום נשמר",
      locNone: "לא הוגדר — לקוחות לא יראו כמה אתם רחוקים, והעסק לא יופיע בסינון לפי מרחק.",
      locFailed: "לא הצלחנו לקבל מיקום. בדקו את הרשאת הדפדפן.",
      dayClosed: "סגור", day24: "24 שעות", hoursFrom: d => d + " — שעת פתיחה", hoursTo: d => d + " — שעת סגירה",
      copyHours: "אותן שעות לכל הימים הפתוחים", copyHoursHelp: "מעתיק את השעות של היום הפתוח הראשון לשאר הימים.",
      svcName: "שירות", svcPrice: "מחיר (₪)", svcMin: "דקות", addService: "הוספת שירות",
      removeService: n => "הסרת שירות " + n,
      photosHelp: "עד " + MAX_PHOTOS + " תמונות. הראשונה תהיה תמונת השער.",
      choosePhotos: "בחירת תמונות", photosDrop: "JPG או PNG מהטלפון או מהמחשב",
      removePhoto: n => "הסרת תמונה " + n, photosProcessing: "מכינים את התמונות…",
      photosLimit: "נכנסות רק " + MAX_PHOTOS + " תמונות — השאר לא נוספו.",
      photosBad: "חלק מהקבצים אינם תמונות תקינות ולא נוספו.",
      photosNotKept: n => (n === 1 ? "תמונה אחת לא נשמרה" : n + " תמונות לא נשמרו") + " כשהדף נטען מחדש — הוסיפו שוב.",
      photosReset: "שינויי התמונות לא נשמרו כשהדף נטען מחדש — אלה התמונות השמורות שלך.",
      draftKept: "שמרנו את מה שהקלדתם קודם.", startOver: "להתחיל מחדש",
      draftEdits: "יש לך שינויים שלא נשמרו מקודם.", discard: "ביטול השינויים",
      previewLabel: "כך הלקוחות יראו אתכם:", previewName: "שם העסק שלך", previewAddr: "הכתובת שלך",
      publish: "פרסום העסק", saveChanges: "שמירת השינויים", cancel: "ביטול",
      errSummary: "יש לתקן את השדות המסומנים.",
      errName: "הזינו את שם העסק.", errCategory: "בחרו קטגוריה.", errAddress: "הזינו כתובת.",
      errPhone: "הזינו מספר טלפון תקין (9–15 ספרות).", errEmail: "הזינו מייל תקין או השאירו ריק.",
      errHours: "שעת הסגירה חייבת להיות אחרי שעת הפתיחה (סגירה עד 06:00 נחשבת אחרי חצות). פתוחים מסביב לשעון? סמנו „24 שעות”.",
      errSvcName: "תנו שם לשירות, או מחקו את המחיר והדקות.",
      errSvcPrice: "המחיר צריך להיות מספר שלם בין 0 ל־100,000.",
      errSvcMin: "הדקות צריכות להיות מספר שלם בין 1 ל־1,440.",
      errDeleted: "העסק נמחק בכרטיסייה אחרת, ולכן השינויים לא נשמרו.",
      errStorageFull: "האחסון במכשיר מלא. מחקו עסק ישן או השתמשו בפחות תמונות, ונסו שוב.",
      errStorageBlocked: "הדפדפן חוסם שמירת נתונים (גלישה פרטית?), ולכן אי אפשר לשמור את העסק.",
      titleHome: "קרוב אליי — עסקים וקליניקות מעולים בשכונה", titleNew: "פתיחת עסק — קרוב אליי", titleEdit: "עריכת העסק — קרוב אליי"
    }
  };

  /* ------------------------------------------------------------ icons */
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
  const isAllDay = h => !!h && h[0] === h[1]; // same opening and closing time = open 24 hours
  const ALL_DAY = ["00:00", "00:00"];

  // Language of owner-written text, so screen readers use the right voice.
  const textLang = s => {
    const he = (String(s).match(/[\u0590-\u05FF]/g) || []).length;
    const latin = (String(s).match(/[A-Za-z]/g) || []).length;
    return he || latin ? (he >= latin ? "he" : "en") : "";
  };
  const langAttr = s => { const l = textLang(s); return l && l !== lang ? ` lang="${l}"` : ""; };

  // Owner text with web addresses turned into links (everything else escaped).
  function linkify(text) {
    const re = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
    let out = "", last = 0, m;
    while ((m = re.exec(text))) {
      let url = m[0].replace(/[.,;:!?)\]}'"»]+$/, "");
      const href = /^www\./i.test(url) ? "https://" + url : url;
      let ok = false;
      try { ok = /^https?:$/.test(new URL(href).protocol); } catch (e) { ok = false; }
      if (!ok || !url) continue;
      out += esc(text.slice(last, m.index)) +
        `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer nofollow ugc" dir="ltr">${esc(url)}<span class="sr-only"> ${esc(L().newTab)}</span></a>`;
      last = m.index + url.length;
      re.lastIndex = last;
    }
    return out + esc(text.slice(last));
  }

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

  const CATEGORIES = (window.CATEGORIES || []).map(c => Object.assign({}, c, { color: HEX_RE.test(c.color) ? c.color : "#5B5B7A" }));
  const OTHER = { id: "", emoji: "🏪", color: "#5B5B7A", name: { en: "Other", he: "אחר" } };
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
        if (!(Array.isArray(h) && TIME_RE.test(h[0]) && TIME_RE.test(h[1]))) return null;
        return h[0] === h[1] ? ALL_DAY.slice() : [h[0], h[1]];
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
  let homeSig = "";
  let pageNotice = null;   // { hash, kind } — "Your shop is live" etc., shown until you leave that page

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

  function minPrice(shop) {
    const prices = shop.services.map(s => s.price).filter(p => p > 0);
    return prices.length ? Math.min(...prices) : null;
  }
  function searchText(shop) {
    if (shop._hay) return shop._hay;
    const both = v => (v && typeof v === "object") ? v.en + " " + v.he : (v || "");
    const cat = category(shop.category);
    shop._hay = " " + normalizeText([both(shop.name), both(shop.about), both(shop.address), both(cat.name), both(cat.keywords),
      shop.services.map(s => both(s.name)).join(" ")].join(" ")).split(/\s+/).filter(Boolean).join(" ") + " ";
    return shop._hay;
  }
  // A Hebrew word may carry a one-letter prefix (ה, ו, ב, ל, מ, ש, כ): "המספרה" should find "מספרה".
  // The shortened word must then be a whole word (or, from 4 letters, the start of one), so
  // "כאבי" does not match "אבי" inside "תל אביב".
  function wordMatches(hay, w) {
    if (hay.includes(w)) return true;
    if (w.length < 4 || !HE_PREFIX.test(w)) return false;
    const rest = w.slice(1);
    return hay.includes(" " + rest + " ") || (rest.length >= 4 && hay.includes(" " + rest));
  }

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
    const summary = [shop.mine && !preview ? t.yours : "", tx(cat.name), (st.open ? t.open : t.closed) + ", " + stateDetail(st), hasDist ? formatDistance(dist) : "", price !== null ? t.from + money(price) : ""].filter(Boolean).join(" · ");
    return `
      <${tag} class="card"${linkAttrs} style="--c:${cat.color};--i:${Math.min(i, 12)}">
        <div class="card-media">
          <div class="window${photo ? " has-photo" : ""}" aria-hidden="true">
            ${photo ? `<img src="${esc(photo)}" alt="" loading="lazy" decoding="async">` : `<span class="ph-icon">${catIcon(cat)}</span>`}
            ${shop.mine && !preview ? `<span class="pill mine">${esc(t.yours)}</span>` : ""}
          </div>
          <div class="card-top">
            <span class="badge" aria-hidden="true">${catIcon(cat)}</span>
            <h3 id="${uid}-n"><bdi${langAttr(name)}>${esc(name)}</bdi></h3>
            <span class="card-cat">${esc(tx(cat.name))}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="card-foot">
            <span class="foot-status">${statusPill(st)}</span>
            ${hasDist ? `<span class="dist">${ICON.pin}<span>${esc(formatDistance(dist))}</span></span>` : ""}
          </div>
          <p class="hint-small">${esc(stateDetail(st))}</p>
          <p class="card-meta"><span class="meta-in">${price !== null ? `<span class="from">${esc(t.from)}<b>${esc(money(price))}</b></span>` : ""}<span class="card-addr"><bdi${langAttr(addr)}>${esc(addr)}</bdi></span></span></p>
          <span class="card-cta" aria-hidden="true"><span>${esc(t.viewShop)}</span>${ICON.chevron}</span>
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
    const catTile = (c, label, n, extraClass, icon) => `
      <button class="shopfront ${extraClass || ""}" type="button" data-cat="${esc(c ? c.id : "")}" aria-pressed="${filter.category === (c ? c.id : "")}">
        <span class="tile-icon" aria-hidden="true">${icon}</span>
        <span class="name">${esc(label)}</span>
        <span class="n" data-count="${esc(c ? c.id : "")}">${esc(t.places(n))}</span>
      </button>`;

    app.innerHTML = `
      ${noticeHtml()}
      <section class="hero">
        <p class="eyebrow fade-in" id="eyebrow"><span class="dot" aria-hidden="true"></span><span>${esc(t.eyebrow(shops.length))}</span></p>
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
            ${awningSvg("store-awning")}
            <div class="facade">
              <div class="pane">${ICON.scissors}</div>
              <div class="door"><span class="sign">${esc(t.openSign)}</span></div>
              <div class="pane">${ICON.polish}</div>
            </div>
            <div class="step"></div>
            <span class="plant">${ICON.leaf}</span>
          </div>
        </div>
      </section>
      <div class="street" id="street" role="group" aria-label="${esc(t.catsLabel)}">
        ${catTile(null, t.allCats, shops.length, "all", ICON.grid)}
        ${CATEGORIES.map(c => catTile(c, tx(c.name), counts[c.id] || 0, "", catIcon(c))).join("")}
      </div>
      <section aria-labelledby="resultsTitle">
        <div class="toolbar">
          <div>
            <h2 id="resultsTitle" tabindex="-1"></h2>
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
          <button class="btn btn-ghost btn-sm demo-btn" type="button" id="demoBtn" hidden>${ICON.locate}${esc(t.demoSpot)}</button>
        </div>
        <div class="grid" id="grid"></div>
      </section>
      <section class="owner-cta">
        <div class="cta-text">
          <h2>${esc(t.ctaTitle)}</h2>
          <p>${esc(t.ctaText)}</p>
        </div>
        <a class="btn" href="#/new">${esc(t.ctaBtn)}${ICON.arrow}</a>
        <div class="cta-art" aria-hidden="true">${awningSvg("cta-awning")}<span class="cta-body"><span class="cta-win"></span><span class="cta-door"></span></span></div>
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
      // moving focus (not blur) closes the phone keyboard and keeps screen readers in place
      const title = document.getElementById("resultsTitle");
      title.focus({ preventScroll: true });
      title.scrollIntoView({ block: "start" });
    });
    const street = document.getElementById("street");
    street.addEventListener("click", e => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      // pressing the selected category again turns it off (back to "All")
      filter.category = filter.category === b.dataset.cat ? "" : b.dataset.cat;
      updateResults(true);
    });
    // keep a focused tile clear of the faded edge
    street.addEventListener("focusin", e => {
      const b = e.target.closest(".shopfront");
      if (b && street.scrollWidth > street.clientWidth) b.scrollIntoView({ inline: "nearest", block: "nearest" });
    });
    document.getElementById("radius").addEventListener("change", e => { filter.radius = Number(e.target.value) || 0; updateResults(true); });
    document.getElementById("openBtn").addEventListener("click", () => { filter.openNow = !filter.openNow; updateResults(true); });
    document.getElementById("nearBtn").addEventListener("click", toggleNearMe);
    document.getElementById("demoBtn").addEventListener("click", () => {
      locToken++;
      userPos = Object.assign({}, DEMO_POS);
      locState = "demo";
      updateResults(true);
      document.getElementById("nearBtn").focus();
    });
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

  // What the list shows right now; the minute refresh only redraws when this changes.
  const resultsSignature = list => lang + "|" + list.map(({ shop, dist }) => { const st = openState(shop); return shop.id + ":" + st.open + ":" + stateDetail(st) + ":" + (dist === null ? "" : formatDistance(dist)); }).join(",");
  const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };

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
    setText(document.getElementById("resultsTitle"), cat ? tx(cat.name) : (userPos ? t.nearYou : t.allShops));
    setText(document.getElementById("count"), t.results(list.length));
    const status = document.getElementById("locStatus");
    setText(status, { locating: t.locating, on: t.locOn, demo: t.locDemo, denied: t.locDenied, unavailable: t.locUnavailable, unsupported: t.locUnsupported }[locState] || "");
    const failed = locState === "denied" || locState === "unavailable" || locState === "unsupported";
    status.classList.toggle("warn", failed);
    document.getElementById("demoBtn").hidden = !failed;

    homeSig = resultsSignature(list);
    grid.classList.toggle("calm", !animate);
    grid.innerHTML = list.length
      ? list.map(({ shop, dist }, i) => cardHtml(shop, dist, i)).join("")
      : `<div class="empty"><span class="big" aria-hidden="true">${ICON.search}</span><h3>${esc(t.emptyTitle)}</h3><p>${esc(t.empty)}</p>
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
    }, err => {
      if (token !== locToken) return;
      // only a refused permission is the browser setting; no fix or a timeout is worth retrying
      locState = err && err.code === 1 ? "denied" : "unavailable";
      updateResults(false);
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  /* ------------------------------------------------------------ notices */
  function noticeHtml() {
    if (!pageNotice || pageNotice.hash !== normHash(location.hash)) return "";
    const t = L();
    const text = { edit: t.saved, removed: t.removed }[pageNotice.kind] || t.published;
    return `<p class="note fade-in" id="pageNote"><span class="note-icon" aria-hidden="true">${pageNotice.kind === "removed" ? ICON.trash : ICON.check}</span><span>${esc(text)}</span></p>`;
  }
  // Screen readers hear changes in a live region that already exists, so we use one fixed region.
  let announceTimer = 0;
  function announce(text) {
    const box = document.getElementById("announcer");
    if (!box) return;
    box.textContent = "";
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { box.textContent = text; }, 150);
  }
  let toastTimer = 0;
  function showToast(html, opts) {
    const box = document.getElementById("toast");
    if (!box) return;
    clearTimeout(toastTimer);
    box.innerHTML = html;
    box.hidden = false;
    box.classList.toggle("has-bar", !!document.querySelector(".action-bar"));
    if (!(opts && opts.sticky)) toastTimer = setTimeout(hideToast, 3200);
  }
  function hideToast() {
    const box = document.getElementById("toast");
    if (box) { box.hidden = true; box.innerHTML = ""; }
  }

  /* ------------------------------------------------------------ shop page */
  const backLink = () => `<a class="back" href="#/" data-back>${ICON.back}<span>${esc(L().back)}</span></a>`;

  function renderNotFound(title, sub, link) {
    const t = L();
    document.title = (title || t.notFound) + " — " + tx(window.APP_NAME);
    app.innerHTML = `${backLink()}
      <div class="empty"><span class="big" aria-hidden="true">${link ? ICON.lock : ICON.store}</span><h1 tabindex="-1">${esc(title || t.notFound)}</h1><p>${esc(sub || t.notFoundSub)}</p>
        ${link ? `<a class="btn" href="${esc(link)}">${esc(t.viewShop)}</a>` : `<a class="btn" href="#/" data-back>${esc(t.back)}</a>`}</div>`;
  }

  function hoursListHtml(shop) {
    const t = L();
    const today = nowIn(shop.tz).day;
    return `<ul class="hours-list" id="hoursList" data-day="${today}">
      ${shop.hours.map((h, i) => `<li class="${i === today ? "today" : ""}"${i === today ? ' aria-current="date"' : ""}><span>${esc(dayName(i))}${i === today ? ` <span class="today-tag">${esc(t.today)}</span>` : ""}</span>${
        !h ? `<span class="off">${esc(t.closed)}</span>` : isAllDay(h) ? `<span>${esc(t.allDayShort)}</span>` : `<span class="t">${esc(h[0])}–${esc(h[1])}</span>`}</li>`).join("")}
    </ul>`;
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
    const hasPos = shop.lat !== undefined;
    const mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(hasPos ? shop.lat + "," + shop.lng : tx(shop.address));
    const wazeUrl = hasPos ? "https://waze.com/ul?ll=" + encodeURIComponent(shop.lat + "," + shop.lng) + "&navigate=yes" : "";
    const tel = phoneDigits(shop.phone);
    const wa = whatsappNumber(shop.phone);

    const callBtn = cls => tel ? `<a class="btn ${cls}" href="tel:${esc(tel)}">${ICON.phone}${esc(t.call)}</a>` : "";
    const dirBtn = cls => `<a class="btn ${cls}" href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer">${ICON.map}${esc(t.directions)}${newTabNote()}</a>`;
    const shareBtn = (cls, iconOnly) => `<button class="btn ${cls}" type="button" data-share${iconOnly ? ` aria-label="${esc(t.share)}"` : ""}>${ICON.share}${iconOnly ? "" : esc(t.share)}</button>`;
    const multi = shop.photos.length > 1;

    const about = tx(shop.about);

    app.innerHTML = `
      <div class="shop-page">
        ${backLink()}
        ${noticeHtml()}
        ${shop.mine ? `<div class="owner-bar fade-in">
            <span class="owner-tag">${esc(t.yourShop)}</span>
            <span class="owner-actions" id="ownerActions">
              <a class="btn btn-sm" href="#/edit/${encodeURIComponent(shop.id)}">${ICON.edit}${esc(t.edit)}</a>
              <button class="btn btn-danger btn-sm" type="button" id="removeBtn">${ICON.trash}${esc(t.remove)}</button>
            </span>
            <div class="confirm-box" id="confirmBox" role="group" aria-labelledby="confirmText" hidden>
              <p id="confirmText">${esc(t.removeConfirm)}</p>
              <span class="owner-actions">
                <button class="btn btn-sm btn-confirm-danger" type="button" id="confirmRemove">${ICON.trash}${esc(t.removeYes)}</button>
                <button class="btn btn-sm" type="button" id="cancelRemove">${esc(t.removeNo)}</button>
              </span>
            </div>
            <p class="owner-error" id="ownerError" role="alert" hidden></p>
          </div>` : ""}
        <div class="shop-layout">
          <div class="shop-main">
            <article class="shop-hero fade-in" style="--c:${cat.color}">
              <div class="gallery-wrap">
                <div class="gallery ${multi ? "multi" : ""}" id="gallery"${multi ? ` tabindex="0" role="region" aria-label="${esc(t.photos)}"` : ""}>
                  ${shop.photos.length
                    ? shop.photos.map((p, i) => `<div class="window"><img class="backdrop" src="${esc(p)}" alt="" aria-hidden="true" decoding="async"><img class="photo" src="${esc(p)}" alt="${esc(t.photoAlt(name, i + 1))}" decoding="async"></div>`).join("")
                    : `<div class="window" aria-hidden="true"><span class="ph-icon">${catIcon(cat)}</span></div>`}
                </div>
                ${multi ? `<button class="gallery-btn prev" type="button" data-step="-1" aria-label="${esc(t.prevPhoto)}" aria-controls="gallery">${ICON.back}</button>
                  <button class="gallery-btn next" type="button" data-step="1" aria-label="${esc(t.nextPhoto)}" aria-controls="gallery">${ICON.back}</button>
                  <span class="gallery-count" id="galleryCount" aria-hidden="true">1 / ${shop.photos.length}</span>` : ""}
              </div>
              <div class="shop-title">
                <span class="logo-tile" aria-hidden="true">${catIcon(cat)}</span>
                <h1 tabindex="-1"><bdi${langAttr(name)}>${esc(name)}</bdi></h1>
                <p class="card-meta shop-sub"><span>${esc(tx(cat.name))}</span>${dist !== null ? `<span class="meta-dist"><span class="meta-icon" aria-hidden="true">${ICON.pin}</span><span>${esc(formatDistance(dist))}</span></span>` : ""}</p>
                <p class="card-meta" id="shopStatus" data-id="${esc(shop.id)}" data-sig="${esc(st.open + "|" + stateDetail(st))}">${statusPill(st)} <span>${esc(stateDetail(st))}</span></p>
                <div class="actions desktop-only">
                  ${callBtn("btn-accent")}
                  ${dirBtn("btn-ghost")}
                  ${shareBtn("btn-ghost")}
                </div>
              </div>
            </article>
            ${about ? `<section class="panel fade-in"><h2>${esc(t.about)}</h2><p class="about" dir="auto"${langAttr(about)}>${linkify(about)}</p></section>` : ""}
            ${shop.services.length ? `<section class="panel fade-in"><h2>${esc(t.services)}</h2><ul class="price-list">
              ${shop.services.map(s => `<li><span class="svc-icon" aria-hidden="true">${catIcon(cat)}</span><span class="svc"><bdi${langAttr(tx(s.name))}>${esc(tx(s.name))}</bdi></span>${s.minutes ? `<span class="dur">${ICON.clock}<span>${esc(t.min(s.minutes))}</span></span>` : ""}<span class="price">${s.price ? esc(money(s.price)) : "—"}</span></li>`).join("")}
            </ul></section>` : ""}
          </div>
          <aside class="shop-side">
            <section class="panel fade-in"><h2>${esc(t.hours)}</h2>${hoursListHtml(shop)}</section>
            <section class="panel fade-in"><h2>${esc(t.contact)}</h2><ul class="contact-list">
              <li><span class="c-icon" aria-hidden="true">${ICON.map}</span><a href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer"><bdi${langAttr(tx(shop.address))}>${esc(tx(shop.address))}</bdi>${newTabNote()}</a></li>
              ${wazeUrl ? `<li><span class="c-icon" aria-hidden="true">${ICON.nav}</span><a href="${esc(wazeUrl)}" target="_blank" rel="noopener noreferrer">${esc(t.waze)}${newTabNote()}</a></li>` : ""}
              ${tel ? `<li><span class="c-icon" aria-hidden="true">${ICON.phone}</span><a href="tel:${esc(tel)}"><bdi dir="ltr">${esc(shop.phone)}</bdi></a></li>` : ""}
              ${wa ? `<li><span class="c-icon" aria-hidden="true">${ICON.chat}</span><a href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener noreferrer">${esc(t.whatsapp)}${newTabNote()}</a></li>` : ""}
              ${shop.email ? `<li><span class="c-icon" aria-hidden="true">${ICON.mail}</span><a href="mailto:${esc(shop.email)}"><bdi dir="ltr">${esc(shop.email)}</bdi></a></li>` : ""}
            </ul></section>
          </aside>
        </div>
        <div class="action-bar">${callBtn("btn-accent")}${dirBtn(tel ? "btn-ghost" : "btn-accent")}${shareBtn("btn-ghost btn-icon", true)}</div>
      </div>`;

    app.querySelectorAll("[data-share]").forEach(b => b.addEventListener("click", async () => {
      const url = location.href;
      if (navigator.share) {
        try { await navigator.share({ title: name, url }); return; }
        catch (e) { if (e && e.name === "AbortError") return; /* refused (e.g. inside a frame): copy instead */ }
      }
      try {
        await navigator.clipboard.writeText(url);
        showToast(`${ICON.check}<span>${esc(t.copied)}</span>`);
        announce(t.copied);
      } catch (e) {
        // no clipboard access: show the link ready to copy by hand
        showToast(`<label for="toastUrl">${esc(t.copyThis)}</label>
          <input id="toastUrl" class="toast-url" type="text" readonly dir="ltr" value="${esc(url)}">
          <button class="btn btn-ghost btn-sm btn-icon" type="button" id="toastClose" aria-label="${esc(t.close)}">${ICON.x}</button>`, { sticky: true });
        const input = document.getElementById("toastUrl");
        input.focus(); input.select();
        document.getElementById("toastClose").addEventListener("click", () => { hideToast(); b.focus(); });
      }
    }));

    const gallery = document.getElementById("gallery");
    if (multi && gallery) setupGallery(gallery, shop.photos.length);

    const removeBtn = document.getElementById("removeBtn");
    if (removeBtn) {
      const actions = document.getElementById("ownerActions"), box = document.getElementById("confirmBox");
      const ask = open => {
        actions.hidden = open;
        box.hidden = !open;
        document.getElementById(open ? "cancelRemove" : "removeBtn").focus();
      };
      removeBtn.addEventListener("click", () => { document.getElementById("ownerError").hidden = true; ask(true); });
      document.getElementById("cancelRemove").addEventListener("click", () => ask(false));
      box.addEventListener("keydown", e => { if (e.key === "Escape") ask(false); });
      document.getElementById("confirmRemove").addEventListener("click", () => deleteShop(shop, ask));
    }
  }

  function deleteShop(shop, ask) {
    const t = L();
    const next = loadMyShops().filter(s => s.id !== shop.id).map(toStored);
    const err = store.save("localStorage", STORE_KEY, next);
    if (err) {
      const box = document.getElementById("ownerError");
      box.textContent = err === "full" ? t.errStorageFull : t.errStorageBlocked;
      box.hidden = false;
      ask(false);
      return;
    }
    myShops = loadMyShops();
    discardDraft("edit." + shop.id);
    pageNotice = { hash: "#/", kind: "removed" };
    announce(t.removed);
    navigate("#/", { replace: true });
  }

  // Previous / next buttons and a "2 / 4" counter for the shop photos.
  function setupGallery(gallery, n) {
    const count = document.getElementById("galleryCount");
    const prev = app.querySelector(".gallery-btn.prev"), next = app.querySelector(".gallery-btn.next");
    const slideWidth = () => { const w = gallery.querySelector(".window"); return w ? w.getBoundingClientRect().width + 8 : gallery.clientWidth; };
    const index = () => Math.min(n - 1, Math.max(0, Math.round(Math.abs(gallery.scrollLeft) / slideWidth())));
    const sync = () => {
      const i = index();
      count.textContent = (i + 1) + " / " + n;
      prev.disabled = i === 0;
      next.disabled = i === n - 1;
    };
    [prev, next].forEach(b => b.addEventListener("click", () => {
      const target = Math.min(n - 1, Math.max(0, index() + Number(b.dataset.step)));
      const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      gallery.querySelectorAll(".window")[target].scrollIntoView({ inline: "center", block: "nearest", behavior: smooth ? "smooth" : "auto" });
    }));
    let raf = 0;
    gallery.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, { passive: true });
    sync();
  }

  /* ------------------------------------------------------------ "open your shop" form */
  // Each form keeps its own draft: "new" for a new shop, "edit.<id>" for each shop being edited.
  const blankHours = () => Array.from({ length: 7 }, (_, i) => ({ from: "09:00", to: i === 5 ? "14:00" : "19:00", closed: i === 6, allDay: false }));
  const blankService = () => ({ name: "", price: "", minutes: "" });
  function emptyDraft(slot) {
    return {
      slot: slot || "new", editId: "",
      name: "", category: "", about: "", address: "", phone: "", email: "", pos: null,
      hours: blankHours(), services: [blankService()], photos: [],
      dirty: false, photosChanged: false, pending: 0, showErrors: false, restored: false, photoNote: null
    };
  }
  function shopToDraft(shop) {
    const plain = v => typeof v === "string" ? v : tx(v);
    return Object.assign(emptyDraft("edit." + shop.id), {
      editId: shop.id,
      name: plain(shop.name), category: shop.category, about: plain(shop.about), address: plain(shop.address),
      phone: shop.phone, email: shop.email, pos: shop.lat !== undefined ? { lat: shop.lat, lng: shop.lng } : null,
      hours: shop.hours.map(h => !h ? { from: "09:00", to: "19:00", closed: true, allDay: false }
        : isAllDay(h) ? { from: "09:00", to: "19:00", closed: false, allDay: true }
        : { from: h[0], to: h[1], closed: false, allDay: false }),
      services: shop.services.length
        ? shop.services.map(s => ({ name: plain(s.name), price: s.price ? String(s.price) : "", minutes: s.minutes ? String(s.minutes) : "" }))
        : [blankService()],
      photos: shop.photos.slice()
    });
  }
  // A draft saved in this tab before a reload. Photos are too big for session storage, so they are not kept.
  function readStoredDraft(slot, editing) {
    const raw = store.get("sessionStorage", DRAFT_PREFIX + slot, null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const d = editing ? shopToDraft(editing) : emptyDraft(slot);
    ["name", "category", "about", "address", "phone", "email"].forEach(k => { if (typeof raw[k] === "string") d[k] = raw[k]; });
    if (Array.isArray(raw.hours) && raw.hours.length === 7 && raw.hours.every(h => h && typeof h === "object")) {
      d.hours = raw.hours.map(h => ({ from: TIME_RE.test(h.from) ? h.from : "09:00", to: TIME_RE.test(h.to) ? h.to : "19:00", closed: !!h.closed, allDay: !!h.allDay && !h.closed }));
    }
    if (Array.isArray(raw.services) && raw.services.length && raw.services.every(s => s && typeof s === "object")) {
      d.services = raw.services.map(s => ({ name: String(s.name || ""), price: String(s.price || ""), minutes: String(s.minutes || "") }));
    }
    if (raw.pos && Number.isFinite(raw.pos.lat) && Number.isFinite(raw.pos.lng)) d.pos = { lat: raw.pos.lat, lng: raw.pos.lng };
    d.dirty = !!raw.dirty;
    if (editing && raw.photosChanged) d.photoNote = "reset";
    else if (!editing && Number(raw.photoCount) > 0) d.photoNote = Math.min(MAX_PHOTOS, Math.round(Number(raw.photoCount)));
    return d;
  }
  // Older versions kept one shared draft; move a new-shop draft over and drop the rest.
  (function migrateOldKeys() {
    const old = store.get("sessionStorage", OLD_KEYS[0], null);
    if (old && typeof old === "object" && !old.editId && store.get("sessionStorage", DRAFT_PREFIX + "new", null) === null) {
      store.save("sessionStorage", DRAFT_PREFIX + "new", Object.assign({}, old, { dirty: true }));
    }
    OLD_KEYS.forEach(k => store.del("sessionStorage", k));
  })();

  const drafts = {};      // slot -> draft, for this page load
  let draft = null;       // the draft of the form on screen
  let formUi = null;      // helpers of the form on screen, so late async work updates the live form

  function getDraft(slot, editing) {
    if (drafts[slot]) return { d: drafts[slot], existed: true };
    const stored = readStoredDraft(slot, editing);
    drafts[slot] = stored || (editing ? shopToDraft(editing) : emptyDraft(slot));
    return { d: drafts[slot], existed: !!stored };
  }
  function saveDraft(d) {
    if (drafts[d.slot] !== d) return; // discarded meanwhile
    store.save("sessionStorage", DRAFT_PREFIX + d.slot, {
      name: d.name, category: d.category, about: d.about, address: d.address, phone: d.phone, email: d.email, pos: d.pos,
      hours: d.hours, services: d.services.map(s => ({ name: s.name, price: s.price, minutes: s.minutes })),
      dirty: d.dirty, photosChanged: d.photosChanged, photoCount: d.photos.length
    });
  }
  function discardDraft(slot) {
    delete drafts[slot];
    store.del("sessionStorage", DRAFT_PREFIX + slot);
    if (draft && draft.slot === slot) draft = null;
  }
  const isLive = d => !!formUi && formUi.d === d;

  function locStatusHtml(state) {
    const t = L();
    if (state === "set") return `${esc(t.locSet)} ${ICON.check}`;
    return esc({ locating: t.locating, failed: t.locFailed, unavailable: t.locUnavailable, unsupported: t.locUnsupported }[state] || t.locNone);
  }

  function renderForm(editId, entering) {
    const t = L();
    let editing = null;
    if (editId !== null) {
      editing = myShops.find(s => s.id === editId) || null;
      if (!editing) {
        const sample = editId ? sampleShops.find(s => s.id === editId) : null;
        if (sample) renderNotFound(t.ownerOnly, t.ownerOnlySub, "#/shop/" + encodeURIComponent(sample.id));
        else renderNotFound();
        return;
      }
    }
    const slot = editing ? "edit." + editing.id : "new";
    const got = getDraft(slot, editing);
    const d = draft = got.d;
    if (entering) d.restored = got.existed && d.dirty;
    document.title = editing ? t.titleEdit : t.titleNew;
    const opt = `<span class="help">(${esc(t.optional)})</span>`;
    const req = `<span class="req" aria-hidden="true">*</span>`;
    const shopHref = editing ? "#/shop/" + encodeURIComponent(editing.id) : "";

    app.innerHTML = `
      ${editing ? `<a class="back" href="${shopHref}" data-back data-discard="${esc(slot)}">${ICON.back}<bdi${langAttr(tx(editing.name))}>${esc(tx(editing.name))}</bdi></a>` : backLink()}
      <header class="page-head">
        <h1 tabindex="-1">${esc(editing ? t.editTitle : t.formTitle)}</h1>
        <p>${esc(editing ? t.editSub : t.formSub)}</p>
      </header>
      ${d.restored ? `<div class="note draft-note" id="draftNote"><span>${esc(editing ? t.draftEdits : t.draftKept)}</span>
        <button class="btn btn-ghost btn-sm" type="button" id="discardBtn">${esc(editing ? t.discard : t.startOver)}</button></div>` : ""}
      <form id="shopForm" class="form-layout" novalidate>
        <p class="note"><span class="note-icon" aria-hidden="true">${ICON.info}</span><span>${esc(t.demoNote)}</span></p>

        <section class="panel step" aria-labelledby="s1">
          <div class="step-head"><span class="step-num" aria-hidden="true">1</span><h2 id="s1">${esc(t.step1)}</h2></div>
          <div class="field"><label for="fName">${esc(t.fName)} ${req}</label>
            <input id="fName" name="name" maxlength="60" required aria-required="true" aria-describedby="err-fName" autocomplete="organization" dir="auto">
            <p class="field-error" id="err-fName" hidden></p></div>
          <div class="field"><label for="fCategory">${esc(t.fCategory)} ${req}</label>
            <select id="fCategory" name="category" required aria-required="true" aria-describedby="err-fCategory">
              <option value="">${esc(t.fCategoryPh)}</option>
              ${CATEGORIES.map(c => `<option value="${esc(c.id)}">${esc(tx(c.name))}</option>`).join("")}
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
              <p class="help" id="fLocStatus" role="status">${locStatusHtml(d.pos ? "set" : "none")}</p>
            </div></div>
        </section>

        <section class="panel step" aria-labelledby="s3">
          <div class="step-head"><span class="step-num" aria-hidden="true">3</span><h2 id="s3">${esc(t.step3)}</h2></div>
          <div class="hours-grid" id="hoursGrid">
            ${d.hours.map((h, i) => `
              <div class="hours-row ${h.closed ? "is-closed" : ""} ${h.allDay ? "is-allday" : ""}" data-day="${i}" role="group" aria-label="${esc(dayName(i))}">
                <span class="day" aria-hidden="true">${esc(dayName(i))}</span>
                <span class="switches">
                  <label class="switch"><input type="checkbox" name="closed" ${h.closed ? "checked" : ""}>${esc(t.dayClosed)}</label>
                  <label class="switch"><input type="checkbox" name="allDay" ${h.allDay ? "checked" : ""} ${h.closed ? "disabled" : ""}>${esc(t.day24)}</label>
                </span>
                <span class="times">
                  <input type="time" name="from" value="${esc(h.from)}" aria-label="${esc(t.hoursFrom(dayName(i)))}" ${h.closed || h.allDay ? "disabled" : ""}>
                  <span class="sep" aria-hidden="true">–</span>
                  <input type="time" name="to" value="${esc(h.to)}" aria-label="${esc(t.hoursTo(dayName(i)))}" ${h.closed || h.allDay ? "disabled" : ""}>
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
          ${editing ? `<a class="btn btn-ghost" href="${shopHref}" data-back data-discard="${esc(slot)}">${esc(t.cancel)}</a>` : ""}
        </div>
      </form>`;

    const form = document.getElementById("shopForm");
    const $ = id => document.getElementById(id);
    $("fName").value = d.name; $("fCategory").value = d.category; $("fAbout").value = d.about;
    $("fAddress").value = d.address; $("fPhone").value = d.phone; $("fEmail").value = d.email;
    renderServices();
    renderThumbs();
    renderPreview();
    updateSubmit();
    if (d.photoNote) $("photoStatus").textContent = d.photoNote === "reset" ? t.photosReset : t.photosNotKept(d.photoNote);
    if (d.showErrors) showValidation(validate(), false);

    formUi = {
      d,
      renderPreview,
      photosChanged(noteKeys) {
        renderThumbs(); renderPreview(); updateSubmit();
        if (noteKeys) $("photoStatus").textContent = noteKeys.map(k => L()[k]).join(" ");
      },
      setLoc(state) { $("fLocStatus").innerHTML = locStatusHtml(state); renderPreview(); }
    };

    function renderServices() {
      $("services").innerHTML = d.services.map((s, i) => `
        <div class="service-row" data-i="${i}">
          <div class="field svc-name"><label for="svcName${i}">${esc(t.svcName)}</label><input id="svcName${i}" name="svcName" maxlength="50" dir="auto" value="${esc(s.name)}"></div>
          <div class="field"><label for="svcPrice${i}">${esc(t.svcPrice)}</label><input id="svcPrice${i}" name="svcPrice" type="number" min="0" max="100000" step="1" inputmode="numeric" value="${esc(s.price)}"></div>
          <div class="field"><label for="svcMin${i}">${esc(t.svcMin)}</label><input id="svcMin${i}" name="svcMin" type="number" min="1" max="1440" step="1" inputmode="numeric" value="${esc(s.minutes)}"></div>
          <button class="btn btn-ghost btn-icon" type="button" data-remove="${i}" aria-label="${esc(t.removeService(i + 1))}" ${d.services.length === 1 ? "hidden" : ""}>${ICON.x}</button>
          <p class="field-error row-error" id="err-svc-${i}" hidden></p>
        </div>`).join("");
    }
    function renderThumbs() {
      $("thumbs").innerHTML = d.photos.map((p, i) => `
        <div class="thumb"><img src="${esc(p)}" alt="">
          <button type="button" data-photo="${i}" aria-label="${esc(t.removePhoto(i + 1))}">${ICON.x}</button></div>`).join("");
    }
    function renderPreview() {
      $("preview").innerHTML = cardHtml(draftToShop(d), null, 0, { preview: true });
    }
    function updateSubmit() {
      const btn = $("submitBtn");
      btn.disabled = d.pending > 0;
      btn.textContent = d.pending > 0 ? t.photosProcessing : (editing ? t.saveChanges : t.publish);
    }

    function collect(markDirty) {
      d.name = $("fName").value; d.category = $("fCategory").value; d.about = $("fAbout").value;
      d.address = $("fAddress").value; d.phone = $("fPhone").value; d.email = $("fEmail").value;
      d.hours = Array.from(form.querySelectorAll(".hours-row")).map(row => {
        const closed = row.querySelector('[name="closed"]').checked;
        return {
          from: row.querySelector('[name="from"]').value,
          to: row.querySelector('[name="to"]').value,
          closed, allDay: !closed && row.querySelector('[name="allDay"]').checked
        };
      });
      d.services = Array.from($("services").querySelectorAll(".service-row")).map(row => {
        const price = row.querySelector('[name="svcPrice"]'), min = row.querySelector('[name="svcMin"]');
        return {
          name: row.querySelector('[name="svcName"]').value, price: price.value, minutes: min.value,
          priceBad: !!(price.validity && price.validity.badInput), minBad: !!(min.validity && min.validity.badInput)
        };
      });
      if (markDirty) d.dirty = true;
      saveDraft(d);
    }
    form._collect = () => collect(false); // used by the language switch

    function syncRow(row) {
      const closed = row.querySelector('[name="closed"]'), allDay = row.querySelector('[name="allDay"]');
      if (closed.checked) allDay.checked = false;
      allDay.disabled = closed.checked;
      row.classList.toggle("is-closed", closed.checked);
      row.classList.toggle("is-allday", allDay.checked);
      row.querySelectorAll('input[type="time"]').forEach(inp => { inp.disabled = closed.checked || allDay.checked; });
    }
    function onChange(e) {
      const target = e && e.target;
      if (target && (target.name === "closed" || target.name === "allDay")) syncRow(target.closest(".hours-row"));
      if (target && target.id === "fPhotos") return;
      collect(true);
      if (d.showErrors) showValidation(validate(), false);
      renderPreview();
    }
    form.addEventListener("input", onChange);
    form.addEventListener("change", e => { if (e.target.name === "closed" || e.target.name === "allDay") onChange(e); });

    const discardBtn = $("discardBtn");
    if (discardBtn) discardBtn.addEventListener("click", () => {
      discardDraft(slot);
      renderForm(editId, true);
      document.getElementById("fName").focus();
    });

    $("copyHours").addEventListener("click", () => {
      collect(false);
      const src = d.hours.find(h => !h.closed);
      if (!src) return;
      form.querySelectorAll(".hours-row").forEach(row => {
        if (row.querySelector('[name="closed"]').checked) return;
        row.querySelector('[name="from"]').value = src.from;
        row.querySelector('[name="to"]').value = src.to;
        row.querySelector('[name="allDay"]').checked = src.allDay;
        syncRow(row);
      });
      onChange();
    });

    $("addService").addEventListener("click", () => {
      collect(true);
      d.services.push(blankService());
      renderServices();
      if (d.showErrors) showValidation(validate(), false);
      $("svcName" + (d.services.length - 1)).focus();
    });
    $("services").addEventListener("click", e => {
      const b = e.target.closest("[data-remove]");
      if (!b) return;
      collect(true);
      const i = Number(b.dataset.remove);
      d.services.splice(i, 1);
      renderServices();
      saveDraft(d);
      if (d.showErrors) showValidation(validate(), false);
      renderPreview();
      const next = $("svcName" + Math.min(i, d.services.length - 1));
      if (next) next.focus();
    });

    $("fLocBtn").addEventListener("click", () => {
      if (!navigator.geolocation) { formUi.setLoc("unsupported"); return; }
      formUi.setLoc("locating");
      navigator.geolocation.getCurrentPosition(p => {
        d.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        d.dirty = true;
        saveDraft(d);
        if (isLive(d)) formUi.setLoc("set");
      }, err => {
        if (isLive(d)) formUi.setLoc(d.pos ? "set" : (err && err.code === 1 ? "failed" : "unavailable"));
      }, { timeout: 10000 });
    });

    $("fPhotos").addEventListener("change", async e => {
      const input = e.target;
      const all = Array.from(input.files || []);
      const files = all.filter(f => /^image\//.test(f.type));
      input.value = "";
      const room = MAX_PHOTOS - d.photos.length - d.pending;
      const take = files.slice(0, Math.max(0, room));
      const notes = [];
      if (files.length > take.length) notes.push("photosLimit");
      let bad = all.length - files.length;
      d.photoNote = null;
      if (!take.length) {
        if (bad) notes.push("photosBad");
        if (isLive(d)) formUi.photosChanged(notes);
        return;
      }
      // The photos belong to this draft even if the form is redrawn (language switch) or left meanwhile.
      d.pending += take.length;
      if (isLive(d)) formUi.photosChanged(null);
      for (const f of take) {
        const data = await shrinkImage(f);
        d.pending--;
        if (data && d.photos.length < MAX_PHOTOS) { d.photos.push(data); d.photosChanged = true; d.dirty = true; } else if (!data) bad++;
        if (isLive(d)) formUi.photosChanged(null);
      }
      if (bad) notes.push("photosBad");
      saveDraft(d);
      if (isLive(d)) formUi.photosChanged(notes);
    });
    $("thumbs").addEventListener("click", e => {
      const b = e.target.closest("[data-photo]");
      if (!b) return;
      d.photos.splice(Number(b.dataset.photo), 1);
      d.photosChanged = true; d.dirty = true; d.photoNote = null;
      saveDraft(d);
      renderThumbs();
      renderPreview();
      $("fPhotos").focus();
    });

    function validate() {
      const errors = {};
      if (!d.name.trim()) errors.fName = t.errName;
      if (!CATEGORIES.some(c => c.id === d.category)) errors.fCategory = t.errCategory;
      if (!d.address.trim()) errors.fAddress = t.errAddress;
      if (!validPhone(d.phone)) errors.fPhone = t.errPhone;
      if (d.email.trim() && !EMAIL_RE.test(d.email.trim())) errors.fEmail = t.errEmail;
      d.hours.forEach((h, i) => {
        if (h.closed || h.allDay) return;
        if (!(TIME_RE.test(h.from) && TIME_RE.test(h.to) && h.from !== h.to)) { errors["hours-" + i] = t.errHours; return; }
        // closing up to 06:00 counts as "after midnight" (but not a 20+ hour day like 07:00–06:00)
        const o = toMin(h.from), c = toMin(h.to);
        const ok = c > o || (h.to <= "06:00" && 1440 - o + c <= 20 * 60);
        if (!ok) errors["hours-" + i] = t.errHours;
      });
      d.services.forEach((s, i) => {
        const name = s.name.trim(), price = String(s.price).trim(), min = String(s.minutes).trim();
        if (!name && (price || min)) errors["svcName" + i] = t.errSvcName;
        if (s.priceBad || (price && !(/^\d+$/.test(price) && Number(price) <= 100000))) errors["svcPrice" + i] = t.errSvcPrice;
        if (s.minBad || (min && !(/^\d+$/.test(min) && Number(min) >= 1 && Number(min) <= 1440))) errors["svcMin" + i] = t.errSvcMin;
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
      d.hours.forEach((h, i) => {
        const msg = $("err-hours-" + i);
        if (!msg) return;
        const row = msg.closest(".hours-row");
        const e = errors["hours-" + i];
        msg.hidden = !e;
        msg.textContent = e || "";
        row.querySelectorAll('input[type="time"]').forEach(inp => {
          inp.setAttribute("aria-invalid", e ? "true" : "false");
          if (e) inp.setAttribute("aria-describedby", "err-hours-" + i); else inp.removeAttribute("aria-describedby");
        });
      });
      d.services.forEach((s, i) => {
        const msg = $("err-svc-" + i);
        if (!msg) return;
        const ids = ["svcName" + i, "svcPrice" + i, "svcMin" + i];
        const texts = ids.map(id => errors[id]).filter(Boolean);
        msg.hidden = !texts.length;
        msg.textContent = texts.join(" ");
        ids.forEach(id => {
          const inp = $(id);
          if (!inp) return;
          inp.setAttribute("aria-invalid", errors[id] ? "true" : "false");
          if (errors[id]) inp.setAttribute("aria-describedby", "err-svc-" + i); else inp.removeAttribute("aria-describedby");
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
    function showFormError(text) {
      const box = $("formError");
      box.textContent = text;
      box.hidden = false;
    }

    let submitting = false;
    form.addEventListener("submit", e => {
      e.preventDefault();
      if (d.pending > 0 || submitting) return;
      collect(false);
      const errors = validate();
      d.showErrors = true;
      showValidation(errors, true);
      if (Object.keys(errors).length) return;

      const current = loadMyShops(); // re-read: another tab may have changed it
      if (editing && !current.some(s => s.id === editing.id)) { showFormError(t.errDeleted); return; }
      const shop = draftToShop(d);
      shop.id = editing ? editing.id : "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const saved = cleanShop(shop, true);
      const next = (editing ? current.map(s => s.id === saved.id ? saved : s) : [saved].concat(current)).map(toStored);
      submitting = true;
      const err = store.save("localStorage", STORE_KEY, next);
      if (err) {
        submitting = false;
        showFormError(err === "full" ? t.errStorageFull : t.errStorageBlocked);
        return;
      }
      myShops = loadMyShops();
      discardDraft(slot);
      const dest = "#/shop/" + encodeURIComponent(saved.id);
      pageNotice = { hash: dest, kind: editing ? "edit" : "new" };
      announce(editing ? t.saved : t.published);
      navigate(dest, { replace: true });
    });
  }

  function draftToShop(d) {
    const shop = {
      id: "preview",
      name: d.name.trim(), category: d.category, about: d.about.trim(),
      address: d.address.trim(), phone: d.phone.trim(), email: d.email.trim(),
      tz: DEFAULT_TZ,
      hours: d.hours.map(h => h.closed ? null : h.allDay ? ALL_DAY.slice()
        : (!TIME_RE.test(h.from) || !TIME_RE.test(h.to) || h.from === h.to) ? null : [h.from, h.to]),
      services: d.services.map(s => ({ name: s.name.trim(), price: Math.max(0, Math.round(Number(s.price) || 0)), minutes: Math.max(0, Math.round(Number(s.minutes) || 0)) })).filter(s => s.name),
      photos: d.photos.slice()
    };
    if (d.pos) { shop.lat = d.pos.lat; shop.lng = d.pos.lng; }
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
  // "#/", "#/shop/<id>", "#/edit/<id>", "#/new". Anything else shows home.
  const normHash = h => { h = String(h || ""); const i = h.indexOf("#"); h = i >= 0 ? h.slice(i) : ""; return !h || h === "#" ? "#/" : h; };
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
    document.querySelector(".brand").setAttribute("aria-label", tx(window.APP_NAME)); // the logo shows both names
    const nav = document.getElementById("navNew");
    nav.innerHTML = `${ICON.plus}<span class="label-long">${esc(t.ownerBtn)}</span><span class="label-short">${esc(t.ownerBtnShort)}</span>`;
    if (route === "new") nav.setAttribute("aria-current", "page"); else nav.removeAttribute("aria-current");
    const lb = document.getElementById("langBtn");
    lb.textContent = t.langBtn;
    lb.setAttribute("aria-label", t.langLabel); // starts with the visible text (EN / עב)
    lb.lang = lang === "he" ? "en" : "he";
  }

  function render(opts) {
    opts = opts || {};
    formUi = null;
    renderChrome();
    const route = currentRoute();
    if (route === "shop") renderShop(routeId("#/shop/"));
    else if (route === "edit") renderForm(routeId("#/edit/"), !!opts.entering);
    else if (route === "new") renderForm(null, !!opts.entering);
    else renderHome();

    if (opts.focus) {
      let target = null;
      if (route === "home" && opts.fromShop && lastShopId) {
        target = Array.from(app.querySelectorAll(".card")).find(a => a.getAttribute("href") === "#/shop/" + encodeURIComponent(lastShopId)) || null;
      }
      (target || app.querySelector("h1") || app).focus({ preventScroll: true });
    }
    firstRender = false;
    lastRoute = route;
  }

  // Re-render without losing keyboard focus (used when data changes under the user).
  function keepFocus(fn) {
    const a = document.activeElement;
    let sel = "";
    if (a && a !== document.body && app.contains(a)) {
      if (a.id) sel = "#" + CSS.escape(a.id);
      else if (a.getAttribute("href")) sel = `[href="${CSS.escape(a.getAttribute("href"))}"]`;
      else if (a.dataset.cat !== undefined) sel = `[data-cat="${CSS.escape(a.dataset.cat)}"]`;
    }
    const value = a && a.id === "q" ? { start: a.selectionStart, end: a.selectionEnd } : null;
    fn();
    if (!sel) return;
    const el = app.querySelector(sel);
    if (el && el !== document.activeElement) {
      el.focus({ preventScroll: true });
      if (value && el.setSelectionRange) try { el.setSelectionRange(value.start, value.end); } catch (e) { /* ignore */ }
    }
  }

  // Each history entry remembers the page before it (history.state.prev), so in-app
  // "back" links can really go back (keeping the list's place) only when that is where they lead.
  if (!history.state || !("prev" in history.state)) history.replaceState({ prev: null }, "");
  let navigating = false, navTimer = 0;

  function navigate(hash, opts) {
    hash = normHash(hash);
    const st = history.state || {};
    if (opts && opts.replace) {
      // e.g. Save on an edit page opened from the shop page: go back to that entry instead of duplicating it
      if (st.prev === hash) { history.back(); return; }
      const from = lastRoute;
      history.replaceState({ prev: st.prev === undefined ? null : st.prev }, "", hash);
      onRoute(from);
      return;
    }
    location.hash = hash;
  }

  function onRoute(fromRoute) {
    navigating = false;
    if (pageNotice && pageNotice.hash !== normHash(location.hash)) pageNotice = null;
    hideToast();
    const to = currentRoute();
    render({ focus: true, fromShop: fromRoute === "shop", entering: true });
    if (to === "home" && fromRoute && fromRoute !== "home") window.scrollTo(0, homeScrollY);
    else window.scrollTo(0, 0);
  }

  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-back]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.dataset.discard) discardDraft(a.dataset.discard); // Cancel / leaving the edit page throws the edits away
    if (navigating) { e.preventDefault(); return; }       // a double click must not go back twice
    const st = history.state;
    if (st && st.prev === normHash(a.getAttribute("href")) && normHash(location.hash) !== st.prev) {
      e.preventDefault();
      navigating = true;
      clearTimeout(navTimer);
      navTimer = setTimeout(() => { navigating = false; }, 1500);
      history.back();
    }
  });

  // The skip link moves focus to the page heading; it must not change the route.
  document.getElementById("skipLink").addEventListener("click", e => {
    e.preventDefault();
    const target = app.querySelector("h1") || app;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
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
    hideToast();
    render();
    window.scrollTo(0, y);
    document.getElementById("langBtn").focus({ preventScroll: true });
  });

  window.addEventListener("hashchange", e => {
    // a fresh entry (link, typed URL): remember where it came from
    if (!history.state) history.replaceState({ prev: normHash(e.oldURL) }, "");
    onRoute(lastRoute);
  });

  // Keep "Open / Closed" honest while the page stays open, on the minute.
  function refreshOpenState() {
    const route = currentRoute();
    if (route === "home" && document.getElementById("grid")) {
      if (resultsSignature(filteredShops()) !== homeSig) keepFocus(() => updateResults(false));
    }
    const st = document.getElementById("shopStatus");
    if (route === "shop" && st) {
      const shop = allShops().find(s => s.id === st.dataset.id);
      if (shop) {
        const os = openState(shop);
        const sig = os.open + "|" + stateDetail(os);
        if (st.dataset.sig !== sig) { st.innerHTML = statusPill(os) + " <span>" + esc(stateDetail(os)) + "</span>"; st.dataset.sig = sig; }
        const list = document.getElementById("hoursList");
        if (list && Number(list.dataset.day) !== nowIn(shop.tz).day) list.outerHTML = hoursListHtml(shop);
      }
    }
    if ((route === "new" || route === "edit") && formUi) formUi.renderPreview();
  }
  (function tick() {
    setTimeout(() => { refreshOpenState(); tick(); }, 60000 - (Date.now() % 60000) + 50);
  })();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshOpenState(); });

  // Another tab added, changed or deleted a shop.
  function refreshHomeCounts() {
    const t = L();
    const shops = allShops();
    const counts = {};
    shops.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    setText(document.querySelector("#eyebrow > span:last-child"), t.eyebrow(shops.length));
    document.querySelectorAll("#street [data-count]").forEach(el => setText(el, t.places(el.dataset.count ? counts[el.dataset.count] || 0 : shops.length)));
  }
  window.addEventListener("storage", e => {
    if (e.key !== STORE_KEY) return;
    const before = {};
    myShops.forEach(s => { before[s.id] = JSON.stringify(toStored(s)); });
    myShops = loadMyShops();
    const route = currentRoute();
    if (route === "home") {
      keepFocus(() => { refreshHomeCounts(); updateResults(false); });
    } else if (route === "shop") {
      const id = routeId("#/shop/");
      const now = myShops.find(s => s.id === id);
      if ((now ? JSON.stringify(toStored(now)) : undefined) !== before[id]) keepFocus(() => render());
    } else if (route === "edit") {
      const id = routeId("#/edit/");
      if (before[id] && !myShops.some(s => s.id === id)) {
        discardDraft("edit." + id);
        formUi = null;
        renderNotFound(L().deletedTab, L().notFoundSub);
        app.querySelector("h1").focus({ preventScroll: true });
      }
    }
  });

  render({ entering: true });
})();

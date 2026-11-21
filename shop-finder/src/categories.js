/*
 * Categories and the app's name (used in every mode).
 *
 * Category fields: id, emoji (unused), color (no-photo placeholder colour), name,
 *   keywords – extra words people search with (not shown)
 */
const APP_NAME = { en: "Nearby", he: "קרוב אליי" };
const CURRENCY = "₪";

const CATEGORY_LIST = [
  { id: "barber",  emoji: "💈", color: "#4B3ACF", name: { en: "Barber",        he: "מספרת גברים" }, keywords: { en: "barbershop barber shop haircut men", he: "מספרה מספרות ספר ספרים תספורת גברים" } },
  { id: "hair",    emoji: "💇", color: "#7A3FD0", name: { en: "Hair salon",    he: "עיצוב שיער" }, keywords: { en: "hairdresser hair salon haircut stylist colour color", he: "מספרה מספרות ספרית מעצבת שיער סלון תספורת נשים" } },
  { id: "nails",   emoji: "💅", color: "#C0398F", name: { en: "Nails",         he: "ציפורניים" }, keywords: { en: "nail salon manicure pedicure gel", he: "מניקור פדיקור ציפורן לק" } },
  { id: "beauty",  emoji: "✨", color: "#9A4CCB", name: { en: "Beauty clinic", he: "קוסמטיקה" }, keywords: { en: "beautician cosmetics facial skin laser clinic", he: "קוסמטיקאית טיפולי פנים עור לייזר קליניקה" } },
  { id: "dental",  emoji: "🦷", color: "#2F6FD6", name: { en: "Dental",        he: "מרפאת שיניים" }, keywords: { en: "dentist dental clinic teeth tooth hygienist", he: "רופא שיניים רופאת מרפאה מרפאות שן שיננית" } },
  { id: "physio",  emoji: "🩺", color: "#1F8A8A", name: { en: "Physiotherapy", he: "פיזיותרפיה" }, keywords: { en: "physio physiotherapist rehab clinic back pain", he: "פיזיו פיזיותרפיסט פיזיותרפיסטית שיקום מרפאה מרפאות" } },
  { id: "massage", emoji: "💆", color: "#5961DD", name: { en: "Massage & spa", he: "עיסוי וספא" }, keywords: { en: "massage spa therapist", he: "עיסוי עיסויים מסאז מסאזים ספא מעסה" } },
  { id: "tattoo",  emoji: "🖋️", color: "#23233F", name: { en: "Tattoo",        he: "קעקועים" }, keywords: { en: "tattoo tattoos ink piercing", he: "קעקוע קעקועים טאטו" } }
];

// Checked copy: a colour that is not a hex colour gets the neutral one.
const HEX_RE = /^#[0-9a-f]{3,8}$/i;
const CATEGORIES = CATEGORY_LIST.map(c => Object.assign({}, c, { color: HEX_RE.test(c.color) ? c.color : "#5B5B7A" }));
const OTHER = { id: "", emoji: "🏪", color: "#5B5B7A", name: { en: "Other", he: "אחר" } };
const category = id => CATEGORIES.find(c => c.id === id) || OTHER;

export { APP_NAME, CURRENCY, CATEGORIES, category };

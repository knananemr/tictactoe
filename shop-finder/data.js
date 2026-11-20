/*
 * DEMO DATA — categories and sample shops.
 * Later this file is replaced by a real database; the app only reads
 * window.CATEGORIES and window.SAMPLE_SHOPS.
 *
 * Shop fields:
 *   name, about, address  – text, either "plain" or { en, he }
 *   category              – a category id from the list below
 *   lat, lng              – location, used for "near me"
 *   hours                 – 7 entries, Sunday first: ["09:00","19:00"] or null (closed)
 *   services              – [{ name, price, minutes }]
 *   photos                – image paths / data URLs (empty = category colour with the emoji)
 *
 * Category fields: id, emoji, color (awning colour), name,
 *   keywords – extra words people search with (not shown)
 */
window.APP_NAME = { en: "Nearby", he: "קרוב אליי" };
window.CURRENCY = "₪";

window.CATEGORIES = [
  { id: "barber",  emoji: "💈", color: "#b3261e", name: { en: "Barber",        he: "מספרת גברים" }, keywords: { en: "barbershop barber shop haircut men", he: "מספרה מספרות ספר ספרים תספורת גברים" } },
  { id: "hair",    emoji: "💇", color: "#7a3e65", name: { en: "Hair salon",    he: "עיצוב שיער" }, keywords: { en: "hairdresser hair salon haircut stylist colour color", he: "מספרה מספרות ספרית מעצבת שיער סלון תספורת נשים" } },
  { id: "nails",   emoji: "💅", color: "#b4466b", name: { en: "Nails",         he: "ציפורניים" }, keywords: { en: "nail salon manicure pedicure gel", he: "מניקור פדיקור ציפורן לק" } },
  { id: "beauty",  emoji: "✨", color: "#8a6a4c", name: { en: "Beauty clinic", he: "קוסמטיקה" }, keywords: { en: "beautician cosmetics facial skin laser clinic", he: "קוסמטיקאית טיפולי פנים עור לייזר קליניקה" } },
  { id: "dental",  emoji: "🦷", color: "#1f6f7c", name: { en: "Dental",        he: "מרפאת שיניים" }, keywords: { en: "dentist dental clinic teeth tooth hygienist", he: "רופא שיניים רופאת מרפאה מרפאות שן שיננית" } },
  { id: "physio",  emoji: "🩺", color: "#2f6b4a", name: { en: "Physiotherapy", he: "פיזיותרפיה" }, keywords: { en: "physio physiotherapist rehab clinic back pain", he: "פיזיו פיזיותרפיסט פיזיותרפיסטית שיקום מרפאה מרפאות" } },
  { id: "massage", emoji: "💆", color: "#5b4b8a", name: { en: "Massage & spa", he: "עיסוי וספא" }, keywords: { en: "massage spa therapist", he: "עיסוי עיסויים מסאז מסאזים ספא מעסה" } },
  { id: "tattoo",  emoji: "🖋️", color: "#2b2b2b", name: { en: "Tattoo",        he: "קעקועים" }, keywords: { en: "tattoo tattoos ink piercing", he: "קעקוע קעקועים טאטו" } }
];

(function () {
  // week(open, close, friClose, satOpen?) -> Sun..Sat
  const week = (o, c, fri, sat) => [
    [o, c], [o, c], [o, c], [o, c], [o, c],
    fri ? [o, fri] : null,
    sat ? sat : null
  ];
  const s = (en, he, price, minutes) => ({ name: { en, he }, price, minutes });

  window.SAMPLE_SHOPS = [
    {
      id: "s1", category: "barber",
      name: { en: "Yossi's Barber Corner", he: "הפינה של יוסי" },
      about: { en: "A small two-chair barber shop. Classic cuts, fades and beard work — no appointment drama.",
               he: "מספרה קטנה עם שני כיסאות. תספורות קלאסיות, פיידים וטיפוח זקן." },
      address: { en: "14 Florentin St., Tel Aviv", he: "פלורנטין 14, תל אביב" },
      lat: 32.0567, lng: 34.7697, phone: "03-555-0101", email: "yossi@example.com",
      hours: week("09:00", "20:00", "14:00"),
      services: [s("Haircut", "תספורת", 70, 30), s("Haircut + beard", "תספורת + זקן", 100, 45), s("Kids cut", "תספורת ילדים", 50, 20)],
      photos: []
    },
    {
      id: "s2", category: "barber",
      name: { en: "Fade Lab", he: "פייד לאב" },
      about: { en: "Modern fades and sharp line-ups in the north of the city.",
               he: "פיידים מודרניים וקווים חדים בצפון העיר." },
      address: { en: "220 Dizengoff St., Tel Aviv", he: "דיזנגוף 220, תל אביב" },
      lat: 32.0905, lng: 34.7765, phone: "03-555-0102", email: "hello@fadelab.example",
      hours: week("10:00", "21:00", "15:00"),
      services: [s("Skin fade", "פייד", 90, 40), s("Beard trim", "עיצוב זקן", 40, 15)],
      photos: []
    },
    {
      id: "s3", category: "hair",
      name: { en: "Studio Maya", he: "סטודיו מאיה" },
      about: { en: "Colour, cuts and blow-dries in a quiet private studio.",
               he: "צבע, תספורות ופן בסטודיו פרטי ושקט." },
      address: { en: "31 Sheinkin St., Tel Aviv", he: "שינקין 31, תל אביב" },
      lat: 32.0703, lng: 34.7745, phone: "03-555-0103", email: "maya@example.com",
      hours: week("09:30", "19:00", "13:30"),
      services: [s("Women's cut", "תספורת נשים", 180, 60), s("Colour", "צבע", 320, 120), s("Blow-dry", "פן", 110, 40)],
      photos: []
    },
    {
      id: "s4", category: "nails",
      name: { en: "Pink Nail Bar", he: "פינק נייל בר" },
      about: { en: "Gel, manicure and pedicure. Walk-ins welcome when there's a free chair.",
               he: "ג'ל, מניקור ופדיקור. אפשר להגיע גם בלי תור כשיש מקום." },
      address: { en: "8 Bograshov St., Tel Aviv", he: "בוגרשוב 8, תל אביב" },
      lat: 32.0779, lng: 34.7690, phone: "03-555-0104", email: "pink@example.com",
      hours: week("10:00", "20:00", "14:00"),
      services: [s("Gel manicure", "מניקור ג'ל", 140, 60), s("Pedicure", "פדיקור", 160, 60), s("Gel removal", "הסרת ג'ל", 40, 20)],
      photos: []
    },
    {
      id: "s5", category: "beauty",
      name: { en: "Glow Skin Clinic", he: "גלואו קליניק" },
      about: { en: "Facials, laser hair removal and skin consultations by a certified cosmetician.",
               he: "טיפולי פנים, הסרת שיער בלייזר וייעוץ עור אצל קוסמטיקאית מוסמכת." },
      address: { en: "45 Ibn Gabirol St., Tel Aviv", he: "אבן גבירול 45, תל אביב" },
      lat: 32.0773, lng: 34.7812, phone: "03-555-0105", email: "glow@example.com",
      hours: week("09:00", "18:00", "13:00"),
      services: [s("Deep-clean facial", "טיפול פנים עמוק", 280, 75), s("Laser — underarms", "לייזר — בתי שחי", 150, 20), s("Skin consultation", "ייעוץ עור", 100, 30)],
      photos: []
    },
    {
      id: "s6", category: "dental",
      name: { en: "Dr. Levi Dental", he: "מרפאת שיניים ד״ר לוי" },
      about: { en: "Family dental clinic: check-ups, hygienist, whitening and emergencies.",
               he: "מרפאת שיניים משפחתית: בדיקות, שיננית, הלבנה ומקרים דחופים." },
      address: { en: "3 Weizmann St., Tel Aviv", he: "ויצמן 3, תל אביב" },
      lat: 32.0812, lng: 34.7893, phone: "03-555-0106", email: "clinic@drlevi.example",
      hours: week("08:00", "19:00", "12:30"),
      services: [s("Check-up", "בדיקה", 150, 30), s("Hygienist", "שיננית", 250, 45), s("Whitening", "הלבנה", 900, 60)],
      photos: []
    },
    {
      id: "s7", category: "physio",
      name: { en: "Move Physio", he: "מוב פיזיותרפיה" },
      about: { en: "Sports injuries, back pain and post-surgery rehab. One-on-one sessions.",
               he: "פציעות ספורט, כאבי גב ושיקום לאחר ניתוח. טיפולים אחד על אחד." },
      address: { en: "17 HaBarzel St., Tel Aviv", he: "הברזל 17, תל אביב" },
      lat: 32.1093, lng: 34.8380, phone: "03-555-0107", email: "info@movephysio.example",
      hours: week("07:30", "20:00", "13:00"),
      services: [s("First assessment", "אבחון ראשוני", 320, 60), s("Follow-up session", "טיפול המשך", 260, 45)],
      photos: []
    },
    {
      id: "s8", category: "massage",
      name: { en: "Quiet Hands Massage", he: "ידיים שקטות" },
      about: { en: "Swedish, deep tissue and pregnancy massage in Jaffa.",
               he: "עיסוי שוודי, רקמות עמוק ועיסוי להריון ביפו." },
      address: { en: "22 Yefet St., Jaffa", he: "יפת 22, יפו" },
      lat: 32.0505, lng: 34.7560, phone: "03-555-0108", email: "quiet@example.com",
      hours: week("10:00", "21:00", "15:00", ["19:30", "22:30"]),
      services: [s("Swedish massage", "עיסוי שוודי", 280, 60), s("Deep tissue", "רקמות עמוק", 320, 60)],
      photos: []
    },
    {
      id: "s9", category: "tattoo",
      name: { en: "Ink & Needle", he: "אינק אנד נידל" },
      about: { en: "Fine-line and black-work tattoos. Free design consultation.",
               he: "קעקועי קו דק ובלאק-וורק. ייעוץ עיצוב ללא עלות." },
      address: { en: "5 Levinsky St., Tel Aviv", he: "לוינסקי 5, תל אביב" },
      lat: 32.0597, lng: 34.7738, phone: "03-555-0109", email: "ink@example.com",
      hours: [null, ["12:00", "20:00"], ["12:00", "20:00"], ["12:00", "20:00"], ["12:00", "20:00"], ["10:00", "15:00"], null],
      services: [s("Small tattoo", "קעקוע קטן", 350, 45), s("Hourly rate", "תעריף לשעה", 500, 60)],
      photos: []
    },
    {
      id: "s10", category: "hair",
      name: { en: "Curls by Noa", he: "תלתלים של נועה" },
      about: { en: "Specialist in curly hair — cuts, treatments and styling lessons.",
               he: "מומחית לשיער מתולתל — תספורות, טיפולים והדרכות עיצוב." },
      address: { en: "60 Bialik St., Ramat Gan", he: "ביאליק 60, רמת גן" },
      lat: 32.0838, lng: 34.8128, phone: "03-555-0110", email: "noa@example.com",
      hours: week("09:00", "18:00", "13:00"),
      services: [s("Curly cut", "תספורת תלתלים", 220, 75), s("Hydration treatment", "טיפול לחות", 180, 45)],
      photos: []
    }
  ];
})();

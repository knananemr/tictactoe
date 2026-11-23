/*
 * CLIENT CONFIG — Sweet Vibes, Julis. Read by both pages in this folder:
 *   index.html = the main page (what the NFC tag, card or Instagram link opens)
 *   menu.html  = the menu
 * Every text is written as { en: "...", he: "..." }.
 * Prices, names and options come from the client's sheet.
 * Calories and prep times are ESTIMATES — verify with the business before going live.
 * Photos: put SV001.jpg … SV036.jpg in images/ and add  image: "images/SV001.jpg"  to each item.
 */
window.MENU_CONFIG = {
  brand: {
    name: { en: "Sweet Vibes", he: "סוויט וייבס" },
    logo: "" // e.g. "images/logo.png"
  },

  theme: {
    bg: "#f3f3f3",
    card: "#ffffff",
    ink: "#111111",
    muted: "#666666",
    line: "#e4e4e4",
    accent: "#c62828",
    radius: "18px"
  },

  languages: ["he", "en"],
  defaultLang: "he",
  currency: "₪",

  // ---------- Main page (index.html). The menu ignores this section. ----------
  tap: {
    menuUrl: "menu.html",
    tagline: "",
    footer: "",
    heroImage: "",
    demo: true, // set to false once the real links below are filled in
    socials: [
      { type: "instagram", url: "https://instagram.com/YOUR_PAGE" },
      { type: "tiktok",    url: "https://www.tiktok.com/@YOUR_PAGE" },
      { type: "google",    url: "https://g.page/r/YOUR_PLACE_ID/review" }
    ],
    contact: {
      whatsapp: "972500000000",
      lat: null, lon: null,
      place: "Sweet Vibes Julis"
    }
  },

  home: {
    headline: { en: "Craving something sweet?", he: "בא לכם משהו מתוק?" },
    subtitle: { en: "Coffee, shakes, waffles and desserts.", he: "קפה, שייקים, וופלים וקינוחים." }
  },

  info: {
    about: {
      en: "A dessert and coffee bar in Julis: shakes, kashtuta, Belgian waffles, pancakes and more.",
      he: "בר קינוחים וקפה בג׳וליס: שייקים, קשטוטה, וופל בלגי, פנקייק ועוד."
    },
    address: { en: "Julis", he: "ג׳וליס" },
    phone: "",  // add the business phone
    hours: []   // add opening hours, e.g. { days: { en: "Sunday – Thursday", he: "ראשון – חמישי" }, time: "12:00 – 23:00" }
  },

  categories: [
    {
      id: "coffee", emoji: "☕",
      name: { en: "Coffee", he: "קפה" },
      items: [
        {
          id: "sv001", emoji: "☕", price: 8, time: 2, calories: 3, tags: [{ en: "Dairy free", he: "ללא חלב" }],
          name: { en: "Espresso", he: "אספרסו" },
          desc: { en: "A short espresso shot.", he: "שוט אספרסו קצר." },
          ingredients: { en: ["Espresso"], he: ["קפה אספרסו"] }
        },
        {
          id: "sv002", emoji: "☕", price: 10, time: 2, calories: 6, tags: [{ en: "Dairy free", he: "ללא חלב" }],
          name: { en: "Double Espresso", he: "אספרסו כפול" },
          desc: { en: "Two shots of espresso.", he: "שני שוטים של אספרסו." },
          ingredients: { en: ["Espresso"], he: ["קפה אספרסו"] }
        },
        {
          id: "sv003", emoji: "☕", price: 10, time: 3, calories: 5, tags: [{ en: "Dairy free", he: "ללא חלב" }],
          name: { en: "Americano", he: "אמריקאנו" },
          desc: { en: "Quality espresso topped with hot water.", he: "אספרסו איכותי בתוספת מים חמים." },
          ingredients: { en: ["Espresso", "Hot water"], he: ["אספרסו", "מים חמים"] }
        },
        {
          id: "sv004", emoji: "☕", price: 13, time: 4, calories: 115, tags: [],
          name: { en: "Israeli Latte (Hafuch)", he: "הפוך" },
          desc: {
            en: "Choose your milk. Small ₪13 · Large ₪15. Milk: regular, soy (+₪2) or almond (+₪2).",
            he: "ניתן לבחור סוג חלב. קטן ₪13 · גדול ₪15. חלב: רגיל, סויה (+₪2) או שקדים (+₪2)."
          },
          ingredients: { en: ["Espresso", "Milk of your choice"], he: ["אספרסו", "חלב לבחירה"] }
        },
        {
          id: "sv005", emoji: "☕", price: 12, time: 4, calories: 140, tags: [],
          name: { en: "Ilan Coffee", he: "קפה אילן" },
          desc: {
            en: "Ilan coffee with your choice of milk: regular, soy (+₪2) or almond (+₪2).",
            he: "קפה אילן עם חלב לבחירה: רגיל, סויה (+₪2) או שקדים (+₪2)."
          },
          ingredients: { en: ["Coffee", "Milk of your choice"], he: ["קפה", "חלב לבחירה"] }
        },
        {
          id: "sv006", emoji: "☕", price: 15, time: 4, calories: 120, tags: [],
          name: { en: "Cappuccino", he: "קפוצ'ינו" },
          desc: {
            en: "Hot cappuccino with your choice of milk: regular, soy (+₪2) or almond (+₪2).",
            he: "קפוצ'ינו חם עם חלב לבחירה: רגיל, סויה (+₪2) או שקדים (+₪2)."
          },
          ingredients: { en: ["Coffee", "Milk of your choice"], he: ["קפה", "חלב לבחירה"] }
        },
        {
          id: "sv007", emoji: "🍫", price: 17, time: 5, calories: 285, tags: [],
          name: { en: "Nutella Latte", he: "הפוך נוטלה" },
          desc: { en: "Israeli latte with a Nutella twist.", he: "קפה הפוך בשילוב טעם נוטלה." },
          ingredients: { en: ["Coffee", "Nutella"], he: ["קפה", "נוטלה"] }
        }
      ]
    },
    {
      id: "hot", emoji: "🍵",
      name: { en: "Hot Drinks", he: "שתיה חמה" },
      items: [
        {
          id: "sv008", emoji: "🍋", price: 17, time: 5, calories: 15, tags: [],
          name: { en: "Natural Herbal Drink", he: "משקה בריאות טבעי" },
          desc: { en: "Mint, lemon, ginger and a cinnamon stick.", he: "נענע, לימון, ג'ינג'ר ומקל קינמון." },
          ingredients: { en: ["Mint", "Lemon", "Ginger", "Cinnamon stick"], he: ["נענע", "לימון", "ג'ינג'ר", "מקל קינמון"] }
        },
        {
          id: "sv009", emoji: "🍫", price: 15, time: 4, calories: 240, tags: [{ en: "Contains dairy", he: "מכיל חלב" }],
          name: { en: "Hot Chocolate", he: "שוקו חם" },
          desc: { en: "Hot chocolate.", he: "שוקו חם." },
          ingredients: { en: ["Chocolate", "Milk"], he: ["שוקולד", "חלב"] }
        },
        {
          id: "sv010", emoji: "🍫", price: 18, time: 5, calories: 340, tags: [{ en: "Contains dairy", he: "מכיל חלב" }],
          name: { en: "Mekupelet Drink", he: "משקה מקופלת" },
          desc: { en: "A hot drink with Mekupelet chocolate flavour.", he: "משקה חם בטעם מקופלת." },
          ingredients: { en: [], he: [] }
        },
        {
          id: "sv011", emoji: "🌰", price: 17, time: 5, calories: 230, tags: [{ en: "Contains dairy", he: "מכיל חלב" }],
          name: { en: "French Nuts Drink", he: "פרנץ׳ אגוזים" },
          desc: { en: "A hot drink with French nut flavour.", he: "משקה חם בטעם פרנץ׳ אגוזים." },
          ingredients: { en: [], he: [] }
        },
        {
          id: "sv012", emoji: "🍦", price: 17, time: 5, calories: 225, tags: [{ en: "Contains dairy", he: "מכיל חלב" }],
          name: { en: "French Vanilla Drink", he: "פרנץ ונילה" },
          desc: { en: "A hot vanilla-flavoured drink.", he: "משקה חם בטעם וניל." },
          ingredients: { en: [], he: [] }
        },
        {
          id: "sv013", emoji: "🥛", price: 20, time: 6, calories: 325, tags: [{ en: "Contains dairy", he: "מכיל חלב" }],
          name: { en: "Sahlab", he: "סחלב" },
          desc: { en: "Warm sahlab.", he: "סחלב חם." },
          ingredients: { en: [], he: [] }
        },
        {
          id: "sv014", emoji: "🍵", price: 12, time: 4, calories: 5, tags: [],
          name: { en: "Mint Tea", he: "תה נענע" },
          desc: { en: "Hot tea with fresh mint (calories without added sugar).", he: "תה חם עם נענע (קלוריות ללא תוספת סוכר)." },
          ingredients: { en: ["Tea", "Mint"], he: ["תה", "נענע"] }
        }
      ]
    },
    {
      id: "shakes", emoji: "🥤",
      name: { en: "Milkshakes", he: "מילקשייקים מתוקים" },
      items: [
        {
          id: "sv015", emoji: "🥤", price: 28, time: 5, calories: 550, tags: [{ en: "Contains wheat", he: "מכיל חיטה" }], featured: true,
          name: { en: "Lotus Milkshake", he: "שייק לוטוס" },
          desc: { en: "A sweet Lotus-flavoured shake.", he: "שייק מתוק בטעם לוטוס." },
          ingredients: { en: [], he: [] }
        },
        {
          id: "sv016", emoji: "🥤", price: 28, time: 5, calories: 590, tags: [],
          name: { en: "Kinder Milkshake", he: "שייק קינדר" },
          desc: { en: "A sweet Kinder-flavoured shake.", he: "שייק מתוק בטעם קינדר." },
          ingredients: { en: [], he: [] }
        },
        {
          id: "sv017", emoji: "🍪", price: 28, time: 5, calories: 540, tags: [{ en: "Contains wheat", he: "מכיל חיטה" }],
          name: { en: "Oreo Milkshake", he: "שייק אוראו" },
          desc: { en: "A sweet Oreo-flavoured shake.", he: "שייק מתוק בטעם אוראו." },
          ingredients: { en: [], he: [] }
        },
        {
          id: "sv018", emoji: "🍬", price: 28, time: 5, calories: 470, tags: [],
          name: { en: "Bubblegum Milkshake", he: "שייק מסטיק" },
          desc: { en: "A sweet bubblegum-flavoured shake.", he: "שייק מתוק בטעם מסטיק." },
          ingredients: { en: [], he: [] }
        },
        {
          id: "sv019", emoji: "🍦", price: 28, time: 5, calories: 450, tags: [],
          name: { en: "Vanilla Milkshake", he: "שייק וניל" },
          desc: { en: "A sweet vanilla shake.", he: "שייק מתוק בטעם וניל." },
          ingredients: { en: [], he: [] }
        },
        {
          id: "sv020", emoji: "🍫", price: 28, time: 5, calories: 580, tags: [],
          name: { en: "Nutella Milkshake", he: "שייק נוטלה" },
          desc: { en: "A sweet Nutella-flavoured shake.", he: "שייק מתוק בטעם נוטלה." },
          ingredients: { en: [], he: [] }
        }
      ]
    },
    {
      id: "kashtuta", emoji: "🍰",
      name: { en: "Kashtuta Desserts", he: "קשטוטה" },
      items: [
        {
          id: "sv021", emoji: "🍰", price: 35, time: 5, calories: 690, tags: [{ en: "Contains wheat & dairy", he: "מכיל חיטה וחלב" }],
          name: { en: "Lotus Kashtuta", he: "קשטוטה לוטוס" },
          desc: { en: "Topped with real Lotus Biscoff spread — rich and delicious.", he: "ציפוי ממרח לוטוס ביסקוף אמיתי טעים ועשיר במיוחד." },
          ingredients: { en: ["Sponge cake", "Milk", "Cream", "Lotus spread"], he: ["עוגת ספוג", "חלב", "קרם שמנת", "ממרח לוטוס"] }
        },
        {
          id: "sv022", emoji: "🍰", price: 35, time: 5, calories: 720, tags: [{ en: "Contains wheat & dairy", he: "מכיל חיטה וחלב" }],
          name: { en: "Kinder Kashtuta", he: "קינדר קשטוטה" },
          desc: { en: "Topped with Kinder spread — rich and delicious.", he: "ציפוי ממרח קינדר טעים ועשיר במיוחד." },
          ingredients: { en: ["Sponge cake", "Milk", "Cream", "Kinder spread"], he: ["עוגת ספוג", "חלב", "קרם שמנת", "ממרח קינדר"] }
        },
        {
          id: "sv023", emoji: "🍪", price: 35, time: 5, calories: 730, tags: [{ en: "Contains wheat & dairy", he: "מכיל חיטה וחלב" }],
          name: { en: "Oreo Kashtuta", he: "אוראו קשטוטה" },
          desc: { en: "Topped with Nutella and Oreo — rich and delicious.", he: "ציפוי נוטלה ואוראו טעים ועשיר במיוחד." },
          ingredients: { en: ["Sponge cake", "Milk", "Cream", "Nutella", "Oreo"], he: ["עוגת ספוג", "חלב", "קרם שמנת", "נוטלה", "אוראו"] }
        },
        {
          id: "sv024", emoji: "🥜", price: 35, time: 5, calories: 745, tags: [{ en: "Contains wheat, dairy & nuts", he: "מכיל חיטה, חלב ואגוזים" }],
          name: { en: "Mixed Nuts Kashtuta", he: "קשטוטה פיצוחים" },
          desc: { en: "Roasted mixed nuts with a light drizzle of maple-flavoured syrup.", he: "תערובת פיצוחים קלויים בזילוף סירופ בטעם מייפל קליל וטעים." },
          ingredients: { en: ["Sponge cake", "Milk", "Cream", "Roasted nuts", "Maple-flavoured syrup"], he: ["עוגת ספוג", "חלב", "קרם שמנת", "פיצוחים קלויים", "סירופ בטעם מייפל"] }
        },
        {
          id: "sv025", emoji: "🟢", price: 40, time: 5, calories: 770, tags: ["new", { en: "Contains wheat, dairy & pistachio", he: "מכיל חיטה, חלב ופיסטוק" }], featured: true,
          name: { en: "Dubai Kashtuta", he: "קשטוטה דובאי" },
          desc: { en: "Pistachio cream and kadaif strands — rich and special.", he: "קרם פיסטוק ושערות קדאיף עשיר ומיוחד." },
          ingredients: { en: ["Sponge cake", "Milk", "Cream", "Pistachio", "Kadaif"], he: ["עוגת ספוג", "חלב", "קרם שמנת", "פיסטוק", "קדאיף"] }
        }
      ]
    },
    {
      id: "waffle", emoji: "🧇",
      name: { en: "Belgian Waffles", he: "וופל בלגי" },
      items: [
        {
          id: "sv026", emoji: "🧇", price: 42, time: 10, calories: 760, tags: [],
          name: { en: "Classic Waffle", he: "וופל קלאסי" },
          desc: { en: "Belgian waffle with your choice of spreads: Nutella, Lotus or pistachio.", he: "וופל בלגי עם ממרחים לבחירה: נוטלה, לוטוס או פיסטוק." },
          ingredients: { en: ["Waffle", "Spread of your choice"], he: ["וופל", "ממרח לבחירה"] }
        },
        {
          id: "sv027", emoji: "🧇", price: 52, time: 10, calories: 940, tags: [], featured: true,
          name: { en: "Kinder Waffle", he: "וופל קינדר" },
          desc: {
            en: "Kinder Belgian waffle. On the side: vanilla ice cream (+₪2), bubblegum ice cream (+₪3) or whipped cream (+₪2).",
            he: "וופל בלגי בטעם קינדר. תוספות ליד: גלידה וניל (+₪2), גלידה מסטיק (+₪3) או קצפת (+₪2)."
          },
          ingredients: { en: ["Waffle", "Kinder spread"], he: ["וופל", "ממרח קינדר"] }
        },
        {
          id: "sv028", emoji: "🍨", price: 48, time: 10, calories: 900, tags: [],
          name: { en: "Ice-Cream Waffle", he: "וופל גלידה" },
          desc: {
            en: "Crispy waffle sliced like a sandwich and filled with rich ice cream! Spreads: Nutella, Lotus or pistachio.",
            he: "וופל קריספי פרוס כמו סנדוויץ׳ שבתוכו גלידה עשירה ומפנקת! ממרחים: נוטלה, לוטוס או פיסטוק."
          },
          ingredients: { en: ["Waffle", "Ice cream", "Spread of your choice"], he: ["וופל", "גלידה", "ממרח לבחירה"] }
        }
      ]
    },
    {
      id: "pancake", emoji: "🥞",
      name: { en: "Pancakes", he: "פנקייק" },
      items: [
        {
          id: "sv029", emoji: "🥞", price: 42, time: 10, calories: 750, tags: [],
          name: { en: "Classic Pancakes", he: "פנקייק קלאסי" },
          desc: { en: "Classic pancakes with your choice of spreads: Nutella, Lotus or pistachio.", he: "פנקייק קלאסי עם ממרחים לבחירה: נוטלה, לוטוס או פיסטוק." },
          ingredients: { en: ["Pancakes", "Spread of your choice"], he: ["פנקייק", "ממרח לבחירה"] }
        },
        {
          id: "sv030", emoji: "🥞", price: 52, time: 10, calories: 880, tags: [],
          name: { en: "Kinder Pancakes", he: "פנקייק קינדר" },
          desc: { en: "Pancakes with Kinder spread.", he: "פנקייק קינדר." },
          ingredients: { en: ["Pancakes", "Kinder spread"], he: ["פנקייק", "ממרח קינדר"] }
        },
        {
          id: "sv031", emoji: "🥞", price: 70, time: 20, calories: 1080, tags: [],
          name: { en: "Soufflé Pancakes", he: "פנקייק סופלה" },
          desc: { en: "Fluffy soufflé pancakes.", he: "פנקייק סופלה." },
          ingredients: { en: [], he: [] }
        },
        {
          id: "sv032", emoji: "🥞", price: 75, time: 15, calories: 1250, tags: [],
          name: { en: "Indulgence Pancakes", he: "פנקייק שחיתות" },
          desc: { en: "Loaded, extra-rich pancakes.", he: "פנקייק שחיתות עשיר." },
          ingredients: { en: [], he: [] }
        }
      ]
    },
    {
      id: "special", emoji: "🍫",
      name: { en: "Special Desserts", he: "מיוחדים" },
      items: [
        {
          id: "sv033", emoji: "🥖", price: 37, time: 10, calories: 620, tags: [], featured: true,
          name: { en: "Churros", he: "צורוס" },
          desc: {
            en: "5 golden churros coated in cinnamon sugar. Choose up to 3 spreads for free: Nutella, Lotus or pistachio.",
            he: "5 יחידות צ׳ורוס מוזהבות, בציפוי קינמון וסוכר. ניתן לבחור עד 3 ממרחים בחינם: נוטלה, לוטוס או פיסטוק."
          },
          ingredients: { en: ["Churros dough", "Cinnamon", "Sugar", "Spreads of your choice"], he: ["בצק צ׳ורוס", "קינמון", "סוכר", "ממרחים לבחירה"] }
        },
        {
          id: "sv034", emoji: "🍫", price: 35, time: 12, calories: 690, tags: [],
          name: { en: "Chocolate Soufflé", he: "סופלה" },
          desc: { en: "Warm soufflé cake with milk and dark chocolate.", he: "עוגת סופלה חמה בשילוב שוקולד חלב ומריר." },
          ingredients: { en: ["Milk chocolate", "Dark chocolate"], he: ["שוקולד חלב", "שוקולד מריר"] }
        },
        {
          id: "sv035", emoji: "🍣", price: 35, time: 5, calories: 550, tags: [],
          name: { en: "Ice-Cream Sushi Roll", he: "רול סושי גלידה" },
          desc: { en: "Vanilla-cookies ice cream roll coated in fine chocolate and sliced coconut, cut like sushi.", he: "רול גלידה וניל עוגיות, מצופה שוקולד מעולה וקוקוס פרוס בצורת סושי." },
          ingredients: { en: ["Vanilla cookie ice cream", "Chocolate", "Coconut"], he: ["גלידת וניל עוגיות", "שוקולד", "קוקוס"] }
        }
      ]
    },
    {
      id: "pashapish", emoji: "🍡",
      name: { en: "Pashapish Balls", he: "פשאפיש" },
      items: [
        {
          id: "sv036", emoji: "🍡", price: 25, time: 8, calories: 430, tags: [],
          name: { en: "Pashapish Balls", he: "כדורי פשאפיש" },
          desc: {
            en: "10 balls ₪25 · 15 balls ₪37 · 20 balls ₪50 · 25 balls ₪60. Spreads: Nutella, Lotus or pistachio. (Calories for 10 balls.)",
            he: "10 כדורים ₪25 · 15 כדורים ₪37 · 20 כדורים ₪50 · 25 כדורים ₪60. ממרחים: נוטלה, לוטוס או פיסטוק. (קלוריות ל-10 כדורים.)"
          },
          ingredients: { en: ["Sweet dough balls", "Spreads of your choice"], he: ["כדורים מתוקים", "ממרחים לבחירה"] }
        }
      ]
    }
  ]
};

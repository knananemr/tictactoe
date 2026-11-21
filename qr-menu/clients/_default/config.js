/*
 * CLIENT CONFIG — the only file that changes per client.
 * Every text is written as { en: "...", he: "..." }.
 * To add a photo to an item, set  image: "images/my-photo.jpg".
 * Items without a photo show their emoji on a neutral tile.
 */
window.MENU_CONFIG = {
  brand: {
    name: { en: "Your Restaurant", he: "המסעדה שלך" },
    logo: "" // optional image path, e.g. "images/logo.png"
  },

  // Default look: black & white, rounded corners. Change per client.
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

  home: {
    headline: { en: "Hungry?", he: "רעבים?" },
    subtitle: { en: "Let's find something delicious.", he: "בואו נמצא משהו טעים." }
  },

  info: {
    about: {
      en: "A neighbourhood kitchen cooking fresh food every day from local ingredients.",
      he: "מטבח שכונתי שמבשל אוכל טרי כל יום מחומרי גלם מקומיים."
    },
    address: { en: "12 Example St., Tel Aviv", he: "רחוב הדוגמה 12, תל אביב" },
    phone: "03-000-0000",
    hours: [
      { days: { en: "Sunday – Thursday", he: "ראשון – חמישי" }, time: "12:00 – 23:00" },
      { days: { en: "Friday", he: "שישי" }, time: "11:00 – 16:00" },
      { days: { en: "Saturday", he: "שבת" }, time: "19:00 – 23:30" }
    ]
  },

  /*
   * Categories appear in this order. Item fields:
   *   name, desc        – texts
   *   price             – number
   *   time              – preparation time in minutes
   *   calories          – approximate kcal
   *   ingredients       – list per language
   *   tags              – any of: "popular", "new", "spicy", "vegan"
   *   featured: true    – shows in "Today's picks" on the home page
   */
  categories: [
    {
      id: "appetizers",
      emoji: "🥗",
      name: { en: "Appetizers", he: "ראשונות" },
      items: [
        {
          id: "hummus", emoji: "🧆", price: 32, time: 10, calories: 420, tags: ["popular", "vegan"],
          name: { en: "House Hummus", he: "חומוס הבית" },
          desc: { en: "Warm creamy hummus with olive oil, served with fresh pita.", he: "חומוס חם וקרמי עם שמן זית, מוגש עם פיתה טרייה." },
          ingredients: { en: ["Chickpeas", "Tahini", "Olive oil", "Lemon", "Pita"], he: ["חומוס", "טחינה", "שמן זית", "לימון", "פיתה"] }
        },
        {
          id: "cauliflower", emoji: "🥦", price: 38, time: 15, calories: 350, tags: ["vegan"],
          name: { en: "Roasted Cauliflower", he: "כרובית צלויה" },
          desc: { en: "Whole roasted cauliflower with tahini and herbs.", he: "כרובית שלמה צלויה בתנור עם טחינה ועשבי תיבול." },
          ingredients: { en: ["Cauliflower", "Tahini", "Parsley", "Garlic"], he: ["כרובית", "טחינה", "פטרוזיליה", "שום"] }
        },
        {
          id: "salad", emoji: "🥒", price: 28, time: 8, calories: 180, tags: ["vegan"],
          name: { en: "Chopped Salad", he: "סלט קצוץ" },
          desc: { en: "Finely chopped fresh vegetables with lemon and olive oil.", he: "ירקות טריים קצוצים דק עם לימון ושמן זית." },
          ingredients: { en: ["Tomato", "Cucumber", "Onion", "Lemon", "Olive oil"], he: ["עגבנייה", "מלפפון", "בצל", "לימון", "שמן זית"] }
        },
        {
          id: "soup", emoji: "🍲", price: 34, time: 10, calories: 260, tags: ["new"],
          name: { en: "Soup of the Day", he: "מרק היום" },
          desc: { en: "Ask the staff what is cooking today. Served with bread.", he: "שאלו את הצוות מה מתבשל היום. מוגש עם לחם." },
          ingredients: { en: ["Seasonal vegetables", "Herbs", "Bread"], he: ["ירקות העונה", "עשבי תיבול", "לחם"] }
        }
      ]
    },
    {
      id: "mains",
      emoji: "🍝",
      name: { en: "Main Dishes", he: "עיקריות" },
      items: [
        {
          id: "noodles", emoji: "🍜", price: 62, time: 30, calories: 1200, tags: ["popular", "spicy"], featured: true,
          name: { en: "Chili Mushroom Noodles", he: "נודלס פטריות וצ'ילי" },
          desc: { en: "Stir-fried noodles with mushrooms, peppers and chili sauce.", he: "נודלס מוקפץ עם פטריות, פלפלים ורוטב צ'ילי." },
          ingredients: { en: ["Noodles", "Mushrooms", "Peppers", "Chili sauce", "Garlic"], he: ["נודלס", "פטריות", "פלפלים", "רוטב צ'ילי", "שום"] }
        },
        {
          id: "burger", emoji: "🍔", price: 68, time: 20, calories: 950, tags: ["popular"], featured: true,
          name: { en: "Classic Burger", he: "המבורגר קלאסי" },
          desc: { en: "200g beef patty, lettuce, tomato and pickles. Served with fries.", he: "קציצת בקר 200 גרם, חסה, עגבנייה ומלפפון חמוץ. מוגש עם צ'יפס." },
          ingredients: { en: ["Beef", "Bun", "Lettuce", "Tomato", "Pickles", "Fries"], he: ["בקר", "לחמנייה", "חסה", "עגבנייה", "מלפפון חמוץ", "צ'יפס"] }
        },
        {
          id: "salmon", emoji: "🐟", price: 89, time: 25, calories: 640, tags: [], featured: true,
          name: { en: "Grilled Salmon", he: "סלמון על הגריל" },
          desc: { en: "Salmon fillet with roasted vegetables and lemon butter.", he: "פילה סלמון עם ירקות צלויים וחמאת לימון." },
          ingredients: { en: ["Salmon", "Zucchini", "Carrot", "Butter", "Lemon"], he: ["סלמון", "קישוא", "גזר", "חמאה", "לימון"] }
        },
        {
          id: "schnitzel", emoji: "🍗", price: 64, time: 20, calories: 880, tags: [],
          name: { en: "Chicken Schnitzel", he: "שניצל עוף" },
          desc: { en: "Crispy chicken schnitzel with mashed potatoes.", he: "שניצל עוף פריך עם פירה." },
          ingredients: { en: ["Chicken breast", "Breadcrumbs", "Egg", "Potatoes"], he: ["חזה עוף", "פירורי לחם", "ביצה", "תפוחי אדמה"] }
        },
        {
          id: "pasta", emoji: "🍝", price: 58, time: 18, calories: 780, tags: ["new"],
          name: { en: "Tomato Basil Pasta", he: "פסטה עגבניות ובזיליקום" },
          desc: { en: "Fresh pasta in slow-cooked tomato sauce with basil and parmesan.", he: "פסטה טרייה ברוטב עגבניות בבישול ארוך עם בזיליקום ופרמזן." },
          ingredients: { en: ["Pasta", "Tomatoes", "Basil", "Parmesan", "Garlic"], he: ["פסטה", "עגבניות", "בזיליקום", "פרמזן", "שום"] }
        },
        {
          id: "shakshuka", emoji: "🍳", price: 52, time: 15, calories: 560, tags: ["spicy"],
          name: { en: "Shakshuka", he: "שקשוקה" },
          desc: { en: "Eggs poached in spicy tomato and pepper sauce, with bread.", he: "ביצים ברוטב עגבניות ופלפלים חריף, מוגש עם לחם." },
          ingredients: { en: ["Eggs", "Tomatoes", "Peppers", "Onion", "Bread"], he: ["ביצים", "עגבניות", "פלפלים", "בצל", "לחם"] }
        }
      ]
    },
    {
      id: "drinks",
      emoji: "🥤",
      name: { en: "Drinks", he: "שתייה" },
      items: [
        {
          id: "lemonade", emoji: "🍋", price: 16, time: 3, calories: 120, tags: ["popular"],
          name: { en: "Mint Lemonade", he: "לימונענע" },
          desc: { en: "Fresh lemonade with mint, served ice cold.", he: "לימונדה טרייה עם נענע, מוגשת קרה." },
          ingredients: { en: ["Lemon", "Mint", "Sugar", "Ice"], he: ["לימון", "נענע", "סוכר", "קרח"] }
        },
        {
          id: "orange", emoji: "🍊", price: 18, time: 3, calories: 110, tags: [],
          name: { en: "Fresh Orange Juice", he: "מיץ תפוזים סחוט" },
          desc: { en: "Squeezed to order.", he: "נסחט במקום." },
          ingredients: { en: ["Oranges"], he: ["תפוזים"] }
        },
        {
          id: "coffee", emoji: "☕", price: 12, time: 4, calories: 5, tags: [],
          name: { en: "Espresso", he: "אספרסו" },
          desc: { en: "Single or double shot.", he: "קצר או כפול." },
          ingredients: { en: ["Coffee"], he: ["קפה"] }
        },
        {
          id: "soda", emoji: "🥤", price: 12, time: 1, calories: 140, tags: [],
          name: { en: "Soft Drinks", he: "שתייה קלה" },
          desc: { en: "Ask the staff for the selection.", he: "שאלו את הצוות על המבחר." },
          ingredients: { en: [], he: [] }
        }
      ]
    },
    {
      id: "desserts",
      emoji: "🍰",
      name: { en: "Desserts", he: "קינוחים" },
      items: [
        {
          id: "chocolate", emoji: "🍫", price: 38, time: 12, calories: 520, tags: ["popular"], featured: true,
          name: { en: "Warm Chocolate Cake", he: "עוגת שוקולד חמה" },
          desc: { en: "Soft-centred chocolate cake with vanilla ice cream.", he: "עוגת שוקולד עם לב נוזלי וגלידת וניל." },
          ingredients: { en: ["Chocolate", "Butter", "Eggs", "Flour", "Vanilla ice cream"], he: ["שוקולד", "חמאה", "ביצים", "קמח", "גלידת וניל"] }
        },
        {
          id: "cheesecake", emoji: "🍰", price: 36, time: 5, calories: 450, tags: [],
          name: { en: "Cheesecake", he: "עוגת גבינה" },
          desc: { en: "Baked cheesecake with berry sauce.", he: "עוגת גבינה אפויה עם רוטב פירות יער." },
          ingredients: { en: ["Cream cheese", "Biscuit", "Berries", "Sugar"], he: ["גבינת שמנת", "ביסקוויט", "פירות יער", "סוכר"] }
        },
        {
          id: "malabi", emoji: "🍮", price: 28, time: 5, calories: 280, tags: ["new"],
          name: { en: "Malabi", he: "מלבי" },
          desc: { en: "Milk pudding with rose syrup, coconut and peanuts.", he: "מלבי עם סירופ ורדים, קוקוס ובוטנים." },
          ingredients: { en: ["Milk", "Rose syrup", "Coconut", "Peanuts"], he: ["חלב", "סירופ ורדים", "קוקוס", "בוטנים"] }
        },
        {
          id: "sorbet", emoji: "🍧", price: 26, time: 3, calories: 160, tags: ["vegan"],
          name: { en: "Fruit Sorbet", he: "סורבה פירות" },
          desc: { en: "Three scoops of seasonal fruit sorbet.", he: "שלושה כדורי סורבה מפירות העונה." },
          ingredients: { en: ["Seasonal fruit", "Sugar"], he: ["פירות העונה", "סוכר"] }
        }
      ]
    }
  ]
};

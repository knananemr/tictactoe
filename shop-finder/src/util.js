// Small helpers with no imports: limits, escaping, patterns, phone and time helpers,
// the language of a text, search normalising, distance, the hash the router compares,
// and the page's #app element.
const MAX_PHOTOS = 4;
const DEFAULT_TZ = "Asia/Jerusalem";

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_RE = /^[^\s@<>"'()]+@[^\s@<>"'()]+\.[^\s@<>"'()]{2,}$/;
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

function normalizeText(s) {
  const finals = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
  return String(s || "").toLowerCase()
    .normalize("NFKD").replace(/[̀-֑ͯ-ׇ]/g, "")
    .replace(/[ךםןףץ]/g, c => finals[c])
    .replace(/["'`’‘“”׳״]/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ");
}

function distanceKm(a, b) {
  const rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };

// A location hash (or a whole URL) as the router compares it: none, "" or "#" is "#/".
const normHash = h => { h = String(h || ""); const i = h.indexOf("#"); h = i >= 0 ? h.slice(i) : ""; return !h || h === "#" ? "#/" : h; };

// The page's main element. Module scripts run after the page is parsed, so it exists.
const app = document.getElementById("app");

export {
  MAX_PHOTOS, DEFAULT_TZ, esc, TIME_RE, EMAIL_RE, PHOTO_RE, HE_PREFIX,
  phoneDigits, validPhone, whatsappNumber, toMin, isAllDay, ALL_DAY,
  textLang, normalizeText, distanceKm, setText, normHash, app
};

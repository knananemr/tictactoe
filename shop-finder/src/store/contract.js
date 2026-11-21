// The store's contract: the error codes every store call rejects with, the shop
// statuses and the report reasons. No imports, so any store file (and Step 4's
// supabase.js) can use it. Views read these through store/index.js.
export const ERROR_CODES = Object.freeze([
  "offline",        // the device has no connection
  "network",        // the server could not be reached or took too long
  "server",         // the server failed
  "full",           // no room left in this device's storage
  "blocked",        // the browser blocks saved data (private mode, settings)
  "not-found",      // no such shop, or not one this user may see
  "forbidden",      // not allowed (someone else's shop, a banned owner)
  "signed-out",     // needs sign-in, or the session ended
  "invalid",        // the data was refused (validation, bad report reason, details > 500)
  "limit",          // a count limit: err.limit "photos" (4 per shop) or "shops" (5 per owner)
  "rate-limited",   // too many tries; err.retryAfter (seconds) when known
  "wrong-password", // email or password is wrong
  "email-taken",    // an account with this email exists
  "weak-password",  // the password does not meet the rules
  "not-confirmed",  // the email address is not confirmed yet
  "unsupported",    // not available in this mode (accounts in local mode)
  "photo-upload",   // the shop was saved but some photos did not upload: err.saved, err.failed
  "unknown"         // anything else
]);
export const SHOP_STATUSES = Object.freeze(["pending", "published", "rejected", "hidden"]);
export const REPORT_REASONS = Object.freeze(["closed", "wrong-info", "fake", "offensive", "other"]);

// Every store rejection is one of these: an Error whose message and .code are the code,
// plus documented extras (limit, retryAfter, saved, failed). Unknown codes become "unknown".
export function storeError(code, extra) {
  const c = ERROR_CODES.includes(code) ? code : "unknown";
  return Object.assign(new Error(c), { code: c }, extra || {});
}
// The code of any rejection; views use this, never err.message.
export const errorCode = e => (e && ERROR_CODES.includes(e.code) ? e.code : "unknown");

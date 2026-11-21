// The one shared state object. Every variable that more than one module reads or writes
// lives here, because a module cannot assign to a `let` it imported from another module.
// Always read state.x when the value is needed (never copy it into a local for later).
// Nothing is read from storage here: main.js sets lang when it starts. Shops are not
// kept here: they live in the store (store.snapshot()).
export const state = {
  lang: "he",         // "he" or "en"; main.js reads the saved choice (prefs.js)
  routeToken: 0,      // +1 on every full render; a late store answer draws only if it still matches
  userPos: null,      // { lat, lng } once the customer shares location
  locState: "",       // "", "locating", "on", "demo", "denied", "unavailable", "unsupported"
  locToken: 0,
  filter: { q: "", category: "", radius: 0, openNow: false },
  firstRender: true,
  lastRoute: null,
  lastShopId: null,
  homeScrollY: 0,
  homeSig: "",
  pageNotice: null,   // { hash, kind } — "Your shop is live" etc., shown until you leave that page
  drafts: {},         // slot -> draft, for this page load
  draft: null,        // the draft of the form on screen
  formUi: null        // helpers of the form on screen, so late async work updates the live form
};

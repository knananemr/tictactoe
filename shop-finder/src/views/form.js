// The "open your shop" / "edit your shop" form.
import { state } from "../state.js";
import { nav } from "../nav.js";
import { L, tx, langAttr, dayName } from "../text.js";
import { esc, MAX_PHOTOS, DEFAULT_TZ, TIME_RE, EMAIL_RE, ALL_DAY, toMin, validPhone, app } from "../util.js";
import { ICON } from "../icons.js";
import { CATEGORIES } from "../categories.js";
import { store } from "../store/index.js";
import { announce } from "../notices.js";
import { blankService, getDraft, saveDraft, discardDraft, isLive } from "../drafts.js";
import { saveErrorText } from "./states.js";
import { renderNotFound, backLink } from "./shop.js";
import { cardHtml } from "./card.js";

function locStatusHtml(state) {
  const t = L();
  if (state === "set") return `${esc(t.locSet)} ${ICON.check}`;
  return esc({ locating: t.locating, failed: t.locFailed, unavailable: t.locUnavailable, unsupported: t.locUnsupported }[state] || t.locNone);
}

function renderForm(editId, entering) {
  const t = L();
  let editing = null;
  if (editId !== null) {
    const hit = store.snapshot().shops.find(s => s.id === editId) || null;
    editing = hit && hit.mine ? hit : null;
    if (!editing) {
      if (hit) renderNotFound(t.ownerOnly, t.ownerOnlySub, "#/shop/" + encodeURIComponent(hit.id));
      else renderNotFound();
      return;
    }
  }
  const slot = editing ? "edit." + editing.id : "new";
  const got = getDraft(slot, editing);
  const d = state.draft = got.d;
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

  state.formUi = {
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
    btn.disabled = d.pending > 0 || !!d.saving;
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
    if (!navigator.geolocation) { state.formUi.setLoc("unsupported"); return; }
    state.formUi.setLoc("locating");
    navigator.geolocation.getCurrentPosition(p => {
      d.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
      d.dirty = true;
      saveDraft(d);
      if (isLive(d)) state.formUi.setLoc("set");
    }, err => {
      if (isLive(d)) state.formUi.setLoc(d.pos ? "set" : (err && err.code === 1 ? "failed" : "unavailable"));
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
      if (isLive(d)) state.formUi.photosChanged(notes);
      return;
    }
    // The photos belong to this draft even if the form is redrawn (language switch) or left meanwhile.
    d.pending += take.length;
    if (isLive(d)) state.formUi.photosChanged(null);
    for (const f of take) {
      const data = await shrinkImage(f);
      d.pending--;
      if (data && d.photos.length < MAX_PHOTOS) { d.photos.push(data); d.photosChanged = true; d.dirty = true; } else if (!data) bad++;
      if (isLive(d)) state.formUi.photosChanged(null);
    }
    if (bad) notes.push("photosBad");
    saveDraft(d);
    if (isLive(d)) state.formUi.photosChanged(notes);
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

  let submitting = false; // stays true after a successful save: this form is done
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (d.pending > 0 || d.saving || submitting) return;
    collect(false);
    const errors = validate();
    d.showErrors = true;
    showValidation(errors, true);
    if (Object.keys(errors).length) return;

    // The store re-reads the saved shops (another tab may have changed them), cleans the
    // shop and gives a new shop its id. d.saving guards against a second submit meanwhile.
    submitting = true;
    d.saving = { step: "saving" };
    updateSubmit();
    const draft = Object.assign(draftToShop(d), { id: editing ? editing.id : undefined, photos: d.photos.map(url => ({ url })) });
    store.saveShop(draft).then(({ shop }) => {
      d.saving = null;
      discardDraft(d.slot);
      if (!isLive(d)) return;
      const dest = "#/shop/" + encodeURIComponent(shop.id);
      state.pageNotice = { hash: dest, kind: editing ? "edit" : "new" };
      announce(editing ? L().saved : L().published);
      nav.navigate(dest, { replace: true });
    }, err => {
      d.saving = null;
      submitting = false;
      if (!isLive(d)) return;
      updateSubmit();
      showFormError(saveErrorText(err));
    });
  });
}

// The store changed while an edit form (#/edit/<id>) is on screen (main.js dispatches it):
// the shop was deleted in another tab, so the edits cannot be saved.
function formStoreChanged(change, editId) {
  if (!change || change.type !== "shops" || change.source === "detail") return;
  if (!(change.removed || []).includes(editId)) return;
  const d = state.drafts["edit." + editId];
  if (d && d.saving) return;
  discardDraft("edit." + editId);
  state.formUi = null;
  renderNotFound(change.source === "other-tab" ? L().deletedTab : L().notFound, L().notFoundSub);
  app.querySelector("h1").focus({ preventScroll: true });
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

export { renderForm, formStoreChanged };

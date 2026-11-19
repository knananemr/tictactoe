// js/core/links.js
// The only place an href is built (2.6, 9.4): a fixed scheme plus encodeURIComponent.
// A stored value is never used as an address. This is also the one file under js/ that may
// name an outside address.
// Every function returns the address as a string, or null when no link can be made
// (no usable number, no valid email address, or text that cannot be encoded).
(function (L) {
  'use strict';

  const WA_PHONE = 'https://wa.me/';
  const WA_WEB = 'https://web.whatsapp.com/send';
  const WA_APP = 'whatsapp://send';
  const SECURE = 'https://';
  const EMAIL_RE = /^[^@\s]+@[^@\s]+$/;

  // encodeURIComponent after toWellFormed (where it exists). Throws URIError when the text
  // holds half of an emoji and the browser cannot repair it.
  function enc(text) {
    let s = String(text === null || text === undefined ? '' : text);
    if (typeof s.toWellFormed === 'function') s = s.toWellFormed();
    return encodeURIComponent(s);
  }

  // false when a link with this text cannot be prepared: the button then shows
  // "Could not prepare the link. Use Copy."
  function canEncode(text) {
    try { enc(text); return true; } catch (e) { return false; }
  }

  function hasText(text) {
    return text !== null && text !== undefined && String(text) !== '';
  }

  function international(phoneText, settings) {
    return L.core.phone.toInternational(phoneText, settings ? settings.countryCode : '');
  }

  // tel('054-123 4567', settings) -> 'tel:+972541234567'
  // With no international form: the typed digits. With no digits at all: null.
  function tel(phoneText, settings) {
    const intl = international(phoneText, settings);
    if (intl) return 'tel:+' + intl;
    const typed = L.core.phone.digits(phoneText);
    return typed === '' ? null : 'tel:' + typed;
  }

  // sms(phone, text, settings) -> 'sms:+972541234567?&body=Hello'
  function sms(phoneText, text, settings) {
    const intl = international(phoneText, settings);
    const typed = L.core.phone.digits(phoneText);
    if (!intl && typed === '') return null;
    const to = intl ? '+' + intl : typed;
    if (!hasText(text)) return 'sms:' + to;
    try {
      return 'sms:' + to + '?&body=' + enc(text);
    } catch (e) {
      return null;
    }
  }

  // whatsapp(phone, text, settings, platform) -> the WhatsApp link, or null when the number
  // has no international form (WhatsApp needs one).
  //   on a phone or tablet:  https://wa.me/<digits>?text=...
  //   on a computer, by settings.whatsappOnComputer:
  //     'browser'  the wa.me link
  //     'app'      whatsapp://send?phone=<digits>&text=...
  //     'web'      https://web.whatsapp.com/send?phone=<digits>&text=...
  // platform: 'phone' or 'computer'; left out, util.platform() decides.
  function whatsapp(phoneText, text, settings, platform) {
    const intl = international(phoneText, settings);
    if (!intl) return null;
    let encoded = '';
    if (hasText(text)) {
      try { encoded = enc(text); } catch (e) { return null; }
    }
    const device = platform || L.core.util.platform();
    const mode = device === 'computer' && settings ? settings.whatsappOnComputer : 'browser';
    if (mode === 'app') {
      return WA_APP + '?phone=' + intl + (encoded ? '&text=' + encoded : '');
    }
    if (mode === 'web') {
      return WA_WEB + '?phone=' + intl + (encoded ? '&text=' + encoded : '');
    }
    return WA_PHONE + intl + (encoded ? '?text=' + encoded : '');
  }

  // mailto('dana+laser@example.com', 'Your appointment', 'Hi') ->
  //   'mailto:dana%2Blaser@example.com?subject=Your%20appointment&body=Hi'
  // The @ stays literal. Line breaks in the text become \r\n. subject and text are optional.
  function mailto(email, subject, text) {
    const address = String(email === null || email === undefined ? '' : email).trim();
    if (!EMAIL_RE.test(address)) return null;
    const at = address.indexOf('@');
    try {
      let href = 'mailto:' + enc(address.slice(0, at)) + '@' + enc(address.slice(at + 1));
      const query = [];
      if (hasText(subject)) query.push('subject=' + enc(subject));
      if (hasText(text)) query.push('body=' + enc(String(text).replace(/\r\n|\r|\n/g, '\r\n')));
      if (query.length) href += '?' + query.join('&');
      return href;
    } catch (e) {
      return null;
    }
  }

  // true for a link that opens a web page (the two WhatsApp web addresses): the view gives
  // such a link target="_blank" rel="noopener noreferrer". tel, sms, mailto and whatsapp:
  // links open their app without a new tab.
  function opensNewTab(href) {
    return typeof href === 'string' && href.slice(0, SECURE.length) === SECURE;
  }

  // The rule for settings.requestPageUrl (4.6): text that starts with the secure scheme.
  // The address is only ever placed inside message text.
  function isSecureAddress(text) {
    return typeof text === 'string' && text.length > SECURE.length &&
      text.slice(0, SECURE.length) === SECURE && !/\s/.test(text);
  }

  L.core.links = {
    tel: tel,
    sms: sms,
    whatsapp: whatsapp,
    mailto: mailto,
    canEncode: canEncode,
    securePrefix: SECURE,
    opensNewTab: opensNewTab,
    isSecureAddress: isSecureAddress
  };
})(window.Laser);

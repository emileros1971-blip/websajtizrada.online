/* ============================================================
   websajtizrada.online — Production
   Central configuration + shared behaviors.
   Edit the SITE_CONFIG object below to update contact details,
   tracking IDs, and integration keys across the whole site.
   ============================================================ */

const SITE_CONFIG = {
  company: "websajtizrada.online",
  // --- Contact ---
  phone: "+381 69 150 8197",
  phoneTel: "+381691508197",
  whatsapp: "381691508197",
  viber: "+381691508197",
  email: "emileros1971@gmail.com",
  address: "Palić / Subotica, Srbija",
  hours: "Pon–Pet 09:00–18:00",

  // --- Web3Forms ---
  web3formsKey: "57dc636c-b5e8-49d8-b69e-4d4563c2ccbb",

  // --- Tracking (loaded only after consent) ---
  gaId: "G-8Q7W1SB4F5",
  metaPixelId: "1217508533643465",

  social: { facebook: "", instagram: "", linkedin: "" },
};

/* ---------- Helpers ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* Inject configured phone / links across pages */
function applyConfig() {
  $$('[data-cfg-phone]').forEach(el => el.textContent = SITE_CONFIG.phone);
  $$('[data-cfg-phone-link]').forEach(el => el.setAttribute('href', 'tel:' + SITE_CONFIG.phoneTel));
  $$('[data-cfg-whatsapp]').forEach(el => el.setAttribute('href', 'https://wa.me/' + SITE_CONFIG.whatsapp));
  $$('[data-cfg-viber]').forEach(el => el.setAttribute('href', 'viber://chat?number=' + encodeURIComponent(SITE_CONFIG.viber)));
  $$('[data-cfg-email]').forEach(el => {
    if (el.tagName === 'A') el.setAttribute('href', 'mailto:' + SITE_CONFIG.email);
    else el.textContent = SITE_CONFIG.email;
  });
  $$('[data-cfg-hours]').forEach(el => el.textContent = SITE_CONFIG.hours);
  $$('[data-cfg-address]').forEach(el => el.textContent = SITE_CONFIG.address);
  $$('[data-cfg-year]').forEach(el => el.textContent = new Date().getFullYear());
}

/* ---------- Mobile menu ---------- */
function initMobileMenu() {
  const toggle = $('#hamburger');
  const menu = $('#mobile-menu');
  const closeBtn = $('#mobile-menu-close');
  if (!toggle || !menu) return;

  const open = () => {
    menu.dataset.open = 'true';
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    menu.dataset.open = 'false';
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  toggle.addEventListener('click', () => {
    (menu.dataset.open === 'true') ? close() : open();
  });
  closeBtn && closeBtn.addEventListener('click', close);
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ---------- Contact form (Web3Forms) ---------- */
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const status = $('#form-status', form);
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';

    // Honeypot check
    if (form.querySelector('input[name="botcheck"]').value) return;

    // Simple client-side validation
    let ok = true;
    $$('[data-required]', form).forEach(el => {
      const field = el.closest('.field');
      const empty = !el.value.trim();
      const invalidEmail = el.type === 'email' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
      if (empty || invalidEmail) {
        ok = false;
        field.classList.add('has-error');
        el.setAttribute('aria-invalid', 'true');
      } else {
        field.classList.remove('has-error');
        el.removeAttribute('aria-invalid');
      }
    });
    const consent = form.querySelector('input[name="consent"]');
    if (!consent.checked) {
      ok = false;
      consent.closest('.consent').classList.add('has-error');
    }
    if (!ok) {
      status.className = 'form-status error';
      status.textContent = 'Molimo popunite obavezna polja i potvrdite saglasnost.';
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Slanje…';

    const formData = new FormData(form);
    formData.append('access_key', SITE_CONFIG.web3formsKey);
    formData.append('from_name', 'websajtizrada.online kontakt forma');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        status.className = 'form-status success';
        status.textContent = 'Hvala. Vaša poruka je poslata. Javićemo vam se ubrzo.';
        form.reset();
        trackEvent('form_submit', { form: 'contact' });
      } else {
        throw new Error(data.message || 'Greška pri slanju.');
      }
    } catch (err) {
      status.className = 'form-status error';
      status.textContent = 'Došlo je do greške. Pozovite nas direktno na ' + SITE_CONFIG.phone + '.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

/* ---------- Granular cookie consent ---------- */
const COOKIE_KEY = 'wsi_consent_v2';
function getConsent() {
  try { return JSON.parse(localStorage.getItem(COOKIE_KEY)) || null; } catch { return null; }
}
function saveConsent(c) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...c, ts: Date.now() }));
  applyConsent(c);
}
function applyConsent(c) {
  if (c.analytics) loadGA();
  if (c.marketing) loadMetaPixel();
}
function initCookieBanner() {
  const banner = $('#cookie-banner');
  const prefs = $('#cookie-prefs');
  const existing = getConsent();
  if (banner && !existing) banner.dataset.open = 'true';
  if (existing) applyConsent(existing);

  const acceptAll = () => { banner && (banner.dataset.open = 'false'); prefs && (prefs.dataset.open = 'false'); saveConsent({ essential:true, analytics:true, marketing:true }); };
  const rejectAll = () => { banner && (banner.dataset.open = 'false'); prefs && (prefs.dataset.open = 'false'); saveConsent({ essential:true, analytics:false, marketing:false }); };
  const openPrefs = () => {
    if (!prefs) return;
    const c = getConsent() || { analytics:false, marketing:false };
    const a = $('#cp-analytics'); const m = $('#cp-marketing');
    if (a) a.checked = !!c.analytics;
    if (m) m.checked = !!c.marketing;
    prefs.dataset.open = 'true';
  };
  const savePrefs = () => {
    const a = $('#cp-analytics')?.checked || false;
    const m = $('#cp-marketing')?.checked || false;
    saveConsent({ essential:true, analytics:a, marketing:m });
    banner && (banner.dataset.open = 'false');
    prefs && (prefs.dataset.open = 'false');
  };
  $('#cookie-accept')?.addEventListener('click', acceptAll);
  $('#cookie-reject')?.addEventListener('click', rejectAll);
  $('#cookie-customize')?.addEventListener('click', openPrefs);
  $('#cookie-prefs-save')?.addEventListener('click', savePrefs);
  $('#cookie-prefs-close')?.addEventListener('click', () => { prefs && (prefs.dataset.open = 'false'); });
  $$('[data-open-cookie-prefs]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openPrefs(); }));
}

/* ---------- Analytics loaders (per consent category) ---------- */
let _gaLoaded = false, _pxLoaded = false;
function loadGA() {
  if (_gaLoaded || !SITE_CONFIG.gaId) return; _gaLoaded = true;
  const s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + SITE_CONFIG.gaId;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', SITE_CONFIG.gaId, { anonymize_ip: true });
}
function loadMetaPixel() {
  if (_pxLoaded || !SITE_CONFIG.metaPixelId) return; _pxLoaded = true;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', SITE_CONFIG.metaPixelId);
  window.fbq('track', 'PageView');
}

/* ---------- Smooth in-page anchor scroll ---------- */
function initSmoothAnchors() {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ---------- Event tracking ---------- */
function trackEvent(name, params) {
  if (window.gtag) window.gtag('event', name, params || {});
  if (window.fbq) window.fbq('trackCustom', name, params || {});
}
function initClickTracking() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('tel:')) trackEvent('click_phone', { location: a.dataset.loc || 'unknown' });
    else if (href.includes('wa.me')) trackEvent('click_whatsapp', {});
    else if (href.startsWith('viber:')) trackEvent('click_viber', {});
  });
}

/* ---------- Reveal on scroll ---------- */
function initReveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(el => io.observe(el));
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  initMobileMenu();
  initContactForm();
  initCookieBanner();
  initClickTracking();
  initSmoothAnchors();
  initReveal();
});

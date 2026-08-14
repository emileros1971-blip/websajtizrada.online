/* ============================================================
   websajtizrada.online — Production
   Central configuration + shared behaviors.
   Edit the SITE_CONFIG object below to update contact details,
   tracking IDs, and integration keys across the whole site.
   ============================================================ */

const SITE_CONFIG = {
  company: "websajtizrada.online",
  legalName: "Silverado Video Emil Eres PR",
  // --- Contact ---
  phone: "+381 69 150 8197",
  phoneTel: "+381691508197",
  whatsapp: "381691508197",
  viber: "+381691508197",
  email: "emileros1971@gmail.com",
  address: "Palić / Subotica, Srbija",
  hours: "Pon–Sub 08:00–17:00",

  // --- Web3Forms ---
  web3formsKey: "f691abcd-3333-49c6-8553-e1524b5e2140",

  // --- Tracking (loaded only after consent) ---
  gaId: "G-XZM28DBJ6B",
  // Add the Google Ads destination ID (AW-XXXXXXXXX) and labels below when created.
  googleAdsId: "",
  googleAdsConversions: {
    formSubmit: "",
    phoneClick: "",
    whatsappClick: "",
    viberClick: "",
  },
  // Intentionally blank until the new Meta dataset/pixel is created.
  metaPixelId: "",

  social: {
    facebook: "https://www.facebook.com/SilveradoVideo",
    instagram: "https://www.instagram.com/emil.eros/",
    linkedin: ""
  },
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
  $$('[data-cfg-facebook]').forEach(el => el.setAttribute('href', SITE_CONFIG.social.facebook));
  $$('[data-cfg-instagram]').forEach(el => el.setAttribute('href', SITE_CONFIG.social.instagram));

  // Keep rendered contact metadata aligned with the Google Business Profile hours.
  const path = window.location.pathname;
  if (path.endsWith('/kontakt.html') || path.endsWith('kontakt.html')) {
    const contactDescription = `Kontakt: telefon ${SITE_CONFIG.phone}, email ${SITE_CONFIG.email}. ${SITE_CONFIG.address}. Pon–Sub 08:00–17:00.`;
    const metaDescription = document.querySelector('meta[name="description"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (metaDescription) metaDescription.setAttribute('content', contactDescription);
    if (ogDescription) ogDescription.setAttribute('content', contactDescription);
    if (twitterDescription) twitterDescription.setAttribute('content', contactDescription);
  }
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
    if (form.querySelector('input[name="botcheck"]').checked) return;

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
  if (c.marketing) {
    loadGoogleAds();
    loadMetaPixel();
  }
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
let _googleTagScriptLoaded = false;
let _googleJsInitialized = false;
let _gaLoaded = false;
let _adsLoaded = false;
let _pxLoaded = false;

function ensureGoogleTag(primaryId) {
  if (!primaryId) return false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };

  if (!_googleTagScriptLoaded) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(primaryId);
    document.head.appendChild(s);
    _googleTagScriptLoaded = true;
  }

  if (!_googleJsInitialized) {
    window.gtag('js', new Date());
    _googleJsInitialized = true;
  }
  return true;
}

function loadGA() {
  if (_gaLoaded || !SITE_CONFIG.gaId) return;
  if (!ensureGoogleTag(SITE_CONFIG.gaId)) return;
  _gaLoaded = true;
  window.gtag('config', SITE_CONFIG.gaId, { anonymize_ip: true });
}

function loadGoogleAds() {
  if (_adsLoaded || !SITE_CONFIG.googleAdsId) return;
  if (!ensureGoogleTag(SITE_CONFIG.googleAdsId)) return;
  _adsLoaded = true;
  window.gtag('config', SITE_CONFIG.googleAdsId);
}

function sendGoogleAdsConversion(label, params) {
  const consent = getConsent();
  if (!consent?.marketing || !SITE_CONFIG.googleAdsId || !label) return;
  loadGoogleAds();
  if (!window.gtag) return;
  window.gtag('event', 'conversion', {
    send_to: SITE_CONFIG.googleAdsId + '/' + label,
    ...(params || {}),
  });
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
  const eventParams = params || {};
  if (window.gtag) window.gtag('event', name, eventParams);
  if (window.fbq) window.fbq('trackCustom', name, eventParams);

  const labels = SITE_CONFIG.googleAdsConversions || {};
  if (name === 'form_submit') sendGoogleAdsConversion(labels.formSubmit, eventParams);
  else if (name === 'click_phone') sendGoogleAdsConversion(labels.phoneClick, eventParams);
  else if (name === 'click_whatsapp') sendGoogleAdsConversion(labels.whatsappClick, eventParams);
  else if (name === 'click_viber') sendGoogleAdsConversion(labels.viberClick, eventParams);
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

/* ---------- Cross-brand relationship + local SEO links ---------- */
function initCrossBrandLinks() {
  const path = window.location.pathname;
  const language = path.startsWith('/en/') ? 'en' : path.startsWith('/hu/') ? 'hu' : 'sr';
  const rootPrefix = language === 'sr' ? '' : '../';
  const copy = {
    sr: {
      brand: 'WebsajtIzrada.online je specijalizovana usluga firme ',
      company: 'Silverado Video Emil Eres PR',
      local: 'Izrada sajtova Subotica'
    },
    en: {
      brand: 'WebsajtIzrada.online is a specialised service of ',
      company: 'Silverado Video Emil Eres PR',
      local: 'Web design in Subotica'
    },
    hu: {
      brand: 'A WebsajtIzrada.online a következő vállalkozás szakosodott szolgáltatása: ',
      company: 'Silverado Video Emil Eres PR',
      local: 'Weboldal-készítés Szabadkán'
    }
  }[language];

  const footerBrand = document.querySelector('.footer-brand');
  if (footerBrand && !footerBrand.querySelector('[data-cross-brand]')) {
    const paragraph = document.createElement('p');
    paragraph.setAttribute('data-cross-brand', 'true');
    paragraph.append(document.createTextNode(copy.brand));
    const companyLink = document.createElement('a');
    companyLink.href = 'https://silverado.pro/';
    companyLink.target = '_blank';
    companyLink.rel = 'noopener';
    companyLink.textContent = copy.company;
    paragraph.append(companyLink, document.createTextNode('.'));
    footerBrand.appendChild(paragraph);
  }

  if (footerBrand && !footerBrand.querySelector('[data-cross-brand-social]')) {
    const socialParagraph = document.createElement('p');
    socialParagraph.setAttribute('data-cross-brand-social', 'true');
    const links = [];
    if (SITE_CONFIG.social.facebook) {
      const facebook = document.createElement('a');
      facebook.href = SITE_CONFIG.social.facebook;
      facebook.target = '_blank';
      facebook.rel = 'noopener noreferrer';
      facebook.textContent = 'Facebook';
      links.push(facebook);
    }
    if (SITE_CONFIG.social.instagram) {
      const instagram = document.createElement('a');
      instagram.href = SITE_CONFIG.social.instagram;
      instagram.target = '_blank';
      instagram.rel = 'noopener noreferrer';
      instagram.textContent = 'Instagram';
      links.push(instagram);
    }
    links.forEach((link, index) => {
      if (index) socialParagraph.append(document.createTextNode(' · '));
      socialParagraph.appendChild(link);
    });
    if (links.length) footerBrand.appendChild(socialParagraph);
  }

  const serviceLists = document.querySelectorAll('.site-footer .footer-grid ul');
  const serviceList = serviceLists.length ? serviceLists[0] : null;
  if (serviceList && !serviceList.querySelector('[data-local-seo-link]')) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = rootPrefix + 'izrada-sajtova-subotica.html';
    link.textContent = copy.local;
    link.setAttribute('data-local-seo-link', 'true');
    item.appendChild(link);
    serviceList.appendChild(item);
  }

  const isSerbianHome = language === 'sr' && (path === '/' || path.endsWith('/index.html'));
  const heroMeta = document.querySelector('.hero-meta');
  if (isSerbianHome && heroMeta && !document.querySelector('[data-local-hero-link]')) {
    const localLine = document.createElement('p');
    localLine.className = 'hero-meta';
    localLine.setAttribute('data-local-hero-link', 'true');
    localLine.append(document.createTextNode('Tražite lokalnog partnera? '));
    const localLink = document.createElement('a');
    localLink.href = 'izrada-sajtova-subotica.html';
    localLink.innerHTML = '<strong>Izrada sajtova u Subotici</strong>';
    localLine.appendChild(localLink);
    heroMeta.insertAdjacentElement('afterend', localLine);
  }

  // Add one natural contextual internal link from the key Serbian pages to the local Subotica landing page.
  if (language === 'sr' && !document.querySelector('[data-subotica-context-link]')) {
    const pageName = path.split('/').pop() || 'index.html';
    const localContext = {
      'izrada-sajtova.html': {
        prefix: 'Za firme i preduzetnike iz Subotice i okoline pogledajte detalje za ',
        anchor: 'izradu web sajta u Subotici'
      },
      'cene.html': {
        prefix: 'Ako poslujete u Subotici, pogledajte posebnu stranicu za ',
        anchor: 'izradu sajta u Subotici'
      },
      'portfolio.html': {
        prefix: 'Tražite sličan projekat za lokalni biznis? Pogledajte ',
        anchor: 'izradu sajtova za firme iz Subotice'
      }
    }[pageName];
    const intro = document.querySelector('main .hero-lead');
    if (localContext && intro) {
      const localParagraph = document.createElement('p');
      localParagraph.setAttribute('data-subotica-context-link', 'true');
      localParagraph.style.marginTop = '1rem';
      localParagraph.append(document.createTextNode(localContext.prefix));
      const localLink = document.createElement('a');
      localLink.href = 'izrada-sajtova-subotica.html';
      localLink.textContent = localContext.anchor;
      localParagraph.append(localLink, document.createTextNode('.'));
      intro.insertAdjacentElement('afterend', localParagraph);
    }
  }

  if (!document.querySelector('script[data-cross-brand-schema]')) {
    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.setAttribute('data-cross-brand-schema', 'true');
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://silverado.pro/#organization',
          name: SITE_CONFIG.legalName,
          url: 'https://silverado.pro/'
        },
        {
          '@type': 'ProfessionalService',
          '@id': 'https://websajtizrada.online/#business',
          name: 'websajtizrada.online',
          legalName: SITE_CONFIG.legalName,
          url: 'https://websajtizrada.online/',
          telephone: SITE_CONFIG.phoneTel,
          email: SITE_CONFIG.email,
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Palić',
            addressRegion: 'Vojvodina',
            addressCountry: 'RS'
          },
          areaServed: [
            { '@type': 'City', name: 'Subotica' },
            { '@type': 'Place', name: 'Palić' },
            { '@type': 'Place', name: 'Bačka Topola' },
            { '@type': 'Place', name: 'Kanjiža' },
            { '@type': 'Place', name: 'Senta' },
            { '@type': 'Place', name: 'Ada' }
          ],
          openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '08:00',
            closes: '17:00'
          },
          parentOrganization: { '@id': 'https://silverado.pro/#organization' },
          sameAs: [
            'https://silverado.pro/',
            SITE_CONFIG.social.facebook,
            SITE_CONFIG.social.instagram
          ].filter(Boolean)
        }
      ]
    });
    document.head.appendChild(schema);
  }
}

document.addEventListener('DOMContentLoaded', initCrossBrandLinks);

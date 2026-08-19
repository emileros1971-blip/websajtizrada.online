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
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)n=f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
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

/* ---------- Video sample embeds ---------- */
function initVideoSamples() {
  const showcase = document.querySelector('.video-showcase');
  if (!showcase) return;

  const slots = Array.from(showcase.querySelectorAll('.video-slot'));
  const videoIds = ['vXKtVJm63mA', 'oWgdLQ6HAvc', 'EsDlRGtg3RM'];
  if (slots.length < 6) return;

  videoIds.forEach((videoId, index) => {
    const slot = slots[index + 3];
    const frame = slot?.querySelector('.video-frame');
    if (!frame) return;

    frame.innerHTML = '';
    frame.style.overflow = 'hidden';

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
    iframe.title = slot.querySelector('.video-label strong')?.textContent || `YouTube video ${index + 1}`;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    Object.assign(iframe.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      border: '0',
      zIndex: '2'
    });
    frame.appendChild(iframe);

    const meta = slot.querySelector('.video-label span');
    if (meta) meta.textContent = 'YouTube Shorts';
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
  initVideoSamples();
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

/* GOOGLE REVIEWS SECTION 2026-08-18 */
(() => {
  const homepagePaths = new Set([
    '/', '/index.html',
    '/en/', '/en/index.html',
    '/hu/', '/hu/index.html'
  ]);
  let currentPath = window.location.pathname || '/';
  if (!currentPath.startsWith('/')) currentPath = '/' + currentPath;
  if (!homepagePaths.has(currentPath)) return;
  if (document.querySelector('.google-reviews-section')) return;

  const langAttr = (document.documentElement.lang || '').toLowerCase();
  const lang = langAttr.startsWith('hu') ? 'hu' : (langAttr.startsWith('en') ? 'en' : 'sr');

  const copy = {
    sr: {
      eyebrow: 'Google recenzije',
      title: 'Klijenti su nam dali 5★ na Google-u',
      intro: 'Tri potvrđene Google recenzije klijenata koji su sa nama radili na svojim web projektima.',
      badge: 'Google recenzija',
      summary: '3 potvrđene recenzije · sve 5★',
      reviews: [
        { name: 'Aleksa Tesic', text: 'Gospodin sa kojim smo započeli saradnju na našem sajtu je FENOMENALAN. On…' },
        { name: 'Nikola Lalic', text: 'Sve pohvale stručnosti i brzini! Napravili su moderan i funkcionalan…' },
        { name: 'Naim Morina', text: 'Veoma sam zadovoljan sajtom, urađen je u rekordnom roku, veoma…' }
      ]
    },
    en: {
      eyebrow: 'Google reviews',
      title: 'Our clients gave us 5★ on Google',
      intro: 'Three verified Google reviews from clients who worked with us on their web projects.',
      badge: 'Google review',
      summary: '3 verified reviews · all 5★',
      reviews: [
        { name: 'Aleksa Tesic', text: 'The gentleman with whom we started working on our website is PHENOMENAL. He…' },
        { name: 'Nikola Lalic', text: 'All praise for the expertise and speed! They created a modern and functional…' },
        { name: 'Naim Morina', text: 'I am very satisfied with the website, it was done in record time, very…' }
      ]
    },
    hu: {
      eyebrow: 'Google értékelések',
      title: 'Ügyfeleink 5★-ra értékeltek a Google-on',
      intro: 'Három ellenőrzött Google-értékelés olyan ügyfelektől, akik velünk készíttették webes projektjüket.',
      badge: 'Google értékelés',
      summary: '3 ellenőrzött értékelés · mind 5★',
      reviews: [
        { name: 'Aleksa Tesic', text: 'Az úr, akivel elkezdtünk dolgozni a weboldalunkon, FENOMENÁLIS. Ő…' },
        { name: 'Nikola Lalic', text: 'Minden elismerés a szakértelemért és a gyorsaságért! Modern és funkcionális…' },
        { name: 'Naim Morina', text: 'Nagyon elégedett vagyok a weboldallal, rekordidő alatt készült el, nagyon…' }
      ]
    }
  }[lang];

  const faqList = document.querySelector('.faq-list');
  const faqSection = faqList ? faqList.closest('section') : null;
  if (!faqSection || !faqSection.parentNode) return;

  if (!document.getElementById('google-reviews-styles')) {
    const style = document.createElement('style');
    style.id = 'google-reviews-styles';
    style.textContent = `
      .google-reviews-section{padding:clamp(4rem,8vw,7rem) 0;background:#fff}
      .google-reviews-head{text-align:center;max-width:760px;margin:0 auto 2.2rem}
      .google-reviews-head .section-eyebrow{display:inline-block}
      .google-reviews-head h2{margin:.65rem 0 .8rem}
      .google-reviews-head p{margin:0 auto;max-width:690px}
      .google-reviews-summary{display:inline-flex;align-items:center;gap:.55rem;margin-top:1.1rem;padding:.55rem .9rem;border:1px solid rgba(15,23,42,.1);border-radius:999px;background:#f8fafc;font-weight:700;font-size:.92rem;color:#334155}
      .google-reviews-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.15rem}
      .google-review-card{position:relative;display:flex;flex-direction:column;min-height:245px;padding:1.55rem;border:1px solid rgba(15,23,42,.09);border-radius:20px;background:#fff;box-shadow:0 14px 40px rgba(15,23,42,.07)}
      .google-review-top{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1rem}
      .google-review-stars{font-size:1.04rem;letter-spacing:.12em;color:#f59e0b;white-space:nowrap}
      .google-review-badge{font-size:.75rem;font-weight:700;color:#475569;background:#f1f5f9;border-radius:999px;padding:.38rem .62rem;white-space:nowrap}
      .google-review-card blockquote{margin:0 0 1.35rem;font-size:1.04rem;line-height:1.7;color:#1e293b;font-style:normal;flex:1}
      .google-review-author{display:flex;align-items:center;gap:.7rem;font-weight:800;color:#0f172a}
      .google-review-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#eef4ff;color:#0b5cff;font-weight:800}
      @media(max-width:900px){.google-reviews-grid{grid-template-columns:1fr}.google-review-card{min-height:0}}
    `;
    document.head.appendChild(style);
  }

  const section = document.createElement('section');
  section.className = 'google-reviews-section';
  section.setAttribute('aria-labelledby', 'google-reviews-title');

  const cards = copy.reviews.map((review) => {
    const initials = review.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
    return `
      <article class="google-review-card reveal">
        <div class="google-review-top">
          <div class="google-review-stars" aria-label="5 out of 5 stars">★★★★★</div>
          <span class="google-review-badge">${copy.badge}</span>
        </div>
        <blockquote>“${review.text}”</blockquote>
        <div class="google-review-author">
          <span class="google-review-avatar" aria-hidden="true">${initials}</span>
          <span>${review.name}</span>
        </div>
      </article>`;
  }).join('');

  section.innerHTML = `
    <div class="container">
      <div class="google-reviews-head reveal">
        <span class="section-eyebrow">${copy.eyebrow}</span>
        <h2 id="google-reviews-title">${copy.title}</h2>
        <p>${copy.intro}</p>
        <div class="google-reviews-summary"><span aria-hidden="true">★★★★★</span><span>${copy.summary}</span></div>
      </div>
      <div class="google-reviews-grid">${cards}</div>
    </div>`;

  faqSection.parentNode.insertBefore(section, faqSection);
})();

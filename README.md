# websajtizrada.online — Stage One

Static multi-page site. No build step. Upload the contents of this
folder directly to `public_html/` (or open `index.html` locally).

## File structure

- `index.html` — Serbian homepage (full)
- `*.html` — Serbian placeholder pages for stage-two content
- `en/` — English homepage + placeholder pages
- `hu/` — Hungarian homepage + placeholder pages
- `assets/css/style.css` — shared stylesheet (design tokens at the top of `:root`)
- `assets/js/main.js` — shared JS + **central configuration** (`SITE_CONFIG`)
- `assets/images/` — logo + hero + portfolio images
- `robots.txt`, `sitemap.xml`, `404.html`, `favicon.ico`

## Configuration

Open `assets/js/main.js` and edit `SITE_CONFIG` at the top:

- `phone`, `phoneTel`, `whatsapp`, `viber`, `email`
- `web3formsKey` — get from https://web3forms.com
- `gaId`, `gtmId`, `googleAdsId`, `metaPixelId` — tracking (loaded only after cookie consent)

Every phone / WhatsApp / Viber / email link in the HTML is wired via
`data-cfg-*` attributes, so updating `SITE_CONFIG` updates every page.

## Stage-two work

Detailed service, portfolio, pricing, about, contact and legal page
content is intentionally left as marked placeholders. Legal pages
(`politika-*.html`, `*-policy.html`, `*-szabalyzat.html`) require
professional legal review before publishing.


## Stage 1.1 update
- Added real live-homepage portfolio previews with branded fallback thumbnails.
- Added Doktor Pizza (drpizza.rs) and Etno Salaš Palić.
- Completed English and Hungarian portfolio pages.
- Strengthened the all-inclusive starter website offer from 6,000 RSD.

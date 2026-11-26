# Crochet Shop

A free, self-run shop website: products, pickup orders, custom order requests, free pattern blog (with ad spots), and an admin dashboard.

- **Hosting:** GitHub Pages (free). Plain HTML/JS, no build step.
- **Database / logins / photo storage:** Supabase free tier (project `crochet-shop`).
- **Payments:** Zelle, Venmo, or pay at pickup. No tax is charged. You mark orders paid in the admin page.

## Pages
| Page | What it is |
|---|---|
| `index.html` | Home page, built from sections you arrange in Admin → Homepage |
| `product.html?id=…` | Product page (photos, options like size/color) |
| `faq.html`, `page.html?p=slug` | FAQ and custom pages (policies) |
| `cart.html` | Cart & pickup checkout |
| `custom.html` | Custom order request form |
| `patterns.html`, `pattern.html?p=slug` | Free pattern blog |
| `admin.html` | Your dashboard (orders, requests, products, patterns, appearance, payment & pickup) |

## Homepage sections
Section types live in `assets/sections.js` (settings + how each one looks). The admin Homepage tab builds its editor from that file, so adding a new section type there makes it available in the editor.

## Email alerts
`supabase/functions/notify` emails you about new orders/requests via Resend. Secrets: `RESEND_API_KEY`, `OWNER_EMAIL`, optional `FROM_EMAIL` (needs a verified domain in Resend; enables customer confirmations).

## Ads
After Google AdSense approves your site (it requires your own domain name), paste your `ca-pub-…` ID in **Admin → Appearance → Ads**. Also create a file named `ads.txt` in this folder with the line AdSense gives you.

## Updating libraries
`assets/vendor/` holds bundled copies of supabase-js, marked, and DOMPurify, so the site doesn't depend on a CDN.

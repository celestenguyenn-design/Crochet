# Crochet Shop

A free, self-run shop website: products, pickup orders, custom order requests, free pattern blog (with ad spots), and an admin dashboard.

- **Hosting:** GitHub Pages (free). Plain HTML/JS, no build step.
- **Database / logins / photo storage:** Supabase free tier (project `crochet-shop`).
- **Payments:** Zelle, Venmo, or pay at pickup. No tax is charged. You mark orders paid in the admin page.

## Pages
| Page | What it is |
|---|---|
| `index.html` | Home + shop |
| `cart.html` | Cart & pickup checkout |
| `custom.html` | Custom order request form |
| `patterns.html`, `pattern.html?p=slug` | Free pattern blog |
| `admin.html` | Your dashboard (orders, requests, products, patterns, appearance, payment & pickup) |

## Ads
After Google AdSense approves your site (it requires your own domain name), paste your `ca-pub-…` ID in **Admin → Appearance → Ads**. Also create a file named `ads.txt` in this folder with the line AdSense gives you.

## Updating libraries
`assets/vendor/` holds bundled copies of supabase-js, marked, and DOMPurify, so the site doesn't depend on a CDN.

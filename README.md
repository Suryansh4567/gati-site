# Gati — website (static frontend)

Live: https://suryansh4567.github.io/gati-site/

A plain static website for **Gati Infra Project Buildcon Pvt Ltd** — RCC and civil
construction, Delhi NCR and Haryana.

## No backend, by design

There is no server, no database, no login, no admin panel, no cookie and no form.
Every call to action opens the visitor's own app:

- **WhatsApp** — `https://wa.me/919910144422?text=…` with a prepared message
- **Call** — `tel:+919910144422` and `tel:+919729073771`
- **Email** — `mailto:gatiinfraprojects.pvtltd@gmail.com`

A CV or a drawing is attached by the person inside their own WhatsApp chat. Nothing
is uploaded to or stored by this website, so there is never a false
"submitted" message and no personal data to look after.

## Pages

| Path | Page |
| --- | --- |
| `/` | Home — hero, client motion band, selected work, scope, process, team, CTA |
| `/work/` | Full portfolio with category filters and search |
| `/work/<project>/` | Six project pages |
| `/expertise/` | Four service lines |
| `/about/` | Company, founders |
| `/careers/` | Four open site roles, apply on WhatsApp |
| `/contact/` | WhatsApp, both phone numbers, email, address, FAQs |
| `/privacy/` | What is and is not collected (nothing is) |

## Rebuilding

```bash
BASE_PATH=/gati-site node SOURCE-build.mjs   # writes into build/
```

## Testing

```bash
npm install
BASE_PATH= OUT_DIR=preview node SOURCE-build.mjs
python3 -m http.server 8080 --directory preview &
npm test            # jsdom suite in test/site.test.mjs
```

The suite covers mobile-nav disclosure behaviour (open/close/rapid clicks/Escape/
focus return/resize), work filters + search (case, padding, empty state, injection),
process tabs, gallery wrap + marquee pause, gallery-prefetch scoping, skip-link
targets on every page and console cleanliness on all pages. It does NOT verify
layout, real-browser rendering, screen-reader announcements, zoom behaviour or
host-specific 404 delivery — those remain manual/host checks.

All text, phone numbers, projects, services and job roles live at the top of
`SOURCE-build.mjs` as plain objects. Fonts (Manrope, IBM Plex Mono) are self-hosted
under the SIL Open Font License.

## Hosting

Only static files. Upload the repository contents to any static host; the asset
paths assume the site is served from `/gati-site/`, so change `BASE_PATH` if the
path changes.

## Images and weight

Every photograph is stored at roughly twice the largest size it is ever displayed
at: sharp on a retina laptop, without shipping pixels nothing renders.

| Set | Stored at | Widest it renders |
| --- | --- | --- |
| Gallery and section photographs (`site-*`) | 1240 px | ~620 px |
| Project cards and project-page heroes | native (409–1280 px) | 623–1280 px |
| Founder portraits | 810 px | 405 px |
| Client marks | native | 122 px |

`SOURCE-build.mjs` publishes only the images the templates reference
(`USED_IMAGES`) and deletes anything stale from the output directory; the build
fails loudly if a referenced image is missing. Pixel sizes live in
`SERVICE_DIM`, `FOUNDER_DIM` and `PROJECT_DIM` — update them when you swap a
file, so the browser reserves the right space and nothing shifts while loading.

The first-screen photograph is `fetchpriority="high"`, the two self-hosted fonts
are preloaded, and everything below the first screen is `loading="lazy"` — except
the client marquee, which is transform-animated and must stay eager.

`assets/brand/og-image.jpg` (1200×630) is the card WhatsApp and LinkedIn show
when the link is shared. The previous `.webp` preview did not render on those
platforms at all.

## Notes

- Company details, project scopes and imagery are supplied references, not
  independently verified claims.
- Client marks belong to their respective owners.
- The pages carry `noindex` so this build does not compete in search with the
  company's existing site; remove that line in `SOURCE-build.mjs` to allow indexing.

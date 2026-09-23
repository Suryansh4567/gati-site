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

All text, phone numbers, projects, services and job roles live at the top of
`SOURCE-build.mjs` as plain objects. Fonts (Manrope, IBM Plex Mono) are self-hosted
under the SIL Open Font License.

## Hosting

Only static files. Upload the repository contents to any static host; the asset
paths assume the site is served from `/gati-site/`, so change `BASE_PATH` if the
path changes.

## Notes

- Company details, project scopes and imagery are supplied references, not
  independently verified claims.
- Client marks belong to their respective owners.
- The pages carry `noindex` so this build does not compete in search with the
  company's existing site; remove that line in `SOURCE-build.mjs` to allow indexing.

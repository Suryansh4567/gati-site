# Gati website — static frontend only

No server, database, login or on-site form. Every call to action opens WhatsApp, the phone dialler or an email app.

## Pages
Home, Our work, six project pages, Expertise, About, Careers, Contact and Privacy.

## Editing content
Company details and phone numbers live at the top of `build.mjs` (`P`). Projects, services, careers and copy are plain objects in the same file. Run `node build.mjs` to rebuild into `build/`.

## Hosting
Upload the contents of `build/` to any static host. GitHub Pages needs no server; the asset paths use the `BASE_PATH` value from the build (default `/gati-preview`).

## Not included
No enquiries, applications, resumes or personal data are collected or stored. Visitors continue the conversation in their own WhatsApp, phone or email app.

Company details, project scopes and imagery are supplied references, not independently verified claims. Client marks belong to their respective owners.

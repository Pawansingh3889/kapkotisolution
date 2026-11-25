# Kapkoti Solution

A static, multi-page website for an independent AI engineering and integration practice. The public message is “Less busywork. More time for business.” Four everyday needs and a three-step introduction keep the main pages readable for nontechnical visitors. Architecture, the full service catalogue, project build evidence and the detailed delivery process live under the single Services navigation tab.

## Develop and verify

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

`pnpm dev` builds `dist/site/` and starts a local Cloudflare Worker. It uses a local-only compatibility-date override of `2026-09-22`: the pinned installed workerd cannot start with the production date `2026-09-27`. Production configuration remains unchanged. The override validates the site locally, not production runtime compatibility. Resolve this toolchain mismatch before relying on local runtime behavior for a future Worker feature.

The browser intentionally uses the existing deployed intake API. Localhost is not an allowed submission origin. Do not send real or synthetic enquiries to production during QA: unit tests mock model/email providers and use an in-memory database. A static preview can also serve `dist/site/`; never serve the repository root as the production artifact. Restart `pnpm dev` after editing sources; there is no separate source watch process. Stop the preview before a separate production dry-run build: packaging recreates the asset directory, and the installed local runtime can retain a stale asset manifest until restarted.

Services opens on a three-group hierarchy with nine accessible service tabs. Definitions and illustrative examples come first; scope disclosures and the technical reference are optional. All service text remains in static HTML for visitors without JavaScript.

The navigation labels are How We Help (`/services/`) and Services (`/technology/`). Existing routes and fragments are preserved when renaming these labels.

## Source and build boundaries

| Source | Responsibility |
| --- | --- |
| `index.html` | Home-page body fragment |
| `pages/*.html` | Inner-page body fragments, contact and privacy |
| `templates/layout.html` | Shared document head, navigation and footer |
| `templates/solution.html` | Shared project-detail layout |
| `content.mjs` | Business needs, service groups and definitions, stages, architecture layers, projects and industries |
| `scripts/render-site.mjs` | Route registry, escaped content components, metadata, structured data and sitemap |
| `style.css` | Responsive layout, light/dark tokens, components and reduced-motion rules |
| `theme.ts` | Small blocking preference initializer that avoids a theme flash |
| `ui.ts` | Shared navigation/theme, optional explorers, product controls and film visibility |
| `app.ts` | Contact-page intake only; direct brief first, assistant optional |
| `studio.ts`, `scene/*.ts` | Optional Services illustration, dynamically loaded Three.js and lifecycle |
| `worker.js`, `migrations/` | Existing intake API, D1 persistence and delivery retries |
| `scripts/build-client.mjs` | Hashed browser bundles and generated HTML under ignored `assets/` |
| `scripts/sync-site.sh` | Allowlisted public artifact under ignored `dist/site/` |
| `scripts/render-social.mjs` | Reproduce the 1200 by 630 social image using the installed canvas dependency |

The artifact contains eight main pages, three project-detail pages, privacy and a custom 404. Cloudflare normalizes HTML routes and serves unknown paths with a 404 status. It does not use a catch-all SPA fallback. The sitemap is generated from the same route registry; its tracked root copy is checked by tests.

No new application dependency, backend, database or migration was introduced. Existing scene geometry and original film assets remain recoverable. Root `app.js`, `story.js`, `scene/story.js`, `public/`, `design-review/`, and earlier creative/storyboard documents are historical baseline material, not current build inputs. Do not edit generated `assets/` or `dist/`.

## Content and evidence

Project descriptions distinguish implementation evidence, demonstrators, pilots and roadmap work. See `WEBSITE_AUDIT.md` for inspected sources and competitor research. Do not turn an implemented code path into a claim that the same revision is deployed or production-ready. No customer counts, certifications, testimonials, training results or guaranteed outcomes are advertised.

Rigel is an independent ERP example with read/propose boundaries. FloorMind has different local/hosted implementation paths; privacy is configuration-specific. Elenchus is a survey/workflow pilot. Its former public pilot endpoint returned HTTP 500 during review, so the project page offers a guided-walkthrough enquiry instead of sending visitors to that endpoint.

## Intake operations

The existing API endpoints are `/api/chat`, `/api/brief` and `/api/submit`. The assistant uses OpenRouter; its current model is `openai/gpt-4o-mini`. Contact details entered in the form stay outside the model context. The visitor reviews the brief and explicitly consents before submission. Only a verified database save produces a success screen.

Preserve the deployed D1 database and both existing migrations. Never reset D1 for a marketing-site update. The Worker enforces allowed origins, JSON/body limits, conversation roles, contact validation, hashed-address limits and a global model budget. Existing limits are 10 exchanges, 30 AI requests and 5 submissions per network address per UTC day, with 300 AI requests globally per day. Shared-network visitors share the address limit.

Submissions use a UUID and payload fingerprint to make retries safe. The saved record is emailed through Resend from `notifications@kapkotisolution.com` to `pawan@kapkotisolution.com`. Provider acceptance is recorded separately from database success; it is not proof of inbox delivery. A once-per-minute scheduled task retries one pending email. Provider failures do not undo a saved submission. Resend suppresses duplicate idempotency keys for 24 hours; a database outage beyond that after an accepted send can produce a duplicate. Check Resend logs for bounces.

Secrets remain in Cloudflare configuration: `OPENROUTER_API_KEY`, `RATE_LIMIT_SALT`, `RESEND_API_KEY`. Never put values into source, shell arguments, tests or public output. Set them through Wrangler's hidden secret prompt if configuration is actually required. Keep permanent backups in the password store. Do not replace GoDaddy incoming-mail MX records when configuring Resend sending verification.

Review new submissions in the private D1 console:

```sql
SELECT id, created_at, name, contact_method, contact, brief,
       conversation, email_sent_at
FROM submissions WHERE status = 'new' ORDER BY created_at DESC;
```

Follow up personally, then set the specific row's status to `contacted` or `closed`. For a verified deletion request, remove the identified record and its emailed copies from the inbox and Resend. Review closed requests when no longer needed; the public disclosure promises no fixed retention period. No public endpoint exposes submissions.

The assistant cannot execute business actions, query saved enquiries or send email. Transcripts supplied by a visitor's browser are untrusted input, not authenticated audit logs. Prompt instructions are not a security boundary. Keep validation, permissions, limits and saves in application code.

## Release and recovery

The custom domain was observed serving the current Cloudflare asset/header configuration during the audit. The previous README's branch-root GitHub Pages description was stale. `wrangler.jsonc` declares the domain routes and asset directory; `pnpm build` is a dry run and does not publish.

The GitHub workflow runs quality/build checks on pull requests or manual dispatch and uploads `dist/site/`. It never deploys. Inspect the exact artifact, hosting configuration and API configuration before an explicitly authorized release. The initial redesign at `b46626f` was deployed after explicit user authorization. Deployment records are kept under ignored `.cache/releases/`; later changes still require the checks below.

For an authorized release, run the required checks, record the source revision and retain the prior complete built artifact. Publish the Worker and all generated assets together through the existing `pnpm run deploy` path. No new migration or secret change is required by this redesign. On the real domain, verify main/inner routes, 404 status, metadata, asset loading, security headers, consent and the intake path with an appropriate controlled verification plan.

Rollback by restoring the previous complete Worker/asset version using the existing hosting controls. Keep D1 data and secrets intact. Do not merge source into any branch-root static publishing path that omits ignored compiled bundles. Unit tests do not prove live model behavior or email delivery. Current QA results and remaining limits are in `QA_REPORT.md`.

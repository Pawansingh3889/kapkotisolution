# Kapkoti Solution

A technology studio website for ERP, custom software, governed AI, data, integrations, and cloud architecture. The approved redesign direction, The Operating System, pairs a yellow character with a dark connected-system interface. Static HTML/CSS and strict TypeScript browser sources build into `dist/site/`; a Cloudflare Worker provides English/Hindi AI conversations and private problem intake using the existing D1 database.

The redesign is implemented locally and has not been deployed. The custom domain still serves the baseline GitHub Pages site. See `QA_REPORT.md` for tested behavior and outstanding browser/device checks.

## Work locally

Node 22.13+ (built-in SQLite is used in the tests) and pnpm are required. Cloudflare account access is needed for remote database operations and deployment, not for the mocked unit suite.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

AI calls use OpenRouter from the Cloudflare Worker. Add the API key with `pnpm exec wrangler secret put OPENROUTER_API_KEY`. The website intentionally points to the deployed API; use unit tests for isolated local intake tests. Never submit real visitor information during testing.

For a static preview, run `pnpm build:site`, then serve `dist/site/` with a local HTTP server. `pnpm dev` builds the same artifact before starting Wrangler. Rebuild after changing source files; this setup does not include a separate TypeScript watch process. Do not serve the repository root as the production artifact.

## Frontend sources and build output

| Source | Responsibility |
| --- | --- |
| `index.html`, `style.css` | Crawlable content, design tokens, responsive layout, navigation, inquiry markup |
| `app.ts` | AI chat, manual/reviewed brief, consent, submission recovery, confirmation, download |
| `ui.ts` | Service and Rigel screenshot controls, optional scene loading, film visibility handling |
| `scene/system.ts`, `scene/character.ts`, `scene/workflow.ts` | Procedural character and connected systems, rendering policy, disposal and fallback |
| `media/character-short.mp4` | Separate 23-second character edit used by the redesigned page |
| `scripts/build-client.mjs` | Compiles browser entries and splits the optional scene bundle into ignored `assets/` |
| `scripts/sync-site.sh` | Recreates ignored `dist/site/` from the selected public files and media |

The hero starts with a static image and readable HTML. Desktop pointer interaction or the explicit 3D control loads the scene. Mobile, reduced-motion, and data-saving users are not automatically given the full scene. Ordinary service controls and contact remain available independently of WebGL. See `THREE_D_ARCHITECTURE.md` for scene lifecycle details.

`pnpm build:client` compiles TypeScript into `assets/`. `pnpm build:site` also packages `dist/site/`. `pnpm build` first runs type checks, then builds that artifact and performs a Wrangler dry run. Lint and tests remain separate required checks. `wrangler.jsonc` serves `dist/site/` for preview and the next explicitly approved Worker deployment.

Do not edit or commit generated `assets/` or `dist/`. Root `app.js`, `story.js`, `scene/story.js`, and `public/` are retained baseline artifacts and are not inputs to the redesigned page. The old `build:story` and `video` commands concern the baseline shop scene and landscape film, not the new character scene or short edit. Original `media/reel.mp4`, `media/workflow.mp4`, and their posters remain recoverable in the repository; the release packaging includes only the selected short film and current artwork.

## Deployment and release approval

No deployment is authorized by local build or QA. Before publishing, approve the reviewed `dist/site/` artifact and the hosting path, then complete the remaining checks in `QA_REPORT.md`.

The current custom domain uses GitHub Pages branch-root publishing. The redesigned HTML needs compiled bundles that are deliberately ignored in Git. It must therefore be published from the built artifact; merging source into the existing branch-root publishing setup without changing that release path would leave required bundles unavailable. `.github/workflows/pages-preview.yml` is manual-only and uploads a review artifact. It does not deploy Pages, change repository hosting settings, or publish the Worker.

The existing GitHub Pages response does not serve the security headers in `_headers`. Verify header enforcement as part of the approved deployment approach, and check the actual custom domain after release. A passing local build or Worker preview does not verify that domain.

For a separately approved Worker release:

1. Apply migrations: `pnpm exec wrangler d1 migrations apply kapkoti-intake --remote`.
2. Set `OPENROUTER_API_KEY` and `RATE_LIMIT_SALT` with `pnpm exec wrangler secret put OPENROUTER_API_KEY` and `pnpm exec wrangler secret put RATE_LIMIT_SALT`. Do not commit or expose either secret. Wrangler stores deployment credentials in its own authenticated configuration; permanent credential backups belong in the password store.
3. Publish the Worker and preview assets with `pnpm run deploy`.
4. Verify the Worker preview and its asset responses. Publishing the Worker does not itself update the currently branch-published GitHub Pages custom domain. `CNAME` is retained in the static artifact for the eventual approved domain configuration.

The browser API endpoint is in `app.ts`. The AI provider is OpenRouter, model `openai/gpt-4o-mini`. API payloads are capped at 65 KB, with up to 10 exchanges, 30 AI requests per hashed network address per day, 5 submission requests per address per day, and 300 total AI requests per day. Multiple visitors on a shared network share the address limit. Raising limits may increase usage costs.

The redesign requires no database schema change. Retain the existing migrations and do not reset D1 data for a visual deployment or rollback. Recovery baseline: `ddc5c56`.

## Email submitted briefs to Pawan

Every saved submission is emailed to `pawan@kapkotisolution.com` through Resend. The plain-text email includes the submission reference and time, visitor name, contact method and details, consent version, approved brief, and full English/Hindi conversation. Contact details and conversation text are kept in the email body, never interpolated into mail headers.

1. Create a [Resend account](https://resend.com/signup) and add `kapkotisolution.com` under Domains.
2. Add Resend's sending-verification DNS records in GoDaddy and wait for the domain to show Verified. Keep the existing root-domain MX records that deliver incoming mail to GoDaddy. The sender is `notifications@kapkotisolution.com`.
3. Create a Resend API key with sending access for this domain, then run `pnpm exec wrangler secret put RESEND_API_KEY`. Keep `RESEND_API_KEY` literally in the command and paste the key only at the hidden prompt. The success message must name `RESEND_API_KEY`.
4. Apply migrations and deploy using the commands above. Migration `0002_submission_email.sql` adds delivery tracking; apply it before deploying the updated Worker.

The Worker saves the submission before attempting email in the background. A once-per-minute scheduled task retries one pending email, including submissions saved before email was configured. Provider failures do not undo a saved brief. Missing configuration causes a failed email attempt and leaves the row pending. A successful Resend response sets `email_sent_at`; this records provider acceptance, not a confirmed inbox delivery. Resend's idempotency key suppresses duplicate attempts for 24 hours; a database outage lasting longer than that after an accepted send can produce a duplicate. Check Resend's delivery logs for bounces.

## Read and follow up on problems

Open the private [Cloudflare D1 database](https://dash.cloudflare.com/95b5209ffbd303836bea1dfc300ee927/workers/d1/databases/b6f42a4c-baf9-4a15-8faf-b95d5d6d92e3) and use the Console:

```sql
SELECT id, created_at, name, contact_method, contact, brief, conversation, email_sent_at
FROM submissions WHERE status = 'new' ORDER BY created_at DESC;
```

Reply personally from pawan@kapkotisolution.com, then set that row's status to `contacted` or `closed`. Check the inbox regularly to support the stated aim of replying within a few days. Rows with a null `email_sent_at` are waiting for an accepted email send. No public endpoint exposes submissions.

For a verified deletion request, find the specific submission by its reference and remove that row and its emailed copies from the inbox and Resend. The privacy disclosure does not promise a fixed retention period; review and remove closed requests when no longer needed. Abuse-prevention records expire after their UTC day and are cleaned on subsequent API traffic.

## Boundaries

The assistant has no tools and cannot send email, act on a business system, query submissions or commit to a solution. It helps clarify a problem; the visitor reviews and edits the brief, enters contact information outside the model context, and explicitly consents before submission. Only a verified database write produces a success screen. Submission IDs make retries idempotent. Conversation content is rendered as text, never HTML.

The transcript is supplied by the visitor's browser and is untrusted intake data, not an authenticated audit log. Prompt instructions guide language and scope; they are not a security boundary. Permissions, size limits, validation, budgets and database writes are enforced by code. Provider failures leave direct brief submission available. Refreshing the page clears unsubmitted text, with a browser warning when possible.

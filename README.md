# Kapkoti Solution

A personal product studio website: governed AI, UK business products, Indian SME discovery and future hardware experiments. Static HTML/CSS/JS on GitHub Pages, with a Cloudflare Worker providing real English/Hindi AI conversations and private problem intake. The Worker also serves the site as a deployment preview.

## Work locally

Node 22.13+ (built-in SQLite is used in the tests), pnpm and Cloudflare access are required.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

AI calls always use Cloudflare Workers AI, including during Wrangler development. The website intentionally points to the deployed API; use unit tests for isolated local intake tests. Never submit real visitor information during testing.

## Deploy

1. Apply migrations: `pnpm exec wrangler d1 migrations apply kapkoti-intake --remote`.
2. Set a random private salt through `pnpm exec wrangler secret put RATE_LIMIT_SALT`. Do not commit or expose it. Wrangler stores deployment credentials in its own authenticated configuration; permanent credential backups belong in the password store.
3. `pnpm deploy` publishes the API and its preview website. The configured origin allowlist contains the production domain and the Worker preview only.
4. GitHub Pages must use GitHub Actions as its build source. Merging into main publishes `public/` through `.github/workflows/pages.yml`.

The browser API endpoint is in `public/app.js`. The AI provider is Cloudflare Workers AI, model `@cf/meta/llama-3.1-8b-instruct`. API payloads are capped at 65 KB, with up to 10 exchanges, 30 AI requests per hashed network address per day, 5 submission requests per address per day, and 300 total AI requests per day. Multiple visitors on a shared network share the address limit. Raising limits may increase usage costs.

## Read and follow up on problems

Open the private [Cloudflare D1 database](https://dash.cloudflare.com/95b5209ffbd303836bea1dfc300ee927/workers/d1/databases/b6f42a4c-baf9-4a15-8faf-b95d5d6d92e3) and use the Console:

```sql
SELECT id, created_at, name, contact_method, contact, brief, conversation
FROM submissions WHERE status = 'new' ORDER BY created_at DESC;
```

Reply personally from pawan@kapkotisolution.com, then set that row's status to `contacted` or `closed`. There is no automatic email notification. Check the inbox regularly to support the stated aim of replying within a few days. No public endpoint exposes submissions.

For a verified deletion request, find the specific submission by its reference and remove that row. The privacy disclosure does not promise a fixed retention period; review and remove closed requests when no longer needed. Abuse-prevention records expire after their UTC day and are cleaned on subsequent API traffic.

## Boundaries

The assistant has no tools and cannot send email, act on a business system, query submissions or commit to a solution. It helps clarify a problem; the visitor reviews and edits the brief, enters contact information outside the model context, and explicitly consents before submission. Only a verified database write produces a success screen. Submission IDs make retries idempotent. Conversation content is rendered as text, never HTML.

The transcript is supplied by the visitor's browser and is untrusted intake data, not an authenticated audit log. Prompt instructions guide language and scope; they are not a security boundary. Permissions, size limits, validation, budgets and database writes are enforced by code. Provider failures leave direct brief submission available. Refreshing the page clears unsubmitted text, with a browser warning when possible.

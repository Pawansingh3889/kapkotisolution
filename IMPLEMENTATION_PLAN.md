# Implementation and release plan

Updated 25 October 2026. The user approved the repository audit, positioning, multi-page structure and design proposal before source changes. Work is on `feat/ai-engineering-website`.

| Phase | Result |
| --- | --- |
| 1. Audit | Existing stack, intake contracts, source/build boundaries and live presentation inspected. |
| 2. Research | Ten requested companies reviewed; local Rigel, FloorMind, governed-agent-stack and Elenchus evidence inspected. |
| 3. Architecture/design | Eight primary pages, project detail pages, privacy, shared layout, design tokens and claim boundaries approved. |
| 4. Implementation | Static page generation, complete service content, project boundaries, industry examples, delivery/stack explorers, themes, direct intake and retained About illustration implemented. |
| 5. Local review | Unit/build/link checks, browser breakpoint matrix, interactions and Lighthouse audits executed. Exact results and limits are in QA_REPORT.md. |
| 6. Readiness | Built artifact and release/rollback instructions prepared. Production publication and live intake verification have not occurred. |

## Plain-language revision

The user asked to simplify the site for nontechnical visitors, then to put technical details under one tab. The main pages now use four familiar business needs, practical examples, three introductory steps and a direct message form. A single Services page holds all nine engineering services, architecture and methods, deployment and governance, three project architecture/evidence sections, the eight-stage process and the optional 3D illustration. No technical catalogue or explorer remains on the business pages. Tests enforce that boundary.

## Scope and preservation

The existing HTML/CSS, TypeScript, esbuild, pnpm, Worker, D1 and Resend architecture remains. No application dependency, database or migration was added. Original media and scene modules remain. Working form contracts, consent, validation, rate limiting, retry recovery, confirmation and download remain coordinated with the Worker.

`content.mjs` holds repeated content; `templates/layout.html` and `templates/solution.html` hold shared layouts. Source pages are readable fragments. `scripts/render-site.mjs` generates metadata, escaped components and the sitemap; `scripts/build-client.mjs` creates hashed browser entries and rendered pages. Only allowlisted files enter `dist/site/`.

Shared navigation no longer depends on contact initialization. Homepage scripts do not require a canvas, screenshots or form. The scene entry is loaded only on Services, and Three.js itself only on explicit request. The six scene states remain independent of nine service categories.

## Validation and publication

Before release run `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check`. The pull-request workflow runs tests, lint and the production dry-run build and uploads a review artifact. It does not deploy.

Release readiness does not assert live model quality, inbox delivery, physical-device coverage, project production readiness or full accessibility conformance. Keep these boundaries in content and handover. Use the built artifact for any authorized deployment. Roll back Worker/assets as a unit while retaining D1 data and existing secrets.

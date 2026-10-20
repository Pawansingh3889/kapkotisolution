# Implementation plan

Updated: 2026-10-20. Branch: `feat/character-redesign-discovery`. Recovery baseline: `ddc5c56`. The user approved direction 2, The Operating System. The frontend is implemented locally; final QA and production release approval remain outstanding. No production deployment has occurred.

## Scope and preservation

The user clarified that the retained film is `media/reel.mp4`, the yellow-character film. The page now uses a separate 23-second edit, `media/character-short.mp4`, in a wider presentation stage without stretching the portrait footage. The landscape typography player has been removed from the page. Original films and posters remain in the repository and are excluded from the release artifact.

The user also explicitly chose to retain AI chat and the saved inquiry system. Preserve Worker/D1, validation, English/Hindi conversation, manual brief entry, review/edit, contact preference, consent, failure recovery, confirmation reference, downloadable brief, Resend delivery and privacy disclosure. Add no new backend or database.

The selected direction uses a dark connected-system composition, blue active states, silver edges, and the character as a guide. The main brand promise, product links, founder identity, governance explanation, email, and inquiry anchors remain. Product and tax-related claims require evidence before promotion; workbench ideas remain ideas.

## Phases and acceptance

| Phase | Work | Acceptance | Current status |
| --- | --- | --- | --- |
| 1. Discovery | Source, assets, hosting, content and baseline gates | Audit documents evidence, conflicts and missing measurements | Audit recorded, including verified GitHub Pages header gap and original public-copy drift |
| 2. Creative direction | Three compositions, comparison, recommendation | User selects a concrete direction | Complete: direction 2, The Operating System, selected |
| 3. Prototype | Character/workflow scene, static fallback, performance sample | Character recognizable; UI works without scene; bounded loading/rendering measured | Implemented; final performance and lifecycle acceptance tracked in QA |
| 4. Design system | Tokens, type, navigation, responsive foundation, strict TS | Mobile/desktop readable, keyboard navigation works, typecheck passes | Implemented; strict checks pass; full accessibility/device matrix not complete |
| 5. Sections | Services, products, approach, retained inquiry, single short film | Complete user journeys work with evidence | Implemented, including Rigel public screenshots and preserved intake; final browser review ongoing |
| 6. Optimization | Asset encoding, lazy import, lifecycle, quality tiers | Resource/frame budgets measured; no offscreen loop or repeated-mount growth | Short film, lazy scene, fallback, and lifecycle code present; measurements and remaining matrix in QA |
| 7. QA | Browser/device matrix, accessibility, SEO, slow-network cold/warm runs | Report has actual results and explicit gaps | 12 unit tests passed; final performance and Safari review pending at this update; physical-device matrix not claimed |
| 8. Readiness | Deterministic artifact, preview screenshots, rollback check | Tests/lint/strict types/build pass; user reviews result | Local gates and dry-run build passed; artifact and release review remain |
| Release | Publish approved artifact | Separate explicit deployment approval | Not authorized |

## Implemented source and build boundaries

- `index.html` and `style.css`: static content, navigation, service and screenshot controls, readable fallback, single film, and retained inquiry markup.
- `app.ts`: typed inquiry behavior, all dependent DOM IDs, runtime response checks, manual brief entry, scoped busy state, and confirmation handling. The old root `app.js` remains only as a baseline artifact.
- `ui.ts`, `scene/system.ts`, `scene/character.ts`, and `scene/workflow.ts`: progressive scene loading, service selection, screenshot selection, film visibility behavior, reduced-motion handling, and scene cleanup. The old shop source and `story.js` remain recoverable but are not built into the new page.
- `media/`: the derived short film, fallback/poster artwork, and Rigel public screenshots. The film remains labeled as an illustration rather than product footage, with its story available in text.
- `scripts/build-client.mjs`: rebuilds ignored `assets/` from the two browser entry points and splits the optional scene dependency.
- `scripts/sync-site.sh`: recreates `dist/site/` with an explicit public-file and media allowlist. It excludes original films, source code, review documents, and the legacy `public/` copy.
- `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, and `eslint.config.js`: preserve the existing toolchain, add Three.js type definitions, and strictly check browser and scene sources. Worker checking retains its existing JavaScript configuration.
- `worker.js`: preserves API routes, persistence, consent, limits, and delivery; product knowledge now reflects Rigel's published scope. The missing upstream AI timeout remains a separate reliability follow-up.
- `tests/intake.test.js`, `tests/frontend.test.js`, and `tests/scene.test.js`: retain trust-boundary checks and add response-shape, scoped-busy-state, inquiry retry, and procedural-geometry coverage. Browser scene checks are separate and must not be inferred from unit results.
- `_headers`, `robots.txt`, `sitemap.xml`, and metadata: keep security configuration and crawler content in the artifact. Live header enforcement still needs an approved hosting-compatible correction and a post-release check.
- `wrangler.jsonc`: uses `dist/site/` locally for the next reviewed Worker asset deployment. Existing D1 and cron bindings are preserved. No remote setting has been changed.
- `.github/workflows/pages-preview.yml`: a manually triggered build-and-upload workflow only. It neither deploys Pages nor changes the current publishing source.

## Build and local verification

`pnpm build` runs type checks, `pnpm build:site`, and a Wrangler dry run. `build:site` compiles browser sources and creates `dist/site/`; this is the artifact to preview and eventually deploy. `assets/` and `dist/` are ignored, and existing `public/` files are no longer regenerated.

The implementation run reports 12 passing tests, successful lint and strict browser/scene checks, and a successful dry-run production build. These checks do not establish real-device performance, Safari compatibility, or full WCAG conformance. `QA_REPORT.md` is the maintained record of completed checks and remaining limitations.

## Production verification boundaries

Inspect publicly available product interfaces read-only. Do not create orders, invoices, submissions or emails as part of visual QA. Use local API stubs and existing in-memory SQLite tests for side-effecting paths. A login page proves the route exists, not that listed features work or that the app is production-ready.

## Recovery and release

Keep all work on the feature branch. No commits until build, lint, tests and applicable migration checks pass. Preserve original assets and the baseline revision. Review any production diff separately.

The live domain still uses the baseline branch-published GitHub Pages site. The new HTML refers to ignored compiled bundles, so it must be published from the reviewed `dist/site/` artifact, not by switching or merging into branch-root publishing without a deployment plan. The manual artifact workflow does not make that hosting change. Obtain explicit approval for the chosen publishing path and verify the actual custom domain after release.

Rollback restores a reviewed known-good site artifact or baseline commit through the approved release path. Do not reset inquiry data or reverse database migrations for a visual rollback.

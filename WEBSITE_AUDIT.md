# Website audit

Baseline inspection: 2026-10-19. Implementation update: 2026-10-20.  
Baseline: `ddc5c56`  
Working branch: `feat/character-redesign-discovery`  
Status: direction 2, The Operating System, approved and implemented locally. Final QA and release approval remain outstanding. No production deployment has occurred.

The baseline findings and their line references below describe commit `ddc5c56`, not the changed working files. The implementation status section records how the redesign addresses those findings. Keeping both makes the original audit and recovery reference useful.

## Agreed scope

- Redesign Kapkoti Solution around the character in `media/reel.mp4`.
- Retain that character film, edit a separate 20 to 30 second version, and present it in a wider frame.
- Remove the landscape typography film, `media/workflow.mp4`, from the redesigned page.
- Preserve both original films and posters for recovery. Removing a player does not require deleting its source asset.
- Preserve the existing AI chat and inquiry system, including its Cloudflare Worker, D1 database, consent, privacy disclosure, email delivery, and tests. The user explicitly resolved the brief's initial no-database assumption in favor of keeping this working feature. Add no backend or database.
- Three creative directions were compared. The user selected direction 2, The Operating System. Production deployment still requires separate explicit approval.

## Current implementation status

The approved direction uses charcoal/navy surfaces, silver borders, restrained blue active states, and the yellow character as the guide to connected business systems. The local page now has a static-first hero, an optional interactive Three.js scene, six service controls, real Rigel screenshot views, one short character film, an approach section, and the retained inquiry flow.

| Baseline finding | Local implementation | Remaining acceptance work |
| --- | --- | --- |
| Eager shop scene and rotating headline | `ui.ts` loads `scene/system.ts` on interaction; `app.ts` has a steady headline and no typing interval | Browser/device performance and fallback matrix |
| Page-wide button disabling | `app.ts` scopes busy state to `#chat-card button` | Complete browser inquiry walkthrough; mocked regression tests cover the shared behavior |
| Non-strict browser source | `app.ts`, `ui.ts`, and scene TypeScript use strict checking with indexed-access and unused-code checks | Maintain the checks as the design changes |
| Two competing films | The page uses `media/character-short.mp4`, a 23-second character edit in a wider stage; original films remain in the repository | Final media/layout review across devices |
| Placeholder product panels | Rigel overview, inventory, and assistant screenshot views are linked to the public product | Do not treat screenshots or a live route as end-to-end product validation |
| Missing graphics lifecycle | Scene source includes visibility-aware rendering, reduced-motion handling, fallback, and disposal | Complete context-loss, repeated-lifecycle, and real-device checks |
| Stale assistant product knowledge | `worker.js` now describes Rigel's published scope and labels the film as illustrative | Keep later claims aligned with verified product evidence |
| Missing secret-file ignore patterns | `.gitignore` now excludes local `.env` and `.dev.vars` files | Continue using server-side secrets and placeholder examples |
| Incomplete SEO assets | Canonical metadata, social preview image, organization markup, `robots.txt`, and `sitemap.xml` are present | Verify the final served artifact and public deployment after approval |

`pnpm build:client` uses `scripts/build-client.mjs` to recreate ignored `assets/` from `app.ts` and `ui.ts`, with a split optional scene bundle. `scripts/sync-site.sh` recreates ignored `dist/site/` from an explicit set of public files and selected media. Original films, source files, and review documents are excluded from that artifact. `wrangler.jsonc` points its static asset binding at `dist/site/`.

`pnpm build` now performs type checking, builds the site artifact, and runs a Wrangler dry run against that artifact. The retained `public/`, root `app.js`, and root `story.js` are baseline artifacts; they are no longer the redesigned build source. The manual workflow in `.github/workflows/pages-preview.yml` builds and uploads a review artifact only. It does not publish GitHub Pages or deploy the Worker.

Current local verification reported by the implementation run: 12 unit tests passed, lint and strict browser/scene checking passed, and the production dry-run build passed. Final performance and Safari review were still pending at this update; the complete browser/device matrix is not claimed. See `QA_REPORT.md` for the maintained evidence.

The live custom-domain site remains the baseline GitHub Pages deployment. Publishing this redesign requires a separately approved artifact deployment path, because generated browser bundles are intentionally ignored rather than committed into the branch-published root. No Pages setting, DNS record, live Worker, or database has been changed by this local implementation.

## Baseline architecture and deployment

| Area | Baseline implementation | Evidence at `ddc5c56` |
| --- | --- | --- |
| Frontend | Static HTML, CSS, and browser JavaScript; one page with anchor navigation | `index.html:11`, `index.html:17` |
| Graphics | Three.js procedural shop scene, bundled by esbuild into `story.js` | `scene/story.js:4`, `package.json:13` |
| Source assets | Root HTML, CSS, JavaScript, headers, and media are the editable site sources | `README.md:29`, `scripts/sync-site.sh:6` |
| Static hosting | README describes GitHub Pages publishing the repository root from `main` | `README.md:29` |
| Worker preview | Worker serves assets from `public/`, a generated copy of root files | `wrangler.jsonc:6`, `scripts/sync-site.sh:6` |
| Intake API | `/api/chat`, `/api/brief`, `/api/submit`; OpenRouter supplies assistant responses | `worker.js:120`, `worker.js:157` |
| Persistence | D1 stores submissions, contact details, transcripts, consent, and abuse limits | `wrangler.jsonc:9`, `migrations/0001_intake.sql:1` |
| Email | Resend receives saved briefs; a once-per-minute job retries pending delivery | `worker.js:54`, `worker.js:100`, `wrangler.jsonc:7` |
| Checks | Node test runner, ESLint, non-strict JavaScript type checking, Wrangler dry run | `package.json:6` |

The redesign keeps this static architecture and the installed Three.js dependency. It adds strict TypeScript browser sources and isolated scene code without a framework migration.

### Build and source drift

At the baseline, `pnpm build` ran only `wrangler deploy --dry-run --outdir dist`. It did not rebuild `story.js` or synchronize root files to `public/`. `pnpm deploy` performed those steps before deploying (`package.json:9`, `package.json:11`). Consequently, the baseline build validated whichever files were already in `public/`.

At the baseline:

- Root `index.html:136` includes the landscape video and `index.html:137` adds the portrait character video. `public/index.html:136` includes only the landscape player.
- Root `style.css:121` contains the two-video layout; the public stylesheet does not.
- `public/media/` does not contain `reel.mp4` or `reel-poster.jpg`.
- Root and public `app.js`, `story.js`, `_headers`, and `CNAME` are identical.
- `scripts/sync-site.sh:7` already includes both character assets in the copy list.

The new `dist/site/` pipeline addresses this packaging mismatch. The original baseline dry-run result remains limited to the stale public copy and must not be used as evidence for the redesigned artifact.

## Baseline presentation

The live desktop hero and both films were visually inspected. A Chrome mobile viewport at 390 by 844 pixels was also inspected, including opening the Menu. This was viewport emulation, not an iPhone test or a complete browser matrix.

The baseline combined a green illustrated shop scene, rotating problem text, many service sections, placeholder interface summaries, product cards, two differently proportioned films, and a conversational contact flow. These pieces communicated real business concerns, but did not share the requested character-led visual identity.

Specific opportunities:

- Use the character consistently in the hero, short film, service explanation, and closing composition.
- Shorten the opening journey. The current sticky scene spans three viewport-height chapters before the main service content (`style.css:53`, `style.css:56`, `index.html:24`).
- Replace repetitive decorative mock panels with a smaller set of clear service descriptions and verified product screenshots. Existing mock panels are illustrative HTML, not captured product interfaces (`index.html:64`, `index.html:70`).
- Put the character film in a deliberately sized wide composition and remove the competing landscape player from the page.
- Keep readable headings, visible calls to action, and direct email access above decorative effects.

The three candidate directions, comparison, recommendation, and approval status belong in `CREATIVE_DIRECTION.md`. This audit establishes the evidence and constraints for that decision.

## Content and working features to preserve

| Content or feature | Preservation requirement | Evidence |
| --- | --- | --- |
| Business purpose | Preserve the emphasis on everyday operational problems and useful software | `index.html:27`, `index.html:58` |
| Product links | Preserve Rigel, Sedno, FloorMind, and Elenchus links; independently verify readiness and capabilities before publishing new claims | `index.html:109` |
| Founder information | Preserve the founder's name, location, relevant background, and portfolio link | `index.html:143` |
| Contact | Preserve `pawan@kapkotisolution.com` as a clear direct contact option | `index.html:146` |
| AI conversation | Preserve English/Hindi conversations, bounded messages, and recoverable failures | `app.js:100`, `worker.js:19` |
| Manual inquiry | Preserve direct brief entry when AI is unavailable or unwanted | `app.js:144` |
| Review and consent | Preserve editable briefs, contact preference, explicit consent, and privacy explanation | `index.html:150`, `index.html:155`, `worker.js:28` |
| Submission integrity | Preserve reference-based duplicate prevention and success only after confirmed persistence | `worker.js:136`, `app.js:174` |
| Delivery and receipt | Preserve pending-email retries, confirmation reference, and downloadable brief | `worker.js:100`, `app.js:187` |
| SEO | Preserve canonical URL, meaningful title and description, crawlable text, and internal anchor targets | `index.html:5`, `index.html:7` |

The baseline intake assistant's knowledge required correction: `worker.js:3` described a coming-soon Kapkoti ERP and three live demos, while `index.html:114` presented Rigel as a fourth live product. The local implementation updates this prompt; model instructions, product copy, film labels, and screenshots must continue to agree.

### Frontend dependencies that affect the redesign

`app.js:3` throws when required elements are missing, and `app.js:9` initializes intake fields immediately. Replacing markup requires updating every dependent selector in the same change. Preserve the intake form IDs or deliberately update their callers and tests.

Baseline `app.js:49` disabled every button during an intake request. The new `app.ts` scopes this to intake buttons so a pending response does not disable unrelated scene controls.

The existing navigation uses native `details` with viewport-based synchronization (`app.js:21`). Check desktop and mobile navigation with JavaScript unavailable, as well as after resizing.

## Baseline technical findings

| Priority | Finding | Evidence and intended response |
| --- | --- | --- |
| High | Root and packaged public assets differ | `package.json:9`, `scripts/sync-site.sh:6`. Generate and verify deployment assets during build. |
| High | Product claims and assistant knowledge disagree | `worker.js:3`, `index.html:114`. Verify public capabilities and update all representations together. |
| Medium | Scene bundle loads eagerly and builds immediately | `index.html:11`, `scene/story.js:283`. Delay scene loading and preserve a static first render. |
| Medium | Scrolling still triggers a render when the scene is offscreen | `scene/story.js:271`, `scene/story.js:278`. Gate frame requests on scene visibility. |
| Medium | No explicit graphics disposal or context-loss recovery | `scene/story.js:23`, `scene/story.js:268`. Give new reusable scene code a clear lifetime and tested fallback. The present static page has no SPA navigation; a memory leak has not been measured. |
| Medium | Mobile uses the same scene and shadow settings | `scene/story.js:155`, `scene/story.js:187`. Prototype a simpler mobile composition and measure before choosing quality levels. |
| Medium | Type checking is non-strict and excludes the scene source | `package.json:8`. Introduce strict checking for changed scene and interface code without a framework migration. |
| Medium | OpenRouter fetch has no server-side timeout | `worker.js:157`. Preserve bounded browser waits and add a bounded upstream request when touching this path. |
| Medium | Secret-file patterns are absent from `.gitignore` | `.gitignore:1`. Ignore local `.env` and `.dev.vars` files while retaining placeholder examples. |
| Low | Headline animation continues for the page lifetime | `app.js:31`, `app.js:37`. Prefer a static headline or user-controllable, visibility-aware motion. |

### Security posture

Preserve the existing protections: parameterized SQL, explicit consent validation, contact validation, conversation role/order checks, a 65 KB body cap, per-address daily limits, a global AI request budget, and no public submission-reading endpoint (`worker.js:19`, `worker.js:28`, `worker.js:88`, `worker.js:132`, `worker.js:150`).

Visitor and assistant content is inserted with `textContent`, not interpreted as HTML (`app.js:74`). Provider keys are server-side bindings (`worker.js:67`, `worker.js:159`). Browser form contact details are not included in AI brief-generation calls (`app.js:135`). The README correctly describes browser-supplied transcripts as untrusted input and prompt instructions as guidance rather than a security boundary (`README.md:61`).

`_headers:1` defines CSP, content-type protection, referrer policy, and restricted camera, microphone, and geolocation access. A read-only custom-domain header check returned HTTP 200 with `Server: GitHub.com` and a content length of 28,457 bytes, matching the baseline root HTML. The response did not include Content-Security-Policy, X-Content-Type-Options, Permissions-Policy, or Referrer-Policy. This is a verified hosting-header gap: including Cloudflare-style `_headers` in a GitHub Pages repository does not establish that those headers are served. The approved deployment plan must address and recheck it.

The OpenRouter request still lacks a server-side timeout in the current `worker.js`. This remains a bounded reliability follow-up, separate from the visual redesign; the browser request already has a 45-second timeout.

This was a source review, not a penetration test or dependency vulnerability assessment. No production API requests, credentials, visitor records, or email delivery were exercised.

## Accessibility and SEO

Existing strengths include a skip link, semantic text, labeled form controls, status announcements, visible focus styles, native video controls, a decorative canvas hidden from assistive technology, and reduced-motion CSS (`index.html:14`, `index.html:22`, `index.html:148`, `style.css:11`, `style.css:238`).

Required verification and improvements:

- Keyboard navigation, meaningful focus order, target sizes, contrast, 200% and 400% zoom, and screen-reader announcements.
- Motion pause behavior and live reduced-motion preference changes. Current JavaScript reads the preference once (`app.js:31`, `scene/story.js:8`).
- A text equivalent for essential information in the shortened film. Existing players have no text tracks or complete adjacent transcript (`index.html:136`).
- Accurate alternative text for new product screenshots and a complete non-WebGL experience.
- Open Graph image, accurate structured data, sitemap, and robots configuration. None is present in the tracked baseline files.

No WCAG conformance claim can be made from this source inspection alone.

## Baseline validation and recovery

The following local checks passed on 2026-10-19 against `ddc5c56`:

| Check | Result | Limit |
| --- | --- | --- |
| `pnpm test` | 7 tests passed | Mocked provider requests and in-memory SQLite; not real D1 or delivery |
| `pnpm lint` | Passed | Current configured file list |
| `pnpm typecheck` | Passed | Current non-strict checkJs configuration |
| `pnpm build` | Passed Wrangler dry run | Existing stale public copy, not newly synchronized root assets |

Wrangler reported 10 static files and a Worker upload of 14.32 KiB raw / 5.55 KiB gzip. This excludes the full browser download cost and is not a page-performance measurement.

Baseline `ddc5c56` and the existing media originals remain the recovery reference. Work stays on `feat/character-redesign-discovery`; no production deployment has occurred. Future rollback should restore a reviewed known-good commit through the normal branch and deployment workflow, without rewriting shared history or deleting inquiry data.

The implementation roadmap belongs in `IMPLEMENTATION_PLAN.md`. Performance targets and unmeasured items are recorded in `PERFORMANCE_BUDGET.md` and `QA_REPORT.md`.

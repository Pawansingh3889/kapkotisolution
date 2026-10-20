# QA report

Date: 2026-10-19  
Baseline: `ddc5c56`  
Working branch: `feat/character-redesign-discovery`  
Stage: discovery and design approval.

The redesigned frontend is not implemented, tested, or complete. This report records baseline evidence and the remaining acceptance work. No production deployment has occurred.

## Confirmed scope

- Preserve the existing AI chat and inquiry system, Worker, D1 data, consent, privacy disclosure, delivery behavior, and tests. Add no new backend or database.
- Keep the character from `media/reel.mp4`, create a separate 20 to 30 second edit, and use a wider presentation frame.
- Remove the landscape typography film's player from the redesigned page.
- Preserve original media and baseline recovery information.
- Wait for creative-direction approval before frontend implementation. Require explicit approval before production deployment.

## Executed baseline checks

| Check | Result | What it establishes |
| --- | --- | --- |
| Repository and dependency inspection | Completed | Static frontend, existing Three.js source, Worker API, D1 migrations, dual asset locations |
| `pnpm test` | Passed, 7 tests | Existing Worker behavior under mocked providers and in-memory SQLite |
| `pnpm lint` | Passed | Current configured ESLint checks |
| `pnpm typecheck` | Passed | Current non-strict checkJs configuration, not strict TypeScript coverage |
| `pnpm build` | Passed | Wrangler can package the existing `public/` assets and Worker in a dry run |
| Root/public comparison | Differences found | HTML and CSS differ; character video and poster absent from public media |
| Live desktop visual inspection | Hero and both films inspected | Initial visual discovery only; not complete interaction or browser acceptance |
| Production API and email tests | Not executed | No live submissions, model requests, or emails sent |

The seven passing tests cover:

1. Approved brief/transcript persistence, consent recording, duplicate prevention, and reference reuse rejection.
2. Missing consent, invalid contact data, forged roles, oversized bodies, and foreign origins.
3. OpenRouter request boundary and direct-intake availability when the provider fails.
4. No success confirmation when database operations fail.
5. Preserved submissions and scheduled email retry after delivery failure.
6. Pending delivery when email configuration is missing, followed by retry after configuration.
7. Per-address AI request limits before provider calls.

Evidence: `tests/intake.test.js:53`, `tests/intake.test.js:72`, `tests/intake.test.js:84`, `tests/intake.test.js:99`, `tests/intake.test.js:106`, `tests/intake.test.js:127`, `tests/intake.test.js:139`.

### Build limitation

The dry run read 10 files from `public/` and reported Worker code of 14.32 KiB raw / 5.55 KiB gzip. `pnpm build` does not currently regenerate the scene bundle or synchronize root files. It therefore passed against a stale public copy. This is not validation of the latest root page or a redesigned production artifact.

Root `index.html:136` and `index.html:137` contain two video players, but `public/index.html:136` contains only the landscape player. Root `style.css:121` includes the two-video layout absent from public CSS. `public/media/` lacks the character film and its poster. Root/public `app.js`, `story.js`, `_headers`, and `CNAME` match.

## Open findings before implementation

| Finding | Required follow-up |
| --- | --- |
| Root/public drift | Make build produce and verify the exact deployment asset set |
| Stale assistant product knowledge | Verify product status and align `worker.js:3`, product descriptions, and film copy |
| Global button disabling during chat | Scope `app.js:49` so new playback or scene controls remain usable |
| Eager scene bundle | Implement and measure progressive loading |
| Offscreen scroll redraws | Verify frame scheduling stops when the scene is irrelevant |
| No explicit scene disposal or context recovery | Add clear lifecycle ownership and exercise failure/cleanup paths |
| Missing secret-file ignore patterns | Protect `.env` and `.dev.vars` before local credential configuration |
| Missing AI upstream timeout | Review and bound OpenRouter requests when changing this path |
| No frontend browser regression suite | Add small meaningful coverage for the changed navigation, scene fallback, media, and intake integration |
| Incomplete SEO assets | Verify canonical/title/description; add accurate sharing image, sitemap, robots, and structured data as appropriate |

Source evidence and scope are detailed in `WEBSITE_AUDIT.md`. Proposed loading and performance limits are in `PERFORMANCE_BUDGET.md`.

## Browser and device acceptance matrix

All rows below are pending for the redesign. The initial live desktop inspection does not satisfy them.

| Environment | Required coverage | Status |
| --- | --- | --- |
| Chrome desktop | Layout, keyboard, interactions, intake, video, graphics, console, performance trace | Pending |
| Safari desktop | Layout, focus, media, WebGL, resize, navigation | Pending |
| Firefox desktop | Layout, controls, WebGL, keyboard, navigation | Pending |
| Edge desktop | Layout, controls, graphics, intake integration | Pending |
| Safari on physical iPhone | Touch, orientation, video, viewport changes, fallback, performance | Pending |
| Chrome on physical Android | Touch, orientation, video, constrained rendering, performance | Pending |
| Reduced motion | Load-time and live preference changes, static composition, full usability | Pending |
| WebGL unavailable | Readable content, fallback scene, working navigation and contact | Pending |
| Context loss/recovery | Safe fallback or recovery without broken controls or repeated errors | Pending |
| Low-power device | Simplified scene, responsive input, no sustained idle GPU work | Pending |
| Slow mobile connection | Cold/warm loads, poster behavior, optional payload deferral | Pending |
| Zoom and narrow layouts | 200% and 400% zoom, small viewport, no hidden essential content | Pending |

Browser automation or device emulation must be labeled as such. It cannot stand in for physical iPhone or Android testing.

## Accessibility, media, and content acceptance

- [ ] One coherent character-led design across all major sections.
- [ ] Shortened character film reviewed frame by frame and presented without awkward cropping or unreadable text.
- [ ] Landscape player removed from the redesigned page; source originals retained.
- [ ] Essential film information available in text, with captions or other alternatives appropriate to the actual audio.
- [ ] Visible focus, logical keyboard order, accessible service controls, and usable touch targets.
- [ ] Contrast and screen-reader behavior checked with the implemented colors and markup.
- [ ] Reduced-motion and non-WebGL alternatives provide complete content and functionality.
- [ ] Real product screenshots and claims verified against the actual public products.
- [ ] No invented customers, testimonials, product statistics, or case studies.
- [ ] Email contact, consent, privacy, contact method, editable brief, failure recovery, confirmation, and download remain usable.
- [ ] No live inquiry sent during automated testing; provider calls mocked at the boundary.
- [ ] Crawlable headings and text, canonical URL, metadata, social preview, sitemap, and robots verified.

## Performance and release acceptance

- [ ] Exact reviewed commit and generated output recorded.
- [ ] Build regenerates and synchronizes site assets before verification.
- [ ] Unit tests, lint, strict checking for changed code, and production build pass.
- [ ] Cold and warm Lighthouse reports captured with test conditions recorded.
- [ ] Network and rendering traces captured; loading budgets compared with measurements.
- [ ] Layout stability, interaction responsiveness, frame pacing, and memory behavior measured.
- [ ] Animation pauses when hidden or offscreen; resources are released after teardown.
- [ ] Major desktop browsers and physical mobile devices checked, with remaining gaps stated explicitly.
- [ ] Final screenshots or recordings captured for the implemented desktop and mobile layouts.
- [ ] Deployment configuration, current hosting behavior, and rollback procedure verified.
- [ ] Production deployment explicitly approved.

No Lighthouse score, Core Web Vitals result, frame-rate result, memory result, real-device pass, or full accessibility conformance claim is currently available. The outstanding matrix and measurements are release risks until tested or explicitly accepted as limitations.

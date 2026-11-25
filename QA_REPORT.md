# QA and deployment readiness

Reviewed 25 October 2026 on `feat/ai-engineering-website`. Baseline source revision: `d87692a`. The redesign and plain-language revision are on this feature branch. The initial redesign (`b46626f`) was deployed after explicit user authorization as Cloudflare version `ad23e801-ba14-4b5b-b461-d39a5c0b1480`. No production enquiry, paid model request, database migration/reset or secret change occurred.

## Service hierarchy revision

The user then requested named service tabs and a visible hierarchy, referencing ATS Global. Services now opens with three groups and nine accessible tabs. Each panel gives a plain definition, an illustrative business example, an optional scope disclosure, current availability and a contact action. Architecture, model methods, hosting and governance are in a closed reference section below. All three explorers retain independent selections when unrelated fragments change.

Latest checks: 23 tests, lint, type checking and the production dry-run build passed. Chrome covered every service at 320, 390, 768, 1024 and 1440 pixels with its scope both closed and open: 90 states, no horizontal overflow, exactly one active panel and one tab stop. The 65 route/width checks were repeated without overflow or observed failed loaded images. End/ArrowDown keyboard behavior and direct service links were exercised.

Lighthouse 13.5.0 on the final local Services page: performance 99, accessibility 100, best practices 100, SEO 100. Mobile lab metrics: FCP 1.08 seconds, LCP 1.23 seconds, TBT 0 ms, CLS 0.0533. These are simulated local results, not field data. Evidence uses the `hierarchy-` prefix in `.cache/qa/`. The hierarchy artifact manifest SHA-256 is `d18656e62986406c87a867ea421799d0832de13997053b4cd39636c7bf41d326`. Older `simple-` evidence below belongs to the preceding presentation.

## Previous presentation review

The navigation labels were subsequently changed to How We Help and Services, with the detailed-page heading “AI services. Built around your needs.” Routes and fragments were preserved. Tests, lint, type checking and the build passed again. The browser matrix, Lighthouse results and screenshots below document the preceding presentation with the Technical Details label; they were not repeated for this wording change.

The home page leads with “Less busywork. More time for business.” Four everyday needs replace the nine-category catalogue on the business pages. How It Works introduces three steps. A single Services navigation tab contains the architecture, model methods, hosting, governance, nine engineering services, three project architecture/evidence sections, eight-stage delivery explorer and optional 3D illustration. The enquiry form appears before the person note on phones.

Tests enforce the technical-content boundary: service disclosures, project build evidence, both explorers and the 3D canvas appear only on Services. Project business pages retain plain descriptions, limits and maturity, with links to their technical evidence.

## Executed checks

| Check | Result | Scope |
| --- | --- | --- |
| `pnpm test` | 21 passed | Intake validation, consent, provider/database failures, retry safety, geometry, rendering, metadata, local links, technical-content boundary, explorer/theme behavior and disclosure deep links |
| `pnpm lint` | Passed | Worker, content, scripts and tests |
| `pnpm typecheck` | Passed through `pnpm build` | Strict browser TypeScript and existing Worker checkJs configuration |
| `pnpm build` | Passed | Static artifact plus Wrangler production dry run; no deployment |
| `git diff --check` | Passed | Source whitespace |
| Public artifact | 13 HTML pages, 33 files | Eight primary pages, three project details, privacy and 404; selected assets only |
| Artifact review | Passed | No source/docs/environment files or known credential-value patterns found; this is not a complete secret audit |

Generated-page checks cover one H1 per route, unique metadata, canonical URLs, JSON-LD, duplicate IDs, every local link/fragment/media target, sitemap coverage and browser-entry scope. No dependency, backend or migration was added. Existing form validation, consent, server limits, save confirmation, email retry and recovery remain tested with mocked providers and an in-memory database.

## Browser review

Final Chrome viewport matrix: all 13 routes at 320, 390, 768, 1024 and 1440 CSS pixels, 65 combinations. No horizontal overflow, missing H1 or failed loaded images was observed. This does not certify physical devices or actual browser zoom.

Verified in Chrome:

- Main and mobile navigation, the Services link, Escape closure and focus return.
- All eight architecture selections and all eight delivery selections, independently on the same technical page.
- Deep links opening nested service details, selecting a delivery stage and opening project evidence, including a 320-pixel layout. Revealed content scrolls into view.
- Direct form before the person note on phones, unchecked consent, privacy opening in a separate tab, and empty-submit focus on the required message field without sending.
- Phone/email field labeling, optional writing assistance, return to the direct form and focus preservation.
- Light/dark themes and fixed navy artwork.
- Relocated optional 3D illustration loading on explicit request and its pause control. The existing geometry/lifecycle implementation is retained; this was not a full hardware failure exercise.

Contact details and messages were left empty. No live enquiry or model call was made. Localhost is deliberately not an allowed production intake origin.

## Lighthouse lab results

Lighthouse 13.5.0, local Cloudflare preview, headless Chrome, default mobile simulated throttling. These are local lab results, not production field data, proof of business outcomes or a WCAG conformance claim.

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Home | 100 | 100 | 100 | 100 |
| Contact | Not run | 100 | 100 | 100 |
| Services | Not run | 100 | 100 | 100 |
| How It Works | Not run | 100 | 100 | 100 |
| Our Work | Not run | 100 | 100 | 100 |

Final mobile home metrics: FCP 1.07 seconds, LCP 1.14 seconds, total blocking time 0 ms and CLS approximately 0.0007. The Rigel card screenshot is lazy-loaded but larger than its displayed card size; Lighthouse reports a responsive-image savings opportunity. No new image pipeline was introduced for this revision. The theme initializer and CSS intentionally block first render to avoid a theme flash.

## Evidence and reproduction

Ignored evidence is in `.cache/qa/`: `simple-home-desktop.jpg`, `simple-home-mobile.jpg`, `simple-contact-mobile.jpg`, the 65-row responsive matrix, 16 explorer checks, five `simple-lighthouse-*.json` reports and `simple-artifact-manifest.sha256`. Earlier evidence without the `simple-` prefix belongs to the previous presentation. The preceding presentation’s artifact manifest SHA-256 is `3580e4fe8ba9ff0c7e8d6a875e646d141bfe2b2224cbb341d86107385a029598`.

Use `pnpm dev` for a fresh preview. It builds first and uses the local compatibility date `2026-09-22`: the installed workerd cannot start with production date `2026-09-27`. Production configuration was preserved. An initial restart encountered a local SQLite lock; final browser checks used isolated temporary preview storage. No existing local or production database was reset. Stop the preview before a separate production dry-run build, then restart it to refresh the asset manifest. Owned preview processes are stopped after review.

## Release boundaries and remaining validation

Claim evidence and competitor sources remain in `WEBSITE_AUDIT.md`. No customer numbers, training results, testimonials, certificates, quantified improvements or unverified commercial maturity were added. Project implementation evidence does not verify a deployed revision. The former Elenchus pilot endpoint was unavailable in the earlier read-only check; its public CTA requests a walkthrough instead.

The pull-request workflow checks and uploads an artifact; it does not publish. A separately authorized release must publish the reviewed Worker and assets together, retain the previous complete version and preserve D1/secrets. No migration is required. Real-domain routes, headers, consent and intake/email behavior need release verification.

Not checked: understanding or conversion with real nontechnical prospects, Safari/Firefox, physical devices, screen readers, actual 200/400-percent zoom, forced reduced-motion/browser WebGL-loss scenarios, production field metrics or live email delivery. Clearer copy is a design choice, not measured proof of a competitive advantage. Automated accessibility scores do not establish complete conformance.

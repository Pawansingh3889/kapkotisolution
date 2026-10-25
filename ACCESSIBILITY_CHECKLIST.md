# Accessibility and SEO review

Updated 25 October 2026. This records completed checks and explicit limits; it is not a full WCAG conformance statement.

## Completed

- [x] Semantic header, navigation, main, sections and footer with a skip link.
- [x] One H1 and unique document metadata on every route.
- [x] Native mobile navigation, keyboard focus styling, Escape closure and focus return.
- [x] Grouped service tabs with selected state, linked tab panels and one keyboard stop; optional scope disclosures and complete static HTML. Deep links select service panels and reveal collapsed reference content.
- [x] Delivery/stack controls have pressed state, controlled IDs, keyboard arrow/Home/End behavior and exactly one selected panel when enhanced.
- [x] All eight delivery and all eight architecture selections exercised in Chrome.
- [x] Meaningful product/illustration alternatives; decorative diagram parts excluded where appropriate.
- [x] Labelled contact fields, native required constraints, explicit unchecked consent and visible status/failure recovery.
- [x] Direct brief before the person note on phones; optional assistant, separate privacy tab, no-JavaScript email fallback, contact details outside the model context.
- [x] CSS reduced-motion policy and existing scene pause/reduced-motion/lifecycle behavior retained.
- [x] Native film controls, no autoplay, preload disabled and adjacent text narrative.
- [x] Thirteen pages inspected at 320, 390, 768, 1024 and 1440 CSS pixels without horizontal overflow.
- [x] Local Lighthouse accessibility, best-practices and SEO scores of 100 on Home, Contact and Technology.
- [x] Canonical URLs, social image/metadata, valid JSON-LD and a sitemap for all 12 indexable routes; custom 404 is noindex and served with HTTP 404 for unknown paths.
- [x] Generated local links, fragments, media and duplicate IDs checked automatically.
- [x] Light/dark themes checked, including fixed-palette diagram rendering after switching.

## Not exercised or not established

- [ ] Actual screen-reader journeys (VoiceOver or another assistive technology).
- [ ] Actual 200/400-percent browser zoom and user font scaling.
- [ ] Physical mobile devices, Safari and Firefox.
- [ ] A forced reduced-motion browser session or hardware-specific WebGL failure.
- [ ] Production field metrics, live enquiry delivery and real-domain post-release verification.

Viewport reflow checks do not substitute for actual browser zoom or assistive technology. Automated accessibility scores do not establish full compliance. See `QA_REPORT.md` for conditions, results and release limits.

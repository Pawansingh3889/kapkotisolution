# Accessibility checklist

Date: 2026-10-19. Status: requirements and baseline observations, not a WCAG certification. Target WCAG 2.2 AA where applicable.

## Existing strengths observed in source

- Semantic HTML, one H1, skip link and section headings.
- Labeled inquiry fields, live status output, explicit consent and a focusable success panel.
- Native video controls, hidden decorative canvas and visible focus styling.
- Reduced-motion CSS and initial motion preference checks.

## Redesign acceptance checklist

- [ ] Full keyboard journey: header, services, products, film, chat, manual brief, consent, confirmation and download.
- [ ] Mobile menu usable without JavaScript; Escape/closing behavior does not trap focus.
- [ ] Visible focus indicators, no focus hidden by sticky header, logical focus order.
- [ ] All meaningful graphics have equivalent text; decorative graphics excluded from screen readers.
- [ ] Every 3D selection has an equivalent native control and readable result outside the canvas.
- [ ] No hover-only information, drag-only controls, custom cursor or scroll interception.
- [ ] Reduced motion at load and preference change; pause stops all optional ambient motion.
- [ ] Screen-reader check with VoiceOver or another real assistive technology, not only an accessibility tree.
- [ ] Normal text contrast at least 4.5:1, large text at least 3:1; control/focus boundaries at least 3:1 where required.
- [ ] Touch areas at least 44 px as design target; verify WCAG target-size/spacing requirements.
- [ ] Layout at 320, 390, 768, 1024 and 1440 CSS px; 200% zoom and 400% reflow without lost content.
- [ ] Portrait and landscape orientation, long text, browser font scaling and Hindi text.
- [ ] Film has accessible name, controls, text narrative and captions for any meaningful speech/audio.
- [ ] Form errors identify fields and preserve entered information; pending API does not disable unrelated controls.
- [ ] Direct email and manual brief remain available when AI requests fail.
- [ ] No-JS, no-WebGL and context-loss fallbacks preserve useful content and links. AI chat still needs JavaScript, so disclose this and show direct email.
- [ ] Privacy/consent copy matches retained data processing; no new implicit submissions.
- [ ] Automated accessibility scan plus manual review, with findings recorded in QA_REPORT.md.

## SEO acceptance checklist

- [ ] Unique title, description, canonical, language and complete Open Graph image metadata.
- [ ] Accurate Organization or ProfessionalService structured data, without invented reviews or statistics.
- [ ] Sitemap and robots match actual public routes and preview policy.
- [ ] All core copy and product links present in returned HTML.
- [ ] Legacy anchors retained or mapped; outbound products checked read-only.
- [ ] Social image and product screenshots contain no private/customer data.

The discovery board is a non-indexed composition review, not the redesigned website. Its links only navigate the board.

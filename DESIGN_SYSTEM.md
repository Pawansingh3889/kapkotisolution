# Design system

Updated 25 October 2026. Current direction: plain-language help with everyday business work. Technical content is collected on one Services page. The logo, character, film and optional illustration remain.

## Identity and composition

The home hero says “Less busywork. More time for business.” An original HTML/SVG illustration shows familiar tasks. Four business needs lead into clearly labelled project examples, a three-step introduction and direct contact. The main pages avoid the nine-category catalogue and architecture diagrams. About retains the character story and film; Services holds the optional 3D illustration. No invented statistics, testimonials, vendor logo wall or autoplay sequence is used.

## Color

| Token | Light | Dark |
| --- | --- | --- |
| Background | `#f6f7fb` | `#0b1019` |
| Surface | `#ffffff` | `#111a28` |
| Tinted surface | `#eceff5` | `#0f1724` |
| Text | `#142033` | `#edf1f8` |
| Supporting text | `#566176` | `#a8b5ca` |
| Border | `#d4dbe6` | `#2c3b52` |
| Accent | `#244eb6` | `#aac4ff` |
| Button | `#2249aa` | `#b8ceff` |
| Button text | `#ffffff` | `#10203b` |

The theme follows the system until a visitor chooses light or dark. Only the theme choice is persisted in browser storage. Initialization tolerates unavailable storage. The fixed navy everyday-task and project illustrations explicitly keep their own dark color scheme during page-theme changes.

## Typography and layout

System sans-serif typography avoids external font dependencies; technical labels use the system monospace stack. Body copy is 16 px, explanatory copy normally 14 to 19 px. Small diagram labels are supported by readable surrounding content. Hero type scales from 40 px on the narrowest phone layout to 73 px on desktop; major section headings scale from 30 to 46 px.

The container is capped at 1280 px. Gutters are 48 px on wide screens, 32 px at intermediate sizes and 20 px on phones. Wide-screen sections have 100 px vertical spacing, reduced to 65 px on phones. Cards use modest borders and 4 to 9 px radii. There is no scroll interception, pinned narrative or custom cursor.

## Components

- Shared semantic navigation uses native `details`, with a no-JavaScript path, mobile outside-click/Escape closure and active-page indication. Five links are How We Help, Our Work, How It Works, About and Services. Contact is a separate Let’s Talk action and remains available in the mobile menu.
- Four plain-language service groups describe paperwork, finding answers, connecting tools and understanding figures. The nine detailed engineering service disclosures live only on Services. Incoming hashes reveal their containing disclosure and scroll to the selected content.
- Project cards and detail pages explain the business problem, useful behavior, limits and maturity. Architecture, implementation evidence and future work are collected on Services. Rigel screenshots are labelled sample data; the other card illustrations are identified as illustrations.
- How It Works introduces three steps: explain the task, try a small solution, build what proves useful. The full eight-stage delivery and eight-layer stack explorers live on Services and use native buttons with pressed state, controlled panel IDs, arrow/Home/End keyboard support and direct-link initialization. Without JavaScript all explanatory panels remain readable.
- Contact places the message form before the person note in DOM order and on phones. The privacy link opens separately to preserve unsent writing. Contact opens on the direct brief. The assistant is optional, with contact details outside the model context, explicit consent, preserved errors and a confirmed-save state.
- The hero and project illustrations are HTML/SVG. 3D loads only after an explicit Services request; it remains independent of the service count.

## Motion and accessibility

Button feedback lasts 160 ms. The existing scene uses bounded interaction and stops at rest, offscreen or when hidden. The film has native controls and `preload=none`; it pauses offscreen. Reduced motion disables optional CSS movement and is respected by the scene.

Focus uses a 3 px accent outline with a 5 px offset. Forms have explicit labels, native required-field validation and server validation. Meaningful images have alternative text; decorative circuit diagrams are excluded from assistive technology. Browser, automated accessibility and remaining manual limits are recorded in `QA_REPORT.md`; this document does not claim complete WCAG conformance.

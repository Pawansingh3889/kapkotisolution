# Design system

Updated: 2026-10-20. Selected direction: **2, The Operating System**. This records the implementation in `style.css`, `index.html`, `ui.ts` and `scene/`. Visual acceptance and device results belong in `QA_REPORT.md`.

## Identity

The yellow character is the human center of a connected business system. Carbon backgrounds, silver module edges and restrained blue paths give it an engineering setting. The existing promise remains: "We solve everyday business problems."

The hero reads "Your business. In sync." Capabilities, actual product screenshots, the character film, engineering principles and the existing inquiry assistant develop that promise. Readable HTML carries the business message before optional 3D loads.

## Implemented color tokens

| CSS token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0b0e14` | Main carbon background |
| `--text` | `#f2f4f8` | Primary text |
| `--muted` | `#a7b1c2` | Supporting text |
| `--blue` | `#a3c2ff` | Links, labels and focus |
| `--em` | `#b8ceff` | Primary controls and inquiry accents |
| `--ink` | `#0b1324` | Text on pale controls |
| `--card` | `#111722` | Surface background |
| `--line` | `#2c3749` | Structural separators |
| `--am` | `#f3d29a` | Inquiry status text |
| `--yellow` | `#e1e879` | Small brand and status accents |

Primary buttons use `#b8ceff` with `#0b1324` text; hover uses `#d4e0ff`. Focus uses a 3 px blue outline with a 5 px offset. Component-specific shades supplement these shared tokens. Dividers provide structure and never replace control labels.

## Typography and layout

Fonts are system fonts: `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, then `sans-serif`. Technical labels use `ui-monospace`, `SFMono-Regular`, `Consolas`, then `monospace`. There is no external font request. The film retains its original embedded lettering.

Body text defaults to 16 px with 1.65 line height. Explanatory sections commonly use 13 to 15 px and 1.8 line height. Wide-screen hero type uses `clamp(64px, 6.8vw, 100px)` with tablet overrides and 60 px phone type. Section headings use `clamp(35px, 4vw, 54px)`, with 34 px phone headings. Small labels are 8 to 11 px and never provide the only version of essential content.

The container is at most 1240 px, with 48 px desktop side gutters, 32 px below 1101 px and 20 px below 900 px. Sections use 112 px vertical padding, reduced to 75 px below 900 px and 65 px below 640 px. Desktop hero, product and film compositions use two columns; phone layouts use normal single-column flow. There are no pinned scrolling sections.

Radii are component rules: 7 px buttons, 8 px service panels, 10 px secondary product cards, 14 px film stage, 16 px Rigel showcase and 18 px retained chat surface. Colors are centralized; there is no separate spacing or radius token engine.

## Components and states

- Navigation uses native `details`, open in the initial HTML. Mobile expansion works without JavaScript. Existing section destinations remain available.
- Primary buttons have a 50 px minimum height; text links use 44 px. Hero scene choices are 35 px high with spacing; full capability rows provide larger equivalent controls.
- Hero system has a reserved-size image, optional decorative canvas and native ERP, AI and Data choices. All six choices live in the capability section. Selection is exposed through `aria-pressed`.
- Service explanations are all present in HTML. JavaScript shows the chosen panel; without JavaScript they remain visible together.
- Rigel controls select Overview, Inventory or Assistant screenshots from the public Rigel site. They update image, alternative text and explanatory copy. Sample business data is identified as illustrative. The phone frame preserves image ratio.
- Film uses one 22.6-second portrait player in a wider surrounding composition. Its full 9:16 picture remains visible. Desktop height is 410 px, tablet height 360 px, and phone width at most 270 px. Native controls, `preload="none"`, `playsinline` and an adjacent story description are present.
- Inquiry retains chat, editable brief, contact fields, consent and privacy content. Field IDs and the API contract remain coordinated with `app.ts`. Email is available directly and without JavaScript.

## Materials and light

`scene/character.ts` creates a yellow egg silhouette, dark eyes, small highlights, peach cheeks, smile, arms and feet. Body color is `#f1d936`, roughness 0.27 and metalness 0.12. It is a procedural interpretation of the retained film character.

Modules share silver shells (`#546273`), dark faces (`#101925`) and blue accents. Active routes are `#80b6ff`; inactive routes are `#304d70`. A metallic platform and thin blue rim anchor the character. Hemisphere fill, warm key and blue edge light provide depth. There are no shadows, environment maps, bloom, imported textures or postprocessing passes.

## Motion rules

Button feedback lasts 160 ms, product surface feedback 180 ms and fallback opacity 200 ms. Scene selection takes approximately 400 ms at normal frame timing. Pointer settling is limited to about 4.6 degrees horizontally and 1.7 degrees vertically. Rendering stops at rest.

Pause makes state changes immediate and disables pointer response. Reduced motion is observed live and also removes CSS transitions, button travel and phone perspective. There is no perpetual hero loop, typing headline, custom cursor, scroll hijacking or automatic product carousel.

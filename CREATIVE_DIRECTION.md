# Creative direction

Date: 2026-10-19. Status: three directions prepared for selection. No direction approved yet; production implementation has not started.

## Confirmed decisions

- Keep the yellow smiling character film, `media/reel.mp4`, shorten it and give it a wider, resized presentation. Remove the typography film, `media/workflow.mp4`, from the redesigned page. Keep original files recoverable.
- Preserve the existing AI chat and inquiry system, including Worker, D1, consent and delivery behavior. The user explicitly selected this over email-only contact. Add no new backend.
- Keep the brand promise: “We solve everyday business problems.” The character is a visual guide, not a claim that software operates without people.
- Work on `feat/character-redesign-discovery`. Do not deploy without explicit approval.

## Reference study

These are selected references, not an objective ranking of the best ERP sites. Inspected 2026-10-19. The lessons below are design judgments.

| Source | Observed | Apply to Kapkoti |
| --- | --- | --- |
| [Odoo ERP](https://www.odoo.com/erp) | Live desktop hero, module imagery and CTA hierarchy | Clear entry points and expressive typography without copying its visual identity |
| [ERPNext India](https://frappe.io/erpnext/india) | Live hero and working Procurement tab with actual software screenshot | Let visitors choose a workflow and see the real interface, with readable explanation |
| [Microsoft Business Central](https://www.microsoft.com/en-us/dynamics-365/products/business-central) | Live hero, contained video poster and task-specific demonstration cards | Keep film, message and CTA independently understandable |
| [NetSuite ERP](https://www.netsuite.com/portal/products/erp.shtml) | Live hero, product structure and official video link | Explain the operational problem before listing modules |

Video study:

- [NetSuite overview](https://www.youtube.com/watch?v=hvtBOVOUPNA): first approximately 20 seconds watched, full exported captions reviewed; runtime 1:24. Illustrated business situations lead to connected applications and clearer operations. Adapt its problem-to-outcome structure, not its artwork.
- [Odoo equipment supplier workflow](https://www.odoo.com/slides/slide/pipeline-management-for-a-b2b-equipment-supplier-8962): official description and chapter markers reviewed, playback not reviewed. Follow one coherent order through tools instead of assembling unrelated screens.
- [ERPNext demo](https://www.youtube.com/watch?v=KvLLzfgWxHI): publisher listing and description reviewed, playback not reviewed. Useful module reference; webinar pacing is unsuitable for a homepage.
- [Business Central video library](https://learn.microsoft.com/dynamics365/business-central/across-videos): official documentation reviewed, clips not watched. Keep each demo focused on one task.

## A. The Helpful Workshop, recommended

The familiar yellow shopkeeper becomes the guide to a carefully engineered digital workspace. Near-black surfaces, warm ivory type and a restrained yellow signature connect the film to the rest of the site. Blue marks selected systems; violet is reserved for governed AI. No rainbow of service cards.

The hero pairs an oversized, steady headline with the character's workspace. “Complex work. A simpler day.” supports the existing brand promise. The 23-second film sits in a bounded wide stage. Its portrait image remains intact, with adjacent workflow labels filling the wider composition rather than stretching the footage.

A small procedural 3D character and four business objects explain how an order becomes stock movement, an invoice and a report. Selecting a native HTML control changes the same scene state. Below, actual Rigel screenshots supply evidence. A short process section and preserved inquiry interface finish the story.

Mobile: film remains portrait within the page width; the 3D scene becomes a static composition or tap-to-explore enhancement. Product tabs become a horizontal control row with one image at a time. No pinned scroll required.

Why choose it: preserves the character's warmth, explains real business work, and gives the technical craft a useful role. Its geometry can be built from shared primitives without a heavy asset pipeline. The character is original to the supplied film; a procedural recreation must be reviewed for visual fidelity before it becomes the hero.

## B. The Operating System

A precision instrument for business operations. Charcoal and navy, silver edges, electric blue active states, compact monospaced labels and crisp sans-serif type. The character appears as an operator inside a framed film and beside the inquiry interface.

The hero centers a connected system diagram rather than a room. Six accessible service controls surround a glass-like core. Selecting ERP, AI, data, integration, custom software or cloud changes the active route and explanation. Real software appears early in a large inspection panel. The product story is about visibility and control.

Mobile: replace the radial scene with stacked service rows, a selected-state detail panel and a smaller character cameo. The diagram remains understandable without motion.

Tradeoff: composed and technical, but the character has less visual authority and the brand could feel more like a generic enterprise vendor. Needs disciplined contrast and restrained transparency.

## C. A Day, Reimagined

A film-like journey from closing time to a calmer next morning. Warm amber spotlights, deep ink shadows, pale daylight sections and editorial typography distinguish it from A and B. The character remains the protagonist across large visual chapters.

The retained film opens the story. A desktop scroll transition follows the same workspace as scattered tasks settle into an orderly system. Software appears as the outcome of that transformation. The inquiry section returns to the resolved room. At most one short pinned transition, with normal scrolling and an immediate path to products.

Mobile: three stills and readable chapter text, optional film playback, ordinary document flow. No attempt to shrink a cinematic desktop camera path into a phone.

Tradeoff: strongest theatrical potential, but longer art direction, more assets, a separate mobile composition and greater GPU/performance risk. The source video is only portrait and no editable scene source is in the repository.

## Comparison

| Criterion | A. Helpful Workshop | B. Operating System | C. A Day, Reimagined |
| --- | --- | --- | --- |
| Visual impact | High, tactile and character-led | High, precise and architectural | Very high cinematic potential |
| Brand suitability | Highest: ordinary problems, helpful engineering | Strong for technical credibility | Strong for emotional storytelling |
| Implementation complexity | Medium | Medium | High |
| Mobile compatibility | Strong, natural stacked composition | Strong with simplified diagram | Requires a distinct presentation |
| Performance risk | Low to medium | Medium | High |
| Main risk | Character fidelity | Familiar enterprise aesthetic | Story delays access to useful content |

Recommendation: A, with B's clear workflow controls. Keep A's composition and material system; do not combine all three art directions. The useful 3D interaction is connecting business work, not free-floating decoration.

Review the local [visual comparison](design-review/index.html). These are composition studies using the existing poster, not finished graphics or a working redesigned site. Selection is requested because the original brief explicitly says to implement the approved direction.

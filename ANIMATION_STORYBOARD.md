# Animation storyboard

Updated: 2026-10-20. Selected direction: **2, The Operating System**. This records the implemented narrative and retained film, replacing the earlier concept proposal.

## Homepage sequence

| Beat | Composition and message | Behavior |
| --- | --- | --- |
| 1. Your business. In sync. | Stable headline beside the yellow character and connected modules | Static image first; 3D on explicit intent or eligible desktop pointer entry |
| 2. Connected capabilities | ERP, software, AI, data, APIs and cloud form one offering | Native choices update HTML; a loaded scene highlights its matching module |
| 3. Useful in practice | Actual Rigel screenshots and product destinations provide evidence | Overview, Inventory and Assistant choices replace screenshot and copy |
| 4. A familiar story | A shop's unfinished work becomes connected | One 22.6-second character film played on request, with a text description |
| 5. Accountable engineering | Access, records and people in control | Readable static principles, no hover requirement |
| 6. Understand, connect, build, improve | Founder background and four practical steps | Normal scrolling HTML without a pinned scene |
| 7. Start a conversation | Existing assistant, editable brief, consent and direct email | The visitor chooses what to share and when to submit |

Navigation reaches capabilities, work, approach and contact directly. The hero does not require three fullscreen chapters before products. Contact returns to the carbon/blue language without a second renderer.

## Scene choreography

Initial 3D uses the current service, initially ERP. Selection slightly enlarges its module, brightens its blue route and accent, and turns the character subtly toward that side. Progress takes approximately 400 ms under normal frame timing.

Mouse movement supplies a small rotation target. Exponential easing settles toward it; leaving the stage returns to center. Maximum pointer rotation is about 4.6 degrees horizontally and 1.7 degrees vertically. There is no ambient bobbing, orbiting camera, perpetual particle loop or scroll-driven animation.

Frames stop once settled, when offscreen or when the document is hidden. Pause disables optional pointer movement and makes selection immediate. Live reduced motion does the same, removing CSS transitions and phone perspective. All choices and service explanations work with the static view.

## Final retained film

The user chose the character reel, `media/reel.mp4`, and removed the text-only landscape film from the page. The 60-second original remains in the repository for recovery. The page serves `media/character-short.mp4`.

Final cut at original speed:

| Source range | Output range | Story beat |
| --- | --- | --- |
| 0.0 to 14.2 seconds | 0.0 to 14.2 seconds | 9 PM hook, scattered orders and inventory becoming clearer |
| 19.0 to 23.4 seconds | 14.2 to 18.6 seconds | Handwritten bills become checked invoices |
| 51.0 to 55.0 seconds | 18.6 to 22.6 seconds | "One system. Everything joined up." |

The social instruction to comment "HISAAB" and the intervening longer feature tour are omitted. Normal speed and the complete portrait frame are retained. Monitor panels in the film are illustrations, not screenshots proving every Rigel feature.

ffprobe confirms 22.600 seconds, 678 frames at 30 fps, 720 by 1280 pixels, H.264 video, mono AAC audio and 3,301,985 bytes. The visible duration rounds to 23 seconds. The player is muted initially, with native playback and sound controls. It never autoplays or loops.

## Presentation and alternatives

Desktop pairs explanatory copy with a wider dark stage. The picture keeps its 9:16 aspect ratio with `object-fit: contain`, preserving the character, top captions and right-hand monitor. It is neither cropped to landscape nor stretched. Phone width is at most 270 px.

The "Read the film's story" disclosure describes the visual sequence and identifies it as an illustrated workflow. Video pauses when offscreen, when the page is hidden and on page exit. It does not resume automatically when the visitor returns.

Audio remains in the output. This document confirms format and duration, not a speech transcript, soundtrack rights review or audio continuity approval. Playback results and remaining limitations belong in `QA_REPORT.md`.

## Interaction discipline

Essential information is HTML. Selection uses native buttons and `aria-pressed`; focus remains on the initiating control. Nothing depends on raycasting, a custom cursor, hover or animation. Inquiry busy states are scoped to inquiry controls, keeping product and graphics choices available during a request.

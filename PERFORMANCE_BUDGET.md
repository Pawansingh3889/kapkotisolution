# Performance budget

Date: 2026-10-19  
Baseline: `ddc5c56`  
Status: proposed engineering targets for design approval. Implementation and performance measurement have not started.

These budgets guide the prototype and final implementation. They are not measured outcomes, field guarantees, or evidence of current Core Web Vitals compliance.

## Known baseline asset sizes

Sizes below were read from local files. Gzip sizes are locally compressed estimates, not measured network transfers. Fonts, response headers, caching behavior, and request scheduling are not included.

| Root asset | Raw bytes | Estimated gzip bytes |
| --- | ---: | ---: |
| `index.html` | 28,457 | 9,070 |
| `style.css` | 17,277 | 4,602 |
| `app.js` | 8,708 | 3,079 |
| `story.js` | 571,279 | 143,919 |

| Existing media | File bytes | Intended treatment |
| --- | ---: | --- |
| `media/reel.mp4` | 7,958,384 | Preserve original; create a separate short character edit |
| `media/reel-poster.jpg` | 42,981 | Preserve original; review suitability for the wider composition |
| `media/workflow.mp4` | 13,866,809 | Remove its player from the redesigned page; preserve original |
| `media/poster.jpg` | 183,081 | Preserve original; not a required redesigned-page download |
| `media/teaser.mp4` | 837,454 | Existing asset; do not load unless the approved design uses it |

`story.js` is currently loaded eagerly (`index.html:11`). The existing scene caps DPR at 2 and uses a 1024 by 1024 shadow map on all devices (`scene/story.js:155`, `scene/story.js:187`). A local Wrangler dry run reported only Worker code size, 14.32 KiB raw / 5.55 KiB gzip; that number is not the website payload.

## Proposed loading budgets

| Category | Initial target | Acceptance approach |
| --- | --- | --- |
| First-render assets | At most 150 KiB compressed total for HTML, critical CSS, ordinary interface JavaScript, and required fonts | Inspect cold network waterfall before optional 3D or user-started film playback |
| Ordinary interface JavaScript | At most 25 KiB compressed | Inspect generated output; keep chat and navigation independent of the scene bundle |
| Optional 3D JavaScript | At most 160 KiB compressed | Compare generated bundle and transfer size; existing Three.js bundle is about 141 KiB gzip |
| Hero static fallback | At most 100 KiB at the selected responsive size | Verify actual requested source at desktop and mobile widths |
| Film poster | At most 80 KiB | Inspect delivered file and visible quality |
| Short character film | 20 to 30 seconds; aim for at most 4 MiB for the main rendition | Encode, inspect motion and legibility, then measure delivered size; revise composition or encoding if needed |
| Film loading | No full video download before user intent | Use a poster and conservative preload; verify the actual browser request behavior |
| Fonts | At most two families and only necessary subsets/weights | Inspect downloaded font files; prefer local delivery and stable fallback metrics |

If quality requires a budget exception, document its measured benefit and cost before approving it. Do not add new graphics libraries without comparing them with the already installed Three.js and browser capabilities.

## Proposed experience targets

| Metric | Target | Measurement limit |
| --- | --- | --- |
| LCP | At most 2.5 seconds | Field goal at the 75th percentile when sufficient real-user data exists; lab tests are supporting evidence |
| INP | At most 200 milliseconds | Field goal at the 75th percentile; scripted interaction timings do not establish field INP |
| CLS | At most 0.1 | Measure cold and warm loads, font swap, poster loading, and scene activation |
| Desktop scene | Smooth interaction, initially targeting 60 fps on the representative test machine | Record frame times rather than claiming a universal device guarantee |
| Constrained mobile scene | Stable simplified experience, initially targeting 30 fps where animation is enabled | Prefer a static fallback when the scene cannot sustain its target |
| Offscreen and hidden state | No sustained animation loop or video playback after the relevant visibility transition | Inspect frames and browser performance trace |
| Reduced motion | Static composition with readable content and working controls | Verify preference before load and while the page is open |
| Memory | No sustained growth after repeated scene activation, teardown, and navigation | Compare repeated cycles after garbage collection opportunities; record tool and environment |

## Graphics policy to prototype

- Load the static text, calls to action, and fallback artwork first. Load optional scene code only when appropriate.
- Start with one shared scene and native HTML controls. Use custom shaders only when they visibly strengthen the approved character concept.
- Cap desktop DPR at 1.5 initially and use DPR 1 for the constrained-device prototype. Measure before raising quality.
- Avoid postprocessing by default. Use lighting and materials before adding bloom, extra render targets, or high-resolution textures.
- Use visibility-aware rendering, stop unnecessary idle frames, and honor document visibility.
- Reduce scene complexity for mobile instead of shrinking the desktop composition.
- Handle WebGL initialization failure and context loss with a complete static alternative.
- Dispose of owned geometry, materials, textures, observers, listeners, and animation requests during scene teardown.
- Keep product copy, navigation, contact, and intake usable before the optional scene loads and if it fails.

These are prototype constraints, not implemented capabilities. Actual draw-call, geometry, shader, and texture budgets should be set from the approved prototype's measurements rather than invented in advance.

## Measurement plan

1. Build and synchronize the exact assets to be reviewed. Confirm root/public consistency and record the commit.
2. Measure cold and warm loads with a clean browser profile. Record browser version, machine, viewport, device scale, CPU settings, connection settings, and whether WebGL is active.
3. Run desktop and mobile Lighthouse against the built site. Preserve reports and distinguish lab metrics from field metrics.
4. Capture a slow-mobile network waterfall with cache disabled. Verify that video payloads and optional 3D do not delay essential content.
5. Profile scrolling, pointer interactions, service selection, film playback, and intake form interaction. Record long tasks, frame times, and layout shifts.
6. Test a representative physical iPhone and Android device. Emulation alone does not establish device performance.
7. Test reduced motion, WebGL unavailable, context loss/recovery, background tab behavior, resize, orientation change, and zoom.
8. Repeat scene activation/teardown and navigation while watching memory. Fix observed growth before claiming lifecycle stability.

Current evidence is limited to file sizes and successful baseline local checks. Lighthouse, cold/warm timing, network traces, GPU profiling, physical-device measurements, and field data remain pending.

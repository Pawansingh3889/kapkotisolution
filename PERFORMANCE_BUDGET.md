# Performance policy and measured baseline

Updated 25 October 2026. Actual local lab results are in `QA_REPORT.md`. Targets below are acceptance goals, not production promises.

## Loading policy

- Home uses readable HTML, CSS, a 194-byte theme initializer and a small shared UI entry. It loads no video, Three.js, model API or remote font on entry.
- Contact adds the approximately 5.6 KiB intake entry. No model call occurs before an explicit user action.
- Services adds the approximately 1.9 KiB scene controller. The approximately 546.7 KiB Three.js/system chunk loads only after an explicit scene request.
- The retained 3.3 MB short film uses native controls and `preload=none`; offscreen/hidden playback pauses.
- Product images retain dimensions and lazy loading. The social image is 1200 by 630 and is not a homepage runtime image.
- Browser bundles are hashed and immutable. HTML and CSS revalidate. Source assets and original media stay in the repository; only the selected allowlist is packaged.

## Budgets and goals

| Item | Budget/goal | Current evidence |
| --- | --- | --- |
| Initial home JavaScript | Under 20 KiB uncompressed | Approximately 4.3 KiB across UI, theme and shared helper |
| CSS | Under 60 KiB uncompressed | 48,717 bytes in the current artifact |
| Three.js on entry | Zero on main marketing pages | Only explicit Services interaction imports the system chunk |
| Video on entry | No video body download | Native `preload=none` |
| LCP | At most 2.5 s | See the latest mobile lab run in QA_REPORT.md |
| CLS | At most 0.1 | Approximately 0.0007 in the plain-language revision lab run |
| Main-thread blocking | Minimize; lab TBT below 200 ms | Zero measured TBT in the recorded home runs |
| Field INP | At most 200 ms at p75 with enough data | Not measured |

The earlier 24 October cold/warm paired cache audit uses Lighthouse's documented `--disable-storage-reset` behavior with a separate persistent temporary profile: https://github.com/GoogleChrome/lighthouse. The warm network log confirmed script disk-cache hits. Both runs used default mobile simulated throttling. Local serving, lab simulation and this hardware do not predict every customer network/device.

The theme script and CSS block first render intentionally to prevent a theme flash. Current Lighthouse performance scores are 100; no extra preload system, animation framework or rendering dependency was added to chase the remaining small dependency-chain insight. Reconsider only after a measured user-facing problem.

## Motion and remaining measurements

CSS motion is limited to small control feedback and disabled for reduced motion. The optional scene stops at rest/offscreen/hidden, respects live reduced motion, caps DPR and preserves its existing disposal behavior. No autoplay, scroll hijacking, postprocessing or remote shader/texture load was added.

Not measured: production field metrics, slow physical devices, sustained GPU load, memory traces, real-device batteries or traffic volume. Reassess those for any future increase in graphics or interaction scope.

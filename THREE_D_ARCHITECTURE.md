# 3D architecture

Updated: 25 October 2026. The existing Three.js implementation is retained as an optional Services page illustration. Static HTML/CSS, strict browser TypeScript and esbuild remain. This work adds no database or framework migration.

## Source boundaries

| File | Responsibility |
| --- | --- |
| `pages/about.html` | Native disclosure, static image, controls and film |
| `style.css` | Layout, fallback composition and reduced motion |
| `studio.ts` | Scene selection, explicit loading, status and disposal |
| `ui.ts` | Shared navigation, theme, screenshots, explorers and film pausing |
| `app.ts` | Contact intake only |
| `scene/system.ts` | Renderer, camera, quality policy and lifecycle |
| `scene/character.ts` | Existing procedural character factory |
| `scene/workflow.ts` | Existing six illustrative modules |
| `scripts/build-client.mjs` | Hashed entries with dynamically split Three.js |
| `scripts/sync-site.sh` | Generated pages and allowlisted public media |

The nine service categories do not drive the six illustration states. Services loads a small scene controller; the Three.js/system bundle is fetched only after an explicit request. Home, services and contact do not load the illustration entry. Browser sources remain strict TypeScript.

## Scene contract

`scene/system.ts` exports named and default `createScene(canvas: HTMLCanvasElement)`:

```ts
interface SystemScene {
  setState(index: number): void;
  pause(paused: boolean): void;
  dispose(): void;
}
```

Integer states are 0 ERP, 1 custom software, 2 AI and automation, 3 data, 4 integrations and 5 cloud. Invalid indexes raise `RangeError`. Selection slightly enlarges a module and brightens its accent and route. The selection and status remain available through native HTML controls owned by `studio.ts`.

The canvas emits bubbling `scene-ready` and `scene-error` events. `studio.ts` toggles the stage's `ready` class and exposes the fallback when necessary. Canvas content is decorative and hidden from assistive technology. Native controls retain focus.

## Loading policy

`media/system-poster.webp` occupies a reserved-size stage from first paint. Three.js sits behind a dynamic import and is excluded from the initial browser entry bundles.

Intent triggers are the explicit “Explore in 3D” button or one of the six illustration choices inside the native Services page disclosure. There is no automatic pointer-entry load. Mobile, reduced-motion and data-saving visitors may keep the static illustration or explicitly request the scene. Context creation failure keeps that image and provides a retry. No capability fingerprint or automatic benchmark download is used.

## Scheduling and quality

One renderer owns one requestAnimationFrame chain. Load, selection, pointer input, resize, visibility restoration and context restoration request frames. Selection settles over a nominal 400 ms; pointer easing stops below 0.0003 radians error. Idle scenes schedule no frames.

`ResizeObserver` updates renderer dimensions and camera aspect. Camera distance keeps six modules in view at narrow stage ratios. `IntersectionObserver` stops offscreen rendering. Document visibility stops pending work while hidden; returning requests a fresh frame and can finish an interrupted transition.

Every resize caps DPR at 1.5 on desktop and 1 below a 900 px viewport. Eight observed animation intervals longer than 34 ms lower a separate adaptive ceiling to 1 for the remaining scene lifetime. This is a conservative cumulative signal, not a sustained-load benchmark. The renderer requests low power and uses no shadows, postprocessing or external textures. It preserves its drawing buffer so the settled frame remains available for idle display and capture; the DPR cap limits that backing buffer's size. Device measurements belong in `QA_REPORT.md`.

Pause and live reduced-motion changes keep controls functional: state changes become immediate, pointer response stops and a frame reflects the selected state. They do not prevent necessary resize or state rendering.

## Ownership and lifecycle

Character parts share sphere geometry and materials. Module panels share box geometry and silver/dark materials. Each connection has compact tube geometry; each module has its own changing accent material. The body is a lathed silhouette and its smile is a small tube.

Context loss prevents default teardown, cancels frames, hides the canvas and emits `scene-error`. Browser context restoration shows the canvas, reapplies size and camera settings, requests a frame and emits `scene-ready`; Three.js handles rebuilding underlying GPU resources. Browser verification is required before claiming this path works across devices.

`dispose()` is idempotent. It cancels animation, disconnects both observers, removes pointer, visibility, media-query and context listeners, and disposes unique geometries and materials once using sets. It disposes the renderer and releases its context. `studio.ts` disposes on page exit except when the browser preserves the page in its back-forward cache.

The retained scene was rendered and paused in Chrome during this change. Safari, physical devices and injected context-loss browser checks were not rerun. See `QA_REPORT.md` for current evidence and limits.

## Technology decisions

| Technology | Decision |
| --- | --- |
| Three.js | Reuse the installed renderer and standard materials |
| React, R3F, Drei | Unnecessary for this static application and small scene |
| GSAP, ScrollTrigger, Motion, Theatre, Lenis | Native controls and finite transitions cover the narrative |
| Custom GLSL | Geometry and standard materials explain the connections without another shader system |
| WebGPU | Not required for the selected scene or device coverage |
| Blender and GLB | No editable film character source was available; the site uses a procedural interpretation |
| Draco, Meshopt, KTX2 | No imported mesh or texture payload exists to compress |

The illustration is separate from product evidence. Rigel screenshots remain HTML images; the character film is explicitly an illustrated workflow. This architecture document records behavior and ownership, not a claim that every browser or field-performance target passed.

# 3D architecture

Updated: 2026-10-20. Selected direction: **2, The Operating System**. The implementation retains static HTML/CSS, strict browser TypeScript, Three.js and esbuild. The existing Cloudflare Worker, D1 storage and AI inquiry remain by explicit user instruction. This redesign adds no database or framework migration.

## Source boundaries

| File | Responsibility |
| --- | --- |
| `index.html` | Semantic content, fallback image, native controls and inquiry markup |
| `style.css` | Tokens, layout, static composition and reduced motion |
| `app.ts` | Navigation and preserved inquiry behavior |
| `ui.ts` | Service selection, optional scene loading, screenshot selection and film pausing |
| `scene/system.ts` | Renderer, camera, lights, quality policy and lifecycle |
| `scene/character.ts` | Procedural character factory |
| `scene/workflow.ts` | Six connected modules and selected appearance |
| `scripts/build-client.mjs` | Split browser bundles through esbuild |
| `scripts/sync-site.sh` | Root-to-public synchronization and selected media |

`tsconfig.json` checks `app.ts`, `ui.ts` and `scene/**/*.ts` with strict mode, unchecked indexed access and unused symbol checks. The old `scene/story.js` and film renderer remain for recovery. The new HTML does not load the old story bundle.

## Scene contract

`scene/system.ts` exports named and default `createScene(canvas: HTMLCanvasElement)`:

```ts
interface SystemScene {
  setState(index: number): void;
  pause(paused: boolean): void;
  dispose(): void;
}
```

Integer states are 0 ERP, 1 custom software, 2 AI and automation, 3 data, 4 integrations and 5 cloud. Invalid indexes raise `RangeError`. Selection slightly enlarges a module and brightens its accent and route. Corresponding explanations remain ordinary HTML owned by `ui.ts`.

The canvas emits bubbling `scene-ready` and `scene-error` events. `ui.ts` toggles the stage's `ready` class and exposes the fallback when necessary. Canvas content is decorative and hidden from assistive technology. Native controls retain focus.

## Loading policy

`media/system-poster.webp` occupies a reserved-size stage from first paint. Three.js sits behind a dynamic import and is excluded from the initial browser entry bundles.

Intent triggers are the "Explore in 3D" button, a hero ERP/AI/Data choice, or pointer entry on an eligible desktop viewport of at least 900 px. Pointer entry is registered only when reduced motion and the available save-data hint are off. Capability choices below the hero update HTML without forcing a scene download; they also update an already loaded scene.

Mobile, tablet, reduced-motion and save-data visitors start with the static view and may explicitly request 3D. Context creation failure keeps that image and provides a retry. No capability fingerprint or automatic benchmark download is used.

## Scheduling and quality

One renderer owns one requestAnimationFrame chain. Load, selection, pointer input, resize, visibility restoration and context restoration request frames. Selection settles over a nominal 400 ms; pointer easing stops below 0.0003 radians error. Idle scenes schedule no frames.

`ResizeObserver` updates renderer dimensions and camera aspect. Camera distance keeps six modules in view at narrow stage ratios. `IntersectionObserver` stops offscreen rendering. Document visibility stops pending work while hidden; returning requests a fresh frame and can finish an interrupted transition.

Every resize caps DPR at 1.5 on desktop and 1 below a 900 px viewport. Eight observed animation intervals longer than 34 ms lower a separate adaptive ceiling to 1 for the remaining scene lifetime. This is a conservative cumulative signal, not a sustained-load benchmark. The renderer requests low power and uses no shadows, postprocessing or external textures. It preserves its drawing buffer so the settled frame remains available for idle display and capture; the DPR cap limits that backing buffer's size. Device measurements belong in `QA_REPORT.md`.

Pause and live reduced-motion changes keep controls functional: state changes become immediate, pointer response stops and a frame reflects the selected state. They do not prevent necessary resize or state rendering.

## Ownership and lifecycle

Character parts share sphere geometry and materials. Module panels share box geometry and silver/dark materials. Each connection has compact tube geometry; each module has its own changing accent material. The body is a lathed silhouette and its smile is a small tube.

Context loss prevents default teardown, cancels frames, hides the canvas and emits `scene-error`. Browser context restoration shows the canvas, reapplies size and camera settings, requests a frame and emits `scene-ready`; Three.js handles rebuilding underlying GPU resources. Browser verification is required before claiming this path works across devices.

`dispose()` is idempotent. It cancels animation, disconnects both observers, removes pointer, visibility, media-query and context listeners, and disposes unique geometries and materials once using sets. It disposes the renderer and releases its context. `ui.ts` disposes on page exit except when the browser preserves the page in its back-forward cache.

Static poster capture and final Safari canvas visibility are under visual QA. A file existing on disk does not establish that its WebGL content was captured correctly. See `QA_REPORT.md` for current results.

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

import { createScene } from '../scene/system.ts';

const results = document.getElementById('results');
const stage = document.getElementById('system-stage');
const assert = (condition, description) => {
  if (!condition) throw new Error(description);
  results.textContent += `PASS: ${description}\n`;
};
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let frames = 0;
const originalFrame = window.requestAnimationFrame;
window.requestAnimationFrame = (callback) => originalFrame.call(window, (time) => { frames++; callback(time); });

async function verify() {
  const canvas = document.querySelector('canvas');
  const scene = createScene(canvas);
  try {
    await wait(150);
    assert(!canvas.hidden, 'WebGL scene renders');
    scene.setState(5);
    await wait(800);
    const idle = frames;
    await wait(200);
    assert(frames === idle, 'No animation frames after selection settles');
    scene.pause(true);
    scene.setState(2);
    await wait(150);
    const paused = frames;
    await wait(150);
    assert(frames === paused, 'Paused scene remains idle');
    const context = canvas.getContext('webgl2');
    const extension = context?.getExtension('WEBGL_lose_context');
    assert(Boolean(extension), 'Context-loss testing extension available');
    extension.loseContext();
    await wait(150);
    assert(canvas.hidden, 'Context loss exposes fallback');
    extension.restoreContext();
    await wait(400);
    assert(!canvas.hidden, 'Context restore returns scene');
    scene.dispose();
    const stopped = frames;
    scene.setState(0);
    scene.pause(false);
    await wait(150);
    assert(canvas.hidden && frames === stopped, 'Dispose hides canvas and prevents further frames');
    for (let index = 0; index < 3; index++) {
      const next = document.createElement('canvas');
      stage.replaceChildren(next);
      const mounted = createScene(next);
      mounted.setState(index);
      await wait(50);
      mounted.dispose();
    }
    const afterCycles = frames;
    await wait(200);
    assert(frames === afterCycles, 'Repeated mount/dispose leaves no animation loop');
    const unsupported = document.createElement('canvas');
    stage.replaceChildren(unsupported);
    unsupported.getContext = () => null;
    let fallback = false;
    unsupported.addEventListener('scene-error', () => { fallback = true; });
    try { createScene(unsupported); } catch { /* Expected on a device without WebGL. */ }
    assert(fallback && unsupported.hidden, 'Unavailable WebGL leaves the static fallback available');

    const originalMedia = window.matchMedia;
    const motion = new EventTarget();
    motion.matches = true;
    window.matchMedia = (query) => query.includes('prefers-reduced-motion') ? motion : originalMedia.call(window, query);
    const stillCanvas = document.createElement('canvas');
    stage.replaceChildren(stillCanvas);
    const stillScene = createScene(stillCanvas);
    try {
      stillScene.setState(4);
      await wait(150);
      const stillFrames = frames;
      await wait(200);
      assert(frames === stillFrames, 'Reduced motion changes state without a settling loop');
      motion.matches = false;
      motion.dispatchEvent(new Event('change'));
      motion.matches = true;
      motion.dispatchEvent(new Event('change'));
      await wait(150);
      assert(!stillCanvas.hidden, 'Live motion preference changes keep the scene usable');
    } finally {
      stillScene.dispose();
      window.matchMedia = originalMedia;
    }
    results.dataset.status = 'passed';
  } finally {
    scene.dispose();
  }
}
verify().catch((error) => { results.textContent += `FAIL: ${error.message}`; results.dataset.status = 'failed'; });

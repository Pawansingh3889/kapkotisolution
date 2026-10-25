import type { SystemScene } from './scene/system';
import { element as required } from './dom';

const stage = required('system-stage', HTMLElement);
let canvas = required('scene', HTMLCanvasElement);
const sceneStatus = required('scene-status', HTMLElement);
const loadButton = required('scene-load', HTMLButtonElement);
const pauseButton = required('scene-toggle', HTMLButtonElement);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const serviceNames = ['ERP & operations', 'Custom software', 'AI & automation', 'Data & analytics', 'API & integrations', 'Cloud architecture'];
const choices = [...document.querySelectorAll<HTMLButtonElement>('[data-service]')];
let selected = 0;
let scene: SystemScene | null = null;
let loading = false;
let paused = false;
let disposed = false;
let staticView = false;
const STATIC_STATUS = 'Static system view. All capabilities remain available below.';

function selectService(index: number) {
  const name = serviceNames[index];
  if (!name) throw new RangeError('Unknown service.');
  selected = index;
  choices.forEach((button) => {
    const active = Number(button.dataset.service) === index;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('active', active);
  });
  sceneStatus.textContent = staticView ? STATIC_STATUS : `${name}. Connected to the whole.`;
  scene?.setState(index);
}
choices.forEach((button) => button.addEventListener('click', () => {
  selectService(Number(button.dataset.service));
  if (button.closest('.scene-controls')) void loadScene();
}));
selectService(0);
document.querySelectorAll<HTMLElement>('.scene-controls').forEach((control) => { control.hidden = false; });

stage.addEventListener('scene-ready', () => {
  stage.classList.add('ready');
  staticView = false;
  sceneStatus.textContent = `${serviceNames[selected]}. Connected to the whole.`;
  pauseButton.hidden = reduced.matches;
  loadButton.hidden = true;
});
stage.addEventListener('scene-error', () => {
  stage.classList.remove('ready');
  pauseButton.hidden = true;
  showStatic();
});

function showStatic() {
  staticView = true;
  sceneStatus.textContent = STATIC_STATUS;
  loadButton.hidden = false;
  loadButton.textContent = 'Retry 3D view';
}

async function loadScene() {
  if ((scene && !staticView) || loading || disposed) return;
  loading = true;
  if (scene) {
    // A lost WebGL context cannot be reused, so retry on a fresh canvas.
    scene.dispose();
    scene = null;
    const fresh = canvas.cloneNode() as HTMLCanvasElement;
    canvas.replaceWith(fresh);
    canvas = fresh;
  }
  loadButton.disabled = true;
  loadButton.textContent = 'Opening 3D…';
  try {
    const { createScene } = await import('./scene/system');
    if (disposed) return;
    scene = createScene(canvas);
    scene.setState(selected);
    scene.pause(paused || reduced.matches);
  } catch {
    canvas.hidden = true;
    stage.classList.remove('ready');
    showStatic();
  } finally {
    loading = false;
    loadButton.disabled = false;
  }
}
loadButton.hidden = false;
loadButton.addEventListener('click', () => { void loadScene(); });
pauseButton.addEventListener('click', () => {
  paused = !paused;
  scene?.pause(paused);
  pauseButton.textContent = paused ? 'Enable motion' : 'Pause motion';
  pauseButton.setAttribute('aria-pressed', String(paused));
});
reduced.addEventListener('change', () => {
  scene?.pause(paused || reduced.matches);
  pauseButton.hidden = !scene || reduced.matches;
});

window.addEventListener('pagehide', (event) => {
  if (event.persisted) return;
  disposed = true;
  scene?.dispose();
  scene = null;
});

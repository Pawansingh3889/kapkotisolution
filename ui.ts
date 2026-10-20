import type { SystemScene } from './scene/system';

function required<T extends HTMLElement>(id: string, type: { new(): T }): T {
  const node = document.getElementById(id);
  if (!(node instanceof type)) throw new Error(`Missing interface element: ${id}`);
  return node;
}

const stage = required('system-stage', HTMLElement);
const canvas = required('scene', HTMLCanvasElement);
const sceneStatus = required('scene-status', HTMLElement);
const loadButton = required('scene-load', HTMLButtonElement);
const pauseButton = required('scene-toggle', HTMLButtonElement);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const serviceNames = ['ERP & operations', 'Custom software', 'AI & automation', 'Data & analytics', 'API & integrations', 'Cloud architecture'];
const choices = [...document.querySelectorAll<HTMLButtonElement>('[data-service]')];
const panels = [...document.querySelectorAll<HTMLElement>('.service-panel')];
let selected = 0;
let scene: SystemScene | null = null;
let loading = false;
let paused = false;
let disposed = false;

function selectService(index: number) {
  const name = serviceNames[index];
  if (!name || !panels[index]) throw new RangeError('Unknown service.');
  selected = index;
  choices.forEach((button) => {
    const active = Number(button.dataset.service) === index;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('active', active);
  });
  panels.forEach((panel, panelIndex) => { panel.hidden = panelIndex !== index; });
  sceneStatus.textContent = `${name}. Connected to the whole.`;
  scene?.setState(index);
}
choices.forEach((button) => button.addEventListener('click', () => {
  selectService(Number(button.dataset.service));
  if (button.closest('.scene-controls')) void loadScene();
}));
document.querySelector('.service-explorer')?.classList.add('enhanced');
selectService(0);
document.querySelectorAll<HTMLElement>('.service-list, .scene-controls, .product-controls').forEach((control) => { control.hidden = false; });

stage.addEventListener('scene-ready', () => {
  stage.classList.add('ready');
  pauseButton.hidden = reduced.matches;
  loadButton.hidden = true;
});
stage.addEventListener('scene-error', () => {
  stage.classList.remove('ready');
  pauseButton.hidden = true;
  sceneStatus.textContent = 'Static system view. All capabilities remain available below.';
});

async function loadScene() {
  if (scene || loading || disposed) return;
  loading = true;
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
    sceneStatus.textContent = 'Static system view. All capabilities remain available below.';
    loadButton.hidden = false;
    loadButton.textContent = 'Retry 3D view';
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

const connection = 'connection' in navigator ? navigator.connection : null;
const saveData = typeof connection === 'object' && connection !== null && 'saveData' in connection && connection.saveData === true;
if (matchMedia('(min-width: 900px)').matches && !reduced.matches && !saveData) {
  stage.addEventListener('pointerenter', () => { void loadScene(); }, { once: true });
}

const screenshots = {
  dashboard: { src: '/media/rigel-dashboard.jpg', alt: 'Rigel dashboard with sample money received, orders, stock and recent activity', text: 'A daily view of orders, stock and recent activity.' },
  stock: { src: '/media/rigel-stock.jpg', alt: 'Rigel inventory screen showing sample products and their on-hand and available quantities', text: 'See what is on hand, what is committed and what is available.' },
  assistant: { src: '/media/rigel-assistant.jpg', alt: 'Rigel assistant answering a low-stock question using sample workshop data', text: 'Ask a question about your figures. The assistant reads data without changing it.' },
};
const productImage = required('product-screen', HTMLImageElement);
const productDescription = required('product-description', HTMLElement);
const productButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-product]')];
productButtons.forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.product;
  if (key !== 'dashboard' && key !== 'stock' && key !== 'assistant') throw new Error('Unknown product view.');
  const screenshot = screenshots[key];
  productImage.src = screenshot.src;
  productImage.alt = screenshot.alt;
  productDescription.textContent = screenshot.text;
  productButtons.forEach((control) => {
    const active = control === button;
    control.classList.toggle('active', active);
    control.setAttribute('aria-pressed', String(active));
  });
}));

const film = document.querySelector('video');
if (film) {
  const observer = new IntersectionObserver(([entry]) => { if (!entry?.isIntersecting) film.pause(); });
  observer.observe(film);
  document.addEventListener('visibilitychange', () => { if (document.hidden) film.pause(); });
  window.addEventListener('pagehide', () => { film.pause(); });
}
window.addEventListener('pagehide', (event) => {
  if (event.persisted) return;
  disposed = true;
  scene?.dispose();
  scene = null;
});

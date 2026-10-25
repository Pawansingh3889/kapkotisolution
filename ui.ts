import { element } from './dom';

const menu = element('menu', HTMLDetailsElement);
const wide = matchMedia('(min-width: 1100px)');
const syncMenu = () => { menu.open = wide.matches; };
wide.addEventListener('change', syncMenu);
syncMenu();
menu.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('a') && !wide.matches) menu.open = false;
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.open && !wide.matches) {
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }
});
document.addEventListener('click', (event) => {
  if (event.target instanceof Node && !menu.contains(event.target) && !wide.matches) menu.open = false;
});
element('year', HTMLElement).textContent = String(new Date().getFullYear());

const themeButton = element('theme-toggle', HTMLButtonElement);
function themeLabel() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeButton.setAttribute('aria-pressed', String(dark));
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1019' : '#f6f7fb');
}
themeButton.hidden = false;
themeLabel();
themeButton.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('kapkoti-theme', next); } catch { /* Theme still works when browser storage is unavailable. */ }
  themeLabel();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  try { if (localStorage.getItem('kapkoti-theme')) return; } catch { /* Follow the system when storage is unavailable. */ }
  document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
  themeLabel();
});

document.querySelectorAll<HTMLElement>('[data-explorer]').forEach((explorer) => {
  const buttons = [...explorer.querySelectorAll<HTMLButtonElement>('[data-select]')];
  const panels = [...explorer.querySelectorAll<HTMLElement>('[data-panel]')];
  function activate(index: number) {
    const button = buttons[index];
    if (!button || !panels.some((panel) => panel.dataset.panel === button.dataset.select)) throw new RangeError('Unknown explorer selection.');
    buttons.forEach((choice) => { choice.setAttribute('aria-pressed', String(choice === button)); });
    panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== button.dataset.select; });
  }
  const fromHash = () => {
    const selected = panels.find((panel) => `#${panel.id}` === window.location.hash);
    const index = selected ? buttons.findIndex((button) => button.dataset.select === selected.dataset.panel) : 0;
    activate(index);
  };
  fromHash();
  window.addEventListener('hashchange', fromHash);
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => { activate(index); });
    button.addEventListener('keydown', (event) => {
      let next: number;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + buttons.length - 1) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      activate(next);
      buttons[next]?.focus();
    });
  });
  explorer.querySelectorAll<HTMLElement>('.explorer-controls').forEach((control) => { control.hidden = false; });
  explorer.classList.add('enhanced');
});

// Direct links must reveal optional details as well as the selected content inside them.
function revealLinkedContent() {
  const target = document.getElementById(window.location.hash.slice(1));
  let linked = target;
  let revealed = false;
  while (linked) {
    if (linked instanceof HTMLDetailsElement && !linked.open) {
      linked.open = true;
      revealed = true;
    }
    linked = linked.parentElement;
  }
  if (revealed) target?.scrollIntoView({ block: 'start' });
}
revealLinkedContent();
window.addEventListener('hashchange', revealLinkedContent);

const screenshots = {
  dashboard: { src: '/media/rigel-dashboard.jpg', alt: 'Rigel dashboard with illustrative orders, stock and recent activity', text: 'A daily view of orders, stock and recent activity.' },
  stock: { src: '/media/rigel-stock.jpg', alt: 'Rigel inventory screen showing sample products and quantities', text: 'See what is on hand, what is committed and what is available.' },
  assistant: { src: '/media/rigel-assistant.jpg', alt: 'Rigel assistant answering a low-stock question using sample data', text: 'An example read-only answer about business figures. The screenshot does not verify the current deployed revision.' },
};
const productImage = document.getElementById('product-screen');
if (productImage instanceof HTMLImageElement) {
  const productDescription = element('product-description', HTMLElement);
  const productButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-product]')];
  productButtons.forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.product;
    if (key !== 'dashboard' && key !== 'stock' && key !== 'assistant') throw new RangeError('Unknown product view.');
    const screenshot = screenshots[key];
    productImage.src = screenshot.src;
    productImage.alt = screenshot.alt;
    productDescription.textContent = screenshot.text;
    productButtons.forEach((choice) => { choice.setAttribute('aria-pressed', String(choice === button)); });
  }));
  document.querySelector<HTMLElement>('.product-controls')?.removeAttribute('hidden');
}

const film = document.querySelector('video');
if (film) {
  const observer = new IntersectionObserver(([entry]) => { if (!entry?.isIntersecting) film.pause(); });
  observer.observe(film);
  document.addEventListener('visibilitychange', () => { if (document.hidden) film.pause(); });
  window.addEventListener('pagehide', () => { film.pause(); });
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build } from 'esbuild';

const compiled = await build({ entryPoints: ['ui.ts'], bundle: true, write: false, format: 'iife' });
const theme = await build({ entryPoints: ['theme.ts'], bundle: true, write: false, format: 'iife' });

class Node {
  constructor(id = '') { this.id = id; this.dataset = {}; this.attributes = {}; this.listeners = {}; this.hidden = false; this.classList = { add() {}, contains: () => false }; }
  addEventListener(event, callback) { (this.listeners[event] ||= []).push(callback); }
  emit(event, properties = {}) { const value = { target: this, preventDefault() {}, ...properties }; for (const callback of this.listeners[event] || []) callback(value); }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  focus() { this.focused = true; }
  scrollIntoView() { this.scrolled = true; }
  contains(target) { return target === this; }
  closest() { return null; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
}
class Button extends Node {}
class Details extends Node {}
class Image extends Node {}

function page(hash = '', tabs = false) {
  const nodes = new Map([['menu', new Details('menu')], ['year', new Node('year')], ['theme-toggle', new Button('theme-toggle')]]);
  const technicalDetails = new Details('technical-reference');
  const privateService = new Node('layer-models');
  privateService.parentElement = technicalDetails;
  nodes.set('technical-reference', technicalDetails);
  nodes.set('layer-models', privateService);
  const buttons = ['discover', 'design'].map((key) => { const node = new Button(); node.dataset.select = key; if (tabs) node.setAttribute('role', 'tab'); return node; });
  const panels = ['discover', 'design'].map((key) => { const node = new Node(key); node.dataset.panel = key; return node; });
  panels.forEach((panel) => nodes.set(panel.id, panel));
  const controls = new Node();
  const explorer = new Node();
  explorer.querySelectorAll = (selector) => selector === '[data-select]' ? buttons : selector === '[data-panel]' ? panels : selector === '.explorer-controls' ? [controls] : [];
  const root = new Node(); root.dataset.theme = 'light';
  const storage = new Map();
  const window = new Node(); window.location = { hash };
  const document = new Node();
  document.documentElement = root;
  document.getElementById = (id) => nodes.get(id) || null;
  document.querySelectorAll = (selector) => selector === '[data-explorer]' ? [explorer] : [];
  document.querySelector = () => null;
  const context = { document, window, Node, Element: Node, HTMLElement: Node, HTMLDetailsElement: Details, HTMLButtonElement: Button, HTMLImageElement: Image,
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    matchMedia: () => ({ matches: false, addEventListener() {} }), Date,
  };
  vm.runInNewContext(compiled.outputFiles[0].text, context);
  return { nodes, buttons, panels, root, storage, context };
}

test('shared UI runs without homepage/contact elements and selects a deep-linked stage', () => {
  const app = page('#design');
  assert.equal(app.panels[0].hidden, true);
  assert.equal(app.panels[1].hidden, false);
  app.buttons[0].emit('click');
  assert.equal(app.panels[0].hidden, false);
  assert.equal(app.buttons[0].attributes['aria-pressed'], 'true');
  assert.equal(app.buttons[1].attributes['aria-pressed'], 'false');
});

test('explorer keyboard controls wrap and move focus with the selected content', () => {
  const app = page();
  app.buttons[0].emit('keydown', { key: 'ArrowLeft' });
  assert.equal(app.panels[1].hidden, false);
  assert.equal(app.buttons[1].focused, true);
  app.buttons[1].emit('keydown', { key: 'Home' });
  assert.equal(app.panels[0].hidden, false);
});

test('theme choice persists and initialization tolerates unavailable storage', () => {
  const app = page();
  app.nodes.get('theme-toggle').emit('click');
  assert.equal(app.root.dataset.theme, 'dark');
  assert.equal(app.storage.get('kapkoti-theme'), 'dark');
  vm.runInNewContext(theme.outputFiles[0].text, { document: app.context.document, localStorage: { getItem() { throw new Error('Blocked'); } }, matchMedia: () => ({ matches: true }) });
  assert.equal(app.root.dataset.theme, 'dark');
});

test('service tabs expose one selected tab and keyboard stop, including deep links', () => {
  const app = page('#design', true);
  assert.equal(app.buttons[0].attributes['aria-selected'], 'false');
  assert.equal(app.buttons[0].attributes.tabindex, '-1');
  assert.equal(app.buttons[1].attributes['aria-selected'], 'true');
  assert.equal(app.buttons[1].attributes.tabindex, '0');
  assert.equal(app.panels[1].hidden, false);
  assert.equal(app.panels[1].scrolled, true);
  app.buttons[1].emit('keydown', { key: 'ArrowDown' });
  assert.equal(app.buttons[0].attributes['aria-selected'], 'true');
  assert.equal(app.buttons[0].attributes.tabindex, '0');
  assert.equal(app.buttons[1].attributes.tabindex, '-1');
  assert.equal(app.buttons[0].focused, true);
  assert.equal(app.panels[0].hidden, false);
  assert.equal(app.panels[1].hidden, true);
  app.buttons[1].emit('click');
  assert.equal(app.panels[1].scrolled, true);
  app.context.window.location.hash = '#architecture';
  app.context.window.emit('hashchange');
  assert.equal(app.buttons[1].attributes['aria-selected'], 'true');
  assert.equal(app.panels[1].hidden, false);
});

test('an engineering link opens its containing optional section', () => {
  const app = page('#layer-models');
  assert.equal(app.nodes.get('technical-reference').open, true);
  assert.equal(app.nodes.get('layer-models').scrolled, true);
  assert.equal(app.nodes.get('menu').open, false);
});

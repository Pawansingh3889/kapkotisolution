import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { build } from 'esbuild';

const compiled = await build({ entryPoints: ['app.ts'], bundle: true, write: false, format: 'iife' });

class Element {
  constructor() {
    this.listeners = new Map();
    this.dataset = {};
    this.value = '';
    this.hidden = false;
    this.disabled = false;
    this.checked = false;
    this.textContent = '';
    this.children = [];
    this.attributes = new Map();
  }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  async emit(name) { await this.listeners.get(name)?.({ preventDefault() {}, target: this }); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  append(...children) { this.children.push(...children); }
  remove() { this.removed = true; }
  focus() { this.focused = true; }
  scrollIntoView() {}
}
class Input extends Element {}
class Textarea extends Element {}
class Select extends Element {}
class Details extends Element {}

function inquiry(fetch) {
  const nodes = new Map();
  const types = { message: Textarea, brief: Textarea, name: Input, contact: Input, consent: Input, 'contact-method': Select, menu: Details };
  const get = (id) => {
    if (!nodes.has(id)) nodes.set(id, new (types[id] || Element)());
    return nodes.get(id);
  };
  const chatButton = new Element();
  const systemButton = new Element();
  const context = {
    document: {
      getElementById: get,
      querySelectorAll: (selector) => selector === '#chat-card button' ? [chatButton] : selector === 'button' ? [chatButton, systemButton] : [],
      createElement: () => new Element(),
    },
    HTMLElement: Element, Element, HTMLInputElement: Input, HTMLTextAreaElement: Textarea,
    HTMLSelectElement: Select, HTMLDetailsElement: Details,
    matchMedia: () => ({ matches: true, addEventListener() {} }),
    window: { addEventListener() {} }, fetch, AbortSignal, crypto: webcrypto, Blob, URL, setTimeout,
  };
  vm.runInNewContext(compiled.outputFiles[0].text, context);
  return { get, chatButton, systemButton };
}
const response = (body, ok = true) => ({ ok, headers: new Headers({ 'content-type': 'application/json' }), json: async () => body });

test('pending inquiry keeps unrelated scene controls enabled and recovers invalid replies', async () => {
  let resolve;
  const app = inquiry(() => new Promise((done) => { resolve = done; }));
  app.get('message').value = 'Stock counts take too long.';
  const pending = app.get('chat-form').emit('submit');
  assert.equal(app.chatButton.disabled, true);
  assert.equal(app.systemButton.disabled, false);
  resolve(response({ reply: '' }));
  await pending;
  assert.equal(app.get('message').value, 'Stock counts take too long.');
  assert.equal(app.chatButton.disabled, false);
  assert.match(app.get('chat-status').textContent, /did not return a reply/);
});

test('manual brief preserves consent/contact and retries with the same reference after failed confirmation', async () => {
  const payloads = [];
  const app = inquiry(async (_url, options) => {
    const payload = JSON.parse(options.body);
    payloads.push(payload);
    return response({ id: payloads.length === 1 ? 'wrong-reference' : payload.id });
  });
  app.get('message').value = 'I need a clearer inventory workflow for my workshop.';
  await app.get('write-brief').emit('click');
  assert.equal(app.get('brief').value, app.get('message').value);
  app.get('name').value = 'Test visitor';
  app.get('contact-method').value = 'email';
  app.get('contact').value = 'visitor@example.com';
  app.get('consent').checked = true;
  await app.get('brief-form').emit('submit');
  assert.match(app.get('chat-status').textContent, /could not confirm/);
  await app.get('brief-form').emit('submit');
  assert.equal(payloads[0].id, payloads[1].id);
  assert.equal(payloads[1].consent, true);
  assert.equal(payloads[1].contact, 'visitor@example.com');
  assert.equal(app.get('brief-form').hidden, true);
  assert.equal(app.get('success').hidden, false);
  assert.equal(app.get('success').focused, true);
});

test('non-object responses cannot become successful chat messages', async () => {
  const app = inquiry(async () => response(['unexpected']));
  app.get('message').value = 'Help me understand my orders.';
  await app.get('chat-form').emit('submit');
  assert.match(app.get('chat-status').textContent, /invalid response/);
  assert.equal(app.get('message').value, 'Help me understand my orders.');
});

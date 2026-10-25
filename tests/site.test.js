import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { pages, renderPages, renderSitemap } from '../scripts/render-site.mjs';

const bundles = Object.fromEntries(['app', 'ui', 'theme', 'studio'].map((name) => [name, `/assets/${name}-test.js`]));
const rendered = await renderPages(bundles);
const byRoute = new Map(rendered.map((page, index) => [pages[index].path, page.html]));
const ids = (html) => [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);

test('every generated route has unique document metadata, valid structured data and no duplicate IDs', () => {
  assert.equal(new Set(pages.map((page) => page.path)).size, pages.length);
  assert.equal(new Set(pages.map((page) => page.title)).size, pages.length);
  for (const [path, html] of byRoute) {
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, path);
    assert.equal(new Set(ids(html)).size, ids(html).length, `Duplicate IDs: ${path}`);
    assert.ok(html.includes(`rel="canonical" href="https://kapkotisolution.com${path}"`), path);
    assert.doesNotMatch(html, /\{\{\w+\}\}/, path);
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.ok(data['@graph'].some((node) => node['@type'] === 'WebPage' && node.url === `https://kapkotisolution.com${path}`), path);
    assert.equal(html.includes(bundles.app), path === '/contact/', `Contact bundle scope: ${path}`);
    assert.equal(html.includes(bundles.studio), path === '/technology/', `3D bundle scope: ${path}`);
  }
});

test('all local links, fragments and media point to generated pages or packaged source assets', async () => {
  for (const [path, html] of byRoute) {
    for (const [, href] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const target = new URL(href, `https://kapkotisolution.com${path}`);
      if (target.origin !== 'https://kapkotisolution.com') continue;
      if (target.pathname.startsWith('/assets/')) {
        assert.ok(Object.values(bundles).includes(target.pathname), `${path}: ${href}`);
        continue;
      }
      const destination = byRoute.get(target.pathname);
      if (destination) {
        if (target.hash) assert.ok(ids(destination).includes(target.hash.slice(1)), `${path}: missing ${href}`);
      } else {
        await access(target.pathname.slice(1));
      }
    }
  }
});

test('sitemap contains exactly the indexable routes and the 404 page is excluded from indexing', async () => {
  const expected = pages.filter((page) => !page.noindex).map((page) => `https://kapkotisolution.com${page.path}`).sort();
  assert.deepEqual([...renderSitemap().matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).sort(), expected);
  assert.equal(await readFile('sitemap.xml', 'utf8'), renderSitemap());
  assert.ok(byRoute.get('/404.html').includes('content="noindex, follow"'));
});

test('technical content is complete and confined to the Services page', () => {
  const technical = byRoute.get('/technology/');
  const controls = [...technical.matchAll(/data-select="([^"]+)" aria-controls="([^"]+)"/g)];
  assert.equal(controls.length, 16);
  for (const [, key, id] of controls) {
    assert.ok(technical.includes(`id="${id}" data-panel="${key}"`), id);
    assert.ok(!technical.includes(`id="${id}" data-panel="${key}" hidden`), `Hidden without JavaScript: ${id}`);
  }
  assert.equal([...technical.matchAll(/class="service-detail"/g)].length, 9);
  assert.equal([...technical.matchAll(/class="technical-project"/g)].length, 3);
  for (const [path, html] of byRoute) {
    if (path === '/technology/') continue;
    assert.doesNotMatch(html, /data-explorer|class="service-detail"|class="technical-project"|id="scene"/, path);
  }
});

test('page rendering refuses incomplete browser bundles', async () => {
  await assert.rejects(renderPages({ ...bundles, app: undefined }), /Missing browser entry: app/);
});

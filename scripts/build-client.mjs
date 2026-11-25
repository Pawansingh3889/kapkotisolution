import { build } from 'esbuild';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { renderPages, renderSitemap } from './render-site.mjs';

await rm('assets', { recursive: true, force: true });
const result = await build({
  entryPoints: ['app.ts', 'ui.ts', 'studio.ts', 'theme.ts'], bundle: true, minify: true, format: 'esm',
  splitting: true, target: 'es2022', outdir: 'assets', logLevel: 'info',
  entryNames: '[name]-[hash]', metafile: true,
});
const bundles = {};
for (const entry of ['app', 'ui', 'studio', 'theme']) {
  const output = Object.entries(result.metafile.outputs).find(([, info]) => info.entryPoint === `${entry}.ts`);
  if (!output) throw new Error(`Missing client bundle: ${entry}`);
  bundles[entry] = `/${output[0]}`;
}
for (const page of await renderPages(bundles)) {
  const target = `assets/site/${page.path}`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, page.html);
}
await writeFile('assets/site/sitemap.xml', renderSitemap());

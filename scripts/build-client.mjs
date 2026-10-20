import { build } from 'esbuild';
import { readFile, rm, writeFile } from 'node:fs/promises';

await rm('assets', { recursive: true, force: true });
const result = await build({
  entryPoints: ['app.ts', 'ui.ts'], bundle: true, minify: true, format: 'esm',
  splitting: true, target: 'es2022', outdir: 'assets', logLevel: 'info',
  entryNames: '[name]-[hash]', metafile: true,
});
let html = await readFile('index.html', 'utf8');
for (const entry of ['app', 'ui']) {
  const output = Object.entries(result.metafile.outputs).find(([, info]) => info.entryPoint === `${entry}.ts`);
  if (!output) throw new Error(`Missing client bundle: ${entry}`);
  html = html.replace(`/assets/${entry}.js`, `/${output[0]}`);
}
await writeFile('assets/index.html', html);

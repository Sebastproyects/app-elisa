// Empaqueta la app en la carpeta "public" (la que se publica en Firebase Hosting).
// Con --test usa el backend de prueba (sin Firebase) y escribe en "public-test".
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const test = process.argv.includes('--test');
const out = test ? 'public-test' : 'public';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

await build({
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: !test,
  format: 'iife',
  target: ['es2020', 'safari15', 'chrome100'],
  outfile: `${out}/app.js`,
  alias: { backend: resolve(`src/backend-${test ? 'mock' : 'firebase'}.js`) },
  logLevel: 'info',
});
for (const f of readdirSync('src')) {
  if (/\.(html|css|png|webmanifest)$/.test(f) || f === 'sw.js') cpSync(`src/${f}`, `${out}/${f}`);
}

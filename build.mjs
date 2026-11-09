// Empaqueta la app en la carpeta "public" (la que se publica en Firebase Hosting).
// Con --test usa el backend de prueba (sin Firebase) y escribe en "public-test".
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const test = process.argv.includes('--test');
// Etiqueta de versión (hora de Lima): se muestra en Más y hace que cada publicación cambie sw.js.
const BUILD = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
const out = test ? 'public-test' : 'public';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// Ofusca solo el código propio de la app (no las librerías de Firebase): cambia los nombres por
// códigos, esconde los textos y desordena la lógica. No es imposible de leer, pero sí muy incómodo.
const obfuscate = {
  name: 'ofuscar',
  setup(b) {
    b.onLoad({ filter: /[\\/]src[\\/][^\\/]+\.js$/ }, (args) => {
      const code = readFileSync(args.path, 'utf8');
      if (/backend-mock|firebase-config/.test(args.path)) return { contents: code, loader: 'js' };
      const out = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        stringArray: true,
        stringArrayThreshold: 0.85,
        stringArrayEncoding: ['base64'],
        stringArrayRotate: true,
        stringArrayShuffle: true,
        splitStrings: true,
        splitStringsChunkLength: 8,
        numbersToExpressions: true,
        simplify: true,
        transformObjectKeys: false, // no tocar los nombres de campos que se guardan en Firestore
        unicodeEscapeSequence: false,
      }).getObfuscatedCode();
      return { contents: out, loader: 'js' };
    });
  },
};

await build({
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: !test,
  format: 'iife',
  target: ['es2020', 'safari15', 'chrome100'],
  outfile: `${out}/app.js`,
  define: { __BUILD__: JSON.stringify(BUILD) },
  alias: { backend: resolve(`src/backend-${test ? 'mock' : 'firebase'}.js`) },
  plugins: test ? [obfuscate] : [obfuscate],
  logLevel: 'info',
});
for (const f of readdirSync('src')) {
  if (/\.(html|css|png|mp3|webmanifest)$/.test(f)) cpSync(`src/${f}`, `${out}/${f}`);
  if (f === 'sw.js') writeFileSync(`${out}/${f}`, readFileSync(`src/${f}`, 'utf8').replace('__BUILD__', BUILD));
}

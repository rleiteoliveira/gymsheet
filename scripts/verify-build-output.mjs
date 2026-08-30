import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('.');
const clientDirectory = resolve(root, 'dist', 'client');
const serverDirectory = resolve(root, 'dist', 'server');

function getLocalBuildId() {
  try {
    return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

const expectedBuildId = (process.env.EXPECTED_BUILD_ID || process.env.GITHUB_SHA || getLocalBuildId())?.trim();
if (!expectedBuildId) throw new Error('Não consegui determinar o buildId esperado.');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function requireFile(path) {
  await access(path);
}

const meta = await readJson(resolve(clientDirectory, 'build-meta.json'));
if (meta.buildId !== expectedBuildId) {
  throw new Error(`build-meta.json esperava ${expectedBuildId}, mas encontrou ${meta.buildId ?? 'ausente'}.`);
}

const serviceWorker = await readFile(resolve(clientDirectory, 'sw.js'), 'utf8');
for (const marker of ['gymsheet-shell-${BUILD_ID}', 'networkFirst', "url.pathname === '/sw.js'"]) {
  if (!serviceWorker.includes(marker)) throw new Error(`Contrato ausente no Service Worker: ${marker}`);
}
if (serviceWorker.includes('gymsheet-shell-v1')) throw new Error('O Service Worker ainda usa cache fixo v1.');

const wranglerConfig = await readJson(resolve(serverDirectory, 'wrangler.json'));
if (wranglerConfig.main !== 'index.js') throw new Error('wrangler.json não aponta para index.js.');
if (wranglerConfig.assets?.directory !== '../client') throw new Error('wrangler.json não aponta para ../client.');

await requireFile(resolve(serverDirectory, 'index.js'));
await requireFile(resolve(clientDirectory, 'manifest.webmanifest'));

console.log(`Artefato válido para ${expectedBuildId}: Worker, assets, build-meta e Service Worker.`);

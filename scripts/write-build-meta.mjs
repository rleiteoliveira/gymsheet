import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const environmentIds = [
  process.env.GITHUB_SHA,
  process.env.CF_COMMIT_SHA,
  process.env.CF_PAGES_COMMIT_SHA,
  process.env.VERCEL_GIT_COMMIT_SHA,
];

function usable(value) {
  return (
    typeof value === 'string' && /^[a-zA-Z0-9._-]{1,80}$/.test(value.trim())
  );
}

let buildId = environmentIds.find(usable)?.trim();

if (!buildId) {
  try {
    buildId = execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    buildId = undefined;
  }
}

if (!usable(buildId)) buildId = `build-${Date.now().toString(36)}`;

await mkdir(resolve('public'), { recursive: true });
await writeFile(
  resolve('public/build-meta.json'),
  `${JSON.stringify({ buildId, builtAt: new Date().toISOString() }, null, 2)}\n`,
  'utf8',
);

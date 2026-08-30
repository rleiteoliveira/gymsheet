const expectedBuildId = process.env.EXPECTED_BUILD_ID?.trim();
const productionUrl = process.env.PRODUCTION_URL?.trim() || 'https://gymsheet.rleiteoliveira.workers.dev';

if (!expectedBuildId) throw new Error('EXPECTED_BUILD_ID é obrigatório.');
if (!/^[a-zA-Z0-9._-]{1,80}$/.test(expectedBuildId)) throw new Error('EXPECTED_BUILD_ID tem formato inválido.');

const baseUrl = productionUrl.endsWith('/') ? productionUrl : `${productionUrl}/`;
const attempts = 10;
let lastSeen = 'indisponível';

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const url = new URL('build-meta.json', baseUrl);
  url.searchParams.set('verify', `${expectedBuildId}-${attempt}`);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    lastSeen = typeof payload?.buildId === 'string' ? payload.buildId : 'ausente';
    if (lastSeen === expectedBuildId) {
      console.log(`Produção confirmada em ${url.origin}: ${expectedBuildId}.`);
      process.exit(0);
    }
  } catch (error) {
    lastSeen = error instanceof Error ? error.message : String(error);
  }

  if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 5_000));
}

throw new Error(`Produção não refletiu ${expectedBuildId} após ${attempts} tentativas; último resultado: ${lastSeen}.`);

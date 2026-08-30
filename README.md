# GymSheet

PWA mobile-first para planejar fichas e registrar o treino que realmente aconteceu. Funciona sem login e mantém os dados no próprio dispositivo.

Produção: [gymsheet.rleiteoliveira.workers.dev](https://gymsheet.rleiteoliveira.workers.dev)

## Funcionalidades

- fichas planejadas e sessões realizadas;
- treino do dia fixado no topo;
- exercícios concluídos, pulados, trocados ou adicionados;
- resumo semanal dos desvios do plano;
- calendário civil local e correção de dias passados;
- exportação CSV por série e backup completo em JSON;
- catálogo de exercícios com fallback offline.

## Desenvolvimento

Requer Node.js 22.13 ou superior.

```bash
npm install
npm run dev
```

Validação local:

```bash
npm test
npm run lint
npm run build
```

## Fluxo de entrega

Branches curtas (`feat/*`, `fix/*`) entram por PR em `main`. O CI executa lint, TypeScript, testes, build e E2E; o dono não testa; o CI clica no caminho feliz.
Em push para `main`, depois do CI verde, o workflow publica o artefato testado em Cloudflare Workers e confere `build-meta.json` em produção. Configure `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` nos secrets do repositório; nunca grave tokens no código.

Agentes (Codex, Grok, Antigravity): leia [AGENTS.md](AGENTS.md). Planos de fatia ficam em [docs/slices/](docs/slices/README.md).

O catálogo e as imagens de exercícios são carregados do projeto [free-exercise-db](https://github.com/yuhonas/free-exercise-db). Consulte o repositório de origem para os respectivos termos e créditos.

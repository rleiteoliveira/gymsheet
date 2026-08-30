# Agentes no GymSheet

Vale para Codex, Grok, Claude, Antigravity e qualquer outro.

Leia nesta ordem:

1. Este arquivo
2. [docs/slices/README.md](docs/slices/README.md)
3. Issues abertas (intenção). Slice `ready` (execução).
4. [issue #8](https://github.com/rleiteoliveira/gymsheet/issues/8) se a tarefa for CI/deploy
5. [issue #1](https://github.com/rleiteoliveira/gymsheet/issues/1) só como mapa — não implementar a #1

## Papéis

- **Dono:** manda “quero X” quando der vontade. Merge se o CI estiver verde. **Não testa.**
- **Planejador:** só grava `docs/slices/NN-slug.md` em `draft` (ou o dono/Grok grava `ready`).
- **Executor:** um PR que segue um slice `ready`. Roda unit + e2e. Não pede QA humano.

Prompts: [docs/prompts/planejador.md](docs/prompts/planejador.md), [docs/prompts/executor.md](docs/prompts/executor.md).

## Invariantes

- Um desenvolvedor. Sem `develop`, sem gitflow, sem D1/auth.
- Dados: IndexedDB + backup JSON versionado + CSV como projeção.
- Fluxo de hoje não muta sessão de outro dia. Calendário é a porta de correção.
- Dia = data civil **local**.
- `components/ui/*` não se refatora por estética.
- Produção: `https://gymsheet.rleiteoliveira.workers.dev`
- Aceite de produto = CI verde. Não existe “smoke no Android do dono”.

## Ordem de produto viva

1. Slice em execução: [24-deploy-continuo](docs/slices/24-deploy-continuo.md) (#8)
2. Atrito que o dono mandar em uma frase
3. Débito [13-debito-historico](docs/slices/13-debito-historico.md) só se ele pedir
4. #6 por último
5. #1 só como mapa; deploy automático não é QA

Se não existe slice `ready`, não implemente feature.

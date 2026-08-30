# Agentes no GymSheet

Vale para Codex, Grok, Claude, Antigravity e qualquer outro.

Leia nesta ordem:

1. Este arquivo
2. [docs/slices/README.md](docs/slices/README.md)
3. Issues abertas (intenção). Slice `ready` (execução).
4. [issue #8](https://github.com/rleiteoliveira/gymsheet/issues/8) se a tarefa for CI/deploy
5. [issue #1](https://github.com/rleiteoliveira/gymsheet/issues/1) só como mapa — não implementar a #1

## Papéis

- **Planejador:** só grava `docs/slices/NN-slug.md` em `draft`. Não escreve app.
- **Dono:** muda o slice para `ready` (no máximo 5 itens no Faz).
- **Executor:** um PR que segue um slice `ready`. Não reescreve o plano.

Prompts prontos: [docs/prompts/planejador.md](docs/prompts/planejador.md) e [docs/prompts/executor.md](docs/prompts/executor.md).

## Invariantes

- Um desenvolvedor. Sem `develop`, sem gitflow, sem D1/auth.
- Dados: IndexedDB + backup JSON versionado + CSV como projeção.
- Fluxo de hoje não muta sessão de outro dia. Calendário é a porta de correção.
- Dia = data civil **local**.
- `components/ui/*` não se refatora por estética.
- Produção: `https://gymsheet.rleiteoliveira.workers.dev` — repo público `rleiteoliveira/gymsheet`.

## Ordem de produto viva

1. Dogfood no Worker / Android
2. Atrito que doeu no treino
3. Débito consciente em [docs/slices/13-debito-historico.md](docs/slices/13-debito-historico.md) **só se o dogfood pedir**
4. #6 programas por último

Se não existe slice `ready`, não implemente feature. Capture issue de 4 linhas.

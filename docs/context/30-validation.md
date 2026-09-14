# Evidência de validação

- `context_level`: `EVIDENCE`
- `observed_at`: 2026-09-14, America/Fortaleza
- `scope`: slice 43, recorte A — registro confiável; revisão documental e evidência anterior da entrega Neon preservadas abaixo
- `release_status`: PR [#63](https://github.com/rleiteoliveira/gymsheet/pull/63) mesclado em `main` (`cabafbd`), CI remoto verde e deploy publicado

## Execução do slice 45 — neon contido na inicial — 2026-09-14

Escopo: os quatro itens de **Faz** do [slice 45](../slices/45-neon-contido.md). Só folha de estilo e teste; `app/page.tsx` e `lib/` não foram tocados.

| Comando | Resultado |
|---|---|
| `npm test` | 11 arquivos, 50 testes, verde |
| `npm run lint` | sem erros |
| `npx tsc --noEmit` | sem erros |
| `npm run build` | artefato gerado |
| `npm run verify:build` | `Artefato válido para 474a0fb0cbb6` |
| `npm run test:e2e` | 26 testes em chromium, verde (25 anteriores + 1 novo) |

O teste novo computa, na inicial em 1280×844: `background-image` do `.essential-main` é `none`, o `.essential-home` tem `radial-gradient` com a largura da janela, o `background-color` do shell continua `rgb(17, 18, 15)` e o `box-shadow` do CTA contém `0px 6px 18px`. Depois entra na sessão e confirma que o cartão do palco mantém `0px 0px 40px` e o seu próprio `radial-gradient`.

Limites desta execução:

- Aprovação estética é do dono, sobre a captura `output/playwright/essencial-retomada.png`. O teste prova onde a tinta está e que o halo encolheu, não que ficou bonito.
- As asserções de cor são específicas da pele Neon em 1280×844. Studio e Pulse continuam cobertas apenas pelo teste de persistência de pele.
- Nenhuma medição de estabilidade de layout: isso é o slice 44, ainda em `draft`.

## Execução do slice 43, recorte A — 2026-09-14

Escopo: os cinco itens de **Faz** do [slice 43](../slices/43-plano-treino-solo.md). Nada de B–E, nenhuma mudança de `schemaVersion` e nenhum arquivo da lista "não toca".

Suíte local completa, nesta ordem:

| Comando | Resultado |
|---|---|
| `npm test` | 11 arquivos, 50 testes, verde |
| `npm run lint` | sem erros |
| `npx tsc --noEmit` | sem erros |
| `npm run build` | artefato gerado |
| `npm run verify:build` | `Artefato válido para 90f0588bc9b6` |
| `npm run test:e2e` | 25 testes em chromium, verde (18 anteriores + 7 novos) |

Cobertura nova por critério de aceite do slice:

| ID | Onde | Como |
|---|---|---|
| A1 | `e2e/happy-path.spec.ts` | Leitura do store `app` bloqueada no navegador: tela de erro, nenhuma escrita, nova tentativa recupera os registros originais. |
| A2 | `e2e/happy-path.spec.ts` | Catálogo retido até depois do treino: iniciar e marcar funcionam; o acervo local não é invalidado. |
| A3 | `e2e/happy-path.spec.ts` | Com escrita bloqueada, a faixa de estado não exibe "Série salva" e nenhuma série é persistida. |
| A4 | `e2e/happy-path.spec.ts` + `lib/persistence.test.ts` | Falha, retry que falha de novo e retry bem-sucedido produzem uma única série; a idempotência por ID/horário é verificada no domínio. |
| A5 | `e2e/happy-path.spec.ts` | Finalizar com escrita bloqueada mantém o treino aberto e visível; o retry encerra uma vez e só então volta à inicial. |
| A6 | `e2e/happy-path.spec.ts` | Duas abas no mesmo IndexedDB marcam alternadamente; após recarga há três séries com índices 1–3 e IDs distintos. |
| A7 | `e2e/happy-path.spec.ts` | Aba sem `BroadcastChannel` tenta marcar depois que a outra finalizou: recusa explícita, registro concluído intacto. |
| A8 | `lib/storage.test.ts` | Sem IndexedDB, leitura e escrita rejeitam com `PersistenceUnavailableError` e a operação de domínio nem chega a rodar. |
| A9 | `lib/storage.test.ts` + E2E existente | Roundtrip JSON preserva sessão, exercícios, séries, IDs e horários; a recarga já era coberta pelo caminho terminal. |
| A10 | `e2e/happy-path.spec.ts` | Correção deliberada pelo Calendário grava em registro encerrado sem alterar `completedAt`, `startedAt` nem a série anterior. |

Limites desta execução:

- A tabela acima é evidência local. A confirmação remota está logo abaixo, em "Entrega remota".
- O E2E prova que uma falha seguida de retry deixa uma única série, mas não observa o ID da intenção pendente (ela não é persistida antes do commit). A preservação de ID e horário no retry é provada em `lib/persistence.test.ts`, não no navegador.
- A concorrência foi exercitada com duas abas no mesmo contexto do Playwright; não houve teste com processos ou aparelhos distintos.
- Falhas de IndexedDB foram injetadas sobre o store `app` interceptando `IDBObjectStore.prototype`. Isso reproduz rejeição de leitura/escrita, não todos os modos de falha do navegador (cota, corrupção, bloqueio de versão).
- Nenhuma medição de estabilidade de layout, acessibilidade ou tempo foi feita: essas matrizes pertencem aos recortes B–D.
- Capturas de tela não foram anexadas a esta execução além das já produzidas pela suíte existente.

### Entrega remota — 2026-09-14

- PR [#63](https://github.com/rleiteoliveira/gymsheet/pull/63) mesclado em `main` por `rleiteoliveira` às 21:50 UTC; merge commit `cabafbd0d26e70481c15d9ad120211e08ce2336f`.
- CI remoto verde no head do PR (job `ci`, 1m47s) e na run de `main` após o merge: [34900997172](https://github.com/rleiteoliveira/gymsheet/actions/runs/34900997172), jobs `ci` e `deploy` com sucesso.
- Artefato publicado confirmado: `https://gymsheet.rleiteoliveira.workers.dev/build-meta.json` devolve `buildId` `cabafbd0d26e70481c15d9ad120211e08ce2336f`, `builtAt` 2026-09-14T21:51:00Z.
- Issue #62 fechada após o merge; a branch `slice-43-registro-confiavel` foi removida local e remotamente.
- Limite: a verificação da publicação é a identidade do build servido. Nenhum percurso de usuário foi executado contra produção.

## Revisão documental — 2026-09-14

- Plano e critérios em [slice 43](../slices/43-plano-treino-solo.md). Nenhum recorte foi promovido a `ready`.
- Branch `main`; `HEAD`, `origin/main` e ref remoto consultado por `git ls-remote` em `90f0588bc9b6e7c7a42283bd39d0b5f8eed447cd`.
- Inspeção atual de contratos, código de sessão/storage/tempo, configuração E2E e issues #43/#7; não houve nova execução de testes da aplicação nem consulta a CI/deploy/produção.
- Validação deste pedido limitada à integridade da documentação, referências locais, escopo de cinco itens no Faz e diff. As matrizes descritas no plano são critérios futuros, não resultados aprovados.
- Verificação documental: status `draft`, cinco itens no Faz, links locais dos quatro documentos válidos e `git diff --check` sem erros de whitespace. A revisão de coerência explicitou a preservação da correção pelo Calendário e a retomada pelo último agrupamento persistido.

## Evidência anterior — slice 41 (histórico)

Os resultados abaixo foram registrados na entrega anterior; não comprovam a implementação do plano de treino solo nem foram reexecutados nesta revisão.

## Última execução local registrada

| Comando | Resultado observado |
|---|---|
| `npm test` | 10 arquivos e 34 testes aprovados |
| `npm run lint` | aprovado, sem erros |
| `npx tsc --noEmit` | aprovado, sem erros |
| `npm run build` | aprovado |
| `npm run verify:build` | aprovado, artefatos íntegros |
| `npm run test:e2e` | 18 testes aprovados em 38.3 s |

## CI, deploy e aplicação

- PR [#60](https://github.com/rleiteoliveira/gymsheet/pull/60) foi integrado por squash no commit `a3886535be5789b1407610063c0c1ac425e048e6`.
- Run [`34869315436`](https://github.com/rleiteoliveira/gymsheet/actions/runs/34869315436): `ci` verde e `deploy` verde; o deploy usou o artefato testado.
- `build-meta.json` público retornou HTTP 200 e `buildId` `a3886535be5789b1407610063c0c1ac425e048e6`.
- Inspeção visual em Chrome, viewport 390×844: `data-skin=calor`, rótulo Neon, `--essential-heat=#b8f34a`, botão `rgb(184, 243, 74)` com texto escuro; menu e sessão renderizados sem overflow aparente.

## Limites

- Deploy remoto acionado no push para `main`.
- O CI registrou somente o aviso de depreciação do Node.js 20 em actions de terceiros; nenhum job falhou.

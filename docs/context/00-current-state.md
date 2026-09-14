# Estado atual — GymSheet

- `context_level`: `NOW`
- `observed_at`: 2026-09-14, America/Fortaleza
- Revalidar no início de cada tarefa; fatos vivos prevalecem sobre este snapshot.

## Checkout e entrega observados

- Branch `main`, `HEAD` e `origin/main` em `cabafbd0d26e70481c15d9ad120211e08ce2336f` (merge do PR #63, recorte A do slice 43). CI e deploy verdes na run 34900997172; `build-meta.json` publicado devolve o mesmo SHA.
- `a3886535be5789b1407610063c0c1ac425e048e6` é a implementação do acento Neon anterior ao commit documental atual. Evidência de CI/deploy dessa entrega está registrada em `30-validation.md`; não foi reconsultada nesta revisão.
- Limpeza de componentes e dependências órfãs executada sob pedido do dono (remoção de `components/ui/*`, `hooks/use-mobile.ts`, `lib/utils.ts`, `components.json` e 12 dependências não utilizadas).

## Produto no checkout

- Livre e ficha: Marcar série sem kg/reps. Sem rótulo de peso corporal.
- Toque na linha edita kg/reps e atualiza a mesma série.
- Alvo da ficha é dica.
- Acento padrão Neon `#b8f34a`; Studio e Pulse continuam disponíveis em Aparência. O identificador local `calor` foi preservado.
- O fluxo ainda troca Começar por Retomar quando existe sessão aberta hoje; lista de séries cresce acima do botão e o exercício ativo é reordenado para o topo. A repaginação visual continua fora do checkout.
- Persistência revisada no recorte A do slice 43: toda escrita passa por uma transação IndexedDB que lê o último estado confirmado antes de aplicar a operação; confirmação, navegação e toast só acontecem depois do commit. Falha guarda a mesma operação para nova tentativa idempotente. Ausência de IndexedDB é erro explícito, nunca sucesso.
- Leitura dos dados locais e carga do catálogo são independentes; leitura que falha mostra erro com nova tentativa e bloqueia escrita, em vez de parecer primeiro uso.
- Captura corrente vinda de aba obsoleta sobre sessão já encerrada é recusada; correção deliberada pelo Calendário continua funcionando.

## Planejamento e execução selecionados

- [Slice 43 — plano de treino solo](../slices/43-plano-treino-solo.md), em `doing`. O dono pediu a implementação em 2026-09-14; só a seção **Faz** (recorte A — registro confiável) foi executada.
- Recortes B–E (palco estável, novo ciclo/tempo, histórico/desligamento, redução do legado) continuam sem slice próprio e sem implementação.
- Issue [#62](https://github.com/rleiteoliveira/gymsheet/issues/62) e PR [#63](https://github.com/rleiteoliveira/gymsheet/pull/63) entregaram o recorte A: mesclados em 2026-09-14 com CI verde e deploy concluído. O slice 43 está `done`.
- [Slice 44 — palco estável](../slices/44-palco-estavel.md) gravado em `draft` a partir do atrito relatado pelo dono em 2026-09-14: a posição de Marcar série depende do número de séries e do exercício selecionado. É o recorte B do slice 43; nenhum slice foi promovido a `ready` e nada foi implementado.
- [Slice 45 — neon contido](../slices/45-neon-contido.md), em `doing`: o wash da inicial saiu do `.essential-main` de 560px e passou para o shell de largura total, e o halo do CTA da inicial encolheu. O cartão do palco, os tokens das peles e o seletor de aparência não mudaram.
- Os contratos de início, fechamento de sessão de outro dia e evolução temporal/backup permanecem inalterados; `schemaVersion` continua 2.

## Limites

- Schema 2. `reps: 0` e `kg: null` significam não informado.

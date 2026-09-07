# Slice 30 — Fluxo principal direto

- Issue: [#43](https://github.com/rleiteoliveira/gymsheet/issues/43)
- Status: doing
- Cabe no próximo treino? sim — reduz ambiguidade entre começar, retomar, registrar e concluir sem mudar dados.

Objetivo: deixar a sequência **Treino → Começar/Continuar → Salvar série → Finalizar** óbvia em uma olhada. O vazio da inicial é intencional; esta fatia não cria dashboard nem ocupa o espaço com métricas.

Evidência de origem: auditoria de produção em 07/09/2026, viewport 390 × 844. As decisões observadas estão descritas neste slice; capturas de auditoria não entram no produto.

## Faz

- [ ] Corrigir a decisão de sessão aberta: usar data civil explícita em vez de “ontem” (`Continuar treino de DD/MM` e `Encerrar e começar hoje`), manter uma única saída `Agora não` e dar a `Continuar` a primeira posição visual.
- [ ] Reordenar a sessão para destacar o exercício ativo e a série atual antes do nome/data da sessão; séries salvas permanecem compactas e os outros exercícios continuam selecionáveis sem abrir cartões decorativos.
- [ ] Formar um único bloco operacional com `kg`, `reps` e **Salvar série**; conservar preenchimento e validação existentes. Renomear toda ação curta `Adicionar` dessa superfície para **Adicionar exercício**.
- [ ] Consolidar os tokens essenciais já repetidos em `globals.css`: carvão `#11120f`, superfície `#191a16`, marfim `#f2f0e8`, muted `#a4a49a`, linha `#30312c`; serifada apenas em marca, e sans-serif em títulos e operações. Preservar alvos de toque de pelo menos 48 px e foco visível.
- [ ] Estender o E2E para provar o percurso em 390 × 844: começar, resolver sessão antiga com data explícita, escolher exercício, salvar duas séries, trocar de exercício, adicionar exercício, sair/recarregar/retomar o mesmo ID e finalizar.

## Não faz

- Preencher a inicial com métricas, cards, relógio, barra de progresso, slogan ou resumo semanal
- Mudar regras de sessão, status `done` / `skipped` / `swapped` / `added`, conclusão, calendário ou edição retroativa
- Renovar imagens ou reordenar/traduzir o catálogo; isso fica no slice 31
- #1, #6, #7, schema, IndexedDB, backup, CSV, `components/ui`, CI ou deploy
- Pedir QA ao dono

## Ordem e composição

1. **Inicial:** data → ficha selecionada → Começar/Continuar.
2. **Sessão:** contexto discreto da sessão → exercício ativo → séries salvas → kg/reps → Salvar série.
3. **Ações do exercício:** Pular/Trocar quando aplicáveis → Adicionar exercício; todas secundárias e textuais.
4. **Fechamento:** Finalizar depois da lista; Descartar continua discreto e conserva a confirmação atual.

Não introduzir navegação inferior, FAB, carrossel, gesto oculto ou ícone sem nome acessível.

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `e2e/happy-path.spec.ts`, este slice, `docs/slices/README.md`
- não toca: `lib/`, `components/ui/`, `public/`, `package.json`, `package-lock.json`, `.github/`, configuração de build/deploy

## Contrato de dados

- `schemaVersion` permanece 2; IndexedDB, stores e backup não mudam.
- IDs, `startedAt`, `endedAt`, `dateKey`, `sourcePlanId`, snapshots e séries não mudam.
- Dia continua sendo data civil local. Texto de sessão antiga deriva de `dateKey`/`startedAt` existente, sem gravar novo campo.
- `todayPin`, `decideSessionStart`, regras de finalizar e CSV permanecem iguais.

## Testes

- `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build`, `npm run test:e2e`
- E2E não deve localizar `Retomar ontem`, `Encerrar ontem` nem botão curto `Adicionar` dentro da sessão.
- E2E deve provar foco acessível no diálogo, retorno à inicial e persistência de ID/valores após recarga.
- Sem comparação visual como aceite e sem “smoke manual”.

## Débito

- Imagens, nomes/aliases em português e ordenação por recentes/favoritos ficam no slice 31.
- A consolidação remove somente duplicação dos tokens essenciais que já estão em uso; estilos legados sem consumidor só saem em manutenção posterior comprovada.

# Slice 35 — Treinar com leveza

- Issue / origem: pedido do dono em 2026-09-10; refinamento de #43
- Status: done
- Cabe no próximo treino? sim — escolher o treino sem entrar na gestão de fichas e registrar séries com menos conteúdo concorrente.

## Direção

Inicial: data discreta → nome do treino → Começar/Retomar. Tocar no nome abre Treino livre e fichas existentes, com Gerenciar fichas como saída secundária. Sessão: exercício ativo → Série N → kg/reps → Salvar série. Os demais exercícios ficam compactos. A diversão vem da resposta ao toque e ao registro.

Base verificada: main 5fd96d4, PR #46 mergeado, CI e deploy verdes, produção com o mesmo buildId. O slice 34 já trouxe animações de partida; esta fatia muda a composição e o feedback durante o treino.

## Faz

- [x] Trocar a ida da inicial à gestão de fichas por seletor acessível com Treino livre, fichas existentes e Gerenciar fichas; reutilizar seleção/fixação atual, sem criar sessão até Começar. Retomar mantém a sessão existente.
- [x] Expandir apenas o exercício ativo: nome, próxima série, kg/reps e Salvar série primeiro; séries registradas abaixo. Outros exercícios mostram nome e quantidade de séries, expandindo ao toque. Não avançar automaticamente nem mudar a ordem persistida.
- [x] Recolher Pular, Trocar e Desfazer sob Ações do exercício, mantendo condições atuais. Adicionar exercício aparece uma única vez após a lista; Finalizar continua acessível como saída secundária. Descartar fica em ações da sessão, com confirmação preservada. No vazio, Adicionar exercício é a principal.
- [x] Refinar espaçamento e hierarquia mobile; dar feedback textual e visual breve ao salvar série e transição ao trocar exercício. CSS e estado efêmero, 120–220 ms, sem espera para operar, sem bloquear o próximo registro e com prefers-reduced-motion. Só confirmar registros aceitos; preservar foco e alvos de 48 px.
- [x] Cobrir seleção, retomada, duas séries, troca, ações recolhidas, conclusão e recarga por E2E, verificando IDs/valores, mobile 390×844, teclado e movimento reduzido. Entregar por PR → CI verde → merge → deploy, já autorizado pelo pedido, verificando buildId em produção.

## Não faz

- Dashboard, pontos, confete, som, contagem regressiva, pré-início ou navegação persistente.
- Excluir funcionalidades/dados: retirar da primeira camada permite avaliar o que faz falta depois.
- Reformular calendário, histórico, editor de fichas, backup ou catálogo/imagens (#44).
- D1, auth, dependências novas, refatoração estética de components/ui ou mudanças na esteira.
- Pedir QA ao dono; uso real posterior informa outra fatia, sem substituir CI.

## Arquivos

- pode: app/page.tsx, app/globals.css, e2e/happy-path.spec.ts, este slice, docs/slices/README.md, docs/design/README.md e docs/context/ (estado, contrato visual e evidências).
- não toca: lib/, components/ui/, public/, package.json, package-lock.json, .github/ e configurações de deploy.

## Contrato de dados

- schemaVersion permanece 2; IndexedDB, backup JSON e CSV iguais.
- Preservar IDs, snapshots, séries, dateKey, timestamps e regras de todayPin/decideSessionStart.
- Hoje não altera sessão de outro dia; calendário continua como porta de correção.
- Expansão, menus e animações não criam persistência adicional.
- Fixtures não representam uso real nem entram nos dados do dono.

## Testes

- npm test; npm run lint; npx tsc --noEmit; npm run build; npm run verify:build; npm run test:e2e.
- Recolher seção não pode perder campos digitados ou séries; verificar estado persistido, não só botões.
- CI remoto verde antes do merge; deploy bem-sucedido e build-meta.json correspondente ao commit.

## Débito

- Exclusão definitiva de funções, imagens e novas formas de planejar ficam para pedidos posteriores.
- Requer promoção a ready pelo dono conforme AGENTS.md. Publicação já autorizada; não perguntar novamente durante a execução aprovada.

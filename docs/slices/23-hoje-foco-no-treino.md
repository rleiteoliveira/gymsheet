# Slice 23 — Hoje focado no treino

- Issue: #23
- Status: doing
- Cabe no próximo treino? sim — depois do slice #21 entrar na `main`

## Direção visual

- Seguir a opção 2 aprovada em 30/08/2026: tela Hoje adaptativa, baixa densidade e uma ação persistente de treino acima da navegação.
- O mock é referência de hierarquia, não cópia literal: preservar tema, tipografia, ícones Lucide e componentes já usados pelo GymSheet; não inventar engrenagem, métricas ou novas áreas.

## Faz

- [ ] Shell principal: adicionar um dock fixo acima da navegação nas quatro abas. Sem sessão de hoje, exibe **Começar treino**; com sessão de hoje `in_progress`, exibe **Retomar treino** e abre a mesma sessão. O dock some na view da sessão e mantém `data-testid="start-workout"`.
- [ ] Ação adaptativa: ficha pinada inicia uma nova sessão daquela ficha; sem ficha pinada abre o fluxo rápido existente. Sessão anterior ainda aberta reutiliza a decisão já existente antes de começar outra, sem alterar automaticamente o passado.
- [ ] Hoje: manter marca + data e reduzir o corpo a um único contexto adaptativo — sessão em andamento, ficha pinada ou treino livre — mais uma linha clicável do último treino. `Trocar` leva à aba de fichas; não criar nova tela/modal.
- [ ] Remover de Hoje o card `start-now-card`, o vazio grande do pin, as sugestões de três fichas, a grade de atalhos e a lista duplicada de recentes. No rodapé, apenas o dock fica preenchido de verde; a aba ativa usa verde em ícone/texto. Garantir alvos de 48 px, safe area e conteúdo não coberto em 390×844.
- [ ] Depois do slice #21 estar `done`, estender o único `e2e/happy-path.spec.ts`: iniciar pelo dock, sair da sessão, ver **Retomar treino**, retomar a mesma sessão, finalizar e abrir Semana. O mesmo launcher deve estar visível em Hoje, Fichas, Semana e Dados.

## Não faz

- redesenhar a view da sessão, picker, editor de ficha, calendário ou Dados
- cronômetro no dock, novas métricas, configurações, programa #6 ou débito do slice 13
- corrigir overflow do picker ou rótulo de peso corporal neste PR
- D1, auth, sync, schema novo, dependência visual nova, refatorar `components/ui`
- implementar antes de `origin/main` conter o slice #21 `done` e `e2e/happy-path.spec.ts`

## Arquivos

- pode: `app/page.tsx`, `app/globals.css`, `e2e/happy-path.spec.ts`
- não toca: `lib/types.ts`, `lib/storage.ts`, `lib/demo-state.ts`, `public/sw.js`, `components/ui`, `package.json`, `package-lock.json`, `.github`

## Contrato de dados

- `schemaVersion` permanece 2; nenhum campo persistente novo
- `todayPin`, `Plan` e `Session` mantêm o formato e a semântica atuais
- retomar nunca cria outra sessão; iniciar sem ficha continua criando sessão rápida sem criar ou mutar `Plan`
- dia permanece civil local; sessão passada não é alterada silenciosamente pelo fluxo de hoje
- o dock não mantém relógio: atualização a cada segundo continua restrita à view da sessão

## Testes

- `npm test && npm run lint && npx tsc --noEmit && npm run build && npm run test:e2e`
- E2E em viewport mobile 390×844, sem pedir smoke manual ao dono
- conferir por screenshot automatizado que dock e navegação não cobrem o conteúdo nos estados vazio e em andamento

## Débito

- Repaginação das demais telas só entra após dogfood deste slice.
- Overflow horizontal do picker e rótulo de peso corporal continuam como issues separadas.

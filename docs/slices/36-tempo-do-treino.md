# Slice 36 — Tempo do treino

- Issue / origem: pedido do dono em 2026-09-10; perspectiva de tempo no site
- Status: done
- Cabe no próximo treino? sim — enxergar quando registrou cada série e há quanto tempo o treino começou.

## Direção

Uma linha discreta no contexto da sessão: `Tempo de treino · 12:34`. Cada série expandida mostra seu horário de registro: `Série 2 · 14:32`, junto dos valores já existentes. Depois de finalizar, o tempo fica congelado. O exercício e Salvar série continuam com prioridade visual.

O cronômetro mede o tempo corrido entre Começar e Finalizar, incluindo descansos, troca de aba, tela bloqueada e período com o site fechado. Não mede tempo efetivo de esforço. Horário da série é o instante de salvar, sem inferir quando o movimento começou ou terminou.

Base revalidada: main e produção `3d72bb7d866d9a92c41a952a955a865c7ddeeb9c`, HTTP 200, run 34499101722 concluído com success. O código já grava `SetRecord.savedAt`, `Session.startedAt` e `Session.completedAt`; não é necessária migração.

## Faz

- [ ] Exibir o horário local de cada série registrada, em HH:mm com elemento `time` e datetime ISO existente, somente onde suas séries já estão expandidas. Nome acessível inclui horário e data completos. Usar savedAt original; em correções/lançamentos de outro dia, identificar `Registrada em DD/MM/AAAA às HH:mm` quando a data do registro difere do dia da sessão, sem apresentar isso como horário de execução do exercício.
- [ ] Exibir `Tempo de treino · mm:ss` na sessão em andamento, passando para `h:mm:ss` após uma hora, sem reiniciar em 24 horas. Após finalizar, exibir duração fixa calculada por completedAt − startedAt ao consultar a sessão. Uma sessão antiga retomada inclui todo o intervalo desde seu início; a data existente continua explícita. Na consulta/correção pelo calendário, usar `Intervalo registrado` e explicar discretamente que lançamentos retroativos podem ter horário convencional; não apresentar esse intervalo como duração aferida do esforço.
- [ ] Calcular o valor a partir dos timestamps e do relógio atual, nunca acumulando ticks. Atualizar visualmente a cada segundo enquanto a sessão estiver visível, recalcular imediatamente em retorno de visibilidade/foco e recarga, limpar listeners/timer ao sair ou finalizar e não escrever no IndexedDB a cada tick. O navegador pode suspender a atualização em segundo plano; o valor correto deve reaparecer ao retornar.
- [ ] Manter tempo como informação secundária no cabeçalho existente, com números tabulares e sem painel adicional, botão de iniciar/pausar/resetar ou animação contínua. Evitar re-renderizar toda a aplicação a cada segundo, não mover o foco nem anunciar segundos via aria-live; alvos e formulário permanecem estáveis. A confirmação visual do slice 35 não depende do cronômetro.
- [ ] Validar relógio e horários com tempo controlado: duas séries em instantes distintos, reload/retomada do mesmo ID, retorno de aba oculta com salto de tempo, conclusão congelada, travessia de meia-noite e mais de uma hora, sessão antiga, correção retroativa, timestamps inválidos e movimento reduzido. Executar unit, lint, TypeScript, build, verify:build e E2E; registrar evidência no contexto. Na entrega autorizada, PR → CI verde → merge → deploy → comparação do buildId e verificação do site publicado.

## Limite conservador para histórico

Session não tem createdAt nem marcador de sessão retroativa, conforme lib/types.ts. Por isso, não inferir procedência usando horário de meio-dia ou valores das séries. Na consulta/correção pelo calendário, `Intervalo registrado` é apenas a diferença entre timestamps, congelada se concluído; na sessão em andamento retomada, o cronômetro continua baseado em startedAt. Nenhum desses valores representa tempo efetivo de esforço.

## Não faz

- Cronômetro de descanso, alertas, som, notificações, vibração, Wake Lock ou execução garantida com o navegador fechado.
- Pausa, duração de esforço, metas, calorias, rankings ou estatísticas agregadas de tempo.
- App nativo, backend, autenticação, sincronização de relógio com servidor ou dependências novas.
- Preencher a inicial com relógios, modificar a gestão de fichas, catálogo/imagens ou components/ui.
- Reescrever datas antigas, fabricar horários ausentes, editar manualmente timestamps ou migrar backup/CSV.
- Pedir QA ao dono. Uso real pode informar a próxima fatia; aceite técnico continua sendo CI verde.

## Arquivos

- pode: app/page.tsx, app/globals.css, app/components/workout-time.tsx (componente isolado se necessário), lib/workout-time.ts e seu teste unitário (somente funções puras de cálculo/formatação), e2e/happy-path.spec.ts, este slice, docs/slices/README.md, docs/design/README.md e docs/context/ para evidência/contrato da entrega.
- não toca: lib/types.ts, lib/storage.ts, lib/session.ts (regras), public/sw.js, components/ui/, package.json, lockfile, .github/ ou configurações de publicação.

## Contrato de dados

- schemaVersion permanece 2; IndexedDB, stores, backup JSON e CSV não mudam.
- savedAt continua gravado uma vez no momento de salvar série; renderizar o horário não o altera.
- startedAt/completedAt, IDs, snapshots, séries e todayPin mantêm a semântica atual. Dia continua civil local.
- Usar o relógio do dispositivo como referência viável para o site. Mudança manual de relógio pode afetar a duração; não corrigir timestamps automaticamente. Duração negativa deve ser limitada a zero; timestamp inválido/ausente resulta em `Tempo indisponível` ou `Horário indisponível`, sem quebrar a sessão.
- Finalização usa completedAt persistido; abrir correção não reinicia a contagem nem muda o término.
- Testes usam contexto isolado e fixtures explícitas; não gravar séries nos dados do dono.

## Testes

- Unit: diferenças de timestamps, minutos/horas/mais de 24h, duração fixa ao concluir, negativos/ausentes/inválidos e formatação local.
- E2E: controlar relógio e observar valor exibido junto com estado persistido; comprovar que ticks não alteram os registros e recarga não reinicia tempo.
- Confirmar horário HH:mm das duas séries, valores e IDs após recarga; verificar a duração final sem avançar após o encerramento.
- Mobile 390×844 e 320 px: tempo/horários não causam overflow; editar kg/reps durante ticks mantém foco, seleção e valor digitado.
- npm test; npm run lint; npx tsc --noEmit; npm run build; npm run verify:build; npm run test:e2e.

## Débito

- Marcação confiável de sessão retroativa e aferição de esforço dependeriam de contrato de dados próprio; ficam fora desta fatia.
- Descanso e integrações nativas só entram mediante pedido posterior, após uso do tempo corrido no site.
- Slice promovido a `ready` pelo dono em 2026-09-10; concluído após PR #48, CI/deploy verdes e avaliação pós-deploy.

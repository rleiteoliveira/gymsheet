# Slice 43 — Plano de repaginação para treino solo

- Origem: pedidos do dono em 2026-09-14 para revisar a experiência, desligar funções e detalhar implementação e validação.
- Status: done — recorte A (**Faz**) mesclado em `main` por [PR #63](https://github.com/rleiteoliveira/gymsheet/pull/63) com CI verde, fechando a issue [#62](https://github.com/rleiteoliveira/gymsheet/issues/62). Os recortes B–E continuam sem slice próprio e sem implementação.
- Cabe no próximo treino? sim — confiança na marcação, início direto e controles estáveis são problemas do percurso principal.
- Revisão: 2026-09-14, America/Fortaleza.
- Base observada: `main`, `HEAD` e `origin/main` locais em `90f0588bc9b6e7c7a42283bd39d0b5f8eed447cd`; `git ls-remote origin refs/heads/main` confirmou o mesmo commit. Worktree inicialmente limpo.
- Issue: [#62](https://github.com/rleiteoliveira/gymsheet/issues/62), aberta em 2026-09-14 para o recorte A (registro confiável). A issue #43 existente é sobre o slice 32; o número deste slice não significa reutilizar essa issue.
- Natureza: plano consolidado e contrato do primeiro recorte. Somente a seção **Faz** delimita a execução do slice 43; promover este arquivo a `ready` não autoriza executar o restante do roteiro em um PR único.

## Objetivo da validação

GymSheet acompanha uma pessoa treinando sozinha: iniciar sem preparar uma ficha, registrar cada série com um toque e consultar depois a sequência de acontecimentos. O telefone pode estar apoiado ou ser usado com uma mão, entre movimentos, com atenção limitada. Essas são hipóteses de desenho para validar, não observações comprovadas sobre o dono.

A promessa é: **começar rápido, marcar com confiança e voltar a atenção para o treino**. O usuário não precisa identificar exercício, carga, repetições ou uma meta de séries para usar o produto.

A quantidade de séries é consequência dos toques. Exercício 1, Exercício 2 e seguintes são agrupamentos anônimos escolhidos pelo usuário. Identificação e edição completas ficam para o futuro; não antecipar um editor para justificar dados que ainda não foram necessários.

## Avaliação crítica do plano anterior

| Proposta anterior | Avaliação e melhoria profissional |
|---|---|
| Começar sempre e continuar apenas por escolha | Manter. Persistir os registros não precisa impor a sessão anterior como destino da inicial. Retorno do sistema após alternar de aplicativo preserva a tela aberta; abertura fria, recarga e saída explícita chegam à inicial. |
| Encerrar automaticamente no último evento | Corrigir a precisão da promessa: isso é encerramento estimado. Registrar separadamente a hora em que a decisão foi tomada e o limite temporal conhecido do treino; nunca apresentar esse limite como fim observado. |
| Medir cada momento | Registrar instantes e intervalos entre marcas. Um toque ao fim da série não mede duração de execução, descanso puro, intensidade ou tempo sob tensão. |
| Fixar tudo em exatamente 100dvh | Usar uma composição estável na área visível, com exceção explícita para texto ampliado e telas baixas. Proibir rolagem a qualquer custo pode esconder controles. |
| Histórico crescendo dentro do palco | Separar o registro atual da lista. Histórico deve ter área própria; novos itens não reposicionam controles nem roubam o ponto de leitura. |
| Botão que aparece após a primeira série | Reservar o espaço de Próximo exercício desde o começo. No recorte visual, manter a regra atual de habilitação; mudar a regra só na fase do novo ciclo. |
| Retirar Calendário imediatamente | Preservar acesso ao passado até existir substituto funcional. Hoje o calendário é a única entrada para detalhes/correção de sessões concluídas. |
| Ocultar recursos para simplificar | Desligar também carregamentos e efeitos desnecessários. Preservar leitura, IDs, snapshots e backup de dados legados. |
| Prazer ao marcar | Resposta tátil visual imediata; confirmação de salvamento somente depois de persistir. Uma animação de sucesso não pode encobrir uma gravação que falhou. |
| Remover código ao terminar o desenho | Adiar a exclusão física até passar o teste de compatibilidade e existir evidência de uso. Falta de clique em função escondida não prova falta de valor. |

## Evidência e limites

Leituras de código e contratos foram revalidadas nesta revisão. A resposta anterior relatou estas medições do percurso local: em 390×844, a primeira série deslocou Marcar série em 67 px; quatro marcas deslocaram o botão em cerca de 258 px; a troca de exercício levou o scroll de 149 a 0. Não há evidência visual persistida verificada junto deste documento e as medições não foram repetidas nesta revisão; esses números orientam reprodução, não substituem o teste automatizado futuro.

| Fato revalidado | Fonte no checkout | Implicação |
|---|---|---|
| A lista de séries é renderizada antes de Marcar série | `app/page.tsx`, `renderSession`; `app/globals.css`, `.essential-set-list` | Cada linha aumenta a distância até o próximo toque. |
| O exercício ativo é ordenado para o topo | `app/page.tsx`, `orderedExercises` | Trocar o ativo altera a geometria da página. |
| Retomar substitui Começar na inicial | `app/page.tsx`, `renderToday`; `lib/session.ts`, `decideSessionStart` | O estado salvo governa o início, em desacordo com a nova intenção. |
| O nome sugerido inclui dia da semana/data, mas não hora | `lib/session.ts`, `suggestedSessionName` | Dois treinos no mesmo dia recebem o mesmo rótulo principal. |
| Existem início/fim de sessão e `savedAt` da série, sem início do exercício | `lib/types.ts` | Não é possível reconstruir com precisão a troca de exercício antiga. |
| `mutate` altera React e dispara gravação sem esperar; `saveSet` anuncia sucesso imediatamente | `app/page.tsx`, `mutate`, `saveSet`, `finishSession` | Persistência pode falhar depois da confirmação visual. |
| Falha no carregamento inicial libera estado vazio; carga local e catálogo compartilham `Promise.all` | `app/page.tsx`, efeito de inicialização | Falha de leitura pode parecer primeiro uso e permitir sobrescrever dados após recuperação. |
| `saveAppState` grava o objeto inteiro; sem IndexedDB retorna sem erro | `lib/storage.ts` | Há risco de sucesso falso e de uma aba sobrescrever dados de outra. Concorrência é hipótese de risco por código; ainda precisa ser reproduzida. |
| Histórico não abre registros concluídos; Calendário abre | `app/page.tsx`, `renderFolder`, `renderWeek` | Ocultar o calendário antes da substituição tornaria os detalhes inacessíveis. |
| O parser enumera os campos e exporta versão 2 | `lib/storage.ts` | Metadados novos exigem contrato de importação/exportação; adicionar apenas ao estado React perderia informação no roundtrip. |

As issues abertas #43 e #7 foram consultadas para contexto. Seu estado aberto não autoriza execução. Não foram consultados CI/deploy/artefato público nesta revisão. Testes da aplicação não foram executados porque esta entrega altera somente documentação.

## Experiência desejada para treino solo

### Entrada e continuidade por escolha

1. Inicial limpa: data civil atual e **Iniciar treino**. Nenhum seletor de ficha, nome obrigatório ou formulário.
2. Iniciar cria um registro e o primeiro exercício anônimo. Uma sessão anterior aberta não troca o significado desse botão.
3. Se existir uma sessão anterior elegível, encerrar e criar a nova numa única operação persistida. Abaixo do CTA, quando necessário, uma frase discreta explica previamente: `Ao iniciar, o treino aberto será encerrado.` Não usar diálogo obrigatório no percurso normal.
4. O menu oferece Treino, Histórico e Dados e backup. Durante a sessão, o cabeçalho oferece Início e Finalizar; Marcar série permanece a única ação preenchida.
5. Ir a Início não apaga nem finaliza. Uma nova abertura oferece Iniciar treino; continuar o anterior exige abrir o Histórico e selecionar **Continuar este treino**.
6. Alternar para música, bloquear a tela ou receber uma chamada não encerra nem pausa o treino automaticamente. Ao voltar à aba que permaneceu aberta, manter a sessão e o exercício selecionados.
7. Finalizar usa a hora do toque, confirma persistência e retorna à inicial com uma confirmação compacta. Nenhum formulário de avaliação, resumo obrigatório ou nova sessão de cobrança.

Depois de abertura fria, Continuar este treino seleciona deterministicamente o último agrupamento criado, pela ordem persistida; não promete recuperar uma seleção transitória perdida com a aba. Se a aba apenas ficou em segundo plano, conserva a seleção em memória. Continuação deliberada de outro dia ocorre no detalhe histórico com a data original explícita, seguindo o contexto de correção desse dia; não é uma consequência da inicial de hoje. Uma sessão já visível que atravessa meia-noite mantém o seu contexto original.

O nome sugerido nos registros novos será `Treino · seg., 14/09 · 18:42`; o detalhe preserva data completa e horário de início. Nome automático não é ID. O texto não muda conforme o relógio avança. Renomear será uma ação opcional futura no detalhe; não tornar exercícios anônimos editáveis nesta validação.

### Palco estável e histórico

| Região | Conteúdo e comportamento |
|---|---|
| Cabeçalho compacto | Início, identificação curta do treino, tempo total e Finalizar secundário, separado do CTA recorrente. |
| Palco do exercício | Exercício N, séries registradas e último instante confirmado; altura independente do número de marcas. |
| Histórico do treino | Resumo com contador; expansão ocupa a área central disponível e rola internamente. Um único controle explícito abre/fecha. |
| Área de ação | Marcar série largo e Próximo exercício secundário; posições reservadas e respeitando a área segura inferior. |

- Composição por grid/flex com área central `minmax(0, 1fr)`, sem posicionar os controles dentro da lista crescente. A barra de ações pertence à sessão; não cria navegação inferior global.
- Em tela comum, somente a área de consulta rola. Em paisagem, janela muito baixa ou fonte ampliada, liberar rolagem acessível quando necessária; não cortar texto, reduzir alvos ou esconder Finalizar para cumprir uma altura artificial.
- O exercício ativo é renderizado em um slot próprio. A lista de acontecimentos conserva ordem estável, por horário e ordem persistida como desempate; selecionar/consultar não reordena a lista inteira.
- Abrir histórico não seleciona outro exercício nem muda o destino de Marcar série. Ao fechá-lo, restaurar o foco no disparador.
- Se o usuário estiver lendo marcas antigas, preservar o scroll e mostrar uma indicação discreta de novas marcas. Só acompanhar automaticamente o fim da lista se ele já estiver no fim.
- Ao tocar Próximo exercício, atualizar apenas o palco e o agrupamento ativo. Não rolar a página para cima, animar altura ou mover o cabeçalho.
- No ciclo final, Próximo exercício pode funcionar sem uma série anterior: bloco vazio permanece sem marcas, não vira exercício executado. No recorte visual intermediário, manter a condição atual e reservar sua geometria.

### Satisfação, ergonomia e acessibilidade

- Alvos de operação de pelo menos 48×48 CSS px; Marcar série com altura de pelo menos 56 px e largura útil para ambas as mãos. Esses valores são decisões de ergonomia do produto, não uma alegação de que WCAG exige 48 px. Referência: [W3C, tamanho mínimo dos alvos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).
- Distância visual e espacial entre marcação frequente e Finalizar; encerramento fora da região onde o dedo repete a marcação.
- Uma ativação reconhecida corresponde a uma marca. Não somar ao mesmo tempo em `pointerdown` e `click`; auto-repeat de tecla não cria várias marcas. Toques intencionais novos não são descartados por uma janela arbitrária de debounce.
- Resposta de pressão começa no próximo frame; compressão discreta de 100–160 ms. O número e a faixa de confirmação atualizam no mesmo espaço. Animação de confirmação de 160–240 ms, sem impedir a próxima ação depois do commit.
- Enquanto grava, mostrar estado breve de salvamento numa faixa de altura reservada. Após commit, confirmar uma única vez; em falha, manter a ação pendente com nova tentativa explícita. Não exibir dois toasts concorrentes.
- Um único anúncio `aria-live` por sucesso; cronômetros não anunciam cada segundo. Cor nunca é o único indicador de sucesso ou erro.
- Respeitar `prefers-reduced-motion`: retirar deslocamento/escala, preservar texto e mudança de estado. Referência: [W3C, animação por interação](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).
- Foco visível e inteiramente utilizável acima da área de ações; histórico e eventuais diálogos devem ter ordem de leitura e retorno de foco previsíveis. Referência: [W3C, foco não encoberto](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).
- Contagem legível, números tabulares e texto curto; sem pulsação contínua, metas fictícias, gamificação, rankings ou estímulos para aumentar carga.
- Som, vibração, tela sempre acesa, relógio conectado e widgets ficam adiados. Nenhuma interação principal depende dessas capacidades.

### Correção de toque sem virar editor

Na fase de histórico, oferecer **Desfazer última marca** no contexto da última série do treino aberto. A ação só afeta o ID exibido, mostra a hora e continua disponível até nova marca, troca de exercício ou finalização; não depende de acertar um toast de três segundos. A transação revalida que aquela marca ainda é a última. Se outra aba avançou, atualizar o contexto e não remover nada silenciosamente.

Reverter a mesma marca duas vezes deve ser idempotente. O índice da próxima série deriva das séries válidas atuais, sem alterar IDs ou timestamps das demais. Isso é recuperação de toque na captura corrente; edição de nome, peso, repetições e horários históricos continua adiada.

## Contrato temporal proposto para a fase do novo ciclo

| Informação | Significado permitido |
|---|---|
| Início do treino | Instante do toque em Iniciar treino. |
| Início do exercício anônimo | Instante de começar o agrupamento no app; não é início de contração muscular. |
| Marca de série | Instante em que o usuário tocou Marcar série. |
| Intervalo entre marcas | Diferença entre dois instantes registrados; inclui qualquer atividade ocorrida entre eles. |
| Desde a última marca | Relógio de referência opcional e discreto no palco; sem prescrição ou alarme de descanso. |
| Finalização explícita | Hora do toque em Finalizar, persistida uma vez. |
| Encerramento ao iniciar outro | Limite estimado no último evento de treino válido, com motivo e hora da decisão separados. |

Não chamar intervalo entre marcas de duração da série ou descanso. Não calcular calorias, volume de carga, recorde pessoal ou intensidade a partir de marcas sem peso/repetições. `kg: null` e `reps: 0` continuam significando não informado.

Fechamento automático usa o último instante válido entre início do treino, início dos agrupamentos registrados e marcas existentes. Visitar histórico, trocar aparência ou abrir o app não conta como atividade do treino. Se não houve marca, apresentar `Sem séries registradas` e não sugerir zero minutos como duração real de exercício. Se timestamps forem inválidos, preservar o original e mostrar tempo indisponível; não fabricar correção silenciosa.

Com múltiplos registros antigos abertos, o fluxo novo atua somente sobre a sessão elegível mais recente por `startedAt` válido, com ID como desempate estável; registros com início inválido ficam para consulta explícita. Não faz encerramento em massa do acervo. Pendências legadas continuam consultáveis. Continuar uma delas exige escolha explícita; se já existir outra sessão aberta corrente, apresentar a mudança de contexto antes de prosseguir.

O relógio deve ser derivado dos timestamps, atualizado ao recuperar visibilidade. Timers de páginas em segundo plano podem ser limitados pelo navegador; eles não são fonte de verdade. Referência: [MDN, Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API). Não criar timer em serviço/background para fingir execução contínua.

Guardar a data civil do início para registros novos, evitando reagrupamento ao viajar entre fusos. Sessão atravessando meia-noite mantém esse dia. Registros legados cujo fuso original é desconhecido mantêm a interpretação disponível; não inventar offset histórico.

### Dados novos e compatibilidade

O slice 43 permanece em versão 2. A fase posterior de ciclo/tempo deve especificar e promover deliberadamente backup v3 antes de incluir os seguintes campos:

- `Session.startedOnLocalDate`: data civil capturada no início, obrigatória para novos registros e nullable para legados cuja data original não seja demonstrável. A apresentação de um legado pode manter a derivação atual sem persistir essa inferência como fato original.
- `Session.completionKind`: `explicit`, `superseded` ou `legacy_unknown`, nullable enquanto aberta. Diferencia fim observado e fechamento estimado.
- `Session.completionRecordedAt`: hora de decisão de fechamento; não substitui `completedAt` usado como limite do intervalo registrado.
- `SessionExercise.startedAt`: início do acompanhamento do agrupamento; nullable em importações antigas sem evidência.

O slice posterior precisa definir tipos, defaults, validação e migração v1/v2→v3, além do roundtrip v3. Leitura do legado não deve inventar início de exercício nem classificar encerramentos antigos como explícitos. Não reaproveitar `savedAt` ou `sourcePlanName` para carregar metadados temporais.

Preservar importação dos backups antigos, sessões/fichas/snapshots existentes e CSV como projeção. Exportação nova não deve se anunciar como v2 se informações importantes só existem em v3. Rollback após evolução de dados requer uma versão que consiga ler o formato novo; não basta voltar para um binário antigo. Renomear e editor completo exigem outra proposta, depois da validação de uso.

### Alterações explícitas de contratos

O pedido de começar um treino encerrando o anterior muda a intenção vigente, mas este documento continua uma proposta de execução:

1. Na fase de novo ciclo, substituir Começar/Retomar por Iniciar treino na inicial em `docs/context/10-contracts.md` e `docs/design/README.md`.
2. Antes de implementar fechamento de uma sessão de outro dia, ajustar a regra de `AGENTS.md` e o contrato estável com uma exceção estreita: alterar apenas metadados de encerramento da sessão selecionada. Preservar `startedAt`, dia civil, nomes, séries, snapshots e status de exercícios. Não reutilizar cegamente `completeSession`, que hoje marca exercícios pendentes como pulados.
3. A transferência da consulta/correção do calendário para um histórico unificado deve ter seu próprio contrato. Ocultar o calendário não autoriza editar o passado durante treino corrente.
4. Backups, dados locais, histórico e datas civis continuam protegidos. Nenhuma fase inclui auth, D1, sincronização remota ou prescrição de treino.

## Desligamento de features

| Superfície | Tratamento para a validação | Proteção e condição de remoção |
|---|---|---|
| Fichas, seletor e fixação | Retirar do início e depois da navegação principal | Fichas existentes seguem no JSON; sessões com origem em ficha continuam legíveis. Um pin antigo não muda Iniciar treino. |
| Catálogo, imagens, filtros e sugestões de favoritos | Não carregar para iniciar/registrar treino livre; ocultar gestão quando fichas saírem | Manter snapshots existentes e importação. Remover código de fetch só com consumidores conhecidos desligados. |
| Kg/reps e identificação detalhada | Retirar edição durante treino; manter valores antigos na consulta | Não zerar histórico; editor futuro somente por necessidade demonstrada. |
| Skins | Fixar Neon na versão de validação e ocultar seletor | Não apagar preferência antiga; ela fica dormente. Comparação estética não deve confundir a validação do fluxo. |
| Calendário e criação retroativa | Manter como acesso secundário até Histórico abrir todos os registros | Depois ocultar criação retroativa; não criar dias fictícios nem registros retroativos automaticamente. |
| Dados e backup | Preservar JSON, restauração e acesso aos dados | CSV pode ir para opções avançadas, mantendo projeção e testes. Restauração continua explícita, validada e atômica. |
| Carregar exemplo | Retirar da superfície da validação | Fixtures automatizadas isoladas do armazenamento do dono; não limpar acervo existente. |
| Avisos de catálogo | Não exibir na inicial do treino livre | Falha de catálogo não deve bloquear o começo nem parecer perda dos dados locais. |
| Notificação de atualização | Evitar instalar/recarregar durante gravação | Sem atualização automática que interrompa marcação; consultar issue #8 somente se uma fase de CI/deploy for selecionada. |

Desligamento começa na apresentação e nos efeitos associados. Não criar um painel de flags para o usuário. A exclusão física só ocorre em um recorte posterior, com referências conhecidas, compatibilidade de backup demonstrada e estratégia de recuperação. Não existe prazo automático de exclusão após sete ou trinta dias.

## Roteiro de implementação

| Ordem | Recorte | Resultado verificável | Limite |
|---|---|---|---|
| A — slice 43 | Registro confiável | Sucesso só após gravação, recuperação de falha, concorrência sem perda e leitura segura | Contrato detalhado em Faz/Não faz abaixo; sem nova versão de dados. |
| B — futuro slice | Palco estável | Marcar e trocar exercício não empurram controles; consulta com rolagem própria | Usar dados atuais e preservar regras de início até C. |
| C — futuro slice | Iniciar sempre e tempo honesto | Novo treino fecha o anterior de forma identificada; continuação explícita; timestamps e backup compatíveis | Exige contrato v3 e exceção de encerramento antes da implementação; se ultrapassar 5 itens de Faz, separar migração e fluxo. |
| D — futuro slice | Histórico útil e desligamento reversível | Abrir sessões concluídas, expandir momentos, desfazer marca corrente e retirar superfícies secundárias | Desligar Calendário só após substituição funcional; separar histórico/desligamento se o Faz exceder 5 itens. |
| E — condicionado ao uso | Redução física do legado | Menos código e carregamentos mantendo acervo legível | Sem exclusão de dados ou remoção do leitor legado por inferência. |

Cada recorte recebe issue/P1, slice próprio promovido pelo dono e PR separado. B pode ser desenhado enquanto A é validado, mas a validação do produto completo só começa após A–D. Não confundir entregar o primeiro recorte com cumprir toda esta repaginação.

## Faz

Escopo exclusivo da primeira implementação, slice 43 — registro confiável:

- [x] Separar carregamento dos dados locais e catálogo; distinguir armazenamento vazio de falha de leitura, impedir escrita sobre estado não carregado e oferecer nova tentativa sem limpar dados.
- [x] Tornar gravações do percurso de treino confirmáveis: operações de domínio aplicadas sobre estado persistido fresco em transação de leitura/escrita; IDs e horários gerados fora de updaters React repetíveis; confirmação após conclusão da transação.
- [x] Preservar a operação pendente na falha, com nova tentativa idempotente usando o mesmo ID/horário, sem duplicar séries/sessões, anunciar sucesso falso ou sair para a inicial após falha ao finalizar.
- [x] Integrar os escritores existentes à estratégia de concorrência para que uma aba não sobrescreva dados confirmados por outra; rejeitar captura corrente emitida por uma aba obsoleta sobre sessão já encerrada, preservando correção histórica deliberada no Calendário com transação fresca.
- [x] Cobrir carga segura, persistência, retry e concorrência com testes de domínio/integração e E2E do caminho terminal; registrar a evidência e o limite de cada execução.

### Como o recorte A foi implementado

- `lib/storage.ts`: ausência ou recusa do IndexedDB virou `PersistenceUnavailableError`; leitura e escrita dos dados do dono falham explicitamente, enquanto o cache do catálogo continua tolerante. `commitAppState` abre uma transação `readwrite`, lê o último estado confirmado, aplica a operação de domínio de forma síncrona, grava e só então resolve; qualquer erro aborta a transação inteira.
- `lib/persistence.ts` (novo): `applyWorkoutIntent` descreve partida, próximo exercício, marca de série e finalização como intenções com ID e horário próprios. Repetir a mesma intenção devolve `already-applied` sem gravar de novo; alvo ausente, sessão encerrada em outra aba ou estado diferente do esperado devolvem `stale` e não alteram nada. `expectedState` é o que separa captura corrente obsoleta de correção deliberada de um registro já encerrado.
- `app/page.tsx`: o antigo `mutate` com gravação disparada de dentro do updater React foi substituído por `commit`, porta única de persistência usada também pelas escritas administrativas. Confirmação, navegação e toasts acontecem depois do commit; a falha guarda a mesma operação numa barra de nova tentativa. Dados locais e catálogo carregam separados e uma leitura que falha mostra erro com nova tentativa, sem gravar por cima. Um `BroadcastChannel` apenas atualiza a tela das outras abas.
- `app/globals.css`: faixa de estado de salvamento com altura reservada e barra de erro de gravação.

## Não faz

- Implementar os recortes B–E, mudar a hierarquia da home, remover Retomar ou desligar features neste primeiro PR.
- Alterar comportamento de dia civil, renomear campos de domínio, introduzir metadados temporais ou mudar schemaVersion neste slice.
- Adicionar editor de exercício/treino, timers de descanso prescritivos, estimativa de calorias, carga recomendada, IA, programa, gráficos de desempenho ou competição.
- Refatorar componentes por estética, atualizar dependências, mudar build/service worker ou implementar as issues #1, #6, #7, #8 e #44 por proximidade.
- Abrir PR de produto, publicar, mergear ou fazer deploy durante a preparação deste documento; pedir smoke manual ao dono.

## Arquivos

- Pode no slice 43: `lib/storage.ts`, `lib/storage.test.ts`, `lib/session.ts`, `lib/session.test.ts`, `app/page.tsx`, `e2e/happy-path.spec.ts`, um módulo/teste focado de operações de persistência se necessário, este slice, índice e `docs/context/` para bookkeeping. `app/globals.css` apenas para o estado de salvamento/erro sem salto de layout.
- Não toca no slice 43: `lib/types.ts`, `app/components/workout-time.tsx`, `lib/workout-time.ts`, catálogo/imagens/skins, `AGENTS.md`, `docs/design/README.md`, `public/`, `package.json`, lockfile e `.github/`.
- Mapa para fases futuras: B usa `app/page.tsx`, `app/globals.css`, componentes focados e E2E; C usa domínio/tempo/storage/tipos/backup e os contratos explicitados; D usa renderização de histórico/menu e operações de recuperação. Esse mapa não concede permissão a esses arquivos para o slice 43.
- Extrair componente apenas quando necessário para separar palco, controles e histórico; não iniciar uma reescrita ampla de `app/page.tsx`.

## Contrato de dados

Para o slice 43:

- `schemaVersion` permanece 2; nome/versão do IndexedDB e stores existentes permanecem compatíveis.
- Preservar IDs, `startedAt`, `completedAt`, `savedAt`, índices das séries, snapshots, planos, `todayPin`, kg/reps e formato CSV/JSON.
- Ausência ou recusa de IndexedDB deve produzir erro explícito de persistência. Não resolver a gravação como sucesso quando nenhum dado foi salvo.
- Toda operação relevante lê o último estado confirmado dentro da transação e revalida seu alvo. Uma fila JavaScript resolve apenas uma aba; não é suficiente para concorrência entre abas.
- A transação deve concluir por inteiro ou não alterar nada. Não executar chamadas de rede dentro dela. Notificação de mudança entre abas serve para atualizar a tela; não substitui a exclusão mútua da transação.
- Um retry de marca preserva o mesmo ID e `savedAt`; encontrar esse ID já confirmado significa sucesso da mesma operação. Uma nova intenção do usuário recebe outro ID.
- Uma falha não apaga dados, não executa restauração, não oferece começar do zero automaticamente e não trata backup de estado vazio como recuperação.
- Se a aba/processo for fechado antes do commit, uma intenção que existia apenas em memória pode não ser recuperável. Após recarga, reconstruir pelos registros confirmados; não anunciar sucesso retroativamente nem recriar uma intenção incerta. Nenhuma marca já confirmada pode desaparecer. Persistência de uma fila ainda não confirmada exigiria outro contrato e não está implícita neste slice.
- Escritas administrativas já existentes precisam respeitar a coordenação para não desfazer uma sessão nova; isso não autoriza criar novas telas ou alterar o contrato destrutivo de restaurar JSON.

## Testes

### Aceite do slice 43

| ID | Cenário | Resultado exigido |
|---|---|---|
| A1 | IndexedDB vazio versus rejeição de leitura | Vazio permite primeiro treino; rejeição mantém modo de erro sem escrita, oferece retry e recupera os registros originais. |
| A2 | Catálogo lento/indisponível com dados locais válidos | Treino livre fica disponível após carregar os dados locais; catálogo não invalida o acervo. |
| A3 | Marca com commit adiado | Pressão do botão é percebida; nenhum anúncio de salva antes do commit; só uma série confirmada. |
| A4 | Falha de marca e retry duas vezes | Mesmo ID e horário, uma única série persistida; contagem e histórico coerentes. |
| A5 | Finalizar com falha de gravação | Sessão permanece aberta/visível; retry finaliza uma vez e então retorna à home. |
| A6 | Duas abas no mesmo contexto IndexedDB marcando | Ambas as intenções confirmadas permanecem após recarga; índices/IDs consistentes e nenhum snapshot antigo sobrescreve marcas. |
| A7 | Uma aba finaliza e outra tenta registrar com estado antigo | Ação obsoleta é recusada ou reconciliada explicitamente; não reabre nem altera sessão concluída por acidente. |
| A8 | Runtime repete updater/render; IndexedDB ausente | Render não duplica side effects; indisponibilidade de armazenamento não emite sucesso. |
| A9 | Recarga e JSON roundtrip após o percurso completo | Sessão, exercícios, séries, IDs e horários confirmados iguais; nada depende só do estado em memória. |
| A10 | Recarga antes e depois do commit; correção pelo Calendário | Nenhum registro confirmado desaparece nem intenção incerta é duplicada; correção histórica deliberada continua funcional e afeta apenas seu alvo. |

Vitest: testar transformações e semântica de operações onde houver lógica de domínio. E2E/integração em navegador: validar transação real, falha injetada de leitura/escrita, duas páginas compartilhando a mesma origem/contexto e dados após recarga. Não considerar teste com mock que sempre resolve como prova de persistência.

### Matriz de aceite da repaginação completa

| Área | Critério objetivo para os próximos slices |
|---|---|
| Início | Abertura fria → Iniciar treino em um toque, zero inputs; inicia mesmo com pin antigo ou catálogo indisponível. A2 deve existir antes. |
| Continuação | Início/reload preservam dados e mostram a home; continuar pelo Histórico mantém ID e seleciona o último agrupamento por ordem persistida. Voltar do background preserva a tela e seleção ainda abertas. |
| Novo treino | Encerramento anterior e criação novos são atômicos; dupla ativação do mesmo início gera uma sessão; falha preserva anterior; nenhuma mudança em registros concluídos de dias anteriores. |
| Nome e dia | Dois treinos no mesmo dia têm horário no rótulo; IDs únicos; meia-noite e mudança de fuso não alteram o dia civil já capturado. |
| Estabilidade | Em viewport constante 390×844 e 360×800, 10 séries em cada um de 5 exercícios: área de ações e CTA variam no máximo 1 CSS px após cada estado assentado; a posição reservada permanece estável também durante a animação. |
| Interação real | Repetir clique na mesma coordenada central do CTA sem auto-scroll de locator; número de marcas persistidas equivale às ativações deliberadas. Teste semântico sozinho pode ocultar o deslocamento do botão. |
| Histórico | Lista cresce e expande sem alterar destino da próxima marca; preservar scroll ao ler item antigo; fechar devolve foco; sessões concluídas abrem detalhe. |
| Movimento | Novo item não anima altura/margens; feedback transitório não muda posição dos controles. Com movimento reduzido, mesmas informações e resultado imediato. |
| Janela/fonte | 320×568, paisagem 844×390, desktop e texto a 200%: sem overflow horizontal/corte; todos os controles alcançáveis; rolagem acessível é permitida quando a altura não comporta a composição. |
| Acessibilidade | Alvos previstos, labels, ordem de Tab, foco visível sem cobertura, anúncio único de resultado e cronômetro silencioso. Verificações automatizadas não equivalem a certificação WCAG nem a teste de leitor de tela real. |
| Tempo | Background/reload não inventam pausa; comparar valores com timestamps conhecidos; encerramento estimado visivelmente distinto; dados legados sem timestamp não ganham duração fabricada. |
| Erro de toque | Desfazer atua só no ID elegível, uma vez; próxima marca e troca não modificam séries anteriores; concorrência revalida o alvo. |
| Offline e volume | Com shell previamente disponível e rede bloqueada, iniciar/marcar/consultar/encerrar continua funcional; 100 sessões e 500 marcas de teste não aumentam o tamanho do palco. Não alegar primeiro acesso offline. |
| Compatibilidade | Importar v1/v2, exportar/restaurar v3 na fase apropriada, manter todos os valores antigos e metadados novos; funções escondidas não significam dados perdidos. |

Não usar apenas CLS como prova da estabilidade: medir posição dos controles e scroll durante ações iniciadas pelo usuário. Capturas antes/depois devem usar viewport e estado definidos, com seed isolado, e ser salvas em artefatos de teste; não inserir dados de teste no armazenamento cotidiano.

### Execução e gates

1. Revalidar checkout, slice `ready`, escopo e contrato vigente antes de implementar.
2. Executar `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build` e `npm run test:e2e`. Construir antes do E2E: o servidor usa `dist/server/wrangler.json`.
3. Estender `e2e/happy-path.spec.ts`; não depender de um servidor de preview com build antigo. Guardar resultados e limites em `docs/context/30-validation.md`.
4. Verificar o estado final do negócio com ID e valores persistidos; botão clicado, screenshot ou HTTP 200 isolado não bastam.
5. Abrir PR somente no papel executor e conforme autorização do slice. `done` exige merge e CI remoto verde; produção exige autorização e verificação separada do build publicado.

## Validação de utilidade e satisfação

CI é o aceite de entrega definido no repositório. Satisfação e utilidade são hipóteses de produto avaliadas depois, por uso voluntário, sem transformar o dono em QA ou bloquear o merge por um smoke manual.

Começar a avaliação do conjunto depois de A–D. Recomendação de janela: 3–5 treinos solo, sem obrigar respostas durante o exercício. Perguntas opcionais após esse período: foi preciso procurar o botão? alguma dúvida se a série ficou salva? o tempo registrado ajudou a recordar o treino? algum recurso removido realmente fez falta?

| Sinal | Regra de decisão |
|---|---|
| Formulário obrigatório ou botão que foge | Falha da proposta; corrigir antes de ampliar features. |
| Dúvida sobre salvamento ou perda/duplicação | Interromper expansão e corrigir confiabilidade; não mascarar com feedback mais chamativo. |
| Marca feita com facilidade, histórico pouco consultado | Reduzir presença do histórico; não preencher a tela com métricas para justificar o recurso. |
| Tempo interpretado como esforço/descanso exato | Revisar copy e apresentação; não reivindicar medida que não existe. |
| Pedido recorrente por nome/carga/reps após uso | Abrir novo slice para edição posterior, mantendo captura sem teclado. |
| Nenhuma evidência de necessidade de ficha/catálogo | Manter desligado; excluir código somente após compatibilidade e rollback definidos. |

Não adicionar analytics remoto, gravação de sessão, rastreamento silencioso ou novas permissões para medir satisfação. Sem uso observado, registrar **utilidade ainda não avaliada**. Não contar volume de séries registradas como indicador de melhora física, adesão ao esporte ou qualidade do treino.

## Débito

- Nome personalizado opcional e edição posterior de exercícios/carga/repetições: futuro, somente se fizer falta no uso.
- Medição real de execução e descanso: exige captura adicional ou sensores; não inferir a partir das marcas atuais.
- Som/háptica, wake lock, relógios, sincronização entre aparelhos, programas e notificações: adiados.
- Critério humano de satisfação permanece distinto de validação funcional automatizada.
- Dados e funções legadas devem ter leitura recuperável; o plano não autoriza limpeza destrutiva de histórico.
- Esta revisão entregou documentação. Nenhuma feature deste slice ou roteiro foi implementada, nenhum PR foi aberto e nenhum deploy foi feito.

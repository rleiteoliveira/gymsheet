# Slice 25 — Interface essencial

- Issue: [#30](https://github.com/rleiteoliveira/gymsheet/issues/30) — não é a #1, #6, #7 nem #8.
- Status: doing
- Cabe no próximo treino? sim — a primeira entrega simplifica a entrada e recolhe a navegação secundária.
- Direção visual aprovada pelo dono em 06/09/2026. Confirmada no mesmo dia após PoC de quatro variantes: a base de execução é a **Essencial (A)**. O dono autorizou a implementação em 06/09/2026; o executor iniciou o trabalho e marcou o slice como `doing`.

## Objetivo e referência aprovada

Abrir o GymSheet, identificar o treino e começar. A tela inicial contém marca discreta, menu no canto esquerdo, data pequena, nome do treino com seletor e uma ação principal. O espaço vazio é intencional; não deve ser preenchido com atalhos, estatísticas ou explicações.

A referência principal é a variante **Essencial (A)**: fundo escuro uniforme, texto marfim, título serifado, botão claro “Começar” e nenhuma barra inferior. O menu lateral aprovado anteriormente permanece como padrão de navegação, adaptado à nova paleta sóbria.

Veredito do dono após o laboratório de 06/09/2026 (ver [docs/design/references/README.md](../design/references/README.md)):

- Essencial (A) — base. Já era o contrato deste slice; segue.
- Dock (B) — descartada para esta entrega e para PoC adicional.
- Densa (C) — pior das quatro; descreve o antes, não o alvo.
- Extrema (D) — fora. O vazio sem conteúdo parece abandono. Só revisitar se um slice futuro ocupar esse espaço com histórico e uma transição explícita; não preencher a inicial do 25 “para não ficar vazia”.

- [Comparativo no Figma](https://www.figma.com/design/jKvskdHKH4roQWDPe2RPkJ/GymSheet?node-id=2-2): a reconstrução no nó `3:8` fundamenta a linguagem visual. A data gigante e a barra inferior dessa referência não fazem parte da direção final.
- [Mock final aprovado da inicial](../design/references/25-essencial-inicial.png).
- [Mock aprovado da estrutura do menu](../design/references/25-essencial-menu.png). Referência de estrutura e comportamento; não reutilizar seu verde nem a densidade da tela de treino ao fundo.
- Os mocks usam dados ilustrativos. “Peito” e a data não são valores fixos do produto.

Os dois mocks aprovados estão preservados em `docs/design/references/`, sem dependência dos caminhos locais ou de publicação no Figma.

## Padrão de design v1

Este padrão nasce junto da primeira repaginação e orienta as próximas entregas. Inicialmente fica neste slice; a consolidação posterior poderá movê-lo para `docs/design/README.md`, mantendo este documento como contrato histórico.

### Cores, tipografia e espaço

Valores iniciais de implementação, derivados do mock; são uma especificação proposta, não tokens extraídos do Figma:

| Papel | Padrão |
|---|---|
| Fundo | `#11120f`, uniforme |
| Superfície do menu/painel | `#191a16`, apenas quando separar conteúdo for necessário |
| Texto principal e botão principal | `#f2f0e8` |
| Texto secundário | `#a4a49a`; não reduzir a ponto de dificultar leitura |
| Divisor | `#30312c`, fino e só onde ajudar a separar itens |
| Texto no botão claro | `#11120f` |
| Marca e nome do treino | Serifada; marca pequena em itálico, título moderado, sem letras gigantes |
| Texto, campos, séries e botões | Sans-serif de sistema; números alinhados com algarismos tabulares |
| Escala inicial | Marca 18 px; título 30–32 px; corpo e botões 16 px; data e metadados 14 px |
| Espaçamento | Escala de 4/8/12/16/24/32/48 px; margens mobile de 24 px |
| Controles | Área acionável mínima de 48 × 48 px; botão principal com altura mínima de 52 px |
| Cantos | Botões e campos com cerca de 10 px; menu encostado à borda, sem formato de cartão flutuante |

Usar uma pilha serifada local como ponto de partida, sem requisição externa de fonte. Conferir o resultado renderizado antes de fixar uma família específica; eventual fonte empacotada é decisão explícita de outro slice, preservando uso offline.

Sem verde decorativo, degradês, brilhos, sombras pesadas, cards dentro de cards ou ícone para cada frase. Cor de erro continua disponível quando comunica um problema real; sempre acompanhada de texto. Não substituir informação de erro por estética.

Em desktop, preservar uma coluna confortável de no máximo 560 px nas telas repaginadas, sem transformar a página em dashboard nem esticar controles. Em mobile, respeitar área segura, textos longos e zoom. Espaços do mock são referência de ritmo, não coordenadas absolutas.

### Regra para botões e conteúdo

Toda proposta de novo botão deve registrar no próprio slice:

1. Qual tarefa concreta do treino ele resolve.
2. Em qual estado é necessário e com que frequência será usado.
3. Por que precisa estar visível em vez de no menu, no seletor ou no contexto do exercício.
4. Se duplica uma ação já acessível e o que substitui ou remove.
5. Como será entendido por texto, teclado e leitor de tela.

Sem justificativa, o botão não entra. Não criar atalhos “por conveniência” nem exibir controles desabilitados para anunciar funções futuras.

| Tipo | Onde aparece |
|---|---|
| Próxima ação principal | Uma ação preenchida por contexto de decisão: começar, retomar ou salvar a série atual |
| Escolha de treino | No próprio nome do treino, com seta e nome acessível; sem botão “Trocar” duplicado |
| Navegação secundária | Menu lateral: fichas, histórico, calendário, dados e backup |
| Operação menos frequente | No contexto correspondente; não espalhar na inicial |
| Destrutiva | Separada da ação principal, com os mecanismos de confirmação existentes |
| Falha ou decisão pendente | Mensagem curta e ação apenas quando necessárias; exceção justificada à tela normal |

Na sessão, o princípio de uma ação principal vale para o contexto ativo; não é autorização para esconder campos de carga/repetições ou obrigar um toque extra a cada série. A sessão terá desenho próprio antes de ser alterada.

Textos descrevem ações: “Começar”, “Retomar”, “Salvar série”. Remover slogans, explicações recorrentes, títulos duplicados e linguagem interna do estado normal. Não remover ajuda que seja necessária para uma escolha com consequência nos dados.

### Navegação lateral

Menu compacto no canto superior esquerdo, com área de toque de 48 px. Painel vindo da esquerda, com largura `min(300px, 85vw)`, fundo opaco e restante da página escurecido. Conteúdo rolável quando necessário. Ícones discretos e rótulos legíveis; item ativo sem bloco de cor chamativo.

| Item | Destino existente na primeira entrega |
|---|---|
| Treino | `today` |
| Fichas | `folder`, subaba `plans` |
| Histórico | `folder`, subaba `sessions` |
| Calendário | `week`, mantendo o conteúdo atual dessa tela nesta etapa |
| Dados e backup | `data` |

O rótulo “Calendário” oferece acesso à tela que já contém o calendário; não cria uma nova rota nem remove os resumos semanais neste slice. A separação visual definitiva fica para a etapa de histórico/calendário.

Fechar ao selecionar destino, tocar fora ou pressionar Escape. Conter foco enquanto aberto, impedir interação com o fundo e devolver foco ao botão de abertura quando fechado sem navegação. Ao navegar, levar foco ao título da tela de destino. Respeitar preferência de movimento reduzido. A inicial não depende de um gesto de arrastar para acessar o menu.

Não criar “Conta”, login, avatar ou configurações sem função existente. O GymSheet continua local e sem autenticação.

## Faz

- [x] Registrar as referências portáveis e aplicar o padrão v1 à inicial e ao menu, com estilos restritos a essas superfícies; retirar marca em bloco verde, slogan e indicador rotineiro de catálogo do cabeçalho desse shell.
- [x] Substituir a barra inferior e o dock global pelo menu esquerdo com os cinco destinos existentes; início/retomada ficam na tela Treino. Nas telas secundárias, voltar ao treino pelo menu. Não redesenhar a sessão nesta entrega.
- [x] Reduzir a inicial a data local, nome/seletor e “Começar” ou “Retomar”, seguindo os estados abaixo; remover repetição de “Hoje”, contagem, progresso, último treino e ações duplicadas dessa tela.
- [x] Fazer o nome/seta abrir a seleção pelas Fichas existentes, mantendo o gesto explícito atual de fixar ficha; preservar o início livre, a retomada e a decisão existente sobre sessão anterior. Não criar um segundo picker nem alterar automaticamente uma sessão ao escolher ficha.
- [x] Atualizar o E2E para a nova navegação e validar estados, foco, persistência e composição mobile conforme os testes abaixo; manter o restante dos contratos de produto.

### Estados da inicial

| Estado | Conteúdo visível | Ação |
|---|---|---|
| Ficha fixada, sem sessão de hoje em andamento | Data local, nome da ficha com seta | “Começar” chama o fluxo existente com essa ficha |
| Sem ficha fixada | Data local, “Treino livre” com seta para Fichas | “Começar” abre o início rápido existente; não exige criar ficha |
| Sessão de hoje em andamento | Data local, nome da sessão; sem seletor de troca de ficha | “Retomar” abre a mesma sessão, com suas séries |
| Treino de hoje concluído, sem outro em andamento | Volta à composição normal da ficha/treino livre | Um novo começo usa o fluxo existente; não reabre a concluída para edição |
| Sessão de outro dia ainda aberta | Mesma composição normal | O começo mantém a decisão explícita já existente; nunca resolve nem altera o passado silenciosamente |

Nome longo pode quebrar linha, mantendo botão e seletor acessíveis. Não usar fonte menor para fazer caber nem truncar o único identificador do treino de forma ambígua.

O status rotineiro do catálogo permanece consultável em Dados. Falhas e avisos condicionais já existentes, assim como a atualização da PWA, continuam acessíveis; não alterar sua lógica neste slice. Não exibir a situação normal “ao vivo” como decoração na inicial. Rever o texto/local dos avisos só em um escopo específico se ainda causarem atrito.

## Não faz

- Implementar todas as etapas do roteiro abaixo neste PR.
- Redesenhar sessão, editor de ficha, picker, histórico, calendário ou Dados.
- Adotar código da reconstrução do comparativo, trocar o armazenamento ou remover funções porque não aparecem no mock.
- Nova fonte externa, dependência de UI, roteador, conta, auth, sync, D1, Workbox, `develop` ou refatoração estética de `components/ui`.
- Programa #6, execução do débito #7/slice 13, mudanças de CI/deploy ou implementação da issue #1.
- Pedir QA ao dono, alterar produção, criar PR de produto ou publicar durante este planejamento.

## Arquivos

- pode na futura execução: `app/page.tsx`, `app/globals.css`, `e2e/happy-path.spec.ts`, este slice, `docs/slices/README.md`, `docs/design/references/` apenas para os dois mocks aprovados.
- não toca: `lib/`, `components/ui/`, `public/sw.js`, `package.json`, `package-lock.json`, `.github/`, configuração de build/deploy.
- Criar classes/tokens restritos à inicial/menu; não mudar globalmente `.btn`, `.surface` ou tipografia da sessão e das telas secundárias para antecipar etapas.
- O planejamento atual altera somente este documento e o índice de slices.

## Contrato de dados

- `schemaVersion` permanece 2. IndexedDB, stores, chaves e semântica de persistência não mudam; não migrar para localStorage.
- Backup JSON continua versionado e compatível, incluindo fichas, sessões e pin. CSV continua projeção dos registros, com o exportador atual.
- Menu aberto/fechado é estado transitório de interface, não campo persistido.
- Retomar mantém o ID da sessão e todas as séries; navegação não cria sessões nem muta fichas.
- Fixar ficha mantém a semântica atual de `todayPin`; não altera uma sessão já iniciada nem registros antigos.
- Dia continua sendo a data civil local; o exemplo “6 de setembro” do mock não entra no código.
- Correção de dias passados continua acessível pelo calendário. Os problemas conhecidos do slice 13 permanecem registrados e fora deste escopo; este plano não declara que já estão corrigidos.
- Preservar confirmações e validações atuais de importação, diário de exemplo e descarte.

## Testes

Aceite de produto = CI verde, com verificação automatizada do executor. Nenhum teste depende de o dono treinar ou revisar screenshots manualmente.

- Checks da implementação: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build` e `npm run test:e2e`.
- E2E: atualizar `e2e/happy-path.spec.ts` para iniciar livre, registrar série, sair, recarregar, retomar a mesma sessão, finalizar e abrir o calendário pelo menu; verificar ID, série e conclusão persistidos, não apenas presença de botão.
- Retirar a expectativa antiga de launcher em todas as abas. `data-testid="start-workout"` continua no launcher da inicial; atualizar os textos esperados para “Começar”/“Retomar”. O acesso antes identificado por `week-tab` deve ser adaptado ao item do menu sem enfraquecer a verificação do calendário e da sessão concluída.
- Cobrir também ficha fixada, ausência de ficha e sessão anterior aberta com fixtures de teste; comparar os registros passados antes/depois dos caminhos afetados, sem tentar corrigir o débito histórico neste slice.
- Verificar todos os cinco destinos do menu, fechamento, Escape, foco, nome acessível do seletor e operação por teclado. Nenhuma ação pode ficar acessível apenas por ícone sem rótulo acessível.
- Capturas automatizadas em 390 × 844: ficha fixada, treino livre, retomada e menu aberto. Conferir contra o mock final da inicial e a estrutura aprovada da lateral. Verificar também 320 px, largura desktop e zoom de texto de 200%, sem overflow horizontal ou controles cobertos.
- Verificar contraste do texto normal de pelo menos 4,5:1 e dos indicadores/controles de pelo menos 3:1, foco visível e alvos de 48 px; o tamanho do ícone pode ser menor que sua área acionável.
- Testes existentes de backup e calendário continuam passando; preservar o exportador CSV, que ainda não tem teste específico identificado nesta avaliação. Não escrever testes unitários que apenas repitam valores de CSS.
- Planejamento documental: conferir links, estrutura, máximo de cinco itens no Faz e `git diff --check`; não executar testes de app para alteração apenas de Markdown.

## Avaliação do CI/CD e ambiente — 06/09/2026

**Veredito: a esteira existente já permite validar PRs e publicar os ajustes aprovados. Não é necessário criar outra infraestrutura para começar a migração.** Preview publicado por PR e homologação separada não estão configurados; o ambiente de teste anterior ao merge é local/efêmero no CI, e `main` publica em produção.

### Evidência atual

| Verificação | Resultado observado |
|---|---|
| Código local e `main` remoto | `58f115af2cc02deb274fd3a2465340edcdc9dade`; alterações locais desta conversa são apenas o plano e seu índice |
| Última execução de entrega | [Run 33344962875](https://github.com/rleiteoliveira/gymsheet/actions/runs/33344962875), tentativa 3, concluída em 01/09/2026 às 16:55 UTC; jobs `ci` e `deploy` com `success` |
| Verificações no CI | `npm ci`, lint, TypeScript, 24 testes unitários, build, contrato de `dist/` e 1 E2E mobile passaram nessa execução |
| Validação local repetida em 06/09/2026 | 24 testes unitários, lint, TypeScript, build, contrato do artefato e 1 E2E mobile passaram. O E2E rodou com `CI=true`, sem reutilizar servidor anterior |
| Produção consultada nesta avaliação | `build-meta.json` retornou o SHA completo acima e `builtAt: 2026-09-01T16:53:53.326Z`; a página inicial respondeu HTTP 200 com título GymSheet |
| Credenciais GitHub | Secrets de repositório `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` presentes; valores não foram lidos nem exibidos. A última entrega comprova seu uso naquela execução; esta avaliação não faz novo deploy para retestá-los |
| Proteção de `main` | Ruleset ativo `main-protection`, sem bypass: PR obrigatório, squash, check `ci`, bloqueio de exclusão e force push, zero aprovações humanas obrigatórias |
| Isolamento de ambientes | Nenhum GitHub Environment cadastrado; workflow publica somente no push para `main`; PR executa CI sem deploy |
| Destino de execução | Worker `gymsheet`, entrada `dist/server/index.js` e assets `dist/client`; sem bindings D1/R2 na configuração examinada |

A proteção é por ruleset. O endpoint antigo de branch protection retorna 404, o que não significa ausência de proteção. O check obrigatório não exige atualização estrita com a última `main`; continuar integrando mudanças em PRs curtos e conferir o CI do commit atual antes do merge.

### Como testar e entregar cada etapa

1. Preparar a branch de trabalho a partir da `main` atual e executar o slice autorizado.
2. Para desenvolver, usar `npm run dev`. Para validar a entrega, gerar `dist/`, verificar seu contrato e rodar o E2E no Wrangler local, conforme os comandos da seção Testes.
3. O Playwright inicia `npm run start -- --port 8787`, usando o Worker gerado e viewport 390 × 844. No CI ele não reutiliza um servidor anterior. Não precisa de token Cloudflare nem dados reais do dono para esse caminho local.
4. Abrir PR e aguardar o check `ci` do commit atual. Depois do squash em `main`, o CI roda novamente e só então o job `deploy` baixa e publica o mesmo `dist/` validado, sem refazer o build.
5. A entrega termina quando o deploy passa e a verificação de produção encontra o SHA esperado em `build-meta.json`. Isso comprova a versão publicada; não substitui testes do comportamento do treino nem comprova atualização de toda PWA já instalada.

O CI fixa Node 22.13.0 e usa `npm ci`. Nesta máquina foram encontrados Node 24.16.0, npm 11.13.0 e dependências já instaladas. A versão local atende ao mínimo do projeto, mas não reproduz exatamente o runtime do CI; preferir Node 22.13.0 ao investigar divergências. Esta avaliação não alterou a versão do Node.

Na primeira tentativa local do E2E, faltava o executável Chromium exigido pela versão instalada do Playwright. A dependência foi instalada com `npx playwright install chromium` e a repetição passou em 12,8 s. O CI já instala esse navegador no próprio workflow. Não houve mudança de código, secrets, workflow, ambiente remoto ou publicação nesta avaliação.

### Lacunas a considerar na repaginação

- **Cobertura visual:** o E2E atual cobre começar, registrar, sair/retomar, finalizar e abrir Semana/Fichas/Dados. Não compara screenshots, não recarrega para provar persistência e não cobre o novo menu. As verificações da seção Testes deste slice devem ser implementadas junto da inicial.
- **Diagnóstico de falha:** o workflow não publica screenshots, relatório HTML ou traces do Playwright. A configuração usa `trace: on-first-retry`, mas não configura retries. Acrescentar evidências em falha facilitaria revisão; qualquer alteração de workflow/configuração deve ter um recorte próprio de infraestrutura, fora do Faz deste slice, como exige a issue #8.
- **Atualização da PWA:** há cache com identificação do build, network-first e banner de atualização no código atual. Não existe E2E cobrindo a troca de versão com IndexedDB preservado. Planejar um teste específico antes de declarar essa transição validada; o teste estático do SW e o SHA em produção não provam esse comportamento.
- **Preview publicado:** opcional, não bloqueia esta migração nem faz parte da issue #8 entregue. Usar o app local para revisar o desenho e o CI para aceite. Só criar preview remoto em uma demanda explícita, sem acrescentar ambiente permanente por antecipação.
- **Retenção:** o artefato do Worker fica por um dia; o da última entrega já expirou. Para repetir essa entrega, usar uma nova execução completa de CI + deploy, não apenas reexecutar o job de deploy esperando encontrar o artefato antigo. Não houve reexecução remota nesta avaliação.
- **Documentação desatualizada:** a issue #8 está fechada e a entrega passou, mas o slice 24 e o AGENTS ainda indicam execução em andamento. Reconciliar esse status em manutenção documental própria, sem tratar a configuração de deploy como pendência técnica da repaginação.

## Roteiro de migração após este slice

As etapas seguintes são planejamento, não autorização de execução. Cada uma exige seu próprio slice `draft`, issue de intenção, recorte de até cinco itens, promoção a `ready` e PR com CI verde. Não reservar números de issue nem abrir um PR acumulando todo o roteiro.

| Ordem | Entrega | Limite e evidência de saída |
|---|---|---|
| 1 — este slice | Inicial essencial e menu esquerdo | Entrar, começar/retomar e alcançar todas as áreas com os dados preservados. Primeira aplicação dos tokens e das regras de botões. |
| 2 | Sessão de treino | Desenhar a sessão na mesma linguagem antes de implementar. Carga/repetições editáveis diretamente, registrar séries e finalizar continuam rápidos. Avaliar ações por exercício sem esconder a operação frequente em menus. CI cobre registro, troca, pulo, adição e conclusão. |
| 3 | Fichas e seleção de exercícios | Listas simples e ações contextuais. Preservar criar/editar/fixar ficha, busca, favoritos e o caminho livre. Não misturar planejamento da ficha com registro da sessão. |
| 4 | Histórico e calendário | Reduzir decoração e textos, manter datas e registros legíveis. Preservar entrada explícita para correções. Separar a lista de sessões das ações de ficha sem criar cópias de dados; #7 continua dependendo de autorização própria. |
| 5 | Dados e backup | Agrupar exportar/importar e informações de catálogo com rótulos diretos. Preservar JSON, CSV, validação e confirmações. Não transformar a área em conta ou nuvem. |
| 6 | Consolidação do padrão | Extrair o padrão v1 para `docs/design/README.md`, reunir tokens adotados e referências de estados, revisar inconsistências entre as telas migradas e retirar estilos antigos sem consumidores. Não iniciar uma nova reforma visual. |

A coexistência temporária de telas antigas e novas é planejada: controles e navegação continuam funcionais enquanto cada superfície migra. Não mascarar essa diferença com uma substituição global de CSS que altere telas ainda não validadas.

Antes de cada próximo slice, registrar o inventário de ações daquela tela e a justificativa dos botões. A direção aprovada permite continuidade do desenho, mas não autoriza features adicionais nem demanda QA humano. Novas decisões de produto só são levadas ao dono quando realmente mudam o comportamento pretendido.

Cada PR deve ser reversível sem migração de dados. Em caso de regressão introduzida na etapa, corrigir antes do merge ou reverter a alteração de interface pelo fluxo normal do repositório; nunca restaurar os dados do usuário como mecanismo de rollback visual.

## Débito

- Etapas 2–6 aguardam slices próprios. Não redesenhar essas telas por proximidade de código.
- Composição final da sessão e localização de ações menos frequentes ainda precisam de desenho; não extrapolar a tela inicial minimalista para esconder ferramentas durante o treino.
- O atual débito histórico do slice 13, o programa #6 e eventuais problemas anteriores continuam separados. Não declarar prontidão da reconstrução analisada no Figma com base nesta proposta.
- Indicadores/avisos condicionais e a tela Semana conservam conteúdo atual na primeira entrega; reduzir seu ruído, se necessário, exige um recorte explícito posterior.

## Execução — 06/09/2026

- Inicial e menu implementados na variante Essencial A. Navegação usa o Dialog já instalado; o foco passa ao título após o fechamento completo do painel. Seleção de ficha continua explícita.
- Tokens restritos às novas superfícies; sessão e persistência mantêm os contratos existentes. Os dois mocks aprovados estão versionados nos links acima.
- Validação local: 24 testes unitários e 13 cenários E2E; lint, TypeScript, build e verificação do artefato aprovados. E2E verifica IDs, valores de séries e conclusão após recarga, decisões sobre sessão anterior, menu e teclado.
- Capturas temporárias geradas pelo E2E e revisadas pelo executor; casos de 390 × 844, 320 px, desktop e texto a 200%. Artefatos locais não integram o código de produto.
- Aceite remoto depende do check `ci` do commit do PR. Este registro não declara merge nem publicação em produção.

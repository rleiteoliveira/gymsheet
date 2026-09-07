# Slice 33 — Imagens de exercícios, piloto

- Issue: [#44](https://github.com/rleiteoliveira/gymsheet/issues/44)
- Status: draft
- Cabe no próximo treino? sim — melhora reconhecimento no picker sem trocar o catálogo inteiro.

Objetivo: provar um padrão visual próprio em seis movimentos comuns antes de renderizar centenas de imagens. Os IDs e metadados da Free Exercise DB continuam sendo a referência de catálogo; o app passa a preferir um asset local aprovado e usa a foto atual como fallback.

Depende do slice 32 concluído. Antes de promover este slice para `ready`, anexar ao repositório uma referência visual aprovada de um exercício no estilo abaixo. Sem essa referência, o executor prepara somente três opções visuais e para para escolha; não gera o lote.

## Faz

- [ ] Produzir um `thumb.webp`, 768 × 768, para exatamente seis IDs: `Barbell_Bench_Press_-_Medium_Grip`, `Barbell_Squat`, `Barbell_Deadlift`, `Wide-Grip_Lat_Pulldown`, `Dumbbell_Shoulder_Press` e `Barbell_Curl`.
- [ ] Versionar os seis assets em `public/exercises/<id>/thumb.webp` e criar um manifesto explícito dos seis IDs. A resolução é local primeiro; exercício fora do manifesto ou asset que falhar continua usando `images[0]` da Free Exercise DB.
- [ ] No picker, mostrar o asset local com enquadramento inteiro e consistente, preservando texto alternativo, nome e metadados atuais. Não acrescentar imagem à sessão nem criar tela de instruções.
- [ ] Aplicar o prompt e a revisão visual deste slice: mesmo personagem, câmera por família, escala, iluminação, roupa e fundo; rejeitar anatomia, pegada, apoios ou equipamento incoerentes antes de versionar.
- [ ] Adicionar validação automática do manifesto, nomes, dimensões, formato e peso máximo de 160 KB por arquivo; E2E prova asset local no piloto e fallback remoto fora dele, sem depender de comparação subjetiva de screenshot.

## Direção visual e prompt base

- Renderização 3D fosca, limpa e técnica; sem cenário de academia.
- Pessoa adulta de proporções naturais, roupa esportiva cinza sem marca, equipamento grafite.
- Fundo sólido `#191a16`, luz suave, contraste suficiente contra o corpo e o equipamento.
- Composição quadrada, corpo e equipamento completos, margem de segurança de 12%; silhueta legível a 48 px.
- Sem texto incorporado, setas, músculos coloridos, logotipo, efeitos dramáticos ou objetos que não participem do exercício.

```text
Crie uma ilustração de exercício para o GymSheet seguindo rigorosamente a referência visual aprovada anexada.

Exercício: {nome e variante exatos}
ID: {id do catálogo}
Pose: {fase canônica mais reconhecível do exercício}
Equipamento: {equipamento}
Câmera: {ângulo definido para esta família de movimento}

Use a foto correspondente da Free Exercise DB como referência de postura, apoios, pegada, amplitude e geometria do equipamento. Preserve personagem, câmera, materiais, escala e iluminação da referência visual do GymSheet. Pessoa adulta com proporções naturais, roupa esportiva cinza sem marcas, renderização 3D fosca, equipamento grafite, luz suave e fundo sólido #191a16.

Composição 1:1, 768 × 768, corpo e equipamento completos, margem livre de 12%, silhueta clara quando reduzida a 48 px. Sem texto, números, setas, logotipos, cenário de academia, músculos coloridos ou efeitos dramáticos. Não invente equipamento e não corte mãos, pés, pesos, banco, barra, cabo ou máquina.
```

## Não faz

- Gerar ou substituir imagens para os outros exercícios
- Alterar IDs, snapshots, metadados, instruções, nomes, músculos ou equipamento do catálogo
- Tratar imagem gerada como orientação técnica validada, animação, vídeo ou correção de execução
- Traduzir catálogo, criar aliases, favoritos, CDN, serviço de imagem, download em runtime ou novo cache do service worker
- Schema, IndexedDB, backup, CSV, `components/ui`, CI/deploy ou pedir QA ao dono

## Arquivos

- pode: `public/exercises/<seis IDs>/thumb.webp`, `lib/exercise-art.ts`, `app/page.tsx`, `app/globals.css`, `scripts/verify-exercise-art.mjs`, `package.json`, `e2e/happy-path.spec.ts`, este slice, `docs/slices/README.md`
- não toca: `lib/types.ts`, `lib/storage.ts`, `lib/session.ts`, `lib/catalog.ts`, `public/sw.js`, `components/ui/`, `.github/`, configuração de build/deploy

## Contrato de dados

- `schemaVersion` permanece 2; IndexedDB, stores, backup e CSV não mudam.
- Snapshot continua guardando os caminhos originais em `images`; o manifesto visual não é persistido.
- Fallback continua resolvido pela `IMAGE_BASE_URL` atual. O piloto deve funcionar offline apenas depois que o asset local fizer parte do build publicado.

## Testes

- `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run verify:build`, `npm run test:e2e`
- `npm run verify:exercise-art`, sem dependência nova, valida os seis arquivos e falha para item ausente, dimensão diferente de 768 × 768, formato diferente de WebP ou arquivo acima de 160 KB.
- E2E verifica `src` local para um ID piloto, fallback para um ID externo ao piloto e texto alternativo.
- Sem “smoke manual”; revisão visual acontece antes de o asset entrar no commit.

## Débito

- Tradução/aliases e ordenação do picker por recentes/favoritos exigem slice próprio se ainda doer depois dos slices 30 e 31.
- O lote completo só deve ser planejado depois de medir legibilidade, peso total e taxa de fallback deste piloto.

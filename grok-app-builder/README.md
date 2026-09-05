# GymSheet — port no Grok App Builder

Branch `feat/grok-app-builder`. Referência: [rleiteoliveira/gymsheet](https://github.com/rleiteoliveira/gymsheet) (`main`, vinext + Cloudflare).

Este recorte é a migração do app de produção para o projeto Grok:

- mesmo domínio (fichas, sessões, calendário civil local, catálogo free-exercise-db)
- IndexedDB `treino-de-hoje` e backup JSON v1/v2 (e v3 `gymsheet`)
- fluxo de hoje não muta sessão de outro dia; calendário corrige o passado
- paleta mais quieta (papel sobre preto quente) no mesmo layout

A `main` continua sendo a PWA vinext em produção.

## Compatibilidade de backup

O JSON exportado da `main` (`app: "treino-de-hoje"`, schema 1 ou 2) restaura aqui em Dados → Restaurar backup.

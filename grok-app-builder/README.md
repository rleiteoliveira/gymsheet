# GymSheet — snapshot Grok App Builder

Branch de trabalho do Grok (`feat/grok-app-builder`). **Não substitui a app vinext em produção.**

Esta pasta é o recorte de produto reconstruído no Grok App Builder (TanStack Start + Zustand/`localStorage`):

- fichas, sessão ao vivo, histórico semanal
- começar agora / retomar / sessão livre
- editor de plano, catálogo, backup JSON e CSV
- UI mobile-first (Hoje / Fichas / Semana)

A `main` continua sendo a PWA vinext + IndexedDB + Cloudflare Workers.

## O que vem aqui

| caminho | conteúdo |
|---|---|
| `src/components/app/` | telas (hoje, sessão, fichas, editor, histórico, settings) |
| `src/lib/gym/` | domínio (tipos, store, sessão, catálogo, demo, backup) |
| `src/styles.css` | tokens visuais desta reconstrução |
| `src/routes/index.tsx` | entry da rota `/` no scaffold TanStack |
| `public/` | favicon e card OG usados no preview |

Não inclui o scaffold de plataforma do App Builder (`auth`, `db`, `__grok`, scripts internos).

## Como usar

Serve como referência para portar ideias/UI de volta à app vinext, não como deploy.

Se quiser promover alguma parte: fatia em `docs/slices/`, PR curto em `feat/*`.

## Codex WPP Backend (WIP)

Backend em Fastify + Prisma para fluxo de atendimento com FAQ baseado em estados.

### Setup
- Copie `.env.example` para `.env` e ajuste `DATABASE_URL`.
- Instale dependências: `npm i`.
- Gere o cliente Prisma e crie o banco: `npx prisma generate` e `npx prisma migrate dev`.
- Popule dados: `npm seed`.

### Executar
- Dev: `npm dev`.
- Produção: `npm build` e `npm start`.

### Endpoints
- `GET /health` — healthcheck.
- `POST /webhook` — corpo `{ sessionId, message }`.
  - Envie `"faq"` para listar categorias.
  - Envie o nome da categoria para listar Q&A.

### Arquitetura
- `src/state/` — Padrão State (InitialState, FaqMenuState, FaqCategoryState) e contexto.
- `src/state/repository/` — `PrismaFaqRepository`.
- `src/infra/http/server.ts` — servidor Fastify e roteamento do webhook.

### Scripts úteis
- `seed.ts` — cria categorias e perguntas exemplo (sessionId `demo`).
- `clear-database.ts` — limpa tabelas do FAQ.


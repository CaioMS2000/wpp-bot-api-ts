FROM node:lts-alpine AS base

# --- builder: instala deps, compila TS e gera Prisma Client ---
FROM base AS builder
WORKDIR /app

# Copiar manifestos e schema primeiro para aproveitar cache
COPY package*.json ./
COPY prisma ./prisma

RUN npm install

# Copiar restante do código e compilar
COPY . .
RUN npm run build

# Gerar Prisma Client (usa devDeps/CLI do prisma)
RUN npx prisma generate

# Remover devDeps deixando somente dependências de runtime (mantendo Prisma Client gerado)
RUN npm prune --omit=dev

# --- runner: imagem final mínima ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Ensure TLS trust store is present for OTLP HTTPS and other outbound requests
RUN apk add --no-cache ca-certificates

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 api \
 && chown -R api:nodejs /app

# Copiar artefatos necessários
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER api

EXPOSE 8000
ENV PORT=8000

CMD ["node", "build/server.js"]

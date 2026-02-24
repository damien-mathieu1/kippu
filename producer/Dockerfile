FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY producer ./producer

RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile --prod=false

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/producer ./producer
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

RUN pnpm --filter @kippu/producer run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/producer/dist ./dist
COPY --from=builder /app/producer/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

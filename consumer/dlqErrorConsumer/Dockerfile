FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY shared ./shared
COPY consumer/dlqErrorConsumer ./consumer/dlqErrorConsumer

RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile --prod=false

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared ./shared
COPY --from=deps /app/consumer/dlqErrorConsumer ./consumer/dlqErrorConsumer
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

RUN pnpm --filter @kippu/shared run build && \
    pnpm --filter @kippu/dlq-error-manager run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/consumer/dlqErrorConsumer/dist ./dist
COPY --from=builder /app/consumer/dlqErrorConsumer/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

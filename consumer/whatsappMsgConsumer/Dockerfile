# ─── Stage 1: Install dependencies ────────────────────────────────────────────
# Build context: repo root  (docker build -f consumer/whatsappMsgConsumer/Dockerfile .)
FROM node:20-alpine AS deps

WORKDIR /app

# Copy monorepo manifests first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy only the package.json of workspace members needed for pnpm to resolve the graph
COPY shared/package.json                                    ./shared/package.json
COPY consumer/whatsappMsgConsumer/package.json              ./consumer/whatsappMsgConsumer/package.json

RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile

# ─── Stage 2: Build shared, then the consumer, then deploy ────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules                                      ./node_modules
COPY --from=deps /app/shared/node_modules                               ./shared/node_modules
COPY --from=deps /app/consumer/whatsappMsgConsumer/node_modules         ./consumer/whatsappMsgConsumer/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/   ./shared/
COPY consumer/whatsappMsgConsumer/ ./consumer/whatsappMsgConsumer/

RUN corepack enable pnpm && \
    # 1. Build @kippu/shared first (generates dist/ + copies SQL files)
    pnpm --filter @kippu/shared run build && \
    # 2. Build the consumer
    pnpm --filter @kippu/whatsapp-consumer run build && \
    # 3. Create a self-contained production deployment (resolves all deps incl. workspace:*)
    pnpm deploy --legacy --filter @kippu/whatsapp-consumer --prod /deploy

# ─── Stage 3: Lean production image ───────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# pnpm deploy produces a fully self-contained directory:
# dist/, package.json, node_modules/ (with @kippu/shared inlined)
COPY --from=builder /deploy .

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

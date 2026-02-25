# ─── Stage 1: Install dependencies ────────────────────────────────────────────
# Build context: repo root  (docker build -f consumer/mailMsgConsumer/Dockerfile .)
FROM node:20-alpine AS deps

WORKDIR /app

# Copy monorepo manifests first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy only the package.json of workspace members needed for pnpm to resolve the graph
COPY shared/package.json                            ./shared/package.json
COPY consumer/mailMsgConsumer/package.json          ./consumer/mailMsgConsumer/package.json

RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile

# ─── Stage 2: Build shared, then the consumer ─────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules                              ./node_modules
COPY --from=deps /app/shared/node_modules                       ./shared/node_modules
COPY --from=deps /app/consumer/mailMsgConsumer/node_modules     ./consumer/mailMsgConsumer/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/   ./shared/
COPY consumer/mailMsgConsumer/ ./consumer/mailMsgConsumer/

RUN corepack enable pnpm && \
    # 1. Build @kippu/shared first (generates dist/ + copies SQL files)
    pnpm --filter @kippu/shared run build && \
    # 2. Build the consumer
    pnpm --filter @kippu/mail-consumer run build

# ─── Stage 3: Lean production image ───────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy compiled output from consumer
COPY --from=builder /app/consumer/mailMsgConsumer/dist ./dist
COPY --from=builder /app/consumer/mailMsgConsumer/package.json ./package.json

# Copy compiled @kippu/shared (required at runtime)
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

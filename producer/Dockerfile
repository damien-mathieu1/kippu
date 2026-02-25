# ─── Stage 1: Install dependencies ────────────────────────────────────────────
# Build context: repo root  (docker build -f producer/Dockerfile .)
FROM node:20-alpine AS deps

WORKDIR /app

# Copy monorepo manifests first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy only the package.json of workspace members needed for pnpm to resolve the graph
COPY producer/package.json ./producer/package.json

RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile

# ─── Stage 2: Build the producer, then deploy ─────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules          ./node_modules
COPY --from=deps /app/producer/node_modules ./producer/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY producer/ ./producer/

RUN corepack enable pnpm && \
    # 1. Build the producer
    pnpm --filter @kippu/producer run build && \
    # 2. Create a self-contained production deployment (resolves all deps)
    pnpm deploy --legacy --filter @kippu/producer --prod /deploy

# ─── Stage 3: Lean production image ───────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# pnpm deploy produces a fully self-contained directory:
# dist/, package.json, node_modules/
COPY --from=builder /deploy .

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

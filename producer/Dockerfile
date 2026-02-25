# ─── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy monorepo manifests first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy only package.json of workspace members needed for install
COPY shared/package.json ./shared/package.json
COPY producer/package.json ./producer/package.json

# Copy source files needed for install resolution
COPY producer/src ./producer/src

RUN corepack enable pnpm && \
    pnpm install --frozen-lockfile

# ─── Stage 2: Build the producer ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/producer/node_modules ./producer/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY producer/ ./producer/

RUN corepack enable pnpm && \
    pnpm --filter @kippu/producer run build

# ─── Stage 3: Lean production image ───────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/producer/dist ./dist
COPY --from=builder /app/producer/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

# ============================================
# Stage 1: Install dependencies
# ============================================

FROM oven/bun:1-slim AS dependencies

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* bunfig.toml* ./

# Dùng cache mount và chạy bun native (nhanh gấp 5 lần so với chạy bun trên node image)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --no-save

# ============================================
# Stage 2: Build the Next.js application
# ============================================

FROM node:22-slim AS builder

WORKDIR /app

# Install openssl for Prisma build
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=true
ENV NEXT_PUBLIC_SENTRY_DISABLED=true
ENV NEXT_MANUAL_SIG_HANDLE=true
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Next.js build-time variables (pass from compose or --build-arg)
ARG NEXT_PUBLIC_APP_URL=https://tiemnho.vn
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Prisma client generation & Build
RUN npx prisma generate
RUN npx next build --no-lint

# ============================================
# Stage 3: Production runner
# ============================================

FROM node:22-slim AS runner

WORKDIR /app

# Install openssl for runtime Prisma queries
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy public assets & static files
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Persistent upload dir
RUN mkdir -p uploads && chown -R node:node uploads
RUN mkdir -p .next && chown -R node:node .next

USER node

EXPOSE 3000

CMD ["node", "server.js"]

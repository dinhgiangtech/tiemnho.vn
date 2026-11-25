# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-slim AS deps
WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files & Prisma schema
COPY package.json ./
COPY prisma ./prisma/

# Cài đặt dependencies chuẩn xác với npm install
RUN npm install --legacy-peer-deps --no-audit

# Generate Prisma Client ngay trong deps
RUN npx prisma generate

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-slim AS builder
WORKDIR /app

# Install openssl for build
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Environment variables for build stage
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV BUILD_STANDALONE=true
ENV NEXT_PUBLIC_SENTRY_DISABLED=true
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tiemnho_db?schema=public"
ENV SESSION_SECRET="build-time-fallback-dummy-session-secret-min-32-chars-long"
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Next.js build-time variables
ARG NEXT_PUBLIC_APP_URL=https://tiemnho.vn
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build Next.js application (tắt Turbopack build ngốn RAM, dùng webpack chuẩn sản xuất)
RUN --mount=type=cache,target=/app/.next/cache \
    npx next build --webpack

# ============================================
# Stage 3: Runner
# ============================================
FROM node:22-slim AS runner
WORKDIR /app

# Install openssl runtime for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built artifacts and static files
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Persistent upload dir
RUN mkdir -p uploads && chown -R node:node uploads
RUN mkdir -p .next && chown -R node:node .next

USER node

EXPOSE 3000

CMD ["node", "server.js"]

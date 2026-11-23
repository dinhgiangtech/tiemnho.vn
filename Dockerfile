# ============================================
# Stage 1: Install dependencies
# ============================================

ARG NODE_VERSION=22-slim

FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies using npm clean install with network timeout tolerance
RUN npm ci --prefer-offline --no-audit

# ============================================
# Stage 2: Build the Next.js application
# ============================================

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Install openssl for Prisma build
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=true
ENV NEXT_PUBLIC_SENTRY_DISABLED=true
# Giới hạn số worker của Next.js về 1 để tránh spawn nhiều tiến trình ngốn RAM trên VPS nhỏ
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

FROM node:${NODE_VERSION} AS runner

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

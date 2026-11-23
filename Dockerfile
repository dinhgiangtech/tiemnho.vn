# ============================================
# Stage 1: Install dependencies
# ============================================

ARG NODE_VERSION=22-slim

FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install bun to use bun.lock for fast dependency resolution
RUN npm install -g bun

# Copy package-related files to leverage Docker cache
COPY package.json bun.lock* package-lock.json* ./

# Install dependencies
RUN bun install --no-save

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

# Next.js build-time variables (pass from compose or --build-arg)
ARG NEXT_PUBLIC_APP_URL=https://tiemnho.vn
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Prisma client generation & Build
RUN npx prisma generate
RUN npm run build

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

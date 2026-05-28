# CyberEdu Zero-Trust Academy - Docker Image
# Multi-stage build for optimal size and security

# ============================================
# Stage 1: Build Rust WASM modules
# ============================================
FROM rust:1.75-slim as wasm-builder

WORKDIR /app

# Install wasm-pack
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Copy WASM project
COPY packages/core-wasm ./packages/core-wasm

# Build WASM modules for web target
WORKDIR /app/packages/core-wasm
RUN wasm-pack build --target web --release

# ============================================
# Stage 2: Build Next.js application
# ============================================
FROM node:20-alpine as builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

# Set build arguments
ARG NEXT_PUBLIC_APP_VERSION=development

# Copy package files
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/core-wasm/package.json ./packages/core-wasm/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Copy built WASM modules from previous stage
COPY --from=wasm-builder /app/packages/core-wasm/pkg ./packages/core-wasm/pkg

# Build roadmap and validate
RUN pnpm ts-node scripts/build-roadmap.ts
RUN pnpm ts-node scripts/validate-roadmap.ts
RUN pnpm ts-node scripts/obfuscate-flags.ts

# Build Next.js application
WORKDIR /app/apps/web
RUN pnpm build

# ============================================
# Stage 3: Production runtime
# ============================================
FROM node:20-alpine as production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy built assets from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Set ownership
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]

# ============================================
# Stage 4: Development image (optional)
# ============================================
FROM node:20-alpine as development

WORKDIR /app

# Install dependencies for development
RUN apk add --no-cache git openssh-client curl

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

# Install Rust for WASM development
RUN apk add --no-cache rust cargo

# Install wasm-pack
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Copy package files
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/core-wasm/package.json ./packages/core-wasm/

# Install all dependencies (including devDependencies)
RUN pnpm install

# Copy source code
COPY . .

# Expose port for Next.js dev server
EXPOSE 3000

# Expose port for TypeScript language server (if using remote development)
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=development
ENV WATCHPACK_POLLING=true

# Start development server
CMD ["pnpm", "dev"]

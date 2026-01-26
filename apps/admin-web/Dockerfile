# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml* ./

# Copy package.json files for workspace packages
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY apps/admin-web/package.json ./apps/admin-web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/tsconfig/ ./packages/tsconfig/
COPY packages/eslint-config/ ./packages/eslint-config/
COPY packages/shared-types/ ./packages/shared-types/
COPY packages/shared-utils/ ./packages/shared-utils/
COPY apps/admin-web/ ./apps/admin-web/

# Build shared packages first
RUN pnpm --filter @hypermarket/shared-types build
RUN pnpm --filter @hypermarket/shared-utils build

# Build the admin web app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @hypermarket/admin-web build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy standalone build
COPY --from=builder /app/apps/admin-web/.next/standalone ./
COPY --from=builder /app/apps/admin-web/.next/static ./apps/admin-web/.next/static
COPY --from=builder /app/apps/admin-web/public ./apps/admin-web/public

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001 || exit 1

# Start the application
CMD ["node", "apps/admin-web/server.js"]

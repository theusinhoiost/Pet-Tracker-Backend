# Multi-stage production build for PetTracker NestJS Backend
# -------------------------------------------------------------------
# Stage 1: Build stage
# -------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package definition files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy configurations and source files
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Build production artifacts
RUN pnpm run build

# Remove development dependencies
RUN pnpm prune --prod

# -------------------------------------------------------------------
# Stage 2: Production runner stage
# -------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Run as non-root user
USER node

# Copy built app and production dependencies
COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main"]

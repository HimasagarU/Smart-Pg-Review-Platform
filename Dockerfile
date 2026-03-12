# Use Node.js 18 slim (Debian-based) to naturally prevent Prisma OpenSSL/musl issues
FROM node:18-slim AS builder

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY infra/package*.json ./infra/

# Install all dependencies precisely where they belong
RUN npm install
RUN cd apps/backend && npm install
RUN cd infra && npm install

# Copy application code
COPY . .

# Generate Prisma Client in BOTH places:
# 1. Root node_modules (for infra scripts)
RUN cd infra && npx prisma generate
# 2. apps/backend/node_modules (for runtime — this is where @prisma/client resolves)
RUN cd apps/backend && npx prisma generate --schema=../../infra/prisma/schema.prisma

# Build the TypeScript backend code
RUN cd apps/backend && npm run build

# --- Production Image ---
FROM node:18-slim AS production

# Install OpenSSL for runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built assets and necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
# Copy the generated Prisma client (written to root node_modules/.prisma by `prisma generate`)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/infra ./infra

# Expose backend port
EXPOSE 4000

# Start command
CMD ["node", "apps/backend/dist/index.js"]

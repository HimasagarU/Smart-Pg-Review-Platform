# Use Node.js 18 Alpine as base image for a small footprint
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY infra/package*.json ./infra/

# Install dependencies needed for build
RUN npm install && cd apps/backend && npm install && cd ../../infra && npm install

# Copy application code
COPY . .

# Generate Prisma Client
RUN cd infra && npx prisma generate

# Build the TypeScript backend code
RUN cd apps/backend && npm run build

# --- Production Image ---
FROM node:18-alpine AS production

WORKDIR /app

# Copy built assets and necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/infra ./infra

# Expose backend port
EXPOSE 4000

# Start command
CMD ["node", "apps/backend/dist/index.js"]

# ── Stage 1: Base & Dependencies ──────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install build dependencies for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

# ── Stage 2: Development ──────────────────────────────────────────────────────
FROM base AS development

WORKDIR /app

RUN npm install

COPY . .

EXPOSE 8081

CMD ["npm", "run", "start:dev"]

# ── Stage 3: Builder ──────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /app

RUN npm ci --include=dev

COPY . .

RUN npm run build

# ── Stage 4: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN apk add --no-cache python3 make g++ \
 && npm ci --omit=dev \
 && apk del python3 make g++

# Copy compiled output and static assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/templates ./templates

# Ensure uploads directory exists
RUN mkdir -p uploads

EXPOSE 8081

CMD ["node", "dist/main"]

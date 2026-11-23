# ----------- Stage 1: Builder -----------
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./

RUN npm install --legacy-peer-deps

# Copy full source
COPY . .



# ----------- Stage 2: Production -----------
FROM node:22-slim

WORKDIR /app

# Only copy package.json to install production deps
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev --legacy-peer-deps \
    && npm cache clean --force

# Copy built app from builder
COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]

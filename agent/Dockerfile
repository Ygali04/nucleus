FROM node:20-slim

WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --include=dev

# Copy source
COPY tsconfig.json ./
COPY agents ./agents
COPY tools ./tools
COPY src ./src
COPY nucleus-swarm.config.ts ./

# Compile TypeScript
RUN npx tsc

# Strip dev deps after build
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=9000
EXPOSE 9000

CMD ["node", "dist/src/server.js"]

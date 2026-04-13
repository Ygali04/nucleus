# Nucleus Remotion render service
#
# Runs the HTTP render API on port 8089 (RENDER_PORT). Remotion drives
# Chromium via Puppeteer, so we install the system Chromium plus the
# font + graphics libraries the headless browser needs.

FROM node:20-slim

# Chromium + fonts + libs required by the headless renderer.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        ca-certificates \
        fonts-liberation \
        fonts-noto-color-emoji \
        libnss3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libgbm1 \
        libpango-1.0-0 \
        libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Tell @remotion/renderer to use the system Chromium instead of downloading one.
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production
ENV RENDER_PORT=8089

WORKDIR /app

COPY package.json ./
# package-lock.json is optional — include it if it exists so we can `npm ci`.
COPY package-lock.json* ./
RUN npm install

COPY . .

RUN mkdir -p /app/out

EXPOSE 8089

CMD ["npm", "run", "render-api"]

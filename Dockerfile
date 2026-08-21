# kane-loop — public QA console.
# Kane drives a real Chromium, so the image ships one.
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation curl \
 && apt-get clean

ENV CHROME_PATH=/usr/bin/chromium \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    KANE_EXTRA_ARGS="--headless --max-steps 15" \
    NODE_ENV=production

RUN npm install -g @testmuai/kane-cli bun

WORKDIR /app
COPY package.json ./
COPY app ./app
COPY src ./src
COPY flows ./flows
COPY loop.ts ./

EXPOSE 3000
ENV PORT=3000 HOST=0.0.0.0
CMD ["bun", "app/server.ts"]

FROM node:22-slim AS build
WORKDIR /app
# build-essential/python3 are a fallback in case better-sqlite3 has no
# prebuilt binary for this platform and needs to compile from source
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
VOLUME ["/app/data"]
ENV DB_PATH=/app/data/bookie.db
CMD ["node", "dist/index.js"]

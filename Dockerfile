# Multi-stage Next standalone image (bookworm build + bookworm-slim runner).
# Larger/safe COPY of node_modules so prisma migrate deploy works in the runner.
ARG NODE_VERSION=24-bookworm

FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Dummy URL so prisma.config env() resolves during postinstall generate.
ENV DATABASE_URL=file:./data/wallet.db
RUN npm ci \
  && npm --prefix node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3 run build-release

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:./data/wallet.db
RUN npx prisma generate && npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/data/wallet.db

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data \
  && chown node:node /data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
# Generated client is imported at runtime from src/generated (not always in NFT).
COPY --from=builder /app/src/generated ./src/generated
# Prefer full production node_modules over minimal NFT for migrate + better-sqlite3.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/docker/entrypoint.sh ./docker/entrypoint.sh

RUN chmod +x ./docker/entrypoint.sh \
  && chown -R node:node /app

USER node
EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]

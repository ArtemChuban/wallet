# wallet-web multi-stage image (Next standalone + Prisma migrate overlay).
# Tried node:24-alpine first (same-libc deps+builder+runner); better-sqlite3 node-gyp
# failed (ETIMEDOUT fetching musl node headers from unofficial-builds). Ship default:
# node:24-bookworm-slim. Retry alpine with:
#   docker build --build-arg NODE_IMAGE=node:24-alpine -t wallet-web:migrate .
# Measurement twin without Prisma CLI overlay (not ship default):
#   docker build --target runner-no-migrate -t wallet-web:no-migrate .
#   (sets SKIP_MIGRATE=1; production ENTRYPOINT still migrate-then-server)

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
# apk (alpine) vs apt (bookworm-slim) toolchain for better-sqlite3 native rebuild.
RUN if command -v apk >/dev/null 2>&1; then \
      apk add --no-cache python3 make g++; \
    else \
      apt-get update \
      && apt-get install -y --no-install-recommends python3 make g++ \
      && rm -rf /var/lib/apt/lists/*; \
    fi
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# Dummy URL so prisma.config env() resolves during postinstall generate.
ENV DATABASE_URL=file:./data/wallet.db
RUN npm ci && npm rebuild better-sqlite3

FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:./data/wallet.db
RUN npx prisma generate && npm run build

# Dedicated production closure for prisma CLI (Prisma 7 peers: effect/fast-check/…).
FROM ${NODE_IMAGE} AS prisma-cli
WORKDIR /prisma-cli
COPY --from=builder /app/package.json /tmp/pkg.json
RUN npm init -y >/dev/null \
  && npm install --omit=dev --no-audit --no-fund \
       "prisma@$(node -p "require('/tmp/pkg.json').dependencies.prisma")" \
  && du -sh /prisma-cli

# Shared runner OS + app artifacts (no prisma-cli overlay yet).
FROM ${NODE_IMAGE} AS runner-base
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/data/wallet.db

RUN if command -v apk >/dev/null 2>&1; then \
      apk add --no-cache openssl ca-certificates; \
    else \
      apt-get update \
      && apt-get install -y --no-install-recommends openssl ca-certificates \
      && rm -rf /var/lib/apt/lists/*; \
    fi \
  && mkdir -p /data \
  && chown node:node /data

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/src/generated ./src/generated
COPY --from=builder --chown=node:node /app/docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

# Measurement-only twin: no Prisma CLI overlay; entrypoint skips migrate (SKIP_MIGRATE).
# Build: docker build --target runner-no-migrate -t wallet-web:no-migrate .
FROM runner-base AS runner-no-migrate
ENV SKIP_MIGRATE=1
USER node
EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]

# Ship path (default final stage): merge prisma-cli into standalone NFT tree (do not wipe).
FROM runner-base AS runner
COPY --from=prisma-cli --chown=node:node /prisma-cli/node_modules/ ./node_modules/
USER node
EXPOSE 3000
ENTRYPOINT ["./docker/entrypoint.sh"]

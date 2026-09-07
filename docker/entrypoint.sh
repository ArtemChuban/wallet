#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:/data/wallet.db}"

# SKIP_MIGRATE=1 is for wallet-web:no-migrate measurement images only.
if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  echo "prisma migrate deploy (DATABASE_URL=${DATABASE_URL})"
  ./node_modules/.bin/prisma migrate deploy
else
  echo "SKIP_MIGRATE=1 — skipping prisma migrate deploy (measurement image)"
fi

echo "starting Next.js standalone server"
exec node server.js

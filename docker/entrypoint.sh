#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:/data/wallet.db}"

echo "prisma migrate deploy (DATABASE_URL=${DATABASE_URL})"
./node_modules/.bin/prisma migrate deploy

echo "starting Next.js standalone server"
exec node server.js

#!/usr/bin/env bash
# Persist smoke for PLAT-01: SQLite on host ./data survives compose down/up.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MARKER_AMOUNT=991122334455
HEALTH_URL="http://127.0.0.1:3000/api/health"
MAX_WAIT_TRIES=40

log() { printf '%s\n' "$*"; }
die() { printf 'smoke-persist: %s\n' "$*" >&2; exit 1; }

mkdir -p data
chmod 700 data 2>/dev/null || log "warning: could not chmod 700 data (continuing)"

wait_health() {
  local i code
  for i in $(seq 1 "$MAX_WAIT_TRIES"); do
    code="$(curl -s -o /tmp/wallet-health.json -w '%{http_code}' "$HEALTH_URL" || echo 000)"
    if [[ "$code" == "200" ]] && grep -q '"status":"ok"' /tmp/wallet-health.json 2>/dev/null; then
      log "health ok (try $i)"
      return 0
    fi
    sleep 3
  done
  die "health never returned 200 ok within ~$((MAX_WAIT_TRIES * 3))s"
}

insert_marker() {
  node <<EOF
const Database = require("better-sqlite3");
const db = new Database("data/wallet.db");
db.prepare("DELETE FROM BalanceAmountStub WHERE amountMinor = ?").run(BigInt("${MARKER_AMOUNT}"));
db.prepare("INSERT INTO BalanceAmountStub (amountMinor) VALUES (?)").run(BigInt("${MARKER_AMOUNT}"));
db.close();
console.log("marker inserted amountMinor=${MARKER_AMOUNT}");
EOF
}

assert_marker() {
  node <<EOF
const Database = require("better-sqlite3");
const db = new Database("data/wallet.db", { readonly: true });
const row = db.prepare(
  "SELECT COUNT(*) AS c FROM BalanceAmountStub WHERE amountMinor = ?"
).get(BigInt("${MARKER_AMOUNT}"));
db.close();
if (!row || Number(row.c) < 1) {
  console.error("marker row missing after restart");
  process.exit(1);
}
console.log("marker present amountMinor=${MARKER_AMOUNT}");
EOF
}

log "compose up --build"
docker compose up -d --build
wait_health

# Release SQLite locks before host-side marker write (same bind-mount inode).
docker compose stop web
insert_marker
test -f data/wallet.db || die "data/wallet.db missing after marker insert"

log "compose down"
docker compose down
test -f data/wallet.db || die "data/wallet.db missing after compose down"

log "compose up (restart)"
docker compose up -d
wait_health
assert_marker
test -f data/wallet.db || die "data/wallet.db missing after restart"

log "smoke-persist: PASS"
exit 0

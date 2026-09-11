# Wallet

Local single-user net-worth tracker. Runs in Docker; SQLite stays on the host under `./data`.

## Quick start (Docker)

```bash
chmod 700 data   # T-01-02: restrict host DB directory (mode 700)
docker compose up --build
```

Open [http://127.0.0.1:3000/](http://127.0.0.1:3000/) — port publishes to loopback only (`127.0.0.1:3000:3000`, T-01-01).

Ready page shows «Кошелёк готов» when the UI is up; `/api/health` returns `{"status":"ok"}` only when the migrated SQLite DB is reachable.

Stop:

```bash
docker compose down
```

SQLite file `./data/wallet.db` remains on the host (bind mount `./data:/data`, `DATABASE_URL=file:/data/wallet.db` in the container).

## MCP (Claude Code / Cursor)

Wallet must already be running on `127.0.0.1:3000` (Quick start above).

### Claude Code

```bash
claude mcp add --transport http wallet http://127.0.0.1:3000/api/mcp
```

Or add to Claude MCP config:

```json
{
  "mcpServers": {
    "wallet": {
      "type": "http",
      "url": "http://127.0.0.1:3000/api/mcp"
    }
  }
}
```

### Cursor

Project `.cursor/mcp.json` or user `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "wallet": {
      "type": "http",
      "url": "http://127.0.0.1:3000/api/mcp"
    }
  }
}
```

## Host data contract

| Path | Role |
|------|------|
| `./data` | Host bind-mount target (mode `700` recommended) |
| `./data/wallet.db` | SQLite database (gitignored) |
| `/data/wallet.db` | Same file inside the container |

Never copy `*.db` into the image. Migrations run on container start via `docker/entrypoint.sh` (`prisma migrate deploy` then `node server.js`).

Persist smoke (wave-gate; may take several minutes):

```bash
./scripts/smoke-persist.sh
```

## Local development (optional)

```bash
cp .env.example .env   # DATABASE_URL=file:./data/wallet.db
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://127.0.0.1:3000/](http://127.0.0.1:3000/).

## SQLite journal mode

Default on native Linux (e.g. btrfs): **WAL** with foreign keys and `busy_timeout` (see `src/lib/db.ts`).

If the host filesystem is virtiofs/NFS and WAL proves unsafe, fall back to **DELETE** journal mode and document the change for that environment.

## Stack pins

- Next.js 16.3.4 (App Router, `output: "standalone"`)
- Prisma 7.10.0 + `@prisma/adapter-better-sqlite3` + `better-sqlite3@13.0.3`
- shadcn/ui on Tailwind

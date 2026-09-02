import { existsSync, mkdirSync, readFileSync, accessSync, constants, rmSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";

/**
 * Phase 01 Nyquist coverage: scaffold pins, shadcn shell, security binds.
 * Behavioral checks against on-disk contracts (PLAT-01).
 */
describe("package pins (PLAT-01 / 01-01-02)", () => {
  it("pins next 16.3.4 and prisma 7.10.0", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    const next = pkg.dependencies?.next;
    const prisma = pkg.dependencies?.prisma ?? pkg.devDependencies?.prisma;
    expect(next === "16.3.4" || next === "^16.3.4").toBe(true);
    expect(String(prisma)).toContain("7.10.0");
    expect(pkg.scripts?.test).toBe("vitest run");
  });

  it("enables Next standalone output", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).toMatch(/output:\s*["']standalone["']/);
  });
});

describe("Wave 0 harness (PLAT-01 / 01-W0-01)", () => {
  it("ships vitest config targeting src tests", () => {
    expect(existsSync("vitest.config.ts")).toBe(true);
    const config = readFileSync("vitest.config.ts", "utf8");
    expect(config).toMatch(/src\/\*\*\/\*\.test\.ts/);
  });
});

describe("CONTEXT checkpoints (01-01-01 / 01-03-01)", () => {
  it("locks D-01 Next stack and D-07 money contract in CONTEXT", () => {
    const ctx = readFileSync(
      ".planning/phases/01-docker-sqlite-foundation/01-CONTEXT.md",
      "utf8",
    );
    expect(ctx).toMatch(/\*\*D-01:\*\*/);
    expect(ctx).toMatch(/\*\*D-07:\*\*/);
  });
});

describe("shadcn shell (PLAT-01 / 01-02-01 / 01-02-02)", () => {
  it("exposes components.json, cn helper, and globals.css", async () => {
    expect(existsSync("components.json")).toBe(true);
    expect(existsSync("src/app/globals.css")).toBe(true);
    expect(existsSync("src/components/ui")).toBe(true);
    const { cn } = await import("./utils");
    expect(cn("a", "b")).toContain("a");
    expect(typeof cn).toBe("function");
  });

  it("wires globals.css into App Router layout", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toMatch(/globals\.css/);
  });
});

describe("Docker security binds (PLAT-01 / 01-04-03)", () => {
  it("publishes only 127.0.0.1:3000:3000", () => {
    const compose = readFileSync("docker-compose.yml", "utf8");
    expect(compose).toContain("127.0.0.1:3000:3000");
    expect(compose).not.toMatch(/^\s*-\s*"?3000:3000"?\s*$/m);
  });

  it("runs as USER node and never copies .db into image", () => {
    const dockerfile = readFileSync("Dockerfile", "utf8");
    expect(dockerfile).toMatch(/USER\s+node/);
    expect(dockerfile).not.toMatch(/COPY.*\.db|ADD.*\.db/);
  });

  it("entrypoint runs migrate deploy before server", () => {
    const entry = readFileSync("docker/entrypoint.sh", "utf8");
    expect(entry).toMatch(/migrate deploy/);
    expect(entry).toMatch(/server\.js/);
  });
});

describe("persist smoke script (PLAT-01 / 01-04-02 scaffold)", () => {
  it("exists and is executable", () => {
    expect(existsSync("scripts/smoke-persist.sh")).toBe(true);
    accessSync("scripts/smoke-persist.sh", constants.X_OK);
    const body = readFileSync("scripts/smoke-persist.sh", "utf8");
    expect(body).toMatch(/docker compose/);
    expect(body).toMatch(/wallet\.db/);
  });
});

describe("prisma migrate deploy host gate (PLAT-01 / 01-03-03)", () => {
  it("applies committed migration to a fresh file DB", () => {
    const dir = join("data", ".nyquist-migrate");
    const dbPath = join(dir, "wallet.db");
    mkdirSync(dir, { recursive: true });
    rmSync(dbPath, { force: true });
    rmSync(`${dbPath}-wal`, { force: true });
    rmSync(`${dbPath}-shm`, { force: true });

    execFileSync(
      "npx",
      ["prisma", "migrate", "deploy"],
      {
        env: { ...process.env, DATABASE_URL: `file:./${dbPath}` },
        stdio: "pipe",
      },
    );

    expect(existsSync(dbPath)).toBe(true);
    const db = new Database(dbPath, { readonly: true });
    try {
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Currency','Account','FxRateStub','BalanceAmountStub','_prisma_migrations')",
        )
        .all() as Array<{ name: string }>;
      expect(tables.map((t) => t.name).sort()).toEqual([
        "Account",
        "BalanceAmountStub",
        "Currency",
        "FxRateStub",
        "_prisma_migrations",
      ].sort());
      const applied = db
        .prepare(
          "SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL",
        )
        .all() as Array<{ migration_name: string }>;
      expect(applied.some((r) => r.migration_name.includes("init_platform_stub"))).toBe(
        true,
      );
      expect(
        applied.some((r) => r.migration_name.includes("currency_primary_rub")),
      ).toBe(true);
      expect(
        applied.some((r) => r.migration_name.includes("account_credit_limit")),
      ).toBe(true);

      const rub = db
        .prepare(
          'SELECT code, name, scale, isPrimary FROM "Currency" WHERE code = ?',
        )
        .get("RUB") as
        | { code: string; name: string; scale: number; isPrimary: number }
        | undefined;
      expect(rub).toEqual({
        code: "RUB",
        name: "Рубль",
        scale: 2,
        isPrimary: 1,
      });

      const indexes = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='index' AND name = 'Currency_one_primary'",
        )
        .all() as Array<{ name: string }>;
      expect(indexes).toEqual([{ name: "Currency_one_primary" }]);
    } finally {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

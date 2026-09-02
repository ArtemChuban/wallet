import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  sqlitePragmasApplied?: boolean;
};

function createPrismaClient(): PrismaClient {
  // Host tooling default; Compose overrides to file:/data/wallet.db (Plan 04).
  const url = process.env.DATABASE_URL ?? "file:./data/wallet.db";
  const adapter = new PrismaBetterSqlite3({ url, timeout: 5000 });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Prefer WAL + FK + busy_timeout on native btrfs hosts.
 * Fall back to DELETE journal_mode if host FS (virtiofs/NFS) proves unsafe.
 */
export async function ensureSqlitePragmas(): Promise<void> {
  if (globalForPrisma.sqlitePragmasApplied) return;
  await prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL");
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys=ON");
  await prisma.$executeRawUnsafe("PRAGMA busy_timeout=5000");
  globalForPrisma.sqlitePragmasApplied = true;
}

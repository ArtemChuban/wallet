import { NextResponse } from "next/server";
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Readiness: 200 only when SQLite is reachable and at least one migration applied.
 * Accepts no query params (path is fixed).
 */
export async function GET() {
  try {
    await ensureSqlitePragmas();
    await prisma.$queryRaw`SELECT 1`;
    const rows = await prisma.$queryRaw<Array<{ c: number | bigint }>>`
      SELECT COUNT(*) AS c FROM _prisma_migrations
    `;
    const count = Number(rows[0]?.c ?? 0);
    if (count < 1) {
      return NextResponse.json({ status: "not_ready" }, { status: 503 });
    }
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "not_ready" }, { status: 503 });
  }
}

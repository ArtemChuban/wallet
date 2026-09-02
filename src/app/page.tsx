import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getDbReadiness(): Promise<"ok" | "not_ready"> {
  try {
    await ensureSqlitePragmas();
    await prisma.$queryRaw`SELECT 1`;
    const rows = await prisma.$queryRaw<Array<{ c: number | bigint }>>`
      SELECT COUNT(*) AS c FROM _prisma_migrations
    `;
    return Number(rows[0]?.c ?? 0) > 0 ? "ok" : "not_ready";
  } catch {
    return "not_ready";
  }
}

export default async function Home() {
  const dbStatus = await getDbReadiness();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 font-sans">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Кошелёк готов
      </h1>
      <p className="text-muted-foreground" data-db-status={dbStatus}>
        База данных: {dbStatus === "ok" ? "готова" : "не готова"}
      </p>
    </main>
  );
}

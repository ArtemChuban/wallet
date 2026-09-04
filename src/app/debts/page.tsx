import { DebtsList } from "@/components/debts/DebtsList";
import { PersonFormDialog } from "@/components/debts/PersonFormDialog";
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  await ensureSqlitePragmas();
  const peopleRaw = await prisma.person.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { debts: true } },
    },
  });

  const people = peopleRaw.map((p) => ({
    id: p.id,
    name: p.name,
    debtCount: p._count.debts,
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Долги
        </h1>
        {people.length > 0 ? <PersonFormDialog mode="create" /> : null}
      </header>
      <DebtsList people={people} />
    </main>
  );
}

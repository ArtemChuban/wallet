import { DebtFormDialog } from "@/components/debts/DebtFormDialog";
import { DebtsList } from "@/components/debts/DebtsList";
import { PersonFormDialog } from "@/components/debts/PersonFormDialog";
import { Button } from "@/components/ui/button";
import { remainingMinor } from "@/lib/debts";
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  await ensureSqlitePragmas();
  const [peopleRaw, currencies] = await Promise.all([
    prisma.person.findMany({
      orderBy: { name: "asc" },
      include: {
        debts: {
          orderBy: { id: "desc" },
          include: {
            currency: { select: { code: true, name: true, scale: true } },
            repayments: { select: { amountMinor: true } },
            sizeChanges: { select: { deltaMinor: true } },
          },
        },
      },
    }),
    prisma.currency.findMany({
      orderBy: { code: "asc" },
      select: { code: true, name: true, scale: true },
    }),
  ]);

  const people = peopleRaw.map((p) => ({
    id: p.id,
    name: p.name,
    debtCount: p.debts.length,
    debts: p.debts.map((d) => {
      const remaining = remainingMinor(
        d.initialAmountMinor,
        d.sizeChanges.map((s) => s.deltaMinor),
        d.repayments.map((r) => r.amountMinor),
      );
      return {
        id: d.id,
        direction: d.direction,
        currencyCode: d.currencyCode,
        initialAmountMinor: d.initialAmountMinor.toString(),
        remainingMinor: remaining.toString(),
        dueDate: d.dueDate,
        note: d.note,
        currency: d.currency,
        person: { id: p.id, name: p.name },
      };
    }),
  }));

  const peopleOptions = people.map((p) => ({ id: p.id, name: p.name }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Долги
        </h1>
        {people.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <PersonFormDialog
              mode="create"
              trigger={
                <Button type="button">Новый человек</Button>
              }
            />
            <DebtFormDialog
              mode="create"
              currencies={currencies}
              people={peopleOptions}
            />
          </div>
        ) : null}
      </header>
      <DebtsList people={people} currencies={currencies} />
    </main>
  );
}

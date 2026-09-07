import { IncomeFormDialog } from "@/components/income/IncomeFormDialog";
import { IncomeList } from "@/components/income/IncomeList";
import { PersonFormDialog } from "@/components/debts/PersonFormDialog";
import { Button } from "@/components/ui/button";
import { calendarDateToday } from "@/lib/dates";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { isIncomeOverdue, nextOpenPlannedAsOf } from "@/lib/income";

export const dynamic = "force-dynamic";

const actualSelect = {
  id: true,
  plannedAsOf: true,
  amountMinor: true,
  actualAsOf: true,
  note: true,
} as const;

export default async function IncomePage() {
  await ensureSqlitePragmas();
  const today = calendarDateToday("Europe/Moscow");

  const [peopleRaw, currencies, primaryCurrency] = await Promise.all([
    prisma.person.findMany({
      orderBy: { name: "asc" },
      include: {
        debts: { select: { id: true } },
        recurringIncomes: {
          orderBy: { id: "desc" },
          include: {
            currency: { select: { code: true, name: true, scale: true } },
            actuals: {
              select: {
                ...actualSelect,
                recurringIncomeId: true,
              },
            },
          },
        },
        oneTimeIncomes: {
          orderBy: { id: "desc" },
          include: {
            currency: { select: { code: true, name: true, scale: true } },
            actuals: {
              select: {
                ...actualSelect,
                oneTimeIncomeId: true,
              },
            },
          },
        },
      },
    }),
    prisma.currency.findMany({
      orderBy: { code: "asc" },
      select: { code: true, name: true, scale: true },
    }),
    prisma.currency.findFirst({
      where: { isPrimary: true },
      select: { code: true },
    }),
  ]);

  const primaryCurrencyCode = primaryCurrency?.code ?? currencies[0]?.code ?? "RUB";

  const people = peopleRaw.map((p) => {
    const recurringRows = p.recurringIncomes.map((r) => {
      const nextPlannedAsOf = nextOpenPlannedAsOf(
        {
          id: r.id,
          plannedAmountMinor: r.plannedAmountMinor,
          dayOfMonth: r.dayOfMonth,
          startAsOf: r.startAsOf,
        },
        r.actuals,
        today,
      );
      // Next-open slot: matching actual usually absent (FIFO unfilled).
      const slotActual = r.actuals.find((a) => a.plannedAsOf === nextPlannedAsOf);
      const hasActual = slotActual != null;
      return {
        id: r.id,
        kind: "recurring" as const,
        currencyCode: r.currencyCode,
        plannedAmountMinor: r.plannedAmountMinor.toString(),
        dayOfMonth: r.dayOfMonth,
        startAsOf: r.startAsOf,
        plannedAsOf: null as string | null,
        note: r.note,
        nextPlannedAsOf,
        hasActual,
        overdue: isIncomeOverdue(nextPlannedAsOf, hasActual, today),
        actualId: slotActual?.id,
        actualAmountMinor: slotActual
          ? slotActual.amountMinor.toString()
          : undefined,
        actualAsOf: slotActual?.actualAsOf,
        actualNote: slotActual?.note ?? null,
        currency: r.currency,
        person: { id: p.id, name: p.name },
      };
    });

    const oneTimeRows = p.oneTimeIncomes.map((o) => {
      const nextPlannedAsOf = o.plannedAsOf;
      const slotActual = o.actuals.find((a) => a.plannedAsOf === o.plannedAsOf);
      const hasActual = slotActual != null;
      return {
        id: o.id,
        kind: "oneTime" as const,
        currencyCode: o.currencyCode,
        plannedAmountMinor: o.plannedAmountMinor.toString(),
        dayOfMonth: null as number | null,
        startAsOf: null as string | null,
        plannedAsOf: o.plannedAsOf,
        note: o.note,
        nextPlannedAsOf,
        hasActual,
        overdue: isIncomeOverdue(nextPlannedAsOf, hasActual, today),
        actualId: slotActual?.id,
        actualAmountMinor: slotActual
          ? slotActual.amountMinor.toString()
          : undefined,
        actualAsOf: slotActual?.actualAsOf,
        actualNote: slotActual?.note ?? null,
        currency: o.currency,
        person: { id: p.id, name: p.name },
      };
    });

    const incomes = [...recurringRows, ...oneTimeRows].sort((a, b) =>
      a.nextPlannedAsOf < b.nextPlannedAsOf
        ? -1
        : a.nextPlannedAsOf > b.nextPlannedAsOf
          ? 1
          : a.id - b.id,
    );

    return {
      id: p.id,
      name: p.name,
      debtCount: p.debts.length,
      incomeCount: p.recurringIncomes.length + p.oneTimeIncomes.length,
      incomes,
    };
  });

  const peopleOptions = people.map((p) => ({ id: p.id, name: p.name }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Доходы
            </h1>
            <p className="text-base text-muted-foreground">
              Учёт доходов не меняет остатки на счетах.
            </p>
          </div>
          {people.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <PersonFormDialog
                mode="create"
                trigger={<Button type="button">Новый человек</Button>}
              />
              <IncomeFormDialog
                mode="create"
                currencies={currencies}
                people={peopleOptions}
                primaryCurrencyCode={primaryCurrencyCode}
              />
            </div>
          ) : null}
        </div>
      </header>
      <IncomeList
        people={people}
        currencies={currencies}
        primaryCurrencyCode={primaryCurrencyCode}
      />
    </main>
  );
}

import { DebtFormDialog } from "@/components/debts/DebtFormDialog";
import { DebtsList } from "@/components/debts/DebtsList";
import { DebtsPrimaryTotalsHero } from "@/components/debts/DebtsPrimaryTotalsHero";
import { PersonFormDialog } from "@/components/debts/PersonFormDialog";
import { Button } from "@/components/ui/button";
import { calendarDateToday } from "@/lib/dates";
import {
  assertStatusSynced,
  computeDebtPrimaryTotals,
  remainingMinor,
  type DebtPrimaryTotalsInput,
} from "@/lib/debts";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { firstHitLocfMap } from "@/lib/locf";
import { formatMinorToMajor } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  await ensureSqlitePragmas();
  const today = calendarDateToday("Europe/Moscow");

  const [peopleRaw, currencies, primaryCurrency, ratesLteToday] =
    await Promise.all([
      prisma.person.findMany({
        orderBy: { name: "asc" },
        include: {
          debts: {
            orderBy: { id: "desc" },
            include: {
              currency: {
                select: { code: true, name: true, scale: true, isPrimary: true },
              },
              repayments: {
                select: {
                  id: true,
                  asOfDate: true,
                  amountMinor: true,
                  note: true,
                },
              },
              sizeChanges: {
                select: {
                  id: true,
                  asOfDate: true,
                  deltaMinor: true,
                  note: true,
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
        select: { code: true, scale: true },
      }),
      prisma.fxRate.findMany({
        where: { asOfDate: { lte: today } },
        orderBy: { asOfDate: "desc" },
        select: {
          currencyCode: true,
          asOfDate: true,
          rateToPrimaryScaled: true,
        },
      }),
    ]);

  const primaryCode = primaryCurrency?.code ?? "RUB";
  const primaryScale = primaryCurrency?.scale ?? 2;
  const locfByCurrency = firstHitLocfMap(
    ratesLteToday,
    (rate) => rate.currencyCode,
  );

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
      assertStatusSynced(d.status, remaining);
      return {
        id: d.id,
        direction: d.direction,
        currencyCode: d.currencyCode,
        initialAmountMinor: d.initialAmountMinor.toString(),
        openedAsOf: d.openedAsOf,
        remainingMinor: remaining.toString(),
        status: d.status,
        dueDate: d.dueDate,
        note: d.note,
        currency: {
          code: d.currency.code,
          name: d.currency.name,
          scale: d.currency.scale,
        },
        person: { id: p.id, name: p.name },
        repayments: d.repayments.map((r) => ({
          id: r.id,
          asOfDate: r.asOfDate,
          amountMinor: r.amountMinor.toString(),
          note: r.note,
        })),
        sizeChanges: d.sizeChanges.map((s) => ({
          id: s.id,
          asOfDate: s.asOfDate,
          deltaMinor: s.deltaMinor.toString(),
          note: s.note,
        })),
      };
    }),
  }));

  const totalsInputs: DebtPrimaryTotalsInput[] = peopleRaw.flatMap((p) =>
    p.debts.map((d) => {
      const remaining = remainingMinor(
        d.initialAmountMinor,
        d.sizeChanges.map((s) => s.deltaMinor),
        d.repayments.map((r) => r.amountMinor),
      );
      assertStatusSynced(d.status, remaining);
      const rate = locfByCurrency.get(d.currencyCode) ?? null;
      return {
        id: d.id,
        direction: d.direction,
        status: d.status,
        remainingMinor: remaining,
        currencyScale: d.currency.scale,
        isPrimaryCurrency: d.currency.isPrimary,
        rateToPrimaryScaled: d.currency.isPrimary
          ? null
          : (rate?.rateToPrimaryScaled ?? null),
        primaryScale,
      };
    }),
  );

  const { rows, iOwePrimaryMinor, theyOwePrimaryMinor, isPartial } =
    computeDebtPrimaryTotals(totalsInputs);
  const iOweDisplay = formatMinorToMajor(iOwePrimaryMinor, primaryScale);
  const theyOweDisplay = formatMinorToMajor(theyOwePrimaryMinor, primaryScale);

  const debtMetaById = new Map(
    people.flatMap((p) =>
      p.debts.map((d) => [
        d.id,
        { personName: p.name, currencyCode: d.currencyCode },
      ]),
    ),
  );
  const excludedDebts = rows
    .filter((row) => !row.includedInTotal)
    .map((row) => {
      const meta = debtMetaById.get(row.debtId);
      return {
        debtId: row.debtId,
        personName: meta?.personName ?? "—",
        currencyCode: meta?.currencyCode ?? "—",
        reason: row.excludeReason === "no_fx" ? "нет курса" : row.excludeReason,
      };
    });

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
      <DebtsPrimaryTotalsHero
        iOweDisplay={iOweDisplay}
        theyOweDisplay={theyOweDisplay}
        primaryCode={primaryCode}
        isPartial={isPartial}
        excludedDebts={excludedDebts}
      />
      <DebtsList people={people} currencies={currencies} />
    </main>
  );
}

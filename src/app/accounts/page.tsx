import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { AccountList } from "@/components/accounts/AccountList";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { firstHitLocfMap } from "@/lib/locf";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  await ensureSqlitePragmas();
  const today = calendarDateToday();
  const [accountsRaw, currencies, snapshotsLteToday, allSnapshots] =
    await Promise.all([
      prisma.account.findMany({
        include: {
          currency: true,
          creditGraceObligations: {
            orderBy: { cycleStartAsOf: "desc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.currency.findMany({
        orderBy: { code: "asc" },
        select: { code: true, name: true, scale: true },
      }),
      prisma.balanceSnapshot.findMany({
        where: { asOfDate: { lte: today } },
        orderBy: { asOfDate: "desc" },
        select: {
          accountId: true,
          asOfDate: true,
          amountMinor: true,
        },
      }),
      prisma.balanceSnapshot.findMany({
        orderBy: [{ asOfDate: "desc" }, { id: "desc" }],
        select: {
          id: true,
          accountId: true,
          asOfDate: true,
          amountMinor: true,
        },
      }),
    ]);

  const locfByAccount = firstHitLocfMap(
    snapshotsLteToday,
    (snap) => snap.accountId,
  );

  const historyByAccount = new Map<
    number,
    { id: number; asOfDate: string; amountMinor: string }[]
  >();
  for (const snap of allSnapshots) {
    const list = historyByAccount.get(snap.accountId) ?? [];
    list.push({
      id: snap.id,
      asOfDate: snap.asOfDate,
      amountMinor: snap.amountMinor.toString(),
    });
    historyByAccount.set(snap.accountId, list);
  }

  // Serialize BigInt for client Dialog props (RSC boundary).
  const accounts = accountsRaw.map((a) => {
    const locf = locfByAccount.get(a.id) ?? null;
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      currencyCode: a.currencyCode,
      creditLimitMinor:
        a.creditLimitMinor == null ? null : a.creditLimitMinor.toString(),
      annualRateBps: a.annualRateBps,
      accrualDayOfMonth: a.accrualDayOfMonth,
      statementDayOfMonth: a.statementDayOfMonth,
      dueDayOfMonth: a.dueDayOfMonth,
      creditGraceObligations: a.creditGraceObligations.map((o) => ({
        id: o.id,
        cycleStartAsOf: o.cycleStartAsOf,
        dueAsOf: o.dueAsOf,
        amountMinor: o.amountMinor.toString(),
        status: o.status,
        closedAsOf: o.closedAsOf,
        note: o.note,
      })),
      currency: {
        code: a.currency.code,
        name: a.currency.name,
        scale: a.currency.scale,
      },
      locf: locf
        ? {
            asOfDate: locf.asOfDate,
            amountMinor: locf.amountMinor.toString(),
          }
        : null,
      snapshots: historyByAccount.get(a.id) ?? [],
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Счета
        </h1>
        {accounts.length > 0 ? (
          <AccountFormDialog mode="create" currencies={currencies} />
        ) : null}
      </header>
      <AccountList accounts={accounts} currencies={currencies} today={today} />
    </main>
  );
}

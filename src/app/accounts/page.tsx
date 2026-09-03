import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { AccountList } from "@/components/accounts/AccountList";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  await ensureSqlitePragmas();
  const today = calendarDateToday();
  const [accountsRaw, currencies, snapshotsLteToday] = await Promise.all([
    prisma.account.findMany({
      include: { currency: true },
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
  ]);

  const locfByAccount = new Map<
    number,
    { asOfDate: string; amountMinor: bigint }
  >();
  for (const snap of snapshotsLteToday) {
    if (!locfByAccount.has(snap.accountId)) {
      locfByAccount.set(snap.accountId, {
        asOfDate: snap.asOfDate,
        amountMinor: snap.amountMinor,
      });
    }
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

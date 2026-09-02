import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { AccountList } from "@/components/accounts/AccountList";
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  await ensureSqlitePragmas();
  const [accountsRaw, currencies] = await Promise.all([
    prisma.account.findMany({
      include: { currency: true },
      orderBy: { name: "asc" },
    }),
    prisma.currency.findMany({
      orderBy: { code: "asc" },
      select: { code: true, name: true, scale: true },
    }),
  ]);

  // Serialize BigInt for client Dialog props (RSC boundary).
  const accounts = accountsRaw.map((a) => ({
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
  }));

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
      <AccountList accounts={accounts} currencies={currencies} />
    </main>
  );
}

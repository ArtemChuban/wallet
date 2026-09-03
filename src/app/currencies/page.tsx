import { CurrencyFormDialog } from "@/components/currencies/CurrencyFormDialog";
import { CurrencyList } from "@/components/currencies/CurrencyList";
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CurrenciesPage() {
  await ensureSqlitePragmas();
  const currencies = await prisma.currency.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pb-8 pt-6 font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Валюты
        </h1>
        {currencies.length > 0 ? <CurrencyFormDialog mode="create" /> : null}
      </header>
      <CurrencyList currencies={currencies} />
    </main>
  );
}

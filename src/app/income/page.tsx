import { PersonFormDialog } from "@/components/debts/PersonFormDialog";
import { Button } from "@/components/ui/button";
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  await ensureSqlitePragmas();

  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Доходы
        </h1>
        <p className="text-base text-muted-foreground">
          Учёт доходов не меняет остатки на счетах.
        </p>
      </header>
      {people.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8">
          <div className="grid gap-2">
            <h2 className="text-base font-semibold text-foreground">
              Нет людей
            </h2>
            <p className="max-w-prose text-base text-muted-foreground">
              Добавьте человека или создайте доход, чтобы вести учёт.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PersonFormDialog
              mode="create"
              trigger={<Button type="button">Новый человек</Button>}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

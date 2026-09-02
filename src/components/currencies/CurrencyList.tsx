import { CurrencyFormDialog } from "@/components/currencies/CurrencyFormDialog";

export type CurrencyListItem = {
  code: string;
  name: string;
  scale: number;
  isPrimary: boolean;
};

export function CurrencyList({ currencies }: { currencies: CurrencyListItem[] }) {
  if (currencies.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 py-8">
        <div className="grid gap-2">
          <h2 className="text-base font-semibold text-foreground">Нет валют</h2>
          <p className="max-w-prose text-base text-muted-foreground">
            Добавьте валюту. После миграции должна быть основная RUB — если список
            пуст, проверьте базу.
          </p>
        </div>
        <CurrencyFormDialog mode="create" />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-background">
      {currencies.map((currency) => (
        <li
          key={currency.code}
          className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40"
        >
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-base text-foreground" title={currency.name}>
                {currency.name}
              </p>
              {currency.isPrimary ? (
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-sm text-foreground">
                  Основная
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{currency.code}</span>
              <span className="mx-2">·</span>
              <span className="font-mono">масштаб {currency.scale}</span>
            </p>
          </div>
          <CurrencyFormDialog mode="edit" currency={currency} />
        </li>
      ))}
    </ul>
  );
}

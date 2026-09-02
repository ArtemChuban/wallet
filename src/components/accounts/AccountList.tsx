import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { formatMinorToMajor } from "@/lib/money";

export type AccountCurrencyOption = {
  code: string;
  name: string;
  scale: number;
};

export type AccountListItem = {
  id: number;
  name: string;
  type: "FIAT_DEBIT" | "FIAT_CREDIT" | "CRYPTO" | "CASH";
  currencyCode: string;
  /** Serialized BigInt for RSC→client props (never treat as NW asset). */
  creditLimitMinor: string | null;
  currency: { code: string; name: string; scale: number };
};

const TYPE_LABELS: Record<AccountListItem["type"], string> = {
  FIAT_DEBIT: "Дебетовый",
  FIAT_CREDIT: "Кредитный",
  CRYPTO: "Крипто",
  CASH: "Наличные",
};

export function AccountList({
  accounts,
  currencies,
}: {
  accounts: AccountListItem[];
  currencies: AccountCurrencyOption[];
}) {
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 py-8">
        <div className="grid gap-2">
          <h2 className="text-base font-semibold text-foreground">Нет счетов</h2>
          <p className="max-w-prose text-base text-muted-foreground">
            Создайте первый счёт, чтобы учитывать активы и кредиты.
          </p>
        </div>
        <AccountFormDialog mode="create" currencies={currencies} />
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-background">
      {accounts.map((account) => {
        const typeLabel = TYPE_LABELS[account.type];
        const limitText =
          account.type === "FIAT_CREDIT" && account.creditLimitMinor != null
            ? `${formatMinorToMajor(BigInt(account.creditLimitMinor), account.currency.scale)} ${account.currencyCode}`
            : null;

        return (
          <li
            key={account.id}
            className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40"
          >
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-base text-foreground"
                title={account.name}
              >
                {account.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span>{typeLabel}</span>
                <span className="mx-2">·</span>
                <span className="font-mono">{account.currencyCode}</span>
                {limitText ? (
                  <>
                    <span className="mx-2">·</span>
                    <span className="font-mono">лимит {limitText}</span>
                  </>
                ) : null}
              </p>
            </div>
            <AccountFormDialog
              mode="edit"
              account={account}
              currencies={currencies}
            />
          </li>
        );
      })}
    </ul>
  );
}

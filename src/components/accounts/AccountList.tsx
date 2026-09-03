import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { SetBalanceDialog } from "@/components/accounts/SetBalanceDialog";
import { Button } from "@/components/ui/button";
import { creditDebtMinor } from "@/lib/balances";
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
  /** LOCF as of today; null before first snapshot (BAL-02). */
  locf: { asOfDate: string; amountMinor: string } | null;
};

const TYPE_LABELS: Record<AccountListItem["type"], string> = {
  FIAT_DEBIT: "Дебетовый",
  FIAT_CREDIT: "Кредитный",
  CRYPTO: "Крипто",
  CASH: "Наличные",
};

/** YYYY-MM-DD → DD.MM.YYYY for LOCF meta line. */
function formatAsOfDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

function LocfDisplay({ account }: { account: AccountListItem }) {
  if (!account.locf) return null;

  const amount = formatMinorToMajor(
    BigInt(account.locf.amountMinor),
    account.currency.scale,
  );
  const asOf = formatAsOfDisplay(account.locf.asOfDate);
  const code = account.currencyCode;

  if (
    account.type === "FIAT_CREDIT" &&
    account.creditLimitMinor != null
  ) {
    const available = amount;
    const debt = formatMinorToMajor(
      creditDebtMinor(
        BigInt(account.creditLimitMinor),
        BigInt(account.locf.amountMinor),
      ),
      account.currency.scale,
    );
    return (
      <p className="mt-1 font-mono text-sm text-foreground">
        <span>
          доступно {available} {code}
        </span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          долг {debt} {code}
        </span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span className="text-muted-foreground">на {asOf}</span>
      </p>
    );
  }

  return (
    <p className="mt-1 font-mono text-sm text-foreground">
      <span>
        {amount} {code}
      </span>
      <span className="mx-2 text-muted-foreground">·</span>
      <span className="text-muted-foreground">на {asOf}</span>
    </p>
  );
}

export function AccountList({
  accounts,
  currencies,
  today,
}: {
  accounts: AccountListItem[];
  currencies: AccountCurrencyOption[];
  today: string;
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
              <LocfDisplay account={account} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {account.locf == null ? (
                <SetBalanceDialog
                  account={account}
                  today={today}
                  variant="first"
                  trigger={
                    <Button type="button">Задать первый баланс</Button>
                  }
                />
              ) : (
                <SetBalanceDialog
                  account={account}
                  today={today}
                  variant="secondary"
                  trigger={
                    <Button type="button" variant="outline">
                      Задать баланс
                    </Button>
                  }
                />
              )}
              <AccountFormDialog
                mode="edit"
                account={account}
                currencies={currencies}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

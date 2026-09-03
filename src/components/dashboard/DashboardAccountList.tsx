export type DashboardAccountRow = {
  id: number;
  name: string;
  /** Pre-formatted asset native "amount CODE", or credit available "amount CODE". */
  nativeDisplay: string;
  /** Pre-formatted primary asset/debt amount "amount CODE" (no label prefix). */
  primaryDisplay: string;
  excludeReason: "none" | "no_balance" | "no_fx";
  isCredit: boolean;
  /** Credit only: pre-formatted debt native "amount CODE". */
  debtNativeDisplay: string | null;
};

export function DashboardAccountList({
  accounts,
  primaryCode,
}: {
  accounts: DashboardAccountRow[];
  primaryCode: string;
}) {
  const primaryHeader = `В ${primaryCode}`;

  return (
    <div>
      <div className="sr-only">
        Счёт, В валюте счёта, {primaryHeader}
      </div>
      <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_auto_auto] gap-4 px-4 text-sm text-muted-foreground sm:grid">
        <span>Счёт</span>
        <span className="text-right">В валюте счёта</span>
        <span className="text-right">{primaryHeader}</span>
      </div>
      <ul className="rounded-lg border border-border bg-background">
        {accounts.map((account) => (
          <li
            key={account.id}
            className="border-b border-border last:border-b-0"
          >
            <div className="flex flex-col gap-1 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4">
              <p
                className="min-w-0 truncate text-base text-foreground"
                title={account.name}
              >
                {account.name}
              </p>
              <NativeColumn account={account} />
              <PrimaryColumn account={account} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NativeColumn({ account }: { account: DashboardAccountRow }) {
  if (account.excludeReason === "no_balance") {
    return (
      <p className="text-sm text-muted-foreground sm:text-right">нет баланса</p>
    );
  }

  if (
    account.isCredit &&
    account.debtNativeDisplay != null &&
    account.excludeReason !== "no_balance"
  ) {
    return (
      <p className="font-mono text-sm text-foreground sm:text-right">
        <span>доступно {account.nativeDisplay}</span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          долг {account.debtNativeDisplay}
        </span>
      </p>
    );
  }

  return (
    <p className="font-mono text-sm text-foreground sm:text-right">
      {account.nativeDisplay}
    </p>
  );
}

function PrimaryColumn({ account }: { account: DashboardAccountRow }) {
  if (account.excludeReason === "no_balance") {
    return (
      <p className="font-mono text-sm text-foreground sm:text-right">—</p>
    );
  }

  if (account.excludeReason === "no_fx") {
    return (
      <p className="font-mono text-sm text-foreground sm:text-right">
        <span>—</span>
        <span className="mx-1 text-muted-foreground">·</span>
        <span className="text-muted-foreground">нет курса</span>
      </p>
    );
  }

  if (account.isCredit) {
    return (
      <p className="font-mono text-sm text-foreground sm:text-right">
        долг {account.primaryDisplay}
      </p>
    );
  }

  return (
    <p className="font-mono text-sm text-foreground sm:text-right">
      {account.primaryDisplay}
    </p>
  );
}

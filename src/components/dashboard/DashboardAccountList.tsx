export type DashboardAccountRow = {
  id: number;
  name: string;
  nativeDisplay: string;
  primaryDisplay: string;
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
              <p className="font-mono text-sm text-foreground sm:text-right">
                {account.nativeDisplay}
              </p>
              <p className="font-mono text-sm text-foreground sm:text-right">
                {account.primaryDisplay}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

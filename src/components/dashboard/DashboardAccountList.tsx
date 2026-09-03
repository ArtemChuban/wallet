export type DashboardAccountRow = {
  id: number;
  name: string;
  nativeDisplay: string;
  primaryDisplay: string;
};

export function DashboardAccountList({
  accounts,
}: {
  accounts: DashboardAccountRow[];
}) {
  return (
    <ul className="rounded-lg border border-border bg-background">
      {accounts.map((account) => (
        <li
          key={account.id}
          className="border-b border-border last:border-b-0"
        >
          <div className="flex items-center gap-2 px-4 py-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-base text-foreground"
                title={account.name}
              >
                {account.name}
              </p>
            </div>
            <p className="shrink-0 font-mono text-sm text-foreground">
              {account.nativeDisplay}
            </p>
            <p className="shrink-0 font-mono text-sm text-foreground">
              {account.primaryDisplay}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

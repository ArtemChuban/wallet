type ExcludedDebtRow = {
  debtId: number;
  personName: string;
  currencyCode: string;
  reason: string;
};

type DebtsPrimaryTotalsHeroProps = {
  iOweDisplay: string;
  theyOweDisplay: string;
  primaryCode: string;
  isPartial: boolean;
  excludedDebts: ExcludedDebtRow[];
};

export function DebtsPrimaryTotalsHero({
  iOweDisplay,
  theyOweDisplay,
  primaryCode,
  isPartial,
  excludedDebts,
}: DebtsPrimaryTotalsHeroProps) {
  return (
    <div className="grid gap-4">
      <section className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Я должен</p>
          <p className="font-mono text-3xl font-semibold text-foreground">
            {iOweDisplay} {primaryCode}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Мне должны</p>
          <p className="font-mono text-3xl font-semibold text-foreground">
            {theyOweDisplay} {primaryCode}
          </p>
        </div>
      </section>
      {isPartial ? (
        <div
          className="rounded-lg border border-border bg-muted/60 p-4"
          role="status"
        >
          <p className="text-sm font-medium text-foreground">Итог неполный</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Не все долги учтены в сумме: для части валют нет курса. Задайте
            курсы на странице «Курсы».
          </p>
          {excludedDebts.length > 0 ? (
            <ul className="mt-2 grid gap-1">
              {excludedDebts.map((row) => (
                <li
                  key={row.debtId}
                  className="flex flex-wrap items-baseline gap-2 text-sm text-foreground"
                >
                  <span>{row.personName}</span>
                  <span className="font-mono text-muted-foreground">
                    {row.currencyCode}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{row.reason}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type DebtsPrimaryTotalsHeroProps = {
  iOweDisplay: string;
  theyOweDisplay: string;
  primaryCode: string;
};

export function DebtsPrimaryTotalsHero({
  iOweDisplay,
  theyOweDisplay,
  primaryCode,
}: DebtsPrimaryTotalsHeroProps) {
  return (
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
  );
}

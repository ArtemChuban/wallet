"use client";

import Link from "next/link";
import { SetRateDialog } from "@/components/currencies/SetRateDialog";
import { Button } from "@/components/ui/button";
import { formatAsOfDisplay } from "@/lib/dates";
import { formatRateScaled } from "@/lib/money";

export type RateListItem = {
  code: string;
  name: string;
  /** LOCF as of today; null before first rate (FX-02 / D-15). */
  locf: { asOfDate: string; rateToPrimaryScaled: string } | null;
};

type RateListProps = {
  currencies: RateListItem[];
  primaryCode: string;
  today: string;
};

function LocfDisplay({
  item,
  primaryCode,
}: {
  item: RateListItem;
  primaryCode: string;
}) {
  if (!item.locf) {
    return (
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="font-mono">{item.code}</span>
        <span className="mx-2">·</span>
        <span>Нет курса</span>
      </p>
    );
  }

  const rate = formatRateScaled(BigInt(item.locf.rateToPrimaryScaled));
  const asOf = formatAsOfDisplay(item.locf.asOfDate);

  return (
    <p className="mt-1 font-mono text-sm text-foreground">
      <span>{item.code}</span>
      <span className="mx-2 text-muted-foreground">·</span>
      <span>
        {rate} {primaryCode}
      </span>
      <span className="mx-2 text-muted-foreground">·</span>
      <span className="text-muted-foreground">на {asOf}</span>
    </p>
  );
}

function RateRow({
  item,
  primaryCode,
  today,
}: {
  item: RateListItem;
  primaryCode: string;
  today: string;
}) {
  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 hover:bg-muted/40 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base text-foreground" title={item.name}>
            {item.name}
          </p>
          <LocfDisplay item={item} primaryCode={primaryCode} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {item.locf == null ? (
            <SetRateDialog
              currencies={[{ code: item.code, name: item.name }]}
              primaryCode={primaryCode}
              today={today}
              defaultCurrencyCode={item.code}
              variant="first"
              trigger={
                <Button type="button">Задать первый курс</Button>
              }
            />
          ) : (
            <SetRateDialog
              currencies={[{ code: item.code, name: item.name }]}
              primaryCode={primaryCode}
              today={today}
              defaultCurrencyCode={item.code}
              variant="secondary"
              trigger={
                <Button type="button" variant="outline">
                  Задать курс
                </Button>
              }
            />
          )}
        </div>
      </div>
    </li>
  );
}

export function RateList({ currencies, primaryCode, today }: RateListProps) {
  if (currencies.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background px-4 py-8 text-center">
        <h2 className="text-base font-semibold text-foreground">
          Нет валют для курса
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Добавьте валюту на вкладке «Валюты», затем задайте курс.
        </p>
        <Button render={<Link href="/currencies" />} className="mt-4">
          Перейти к валютам
        </Button>
      </div>
    );
  }

  return (
    <ul className="rounded-lg border border-border bg-background">
      {currencies.map((item) => (
        <RateRow
          key={item.code}
          item={item}
          primaryCode={primaryCode}
          today={today}
        />
      ))}
    </ul>
  );
}

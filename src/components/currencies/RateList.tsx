"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteFxRate } from "@/app/currencies/actions";
import { SetRateDialog } from "@/components/currencies/SetRateDialog";
import { Button } from "@/components/ui/button";
import { formatAsOfDisplay } from "@/lib/dates";
import { formatRateScaled } from "@/lib/money";

export type RateHistoryItem = {
  id: number;
  asOfDate: string;
  rateToPrimaryScaled: string;
};

export type RateListItem = {
  code: string;
  name: string;
  /** LOCF as of today; null before first rate (FX-02 / D-15). */
  locf: { asOfDate: string; rateToPrimaryScaled: string } | null;
  /** Newest-first rate history (D-10); empty → no expand. */
  history: RateHistoryItem[];
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

function HistoryRow({
  item,
  rate,
  primaryCode,
  pendingId,
  onDelete,
}: {
  item: RateListItem;
  rate: RateHistoryItem;
  primaryCode: string;
  pendingId: number | null;
  onDelete: (rate: RateHistoryItem) => void;
}) {
  const dateLabel = formatAsOfDisplay(rate.asOfDate);
  const rateLabel = formatRateScaled(BigInt(rate.rateToPrimaryScaled));
  const isPending = pendingId === rate.id;

  return (
    <li className="flex items-center gap-2 border-b border-border px-4 py-2 last:border-b-0">
      <p className="min-w-0 flex-1 font-mono text-sm text-foreground">
        <span>{dateLabel}</span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span>
          {rateLabel} {primaryCode} за 1 {item.code}
        </span>
      </p>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="min-h-11 min-w-11 shrink-0"
        disabled={isPending}
        aria-label={`Удалить курс за ${dateLabel}`}
        onClick={() => onDelete(rate)}
      >
        Удалить курс
      </Button>
    </li>
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
  const [expanded, setExpanded] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasHistory = item.history.length > 0;

  function handleDelete(rate: RateHistoryItem) {
    const dateLabel = formatAsOfDisplay(rate.asOfDate);
    const confirmed = window.confirm(
      `Удалить курс за ${dateLabel}? Это нельзя отменить.`,
    );
    if (!confirmed) return;

    setDeleteError(null);
    setPendingId(rate.id);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(rate.id));
      const result = await deleteFxRate(formData);
      setPendingId(null);
      if (!result.success) {
        setDeleteError(
          result.message ?? "Не удалось удалить курс. Попробуйте снова.",
        );
        return;
      }
      if (item.history.length <= 1) {
        setExpanded(false);
      }
    });
  }

  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 px-4 py-3 hover:bg-muted/40 sm:gap-4">
        {hasHistory ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 shrink-0"
            aria-expanded={expanded}
            aria-label={
              expanded
                ? "Скрыть историю курсов"
                : "Показать историю курсов"
            }
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronRight className="size-4" aria-hidden />
            )}
          </Button>
        ) : (
          <span className="min-h-11 min-w-11 shrink-0" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base text-foreground" title={item.name}>
            {item.name}
          </p>
          <LocfDisplay item={item} primaryCode={primaryCode} />
          {deleteError ? (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
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
      {expanded && hasHistory ? (
        <div className="bg-muted/40 pl-4 sm:pl-14">
          <p className="px-4 pt-3 text-sm text-muted-foreground">История</p>
          <ul className="pb-2">
            {item.history.map((rate) => (
              <HistoryRow
                key={rate.id}
                item={item}
                rate={rate}
                primaryCode={primaryCode}
                pendingId={isPending ? pendingId : null}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        </div>
      ) : null}
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

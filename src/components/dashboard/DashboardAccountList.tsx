"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

import { AccountHistoryChart } from "@/components/dashboard/AccountHistoryChart";
import { Button } from "@/components/ui/button";
import type { RangePreset } from "@/lib/dates";
import type {
  SeriesRate,
  SeriesSnapshot,
} from "@/lib/historical-series";
import type { NetWorthAccountType } from "@/lib/net-worth";

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
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  type: NetWorthAccountType;
  creditLimitMinor: string | null;
};

type DashboardAccountListProps = {
  accounts: DashboardAccountRow[];
  primaryCode: string;
  /** When omitted (empty dashboard), expand charts are not rendered. */
  range?: RangePreset;
  today?: string;
  snapshots?: SeriesSnapshot[];
  rates?: SeriesRate[];
  primaryScale?: number;
};

export function DashboardAccountList({
  accounts,
  primaryCode,
  range,
  today,
  snapshots,
  rates,
  primaryScale,
}: DashboardAccountListProps) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background px-4 py-8 text-center">
        <h2 className="text-base font-semibold text-foreground">Нет счетов</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Создайте первый счёт, чтобы увидеть капитал.
        </p>
        <Button render={<Link href="/accounts" />} className="mt-4">
          Перейти к счетам
        </Button>
      </div>
    );
  }

  const primaryHeader = `В ${primaryCode}`;
  const chartsEnabled =
    range != null &&
    today != null &&
    snapshots != null &&
    rates != null &&
    primaryScale != null;

  return (
    <div>
      <div className="sr-only">
        Счёт, В валюте счёта, {primaryHeader}
      </div>
      <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_auto_auto] gap-4 px-4 text-sm text-muted-foreground sm:grid">
        <span className="pl-14">Счёт</span>
        <span className="text-right">В валюте счёта</span>
        <span className="text-right">{primaryHeader}</span>
      </div>
      <ul className="rounded-lg border border-border bg-background">
        {accounts.map((account) => (
          <DashboardAccountRowItem
            key={account.id}
            account={account}
            primaryCode={primaryCode}
            chartsEnabled={chartsEnabled}
            range={range}
            today={today}
            snapshots={snapshots}
            rates={rates}
            primaryScale={primaryScale}
          />
        ))}
      </ul>
    </div>
  );
}

function DashboardAccountRowItem({
  account,
  primaryCode,
  chartsEnabled,
  range,
  today,
  snapshots,
  rates,
  primaryScale,
}: {
  account: DashboardAccountRow;
  primaryCode: string;
  chartsEnabled: boolean;
  range?: RangePreset;
  today?: string;
  snapshots?: SeriesSnapshot[];
  rates?: SeriesRate[];
  primaryScale?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 px-4 py-3 sm:gap-4">
        {chartsEnabled ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 shrink-0"
            aria-expanded={expanded}
            aria-label={
              expanded ? "Скрыть график счёта" : "Показать график счёта"
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
        <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4">
          <p
            className="min-w-0 truncate text-base text-foreground"
            title={account.name}
          >
            {account.name}
          </p>
          <NativeColumn account={account} />
          <PrimaryColumn account={account} />
        </div>
      </div>
      {expanded && chartsEnabled ? (
        <div className="bg-muted/40 px-4 py-4">
          <AccountHistoryChart
            accountId={account.id}
            accountName={account.name}
            currencyCode={account.currencyCode}
            currencyScale={account.currencyScale}
            isPrimaryCurrency={account.isPrimaryCurrency}
            type={account.type}
            creditLimitMinor={account.creditLimitMinor}
            isCredit={account.isCredit}
            snapshots={snapshots!}
            rates={rates!}
            primaryScale={primaryScale!}
            primaryCode={primaryCode}
            range={range!}
            today={today!}
          />
        </div>
      ) : null}
    </li>
  );
}

function NativeColumn({ account }: { account: DashboardAccountRow }) {
  if (account.excludeReason === "no_balance") {
    return (
      <p className="text-sm text-muted-foreground sm:text-right">нет баланса</p>
    );
  }

  if (account.isCredit && account.debtNativeDisplay != null) {
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

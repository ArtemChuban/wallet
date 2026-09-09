"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { deleteBalanceSnapshot } from "@/app/accounts/actions";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { CreditGraceDialog } from "@/components/accounts/CreditGraceDialog";
import { SetBalanceDialog } from "@/components/accounts/SetBalanceDialog";
import { DestructiveConfirmStep } from "@/components/ui/destructive-confirm-step";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  accountTypeLabel,
  isCreditType,
  type AccountTypeSoft,
} from "@/lib/account-type";
import { formatAsOfDisplay } from "@/lib/dates";
import { creditDebtMinor, formatMinorToMajor } from "@/lib/money";

export type AccountCurrencyOption = {
  code: string;
  name: string;
  scale: number;
};

export type BalanceSnapshotHistoryItem = {
  id: number;
  asOfDate: string;
  amountMinor: string;
};

export type AccountListItem = {
  id: number;
  name: string;
  type: AccountTypeSoft;
  currencyCode: string;
  /** Serialized BigInt for RSC→client props (never treat as NW asset). */
  creditLimitMinor: string | null;
  currency: { code: string; name: string; scale: number };
  /** LOCF as of today; null before first snapshot (BAL-02). */
  locf: { asOfDate: string; amountMinor: string } | null;
  /** Newest-first snapshot history (D-14); empty → no expand (E4). */
  snapshots: BalanceSnapshotHistoryItem[];
  /** Dual DOM schedule — FIAT_CREDIT only; both null or both set. */
  statementDayOfMonth: number | null;
  dueDayOfMonth: number | null;
  /** Grace obligations; amountMinor serialized BigInt string. */
  creditGraceObligations: Array<{
    id: number;
    cycleStartAsOf: string;
    dueAsOf: string;
    amountMinor: string;
    status: "OPEN" | "CLOSED";
    closedAsOf: string | null;
    note: string | null;
  }>;
};

function LocfDisplay({ account }: { account: AccountListItem }) {
  if (!account.locf) return null;

  const amount = formatMinorToMajor(
    BigInt(account.locf.amountMinor),
    account.currency.scale,
  );
  const asOf = formatAsOfDisplay(account.locf.asOfDate);
  const code = account.currencyCode;

  if (isCreditType(account.type) && account.creditLimitMinor != null) {
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

function HistoryRow({
  account,
  snap,
  pendingId,
  onDelete,
}: {
  account: AccountListItem;
  snap: BalanceSnapshotHistoryItem;
  pendingId: number | null;
  onDelete: (snap: BalanceSnapshotHistoryItem) => void;
}) {
  const dateLabel = formatAsOfDisplay(snap.asOfDate);
  const amount = formatMinorToMajor(
    BigInt(snap.amountMinor),
    account.currency.scale,
  );
  const code = account.currencyCode;
  const isPending = pendingId === snap.id;

  return (
    <li className="flex items-center gap-2 px-4 py-2">
      <p className="min-w-0 flex-1 font-mono text-sm text-foreground">
        <span>{dateLabel}</span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span>
          {amount} {code}
        </span>
      </p>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="min-h-11 shrink-0"
        disabled={isPending}
        aria-label={`Удалить снимок за ${dateLabel}`}
        onClick={() => onDelete(snap)}
      >
        Удалить снимок
      </Button>
    </li>
  );
}

function AccountRow({
  account,
  currencies,
  today,
}: {
  account: AccountListItem;
  currencies: AccountCurrencyOption[];
  today: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [confirmSnap, setConfirmSnap] =
    useState<BalanceSnapshotHistoryItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasHistory = account.snapshots.length > 0;
  const typeLabel = accountTypeLabel(account.type);
  const limitText =
    isCreditType(account.type) && account.creditLimitMinor != null
      ? `${formatMinorToMajor(BigInt(account.creditLimitMinor), account.currency.scale)} ${account.currencyCode}`
      : null;
  const confirmDateLabel = confirmSnap
    ? formatAsOfDisplay(confirmSnap.asOfDate)
    : "";

  function handleDeleteClick(snap: BalanceSnapshotHistoryItem) {
    setDeleteError(null);
    setConfirmSnap(snap);
  }

  function handleConfirmDelete() {
    if (!confirmSnap) return;
    const snap = confirmSnap;
    setDeleteError(null);
    setPendingId(snap.id);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(snap.id));
      const result = await deleteBalanceSnapshot(formData);
      setPendingId(null);
      if (!result.success) {
        setConfirmSnap(null);
        setDeleteError(
          result.message ??
            "Не удалось удалить снимок. Попробуйте снова.",
        );
        return;
      }
      setConfirmSnap(null);
      if (account.snapshots.length <= 1) {
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
                ? "Скрыть историю балансов"
                : "Показать историю балансов"
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
          {deleteError ? (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {account.type === "FIAT_CREDIT" ? (
            <CreditGraceDialog
              account={account}
              today={today}
              trigger={
                <Button type="button" variant="outline" size="sm">
                  Грейс
                </Button>
              }
            />
          ) : null}
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
      </div>
      {expanded && hasHistory ? (
        <div className="bg-muted/40 pl-4 sm:pl-14">
          <p className="px-4 pt-3 text-sm text-muted-foreground">История</p>
          <ul className="pb-2">
            {account.snapshots.map((snap) => (
              <HistoryRow
                key={snap.id}
                account={account}
                snap={snap}
                pendingId={isPending ? pendingId : null}
                onDelete={handleDeleteClick}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <Dialog
        open={confirmSnap != null}
        onOpenChange={(next) => {
          if (!isPending && !next) setConfirmSnap(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>Удалить снимок</DialogTitle>
          </DialogHeader>
          <DestructiveConfirmStep
            message={`Удалить снимок за ${confirmDateLabel}? Это нельзя отменить.`}
            confirmLabel="Удалить снимок"
            pending={isPending}
            onConfirm={handleConfirmDelete}
            onBack={() => setConfirmSnap(null)}
          />
        </DialogContent>
      </Dialog>
    </li>
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
    <ul className="rounded-lg border border-border bg-background">
      {accounts.map((account) => (
        <AccountRow
          key={account.id}
          account={account}
          currencies={currencies}
          today={today}
        />
      ))}
    </ul>
  );
}

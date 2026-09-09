"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type ReactElement,
} from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  closeCreditGraceObligation,
  reopenCreditGraceObligation,
  updateGraceSchedule,
  type AccountActionState,
} from "@/app/accounts/actions";
import { CreditGraceAmountDialog } from "@/components/accounts/CreditGraceAmountDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DestructiveConfirmStep } from "@/components/ui/destructive-confirm-step";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isGraceOverdue,
  mergeGraceListRows,
  type CreditGraceSchedule,
} from "@/lib/credit-grace";
import { formatAsOfDisplay } from "@/lib/dates";
import { formatMinorToMajor, formatMinorToMajorExact } from "@/lib/money";

const initialState: AccountActionState = {};

const EMPTY_SCHEDULE_HINT =
  "Укажите день выписки и день оплаты — как в банке. Циклы появятся после сохранения.";

const DOM_NON_RECALC_HINT =
  "Смена дат не пересчитывает уже сохранённые обязательства.";

const OVERDUE_INTEREST_HINT =
  "Срок оплаты прошёл — банк может начислить проценты.";

const CLOSE_CONFIRM_MESSAGE = "Отметить обязательство оплаченным?";
const REOPEN_CONFIRM_MESSAGE =
  "Вернуть в «К оплате»? Дата оплаты будет очищена.";

export type CreditGraceAccountProps = {
  id: number;
  name: string;
  currencyCode: string;
  statementDayOfMonth: number | null;
  dueDayOfMonth: number | null;
  currency: { code: string; name: string; scale: number };
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

type CreditGraceDialogProps = {
  account: CreditGraceAccountProps;
  today: string;
  trigger?: ReactElement;
};

type ConfirmStep =
  | { kind: "close"; id: number }
  | { kind: "reopen"; id: number };

function CreditGraceBody({
  account,
  today,
  onScheduleSaved,
}: {
  account: CreditGraceAccountProps;
  today: string;
  onScheduleSaved: () => void;
}) {
  const hasSchedule =
    account.statementDayOfMonth != null && account.dueDayOfMonth != null;

  const [statementDay, setStatementDay] = useState(
    account.statementDayOfMonth != null
      ? String(account.statementDayOfMonth)
      : "",
  );
  const [dueDay, setDueDay] = useState(
    account.dueDayOfMonth != null ? String(account.dueDayOfMonth) : "",
  );
  const [confirm, setConfirm] = useState<ConfirmStep | null>(null);
  const [closedAsOf, setClosedAsOf] = useState(today);
  const [showPaid, setShowPaid] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, startActionTransition] = useTransition();

  const [state, formAction, isPending] = useActionState(
    updateGraceSchedule,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      onScheduleSaved();
    }
  }, [state, onScheduleSaved]);

  const schedule: CreditGraceSchedule | null = hasSchedule
    ? {
        statementDayOfMonth: account.statementDayOfMonth!,
        dueDayOfMonth: account.dueDayOfMonth!,
      }
    : null;

  const listRows = hasSchedule
    ? mergeGraceListRows(schedule, today, account.creditGraceObligations)
    : [];

  const closedObligations = account.creditGraceObligations.filter(
    (o) => o.status === "CLOSED",
  );

  function handleConfirm() {
    if (!confirm) return;
    startActionTransition(async () => {
      setActionError(null);
      const formData = new FormData();
      formData.set("id", String(confirm.id));
      if (confirm.kind === "close") {
        formData.set("closedAsOf", closedAsOf);
        const result = await closeCreditGraceObligation({}, formData);
        if (!result.success) {
          setActionError(
            result.errors?.closedAsOf?.[0] ??
              result.message ??
              "Не удалось сохранить. Проверьте поля и попробуйте снова.",
          );
          return;
        }
      } else {
        const result = await reopenCreditGraceObligation({}, formData);
        if (!result.success) {
          setActionError(
            result.message ??
              "Не удалось сохранить. Проверьте поля и попробуйте снова.",
          );
          return;
        }
      }
      setConfirm(null);
      onScheduleSaved();
    });
  }

  if (confirm?.kind === "close") {
    return (
      <div className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Оплачено</DialogTitle>
        </DialogHeader>
        {actionError ? (
          <p className="text-sm text-destructive" role="alert">
            {actionError}
          </p>
        ) : null}
        <DestructiveConfirmStep
          message={CLOSE_CONFIRM_MESSAGE}
          confirmLabel="Отметить оплаченным"
          pending={isActing}
          pendingLabel="Сохранение…"
          onConfirm={handleConfirm}
          onBack={() => {
            if (!isActing) {
              setConfirm(null);
              setActionError(null);
            }
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor={`grace-closed-asof-${confirm.id}`}>
              Дата оплаты
            </Label>
            <Input
              id={`grace-closed-asof-${confirm.id}`}
              type="date"
              value={closedAsOf}
              onChange={(e) => setClosedAsOf(e.target.value)}
              disabled={isActing}
              required
            />
          </div>
        </DestructiveConfirmStep>
      </div>
    );
  }

  if (confirm?.kind === "reopen") {
    return (
      <div className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Вернуть к оплате</DialogTitle>
        </DialogHeader>
        {actionError ? (
          <p className="text-sm text-destructive" role="alert">
            {actionError}
          </p>
        ) : null}
        <DestructiveConfirmStep
          message={REOPEN_CONFIRM_MESSAGE}
          confirmLabel="Вернуть"
          pending={isActing}
          pendingLabel="Возврат…"
          onConfirm={handleConfirm}
          onBack={() => {
            if (!isActing) {
              setConfirm(null);
              setActionError(null);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid max-h-[min(80vh,40rem)] gap-6 overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Беспроцентный период</DialogTitle>
        <DialogDescription>
          График выписки и оплаты, циклы и суммы с выписки.
        </DialogDescription>
      </DialogHeader>

      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="accountId" value={account.id} />

        <div className="grid gap-2">
          <Label htmlFor={`grace-statement-${account.id}`}>Дата выписки</Label>
          <Input
            id={`grace-statement-${account.id}`}
            name="statementDayOfMonth"
            inputMode="numeric"
            autoComplete="off"
            value={statementDay}
            onChange={(e) => setStatementDay(e.target.value)}
            placeholder=""
            aria-invalid={Boolean(state.errors?.statementDayOfMonth)}
            disabled={isPending}
          />
          {state.errors?.statementDayOfMonth?.[0] ? (
            <p className="text-sm text-destructive" role="alert">
              {state.errors.statementDayOfMonth[0]}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`grace-due-${account.id}`}>Оплатить до</Label>
          <Input
            id={`grace-due-${account.id}`}
            name="dueDayOfMonth"
            inputMode="numeric"
            autoComplete="off"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            placeholder=""
            aria-invalid={Boolean(state.errors?.dueDayOfMonth)}
            disabled={isPending}
          />
          {state.errors?.dueDayOfMonth?.[0] ? (
            <p className="text-sm text-destructive" role="alert">
              {state.errors.dueDayOfMonth[0]}
            </p>
          ) : null}
        </div>

        {!hasSchedule ? (
          <p className="text-sm text-muted-foreground">{EMPTY_SCHEDULE_HINT}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">{DOM_NON_RECALC_HINT}</p>

        {state.message && !state.success ? (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Сохранение…" : "Сохранить расписание"}
          </Button>
        </DialogFooter>
      </form>

      {hasSchedule ? (
        <ul className="grid gap-3">
          {listRows.length === 0 && closedObligations.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              Нет текущего цикла — следующий ниже.
            </li>
          ) : null}
          {listRows.map((row) => {
            if (row.kind === "cta") {
              return (
                <li
                  key={`cta-${row.cycleStartAsOf}`}
                  className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
                >
                  <div className="min-w-0 text-sm text-foreground">
                    <p className="font-mono">
                      {formatAsOfDisplay(row.cycleStartAsOf)} →{" "}
                      {formatAsOfDisplay(row.dueAsOf)}
                    </p>
                  </div>
                  <CreditGraceAmountDialog
                    accountId={account.id}
                    cycleStartAsOf={row.cycleStartAsOf}
                    dueAsOf={row.dueAsOf}
                    currencyCode={account.currencyCode}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        Ввести сумму
                      </Button>
                    }
                  />
                </li>
              );
            }

            const amount = formatMinorToMajor(
              BigInt(row.obligation.amountMinor),
              account.currency.scale,
            );
            const amountExact = formatMinorToMajorExact(
              BigInt(row.obligation.amountMinor),
              account.currency.scale,
            );
            const overdue = isGraceOverdue(row.obligation.dueAsOf, today);
            return (
              <li
                key={`open-${row.obligation.id}`}
                className={
                  overdue
                    ? "flex flex-wrap items-center justify-between gap-2 border-t border-border bg-warning/15 px-3 py-2 pt-3 text-warning-foreground"
                    : "flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
                }
              >
                <div
                  className={
                    overdue
                      ? "min-w-0 text-sm text-warning-foreground"
                      : "min-w-0 text-sm text-foreground"
                  }
                >
                  <p className="font-mono">
                    {formatAsOfDisplay(row.obligation.cycleStartAsOf)} →{" "}
                    {formatAsOfDisplay(row.obligation.dueAsOf)}
                  </p>
                  {overdue ? (
                    <p className="mt-1 text-sm">{OVERDUE_INTEREST_HINT}</p>
                  ) : null}
                  <p className="mt-1 font-mono">
                    {amount} {account.currencyCode}
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="font-semibold">К оплате</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <CreditGraceAmountDialog
                    mode="edit"
                    accountId={account.id}
                    obligationId={row.obligation.id}
                    cycleStartAsOf={row.obligation.cycleStartAsOf}
                    dueAsOf={row.obligation.dueAsOf}
                    currencyCode={account.currencyCode}
                    initialAmountMajor={amountExact}
                    initialNote={row.obligation.note}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        Изменить
                      </Button>
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setClosedAsOf(today);
                      setActionError(null);
                      setConfirm({ kind: "close", id: row.obligation.id });
                    }}
                  >
                    Оплачено
                  </Button>
                </div>
              </li>
            );
          })}

          {closedObligations.length > 0 ? (
            <li className="border-t border-border pt-3">
              <button
                type="button"
                className="flex w-full items-center gap-2 text-left text-sm text-muted-foreground hover:text-foreground"
                aria-expanded={showPaid}
                onClick={() => setShowPaid((v) => !v)}
              >
                {showPaid ? (
                  <ChevronDown className="size-4 shrink-0" aria-hidden />
                ) : (
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                )}
                <span>
                  {showPaid ? "Скрыть оплаченные" : "Показать оплаченные"}
                </span>
              </button>
              {showPaid ? (
                <ul className="mt-2 grid gap-3">
                  {closedObligations.map((o) => {
                    const amount = formatMinorToMajor(
                      BigInt(o.amountMinor),
                      account.currency.scale,
                    );
                    return (
                      <li
                        key={`closed-${o.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2"
                      >
                        <div className="min-w-0 text-sm text-muted-foreground">
                          <p className="font-mono">
                            {formatAsOfDisplay(o.cycleStartAsOf)} →{" "}
                            {formatAsOfDisplay(o.dueAsOf)}
                          </p>
                          <p className="mt-1 font-mono">
                            {amount} {account.currencyCode}
                            <span className="mx-2">·</span>
                            <span>Оплачено</span>
                            {o.closedAsOf ? (
                              <>
                                <span className="mx-2">·</span>
                                <span>{formatAsOfDisplay(o.closedAsOf)}</span>
                              </>
                            ) : null}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActionError(null);
                            setConfirm({ kind: "reopen", id: o.id });
                          }}
                        >
                          Вернуть к оплате
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

export function CreditGraceDialog({
  account,
  today,
  trigger,
}: CreditGraceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultTrigger = (
    <Button type="button" variant="outline" size="sm">
      Грейс
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFormKey((k) => k + 1);
      }}
    >
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="overflow-hidden sm:max-w-md">
        {open ? (
          <CreditGraceBody
            key={formKey}
            account={account}
            today={today}
            onScheduleSaved={() => {
              router.refresh();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

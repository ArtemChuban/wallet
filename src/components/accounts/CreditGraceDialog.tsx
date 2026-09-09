"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import {
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  mergeGraceListRows,
  type CreditGraceSchedule,
} from "@/lib/credit-grace";
import { formatAsOfDisplay } from "@/lib/dates";
import { formatMinorToMajor } from "@/lib/money";

const initialState: AccountActionState = {};

const EMPTY_SCHEDULE_HINT =
  "Укажите день выписки и день оплаты — как в банке. Циклы появятся после сохранения.";

const DOM_NON_RECALC_HINT =
  "Смена дат не пересчитывает уже сохранённые обязательства.";

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

function CreditGraceBody({
  account,
  today,
  onScheduleSaved,
}: {
  account: AccountListItem;
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
            {isPending ? "Сохранение…" : "Сохранить график"}
          </Button>
        </DialogFooter>
      </form>

      {hasSchedule ? (
        <ul className="grid gap-3">
          {listRows.length === 0 ? (
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
            return (
              <li
                key={`open-${row.obligation.id}`}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
              >
                <div className="min-w-0 text-sm text-foreground">
                  <p className="font-mono">
                    {formatAsOfDisplay(row.obligation.cycleStartAsOf)} →{" "}
                    {formatAsOfDisplay(row.obligation.dueAsOf)}
                  </p>
                  <p className="mt-1 font-mono">
                    {amount} {account.currencyCode}
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-muted-foreground">К оплате</span>
                  </p>
                </div>
              </li>
            );
          })}
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

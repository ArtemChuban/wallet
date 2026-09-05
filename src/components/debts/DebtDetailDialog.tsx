"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import {
  createRepayment,
  deleteRepayment,
  type DebtActionState,
} from "@/app/debts/actions";
import {
  DebtFormDialog,
  type DebtRow,
} from "@/components/debts/DebtFormDialog";
import { DestructiveConfirmStep } from "@/components/debts/DestructiveConfirmStep";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calendarDateToday } from "@/lib/dates";
import { formatMinorToMajor } from "@/lib/money";

const initialState: DebtActionState = {};

const DIRECTION_LABELS: Record<"I_OWE" | "THEY_OWE", string> = {
  I_OWE: "Я должен",
  THEY_OWE: "Мне должны",
};

const STATUS_LABELS: Record<"OPEN" | "CLOSED", string> = {
  OPEN: "Открыт",
  CLOSED: "Закрыт",
};

const REPAYMENT_DELETE_CONFIRM =
  "Удалить погашение? Остаток долга и статус пересчитаются. Это нельзя отменить.";

type TimelineKind = "repayment" | "sizeChange";

type TimelineItem = {
  kind: TimelineKind;
  id: number;
  asOfDate: string;
  amountLabel: string;
  note: string | null;
  typeLabel: string;
};

function buildTimeline(debt: DebtRow): TimelineItem[] {
  const scale = debt.currency.scale;
  const repayments = debt.repayments ?? [];
  const sizeChanges = debt.sizeChanges ?? [];

  const items: TimelineItem[] = [
    ...repayments.map((r) => ({
      kind: "repayment" as const,
      id: r.id,
      asOfDate: r.asOfDate,
      amountLabel: formatMinorToMajor(BigInt(r.amountMinor), scale),
      note: r.note,
      typeLabel: "Погашение",
    })),
    ...sizeChanges.map((s) => ({
      kind: "sizeChange" as const,
      id: s.id,
      asOfDate: s.asOfDate,
      amountLabel: formatMinorToMajor(BigInt(s.deltaMinor), scale),
      note: s.note,
      typeLabel: "Изменение суммы",
    })),
  ];

  items.sort((a, b) => {
    if (a.asOfDate !== b.asOfDate) {
      return a.asOfDate < b.asOfDate ? 1 : -1;
    }
    return b.id - a.id;
  });

  return items;
}

function DebtDetailBody({
  debt,
  onSuccess,
}: {
  debt: DebtRow;
  onSuccess: () => void;
}) {
  const [asOfDate, setAsOfDate] = useState(() => calendarDateToday());
  const [state, formAction, isPending] = useActionState(
    createRepayment,
    initialState,
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const timeline = buildTimeline(debt);
  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const remaining = formatMinorToMajor(
    BigInt(debt.remainingMinor),
    debt.currency.scale,
  );

  function handleConfirmDelete() {
    if (confirmDeleteId == null) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(confirmDeleteId));
      const result = await deleteRepayment(formData);
      if (!result.success) {
        setDeleteError(
          result.message ?? "Не удалось удалить. Попробуйте снова.",
        );
        setConfirmDeleteId(null);
        return;
      }
      onSuccess();
    });
  }

  if (confirmDeleteId != null) {
    return (
      <div className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Удалить погашение</DialogTitle>
        </DialogHeader>
        {deleteError ? (
          <p className="text-sm text-destructive" role="alert">
            {deleteError}
          </p>
        ) : null}
        <DestructiveConfirmStep
          message={REPAYMENT_DELETE_CONFIRM}
          confirmLabel="Удалить погашение"
          pending={isDeleting}
          onConfirm={handleConfirmDelete}
          onBack={() => {
            if (!isDeleting) setConfirmDeleteId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <DialogHeader>
        <DialogTitle>Долг — {debt.person.name}</DialogTitle>
        <DialogDescription>
          {DIRECTION_LABELS[debt.direction]} · {remaining} {debt.currencyCode} ·{" "}
          {STATUS_LABELS[debt.status ?? "OPEN"]}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap gap-2">
        <DebtFormDialog
          mode="edit"
          debt={debt}
          trigger={
            <Button type="button" variant="outline" size="sm">
              Изменить
            </Button>
          }
        />
      </div>

      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="debtId" value={debt.id} />
        <h3 className="text-sm font-medium text-foreground">Погашение</h3>
        <div className="grid gap-2">
          <Label htmlFor={`repay-amount-${debt.id}`}>Сумма</Label>
          <Input
            id={`repay-amount-${debt.id}`}
            name="amountMajor"
            type="text"
            inputMode="decimal"
            required
            disabled={isPending}
            aria-invalid={Boolean(state.errors?.amountMajor)}
          />
          {state.errors?.amountMajor ? (
            <p className="text-sm text-destructive" role="alert">
              {state.errors.amountMajor[0]}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`repay-date-${debt.id}`}>Дата</Label>
          <Input
            id={`repay-date-${debt.id}`}
            name="asOfDate"
            type="date"
            required
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            disabled={isPending}
            aria-invalid={Boolean(state.errors?.asOfDate)}
          />
          {state.errors?.asOfDate ? (
            <p className="text-sm text-destructive" role="alert">
              {state.errors.asOfDate[0]}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`repay-note-${debt.id}`}>Заметка</Label>
          <Input
            id={`repay-note-${debt.id}`}
            name="note"
            type="text"
            disabled={isPending}
          />
        </div>
        {state.message && !state.success ? (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex w-full flex-wrap justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Закрыть
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Сохранение…" : "Записать погашение"}
            </Button>
          </div>
        </DialogFooter>
      </form>

      <div className="grid gap-2 border-t border-border pt-4">
        <h3 className="text-sm font-medium text-foreground">История</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет событий</p>
        ) : (
          <ul className="grid gap-3">
            {timeline.map((item) => (
              <li
                key={`${item.kind}-${item.id}`}
                className="flex flex-wrap items-start justify-between gap-2 text-sm"
              >
                <div className="grid gap-0.5">
                  <span className="font-medium text-foreground">
                    {item.typeLabel}
                  </span>
                  <span className="text-muted-foreground">
                    {item.asOfDate} · {item.amountLabel} {debt.currencyCode}
                  </span>
                  {item.note ? (
                    <span className="text-muted-foreground">{item.note}</span>
                  ) : null}
                </div>
                {item.kind === "repayment" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={isDeleting}
                    onClick={() => {
                      setDeleteError(null);
                      setConfirmDeleteId(item.id);
                    }}
                  >
                    Удалить
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {deleteError ? (
          <p className="text-sm text-destructive" role="alert">
            {deleteError}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function DebtDetailDialog({
  debt,
  open,
  onOpenChange,
}: {
  debt: DebtRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [formKey, setFormKey] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setFormKey((k) => k + 1);
      }}
    >
      <DialogContent className="sm:max-w-md">
        {open ? (
          <DebtDetailBody
            key={formKey}
            debt={debt}
            onSuccess={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import {
  createRepayment,
  createSizeChange,
  deleteRepayment,
  deleteSizeChange,
  forgiveRemaining,
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

const SIZE_CHANGE_DELETE_CONFIRM =
  "Удалить изменение суммы? Остаток долга и статус пересчитаются. Это нельзя отменить.";

type TimelineKind = "repayment" | "sizeChange";

type TimelineItem = {
  kind: TimelineKind;
  id: number;
  asOfDate: string;
  amountLabel: string;
  note: string | null;
  typeLabel: string;
};

type ConfirmStep =
  | { kind: "delete-repayment"; id: number }
  | { kind: "delete-sizeChange"; id: number }
  | {
      kind: "forgive";
      asOfDate: string;
      note: string;
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
      // User override: no distinct forgive label — same as manual size-change
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

type DetailTab = "repay" | "size" | "forgive" | "history";

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: "repay", label: "Погашение" },
  { id: "size", label: "Изменение" },
  { id: "forgive", label: "Простить" },
  { id: "history", label: "История" },
];

function DebtDetailBody({
  debt,
  onSuccess,
}: {
  debt: DebtRow;
  onSuccess: () => void;
}) {
  const [tab, setTab] = useState<DetailTab>("repay");
  const [repayDate, setRepayDate] = useState(() => calendarDateToday());
  const [sizeDate, setSizeDate] = useState(() => calendarDateToday());
  const [forgiveDate, setForgiveDate] = useState(() => calendarDateToday());
  const [forgiveNote, setForgiveNote] = useState("");
  const [confirm, setConfirm] = useState<ConfirmStep | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, startActionTransition] = useTransition();

  const [repayState, repayAction, repayPending] = useActionState(
    createRepayment,
    initialState,
  );
  const [sizeState, sizeAction, sizePending] = useActionState(
    createSizeChange,
    initialState,
  );

  const timeline = buildTimeline(debt);
  const remainingMinor = BigInt(debt.remainingMinor);
  const remainingLabel = formatMinorToMajor(
    remainingMinor,
    debt.currency.scale,
  );
  const showForgive = remainingMinor !== 0n;

  useEffect(() => {
    if (repayState?.success || sizeState?.success) {
      onSuccess();
    }
  }, [repayState, sizeState, onSuccess]);

  useEffect(() => {
    if (!showForgive && tab === "forgive") {
      setTab("repay");
    }
  }, [showForgive, tab]);

  function handleConfirm() {
    if (confirm == null) return;
    setActionError(null);
    startActionTransition(async () => {
      if (confirm.kind === "delete-repayment") {
        const formData = new FormData();
        formData.set("id", String(confirm.id));
        const result = await deleteRepayment(formData);
        if (!result.success) {
          setActionError(
            result.message ?? "Не удалось удалить. Попробуйте снова.",
          );
          setConfirm(null);
          return;
        }
        onSuccess();
        return;
      }
      if (confirm.kind === "delete-sizeChange") {
        const formData = new FormData();
        formData.set("id", String(confirm.id));
        const result = await deleteSizeChange(formData);
        if (!result.success) {
          setActionError(
            result.message ?? "Не удалось удалить. Попробуйте снова.",
          );
          setConfirm(null);
          return;
        }
        onSuccess();
        return;
      }
      const formData = new FormData();
      formData.set("debtId", String(debt.id));
      formData.set("asOfDate", confirm.asOfDate);
      if (confirm.note.trim()) {
        formData.set("note", confirm.note.trim());
      }
      const result = await forgiveRemaining({}, formData);
      if (!result.success) {
        setActionError(
          result.errors?.asOfDate?.[0] ??
            result.message ??
            "Не удалось сохранить. Проверьте поля и попробуйте снова.",
        );
        setConfirm(null);
        return;
      }
      onSuccess();
    });
  }

  if (confirm?.kind === "delete-repayment") {
    return (
      <div className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Удалить погашение</DialogTitle>
        </DialogHeader>
        {actionError ? (
          <p className="text-sm text-destructive" role="alert">
            {actionError}
          </p>
        ) : null}
        <DestructiveConfirmStep
          message={REPAYMENT_DELETE_CONFIRM}
          confirmLabel="Удалить погашение"
          pending={isActing}
          onConfirm={handleConfirm}
          onBack={() => {
            if (!isActing) setConfirm(null);
          }}
        />
      </div>
    );
  }

  if (confirm?.kind === "delete-sizeChange") {
    return (
      <div className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Удалить изменение суммы</DialogTitle>
        </DialogHeader>
        {actionError ? (
          <p className="text-sm text-destructive" role="alert">
            {actionError}
          </p>
        ) : null}
        <DestructiveConfirmStep
          message={SIZE_CHANGE_DELETE_CONFIRM}
          confirmLabel="Удалить изменение"
          pending={isActing}
          onConfirm={handleConfirm}
          onBack={() => {
            if (!isActing) setConfirm(null);
          }}
        />
      </div>
    );
  }

  if (confirm?.kind === "forgive") {
    return (
      <div className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Простить остаток</DialogTitle>
        </DialogHeader>
        {actionError ? (
          <p className="text-sm text-destructive" role="alert">
            {actionError}
          </p>
        ) : null}
        <DestructiveConfirmStep
          message={`Будет списан остаток ${remainingLabel} ${debt.currencyCode}. Долг закроется. Это нельзя отменить.`}
          confirmLabel="Простить остаток"
          pending={isActing}
          onConfirm={handleConfirm}
          onBack={() => {
            if (!isActing) setConfirm(null);
          }}
        />
      </div>
    );
  }

  const visibleTabs = DETAIL_TABS.filter(
    (t) => t.id !== "forgive" || showForgive,
  );

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle className="pr-8 break-all">
          Долг — {debt.person.name}
        </DialogTitle>
        <DialogDescription>
          {DIRECTION_LABELS[debt.direction]} · {remainingLabel}{" "}
          {debt.currencyCode} · {STATUS_LABELS[debt.status ?? "OPEN"]}
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

      <div
        role="tablist"
        aria-label="Действия по долгу"
        className="flex flex-wrap gap-2"
      >
        {visibleTabs.map((t) => (
          <Button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "history" && timeline.length > 0
              ? ` (${timeline.length})`
              : null}
          </Button>
        ))}
      </div>

      {tab === "repay" ? (
        <form
          action={repayAction}
          className="grid gap-4"
          role="tabpanel"
          aria-label="Погашение"
        >
          <input type="hidden" name="debtId" value={debt.id} />
          <div className="grid gap-2">
            <Label htmlFor={`repay-amount-${debt.id}`}>Сумма</Label>
            <Input
              id={`repay-amount-${debt.id}`}
              name="amountMajor"
              type="text"
              inputMode="decimal"
              required
              disabled={repayPending}
              aria-invalid={Boolean(repayState.errors?.amountMajor)}
            />
            {repayState.errors?.amountMajor ? (
              <p className="text-sm text-destructive" role="alert">
                {repayState.errors.amountMajor[0]}
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
              value={repayDate}
              onChange={(e) => setRepayDate(e.target.value)}
              disabled={repayPending}
              aria-invalid={Boolean(repayState.errors?.asOfDate)}
            />
            {repayState.errors?.asOfDate ? (
              <p className="text-sm text-destructive" role="alert">
                {repayState.errors.asOfDate[0]}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`repay-note-${debt.id}`}>Заметка</Label>
            <Input
              id={`repay-note-${debt.id}`}
              name="note"
              type="text"
              disabled={repayPending}
            />
          </div>
          {repayState.message && !repayState.success ? (
            <p className="text-sm text-destructive" role="alert">
              {repayState.message}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={repayPending}>
              {repayPending ? "Сохранение…" : "Записать погашение"}
            </Button>
          </div>
        </form>
      ) : null}

      {tab === "size" ? (
        <form
          action={sizeAction}
          className="grid gap-4"
          role="tabpanel"
          aria-label="Изменение суммы"
        >
          <input type="hidden" name="debtId" value={debt.id} />
          <div className="grid gap-2">
            <Label htmlFor={`size-delta-${debt.id}`}>Дельта</Label>
            <Input
              id={`size-delta-${debt.id}`}
              name="deltaMajor"
              type="text"
              inputMode="decimal"
              required
              disabled={sizePending}
              placeholder="+100 или -50"
              aria-invalid={Boolean(sizeState.errors?.deltaMajor)}
            />
            {sizeState.errors?.deltaMajor ? (
              <p className="text-sm text-destructive" role="alert">
                {sizeState.errors.deltaMajor[0]}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`size-date-${debt.id}`}>Дата</Label>
            <Input
              id={`size-date-${debt.id}`}
              name="asOfDate"
              type="date"
              required
              value={sizeDate}
              onChange={(e) => setSizeDate(e.target.value)}
              disabled={sizePending}
              aria-invalid={Boolean(sizeState.errors?.asOfDate)}
            />
            {sizeState.errors?.asOfDate ? (
              <p className="text-sm text-destructive" role="alert">
                {sizeState.errors.asOfDate[0]}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`size-note-${debt.id}`}>Заметка</Label>
            <Input
              id={`size-note-${debt.id}`}
              name="note"
              type="text"
              disabled={sizePending}
            />
          </div>
          {sizeState.message && !sizeState.success ? (
            <p className="text-sm text-destructive" role="alert">
              {sizeState.message}
            </p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={sizePending}>
              {sizePending ? "Сохранение…" : "Записать изменение"}
            </Button>
          </div>
        </form>
      ) : null}

      {tab === "forgive" && showForgive ? (
        <div
          className="grid gap-4"
          role="tabpanel"
          aria-label="Простить остаток"
        >
          <p className="text-sm text-muted-foreground">
            Спишет остаток {remainingLabel} {debt.currencyCode} и закроет долг.
          </p>
          <div className="grid gap-2">
            <Label htmlFor={`forgive-date-${debt.id}`}>Дата</Label>
            <Input
              id={`forgive-date-${debt.id}`}
              type="date"
              required
              value={forgiveDate}
              onChange={(e) => setForgiveDate(e.target.value)}
              disabled={isActing}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`forgive-note-${debt.id}`}>Заметка</Label>
            <Input
              id={`forgive-note-${debt.id}`}
              type="text"
              value={forgiveNote}
              onChange={(e) => setForgiveNote(e.target.value)}
              disabled={isActing}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              disabled={isActing || !forgiveDate}
              onClick={() => {
                setActionError(null);
                setConfirm({
                  kind: "forgive",
                  asOfDate: forgiveDate,
                  note: forgiveNote,
                });
              }}
            >
              Простить остаток
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="grid gap-2" role="tabpanel" aria-label="История">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет событий</p>
          ) : (
            <ul className="grid gap-3">
              {timeline.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="flex flex-wrap items-start justify-between gap-2 text-sm"
                >
                  <div className="grid min-w-0 gap-0.5">
                    <span className="font-medium text-foreground">
                      {item.typeLabel}
                    </span>
                    <span className="text-muted-foreground">
                      {item.asOfDate} · {item.amountLabel} {debt.currencyCode}
                    </span>
                    {item.note ? (
                      <span className="break-words text-muted-foreground">
                        {item.note}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive"
                    disabled={isActing}
                    onClick={() => {
                      setActionError(null);
                      setConfirm(
                        item.kind === "repayment"
                          ? { kind: "delete-repayment", id: item.id }
                          : { kind: "delete-sizeChange", id: item.id },
                      );
                    }}
                  >
                    Удалить
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {actionError ? (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          ) : null}
        </div>
      ) : null}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Закрыть
        </DialogClose>
      </DialogFooter>
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
      <DialogContent className="flex max-h-[min(90dvh,calc(100vh-2rem))] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {open ? (
            <DebtDetailBody
              key={formKey}
              debt={debt}
              onSuccess={() => onOpenChange(false)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

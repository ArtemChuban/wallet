"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import {
  deleteOneTimeIncomeActual,
  deleteRecurringIncomeActual,
  upsertOneTimeIncomeActual,
  upsertRecurringIncomeActual,
  type IncomeActionState,
} from "@/app/income/actions";
import type { IncomeRow } from "@/components/income/IncomeFormDialog";
import { DestructiveConfirmStep } from "@/components/ui/destructive-confirm-step";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calendarDateToday, formatAsOfDisplay } from "@/lib/dates";
import {
  incomeVarianceMinor,
  incomeVariancePhrase,
} from "@/lib/income";
import { formatMinorToMajor, parseMajorToMinor } from "@/lib/money";

const initialState: IncomeActionState = {};

const FACT_DELETE_CONFIRM =
  "Удалить факт получения? Слот снова станет пустым и может показать «заполни», если план в прошлом. Это нельзя отменить.";

const FACT_SAVE_ERROR =
  "Не удалось сохранить факт. Проверьте поля и попробуйте снова.";

const FACT_DELETE_ERROR = "Не удалось удалить факт. Попробуйте снова.";

function upsertFactAction(
  prev: IncomeActionState,
  formData: FormData,
): Promise<IncomeActionState> {
  const kind = String(formData.get("kind") ?? "recurring");
  if (kind === "oneTime") {
    return upsertOneTimeIncomeActual(prev, formData);
  }
  return upsertRecurringIncomeActual(prev, formData);
}

function formatSignedDelta(deltaMinor: bigint, scale: number): string {
  const abs = formatMinorToMajor(
    deltaMinor < 0n ? -deltaMinor : deltaMinor,
    scale,
  );
  if (deltaMinor > 0n) return `+${abs}`;
  if (deltaMinor < 0n) return `−${abs}`;
  return abs;
}

function liveVariance(
  amountMajor: string,
  plannedAmountMinor: bigint,
  scale: number,
): { delta: bigint; phrase: string; formatted: string } | null {
  try {
    const actualMinor = parseMajorToMinor(amountMajor, scale);
    if (actualMinor <= 0n) return null;
    const delta = incomeVarianceMinor(actualMinor, plannedAmountMinor);
    return {
      delta,
      phrase: incomeVariancePhrase(delta),
      formatted: formatSignedDelta(delta, scale),
    };
  } catch {
    return null;
  }
}

function IncomeFactBody({
  income,
  onSuccess,
}: {
  income: IncomeRow;
  onSuccess: () => void;
}) {
  const isEdit = income.hasActual;
  const plannedAsOf = income.nextPlannedAsOf;
  const plannedMinor = BigInt(income.plannedAmountMinor);
  const scale = income.currency.scale;
  const planAmountDisplay = formatMinorToMajor(plannedMinor, scale);

  const [step, setStep] = useState<"form" | "confirm-delete">("form");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [amountMajor, setAmountMajor] = useState(() => {
    if (isEdit && income.actualAmountMinor != null) {
      return formatMinorToMajor(BigInt(income.actualAmountMinor), scale);
    }
    return formatMinorToMajor(plannedMinor, scale);
  });
  const [actualAsOf, setActualAsOf] = useState(() => {
    if (isEdit && income.actualAsOf) return income.actualAsOf;
    return calendarDateToday("Europe/Moscow");
  });
  const [note, setNote] = useState(() =>
    isEdit && income.actualNote ? income.actualNote : "",
  );

  const [state, formAction, isPending] = useActionState(
    upsertFactAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const title = isEdit ? "Изменить факт" : "Внести факт";
  const submitLabel = isEdit
    ? "Сохранить факт"
    : income.overdue
      ? "Заполни"
      : "Внести факт";

  const variance = liveVariance(amountMajor, plannedMinor, scale);

  function handleConfirmDelete() {
    if (income.actualId == null) return;
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(income.actualId));
      const result =
        income.kind === "recurring"
          ? await deleteRecurringIncomeActual(formData)
          : await deleteOneTimeIncomeActual(formData);
      if (!result.success) {
        setDeleteError(result.message ?? FACT_DELETE_ERROR);
        setStep("form");
        return;
      }
      onSuccess();
    });
  }

  if (step === "confirm-delete") {
    return (
      <div className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Удалить факт</DialogTitle>
        </DialogHeader>
        <DestructiveConfirmStep
          message={FACT_DELETE_CONFIRM}
          confirmLabel="Удалить факт"
          pending={isDeleting}
          onConfirm={handleConfirmDelete}
          onBack={() => setStep("form")}
        />
      </div>
    );
  }

  return (
    <form action={formAction} className="grid min-w-0 gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Факт получения не меняет остатки на счетах.
        </DialogDescription>
      </DialogHeader>

      <input type="hidden" name="kind" value={income.kind} />
      <input type="hidden" name="plannedAsOf" value={plannedAsOf} />
      {income.kind === "recurring" ? (
        <input type="hidden" name="recurringIncomeId" value={income.id} />
      ) : (
        <input type="hidden" name="oneTimeIncomeId" value={income.id} />
      )}

      <div className="grid gap-2">
        <Label>План · дата</Label>
        <p className="font-mono text-sm text-muted-foreground">
          {formatAsOfDisplay(plannedAsOf)}
        </p>
      </div>

      <div className="grid gap-2">
        <Label>План · сумма</Label>
        <p className="font-mono text-sm text-muted-foreground">
          {planAmountDisplay} {income.currencyCode}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`fact-amount-${income.kind}-${income.id}`}>
          Факт · сумма
        </Label>
        <Input
          id={`fact-amount-${income.kind}-${income.id}`}
          name="actualAmountMajor"
          inputMode="decimal"
          autoComplete="off"
          value={amountMajor}
          onChange={(e) => setAmountMajor(e.target.value)}
          required
          aria-invalid={Boolean(state.errors?.actualAmountMajor)}
          disabled={isPending}
        />
        {state.errors?.actualAmountMajor?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.actualAmountMajor[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`fact-date-${income.kind}-${income.id}`}>
          Факт · дата
        </Label>
        <Input
          id={`fact-date-${income.kind}-${income.id}`}
          name="actualAsOf"
          type="date"
          value={actualAsOf}
          onChange={(e) => setActualAsOf(e.target.value)}
          required
          aria-invalid={Boolean(state.errors?.actualAsOf)}
          disabled={isPending}
        />
        {state.errors?.actualAsOf?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.actualAsOf[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`fact-note-${income.kind}-${income.id}`}>Заметка</Label>
        <Input
          id={`fact-note-${income.kind}-${income.id}`}
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          autoComplete="off"
          aria-invalid={Boolean(state.errors?.note)}
          disabled={isPending}
        />
        {state.errors?.note?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.note[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label>Отклонение</Label>
        {variance ? (
          <p
            className={
              variance.delta === 0n
                ? "font-mono text-base text-muted-foreground"
                : "font-mono text-base text-foreground"
            }
          >
            {variance.formatted} {income.currencyCode} · {variance.phrase}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </div>

      {state.message && !state.success ? (
        <p className="text-sm text-destructive" role="alert">
          {FACT_SAVE_ERROR}
        </p>
      ) : null}
      {deleteError ? (
        <p className="text-sm text-destructive" role="alert">
          {deleteError}
        </p>
      ) : null}

      <DialogFooter className="flex-col gap-2 sm:flex-col">
        {isEdit ? (
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={isPending || isDeleting || income.actualId == null}
            onClick={() => {
              setDeleteError(null);
              setStep("confirm-delete");
            }}
          >
            Удалить факт
          </Button>
        ) : null}
        <div className="flex w-full flex-wrap justify-end gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>
            Не сохранять
          </DialogClose>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Сохранение…" : submitLabel}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

type IncomeFactDialogProps = {
  income: IncomeRow;
  trigger?: ReactElement;
};

export function IncomeFactDialog({ income, trigger }: IncomeFactDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const isEdit = income.hasActual;
  const defaultTrigger = (
    <Button
      type="button"
      variant={income.overdue && !isEdit ? "default" : "outline"}
      size="sm"
    >
      {isEdit ? "Изменить факт" : income.overdue ? "Заполни" : "Внести факт"}
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
          <IncomeFactBody
            key={formKey}
            income={income}
            onSuccess={() => {
              router.refresh();
              setOpen(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

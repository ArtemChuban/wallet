"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import {
  createCreditGraceObligation,
  updateCreditGraceObligation,
  type AccountActionState,
} from "@/app/accounts/actions";
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
import { formatAsOfDisplay } from "@/lib/dates";

const initialState: AccountActionState = {};

const UX01_DISCLAIMER =
  "Это не «Задолженность» по снимку баланса — сумма с выписки для беспроцентного периода.";

type CreditGraceAmountDialogProps = {
  accountId: number;
  cycleStartAsOf: string;
  dueAsOf: string;
  currencyCode: string;
  /** Create CTA vs OPEN amount edit (D-09 / D-10). */
  mode?: "create" | "edit";
  obligationId?: number;
  initialAmountMajor?: string;
  initialNote?: string | null;
  trigger?: ReactElement;
};

function CreditGraceAmountBody({
  accountId,
  cycleStartAsOf,
  dueAsOf,
  mode,
  obligationId,
  initialAmountMajor,
  initialNote,
  onSuccess,
}: {
  accountId: number;
  cycleStartAsOf: string;
  dueAsOf: string;
  mode: "create" | "edit";
  obligationId?: number;
  initialAmountMajor?: string;
  initialNote?: string | null;
  onSuccess: () => void;
}) {
  const [amountMajor, setAmountMajor] = useState(initialAmountMajor ?? "");
  const [note, setNote] = useState(initialNote ?? "");
  const action =
    mode === "edit" ? updateCreditGraceObligation : createCreditGraceObligation;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const title =
    mode === "edit"
      ? "Изменить платёж для беспроцентного"
      : "Ввести платёж для беспроцентного";

  return (
    <form action={formAction} className="grid min-w-0 gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {mode === "edit"
            ? "Сумму можно изменить. Даты цикла и оплаты не меняются."
            : "Сумма сохраняется для выбранного цикла. Срок оплаты фиксируется на сервере."}
        </DialogDescription>
      </DialogHeader>

      {mode === "edit" && obligationId != null ? (
        <input type="hidden" name="id" value={obligationId} />
      ) : (
        <>
          <input type="hidden" name="accountId" value={accountId} />
          <input type="hidden" name="cycleStartAsOf" value={cycleStartAsOf} />
          <input type="hidden" name="dueAsOf" value={dueAsOf} />
          <input type="hidden" name="status" value="OPEN" />
        </>
      )}

      <div className="grid gap-2">
        <Label>Цикл</Label>
        <p className="font-mono text-sm text-muted-foreground">
          {formatAsOfDisplay(cycleStartAsOf)}
        </p>
      </div>

      <div className="grid gap-2">
        <Label>Оплатить до</Label>
        <p className="font-mono text-sm text-muted-foreground">
          {formatAsOfDisplay(dueAsOf)}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`grace-amount-${accountId}-${cycleStartAsOf}`}>
          Платёж для беспроцентного
        </Label>
        <Input
          id={`grace-amount-${accountId}-${cycleStartAsOf}`}
          name="amountMajor"
          inputMode="decimal"
          autoComplete="off"
          value={amountMajor}
          onChange={(e) => setAmountMajor(e.target.value)}
          required
          aria-invalid={Boolean(state.errors?.amountMajor)}
          disabled={isPending}
        />
        <p className="text-sm text-muted-foreground">{UX01_DISCLAIMER}</p>
        {state.errors?.amountMajor?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.amountMajor[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`grace-note-${accountId}-${cycleStartAsOf}`}>
          Заметка
        </Label>
        <Input
          id={`grace-note-${accountId}-${cycleStartAsOf}`}
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

      {state.message && !state.success ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Не сохранять
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Сохранение…" : "Сохранить платёж"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CreditGraceAmountDialog({
  accountId,
  cycleStartAsOf,
  dueAsOf,
  currencyCode,
  mode = "create",
  obligationId,
  initialAmountMajor,
  initialNote,
  trigger,
}: CreditGraceAmountDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultTrigger = (
    <Button type="button" variant="outline" size="sm">
      {mode === "edit" ? "Изменить" : "Ввести сумму"}
    </Button>
  );

  void currencyCode;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFormKey((k) => k + 1);
      }}
    >
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="overflow-y-auto sm:max-w-md">
        {open ? (
          <CreditGraceAmountBody
            key={formKey}
            accountId={accountId}
            cycleStartAsOf={cycleStartAsOf}
            dueAsOf={dueAsOf}
            mode={mode}
            obligationId={obligationId}
            initialAmountMajor={initialAmountMajor}
            initialNote={initialNote}
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

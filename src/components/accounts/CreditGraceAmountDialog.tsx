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
  trigger?: ReactElement;
};

function CreditGraceAmountBody({
  accountId,
  cycleStartAsOf,
  dueAsOf,
  onSuccess,
}: {
  accountId: number;
  cycleStartAsOf: string;
  dueAsOf: string;
  onSuccess: () => void;
}) {
  const [amountMajor, setAmountMajor] = useState("");
  const [note, setNote] = useState("");
  const [state, formAction, isPending] = useActionState(
    createCreditGraceObligation,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="grid min-w-0 gap-4">
      <DialogHeader>
        <DialogTitle>Платёж для беспроцентного</DialogTitle>
        <DialogDescription>
          Сумма сохраняется для выбранного цикла. Срок оплаты фиксируется на
          сервере.
        </DialogDescription>
      </DialogHeader>

      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="cycleStartAsOf" value={cycleStartAsOf} />
      <input type="hidden" name="dueAsOf" value={dueAsOf} />
      <input type="hidden" name="status" value="OPEN" />

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
  trigger,
}: CreditGraceAmountDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultTrigger = (
    <Button type="button" variant="outline" size="sm">
      Ввести сумму
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
      <DialogContent className="overflow-y-auto sm:max-w-md">
        {open ? (
          <CreditGraceAmountBody
            key={formKey}
            accountId={accountId}
            cycleStartAsOf={cycleStartAsOf}
            dueAsOf={dueAsOf}
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

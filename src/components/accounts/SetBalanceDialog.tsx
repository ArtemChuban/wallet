"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import {
  upsertBalanceSnapshot,
  type BalanceActionState,
} from "@/app/accounts/actions";
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
import { formatAsOfDisplay, parseAsOfDisplay } from "@/lib/dates";

type AccountForBalance = {
  id: number;
  name: string;
  type: "FIAT_DEBIT" | "FIAT_CREDIT" | "CRYPTO" | "CASH";
  currencyCode: string;
  currency: { code: string; name: string; scale: number };
};

type SetBalanceDialogProps = {
  account: AccountForBalance;
  today: string;
  /** Emphasized first-balance CTA vs secondary «Задать баланс». */
  variant?: "first" | "secondary";
  trigger?: ReactElement;
};

const initialState: BalanceActionState = {};

function SetBalanceFormBody({
  account,
  today,
  onSuccess,
}: {
  account: AccountForBalance;
  today: string;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    upsertBalanceSnapshot,
    initialState,
  );
  const [asOfDisplay, setAsOfDisplay] = useState(() =>
    formatAsOfDisplay(today),
  );
  const asOfIso = parseAsOfDisplay(asOfDisplay) ?? "";

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const isCredit = account.type === "FIAT_CREDIT";
  const title = isCredit ? "Задать доступный лимит" : "Задать баланс";
  const amountLabel = isCredit ? "Доступный лимит" : "Баланс";

  return (
    <form action={formAction} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="min-w-0 break-words [overflow-wrap:anywhere]">
          {isCredit ? (
            <>
              Доступный остаток по «
              <span className="break-all">{account.name}</span>» на выбранную
              дату.
            </>
          ) : (
            <>
              Баланс «<span className="break-all">{account.name}</span>» на
              выбранную дату.
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      <input type="hidden" name="accountId" value={account.id} />
      <input type="hidden" name="asOfDate" value={asOfIso} />

      <div className="grid gap-2">
        <Label htmlFor="balance-amount">{amountLabel}</Label>
        <Input
          id="balance-amount"
          name="amountMajor"
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={Boolean(state.errors?.amountMajor)}
          disabled={isPending}
        />
        {isCredit ? (
          <p className="text-sm text-muted-foreground">
            Остаток лимита — сколько ещё можно потратить. Долг = лимит −
            доступно.
          </p>
        ) : null}
        {state.errors?.amountMajor?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.amountMajor[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="balance-as-of">Дата</Label>
        <Input
          id="balance-as-of"
          type="text"
          inputMode="numeric"
          placeholder="ДД.ММ.ГГГГ"
          autoComplete="off"
          value={asOfDisplay}
          onChange={(e) => setAsOfDisplay(e.target.value)}
          aria-invalid={
            Boolean(state.errors?.asOfDate) ||
            (asOfDisplay !== "" && !asOfIso)
          }
          disabled={isPending}
          className="font-mono"
        />
        <p className="text-sm text-muted-foreground">Формат: ДД.ММ.ГГГГ</p>
        {state.errors?.asOfDate?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.asOfDate[0]}
          </p>
        ) : null}
      </div>

      {state.message && !state.success ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Сохранение…" : "Сохранить баланс"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function SetBalanceDialog({
  account,
  today,
  variant = "secondary",
  trigger,
}: SetBalanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultTrigger =
    variant === "first" ? (
      <Button type="button">Задать первый баланс</Button>
    ) : (
      <Button type="button" variant="outline">
        Задать баланс
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
      <DialogContent className="min-w-0 overflow-hidden sm:max-w-md">
        {open ? (
          <SetBalanceFormBody
            key={formKey}
            account={account}
            today={today}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

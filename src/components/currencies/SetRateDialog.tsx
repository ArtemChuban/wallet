"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import {
  upsertFxRate,
  type FxRateActionState,
} from "@/app/currencies/actions";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAsOfDisplay, parseAsOfDisplay } from "@/lib/dates";
import { cn } from "@/lib/utils";

type CurrencyOption = {
  code: string;
  name: string;
};

type SetRateDialogProps = {
  currencies: CurrencyOption[];
  primaryCode: string;
  today: string;
  defaultCurrencyCode?: string;
  variant?: "first" | "secondary";
  trigger?: ReactElement;
};

const initialState: FxRateActionState = {};

function SetRateFormBody({
  currencies,
  primaryCode,
  today,
  defaultCurrencyCode,
  onSuccess,
}: {
  currencies: CurrencyOption[];
  primaryCode: string;
  today: string;
  defaultCurrencyCode?: string;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    upsertFxRate,
    initialState,
  );
  const [currencyCode, setCurrencyCode] = useState(
    () => defaultCurrencyCode ?? currencies[0]?.code ?? "",
  );
  const [direction, setDirection] = useState<"toPrimary" | "fromPrimary">(
    "toPrimary",
  );
  const [asOfDisplay, setAsOfDisplay] = useState(() =>
    formatAsOfDisplay(today),
  );
  const asOfIso = parseAsOfDisplay(asOfDisplay) ?? "";
  const isFutureDate = asOfIso !== "" && asOfIso > today;

  const otherCode = currencyCode || "…";

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const canSubmit =
    currencyCode !== "" && asOfIso !== "" && !isFutureDate && !isPending;

  return (
    <form action={formAction} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Задать курс</DialogTitle>
        <DialogDescription className="min-w-0 break-words [overflow-wrap:anywhere]">
          Курс между выбранной валютой и основной ({primaryCode}) на дату.
        </DialogDescription>
      </DialogHeader>

      <input type="hidden" name="currencyCode" value={currencyCode} />
      <input type="hidden" name="direction" value={direction} />
      <input type="hidden" name="asOfDate" value={asOfIso} />

      <div className="grid gap-2">
        <Label>Валюта</Label>
        {currencies.length === 1 ? (
          <p className="font-mono text-sm text-muted-foreground">
            {currencies[0]!.code}
            <span className="text-muted-foreground">
              {" "}
              — {currencies[0]!.name}
            </span>
          </p>
        ) : (
          <Select
            value={currencyCode}
            onValueChange={(value) => {
              if (value != null) setCurrencyCode(String(value));
            }}
            disabled={isPending}
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={Boolean(state.errors?.currencyCode)}
            >
              <SelectValue placeholder="Выберите валюту" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="font-mono">{c.code}</span>
                  <span className="text-muted-foreground"> — {c.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {state.errors?.currencyCode?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.currencyCode[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label>Направление</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={direction === "toPrimary" ? "default" : "outline"}
            className={cn(
              "min-h-11 shrink-0 font-mono text-xs sm:text-sm",
              direction !== "toPrimary" && "bg-muted/40",
            )}
            disabled={isPending}
            onClick={() => setDirection("toPrimary")}
          >
            1 {otherCode} = N {primaryCode}
          </Button>
          <Button
            type="button"
            variant={direction === "fromPrimary" ? "default" : "outline"}
            className={cn(
              "min-h-11 shrink-0 font-mono text-xs sm:text-sm",
              direction !== "fromPrimary" && "bg-muted/40",
            )}
            disabled={isPending}
            onClick={() => setDirection("fromPrimary")}
          >
            1 {primaryCode} = N {otherCode}
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="fx-rate-major">Курс</Label>
        <Input
          id="fx-rate-major"
          name="rateMajor"
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={Boolean(state.errors?.rateMajor)}
          disabled={isPending || currencyCode === ""}
        />
        {state.errors?.rateMajor?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.rateMajor[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="fx-as-of">Дата</Label>
        <Input
          id="fx-as-of"
          type="text"
          inputMode="numeric"
          placeholder="ДД.ММ.ГГГГ"
          autoComplete="off"
          value={asOfDisplay}
          onChange={(e) => setAsOfDisplay(e.target.value)}
          aria-invalid={
            Boolean(state.errors?.asOfDate) ||
            isFutureDate ||
            (asOfDisplay !== "" && !asOfIso)
          }
          disabled={isPending}
          className="font-mono"
        />
        <p className="text-sm text-muted-foreground">Формат: ДД.ММ.ГГГГ</p>
        {isFutureDate ? (
          <p className="text-sm text-destructive" role="alert">
            Дата не может быть в будущем
          </p>
        ) : null}
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
        <Button type="submit" disabled={!canSubmit}>
          {isPending ? "Сохранение…" : "Сохранить курс"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function SetRateDialog({
  currencies,
  primaryCode,
  today,
  defaultCurrencyCode,
  variant = "secondary",
  trigger,
}: SetRateDialogProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultTrigger =
    variant === "first" ? (
      <Button type="button">Задать первый курс</Button>
    ) : (
      <Button type="button" variant="outline">
        Задать курс
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
          <SetRateFormBody
            key={formKey}
            currencies={currencies}
            primaryCode={primaryCode}
            today={today}
            defaultCurrencyCode={defaultCurrencyCode}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

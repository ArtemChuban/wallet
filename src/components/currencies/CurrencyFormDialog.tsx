"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import {
  createCurrency,
  updateCurrencyName,
  type CurrencyActionState,
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

type CurrencyRow = {
  code: string;
  name: string;
  scale: number;
};

type CurrencyFormDialogProps =
  | { mode: "create"; currency?: undefined; trigger?: ReactElement }
  | { mode: "edit"; currency: CurrencyRow; trigger?: ReactElement };

const initialState: CurrencyActionState = {};

const SCALE_OPTIONS = Array.from({ length: 19 }, (_, i) => i);

function CurrencyFormBody({
  mode,
  currency,
  onSuccess,
}: {
  mode: "create" | "edit";
  currency?: CurrencyRow;
  onSuccess: () => void;
}) {
  const [scale, setScale] = useState(
    mode === "edit" && currency ? String(currency.scale) : "2",
  );
  const [name, setName] = useState(
    mode === "edit" && currency ? currency.name : "",
  );

  const action = mode === "create" ? createCurrency : updateCurrencyName;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const title = mode === "create" ? "Новая валюта" : "Изменить название";
  const submitLabel = mode === "create" ? "Добавить валюту" : "Сохранить";

  return (
    <form action={formAction} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Код и масштаб нельзя изменить после создания."
            : "Можно изменить только название."}
        </DialogDescription>
      </DialogHeader>

      {mode === "edit" && currency ? (
        <input type="hidden" name="code" value={currency.code} />
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor={mode === "create" ? "currency-code" : undefined}>
          Код
        </Label>
        {mode === "create" ? (
          <Input
            id="currency-code"
            name="code"
            autoComplete="off"
            aria-invalid={Boolean(state.errors?.code)}
            disabled={isPending}
          />
        ) : (
          <p className="font-mono text-sm text-muted-foreground">
            {currency?.code}
          </p>
        )}
        {state.errors?.code?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.code[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="currency-name">Название</Label>
        <Input
          id="currency-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          autoComplete="off"
          aria-invalid={Boolean(state.errors?.name)}
          disabled={isPending}
        />
        {state.errors?.name?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.name[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label>Масштаб</Label>
        {mode === "create" ? (
          <>
            <input type="hidden" name="scale" value={scale} />
            <Select
              value={scale}
              onValueChange={(value) => {
                if (value != null) setScale(String(value));
              }}
              disabled={isPending}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={Boolean(state.errors?.scale)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCALE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <p className="font-mono text-sm text-muted-foreground">
            {currency?.scale}
          </p>
        )}
        {state.errors?.scale?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.scale[0]}
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
          {isPending ? "Сохранение…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CurrencyFormDialog(props: CurrencyFormDialogProps) {
  const { mode, trigger } = props;
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultTrigger =
    mode === "create" ? (
      <Button type="button">Добавить валюту</Button>
    ) : (
      <Button type="button" variant="outline">
        Изменить
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
      <DialogContent className="sm:max-w-md">
        {open ? (
          <CurrencyFormBody
            key={formKey}
            mode={mode}
            currency={mode === "edit" ? props.currency : undefined}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

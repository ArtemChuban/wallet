"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import {
  createAccount,
  updateAccountName,
  type AccountActionState,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMinorToMajor } from "@/lib/money";

type CurrencyOption = {
  code: string;
  name: string;
  scale: number;
};

type AccountRow = {
  id: number;
  name: string;
  type: "FIAT_DEBIT" | "FIAT_CREDIT" | "CRYPTO" | "CASH";
  currencyCode: string;
  /** Serialized BigInt string from RSC. */
  creditLimitMinor: string | null;
  currency: { code: string; name: string; scale: number };
};

type AccountFormDialogProps =
  | {
      mode: "create";
      currencies: CurrencyOption[];
      account?: undefined;
      trigger?: ReactElement;
    }
  | {
      mode: "edit";
      account: AccountRow;
      currencies: CurrencyOption[];
      trigger?: ReactElement;
    };

const initialState: AccountActionState = {};

const TYPE_OPTIONS = [
  { value: "FIAT_DEBIT", label: "Дебетовый" },
  { value: "FIAT_CREDIT", label: "Кредитный" },
  { value: "CRYPTO", label: "Крипто" },
  { value: "CASH", label: "Наличные" },
] as const;

const TYPE_LABELS: Record<AccountRow["type"], string> = {
  FIAT_DEBIT: "Дебетовый",
  FIAT_CREDIT: "Кредитный",
  CRYPTO: "Крипто",
  CASH: "Наличные",
};

function AccountFormBody({
  mode,
  account,
  currencies,
  onSuccess,
}: {
  mode: "create" | "edit";
  account?: AccountRow;
  currencies: CurrencyOption[];
  onSuccess: () => void;
}) {
  const [accountType, setAccountType] = useState<string>(
    mode === "edit" && account ? account.type : "FIAT_DEBIT",
  );
  const [currencyCode, setCurrencyCode] = useState<string>(
    mode === "edit" && account
      ? account.currencyCode
      : (currencies[0]?.code ?? ""),
  );
  const [name, setName] = useState(
    mode === "edit" && account ? account.name : "",
  );

  const action = mode === "create" ? createAccount : updateAccountName;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const title = mode === "create" ? "Новый счёт" : "Изменить название";
  const submitLabel = mode === "create" ? "Добавить счёт" : "Сохранить";
  const showCreditLimit = mode === "create" && accountType === "FIAT_CREDIT";

  const editLimit =
    mode === "edit" &&
    account &&
    account.type === "FIAT_CREDIT" &&
    account.creditLimitMinor != null
      ? `${formatMinorToMajor(BigInt(account.creditLimitMinor), account.currency.scale)} ${account.currencyCode}`
      : null;

  return (
    <form action={formAction} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Тип, валюта и кредитный лимит нельзя изменить после создания."
            : "Можно изменить только название."}
        </DialogDescription>
      </DialogHeader>

      {mode === "edit" && account ? (
        <input type="hidden" name="id" value={account.id} />
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="account-name">Название</Label>
        <Input
          id="account-name"
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
        <Label>Тип</Label>
        {mode === "create" ? (
          <>
            <input type="hidden" name="type" value={accountType} />
            <Select
              value={accountType}
              onValueChange={(value) => {
                if (value != null) setAccountType(String(value));
              }}
              disabled={isPending}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={Boolean(state.errors?.type)}
              >
                <SelectValue>
                  {(value: string | null) =>
                    value
                      ? (TYPE_LABELS[value as AccountRow["type"]] ?? value)
                      : null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {account ? TYPE_LABELS[account.type] : null}
          </p>
        )}
        {state.errors?.type?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.type[0]}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label>Валюта</Label>
        {mode === "create" ? (
          <>
            <input type="hidden" name="currencyCode" value={currencyCode} />
            <Select
              value={currencyCode}
              onValueChange={(value) => {
                if (value != null) setCurrencyCode(String(value));
              }}
              disabled={isPending || currencies.length === 0}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={Boolean(state.errors?.currencyCode)}
              >
                <SelectValue />
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
          </>
        ) : (
          <p className="font-mono text-sm text-muted-foreground">
            {account?.currencyCode}
          </p>
        )}
        {state.errors?.currencyCode?.[0] ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors.currencyCode[0]}
          </p>
        ) : null}
      </div>

      {showCreditLimit ? (
        <div className="grid gap-2">
          <Label htmlFor="credit-limit">Кредитный лимит</Label>
          <Input
            id="credit-limit"
            name="creditLimitMajor"
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={Boolean(state.errors?.creditLimitMajor)}
            disabled={isPending}
          />
          <p className="text-sm text-muted-foreground">
            в единицах выбранной валюты
          </p>
          {state.errors?.creditLimitMajor?.[0] ? (
            <p className="text-sm text-destructive" role="alert">
              {state.errors.creditLimitMajor[0]}
            </p>
          ) : null}
        </div>
      ) : null}

      {mode === "edit" && editLimit ? (
        <div className="grid gap-2">
          <Label>Кредитный лимит</Label>
          <p className="font-mono text-sm text-muted-foreground">{editLimit}</p>
        </div>
      ) : null}

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

export function AccountFormDialog(props: AccountFormDialogProps) {
  const { mode, currencies, trigger } = props;
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultTrigger =
    mode === "create" ? (
      <Button type="button">Добавить счёт</Button>
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
          <AccountFormBody
            key={formKey}
            mode={mode}
            account={mode === "edit" ? props.account : undefined}
            currencies={currencies}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

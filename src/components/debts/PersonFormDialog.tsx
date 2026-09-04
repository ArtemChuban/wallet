"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import {
  createPerson,
  type PersonActionState,
} from "@/app/debts/actions";
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

type PersonFormDialogProps = {
  mode: "create";
  trigger?: ReactElement;
};

const initialState: PersonActionState = {};

function PersonFormBody({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [state, formAction, isPending] = useActionState(
    createPerson,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Новый человек</DialogTitle>
        <DialogDescription>
          Добавьте человека, чтобы учитывать долги.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="person-name">Имя</Label>
        <Input
          id="person-name"
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
          {isPending ? "Сохранение…" : "Создать человека"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PersonFormDialog({ trigger }: PersonFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultTrigger = (
    <Button type="button">Новый человек</Button>
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
          <PersonFormBody
            key={formKey}
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

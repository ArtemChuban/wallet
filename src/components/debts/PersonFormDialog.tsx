"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import {
  createPerson,
  renamePerson,
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

type PersonRow = {
  id: number;
  name: string;
};

type PersonFormDialogProps =
  | {
      mode: "create";
      person?: undefined;
      trigger?: ReactElement;
    }
  | {
      mode: "edit";
      person: PersonRow;
      trigger?: ReactElement;
    };

const initialState: PersonActionState = {};

function PersonFormBody({
  mode,
  person,
  onSuccess,
}: {
  mode: "create" | "edit";
  person?: PersonRow;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(
    mode === "edit" && person ? person.name : "",
  );
  const action = mode === "create" ? createPerson : renamePerson;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);

  const title = mode === "create" ? "Новый человек" : "Изменить имя";
  const description =
    mode === "create"
      ? "Добавьте человека, чтобы учитывать долги."
      : "Можно изменить только имя.";
  const submitLabel =
    mode === "create" ? "Создать человека" : "Сохранить имя";

  return (
    <form action={formAction} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {mode === "edit" && person ? (
        <input type="hidden" name="personId" value={person.id} />
      ) : null}

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
          {isPending ? "Сохранение…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PersonFormDialog(props: PersonFormDialogProps) {
  const { mode, trigger } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const defaultTrigger =
    mode === "create" ? (
      <Button type="button">Новый человек</Button>
    ) : (
      <Button type="button" variant="outline">
        Изменить имя
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
          <PersonFormBody
            key={formKey}
            mode={mode}
            person={mode === "edit" ? props.person : undefined}
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

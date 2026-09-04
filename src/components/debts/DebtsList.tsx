"use client";

import { PersonFormDialog } from "@/components/debts/PersonFormDialog";

export type PersonListItem = {
  id: number;
  name: string;
};

export function DebtsList({ people }: { people: PersonListItem[] }) {
  if (people.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8">
        <div className="grid gap-2">
          <h2 className="text-base font-semibold text-foreground">Нет людей</h2>
          <p className="max-w-prose text-base text-muted-foreground">
            Добавьте человека или создайте долг, чтобы вести учёт.
          </p>
        </div>
        <PersonFormDialog mode="create" />
      </div>
    );
  }

  return (
    <ul className="rounded-lg border border-border bg-background">
      {people.map((person) => (
        <li
          key={person.id}
          className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
        >
          <p className="min-w-0 truncate text-base text-foreground">
            {person.name}
          </p>
        </li>
      ))}
    </ul>
  );
}

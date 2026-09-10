/**
 * MCP Долги list loader (SIDE-01).
 * Page-parity Person/Debt batch + remainingMinor + computeDebtPrimaryTotals.
 * Totals colocated in list_debts payload — never fold into NW.
 */

import {
  assertStatusSynced,
  computeDebtPrimaryTotals,
  remainingMinor,
  type DebtDirection,
  type DebtExcludeReason,
  type DebtPrimaryTotalsInput,
  type DebtStatus,
} from "@/lib/debts";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { firstHitLocfMap } from "@/lib/locf";
import { minorToJson } from "@/lib/mcp/serialize";

export type DebtListDebtInput = {
  id: number;
  direction: DebtDirection;
  currencyCode: string;
  currencyScale: number;
  initialAmountMinor: bigint;
  openedAsOf: string;
  remainingMinor: bigint;
  status: DebtStatus;
  dueDate: string | null;
  note: string | null;
};

export type DebtListPersonInput = {
  id: number;
  name: string;
  debts: DebtListDebtInput[];
};

export type DebtTotalsRowInput = {
  debtId: number;
  direction: DebtDirection;
  includedInTotal: boolean;
  excludeReason: DebtExcludeReason;
  contributionPrimaryMinor: bigint;
  remainingNativeMinor: bigint;
};

export type SerializeDebtsPayloadArgs = {
  today: string;
  includeClosed: boolean;
  primaryCurrencyCode: string;
  primaryScale: number;
  people: DebtListPersonInput[];
  totals: {
    iOwePrimaryMinor: bigint;
    theyOwePrimaryMinor: bigint;
    isPartial: boolean;
    rows: DebtTotalsRowInput[];
  };
};

export type SerializedDebtRow = {
  id: number;
  direction: DebtDirection;
  currencyCode: string;
  currencyScale: number;
  initialAmountMinor: string;
  openedAsOf: string;
  remainingMinor: string;
  status: DebtStatus;
  dueDate: string | null;
  note: string | null;
};

export type SerializedDebtPerson = {
  id: number;
  name: string;
  debts: SerializedDebtRow[];
};

export type SerializedDebtsPayload = {
  today: string;
  includeClosed: boolean;
  primaryCurrencyCode: string;
  primaryScale: number;
  people: SerializedDebtPerson[];
  totals: {
    iOwePrimaryMinor: string;
    theyOwePrimaryMinor: string;
    isPartial: boolean;
    rows: Array<{
      debtId: number;
      direction: DebtDirection;
      includedInTotal: boolean;
      excludeReason: DebtExcludeReason;
      contributionPrimaryMinor: string;
      remainingNativeMinor: string;
    }>;
  };
};

/** OPEN-focused list filter (DebtsList parity). includeClosed true keeps CLOSED. */
export function filterDebtsForList(
  people: DebtListPersonInput[],
  includeClosed: boolean,
): DebtListPersonInput[] {
  return people
    .map((p) => ({
      ...p,
      debts: includeClosed
        ? p.debts
        : p.debts.filter((d) => d.status !== "CLOSED"),
    }))
    .filter((p) => p.debts.length > 0);
}

/**
 * Pure adapter: stringify debts list + colocated primary totals (SQLite-free).
 */
export function serializeDebtsPayload(
  args: SerializeDebtsPayloadArgs,
): SerializedDebtsPayload {
  return {
    today: args.today,
    includeClosed: args.includeClosed,
    primaryCurrencyCode: args.primaryCurrencyCode,
    primaryScale: args.primaryScale,
    people: args.people.map((p) => ({
      id: p.id,
      name: p.name,
      debts: p.debts.map((d) => ({
        id: d.id,
        direction: d.direction,
        currencyCode: d.currencyCode,
        currencyScale: d.currencyScale,
        initialAmountMinor: minorToJson(d.initialAmountMinor)!,
        openedAsOf: d.openedAsOf,
        remainingMinor: minorToJson(d.remainingMinor)!,
        status: d.status,
        dueDate: d.dueDate,
        note: d.note,
      })),
    })),
    totals: {
      iOwePrimaryMinor: minorToJson(args.totals.iOwePrimaryMinor)!,
      theyOwePrimaryMinor: minorToJson(args.totals.theyOwePrimaryMinor)!,
      isPartial: args.totals.isPartial,
      rows: args.totals.rows.map((r) => ({
        debtId: r.debtId,
        direction: r.direction,
        includedInTotal: r.includedInTotal,
        excludeReason: r.excludeReason,
        contributionPrimaryMinor: minorToJson(r.contributionPrimaryMinor)!,
        remainingNativeMinor: minorToJson(r.remainingNativeMinor)!,
      })),
    },
  };
}

/**
 * Debts-page-parity loader for list_debts.
 * Uses remainingMinor + computeDebtPrimaryTotals only — no twin arithmetic.
 */
export async function loadDebts(args: {
  includeClosed?: boolean;
  today: string;
}): Promise<SerializedDebtsPayload> {
  const includeClosed = args.includeClosed ?? false;
  const { today } = args;
  await ensureSqlitePragmas();

  const [peopleRaw, primaryCurrency, ratesLteToday] = await Promise.all([
    prisma.person.findMany({
      orderBy: { name: "asc" },
      include: {
        debts: {
          orderBy: { id: "desc" },
          include: {
            currency: {
              select: {
                code: true,
                name: true,
                scale: true,
                isPrimary: true,
              },
            },
            repayments: {
              select: {
                id: true,
                asOfDate: true,
                amountMinor: true,
                note: true,
              },
            },
            sizeChanges: {
              select: {
                id: true,
                asOfDate: true,
                deltaMinor: true,
                note: true,
              },
            },
          },
        },
      },
    }),
    prisma.currency.findFirst({
      where: { isPrimary: true },
      select: { code: true, scale: true },
    }),
    prisma.fxRate.findMany({
      where: { asOfDate: { lte: today } },
      orderBy: { asOfDate: "desc" },
      select: {
        currencyCode: true,
        asOfDate: true,
        rateToPrimaryScaled: true,
      },
    }),
  ]);

  const primaryCode = primaryCurrency?.code ?? "RUB";
  const primaryScale = primaryCurrency?.scale ?? 2;
  const locfByCurrency = firstHitLocfMap(
    ratesLteToday,
    (rate) => rate.currencyCode,
  );

  const peopleWithRemaining: DebtListPersonInput[] = peopleRaw.map((p) => ({
    id: p.id,
    name: p.name,
    debts: p.debts.map((d) => {
      const remaining = remainingMinor(
        d.initialAmountMinor,
        d.sizeChanges.map((s) => s.deltaMinor),
        d.repayments.map((r) => r.amountMinor),
      );
      assertStatusSynced(d.status, remaining);
      return {
        id: d.id,
        direction: d.direction as DebtDirection,
        currencyCode: d.currencyCode,
        currencyScale: d.currency.scale,
        initialAmountMinor: d.initialAmountMinor,
        openedAsOf: d.openedAsOf,
        remainingMinor: remaining,
        status: d.status as DebtStatus,
        dueDate: d.dueDate,
        note: d.note,
      };
    }),
  }));

  const totalsInputs: DebtPrimaryTotalsInput[] = peopleRaw.flatMap((p) =>
    p.debts.map((d) => {
      const remaining = remainingMinor(
        d.initialAmountMinor,
        d.sizeChanges.map((s) => s.deltaMinor),
        d.repayments.map((r) => r.amountMinor),
      );
      assertStatusSynced(d.status, remaining);
      const rate = locfByCurrency.get(d.currencyCode) ?? null;
      return {
        id: d.id,
        direction: d.direction as DebtDirection,
        status: d.status as DebtStatus,
        remainingMinor: remaining,
        currencyScale: d.currency.scale,
        isPrimaryCurrency: d.currency.isPrimary,
        rateToPrimaryScaled: d.currency.isPrimary
          ? null
          : (rate?.rateToPrimaryScaled ?? null),
        primaryScale,
      };
    }),
  );

  const { rows, iOwePrimaryMinor, theyOwePrimaryMinor, isPartial } =
    computeDebtPrimaryTotals(totalsInputs);

  const filteredPeople = filterDebtsForList(peopleWithRemaining, includeClosed);

  return serializeDebtsPayload({
    today,
    includeClosed,
    primaryCurrencyCode: primaryCode,
    primaryScale,
    people: filteredPeople,
    totals: {
      iOwePrimaryMinor,
      theyOwePrimaryMinor,
      isPartial,
      rows,
    },
  });
}

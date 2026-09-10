/**
 * MCP Грейс list loader (SIDE-03).
 * Credit accounts + mergeGraceListRows (OPEN + CTA); CLOSED omitted.
 * Read-only prisma — never BalanceSnapshot mutate / historical-series (GRISO).
 */

import {
  isGraceOverdue,
  mergeGraceListRows,
  type CreditGraceSchedule,
  type GraceListRow,
  type GraceObligationListItem,
} from "@/lib/credit-grace";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { minorToJson } from "@/lib/mcp/serialize";

export type GraceSerializedOpenRow = {
  kind: "open";
  overdue: boolean;
  obligation: {
    id: number;
    cycleStartAsOf: string;
    dueAsOf: string;
    amountMinor: string;
    note: string | null;
  };
};

export type GraceSerializedCtaRow = {
  kind: "cta";
  overdue: boolean;
  cycleStartAsOf: string;
  dueAsOf: string;
};

export type GraceSerializedRow = GraceSerializedOpenRow | GraceSerializedCtaRow;

export type GraceAccountListInput = {
  id: number;
  name: string;
  currencyCode: string;
  currencyScale: number;
  statementDayOfMonth: number | null;
  dueDayOfMonth: number | null;
  rows: Array<
    | {
        kind: "open";
        overdue: boolean;
        obligation: {
          id: number;
          cycleStartAsOf: string;
          dueAsOf: string;
          amountMinor: bigint;
          note: string | null;
        };
      }
    | {
        kind: "cta";
        overdue: boolean;
        cycleStartAsOf: string;
        dueAsOf: string;
      }
  >;
};

export type SerializedGracePayload = {
  today: string;
  accounts: Array<{
    id: number;
    name: string;
    currencyCode: string;
    currencyScale: number;
    statementDayOfMonth: number | null;
    dueDayOfMonth: number | null;
    rows: GraceSerializedRow[];
  }>;
};

function mapMergedRow(row: GraceListRow, today: string): GraceAccountListInput["rows"][number] {
  if (row.kind === "open") {
    return {
      kind: "open",
      overdue: isGraceOverdue(row.obligation.dueAsOf, today),
      obligation: {
        id: row.obligation.id,
        cycleStartAsOf: row.obligation.cycleStartAsOf,
        dueAsOf: row.obligation.dueAsOf,
        amountMinor: BigInt(row.obligation.amountMinor),
        note: row.obligation.note,
      },
    };
  }
  return {
    kind: "cta",
    overdue: isGraceOverdue(row.dueAsOf, today),
    cycleStartAsOf: row.cycleStartAsOf,
    dueAsOf: row.dueAsOf,
  };
}

/** Pure adapter: grace list rows → string minors (SQLite-free). */
export function serializeGracePayload(args: {
  today: string;
  accounts: GraceAccountListInput[];
}): SerializedGracePayload {
  return {
    today: args.today,
    accounts: args.accounts.map((a) => ({
      id: a.id,
      name: a.name,
      currencyCode: a.currencyCode,
      currencyScale: a.currencyScale,
      statementDayOfMonth: a.statementDayOfMonth,
      dueDayOfMonth: a.dueDayOfMonth,
      rows: a.rows.map((row) => {
        if (row.kind === "open") {
          return {
            kind: "open" as const,
            overdue: row.overdue,
            obligation: {
              id: row.obligation.id,
              cycleStartAsOf: row.obligation.cycleStartAsOf,
              dueAsOf: row.obligation.dueAsOf,
              amountMinor: minorToJson(row.obligation.amountMinor)!,
              note: row.obligation.note,
            },
          };
        }
        return {
          kind: "cta" as const,
          overdue: row.overdue,
          cycleStartAsOf: row.cycleStartAsOf,
          dueAsOf: row.dueAsOf,
        };
      }),
    })),
  };
}

/**
 * CreditGraceDialog-parity loader for list_grace_obligations.
 * FIAT_CREDIT with schedule → mergeGraceListRows; accounts without schedule omitted.
 */
export async function loadGrace(args: {
  today: string;
}): Promise<SerializedGracePayload> {
  const { today } = args;
  await ensureSqlitePragmas();

  const accountsRaw = await prisma.account.findMany({
    where: { type: "FIAT_CREDIT" },
    orderBy: { name: "asc" },
    include: {
      currency: {
        select: { code: true, scale: true },
      },
      creditGraceObligations: {
        orderBy: { cycleStartAsOf: "desc" },
      },
    },
  });

  const accounts: GraceAccountListInput[] = [];
  for (const a of accountsRaw) {
    const hasSchedule =
      a.statementDayOfMonth != null && a.dueDayOfMonth != null;
    if (!hasSchedule) continue;

    const schedule: CreditGraceSchedule = {
      statementDayOfMonth: a.statementDayOfMonth!,
      dueDayOfMonth: a.dueDayOfMonth!,
    };

    const obligations: GraceObligationListItem[] =
      a.creditGraceObligations.map((o) => ({
        id: o.id,
        cycleStartAsOf: o.cycleStartAsOf,
        dueAsOf: o.dueAsOf,
        amountMinor: o.amountMinor.toString(),
        status: o.status as "OPEN" | "CLOSED",
        note: o.note,
      }));

    const merged = mergeGraceListRows(schedule, today, obligations);
    accounts.push({
      id: a.id,
      name: a.name,
      currencyCode: a.currencyCode,
      currencyScale: a.currency.scale,
      statementDayOfMonth: a.statementDayOfMonth,
      dueDayOfMonth: a.dueDayOfMonth,
      rows: merged.map((row) => mapMergedRow(row, today)),
    });
  }

  return serializeGracePayload({ today, accounts });
}

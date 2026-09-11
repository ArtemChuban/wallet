/** Soft-read helpers for AccountType (QUICK-0i7 ASSET merge). */

export type AccountTypeSoft =
  | "ASSET"
  | "FIAT_CREDIT"
  | "FIAT_DEBIT"
  | "CRYPTO"
  | "CASH"
  | "SAVINGS";

export function isCreditType(t: string): boolean {
  return t === "FIAT_CREDIT";
}

/** True for canonical ASSET, SAVINGS, and legacy non-credit members. */
export function isAssetType(t: string): boolean {
  return (
    t === "ASSET" ||
    t === "SAVINGS" ||
    t === "FIAT_DEBIT" ||
    t === "CRYPTO" ||
    t === "CASH"
  );
}

export function accountTypeLabel(t: string): string {
  if (isCreditType(t)) return "Кредитный";
  if (t === "SAVINGS") return "Накопительный";
  return "Актив";
}

/** Soft-read helpers for AccountType (QUICK-0i7 ASSET merge). */

export type AccountTypeSoft =
  | "ASSET"
  | "FIAT_CREDIT"
  | "FIAT_DEBIT"
  | "CRYPTO"
  | "CASH";

export function isCreditType(t: string): boolean {
  return t === "FIAT_CREDIT";
}

/** True for canonical ASSET and legacy non-credit members. */
export function isAssetType(t: string): boolean {
  return (
    t === "ASSET" ||
    t === "FIAT_DEBIT" ||
    t === "CRYPTO" ||
    t === "CASH"
  );
}

export function accountTypeLabel(t: string): string {
  return isCreditType(t) ? "Кредитный" : "Актив";
}

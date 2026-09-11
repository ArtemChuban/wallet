-- RedefineTables: add annualRateBps + accrualDayOfMonth + Account_savings_rate_invariant;
-- keep Account_credit_limit_invariant + Account_grace_dom_invariant
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "creditLimitMinor" BIGINT,
    "statementDayOfMonth" INTEGER,
    "dueDayOfMonth" INTEGER,
    "annualRateBps" INTEGER,
    "accrualDayOfMonth" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Account_credit_limit_invariant" CHECK (
        (type = 'FIAT_CREDIT' AND creditLimitMinor IS NOT NULL AND creditLimitMinor > 0)
        OR
        (type != 'FIAT_CREDIT' AND creditLimitMinor IS NULL)
    ),
    CONSTRAINT "Account_grace_dom_invariant" CHECK (
        (
            type = 'FIAT_CREDIT'
            AND (
                (statementDayOfMonth IS NULL AND dueDayOfMonth IS NULL)
                OR (
                    statementDayOfMonth IS NOT NULL AND dueDayOfMonth IS NOT NULL
                    AND statementDayOfMonth BETWEEN 1 AND 31
                    AND dueDayOfMonth BETWEEN 1 AND 31
                )
            )
        )
        OR (
            type != 'FIAT_CREDIT'
            AND statementDayOfMonth IS NULL
            AND dueDayOfMonth IS NULL
        )
    ),
    CONSTRAINT "Account_savings_rate_invariant" CHECK (
        (
            type = 'SAVINGS'
            AND annualRateBps IS NOT NULL
            AND annualRateBps >= 0
            AND accrualDayOfMonth IS NOT NULL
            AND accrualDayOfMonth BETWEEN 1 AND 31
        )
        OR (
            type != 'SAVINGS'
            AND annualRateBps IS NULL
            AND accrualDayOfMonth IS NULL
        )
    )
);
INSERT INTO "new_Account" ("id", "name", "type", "currencyCode", "creditLimitMinor", "statementDayOfMonth", "dueDayOfMonth", "createdAt", "updatedAt")
SELECT "id", "name", "type", "currencyCode", "creditLimitMinor", "statementDayOfMonth", "dueDayOfMonth", "createdAt", "updatedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_name_key" ON "Account"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineTables: add dual DOM columns + Account_grace_dom_invariant; keep Account_credit_limit_invariant
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
    )
);
INSERT INTO "new_Account" ("id", "name", "type", "currencyCode", "creditLimitMinor", "createdAt", "updatedAt")
SELECT "id", "name", "type", "currencyCode", "creditLimitMinor", "createdAt", "updatedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_name_key" ON "Account"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "CreditGraceObligation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "cycleStartAsOf" TEXT NOT NULL,
    "dueAsOf" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closedAsOf" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CreditGraceObligation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CreditGraceObligation_status_closedAsOf_invariant" CHECK (
        (status = 'OPEN' AND closedAsOf IS NULL)
        OR
        (status = 'CLOSED' AND closedAsOf IS NOT NULL)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditGraceObligation_accountId_cycleStartAsOf_key" ON "CreditGraceObligation"("accountId", "cycleStartAsOf");

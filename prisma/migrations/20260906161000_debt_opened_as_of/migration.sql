-- Add Debt.openedAsOf (YYYY-MM-DD); backfill from createdAt as Europe/Moscow calendar date (UTC+3, no DST since 2014).
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Debt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "personId" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "initialAmountMinor" BIGINT NOT NULL,
    "openedAsOf" TEXT NOT NULL,
    "dueDate" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Debt_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Debt_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Debt" ("id", "personId", "direction", "currencyCode", "initialAmountMinor", "openedAsOf", "dueDate", "note", "status", "createdAt", "updatedAt")
SELECT
    "id",
    "personId",
    "direction",
    "currencyCode",
    "initialAmountMinor",
    strftime('%Y-%m-%d', datetime("createdAt", '+3 hours')),
    "dueDate",
    "note",
    "status",
    "createdAt",
    "updatedAt"
FROM "Debt";
DROP TABLE "Debt";
ALTER TABLE "new_Debt" RENAME TO "Debt";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

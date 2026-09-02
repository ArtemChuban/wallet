-- AlterTable: add isPrimary (SQLite table rebuild)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Currency" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scale" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Currency" ("code", "name", "scale") SELECT "code", "name", "scale" FROM "Currency";
DROP TABLE "Currency";
ALTER TABLE "new_Currency" RENAME TO "Currency";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Seed primary RUB (D-01); must run on migrate deploy (not prisma db seed)
INSERT INTO "Currency" ("code", "name", "scale", "isPrimary")
VALUES ('RUB', 'Рубль', 2, true);

-- Exactly-one primary (D-02): partial unique index
CREATE UNIQUE INDEX "Currency_one_primary" ON "Currency"("isPrimary") WHERE "isPrimary" = 1;

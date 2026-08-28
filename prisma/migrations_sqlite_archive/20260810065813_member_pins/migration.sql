-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "pin" TEXT NOT NULL DEFAULT '0000',
    "order" INTEGER NOT NULL
);
INSERT INTO "new_Member" ("colorHex", "emoji", "id", "name", "order") SELECT "colorHex", "emoji", "id", "name", "order" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_order_key" ON "Member"("order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "_expenseSplit" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_expenseSplit_A_fkey" FOREIGN KEY ("A") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_expenseSplit_B_fkey" FOREIGN KEY ("B") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "pin" TEXT NOT NULL DEFAULT '0000',
    "isAway" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL
);
INSERT INTO "new_Member" ("colorHex", "emoji", "id", "name", "order", "pin") SELECT "colorHex", "emoji", "id", "name", "order", "pin" FROM "Member";
DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";
CREATE UNIQUE INDEX "Member_order_key" ON "Member"("order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_expenseSplit_AB_unique" ON "_expenseSplit"("A", "B");

-- CreateIndex
CREATE INDEX "_expenseSplit_B_index" ON "_expenseSplit"("B");

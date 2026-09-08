-- Member: anti-bruteforce + session invalidation columns
ALTER TABLE "Member" ADD COLUMN "failedPinAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Member" ADD COLUMN "pinLockedUntil" TIMESTAMP(3);
ALTER TABLE "Member" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- Foreign-key / filter-column indexes (Postgres does not create these automatically)
CREATE INDEX "Payment_fromId_idx" ON "Payment"("fromId");
CREATE INDEX "Payment_toId_idx" ON "Payment"("toId");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

CREATE INDEX "CleaningSubtask_taskId_idx" ON "CleaningSubtask"("taskId");

CREATE INDEX "CleaningWeek_weekStart_idx" ON "CleaningWeek"("weekStart");
CREATE INDEX "CleaningWeek_memberId_idx" ON "CleaningWeek"("memberId");
CREATE INDEX "CleaningWeek_taskId_idx" ON "CleaningWeek"("taskId");

CREATE INDEX "SubtaskCheck_cleaningWeekId_idx" ON "SubtaskCheck"("cleaningWeekId");
CREATE INDEX "SubtaskCheck_subtaskId_idx" ON "SubtaskCheck"("subtaskId");

CREATE INDEX "Expense_date_idx" ON "Expense"("date");
CREATE INDEX "Expense_paidById_idx" ON "Expense"("paidById");
CREATE INDEX "Expense_category_idx" ON "Expense"("category");
CREATE INDEX "Expense_recurringId_date_idx" ON "Expense"("recurringId", "date");

CREATE INDEX "ExpenseShare_memberId_idx" ON "ExpenseShare"("memberId");

CREATE INDEX "Block_memberId_idx" ON "Block"("memberId");
CREATE INDEX "Block_startDate_endDate_idx" ON "Block"("startDate", "endDate");

CREATE INDEX "RecurringExpense_active_idx" ON "RecurringExpense"("active");
CREATE INDEX "RecurringExpense_paidById_idx" ON "RecurringExpense"("paidById");
CREATE INDEX "RecurringExpense_addedById_idx" ON "RecurringExpense"("addedById");

CREATE INDEX "ShoppingItem_addedById_idx" ON "ShoppingItem"("addedById");
CREATE INDEX "ShoppingItem_done_createdAt_idx" ON "ShoppingItem"("done", "createdAt");

CREATE INDEX "Event_addedById_idx" ON "Event"("addedById");
CREATE INDEX "Event_date_idx" ON "Event"("date");

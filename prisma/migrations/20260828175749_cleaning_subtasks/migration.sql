-- CreateTable
CREATE TABLE "CleaningSubtask" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "CleaningSubtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubtaskCheck" (
    "id" SERIAL NOT NULL,
    "cleaningWeekId" INTEGER NOT NULL,
    "subtaskId" INTEGER NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SubtaskCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubtaskCheck_cleaningWeekId_subtaskId_key" ON "SubtaskCheck"("cleaningWeekId", "subtaskId");

-- AddForeignKey
ALTER TABLE "CleaningSubtask" ADD CONSTRAINT "CleaningSubtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CleaningTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtaskCheck" ADD CONSTRAINT "SubtaskCheck_cleaningWeekId_fkey" FOREIGN KEY ("cleaningWeekId") REFERENCES "CleaningWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtaskCheck" ADD CONSTRAINT "SubtaskCheck_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "CleaningSubtask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

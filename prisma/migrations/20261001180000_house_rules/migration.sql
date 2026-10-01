-- CreateTable
CREATE TABLE "HouseRule" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HouseRule_createdAt_idx" ON "HouseRule"("createdAt");

-- CreateIndex
CREATE INDEX "HouseRule_createdById_idx" ON "HouseRule"("createdById");

-- CreateIndex
CREATE INDEX "HouseRule_updatedById_idx" ON "HouseRule"("updatedById");

-- AddForeignKey
ALTER TABLE "HouseRule" ADD CONSTRAINT "HouseRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseRule" ADD CONSTRAINT "HouseRule_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;


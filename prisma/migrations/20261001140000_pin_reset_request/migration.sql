-- Member: "I can't get in" requests raised from the login screen, approved by
-- any logged-in flatmate in Settings. Additive and nullable, so live code that
-- does not know the column keeps working.
ALTER TABLE "Member" ADD COLUMN "pinResetRequestedAt" TIMESTAMP(3);

-- Settings reads the pending-request list on every render; keep it off a seq scan.
CREATE INDEX "Member_pinResetRequestedAt_idx" ON "Member"("pinResetRequestedAt");

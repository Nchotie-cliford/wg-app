-- Member: forced PIN change after a flatmate-initiated reset.
-- Additive and backward-compatible: existing code ignores the column, and the
-- default means nobody is suddenly forced through the new /set-pin screen.
ALTER TABLE "Member" ADD COLUMN "mustChangePin" BOOLEAN NOT NULL DEFAULT false;

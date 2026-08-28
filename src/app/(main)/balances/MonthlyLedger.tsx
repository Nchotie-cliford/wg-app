"use client";

import { useState } from "react";
import type { Member } from "@prisma/client";
import { computeBalances, euro, type MonthGroup } from "@/lib/balances";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

export function MonthlyLedger({
  months,
  members,
}: {
  months: MonthGroup[];
  members: Member[];
}) {
  const [open, setOpen] = useState(false);
  if (months.length === 0) return null;

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <h2 className="font-display text-lg font-bold">
          📜 Monthly history{" "}
          <span className="text-sm font-semibold text-ink/50">
            (last {months.length})
          </span>
        </h2>
        <span className="font-display font-bold text-ink/40">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="animate-pop-in mt-3 flex flex-col gap-4">
          {months.map((month) => {
            const { total, balances } = computeBalances(
              members,
              month.expenses,
              month.payments
            );
            return (
              <div
                key={month.label}
                className="flex flex-col gap-2 rounded-blob border-2 border-ink bg-cream p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold">
                    {month.label}
                  </span>
                  <span className="text-xs font-semibold text-ink/50">
                    Total {euro(total)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {balances.map((b) => (
                    <span
                      key={b.member.id}
                      className="flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2 py-1 text-xs font-bold"
                    >
                      <Avatar member={b.member} size="sm" /> {b.member.name}:{" "}
                      {b.net >= 0 ? "+" : ""}
                      {euro(b.net)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

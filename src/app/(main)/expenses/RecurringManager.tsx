"use client";

import { useState } from "react";
import { addRecurringExpense, deleteRecurringExpense } from "@/actions/recurring";
import { CATEGORIES, categoryEmoji } from "@/lib/categories";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

type MemberOption = { id: number; name: string; emoji: string };
type RecurringItem = {
  id: number;
  title: string;
  category: string;
  amount: number;
  addedById: number;
  paidBy: { name: string; emoji: string };
};

export function RecurringManager({
  recurring,
  members,
  meId,
}: {
  recurring: RecurringItem[];
  members: MemberOption[];
  meId: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <h2 className="font-display text-lg font-bold">
          Recurring bills 🔁{" "}
          <span className="text-sm font-semibold text-ink/50">
            ({recurring.length})
          </span>
        </h2>
        <span className="font-display font-bold text-ink/40">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="animate-pop-in mt-3 flex flex-col gap-3">
          {recurring.length === 0 && (
            <p className="text-sm font-semibold text-ink/50">
              No recurring bills yet, add rent, internet, or subscriptions
              below.
            </p>
          )}
          {recurring.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 rounded-blob border-2 border-ink bg-cream p-2 text-sm font-semibold"
            >
              <span>{categoryEmoji(r.category)}</span>
              <span className="flex-1">
                {r.title}
                <span className="text-ink/50">
                  {" "}
                  · {r.amount.toFixed(2)} € · {r.paidBy.emoji} {r.paidBy.name}
                </span>
              </span>
              {r.addedById === meId && (
                <form action={deleteRecurringExpense}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="rounded-full px-1 text-ink/30 transition-colors hover:text-coral"
                    aria-label={`Stop ${r.title}`}
                  >
                    ✕
                  </button>
                </form>
              )}
            </div>
          ))}

          <form
            action={addRecurringExpense}
            className="flex flex-col gap-2 border-t-2 border-dashed border-ink/20 pt-3"
          >
            <Input name="title" placeholder="e.g. Internet" required />
            <div className="flex gap-2">
              <Select name="category" defaultValue="Internet & Bills">
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </Select>
              <Input
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00 €"
                className="max-w-28 text-right"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Select name="paidById" defaultValue={meId} className="flex-1">
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.emoji} Paid by {m.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="sky" className="px-4 py-2 text-sm">
                Add
              </Button>
            </div>
            <p className="text-xs font-semibold text-ink/40">
              Charged automatically once each month, split between everyone
              (even if someone&apos;s away)
            </p>
          </form>
        </div>
      )}
    </Card>
  );
}

"use client";

import { useActionState, useState } from "react";
import { addExpense } from "@/actions/expenses";
import { CATEGORIES } from "@/lib/categories";
import { euro } from "@/lib/balances";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

type MemberOption = {
  id: number;
  name: string;
  emoji: string;
  colorHex: string;
  isAway: boolean;
};

function parseEuro(input: string) {
  const n = Number(input.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function AddExpenseForm({
  members,
  meId,
}: {
  members: MemberOption[];
  meId: number;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [splitWith, setSplitWith] = useState<number[]>(() =>
    members.filter((m) => !m.isAway).map((m) => m.id)
  );
  const [customMode, setCustomMode] = useState(false);
  const [shares, setShares] = useState<Record<number, string>>({});

  const reset = () => {
    setTitle("");
    setAmount("");
    setSplitWith(members.filter((m) => !m.isAway).map((m) => m.id));
    setCustomMode(false);
    setShares({});
  };

  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string; ok?: boolean }, formData: FormData) => {
      const result = await addExpense(prev, formData);
      if (result.ok) reset();
      return result;
    },
    {}
  );

  const toggleMember = (id: number) => {
    setSplitWith((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setShares((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const enableCustom = () => {
    const totalCents = Math.round(parseEuro(amount) * 100);
    const n = splitWith.length || 1;
    const base = Math.floor(totalCents / n);
    const remainder = totalCents - base * n;
    const seeded: Record<number, string> = {};
    splitWith.forEach((id, i) => {
      const cents = base + (i === 0 ? remainder : 0);
      seeded[id] = (cents / 100).toFixed(2);
    });
    setShares(seeded);
    setCustomMode(true);
  };

  const enteredTotal = Object.values(shares).reduce(
    (sum, v) => sum + parseEuro(v),
    0
  );
  const targetTotal = parseEuro(amount);
  const totalsMatch = Math.abs(enteredTotal - targetTotal) < 0.005;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="mode" value={customMode ? "custom" : "equal"} />
      <Input
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What did you buy?"
        required
      />
      <div className="flex gap-3">
        <Select name="category" defaultValue="Groceries">
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
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00 €"
          className="max-w-28 text-right"
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <Select name="paidById" defaultValue={meId} className="flex-1">
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.emoji} Paid by {m.name}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="coral" disabled={pending}>
          {pending ? "..." : "Add!"}
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink/50">Split with:</span>
          {!customMode ? (
            <button
              type="button"
              onClick={enableCustom}
              className="text-xs font-bold text-sky underline"
            >
              ✏️ Split unevenly
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCustomMode(false);
                setShares({});
              }}
              className="text-xs font-bold text-sky underline"
            >
              Split equally instead
            </button>
          )}
        </div>

        {!customMode ? (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const checked = splitWith.includes(m.id);
              return (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-bold transition-all active:scale-95 ${
                    checked
                      ? "border-ink shadow-sticker-sm"
                      : "border-ink/20 opacity-50"
                  }`}
                  style={checked ? { backgroundColor: m.colorHex } : undefined}
                >
                  <input
                    type="checkbox"
                    name="splitWith"
                    value={m.id}
                    checked={checked}
                    onChange={() => toggleMember(m.id)}
                    className="sr-only"
                  />
                  {m.emoji} {m.name}
                  {m.isAway && " 🌴"}
                </label>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-blob border-2 border-ink bg-cream p-3">
            {splitWith.map((id) => {
              const m = members.find((x) => x.id === id)!;
              return (
                <div key={id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMember(id)}
                    className="flex items-center gap-1.5 rounded-full border-2 border-ink px-2 py-1 text-xs font-bold"
                    style={{ backgroundColor: m.colorHex }}
                    aria-label={`Remove ${m.name}`}
                  >
                    {m.emoji} {m.name} ✕
                  </button>
                  <Input
                    name={`share_${id}`}
                    type="text"
                    inputMode="decimal"
                    value={shares[id] ?? ""}
                    onChange={(e) =>
                      setShares((prev) => ({ ...prev, [id]: e.target.value }))
                    }
                    className="max-w-24 text-right"
                  />
                </div>
              );
            })}
            {splitWith.length < members.length && (
              <div className="flex flex-wrap gap-1.5">
                {members
                  .filter((m) => !splitWith.includes(m.id))
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className="rounded-full border-2 border-ink/30 px-2 py-1 text-xs font-bold opacity-60"
                    >
                      + {m.emoji} {m.name}
                    </button>
                  ))}
              </div>
            )}
            <p
              className={`text-xs font-bold ${
                totalsMatch ? "text-mint-dark" : "text-coral"
              }`}
            >
              Total: {euro(enteredTotal)} / {euro(targetTotal)}
            </p>
          </div>
        )}
      </div>

      {state.error && (
        <p className="animate-wiggle text-center font-bold text-coral">
          {state.error}
        </p>
      )}
    </form>
  );
}

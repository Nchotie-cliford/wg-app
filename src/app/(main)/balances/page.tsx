import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import {
  computeBalances,
  computeSettlements,
  groupByMonth,
  euro,
} from "@/lib/balances";
import { confirmPayment, deletePayment } from "@/actions/payments";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { Input } from "@/components/ui/Input";
import { MonthlyLedger } from "./MonthlyLedger";

export default async function BalancesPage() {
  const me = await requireMember();
  const [members, expenses, payments] = await Promise.all([
    prisma.member.findMany({ orderBy: { order: "asc" } }),
    prisma.expense.findMany({ include: { shares: true } }),
    prisma.payment.findMany({
      include: { from: true, to: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const { total, balances } = computeBalances(members, expenses, payments);
  const settlements = computeSettlements(balances);
  const months = groupByMonth(expenses, payments);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">Balances ⚖️</h1>
        <p className="font-semibold text-ink/60">Total spent: {euro(total)}</p>
      </div>

      <div className="flex flex-col gap-3">
        {balances.map((b) => (
          <Card
            key={b.member.id}
            className="animate-pop-in flex items-center gap-3 p-4"
          >
            <Avatar member={b.member} />
            <span className="flex-1">
              <span className="block font-display font-bold">
                {b.member.name}
              </span>
              <span className="text-xs font-semibold text-ink/60">
                paid {euro(b.paid)}
              </span>
            </span>
            <span
              className={`rounded-full border-2 border-ink px-3 py-1 font-display font-bold ${
                b.net >= -0.005 ? "bg-mint" : "bg-coral text-white"
              }`}
            >
              {b.net >= 0 ? "+" : ""}
              {euro(b.net)}
            </span>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-display text-lg font-bold">Settle up 🤝</h2>
        {settlements.length === 0 ? (
          <EmptyState emoji="🎉" message="All square, nobody owes anything!" />
        ) : (
          <div className="flex flex-col gap-3">
            {settlements.map((s, i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-blob border-2 border-ink bg-cream p-3"
              >
                <div className="flex items-center gap-2">
                  <Avatar member={s.from} size="sm" />
                  <span className="text-sm font-bold">{s.from.name}</span>
                  <span className="flex-1 text-center font-display font-bold text-ink/60">
                    → {euro(s.amount)} →
                  </span>
                  <span className="text-sm font-bold">{s.to.name}</span>
                  <Avatar member={s.to} size="sm" />
                </div>
                {s.from.id === me.id && (
                  <form
                    action={confirmPayment}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="toId" value={s.to.id} />
                    <Input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      defaultValue={s.amount.toFixed(2)}
                      className="max-w-24 text-right"
                      aria-label="Amount paid"
                    />
                    <button
                      type="submit"
                      className="flex-1 rounded-full border-2 border-ink bg-mint px-4 py-2 font-display text-sm font-bold shadow-sticker-sm transition-all hover:-translate-y-0.5 active:scale-95 active:shadow-none"
                    >
                      I paid this! ✓
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {payments.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 font-display text-lg font-bold">
            Payment history 🧾
          </h2>
          <div className="flex flex-col gap-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <Avatar member={p.from} size="sm" />
                <span className="flex-1">
                  {p.from.name} paid {p.to.name}{" "}
                  <span className="text-ink/50">
                    · {format(p.createdAt, "d MMM")}
                  </span>
                </span>
                <span className="font-display font-bold">
                  {euro(p.amount)}
                </span>
                {p.fromId === me.id && (
                  <ConfirmDeleteButton
                    action={deletePayment}
                    hiddenName="id"
                    hiddenValue={p.id}
                    confirmMessage={`Undo this ${euro(p.amount)} payment to ${p.to.name}?`}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <MonthlyLedger months={months} members={members} />

      <Link
        href="/expenses"
        className="text-center font-display font-bold text-sky underline"
      >
        ← Back to costs
      </Link>
    </div>
  );
}

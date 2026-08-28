import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { euro } from "@/lib/balances";
import { categoryEmoji } from "@/lib/categories";
import { generateDueRecurringExpenses } from "@/lib/recurring";
import { deleteExpense } from "@/actions/expenses";
import { Card } from "@/components/ui/Card";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddExpenseForm } from "./AddExpenseForm";
import { RecurringManager } from "./RecurringManager";

export default async function ExpensesPage() {
  const me = await requireMember();
  await generateDueRecurringExpenses();

  const [members, expenses, recurring] = await Promise.all([
    prisma.member.findMany({ orderBy: { order: "asc" } }),
    prisma.expense.findMany({
      include: { paidBy: true, shares: { include: { member: true } } },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.recurringExpense.findMany({
      where: { active: true },
      include: { paidBy: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Costs 💸</h1>
          <p className="font-semibold text-ink/60">
            Split equally between whoever&apos;s included
          </p>
        </div>
        <Link
          href="/balances"
          className="rounded-full border-2 border-ink bg-sunny px-4 py-2 font-display text-sm font-bold shadow-sticker-sm transition-all hover:-translate-y-0.5 active:scale-95"
        >
          Balances ⚖️
        </Link>
      </div>

      <RecurringManager recurring={recurring} members={members} meId={me.id} />

      <Card className="p-4">
        <h2 className="mb-3 font-display text-lg font-bold">
          Add something you bought
        </h2>
        <AddExpenseForm members={members} meId={me.id} />
      </Card>

      <div className="flex flex-col gap-3">
        {expenses.length === 0 && (
          <EmptyState emoji="🤑" message="No expenses yet, lucky you!" />
        )}
        {expenses.map((e) => {
          const centsList = e.shares.map((s) => s.cents);
          // even split-cents put any rounding remainder on one person, so
          // "equal" tolerates up to (n-1) cents of spread, not exact equality
          const spread = Math.max(...centsList) - Math.min(...centsList);
          const isEqual = spread <= Math.max(1, centsList.length - 1);
          const typicalCents = Math.round(
            centsList.reduce((s, c) => s + c, 0) / centsList.length
          );
          return (
            <Card
              key={e.id}
              className="animate-pop-in flex flex-col gap-2 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{categoryEmoji(e.category)}</span>
                <span className="flex-1">
                  <span className="block font-display font-bold leading-tight">
                    {e.title}
                    {e.recurringId && <span className="ml-1 text-xs">🔁</span>}
                  </span>
                  <span className="text-xs font-semibold text-ink/60">
                    {e.paidBy.name} · {format(e.date, "d MMM")} ·{" "}
                    {isEqual ? (
                      <>
                        ~{euro(typicalCents / 100)} each · split{" "}
                        {e.shares.length} way{e.shares.length === 1 ? "" : "s"}
                      </>
                    ) : (
                      "split unevenly"
                    )}
                  </span>
                </span>
                <span className="font-display text-lg font-bold">
                  {euro(e.amount)}
                </span>
                <Avatar member={e.paidBy} size="sm" />
                {e.paidById === me.id && (
                  <ConfirmDeleteButton
                    action={deleteExpense}
                    hiddenName="id"
                    hiddenValue={e.id}
                    confirmMessage={`Delete "${e.title}" (${euro(e.amount)})?`}
                  />
                )}
              </div>
              {!isEqual && (
                <div className="flex flex-wrap gap-2 pl-11 text-xs font-semibold text-ink/60">
                  {e.shares.map((s) => (
                    <span key={s.memberId}>
                      {s.member.emoji} {s.member.name}: {euro(s.cents / 100)}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

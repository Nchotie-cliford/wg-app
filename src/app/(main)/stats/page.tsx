import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { euro } from "@/lib/balances";
import { CATEGORIES, categoryColor } from "@/lib/categories";
import { computeStreaks } from "@/lib/cleaning";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function StatsPage() {
  const [expenses, members, doneWeeks] = await Promise.all([
    prisma.expense.findMany(),
    prisma.member.findMany({ orderBy: { order: "asc" } }),
    prisma.cleaningWeek.findMany({ where: { done: true } }),
  ]);

  const categoryTotals = CATEGORIES.map((c) => ({
    ...c,
    total: expenses
      .filter((e) => e.category === c.name)
      .reduce((sum, e) => sum + e.amount, 0),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
  const maxTotal = Math.max(...categoryTotals.map((c) => c.total), 1);

  const championCounts = members
    .map((m) => ({
      member: m,
      count: doneWeeks.filter((w) => w.memberId === m.id).length,
    }))
    .sort((a, b) => b.count - a.count);
  const topCount = championCounts[0]?.count ?? 0;

  const streaks = await computeStreaks(members);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">Stats 📊</h1>
        <p className="font-semibold text-ink/60">
          Spending & cleaning, all-time
        </p>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-display text-lg font-bold">
          Spending by category
        </h2>
        {categoryTotals.length === 0 ? (
          <EmptyState emoji="🧾" message="No expenses logged yet" />
        ) : (
          <div className="flex flex-col gap-3">
            {categoryTotals.map((c) => (
              <div key={c.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>
                    {c.emoji} {c.name}
                  </span>
                  <span>{euro(c.total)}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full border-2 border-ink bg-cream">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(c.total / maxTotal) * 100}%`,
                      backgroundColor: categoryColor(c.name),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-display text-lg font-bold">
          Cleaning champion 🏆
        </h2>
        {topCount === 0 ? (
          <EmptyState emoji="🧹" message="Nobody's finished a chore yet" />
        ) : (
          <div className="flex flex-col gap-2">
            {championCounts.map(({ member, count }) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar member={member} size="sm" />
                <span className="flex-1 font-semibold">
                  {member.name}
                  {count === topCount && count > 0 && (
                    <span className="ml-1">👑</span>
                  )}
                </span>
                {(streaks.get(member.id) ?? 0) > 0 && (
                  <span className="text-sm font-bold text-coral">
                    🔥 {streaks.get(member.id)}
                  </span>
                )}
                <span className="rounded-full border-2 border-ink bg-mint/40 px-2 py-0.5 text-xs font-bold">
                  {count} done
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs font-semibold text-ink/40">
          🔥 = consecutive past weeks with every task done
        </p>
      </Card>

      <Link
        href="/"
        className="text-center font-display font-bold text-sky underline"
      >
        ← Back home
      </Link>
    </div>
  );
}

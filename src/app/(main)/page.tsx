import Link from "next/link";
import { format, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { getWeekAssignments, getPastWeeks } from "@/lib/cleaning";
import { computeBalances, euro } from "@/lib/balances";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

export default async function DashboardPage() {
  const me = await requireMember();
  const [
    { assignments },
    members,
    expenses,
    payments,
    openItems,
    nextEvent,
    [lastWeek],
  ] = await Promise.all([
    getWeekAssignments(),
    prisma.member.findMany({ orderBy: { order: "asc" } }),
    prisma.expense.findMany({ include: { shares: true } }),
    prisma.payment.findMany(),
    prisma.shoppingItem.count({ where: { done: false } }),
    prisma.event.findFirst({
      where: { date: { gte: startOfDay(new Date()) } },
      orderBy: { date: "asc" },
    }),
    getPastWeeks(1),
  ]);

  const myTasks = assignments.filter((a) => a.memberId === me.id);
  const missedLastWeek = lastWeek?.rows.filter((r) => !r.done) ?? [];
  const myBalance =
    computeBalances(members, expenses, payments).balances.find(
      (b) => b.member.id === me.id
    )?.net ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="animate-pop-in">
        <h1 className="text-3xl font-extrabold">
          Hey {me.name}! {me.emoji}
        </h1>
        <p className="font-semibold text-ink/60">
          Here&apos;s what&apos;s up in the flat
        </p>
      </div>

      <Link href="/cleaning">
        <Card className="animate-pop-in p-4 transition-all hover:-translate-y-0.5 hover:shadow-sticker-lg">
          <h2 className="font-display text-lg font-bold">
            Your cleaning duty 🧹
          </h2>
          {me.isAway ? (
            <p className="mt-1 font-semibold text-ink/60">
              You&apos;re away 🌴, chores paused for you
            </p>
          ) : myTasks.length === 0 ? (
            <p className="mt-1 font-semibold text-ink/60">
              Nothing this week, enjoy! 🎉
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-1">
              {myTasks.map((t) => (
                <p key={t.id} className="font-semibold">
                  {t.task.emoji} {t.task.name}{" "}
                  {t.done ? (
                    <span className="text-mint-dark">done ✓</span>
                  ) : (
                    <span className="text-coral">still waiting...</span>
                  )}
                </p>
              ))}
            </div>
          )}
        </Card>
      </Link>

      {missedLastWeek.length > 0 && (
        <Link href="/cleaning">
          <Card className="animate-pop-in bg-coral/15 p-4 transition-all hover:-translate-y-0.5">
            <h2 className="font-display text-lg font-bold">
              Last week&apos;s leftovers 😅
            </h2>
            <div className="mt-1 flex flex-wrap gap-2">
              {missedLastWeek.map((r) => (
                <span
                  key={r.id}
                  className="flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2 py-1 text-xs font-bold"
                >
                  {r.task.emoji} {r.task.name}: {r.member.emoji}{" "}
                  {r.member.name}
                </span>
              ))}
            </div>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link href="/balances">
          <Card
            className={`animate-pop-in h-full p-4 transition-all hover:-translate-y-0.5 ${
              myBalance >= -0.005 ? "bg-mint/30" : "bg-coral/20"
            }`}
          >
            <h2 className="font-display font-bold">Your balance ⚖️</h2>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {myBalance >= 0 ? "+" : ""}
              {euro(myBalance)}
            </p>
            <p className="text-xs font-semibold text-ink/60">
              {myBalance >= -0.005 ? "you're owed money" : "you owe the flat"}
            </p>
          </Card>
        </Link>
        <Link href="/shopping">
          <Card className="animate-pop-in h-full p-4 transition-all hover:-translate-y-0.5">
            <h2 className="font-display font-bold">Shopping 🛒</h2>
            <p className="mt-1 font-display text-2xl font-extrabold">
              {openItems}
            </p>
            <p className="text-xs font-semibold text-ink/60">
              item{openItems === 1 ? "" : "s"} on the list
            </p>
          </Card>
        </Link>
      </div>

      <Link href="/calendar">
        <Card className="animate-pop-in p-4 transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-lg font-bold">Coming up 📅</h2>
          {nextEvent ? (
            <p className="mt-1 font-semibold">
              <span className="rounded-full border-2 border-ink bg-sunny px-2 py-0.5 font-display text-sm font-bold">
                {format(nextEvent.date, "EEE d MMM")}
              </span>{" "}
              {nextEvent.title}
            </p>
          ) : (
            <p className="mt-1 font-semibold text-ink/60">
              Nothing planned yet
            </p>
          )}
        </Card>
      </Link>

      <Card className="animate-pop-in p-4">
        <h2 className="mb-2 font-display text-lg font-bold">The crew 🏠</h2>
        <div className="flex justify-around">
          {members.map((m) => (
            <div key={m.id} className="flex flex-col items-center gap-1">
              <Avatar member={m} away={m.isAway} />
              <span className="text-xs font-bold">{m.name}</span>
            </div>
          ))}
        </div>
      </Card>

      <Link
        href="/stats"
        className="text-center font-display font-bold text-sky underline"
      >
        See stats & the cleaning champion 📊
      </Link>
    </div>
  );
}

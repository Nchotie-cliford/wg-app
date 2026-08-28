import { startOfMonth, endOfMonth } from "date-fns";
import { prisma } from "./prisma";
import { splitEvenCents } from "./money";

export async function generateDueRecurringExpenses(date = new Date()) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const [recurring, members] = await Promise.all([
    prisma.recurringExpense.findMany({ where: { active: true } }),
    prisma.member.findMany({ select: { id: true } }),
  ]);
  if (recurring.length === 0) return;

  // Fast path: one query to see what's already generated this month,
  // instead of a findFirst-per-recurring-bill loop (avoids N sequential
  // round-trips on the common case where nothing is due).
  const existing = await prisma.expense.findMany({
    where: {
      recurringId: { in: recurring.map((r) => r.id) },
      date: { gte: monthStart, lte: monthEnd },
    },
    select: { recurringId: true },
  });
  const alreadyDone = new Set(existing.map((e) => e.recurringId));
  const due = recurring.filter((r) => !alreadyDone.has(r.id));
  if (due.length === 0) return;

  for (const r of due) {
    const totalCents = Math.round(r.amount * 100);
    const shares = splitEvenCents(
      totalCents,
      members.map((m) => m.id),
      r.paidById
    );
    await prisma.expense.create({
      data: {
        title: r.title,
        category: r.category,
        amount: r.amount,
        paidById: r.paidById,
        recurringId: r.id,
        shares: {
          create: Object.entries(shares).map(([memberId, cents]) => ({
            memberId: Number(memberId),
            cents,
          })),
        },
      },
    });
  }
}

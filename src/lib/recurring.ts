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
  for (const r of recurring) {
    const existing = await prisma.expense.findFirst({
      where: {
        recurringId: r.id,
        date: { gte: monthStart, lte: monthEnd },
      },
    });
    if (existing) continue;
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

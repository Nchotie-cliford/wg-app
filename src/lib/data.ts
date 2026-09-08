import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { SAFE_MEMBER_SELECT } from "./members";
import type { SafeMember } from "./members";

/* -------------------------------------------------------------------------- */
/*  Rarely-changing reference data — cached across requests, tag-invalidated.  */
/* -------------------------------------------------------------------------- */

export const MEMBERS_TAG = "members";
export const CLEANING_TASKS_TAG = "cleaning-tasks";

/**
 * All members (safe projection), ordered. Invalidate with
 * `revalidateTag(MEMBERS_TAG)` whenever a member row changes.
 */
export const getMembers = unstable_cache(
  async (): Promise<SafeMember[]> =>
    prisma.member.findMany({
      orderBy: { order: "asc" },
      select: SAFE_MEMBER_SELECT,
    }),
  ["members-safe"],
  // Tag-invalidated on every member mutation; `revalidate` is a self-healing
  // safety net in case a tag invalidation is ever missed.
  { tags: [MEMBERS_TAG], revalidate: 60 }
);

export type CleaningTaskWithSubtasks = {
  id: number;
  name: string;
  emoji: string;
  order: number;
  subtasks: { id: number; label: string; order: number }[];
};

/**
 * Cleaning tasks + their subtasks (effectively static; seed-defined).
 * Invalidate with `revalidateTag(CLEANING_TASKS_TAG)`.
 */
export const getCleaningTasks = unstable_cache(
  async (): Promise<CleaningTaskWithSubtasks[]> =>
    prisma.cleaningTask.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        emoji: true,
        order: true,
        subtasks: {
          orderBy: { order: "asc" },
          select: { id: true, label: true, order: true },
        },
      },
    }),
  ["cleaning-tasks"],
  { tags: [CLEANING_TASKS_TAG], revalidate: 300 }
);

/* -------------------------------------------------------------------------- */
/*  Balances — computed in SQL (GROUP BY) instead of loading every row.        */
/* -------------------------------------------------------------------------- */

export type MemberBalance = {
  member: SafeMember;
  paid: number;
  net: number;
};

/**
 * Total spent + net position per member, using four aggregate queries instead
 * of pulling the entire expense/share/payment history into memory.
 *
 * net = paid − owed + paymentsSent − paymentsReceived
 */
export const getBalances = cache(
  async (
    members: SafeMember[]
  ): Promise<{ total: number; balances: MemberBalance[] }> => {
    const [paidBy, owed, sent, received, totalAgg] = await Promise.all([
      prisma.expense.groupBy({ by: ["paidById"], _sum: { amount: true } }),
      prisma.expenseShare.groupBy({ by: ["memberId"], _sum: { cents: true } }),
      prisma.payment.groupBy({ by: ["fromId"], _sum: { amount: true } }),
      prisma.payment.groupBy({ by: ["toId"], _sum: { amount: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);

    const paidMap = new Map(paidBy.map((r) => [r.paidById, r._sum.amount ?? 0]));
    const owedMap = new Map(owed.map((r) => [r.memberId, r._sum.cents ?? 0]));
    const sentMap = new Map(sent.map((r) => [r.fromId, r._sum.amount ?? 0]));
    const recvMap = new Map(received.map((r) => [r.toId, r._sum.amount ?? 0]));

    const balances = members.map((member) => {
      const paid = paidMap.get(member.id) ?? 0;
      const owedEuro = (owedMap.get(member.id) ?? 0) / 100;
      const net =
        paid -
        owedEuro +
        (sentMap.get(member.id) ?? 0) -
        (recvMap.get(member.id) ?? 0);
      return { member, paid, net };
    });

    return { total: totalAgg._sum.amount ?? 0, balances };
  }
);

/** Spend per category (SQL GROUP BY). */
export const getCategoryTotals = cache(async (): Promise<Map<string, number>> => {
  const rows = await prisma.expense.groupBy({
    by: ["category"],
    _sum: { amount: true },
  });
  return new Map(rows.map((r) => [r.category, r._sum.amount ?? 0]));
});

/** Count of fully-done cleaning weeks per member (SQL GROUP BY). */
export const getDoneWeekCounts = cache(async (): Promise<Map<number, number>> => {
  const rows = await prisma.cleaningWeek.groupBy({
    by: ["memberId"],
    where: { done: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.memberId, r._count._all]));
});
